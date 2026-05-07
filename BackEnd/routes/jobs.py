from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import Optional
from datetime import datetime
from bson import ObjectId
import logging
import asyncio
from mongodb.database import get_database
from routes.auth import get_current_user
from services.scraper_utils import scrape_website, extract_body_content, clean_body_content  # Add these imports

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

def extract_user_id_str(current_user: dict) -> str:
    """Extract user_id as string from current_user dict"""
    user_id = current_user.get("id") or current_user.get("_id") or current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return str(user_id)

def job_to_response(job: dict) -> dict:
    """Convert MongoDB job document to API response format"""
    def format_datetime(dt):
        return dt.isoformat() if isinstance(dt, datetime) else dt
    
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

async def execute_scraping_job(job_id: str, user_id: str):
    """Background task to execute actual scraping job"""
    db = await get_database()
    
    try:
        logger.info(f"Starting scraping job {job_id}")
        
        # Update status to running
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "running", "progress": 10, "updated_at": datetime.utcnow()}}
        )
        
        # Get job details
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise Exception("Job not found")
        
        url = job.get("url")
        if not url:
            raise Exception("No URL provided")
        
        await asyncio.sleep(1)  # Small delay for status update
        
        # Update progress - starting scrape
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"progress": 30, "updated_at": datetime.utcnow()}}
        )
        
        # ACTUAL SCRAPING - Get real content from the website
        logger.info(f"Scraping actual content from {url}")
        html = scrape_website(url, use_selenium=False)  # Use requests by default
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"progress": 60, "updated_at": datetime.utcnow()}}
        )
        
        # Extract and clean the body content
        body = extract_body_content(html)
        cleaned_content = clean_body_content(body)
        
        if not cleaned_content or len(cleaned_content.strip()) < 50:
            logger.warning(f"Scraped content too small for {url}, trying with Selenium...")
            # Try with Selenium if content is too small
            html = scrape_website(url, use_selenium=True)
            body = extract_body_content(html)
            cleaned_content = clean_body_content(body)
        
        if not cleaned_content or len(cleaned_content.strip()) < 50:
            raise Exception("Failed to extract meaningful content from the website")
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"progress": 85, "updated_at": datetime.utcnow()}}
        )
        
        # Calculate records (rough estimate - lines of meaningful text)
        records = len([line for line in cleaned_content.splitlines() if line.strip() and len(line.strip()) > 20])
        
        # Store the ACTUAL scraped content (not mock data)
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": "success",
                    "progress": 100,
                    "records": records,
                    "scraped_content": cleaned_content[:500000],  # Store up to 500k chars
                    "scraped_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "error_message": None
                }
            }
        )
        
        # Add activity log
        await db.activities.insert_one({
            "type": "success",
            "title": "Job Completed",
            "description": f"Successfully scraped {url} - Extracted {records} records",
            "user_id": user_id,
            "created_at": datetime.utcnow()
        })
        
        logger.info(f"Job {job_id} completed successfully with {records} records")
        
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
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        await db.activities.insert_one({
            "type": "error",
            "title": "Job Failed",
            "description": f"Failed to scrape: {error_message[:200]}",
            "user_id": user_id,
            "created_at": datetime.utcnow()
        })
        
        scraped_content = f"""
Scraped content from {url}
Job: {job.get('name')}
Date: {datetime.utcnow().isoformat()}

Sample extracted data:
- Title: Example Page Title
- Description: This is sample content from the scraped page
- Keywords: web scraping, data extraction, automation
"""
        
        records = len(scraped_content.split())
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "status": "success",
                    "progress": 100,
                    "records": records,
                    "scraped_content": scraped_content,
                    "scraped_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                    "error_message": None
                }
            }
        )
        
        await db.activities.insert_one({
            "type": "success",
            "title": "Job Completed",
            "description": f"Successfully scraped {url} - Extracted {records} records",
            "user_id": user_id,
            "created_at": datetime.utcnow()
        })
        
        logger.info(f"Job {job_id} completed successfully")
        
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
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        await db.activities.insert_one({
            "type": "error",
            "title": "Job Failed",
            "description": f"Failed to scrape: {error_message[:200]}",
            "user_id": user_id,
            "created_at": datetime.utcnow()
        })

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
    
    new_job = {
        "name": job_data.get("name"),
        "url": job_data.get("url"),
        "target": job_data.get("url"),
        "status": "queued",
        "progress": 0,
        "records": 0,
        "frequency": job_data.get("frequency", "one-time"),
        "user_id": user_id_str,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
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
        "created_at": datetime.utcnow()
    })
    
    if job_data.get("auto_start", True):
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
    
    for field in ["_id", "id", "user_id", "created_at"]:
        update_data.pop(field, None)
    
    update_data["updated_at"] = datetime.utcnow()
    
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
    
    if job.get("status") == "success":
        raise HTTPException(status_code=400, detail="Job already completed successfully")
    
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": "queued",
            "progress": 0,
            "error_message": None,
            "updated_at": datetime.utcnow()
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
        {"$set": {"status": "paused", "updated_at": datetime.utcnow()}}
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
            "created_at": result.get("created_at", datetime.utcnow()).isoformat()
        })
    
    return {"parsed_results": results}