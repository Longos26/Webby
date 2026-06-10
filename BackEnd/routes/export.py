# backend/routes/export.py - COMPLETE PRODUCTION VERSION

import codecs

from fastapi import APIRouter, HTTPException, BackgroundTasks, Response, Query, Depends, Request
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field, validator
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Generator, Union
import pandas as pd
import numpy as np
import json
import io
import zipfile
import re
import csv
import asyncio
import aiofiles
import os
import hashlib
import gzip
from pathlib import Path
from routes.auth import get_current_user
from mongodb.database import get_database
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
from cachetools import TTLCache
import orjson

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/export", tags=["export"])

# ============================================================
# CONFIGURATION
# ============================================================

class ExportConfig:
    MAX_ROWS_PER_FILE = 1_000_000
    MAX_FILE_SIZE_MB = 500
    CACHE_TTL_SECONDS = 3600
    EXPIRATION_DAYS = 7
    CHUNK_SIZE = 8192
    TEMP_DIR = Path("/tmp/exports")
    SUPPORTED_FORMATS = ["csv", "xlsx", "json", "parquet", "feather", "html", "markdown", "txt"]
    
    @classmethod
    def ensure_temp_dir(cls):
        cls.TEMP_DIR.mkdir(parents=True, exist_ok=True)

# Initialize cache
export_cache = TTLCache(maxsize=100, ttl=ExportConfig.CACHE_TTL_SECONDS)
export_jobs = {}

# ============================================================
# ENHANCED PYDANTIC MODELS
# ============================================================

class ExportRequest(BaseModel):
    format: str = Field(..., description="csv, xlsx, json, parquet, feather, html, markdown, txt")
    job_id: str
    parse_result_id: Optional[str] = None
    date_range: str = Field("all", description="all, last_24h, last_7d, last_30d, custom")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    filter_status: str = "all"
    encoding: str = "utf-8"
    dataset_name: str = "dataset"
    options: Dict[str, bool] = Field(default_factory=lambda: {
        "timestamps": False,
        "flatten": True,
        "headers": True,
        "compress": False,
        "include_metadata": False
    })
    selected_columns: Optional[List[str]] = None
    sort_by: Optional[str] = None
    sort_order: str = "desc"
    limit: Optional[int] = None
    offset: int = 0
    
    @validator('format')
    def validate_format(cls, v):
        if v not in ExportConfig.SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported format. Choose from: {ExportConfig.SUPPORTED_FORMATS}")
        return v
    
    @validator('encoding')
    def validate_encoding(cls, v):
        try:
            codecs.lookup(v)
        except LookupError:
            raise ValueError(f"Unsupported encoding: {v}")
        return v

class AsyncExportRequest(BaseModel):
    format: str
    job_id: str
    dataset_name: str = "dataset"
    options: Dict[str, bool] = {}
    selected_columns: Optional[List[str]] = None
    email_notification: bool = False
    email: Optional[str] = None

class ExportMetadata(BaseModel):
    export_id: str
    job_id: str
    format: str
    rows: int
    columns: int
    size_bytes: int
    created_at: datetime
    expires_at: datetime
    download_count: int = 0
    compression: bool = False
    checksum: str

# ============================================================
# ADVANCED DATA EXTRACTION ENGINE
# ============================================================

class DataExtractor:
    """Advanced data extraction with deep nesting support"""
    
    @staticmethod
    def deep_extract(content: Any, max_depth: int = 5) -> Any:
        """Extract content recursively with depth control"""
        if max_depth <= 0:
            return str(content)[:1000]
        
        # Handle strings that might be JSON
        if isinstance(content, str):
            try:
                if content.strip().startswith(('{', '[')):
                    parsed = json.loads(content)
                    return DataExtractor.deep_extract(parsed, max_depth - 1)
                return content
            except json.JSONDecodeError:
                return content
        
        # Handle dictionaries
        if isinstance(content, dict):
            # Check for common wrapper patterns
            for wrapper_key in ['content', 'data', 'result', 'results', 'items', 'records', 'pokemon']:
                if wrapper_key in content:
                    extracted = content[wrapper_key]
                    if extracted is not None:
                        return DataExtractor.deep_extract(extracted, max_depth - 1)
            
            # Remove metadata fields
            cleaned = {
                k: DataExtractor.deep_extract(v, max_depth - 1)
                for k, v in content.items()
                if not k.startswith('_') and k not in ['metadata', 'meta', 'debug', 'timestamp']
            }
            return cleaned if cleaned else str(content)
        
        # Handle lists
        if isinstance(content, list):
            if not content:
                return []
            
            # Flatten single-item lists
            if len(content) == 1 and isinstance(content[0], (dict, list)):
                return DataExtractor.deep_extract(content[0], max_depth - 1)
            
            # Extract all items
            return [DataExtractor.deep_extract(item, max_depth - 1) for item in content[:1000]]
        
        # Handle primitive types
        return content
    
    @staticmethod
    def flatten_nested(data: Any, parent_key: str = '', sep: str = '_') -> Dict[str, Any]:
        """Flatten deeply nested structures"""
        items = []
        
        if isinstance(data, dict):
            for k, v in data.items():
                new_key = f"{parent_key}{sep}{k}" if parent_key else k
                if isinstance(v, dict):
                    items.extend(DataExtractor.flatten_nested(v, new_key, sep=sep).items())
                elif isinstance(v, list):
                    if v and all(isinstance(item, (str, int, float, bool)) for item in v):
                        items.append((new_key, ', '.join(str(item) for item in v)))
                    else:
                        items.append((new_key, json.dumps(v, default=str)[:500]))
                else:
                    items.append((new_key, v))
        elif isinstance(data, list):
            items.append((parent_key or 'items', json.dumps(data, default=str)[:1000]))
        else:
            items.append((parent_key or 'value', data))
        
        return dict(items)

class DataNormalizer:
    """Intelligent data normalization for export"""
    
    @staticmethod
    def normalize_dataframe(df: pd.DataFrame, options: Dict[str, bool]) -> pd.DataFrame:
        """Comprehensive DataFrame normalization"""
        if df.empty:
            return df
        
        # Replace NaN/None/Infinity
        df = df.replace([np.inf, -np.inf], np.nan)
        df = df.where(pd.notnull(df), "")
        
        # Convert datetime objects
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
            elif pd.api.types.is_timedelta64_dtype(df[col]):
                df[col] = df[col].dt.total_seconds()
            elif df[col].dtype == 'object':
                # Convert complex objects to strings
                df[col] = df[col].apply(
                    lambda x: json.dumps(x, default=str) if isinstance(x, (dict, list)) else 
                    str(x) if not isinstance(x, str) else x
                )
        
        # Remove duplicate columns if requested
        if options.get("deduplicate_columns", False):
            df = df.loc[:, ~df.columns.duplicated()]
        
        # Truncate long strings if requested
        max_length = options.get("max_string_length", 0)
        if max_length > 0:
            for col in df.select_dtypes(include=['object']).columns:
                df[col] = df[col].apply(lambda x: x[:max_length] if isinstance(x, str) else x)
        
        return df

# ============================================================
# CORE EXPORT ENGINE
# ============================================================

