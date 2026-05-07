# routes/parsing.py (create this new file)
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from typing import Optional
from parsing.Ollama import parse_with_openrouter
from mongodb.database import get_database
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class ParseRequest(BaseModel):
    dom_content: Optional[str] = None  
    parse_description: str


class ParseResponse(BaseModel):
    parse_result: str
    parse_description: str
    created_at: datetime


@router.post("/api/scraping/jobs/{job_id}/parse")
async def parse_job_content(job_id: str, request: ParseRequest):
    """
    Parse job content using Ollama to extract specific information
    """
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    db = await get_database()
    
    # Get the job to access its content
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get DOM content - either from request or from job
    dom_content = request.dom_content if request.dom_content else job.get("scraped_content")
    
    if not dom_content:
        raise HTTPException(
            status_code=400, 
            detail="No content available to parse. The job may not have completed scraping yet."
        )
    
    try:
        # Parse using Ollama
        parsed_result = parse_with_openrouter(dom_content, request.parse_description)
        
        # Save the parse result to database
        parse_doc = {
            "job_id": ObjectId(job_id),
            "parse_description": request.parse_description,
            "parsed_content": parsed_result,
            "created_at": datetime.utcnow()
        }
        
        result = await db.parsed_results.insert_one(parse_doc)
        
        # Also update the job with the latest parse (optional)
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"last_parse_description": request.parse_description, "last_parse_at": datetime.utcnow()}}
        )
        
        return ParseResponse(
            parse_result=parsed_result,
            parse_description=request.parse_description,
            created_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error parsing job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse content: {str(e)}"
        )


@router.get("/api/scraping/jobs/{job_id}/parsed-results")
async def get_parsed_results(job_id: str):
    """
    Get all parsed results for a job
    """
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    db = await get_database()
    
    # Get all parsed results for this job
    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)}).sort("created_at", -1)
    parsed_results = []
    
    async for result in cursor:
        parsed_results.append({
            "id": str(result["_id"]),
            "job_id": str(result["job_id"]),
            "parse_description": result["parse_description"],
            "parsed_content": result["parsed_content"],
            "created_at": result["created_at"]
        })
    
    return {"parsed_results": parsed_results}


@router.delete("/api/scraping/results/{result_id}")
async def delete_parsed_result(result_id: str):
    """
    Delete a specific parsed result
    """
    if not ObjectId.is_valid(result_id):
        raise HTTPException(status_code=400, detail="Invalid result ID format")
    
    db = await get_database()
    result = await db.parsed_results.delete_one({"_id": ObjectId(result_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parse result not found")
    
    return {"message": "Parse result deleted successfully"}