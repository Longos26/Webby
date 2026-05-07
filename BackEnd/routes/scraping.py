# backend/routes/scraping.py
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
import logging
import os
from dotenv import load_dotenv
from mongodb.database import get_database
from routes.auth import get_current_user
from services.scraper_utils import (
    scrape_website, 
    extract_body_content, 
    clean_body_content, 
    split_dom_content,
)
from parsing.Ollama import parse_with_openrouter

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scraping", tags=["scraping"])

# Request/Response models
class ScrapeRequest(BaseModel):
    url: str
    use_selenium: Optional[bool] = False

class ParseRequest(BaseModel):
    dom_content: Optional[str] = ""
    parse_description: str

class CreateJobRequest(BaseModel):
    name: str
    url: str
    frequency: Optional[str] = "one-time"

@router.post("/scrape")
async def scrape_endpoint(req: ScrapeRequest, current_user: dict = Depends(get_current_user)):
    """Scrape a website and return cleaned content"""
    try:
        user_id = current_user.get("id") or current_user.get("_id")
        logger.info(f"Scraping URL: {req.url} for user {user_id}")
        
        html = scrape_website(req.url, use_selenium=req.use_selenium)
        
        if not html:
            raise HTTPException(status_code=500, detail="Failed to fetch website content")
        
        body = extract_body_content(html)
        cleaned = clean_body_content(body)
        chunks = split_dom_content(cleaned)
        
        return {
            "success": True,
            "cleaned_content": cleaned,
            "content_length": len(cleaned),
            "chunks": len(chunks),
            "url": req.url,
            "method": "selenium" if req.use_selenium else "requests"
        }
    except Exception as e:
        logger.error(f"Scraping error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/parse")
async def parse_endpoint(req: ParseRequest, current_user: dict = Depends(get_current_user)):
    """Parse DOM content using keyword extraction"""
    try:
        user_id = current_user.get("id") or current_user.get("_id")
        logger.info(f"Parsing content for user {user_id}")
        
        if not req.dom_content:
            return {
                "success": False,
                "result": "No content to parse"
            }
        
        chunks = split_dom_content(req.dom_content)
        result = parse_with_openrouter(chunks, req.parse_description)
        
        return {
            "success": True,
            "result": result,
            "chunks_processed": len(chunks)
        }
    except Exception as e:
        logger.error(f"Parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/jobs")
async def create_scraping_job(request: CreateJobRequest, current_user: dict = Depends(get_current_user)):
    """Create a new scraping job"""
    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication failed")
    
    new_job = {
        "name": request.name,
        "url": request.url,
        "user_id": user_id,
        "status": "queued",
        "progress": 0,
        "records": 0,
        "scraped_content": "",
        "error_message": "",
        "frequency": request.frequency,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "scraped_at": None
    }
    
    result = await db.jobs.insert_one(new_job)
    new_job["id"] = str(result.inserted_id)
    new_job["target"] = new_job["url"]
    
    logger.info(f"Created scraping job {result.inserted_id} for user {user_id}")
    return new_job

