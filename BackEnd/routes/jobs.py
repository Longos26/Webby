# backend/routes/jobs.py
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
import logging
import asyncio
import re
from mongodb.database import get_database
from routes.auth import get_current_user
from services.scraper_utils import scrape_website, extract_body_content, clean_body_content
from services.notification_service import NotificationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
notification_service = NotificationService()


def extract_user_id_str(current_user: dict) -> str:
    """Extract user_id as string from current_user dict"""
    user_id = current_user.get("id") or current_user.get("_id") or current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return str(user_id)

def get_current_utc_time():
    """Get current UTC time with timezone awareness"""
    return datetime.now(timezone.utc)

def job_to_response(job: dict) -> dict:
    """Convert MongoDB job document to API response format with proper timestamps"""
    def format_datetime(dt):
        if isinstance(dt, datetime):
            # Convert to local timezone for display
            return dt.astimezone().isoformat() if dt.tzinfo else dt.isoformat()
        return dt
    
    return {
        "id": str(job["_id"]),
        "name": job.get("name", ""),
        "target": job.get("target", job.get("url", "")),
        "url": job.get("url", job.get("target", "")),
        "status": job.get("status", "queued"),
        "progress": job.get("progress", 0),
        "records": job.get("records", 0),
        "user_id": str(job.get("user_id")) if job.get("user_id") else None,
        "created_at": format_datetime(job.get("created_at")),
        "updated_at": format_datetime(job.get("updated_at")),
        "frequency": job.get("frequency", "One-time"),
        "error_message": job.get("error_message"),
        "scraped_content": job.get("scraped_content", ""),
        "scraped_at": format_datetime(job.get("scraped_at")) if job.get("scraped_at") else None
    }

async def validate_job_access(job_id: str, user_id_str: str, db) -> dict:
    """Validate that job exists and belongs to user"""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    job = await db.jobs.find_one({
        "_id": ObjectId(job_id),
        "user_id": user_id_str
    })
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

def calculate_accurate_stats(content: str) -> dict:
    """Calculate accurate content statistics"""
    if not content:
        return {"records": 0, "words": 0, "chars": 0}
    
    # Count words (split by whitespace, filter empty strings)
    words = [w for w in content.split() if w.strip()]
    word_count = len(words)
    
    # Count characters
    char_count = len(content)
    
    # Estimate records - use paragraphs or meaningful line breaks
    # More accurate: count lines with substantial content
    lines = [line.strip() for line in content.splitlines() if line.strip() and len(line.strip()) > 20]
    record_count = max(1, len(lines)) if lines else 1
    
    return {
        "records": record_count,
        "words": word_count,
        "chars": char_count
    }

async def execute_scraping_job(job_id: str, user_id: str):
    """Background task to execute actual scraping job with accurate data"""
    db = await get_database()
    
    try:
        logger.info(f"Starting scraping job {job_id}")
        
        # Update status to running with current timestamp
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "running", "progress": 10, "updated_at": get_current_utc_time()}}
        )
        
        # Get job details
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise Exception("Job not found")
        
        url = job.get("url")
        if not url:
            raise Exception("No URL provided")
        
        await asyncio.sleep(0.5)
        
        # Update progress - starting scrape
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"progress": 30, "updated_at": get_current_utc_time()}}
        )
        
        # ACTUAL SCRAPING - Get real content from the website
        logger.info(f"Scraping actual content from {url}")
        
        # Try with requests first (faster)
        html = scrape_website(url, use_selenium=False)
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"progress": 50, "updated_at": get_current_utc_time()}}
        )
        
        # Extract and clean the body content
        body = extract_body_content(html)
        cleaned_content = clean_body_content(body)
        
        # If content is too small, try with Selenium
        if not cleaned_content or len(cleaned_content.strip()) < 100:
            logger.warning(f"Content too small ({len(cleaned_content) if cleaned_content else 0} chars), trying Selenium...")
            html = scrape_website(url, use_selenium=True)
            body = extract_body_content(html)
            cleaned_content = clean_body_content(body)
        
        # Validate content
        if not cleaned_content or len(cleaned_content.strip()) < 50:
            raise Exception(f"Failed to extract meaningful content. Got {len(cleaned_content) if cleaned_content else 0} characters.")
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"progress": 80, "updated_at": get_current_utc_time()}}
        )
        
        # Calculate accurate statistics
        stats = calculate_accurate_stats(cleaned_content)
        records = stats["records"]
        word_count = stats["words"]
        char_count = stats["chars"]
        
        logger.info(f"Scraped {char_count} chars, {word_count} words, ~{records} records from {url}")
        
        # Store the scraped content with timestamp
        scraped_at = get_current_utc_time()
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": "success",
                    "progress": 100,
                    "records": records,
                    "scraped_content": cleaned_content[:500000],  # Store up to 500k chars
                    "scraped_at": scraped_at,
                    "updated_at": get_current_utc_time(),
                    "error_message": None
                }
            }
        )
        
        # Add activity log
        await db.activities.insert_one({
            "type": "success",
            "title": "Job Completed",
            "description": f"Successfully scraped {url} - Extracted {records} records, {word_count} words",
            "user_id": user_id,
            "created_at": get_current_utc_time()
        })
        
        # Create notification for job completion
        from services.notification_service import NotificationService
        await NotificationService.create_notification(
            user_id=user_id,
            title="Job Completed Successfully",
            message=f"Your scraping job '{job.get('name', 'Untitled')}' has completed. Extracted {records} records from {url}",
            notification_type="job_completed",
            job_id=str(job_id),
            metadata={
                "url": url,
                "records": records,
                "words": word_count,
                "chars": char_count,
                "job_name": job.get("name", "Untitled")
            }
        )
        
        logger.info(f"Job {job_id} completed successfully with {records} records, {word_count} words, {char_count} chars")
        
    except Exception as e:
        error_message = str(e)
        logger.error(f"Job {job_id} failed: {error_message}")
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": "failed",
                    "progress": 0,
                    "error_message": error_message,
                    "updated_at": get_current_utc_time()
                }
            }
        )
        
        await db.activities.insert_one({
            "type": "error",
            "title": "Job Failed",
            "description": f"Failed to scrape: {error_message[:200]}",
            "user_id": user_id,
            "created_at": get_current_utc_time()
        })
        
        # Create notification for job failure
    
        await NotificationService.create_notification(
            user_id=user_id,
            title="Job Failed",
            message=f"Your scraping job '{job.get('name', 'Untitled')}' failed: {error_message[:150]}",
            notification_type="job_failed",
            job_id=str(job_id),
            metadata={
                "url": job.get("url", "unknown"),
                "error": error_message,
                "job_name": job.get("name", "Untitled")
            }
        )
        
        logger.info(f"Created failure notification for job {job_id}")

