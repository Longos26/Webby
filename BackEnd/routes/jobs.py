# backend/routes/jobs.py - ENHANCED with full features

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import logging
import asyncio
from pydantic import BaseModel, Field
from mongodb.database import get_database
from routes.auth import get_current_user
from services.scraper_utils import (
    get_enhanced_scraper, 
    scrape_with_pagination, 
    deep_crawl_website,
    SmartContentDetector
)
from services.notification_service import NotificationService
from services.job_executor import job_executor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# New models for enhanced features
class DeepCrawlRequest(BaseModel):
    max_depth: int = Field(3, ge=1, le=5)
    max_pages: int = Field(500, ge=10, le=5000)
    follow_external: bool = False

class PaginationScrapeRequest(BaseModel):
    url: str
    max_pages: int = Field(100, ge=1, le=1000)
    detect_pagination: bool = True

class SmartScrapeRequest(BaseModel):
    url: str
    auto_detect_content: bool = True
    extract_structured_data: bool = True

def extract_user_id_str(current_user: dict) -> str:
    """Extract user_id as string from current_user dict"""
    user_id = current_user.get("id") or current_user.get("_id") or current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return str(user_id)

def get_current_utc_time():
    return datetime.now(timezone.utc)

def job_to_response(job: dict) -> dict:
    """Convert MongoDB job document to API response format"""
    def format_datetime(dt):
        if isinstance(dt, datetime):
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
        "scraped_at": format_datetime(job.get("scraped_at")) if job.get("scraped_at") else None,
        "pages_scraped": job.get("pages_scraped", 0),
        "total_pages": job.get("total_pages", 0),
        "crawl_depth": job.get("crawl_depth", 0),
        "content_type": job.get("content_type", {}),
        "detected_data": job.get("detected_data", {})
    }


@router.get("")
async def get_all_jobs(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get all jobs for the current user with pagination"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    query = {"user_id": user_id_str}
    if status and status != "all":
        query["status"] = status
    
    total = await db.jobs.count_documents(query)
    cursor = db.jobs.find(query).sort("created_at", -1).skip(offset).limit(limit)
    jobs = [job_to_response(job) async for job in cursor]
    
    return {
        "jobs": jobs,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/{job_id}")
async def get_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific job by ID"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    job = await db.jobs.find_one({
        "_id": ObjectId(job_id),
        "user_id": user_id_str
    })
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job_to_response(job)


@router.post("")
async def create_job(
    job_data: dict,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create a new job with enhanced scraping options"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    if not job_data.get("name"):
        raise HTTPException(status_code=400, detail="Job name is required")
    if not job_data.get("url"):
        raise HTTPException(status_code=400, detail="Target URL is required")
    
    url = job_data.get("url")
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # Enhanced job configuration
    scrape_mode = job_data.get("scrape_mode", "pagination")  # pagination, deep_crawl, smart
    max_pages = job_data.get("max_pages", 100)
    max_depth = job_data.get("max_depth", 3)
    
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
        "scraped_at": None,
        "scrape_mode": scrape_mode,
        "max_pages": max_pages,
        "max_depth": max_depth,
        "pages_scraped": 0,
        "crawl_depth": 0,
        "content_type": {},
        "detected_data": {}
    }
    
    result = await db.jobs.insert_one(new_job)
    created_job = await db.jobs.find_one({"_id": result.inserted_id})
    
    # Add activity log
    await db.activities.insert_one({
        "type": "job",
        "title": "Job Created",
        "description": f"Created new job: {job_data.get('name')} with {scrape_mode} mode",
        "user_id": user_id_str,
        "created_at": current_time
    })
    
    # Auto-start the job with enhanced scraping
    background_tasks.add_task(execute_enhanced_scraping_job, str(result.inserted_id), user_id_str)
    
    return job_to_response(created_job)