@router.get("/jobs")
async def get_scraping_jobs(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get all jobs for current user"""
    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication failed")
    
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    
    cursor = db.jobs.find(query).sort("created_at", -1)
    jobs = []
    
    async for job in cursor:
        job_dict = {
            "id": str(job["_id"]),
            "name": job.get("name", ""),
            "url": job.get("url", ""),
            "target": job.get("url", ""),
            "status": job.get("status", "queued"),
            "progress": job.get("progress", 0),
            "records": job.get("records", 0),
            "frequency": job.get("frequency", "one-time"),
            "created_at": job.get("created_at").isoformat() if job.get("created_at") else None,
            "updated_at": job.get("updated_at").isoformat() if job.get("updated_at") else None,
            "scraped_content": job.get("scraped_content", ""),
            "error_message": job.get("error_message", "")
        }
        jobs.append(job_dict)
    
    return jobs

@router.get("/jobs/{job_id}")
async def get_scraping_job(job_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific job by ID"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")
    
    job = await db.jobs.find_one({
        "_id": ObjectId(job_id),
        "user_id": user_id
    })
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": str(job["_id"]),
        "name": job.get("name", ""),
        "url": job.get("url", ""),
        "target": job.get("url", ""),
        "status": job.get("status", "queued"),
        "progress": job.get("progress", 0),
        "records": job.get("records", 0),
        "scraped_content": job.get("scraped_content", ""),
        "created_at": job.get("created_at").isoformat() if job.get("created_at") else None
    }

@router.post("/jobs/{job_id}/parse")
async def parse_job_content(
    job_id: str,
    parse_request: ParseRequest,
    current_user: dict = Depends(get_current_user)
):
    """Parse an existing job's scraped content"""
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        db = await get_database()
        user_id = current_user.get("id") or current_user.get("_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User authentication failed")
        
        job = await db.jobs.find_one({
            "_id": ObjectId(job_id),
            "user_id": user_id
        })
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found or access denied")
        
        scraped_content = job.get("scraped_content", "")
        if not scraped_content:
            raise HTTPException(
                status_code=400, 
                detail="Job has no scraped content to parse. Please run the scraping job first."
            )
        
        chunks = split_dom_content(scraped_content)
        result = parse_with_openrouter(chunks, parse_request.parse_description)
        
        parsed_doc = {
            "job_id": ObjectId(job_id),
            "user_id": user_id,
            "parse_description": parse_request.parse_description,
            "parsed_content": result,
            "created_at": datetime.utcnow()
        }
        
        await db.parsed_results.insert_one(parsed_doc)
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "last_parsed_at": datetime.utcnow(),
                "last_parsed_description": parse_request.parse_description,
                "last_parsed_result": result[:500]
            }}
        )
        
        logger.info(f"Successfully parsed job {job_id} for user {user_id}")
        
        return {
            "success": True,
            "job_id": job_id,
            "parse_result": result,
            "chunks_processed": len(chunks),
            "message": "Content parsed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job parsing error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}/parsed-results")
async def get_parsed_results(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all parsed results for a specific job"""
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
        
        db = await get_database()
        user_id = current_user.get("id") or current_user.get("_id")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="User authentication failed")
        
        logger.info(f"Fetching parsed results for job {job_id}, user {user_id}")
        
        job = await db.jobs.find_one({
            "_id": ObjectId(job_id),
            "user_id": user_id
        })
        
        if not job:
            raise HTTPException(status_code=404, detail="Job not found or access denied")
        
        cursor = db.parsed_results.find({
            "job_id": ObjectId(job_id)
        }).sort("created_at", -1)
        
        results = []
        async for doc in cursor:
            results.append({
                "id": str(doc["_id"]),
                "parse_description": doc.get("parse_description", ""),
                "parsed_content": doc.get("parsed_content", ""),
                "created_at": doc.get("created_at", datetime.utcnow()).isoformat()
            })
        
        return {
            "success": True,
            "job_id": job_id,
            "job_name": job.get("name", ""),
            "scraped_content_preview": job.get("scraped_content", "")[:500] if job.get("scraped_content") else "",
            "has_scraped_content": bool(job.get("scraped_content")),
            "parsed_results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get parsed results error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get parsed results: {str(e)}")

@router.get("/test")
async def test_endpoint():
    """Test if the scraping module is working"""
    SBR_WEBDRIVER = os.getenv("SBR_WEBDRIVER")
    return {
        "status": "ok",
        "message": "Scraping module is ready",
        "selenium_available": bool(SBR_WEBDRIVER)
    }

@router.delete("/results/{result_id}")
async def delete_parsed_result(result_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a specific parsed result"""
    if not ObjectId.is_valid(result_id):
        raise HTTPException(status_code=400, detail="Invalid result ID format")
    
    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")
    
    result = await db.parsed_results.delete_one({
        "_id": ObjectId(result_id),
        "user_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parse result not found")
    
    return {"message": "Parse result deleted successfully"}