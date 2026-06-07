# backend/routes/export.py - ENHANCED with streaming and large dataset support

from fastapi import APIRouter, HTTPException, BackgroundTasks, Response, Query, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from bson import ObjectId
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Generator
import pandas as pd
import json
import io
import zipfile
import re
import dicttoxml
import csv
import asyncio
from routes.auth import get_current_user
from mongodb.database import get_database
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class ExportRequest(BaseModel):
    format: str = Field(..., description="csv, xlsx, json, xml, txt")
    job_id: str
    parse_result_id: Optional[str] = None
    date_range: str = "all"
    filter_status: str = "all"
    encoding: str = "utf-8"
    dataset_name: str = "dataset"
    options: Dict[str, bool] = {}
    selected_columns: Optional[List[str]] = None
    page_size: int = Field(1000, ge=100, le=10000)

class AsyncExportRequest(BaseModel):
    """For large dataset exports (async background export)"""
    format: str
    job_id: str
    dataset_name: str = "dataset"
    options: Dict[str, bool] = {}
    selected_columns: Optional[List[str]] = None

# In-memory export job tracking (in production, use Redis)
export_jobs = {}
export_job_counter = 0

async def stream_large_export(job_id: str, export_config: Dict, user_id: str, export_id: str):
    """Background task for streaming large exports"""
    db = await get_database()
    
    try:
        export_jobs[export_id] = {"status": "processing", "progress": 0}
        
        # Build query
        query = {"job_id": ObjectId(job_id)}
        if export_config.get("parse_result_id"):
            query["_id"] = ObjectId(export_config["parse_result_id"])
        
        # Get total count
        total = await db.parsed_results.count_documents(query)
        export_jobs[export_id]["total"] = total
        
        # Fetch results in chunks
        chunk_size = 100
        all_data = []
        processed = 0
        
        cursor = db.parsed_results.find(query).sort("created_at", -1)
        
        async for result in cursor:
            content = result["parsed_content"]
            
            # Parse content
            if isinstance(content, str):
                try:
                    parsed_content = json.loads(content)
                except:
                    parsed_content = content
            else:
                parsed_content = content
            
            # Convert to tabular data
            from routes.export import convert_to_tabular_data
            tabular_data = convert_to_tabular_data(parsed_content)
            
            for row in tabular_data:
                # Filter columns if specified
                if export_config.get("selected_columns") and isinstance(row, dict):
                    row = {k: v for k, v in row.items() if k in export_config["selected_columns"]}
                all_data.append(row)
            
            processed += 1
            export_jobs[export_id]["progress"] = int((processed / total) * 100)
        
        # Generate file
        format_type = export_config["format"]
        filename = f"{export_config['dataset_name']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if format_type == "csv":
            df = pd.DataFrame(all_data)
            output = io.StringIO()
            df.to_csv(output, index=False, encoding='utf-8')
            file_content = output.getvalue().encode('utf-8')
            filename += ".csv"
            
        elif format_type == "xlsx":
            df = pd.DataFrame(all_data)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # Split into multiple sheets if needed
                rows_per_sheet = 1000000
                if len(df) > rows_per_sheet:
                    for i in range(0, len(df), rows_per_sheet):
                        sheet_name = f"Sheet_{i//rows_per_sheet + 1}"
                        df.iloc[i:i+rows_per_sheet].to_excel(writer, sheet_name=sheet_name, index=False)
                else:
                    df.to_excel(writer, sheet_name="Data", index=False)
            file_content = output.getvalue()
            filename += ".xlsx"
            
        elif format_type == "json":
            file_content = json.dumps(all_data, indent=2, default=str, ensure_ascii=False).encode('utf-8')
            filename += ".json"
            
        elif format_type == "xml":
            
            xml_bytes = dicttoxml.dicttoxml(all_data, custom_root='data', attr_type=False)
            file_content = xml_bytes
            filename += ".xml"
            
        else:  # txt
            file_content = "\n".join([str(row) for row in all_data]).encode('utf-8')
            filename += ".txt"
        
        # Compress if large
        if len(file_content) > 10 * 1024 * 1024:  # > 10MB
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                zip_file.writestr(filename, file_content)
            zip_buffer.seek(0)
            file_content = zip_buffer.getvalue()
            filename = filename.replace('.', '_compressed.')
            if not filename.endswith('.zip'):
                filename += '.zip'
        
        export_jobs[export_id]["status"] = "completed"
        export_jobs[export_id]["file_content"] = file_content
        export_jobs[export_id]["filename"] = filename
        export_jobs[export_id]["content_type"] = "application/octet-stream" if filename.endswith('.zip') else f"application/{format_type}"
        
        # Store in MongoDB for persistence
        await db.async_exports.insert_one({
            "export_id": export_id,
            "job_id": job_id,
            "user_id": user_id,
            "filename": filename,
            "size": len(file_content),
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=24)
        })
        
    except Exception as e:
        logger.error(f"Async export failed: {str(e)}")
        export_jobs[export_id] = {"status": "failed", "error": str(e)}