class ExportEngine:
    """Main export engine with streaming and chunking support"""
    
    def __init__(self, db):
        self.db = db
        self.extractor = DataExtractor()
        self.normalizer = DataNormalizer()
    
    async def fetch_data(
        self, 
        job_id: str, 
        parse_result_id: Optional[str] = None,
        date_range: str = "all",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Fetch and extract data from database"""
        
        if not ObjectId.is_valid(job_id):
            raise ValueError("Invalid job ID")
        
        query = {"job_id": ObjectId(job_id)}
        
        if parse_result_id and ObjectId.is_valid(parse_result_id):
            query["_id"] = ObjectId(parse_result_id)
        
        # Date range filtering
        if date_range != "all":
            now = datetime.utcnow()
            range_map = {
                "last_24h": timedelta(hours=24),
                "last_7d": timedelta(days=7),
                "last_30d": timedelta(days=30)
            }
            if date_range in range_map:
                start_date = now - range_map[date_range]
                query["created_at"] = {"$gte": start_date}
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["$gte"] = start_date
            if end_date:
                date_filter["$lte"] = end_date
            if date_filter:
                query["created_at"] = date_filter
        
        # Fetch with pagination
        cursor = self.db.parsed_results.find(query).sort("created_at", -1)
        
        if offset:
            cursor = cursor.skip(offset)
        if limit:
            cursor = cursor.limit(limit)
        
        all_data = []
        
        async for result in cursor:
            content = result.get("parsed_content", "")
            
            # Deep extract clean content
            clean_content = self.extractor.deep_extract(content)
            
            # Convert to tabular format
            tabular_data = self._to_tabular(clean_content)
            
            for row in tabular_data:
                all_data.append(row)
        
        return all_data
    
    def _to_tabular(self, data: Any) -> List[Dict[str, Any]]:
        """Convert any data structure to tabular format"""
        result = []
        
        if data is None or data == "":
            return [{"value": ""}]
        
        if isinstance(data, str):
            # Handle comma-separated lists
            if ',' in data and not data.startswith('{'):
                items = [item.strip() for item in data.split(',')]
                return [{f"item_{i}": item} for i, item in enumerate(items) if item]
            return [{"content": data}]
        
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    result.append(self.extractor.flatten_nested(item))
                else:
                    result.append({"value": str(item)})
            return result
        
        if isinstance(data, dict):
            return [self.extractor.flatten_nested(data)]
        
        return [{"value": str(data)}]
    
    async def generate_export(
        self,
        request: ExportRequest,
        background: bool = False
    ) -> Union[Response, Dict[str, Any]]:
        """Generate export with specified format"""
        
        ExportConfig.ensure_temp_dir()
        
        # Fetch data
        data = await self.fetch_data(
            request.job_id,
            request.parse_result_id,
            request.date_range,
            request.start_date,
            request.end_date,
            request.limit,
            request.offset
        )
        
        if not data:
            raise HTTPException(404, "No data found for export")
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Apply column selection
        if request.selected_columns:
            available_cols = [col for col in request.selected_columns if col in df.columns]
            if available_cols:
                df = df[available_cols]
        
        # Apply flattening
        if request.options.get("flatten", True):
            flattened = []
            for _, row in df.iterrows():
                if isinstance(row.to_dict(), dict):
                    flattened.append(self.extractor.flatten_nested(row.to_dict()))
            if flattened:
                df = pd.DataFrame(flattened)
        
        # Apply sorting
        if request.sort_by and request.sort_by in df.columns:
            ascending = request.sort_order == "asc"
            df = df.sort_values(by=request.sort_by, ascending=ascending)
        
        # Normalize
        df = self.normalizer.normalize_dataframe(df, request.options)
        
        # Generate file
        generator = self._get_format_generator(request.format)
        file_content, filename, content_type = await generator(df, request)
        
        # Store in history
        export_doc = {
            "job_id": ObjectId(request.job_id),
            "format": request.format,
            "rows": len(df),
            "columns": len(df.columns),
            "size": len(file_content),
            "created_at": datetime.utcnow(),
            "filename": filename,
            "dataset_name": request.dataset_name,
            "options": request.options.dict() if hasattr(request.options, 'dict') else request.options,
            "encoding": request.encoding,
            "date_range": request.date_range,
            "compressed": request.options.get("compress", False)
        }
        
        await self.db.export_history.insert_one(export_doc)
        
        return Response(
            content=file_content,
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Rows-Exported": str(len(df)),
                "X-Columns-Exported": str(len(df.columns)),
                "X-File-Size": str(len(file_content))
            }
        )
    
    def _get_format_generator(self, format_type: str):
        """Get generator function for specific format"""
        generators = {
            "csv": self._generate_csv,
            "xlsx": self._generate_excel,
            "json": self._generate_json,
            "parquet": self._generate_parquet,
            "feather": self._generate_feather,
            "html": self._generate_html,
            "markdown": self._generate_markdown,
            "txt": self._generate_txt
        }
        return generators.get(format_type, self._generate_csv)
    
    async def _generate_csv(self, df: pd.DataFrame, request: ExportRequest):
        """Generate CSV with advanced options"""
        output = io.StringIO()
        
        # Use dialect for better CSV handling
        dialect = 'excel' if request.options.get("excel_compatible", False) else 'unix'
        
        df.to_csv(
            output,
            index=False,
            encoding=request.encoding,
            header=request.options.get("headers", True),
            sep=request.options.get("delimiter", ','),
            quotechar=request.options.get("quotechar", '"'),
            doublequote=True,
            escapechar=request.options.get("escapechar", '\\'),
            line_terminator=request.options.get("line_terminator", '\n')
        )
        
        content = output.getvalue().encode(request.encoding, errors='replace')
        filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        if request.options.get("compress"):
            content = gzip.compress(content)
            filename += ".gz"
            content_type = "application/gzip"
        else:
            content_type = "text/csv"
        
        return content, filename, content_type
    
    async def _generate_excel(self, df: pd.DataFrame, request: ExportRequest):
        """Generate Excel with multiple sheets for large datasets"""
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl', mode='w') as writer:
            sheet_name = re.sub(r'[\[\]\*\?/:]', '_', request.dataset_name)[:31]
            
            # Handle large datasets by splitting into multiple sheets
            if len(df) > ExportConfig.MAX_ROWS_PER_FILE:
                for i in range(0, len(df), ExportConfig.MAX_ROWS_PER_FILE):
                    chunk_num = i // ExportConfig.MAX_ROWS_PER_FILE + 1
                    chunk_sheet = f"{sheet_name}_part{chunk_num}"[:31]
                    df.iloc[i:i + ExportConfig.MAX_ROWS_PER_FILE].to_excel(
                        writer, 
                        sheet_name=chunk_sheet, 
                        index=False,
                        freeze_panes=(1, 0)
                    )
            else:
                df.to_excel(
                    writer, 
                    sheet_name=sheet_name, 
                    index=False,
                    freeze_panes=(1, 0)
                )
        
        content = output.getvalue()
        filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        
        return content, filename, content_type
    
    async def _generate_json(self, df: pd.DataFrame, request: ExportRequest):
        """Generate JSON with various output formats"""
        records = df.to_dict(orient='records')
        
        # Simplify for single-column datasets
        if len(df.columns) == 1:
            col_name = df.columns[0]
            if col_name.endswith('_name') or col_name == 'value' or col_name == 'content':
                simplified = [row[col_name] for row in records if row[col_name]]
                records = simplified
        
        # Use orjson for better performance
        if request.options.get("compress"):
            # JSON Lines format
            lines = '\n'.join(orjson.dumps(record).decode('utf-8') for record in records)
            content = lines.encode(request.encoding)
            filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
        else:
            indent = 2 if request.options.get("pretty", True) else None
            content = orjson.dumps(
                records,
                option=orjson.OPT_INDENT_2 if indent else orjson.OPT_SERIALIZE_NUMPY
            )
            filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        if request.options.get("compress"):
            content = gzip.compress(content)
            filename += ".gz"
            content_type = "application/gzip"
        else:
            content_type = "application/json"
        
        return content, filename, content_type
    
    async def _generate_parquet(self, df: pd.DataFrame, request: ExportRequest):
        """Generate Parquet for efficient storage"""
        output = io.BytesIO()
        df.to_parquet(output, index=False, compression='snappy')
        content = output.getvalue()
        filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.parquet"
        content_type = "application/parquet"
        return content, filename, content_type
    
    async def _generate_feather(self, df: pd.DataFrame, request: ExportRequest):
        """Generate Feather for fast I/O"""
        output = io.BytesIO()
        df.to_feather(output)
        content = output.getvalue()
        filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.feather"
        content_type = "application/feather"
        return content, filename, content_type
    
    async def _generate_html(self, df: pd.DataFrame, request: ExportRequest):
        """Generate HTML table with styling"""
        html = df.to_html(
            classes='export-table',
            border=0,
            max_rows=request.options.get("max_rows", 10000),
            float_format='%.2f' if request.options.get("format_floats", False) else None
        )
        
        styled_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="{request.encoding}">
            <title>Export: {request.dataset_name}</title>
            <style>
                .export-table {{
                    border-collapse: collapse;
                    width: 100%;
                    font-family: Arial, sans-serif;
                }}
                .export-table th {{
                    background-color: #4CAF50;
                    color: white;
                    padding: 8px;
                    text-align: left;
                }}
                .export-table td {{
                    border: 1px solid #ddd;
                    padding: 8px;
                }}
                .export-table tr:nth-child(even) {{
                    background-color: #f2f2f2;
                }}
                .export-table tr:hover {{
                    background-color: #ddd;
                }}
            </style>
        </head>
        <body>
            <h1>Export: {request.dataset_name}</h1>
            <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            <p>Rows: {len(df)} | Columns: {len(df.columns)}</p>
            {html}
        </body>
        </html>
        """
        
        content = styled_html.encode(request.encoding)
        filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        content_type = "text/html"
        
        if request.options.get("compress"):
            content = gzip.compress(content)
            filename += ".gz"
            content_type = "application/gzip"
        
        return content, filename, content_type
    
    async def _generate_markdown(self, df: pd.DataFrame, request: ExportRequest):
        """Generate Markdown table"""
        md_lines = []
        
        # Header
        headers = '| ' + ' | '.join(str(col) for col in df.columns) + ' |'
        separator = '|' + '|'.join(['---' for _ in df.columns]) + '|'
        md_lines.extend([headers, separator])
        
        # Rows
        for _, row in df.iterrows():
            row_line = '| ' + ' | '.join(str(val)[:100] for val in row.values) + ' |'
            md_lines.append(row_line)
        
        content = '\n'.join(md_lines).encode(request.encoding)
        filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        content_type = "text/markdown"
        
        return content, filename, content_type
    
    async def _generate_txt(self, df: pd.DataFrame, request: ExportRequest):
        """Generate plain text format"""
        txt_lines = []
        
        # Add metadata header
        txt_lines.append(f"Dataset: {request.dataset_name}")
        txt_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        txt_lines.append(f"Rows: {len(df)} | Columns: {len(df.columns)}")
        txt_lines.append("=" * 80)
        txt_lines.append("")
        
        # For single column datasets, list values
        if len(df.columns) == 1:
            col_name = df.columns[0]
            for idx, value in enumerate(df[col_name], 1):
                if value:
                    txt_lines.append(f"{idx}. {value}")
        else:
            # Tabular format
            for idx, row in df.iterrows():
                txt_lines.append(f"Record {idx + 1}:")
                for col, val in row.items():
                    txt_lines.append(f"  {col}: {val}")
                txt_lines.append("")
        
        content = '\n'.join(txt_lines).encode(request.encoding)
        filename = f"{request.dataset_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        content_type = "text/plain"
        
        return content, filename, content_type

# ============================================================
# API ENDPOINTS
# ============================================================

@router.post("/generate")
async def generate_export(
    request: ExportRequest,
    background_tasks: BackgroundTasks
):
    """Generate export with comprehensive options"""
    engine = ExportEngine(await get_database())
    
    try:
        return await engine.generate_export(request)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error(f"Export generation failed: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Export failed: {str(e)}")

@router.post("/generate-async")
async def generate_async_export(
    request: AsyncExportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Generate export asynchronously for large datasets"""
    global export_jobs
    
    export_id = f"export_{int(datetime.now().timestamp())}_{hashlib.md5(f"{request.job_id}{datetime.now().isoformat()}".encode()).hexdigest()[:8]}"
    
    export_config = request.dict()
    user_id = str(current_user.get("_id") or current_user.get("id"))
    
    background_tasks.add_task(
        process_async_export,
        export_id,
        request.job_id,
        export_config,
        user_id
    )
    
    return {
        "export_id": export_id,
        "status": "processing",
        "message": "Export started. Use /export/status/{export_id} to check progress",
        "estimated_time": "depends on data size"
    }

@router.get("/status/{export_id}")
async def get_export_status(export_id: str):
    """Get detailed status of async export"""
    global export_jobs
    
    if export_id in export_jobs:
        job = export_jobs[export_id]
        return {
            "export_id": export_id,
            "status": job.get("status"),
            "progress": job.get("progress", 0),
            "total": job.get("total", 0),
            "processed": job.get("processed", 0),
            "message": job.get("message", ""),
            "error": job.get("error"),
            "download_url": f"/export/download-async/{export_id}" if job.get("status") == "completed" else None,
            "rows": job.get("rows"),
            "columns": job.get("columns")
        }
    
    # Check database for completed exports
    db = await get_database()
    stored = await db.async_exports.find_one({"export_id": export_id})
    
    if stored:
        return {
            "export_id": export_id,
            "status": "completed",
            "download_url": f"/export/download-async/{export_id}",
            "created_at": stored["created_at"],
            "expires_at": stored["expires_at"],
            "rows": stored.get("rows", 0),
            "columns": stored.get("columns", 0),
            "download_count": stored.get("download_count", 0)
        }
    
    raise HTTPException(404, "Export not found")

@router.get("/download-async/{export_id}")
async def download_async_export(
    export_id: str,
    response: Response
):
    """Download completed async export"""
    global export_jobs
    
    # Check memory cache
    if export_id in export_jobs and export_jobs[export_id].get("status") == "completed":
        job = export_jobs[export_id]
        
        # Update download count
        response.headers["X-Download-Count"] = str(job.get("download_count", 0) + 1)
        
        return Response(
            content=job["file_content"],
            media_type=job.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f"attachment; filename={job['filename']}",
                "X-File-Size": str(len(job["file_content"])),
                "X-Rows": str(job.get("rows", 0))
            }
        )
    
    # Check database
    db = await get_database()
    stored = await db.async_exports.find_one({"export_id": export_id})
    
    if stored:
        # Increment download count
        await db.async_exports.update_one(
            {"export_id": export_id},
            {"$inc": {"download_count": 1}}
        )
        
        # Reconstruct from stored data (if file is stored as GridFS or similar)
        # For now, return error as file needs to be regenerated
        return Response(
            content=stored.get("content", b""),
            media_type=stored.get("content_type", "application/octet-stream"),
            headers={"Content-Disposition": f"attachment; filename={stored.get('filename')}"}
        )
    
    raise HTTPException(404, "Export not found or expired")

@router.get("/preview/{job_id}")
async def preview_export(
    job_id: str,
    limit: int = Query(20, ge=1, le=500)
):
    """Preview export data structure with statistics"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(400, "Invalid job ID")
    
    db = await get_database()
    engine = ExportEngine(db)
    
    try:
        data = await engine.fetch_data(job_id, limit=limit)
        
        if not data:
            return {
                "columns": [],
                "data": [],
                "rows": 0,
                "statistics": {},
                "message": "No data available for preview"
            }
        
        df = pd.DataFrame(data)
        
        # Generate statistics
        statistics = {
            "total_rows": len(data),
            "total_previewed": min(limit, len(data)),
            "columns_count": len(df.columns),
            "columns": list(df.columns),
            "data_types": df.dtypes.astype(str).to_dict(),
            "null_counts": df.isnull().sum().to_dict(),
            "unique_counts": {col: df[col].nunique() for col in df.columns}
        }
        
        return {
            "columns": df.columns.tolist(),
            "data": df.head(limit).to_dict(orient='records'),
            "rows": len(data),
            "statistics": statistics,
            "preview_limit": limit
        }
        
    except Exception as e:
        logger.error(f"Preview failed: {str(e)}")
        raise HTTPException(500, f"Preview failed: {str(e)}")

@router.get("/history")
async def get_export_history(
    limit: int = Query(50, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    job_id: Optional[str] = None,
    format_filter: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get export history with advanced filtering"""
    db = await get_database()
    
    query = {}
    
    if job_id and ObjectId.is_valid(job_id):
        query["job_id"] = ObjectId(job_id)
    
    if format_filter:
        query["format"] = format_filter
    
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        if date_filter:
            query["created_at"] = date_filter
    
    total = await db.export_history.count_documents(query)
    cursor = db.export_history.find(query).sort("created_at", -1).skip(offset).limit(limit)
    
    history = []
    async for export in cursor:
        size_bytes = export.get("size", 0)
        
        # Format size
        if size_bytes >= 1024 * 1024 * 1024:
            size_str = f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
        elif size_bytes >= 1024 * 1024:
            size_str = f"{size_bytes / (1024 * 1024):.2f} MB"
        elif size_bytes >= 1024:
            size_str = f"{size_bytes / 1024:.2f} KB"
        else:
            size_str = f"{size_bytes} B"
        
        history.append({
            "id": str(export["_id"]),
            "name": export.get("dataset_name", f"Export_{export['created_at'].strftime('%Y%m%d_%H%M%S')}"),
            "format": export.get("format", "unknown"),
            "size": size_str,
            "size_bytes": size_bytes,
            "rows": export.get("rows", 0),
            "columns": export.get("columns", 0),
            "date": export["created_at"],
            "filename": export.get("filename", ""),
            "compressed": export.get("compressed", False),
            "job_id": str(export.get("job_id", ""))
        })
    
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "history": history
    }

@router.get("/jobs")
async def get_export_jobs(
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500)
):
    """Get available jobs for export with search"""
    db = await get_database()
    
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    cursor = db.jobs.find(query).sort("created_at", -1).limit(limit)
    
    jobs = []
    async for job in cursor:
        record_count = await db.parsed_results.count_documents({"job_id": job["_id"]})
        jobs.append({
            "id": str(job["_id"]),
            "name": job.get("name", "Untitled Job"),
            "records": record_count,
            "created_at": job.get("created_at", datetime.utcnow()),
            "description": job.get("description", "")
        })
    
    return jobs

@router.get("/parse-results/{job_id}")
async def get_parse_results(
    job_id: str,
    limit: int = Query(50, ge=1, le=200)
):
    """Get parse results with preview"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(400, "Invalid job ID")
    
    db = await get_database()
    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)}).sort("created_at", -1).limit(limit)
    
    results = []
    async for result in cursor:
        content = result.get("parsed_content", "")
        
        # Extract clean content for preview
        extractor = DataExtractor()
        clean_content = extractor.deep_extract(content)
        
        # Generate preview
        if isinstance(clean_content, str):
            preview = clean_content[:200]
        elif isinstance(clean_content, list):
            preview = f"List of {len(clean_content)} items"
            if clean_content and len(clean_content) <= 5:
                preview += f": {clean_content}"
        elif isinstance(clean_content, dict):
            preview = f"Object with {len(clean_content)} keys: {list(clean_content.keys())[:5]}"
        else:
            preview = str(clean_content)[:200]
        
        results.append({
            "id": str(result["_id"]),
            "name": f"Parse Result {len(results) + 1}",
            "created_at": result.get("created_at", datetime.utcnow()),
            "preview": preview,
            "content_type": type(clean_content).__name__,
            "size": len(str(clean_content))
        })
    
    return results

@router.delete("/history/{export_id}")
async def delete_export_history(export_id: str):
    """Delete export history entry"""
    if not ObjectId.is_valid(export_id):
        raise HTTPException(400, "Invalid export ID")
    
    db = await get_database()
    result = await db.export_history.delete_one({"_id": ObjectId(export_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(404, "Export not found")
    
    return {"message": "Export history deleted successfully"}

@router.delete("/cleanup")
async def cleanup_old_exports(days: int = Query(30, ge=1, le=365)):
    """Clean up old exports"""
    db = await get_database()
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.export_history.delete_many({"created_at": {"$lt": cutoff_date}})
    async_result = await db.async_exports.delete_many({"created_at": {"$lt": cutoff_date}})
    
    return {
        "message": f"Cleaned up exports older than {days} days",
        "deleted_history": result.deleted_count,
        "deleted_async": async_result.deleted_count
    }

@router.get("/formats")
async def get_supported_formats():
    """Get list of supported export formats with details"""
    return {
        "formats": [
            {"name": "CSV", "value": "csv", "description": "Comma-separated values, compatible with Excel and databases"},
            {"name": "Excel", "value": "xlsx", "description": "Microsoft Excel format with support for multiple sheets"},
            {"name": "JSON", "value": "json", "description": "JavaScript Object Notation, ideal for APIs"},
            {"name": "JSON Lines", "value": "jsonl", "description": "Line-delimited JSON for streaming"},
            {"name": "Parquet", "value": "parquet", "description": "Columnar storage format, efficient for big data"},
            {"name": "Feather", "value": "feather", "description": "Fast binary format for data frames"},
            {"name": "HTML", "value": "html", "description": "Web page with styled table"},
            {"name": "Markdown", "value": "markdown", "description": "GitHub-flavored markdown table"},
            {"name": "Plain Text", "value": "txt", "description": "Simple text format for lists"}
        ],
        "compression": ["none", "gzip"],
        "encodings": ["utf-8", "utf-8-sig", "latin1", "cp1252", "ascii"],
        "max_file_size_mb": ExportConfig.MAX_FILE_SIZE_MB
    }

@router.get("/stats")
async def get_export_stats():
    """Get export statistics"""
    db = await get_database()
    
    total_exports = await db.export_history.count_documents({})
    
    # Get format distribution
    pipeline = [
        {"$group": {"_id": "$format", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    format_stats = await db.export_history.aggregate(pipeline).to_list(None)
    
    # Get total size and rows
    size_pipeline = [
        {"$group": {
            "_id": None,
            "total_size": {"$sum": "$size"},
            "total_rows": {"$sum": "$rows"}
        }}
    ]
    size_stats = await db.export_history.aggregate(size_pipeline).to_list(None)
    
    # Get daily stats for last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    daily_pipeline = [
        {"$match": {"created_at": {"$gte": thirty_days_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]
    daily_stats = await db.export_history.aggregate(daily_pipeline).to_list(None)
    
    return {
        "total_exports": total_exports,
        "format_distribution": format_stats,
        "total_size_bytes": size_stats[0]["total_size"] if size_stats else 0,
        "total_rows_exported": size_stats[0]["total_rows"] if size_stats else 0,
        "daily_exports_last_30_days": daily_stats
    }

# ============================================================
# BACKGROUND TASK PROCESSOR
# ============================================================

async def process_async_export(export_id: str, job_id: str, export_config: Dict, user_id: str):
    """Process async export in background"""
    global export_jobs
    
    try:
        db = await get_database()
        engine = ExportEngine(db)
        
        export_jobs[export_id] = {
            "status": "processing",
            "progress": 0,
            "total": 0,
            "processed": 0,
            "message": "Starting export..."
        }
        
        # Get total count
        total = await db.parsed_results.count_documents({"job_id": ObjectId(job_id)})
        export_jobs[export_id]["total"] = total
        
        # Create export request
        request = ExportRequest(
            format=export_config["format"],
            job_id=job_id,
            dataset_name=export_config["dataset_name"],
            options=export_config.get("options", {}),
            selected_columns=export_config.get("selected_columns")
        )
        
        export_jobs[export_id]["message"] = f"Processing {total} records..."
        
        # Process in chunks for progress tracking
        chunk_size = 100
        all_data = []
        
        for offset in range(0, total, chunk_size):
            chunk_data = await engine.fetch_data(
                job_id,
                limit=chunk_size,
                offset=offset
            )
            all_data.extend(chunk_data)
            
            export_jobs[export_id]["processed"] = min(offset + chunk_size, total)
            export_jobs[export_id]["progress"] = int((export_jobs[export_id]["processed"] / total) * 50)
            export_jobs[export_id]["message"] = f"Extracted {export_jobs[export_id]['processed']}/{total} records..."
        
        if not all_data:
            export_jobs[export_id] = {
                "status": "failed",
                "error": "No data found for export",
                "message": "Export failed: No data available"
            }
            return
        
        export_jobs[export_id]["message"] = "Creating DataFrame..."
        export_jobs[export_id]["progress"] = 60
        
        # Create DataFrame
        df = pd.DataFrame(all_data)
        
        # Apply column selection
        if export_config.get("selected_columns"):
            available_cols = [col for col in export_config["selected_columns"] if col in df.columns]
            if available_cols:
                df = df[available_cols]
        
        export_jobs[export_id]["message"] = "Normalizing data..."
        export_jobs[export_id]["progress"] = 70
        
        # Normalize
        normalizer = DataNormalizer()
        df = normalizer.normalize_dataframe(df, export_config.get("options", {}))
        
        export_jobs[export_id]["message"] = f"Generating {export_config['format'].upper()} file..."
        export_jobs[export_id]["progress"] = 80
        
        # Generate file
        generator = engine._get_format_generator(export_config["format"])
        file_content, filename, content_type = await generator(df, request)
        
        export_jobs[export_id]["progress"] = 95
        export_jobs[export_id]["message"] = "Finalizing..."
        
        # Store result
        export_jobs[export_id].update({
            "status": "completed",
            "file_content": file_content,
            "filename": filename,
            "content_type": content_type,
            "rows": len(df),
            "columns": len(df.columns),
            "download_count": 0,
            "progress": 100,
            "message": "Export completed successfully"
        })
        
        # Store in database
        await db.async_exports.insert_one({
            "export_id": export_id,
            "job_id": job_id,
            "user_id": user_id,
            "filename": filename,
            "content_type": content_type,
            "size": len(file_content),
            "rows": len(df),
            "columns": len(df.columns),
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=ExportConfig.EXPIRATION_DAYS),
            "download_count": 0
        })
        
        logger.info(f"Async export {export_id} completed: {len(df)} rows, {len(df.columns)} columns")
        
    except Exception as e:
        logger.error(f"Async export {export_id} failed: {str(e)}", exc_info=True)
        export_jobs[export_id] = {
            "status": "failed",
            "error": str(e),
            "message": f"Export failed: {str(e)}"
        }