async def execute_enhanced_scraping_job(job_id: str, user_id: str):
    """Execute scraping job with pagination and deep crawling support"""
    db = await get_database()
    scraper = get_enhanced_scraper()
    
    try:
        logger.info(f"Starting enhanced scraping job {job_id}")
        
        # Get job details
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise Exception("Job not found")
        
        # Update status
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "running", "progress": 10, "updated_at": get_current_utc_time()}}
        )
        
        url = job.get("url")
        scrape_mode = job.get("scrape_mode", "pagination")
        
        results = []
        
        if scrape_mode == "deep_crawl":
            # Deep crawl mode
            max_depth = job.get("max_depth", 3)
            await db.jobs.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"progress": 20, "crawl_depth": 0}}
            )
            
            results = scraper.deep_crawl(url, max_depth)
            
            await db.jobs.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"progress": 60}}
            )
            
        elif scrape_mode == "smart":
            # Smart mode with content detection
            await db.jobs.update_one(
                {"_id": ObjectId(job_id)},
                {"$set": {"progress": 20}}
            )
            
            # First get main page to detect content
            main_results = scraper.scrape_with_pagination(url, max_pages=1)
            if main_results:
                # Detect content type
                content_type = SmartContentDetector.detect_content_type(main_results[0].get('raw_html', ''))
                detected_data = SmartContentDetector.extract_smart_data(main_results[0].get('raw_html', ''))
                
                await db.jobs.update_one(
                    {"_id": ObjectId(job_id)},
                    {"$set": {
                        "content_type": content_type,
                        "detected_data": detected_data,
                        "progress": 40
                    }}
                )
            
            # Then scrape all pages
            max_pages = job.get("max_pages", 100)
            results = scraper.scrape_with_pagination(url, max_pages)
            
        else:
            # Default pagination mode
            max_pages = job.get("max_pages", 100)
            results = scraper.scrape_with_pagination(url, max_pages)
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"progress": 80}}
        )
        
        # Combine all scraped content - REMOVE THE 1,000,000 CHARACTER LIMIT
        combined_content = ""
        all_structured_data = []
        
        for page_result in results:
            combined_content += page_result.get('raw_html', '') + "\n\n---PAGE BREAK---\n\n"
            # Extract structured data
            structured = {
                'url': page_result.get('url'),
                'title': page_result.get('title'),
                'description': page_result.get('description'),
                'price': page_result.get('price'),
                'email': page_result.get('email'),
                'phone': page_result.get('phone'),
                'images': page_result.get('images', [])[:10]
            }
            all_structured_data.append(structured)
        
        # Calculate total records
        records = len(results) * 10  # Estimate
        
        # Save results - REMOVE THE LIMIT HERE
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "status": "success",
                "progress": 100,
                "records": records,
                "scraped_content": combined_content,  # NO MORE LIMIT
                "scraped_at": get_current_utc_time(),
                "updated_at": get_current_utc_time(),
                "error_message": None,
                "pages_scraped": len(results),
                "structured_data": all_structured_data[:100],
                "total_pages": len(results)
            }}
        )
        
        # Save individual page results to a separate collection for analytics
        for page_result in results:
            await db.scraped_pages.insert_one({
                "job_id": ObjectId(job_id),
                "user_id": user_id,
                "url": page_result.get('url'),
                "title": page_result.get('title'),
                "description": page_result.get('description'),
                "page_number": page_result.get('page_number', 0),
                "scraped_at": get_current_utc_time()
            })
        
        # Add activity log
        await db.activities.insert_one({
            "type": "success",
            "title": "Enhanced Scraping Completed",
            "description": f"Successfully scraped {len(results)} pages from {url} using {scrape_mode} mode",
            "user_id": user_id,
            "created_at": get_current_utc_time(),
            "metadata": {
                "pages_scraped": len(results),
                "scrape_mode": scrape_mode,
                "total_records": records
            }
        })
        
        # Create notification
        await NotificationService.create_notification(
            user_id=user_id,
            title=f"Scraping Job Completed - {len(results)} Pages",
            message=f"Your job '{job.get('name', 'Untitled')}' completed. Scraped {len(results)} pages with {records} records.",
            notification_type="job_completed",
            job_id=str(job_id),
            metadata={
                "url": url,
                "pages": len(results),
                "records": records,
                "scrape_mode": scrape_mode
            }
        )
        
        logger.info(f"Enhanced scraping job {job_id} completed with {len(results)} pages")
        
    except Exception as e:
        error_message = str(e)
        logger.error(f"Enhanced scraping job {job_id} failed: {error_message}")
        
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "status": "failed",
                "progress": 0,
                "error_message": error_message,
                "updated_at": get_current_utc_time()
            }}
        )
        
        await db.activities.insert_one({
            "type": "error",
            "title": "Enhanced Scraping Failed",
            "description": f"Failed to scrape: {error_message[:200]}",
            "user_id": user_id,
            "created_at": get_current_utc_time()
        })
        
        await NotificationService.create_notification(
            user_id=user_id,
            title="Scraping Job Failed",
            message=f"Your job '{job.get('name', 'Untitled')}' failed: {error_message[:150]}",
            notification_type="job_failed",
            job_id=str(job_id),
            metadata={
                "url": job.get("url", "unknown"),
                "error": error_message
            }
        )


