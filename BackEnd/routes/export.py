from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import pandas as pd
import json
import io
import zipfile
import re
import csv
from mongodb.database import get_database
import logging
import ast

logger = logging.getLogger(__name__)
router = APIRouter()

class ExportRequest(BaseModel):
    format: str  # csv, xlsx, json
    job_id: str
    parse_result_id: Optional[str] = None
    date_range: str = "all"
    filter_status: str = "all"
    encoding: str = "utf-8"
    dataset_name: str = "dataset"
    options: Dict[str, bool] = {}

def convert_to_tabular_data(parsed_content: Any) -> List[Dict]:
    """
    Convert parsed content (which could be in various formats) to tabular data
    """
    result = []
    
    # If it's already a list of dictionaries, use it directly
    if isinstance(parsed_content, list):
        for item in parsed_content:
            if isinstance(item, dict):
                result.append(item)
            else:
                result.append({"value": str(item)})
        return result
    
    # If it's a dictionary
    if isinstance(parsed_content, dict):
        # Check if it contains table-like structure
        if "headers" in parsed_content and "rows" in parsed_content:
            # Already structured as table
            headers = parsed_content["headers"]
            for row in parsed_content.get("rows", []):
                if len(row) == len(headers):
                    result.append(dict(zip(headers, row)))
                else:
                    result.append({"row_data": str(row)})
        else:
            # Single row dictionary
            result.append(parsed_content)
        return result
    
    # If it's a string, try to parse it
    if isinstance(parsed_content, str):
        # Try to parse as JSON
        try:
            parsed_json = json.loads(parsed_content)
            return convert_to_tabular_data(parsed_json)
        except:
            pass
        
        # Try to parse as Python dict/list literal
        try:
            parsed_python = ast.literal_eval(parsed_content)
            return convert_to_tabular_data(parsed_python)
        except:
            pass
        
        # Try to parse as markdown table
        if "|" in parsed_content and "-" in parsed_content:
            lines = parsed_content.strip().split('\n')
            if len(lines) >= 3:
                # Find header separator line
                for i, line in enumerate(lines):
                    if '|' in line and '-' in line and i > 0:
                        headers = [h.strip() for h in lines[i-1].split('|') if h.strip()]
                        for row_line in lines[i+1:]:
                            if '|' in row_line:
                                values = [v.strip() for v in row_line.split('|') if v.strip()]
                                if len(values) == len(headers):
                                    result.append(dict(zip(headers, values)))
                        if result:
                            return result
        
        # Try to parse as CSV
        try:
            reader = csv.DictReader(io.StringIO(parsed_content))
            result = [row for row in reader]
            if result:
                return result
        except:
            pass
        
        # Try to split by newlines and parse key-value pairs
        lines = parsed_content.strip().split('\n')
        if lines:
            # Check if it's key-value format
            row = {}
            for line in lines:
                if ':' in line or '=' in line:
                    sep = ':' if ':' in line else '='
                    key, value = line.split(sep, 1)
                    row[key.strip()] = value.strip()
            if row:
                result.append(row)
            else:
                # Just a single value
                result.append({"content": parsed_content})
        
        return result
    
    # Fallback
    return [{"content": str(parsed_content)}]

def flatten_dict(d, parent_key='', sep='_'):
    """Flatten a nested dictionary"""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            # Convert lists to JSON strings
            items.append((new_key, json.dumps(v)))
        else:
            items.append((new_key, v))
    return dict(items)

@router.get("/api/export/jobs")
async def get_jobs_with_parsed_results():
    """Get all jobs that have parsed results"""
    db = await get_database()
    
    # Get all jobs that have parsed results
    pipeline = [
        {
            "$lookup": {
                "from": "parsed_results",
                "localField": "_id",
                "foreignField": "job_id",
                "as": "parsed_results"
            }
        },
        {
            "$match": {
                "parsed_results.0": {"$exists": True}
            }
        },
        {
            "$project": {
                "name": 1,
                "url": 1,
                "created_at": 1,
                "records": {"$size": "$parsed_results"},
                "scraped_content": 1
            }
        },
        {"$sort": {"created_at": -1}}
    ]
    
    cursor = db.jobs.aggregate(pipeline)
    jobs = []
    async for job in cursor:
        jobs.append({
            "id": str(job["_id"]),
            "name": job.get("name", "Untitled"),
            "url": job.get("url", ""),
            "records": job["records"],
            "created_at": job.get("created_at")
        })
    
    return jobs