@router.get("/")
async def get_all_jobs(
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: dict = Depends(get_current_user)
):
    """Get all jobs for the current user"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    query = {"user_id": user_id_str}
    if status and status != "all":
        query["status"] = status
    
    cursor = db.jobs.find(query).sort("created_at", -1)
    jobs = [job_to_response(job) async for job in cursor]
    
    return jobs

@router.get("/{job_id}")
async def get_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific job by ID with its scraped data"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    job = await validate_job_access(job_id, user_id_str, db)
    return job_to_response(job)

@router.post("/")
async def create_job(
    job_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create a new job and optionally start it"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    if not job_data.get("name"):
        raise HTTPException(status_code=400, detail="Job name is required")
    if not job_data.get("url"):
        raise HTTPException(status_code=400, detail="Target URL is required")
    
    # Validate URL format
    url = job_data.get("url")
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    current_time = get_current_utc_time()
    
    new_job = {
        "name": job_data.get("name"),
        "url": url,
        "target": url,
        "status": "queued",
        "progress": 0,
        "records": 0,
        "frequency": job_data.get("frequency", "one-time"),
        "user_id": user_id_str,
        "created_at": current_time,
        "updated_at": current_time,
        "scraped_content": "",
        "error_message": None,
        "scraped_at": None
    }
    
    result = await db.jobs.insert_one(new_job)
    created_job = await db.jobs.find_one({"_id": result.inserted_id})
    
    await db.activities.insert_one({
        "type": "job",
        "title": "Job Created",
        "description": f"Created new job: {job_data.get('name')}",
        "user_id": user_id_str,
        "created_at": current_time
    })
    
    # Auto-start the job
    background_tasks.add_task(execute_scraping_job, str(result.inserted_id), user_id_str)
    
    return job_to_response(created_job)

@router.put("/{job_id}")
async def update_job(
    job_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a job"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    await validate_job_access(job_id, user_id_str, db)
    
    # Remove protected fields
    for field in ["_id", "id", "user_id", "created_at", "scraped_at"]:
        update_data.pop(field, None)
    
    update_data["updated_at"] = get_current_utc_time()
    
    await db.jobs.update_one(
        {"_id": ObjectId(job_id), "user_id": user_id_str},
        {"$set": update_data}
    )
    
    updated_job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    return job_to_response(updated_job)

@router.delete("/{job_id}")
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a job"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    result = await db.jobs.delete_one({
        "_id": ObjectId(job_id),
        "user_id": user_id_str
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    
    await db.scraped_data.delete_many({"job_id": job_id, "user_id": user_id_str})
    
    return {"message": "Job deleted successfully"}

@router.post("/{job_id}/start")
async def start_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Start a job - executes the scraping in background"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    job = await validate_job_access(job_id, user_id_str, db)
    
    if job.get("status") == "running":
        raise HTTPException(status_code=400, detail="Job is already running")
    
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": "queued",
            "progress": 0,
            "error_message": None,
            "updated_at": get_current_utc_time()
        }}
    )
    
    background_tasks.add_task(execute_scraping_job, job_id, user_id_str)
    
    return {"message": "Job started successfully", "job_id": job_id}

@router.post("/{job_id}/pause")
async def pause_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Pause a running job"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    await validate_job_access(job_id, user_id_str, db)
    
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "paused", "updated_at": get_current_utc_time()}}
    )
    
    return {"message": "Job paused successfully"}

@router.get("/{job_id}/parsed-results")
async def get_job_parsed_results(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get parsed results for a job"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    await validate_job_access(job_id, user_id_str, db)
    
    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)}).sort("created_at", -1)
    results = []
    
    async for result in cursor:
        results.append({
            "id": str(result["_id"]),
            "parse_description": result.get("parse_description", ""),
            "parsed_content": result.get("parsed_content", ""),
            "created_at": result.get("created_at", get_current_utc_time()).astimezone().isoformat() if result.get("created_at") else None
        })
    
    return {"parsed_results": results}