@router.post("/{job_id}/start")
async def start_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Start a job with enhanced scraping"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    job = await db.jobs.find_one({
        "_id": ObjectId(job_id),
        "user_id": user_id_str
    })
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
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
    
    background_tasks.add_task(execute_enhanced_scraping_job, job_id, user_id_str)
    
    return {"message": "Job started successfully", "job_id": job_id}


@router.post("/smart-scrape")
async def smart_scrape(
    request: SmartScrapeRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """AI-powered smart scraping with automatic detection"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    scraper = get_enhanced_scraper()
    
    # First, detect content type
    initial_results = scraper.scrape_with_pagination(request.url, max_pages=1)
    
    if not initial_results:
        raise HTTPException(status_code=500, detail="Failed to fetch initial page")
    
    content_type = SmartContentDetector.detect_content_type(initial_results[0].get('raw_html', ''))
    detected_data = SmartContentDetector.extract_smart_data(initial_results[0].get('raw_html', ''))
    
    # Determine best scraping strategy based on content type
    if content_type.get('ecommerce', 0) > 30 or content_type.get('product', 0) > 30:
        scrape_mode = "deep_crawl"
        max_depth = 3
        max_pages = 500
    elif content_type.get('article', 0) > 30 or content_type.get('blog', 0) > 30:
        scrape_mode = "pagination"
        max_depth = 2
        max_pages = 200
    else:
        scrape_mode = "smart"
        max_depth = 2
        max_pages = 100
    
    # Create job with smart settings
    job_data = {
        "name": f"Smart Scrape - {request.url[:50]}",
        "url": request.url,
        "scrape_mode": scrape_mode,
        "max_pages": max_pages,
        "max_depth": max_depth,
        "frequency": "one-time"
    }
    
    # Create and start job
    current_time = get_current_utc_time()
    
    new_job = {
        "name": job_data["name"],
        "url": request.url,
        "target": request.url,
        "status": "queued",
        "progress": 0,
        "records": 0,
        "frequency": "one-time",
        "user_id": user_id_str,
        "created_at": current_time,
        "updated_at": current_time,
        "scraped_content": "",
        "error_message": None,
        "scraped_at": None,
        "scrape_mode": scrape_mode,
        "max_pages": max_pages,
        "max_depth": max_depth,
        "pages_scraped": 0,
        "content_type": content_type,
        "detected_data": detected_data
    }
    
    result = await db.jobs.insert_one(new_job)
    
    background_tasks.add_task(execute_enhanced_scraping_job, str(result.inserted_id), user_id_str)
    
    return {
        "message": "Smart scraping job created",
        "job_id": str(result.inserted_id),
        "detected_content_type": content_type,
        "detected_data_summary": {
            "emails": len(detected_data.get('emails', [])),
            "phones": len(detected_data.get('phones', [])),
            "prices": len(detected_data.get('prices', [])),
            "urls": len(detected_data.get('urls', []))
        },
        "scrape_strategy": scrape_mode,
        "estimated_pages": max_pages
    }


@router.get("/analytics/dashboard")
async def get_scraping_analytics(
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive scraping analytics for dashboard"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    # Get job statistics
    total_jobs = await db.jobs.count_documents({"user_id": user_id_str})
    completed_jobs = await db.jobs.count_documents({"user_id": user_id_str, "status": "success"})
    failed_jobs = await db.jobs.count_documents({"user_id": user_id_str, "status": "failed"})
    running_jobs = await db.jobs.count_documents({"user_id": user_id_str, "status": "running"})
    
    # Get page statistics
    total_pages = await db.scraped_pages.count_documents({"user_id": user_id_str})
    
    # Get unique URLs scraped
    unique_urls = await db.scraped_pages.distinct("url", {"user_id": user_id_str})
    
    # Success rate
    success_rate = (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0
    
    # Recent activity timeline
    last_7_days = []
    for i in range(7, 0, -1):
        date = get_current_utc_time().replace(hour=0, minute=0, second=0, microsecond=0)
        # This is simplified - in production you'd have proper date aggregation
        last_7_days.append({
            "date": date.isoformat(),
            "jobs": 0,
            "pages": 0
        })
    
    return {
        "total_jobs": total_jobs,
        "completed_jobs": completed_jobs,
        "failed_jobs": failed_jobs,
        "running_jobs": running_jobs,
        "success_rate": round(success_rate, 1),
        "total_pages_scraped": total_pages,
        "unique_urls": len(unique_urls),
        "timeline": last_7_days
    }