@router.get("/api/export/parse-results/{job_id}")
async def get_parse_results(job_id: str):
    """Get all parsed results for a specific job"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    db = await get_database()
    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)}).sort("created_at", -1)
    
    results = []
    async for result in cursor:
        content = result["parsed_content"]
        
        # Try to parse content for preview
        try:
            parsed_json = json.loads(content) if isinstance(content, str) else content
            preview = str(parsed_json)[:200] + "..."
        except:
            preview = content[:200] if isinstance(content, str) else str(content)[:200]
        
        results.append({
            "id": str(result["_id"]),
            "parse_description": result["parse_description"],
            "parsed_content": content,
            "preview": preview,
            "created_at": result["created_at"],
            "job_id": str(result["job_id"])
        })
    
    return results

@router.post("/api/export/generate")
async def generate_export(request: ExportRequest):
    """Generate export file from parsed content"""
    if not ObjectId.is_valid(request.job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    db = await get_database()
    
    # Build query for parsed results
    query = {"job_id": ObjectId(request.job_id)}
    
    # Filter by specific parse result if provided
    parse_result_obj_id = None
    if request.parse_result_id and ObjectId.is_valid(request.parse_result_id):
        parse_result_obj_id = ObjectId(request.parse_result_id)
        query["_id"] = parse_result_obj_id
    
    # Filter by date range
    if request.date_range != "all":
        now = datetime.utcnow()
        if request.date_range == "last_24h":
            start_date = now - timedelta(hours=24)
        elif request.date_range == "last_7d":
            start_date = now - timedelta(days=7)
        else:
            start_date = None
        
        if start_date:
            query["created_at"] = {"$gte": start_date}
    
    # Fetch parsed results
    cursor = db.parsed_results.find(query).sort("created_at", -1)
    results = []
    
    async for result in cursor:
        content = result["parsed_content"]
        
        # Try to parse content if it's a string
        if isinstance(content, str):
            try:
                parsed_content = json.loads(content)
            except:
                # Keep as string if not JSON
                parsed_content = content
        else:
            parsed_content = content
        
        # Convert to tabular data
        tabular_data = convert_to_tabular_data(parsed_content)
        
        for row_data in tabular_data:
            # Add metadata
            if request.options.get("timestamps"):
                row_data["created_at"] = result["created_at"].isoformat() if result["created_at"] else None
            
            if request.options.get("parse_description"):
                row_data["parse_description"] = result["parse_description"]
            
            results.append(row_data)
    
    if not results:
        raise HTTPException(status_code=404, detail="No parsed results found for the selected criteria")
    
    # Flatten nested structures if requested
    export_data = []
    for row in results:
        if request.options.get("flatten") and isinstance(row, dict):
            export_data.append(flatten_dict(row))
        else:
            export_data.append(row)
    
    # Sanitize dataset name for filename
    safe_dataset_name = re.sub(r'[^a-zA-Z0-9_-]', '_', request.dataset_name)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Generate file based on format
    file_content = None
    filename = f"{safe_dataset_name}_{timestamp}"
    content_type = None
    
    try:
        if request.format == "csv":
            df = pd.DataFrame(export_data)
            # Handle null values
            if request.options.get("nullEmpty"):
                df = df.fillna("")
            
            output = io.StringIO()
            df.to_csv(output, index=False, encoding=request.encoding, header=request.options.get("headers", True))
            file_content = output.getvalue().encode(request.encoding, errors='replace')
            filename += ".csv"
            content_type = "text/csv"
            
        elif request.format == "xlsx":
            df = pd.DataFrame(export_data)
            if request.options.get("nullEmpty"):
                df = df.fillna("")
            
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                sheet_name = safe_dataset_name[:31]  # Excel sheet name max 31 chars
                df.to_excel(writer, index=False, sheet_name=sheet_name)
            file_content = output.getvalue()
            filename += ".xlsx"
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
        elif request.format == "json":
            if request.options.get("compress"):
                json_lines = "\n".join([json.dumps(row, default=str, ensure_ascii=False) for row in export_data])
                file_content = json_lines.encode(request.encoding, errors='replace')
            else:
                file_content = json.dumps(export_data, indent=2, default=str, ensure_ascii=False).encode(request.encoding, errors='replace')
            filename += ".json"
            content_type = "application/json"
        
        # Compress if requested (for non-JSON formats)
        if request.options.get("compress") and request.format != "json":
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                zip_file.writestr(filename, file_content)
            zip_buffer.seek(0)
            file_content = zip_buffer.getvalue()
            filename = filename.replace(f".{request.format}", ".zip")
            content_type = "application/zip"
        
        # FIXED: Store export metadata in history with proper fields
        export_history_doc = {
            "job_id": ObjectId(request.job_id),
            "format": request.format,
            "rows": len(export_data),
            "columns": len(export_data[0]) if export_data else 0,
            "size": len(file_content),
            "created_at": datetime.utcnow(),
            "filename": filename,
            "dataset_name": request.dataset_name,
            "options": request.options,
            "parse_result_id": str(parse_result_obj_id) if parse_result_obj_id else None,  # FIXED: Store as string, not ObjectId
            "encoding": request.encoding,
            "date_range": request.date_range
        }
        
        await db.export_history.insert_one(export_history_doc)
        
        # Return file
        return Response(
            content=file_content,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Export generation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate export: {str(e)}")
@router.get("/api/export/history")
async def get_export_history():
    """Get export history"""
    db = await get_database()
    cursor = db.export_history.find().sort("created_at", -1).limit(50)
    
    history = []
    async for export in cursor:
        # Get job name - FIXED: handle None or invalid ObjectId
        job_name = "Unknown"
        if export.get("job_id"):
            try:
                job = await db.jobs.find_one({"_id": ObjectId(export["job_id"])})
                if job:
                    job_name = job.get("name", "Untitled")
            except:
                job_name = "Unknown"
        
        # FIXED: Format the size properly
        size_kb = export.get("size", 0) / 1024
        if size_kb >= 1024:
            size_str = f"{size_kb / 1024:.1f} MB"
        else:
            size_str = f"{size_kb:.1f} KB"
        
        history.append({
            "id": str(export["_id"]),
            "name": export.get("dataset_name", f"Export_{export['created_at'].strftime('%Y%m%d_%H%M%S')}"),
            "format": export.get("format", "unknown"),
            "size": size_str,
            "rows": export.get("rows", 0),
            "columns": export.get("columns", 0),
            "date": export["created_at"],
            "job_name": job_name,
            "filename": export.get("filename", "")
        })
    
    return history
@router.get("/api/export/download/{export_id}")
async def download_export(export_id: str):
    """Download a previously generated export (regenerate if needed)"""
    if not ObjectId.is_valid(export_id):
        raise HTTPException(status_code=400, detail="Invalid export ID")
    
    db = await get_database()
    export = await db.export_history.find_one({"_id": ObjectId(export_id)})
    
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    
    # Regenerate the export based on stored parameters
    try:
        # Rebuild query from stored export data
        query = {"job_id": export["job_id"]}
        if export.get("parse_result_id"):
            query["_id"] = ObjectId(export["parse_result_id"])
        
        # Fetch results again
        cursor = db.parsed_results.find(query).sort("created_at", -1)
        results = []
        
        async for result in cursor:
            content = result["parsed_content"]
            
            if isinstance(content, str):
                try:
                    parsed_content = json.loads(content)
                except:
                    parsed_content = content
            else:
                parsed_content = content
            
            tabular_data = convert_to_tabular_data(parsed_content)
            
            for row_data in tabular_data:
                if export.get("options", {}).get("timestamps"):
                    row_data["created_at"] = result["created_at"].isoformat() if result["created_at"] else None
                
                if export.get("options", {}).get("parse_description"):
                    row_data["parse_description"] = result["parse_description"]
                
                results.append(row_data)
        
        if not results:
            raise HTTPException(status_code=404, detail="No parsed results found")
        
        # Prepare export data
        export_data = []
        for row in results:
            if export.get("options", {}).get("flatten") and isinstance(row, dict):
                export_data.append(flatten_dict(row))
            else:
                export_data.append(row)
        
        # Generate file
        file_content = None
        filename = export["filename"]
        content_type = None
        format_type = export["format"]
        
        if format_type == "csv":
            df = pd.DataFrame(export_data)
            output = io.StringIO()
            df.to_csv(output, index=False, encoding='utf-8', header=export.get("options", {}).get("headers", True))
            file_content = output.getvalue().encode('utf-8', errors='replace')
            content_type = "text/csv"
            
        elif format_type == "xlsx":
            df = pd.DataFrame(export_data)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name="Parsed Content")
            file_content = output.getvalue()
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
        elif format_type == "json":
            file_content = json.dumps(export_data, indent=2, default=str, ensure_ascii=False).encode('utf-8', errors='replace')
            content_type = "application/json"
        
        return Response(
            content=file_content,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Export download error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to regenerate export: {str(e)}")

@router.get("/api/export/preview/{job_id}")
async def preview_export(job_id: str):
    """Preview the export data structure"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    db = await get_database()
    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)}).limit(5)
    
    data = []
    async for result in cursor:
        content = result["parsed_content"]
        
        try:
            parsed_content = json.loads(content) if isinstance(content, str) else content
            tabular_data = convert_to_tabular_data(parsed_content)
            for row in tabular_data[:3]:  # Preview first 3 rows
                data.append(row)
        except Exception as e:
            data.append({"raw_content": str(content)[:200]})
    
    # Get all unique columns across all rows
    all_columns = set()
    for item in data:
        if isinstance(item, dict):
            all_columns.update(item.keys())
    
    return {
        "columns": sorted(list(all_columns)),
        "data": data[:20],
        "rows": len(data)
    }