@router.post("/generate")
async def generate_export(request: ExportRequest):
    """Generate export file (synchronous for smaller datasets)"""
    from routes.export import convert_to_tabular_data, flatten_dict
    
    if not ObjectId.is_valid(request.job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    db = await get_database()
    
    # Build query
    query = {"job_id": ObjectId(request.job_id)}
    if request.parse_result_id and ObjectId.is_valid(request.parse_result_id):
        query["_id"] = ObjectId(request.parse_result_id)
    
    # Date range filter
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
    
    # Fetch results
    cursor = db.parsed_results.find(query).sort("created_at", -1)
    all_data = []
    
    async for result in cursor:
        content = result["parsed_content"]
        
        # Parse content
        if isinstance(content, str):
            try:
                parsed_content = json.loads(content)
            except:
                parsed_content = content
        else:
            parsed_content = content
        
        # Convert to tabular
        tabular_data = convert_to_tabular_data(parsed_content)
        
        for row in tabular_data:
            # Add timestamps if requested
            if request.options.get("timestamps"):
                row["created_at"] = result["created_at"].isoformat() if result["created_at"] else None
            
            # Filter columns if specified
            if request.selected_columns and isinstance(row, dict):
                row = {k: v for k, v in row.items() if k in request.selected_columns}
            
            all_data.append(row)
    
    if not all_data:
        raise HTTPException(status_code=404, detail="No data found for export")
    
    # Flatten nested structures if requested
    if request.options.get("flatten"):
        flattened_data = []
        for row in all_data:
            if isinstance(row, dict):
                flattened_data.append(flatten_dict(row))
            else:
                flattened_data.append(row)
        all_data = flattened_data
    
    # Generate file
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', request.dataset_name)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{safe_name}_{timestamp}"
    
    file_content = None
    content_type = None
    
    try:
        if request.format == "csv":
            df = pd.DataFrame(all_data)
            if request.options.get("nullEmpty"):
                df = df.fillna("")
            output = io.StringIO()
            df.to_csv(output, index=False, encoding=request.encoding, header=request.options.get("headers", True))
            file_content = output.getvalue().encode(request.encoding, errors='replace')
            filename += ".csv"
            content_type = "text/csv"
            
        elif request.format == "xlsx":
            df = pd.DataFrame(all_data)
            if request.options.get("nullEmpty"):
                df = df.fillna("")
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                sheet_name = safe_name[:31]
                # Handle large datasets - create multiple sheets if needed
                if len(df) > 1000000:
                    for i in range(0, len(df), 1000000):
                        chunk_df = df.iloc[i:i+1000000]
                        sheet_suffix = f"_{i//1000000 + 1}" if i > 0 else ""
                        chunk_df.to_excel(writer, sheet_name=f"{sheet_name}{sheet_suffix}"[:31], index=False)
                else:
                    df.to_excel(writer, index=False, sheet_name=sheet_name)
            file_content = output.getvalue()
            filename += ".xlsx"
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            
        elif request.format == "json":
            if request.options.get("compress"):
                json_lines = "\n".join([json.dumps(row, default=str, ensure_ascii=False) for row in all_data])
                file_content = json_lines.encode(request.encoding, errors='replace')
            else:
                file_content = json.dumps(all_data, indent=2, default=str, ensure_ascii=False).encode(request.encoding, errors='replace')
            filename += ".json"
            content_type = "application/json"
            
        elif request.format == "xml":
            try:
             
                xml_bytes = dicttoxml.dicttoxml(all_data, custom_root='export_data', attr_type=False)
                file_content = xml_bytes
                filename += ".xml"
                content_type = "application/xml"
            except ImportError:
                raise HTTPException(status_code=500, detail="XML export requires dicttoxml package")
                
        elif request.format == "txt":
            text_content = "\n".join([str(row) for row in all_data])
            file_content = text_content.encode(request.encoding, errors='replace')
            filename += ".txt"
            content_type = "text/plain"
        
        # Compress if requested
        if request.options.get("compress") and request.format != "json":
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                zip_file.writestr(filename, file_content)
            zip_buffer.seek(0)
            file_content = zip_buffer.getvalue()
            filename = filename.replace(f".{request.format}", ".zip")
            content_type = "application/zip"
        
        # Store in history
        export_history_doc = {
            "job_id": ObjectId(request.job_id),
            "format": request.format,
            "rows": len(all_data),
            "columns": len(all_data[0]) if all_data and isinstance(all_data[0], dict) else 0,
            "size": len(file_content),
            "created_at": datetime.utcnow(),
            "filename": filename,
            "dataset_name": request.dataset_name,
            "options": request.options,
            "encoding": request.encoding,
            "date_range": request.date_range
        }
        
        await db.export_history.insert_one(export_history_doc)
        
        return Response(
            content=file_content,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.post("/generate-async")
async def generate_async_export(
    request: AsyncExportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Generate export asynchronously for large datasets"""
    global export_job_counter
    
    from routes.auth import get_current_user
    
    user_id = str(current_user.get("id") or current_user.get("_id"))
    
    export_id = f"export_{int(datetime.now().timestamp())}_{export_job_counter}"
    export_job_counter += 1
    
    export_config = request.dict()
    
    background_tasks.add_task(
        stream_large_export,
        request.job_id,
        export_config,
        user_id,
        export_id
    )
    
    return {
        "export_id": export_id,
        "status": "processing",
        "message": "Export started. Check status with /export/status/{export_id}"
    }


@router.get("/status/{export_id}")
async def get_export_status(export_id: str):
    """Get status of async export job"""
    if export_id in export_jobs:
        job = export_jobs[export_id]
        if job["status"] == "completed":
            return {
                "export_id": export_id,
                "status": "completed",
                "download_url": f"/export/download-async/{export_id}"
            }
        return {
            "export_id": export_id,
            "status": job["status"],
            "progress": job.get("progress", 0),
            "total": job.get("total", 0)
        }
    
    # Check MongoDB for completed export
    db = await get_database()
    stored = await db.async_exports.find_one({"export_id": export_id})
    if stored:
        return {
            "export_id": export_id,
            "status": "completed",
            "download_url": f"/export/download-async/{export_id}",
            "expires_at": stored["expires_at"]
        }
    
    raise HTTPException(status_code=404, detail="Export not found")


@router.get("/download-async/{export_id}")
async def download_async_export(export_id: str):
    """Download completed async export"""
    if export_id in export_jobs and export_jobs[export_id]["status"] == "completed":
        job = export_jobs[export_id]
        return Response(
            content=job["file_content"],
            media_type=job.get("content_type", "application/octet-stream"),
            headers={"Content-Disposition": f"attachment; filename={job['filename']}"}
        )
    
    raise HTTPException(status_code=404, detail="Export not ready or expired")


@router.get("/history")
async def get_export_history(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Get export history with pagination"""
    db = await get_database()
    
    total = await db.export_history.count_documents({})
    cursor = db.export_history.find().sort("created_at", -1).skip(offset).limit(limit)
    
    history = []
    async for export in cursor:
        # Get job name
        job_name = "Unknown"
        if export.get("job_id"):
            try:
                job = await db.jobs.find_one({"_id": export["job_id"]})
                if job:
                    job_name = job.get("name", "Untitled")
            except:
                pass
        
        # Format size
        size_bytes = export.get("size", 0)
        if size_bytes >= 1024 * 1024:
            size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
        elif size_bytes >= 1024:
            size_str = f"{size_bytes / 1024:.1f} KB"
        else:
            size_str = f"{size_bytes} B"
        
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
    
    return {
        "history": history,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/preview/{job_id}")
async def preview_export(
    job_id: str,
    limit: int = Query(20, ge=1, le=100)
):
    """Preview export data structure"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    db = await get_database()
    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)}).limit(limit)
    
    data = []
    all_columns = set()
    
    async for result in cursor:
        content = result["parsed_content"]
        
        try:
            parsed_content = json.loads(content) if isinstance(content, str) else content
        except:
            parsed_content = content
        
        # Try to convert to tabular
        if isinstance(parsed_content, dict):
            all_columns.update(parsed_content.keys())
            data.append(parsed_content)
        elif isinstance(parsed_content, list) and parsed_content:
            for item in parsed_content[:3]:
                if isinstance(item, dict):
                    all_columns.update(item.keys())
                    data.append(item)
        else:
            data.append({"content": str(parsed_content)[:200]})
    
    return {
        "columns": sorted(list(all_columns))[:20],
        "data": data[:limit],
        "total_rows": len(data),
        "sample_preview": True
    }


@router.get("/download/{export_id}")
async def download_export(export_id: str):
    """Download a previously generated export"""
    if not ObjectId.is_valid(export_id):
        raise HTTPException(status_code=400, detail="Invalid export ID")
    
    db = await get_database()
    export = await db.export_history.find_one({"_id": ObjectId(export_id)})
    
    if not export:
        raise HTTPException(status_code=404, detail="Export not found")
    
    # Regenerate the export
    from routes.export import convert_to_tabular_data, flatten_dict
    
    # Rebuild query
    query = {"job_id": export["job_id"]}
    
    cursor = db.parsed_results.find(query).sort("created_at", -1)
    all_data = []
    
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
        
        for row in tabular_data:
            if export.get("options", {}).get("timestamps"):
                row["created_at"] = result["created_at"].isoformat() if result["created_at"] else None
            all_data.append(row)
    
    if not all_data:
        raise HTTPException(status_code=404, detail="No data found")
    
    if export.get("options", {}).get("flatten"):
        flattened_data = []
        for row in all_data:
            if isinstance(row, dict):
                flattened_data.append(flatten_dict(row))
            else:
                flattened_data.append(row)
        all_data = flattened_data
    
    # Generate file
    filename = export.get("filename", f"export_{export_id}")
    format_type = export.get("format", "csv")
    
    if format_type == "csv":
        df = pd.DataFrame(all_data)
        output = io.StringIO()
        df.to_csv(output, index=False, encoding='utf-8')
        file_content = output.getvalue().encode('utf-8')
        content_type = "text/csv"
        
    elif format_type == "xlsx":
        df = pd.DataFrame(all_data)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Data")
        file_content = output.getvalue()
        content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        
    elif format_type == "json":
        file_content = json.dumps(all_data, indent=2, default=str, ensure_ascii=False).encode('utf-8')
        content_type = "application/json"
    else:
        file_content = "\n".join([str(row) for row in all_data]).encode('utf-8')
        content_type = "text/plain"
    
    return Response(
        content=file_content,
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )