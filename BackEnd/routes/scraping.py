# backend/routes/scraping.py
# COMPLETE UPDATED ROUTES — exposes pagination, deep crawl, and
# listing-with-details, plus all existing endpoints.

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime, timezone
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
    get_enhanced_scraper,
    scrape_with_pagination_full,
    deep_crawl_website,
    scrape_listing_with_details,
)

from services.job_executor import job_executor
from parsing.Ollama import parse_with_openrouter

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["scraping"])


# ============================================================
# REQUEST MODELS
# ============================================================

class ScrapeRequest(BaseModel):
    url: str
    use_selenium: Optional[bool] = False


class ScrapeAllRequest(BaseModel):
    url: str
    mode: Literal["pagination", "deep", "infinite"] = "pagination"
    max_pages: Optional[int] = Field(default=100, ge=1, le=5000)
    max_depth: Optional[int] = Field(default=2, ge=1, le=10)
    # For listing -> detail crawl:
    link_selector: Optional[str] = None


class ParseRequest(BaseModel):
    dom_content: Optional[str] = ""
    parse_description: str


class CreateJobRequest(BaseModel):
    name: str
    url: str
    frequency: Optional[str] = "one-time"


# ============================================================
# BASIC SCRAPE (single page, clean text)
# ============================================================

@router.post("/scraping/scrape")
async def scrape_endpoint(
    req: ScrapeRequest, current_user: dict = Depends(get_current_user)
):
    """Scrape a single page and return CLEANED text (no HTML)."""
    try:
        user_id = current_user.get("id") or current_user.get("_id")
        logger.info(f"Scraping URL: {req.url} for user {user_id}")

        cleaned = scrape_website(req.url, use_selenium=req.use_selenium)
        if not cleaned:
            raise HTTPException(
                status_code=500, detail="Failed to fetch website content"
            )

        chunks = split_dom_content(cleaned)
        return {
            "success": True,
            "cleaned_content": cleaned,
            "content_length": len(cleaned),
            "chunks": len(chunks),
            "url": req.url,
            "method": "selenium" if req.use_selenium else "requests",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scraping error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# FULL SCRAPE (pagination / deep crawl / infinite scroll /
#               listing-with-details)
# ============================================================

@router.post("/scraping/scrape-all")
async def scrape_all_endpoint(
    req: ScrapeAllRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Scrape ALL pages of a website.

    Modes:
      - pagination: follow Next / page-N links until exhausted
      - deep:       follow internal links up to max_depth
      - infinite:   use Selenium to scroll a Load-More page
    """
    try:
        user_id = current_user.get("id") or current_user.get("_id")
        logger.info(
            f"scrape-all mode={req.mode} url={req.url} user={user_id}"
        )

        scraper = get_enhanced_scraper()

        if req.mode == "deep":
            data = scraper.deep_crawl(req.url, max_depth=req.max_depth or 2)
            summary = {
                "pages_processed": len(data),
                "records_extracted": len(data),
                "duplicates_removed": 0,
                "detail_pages_processed": 0,
                "last_page": req.url,
                "data": data,
            }
        elif req.mode == "infinite":
            data = scraper.scrape_infinite_scroll(req.url)
            summary = {
                "pages_processed": 1,
                "records_extracted": len(data),
                "duplicates_removed": 0,
                "detail_pages_processed": 0,
                "last_page": req.url,
                "data": data,
            }
        else:
            summary = scraper.scrape_with_pagination_full(
                req.url, max_pages=req.max_pages or 100
            )

        return {
            "success": True,
            "mode": req.mode,
            "url": req.url,
            "pages_processed": summary["pages_processed"],
            "records_extracted": summary["records_extracted"],
            "duplicates_removed": summary["duplicates_removed"],
            "detail_pages_processed": summary.get("detail_pages_processed", 0),
            "last_page": summary["last_page"],
            "data": summary["data"],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"scrape-all error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# LISTING -> DETAIL CRAWL
# ============================================================

@router.post("/scraping/scrape-details")
async def scrape_details_endpoint(
    req: ScrapeAllRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Scrape a listing site with pagination, then visit each detail page.

    Requires `link_selector` (e.g. ".product a", "h3 a", ".book a").
    """
    if not req.link_selector:
        raise HTTPException(
            status_code=400,
            detail="link_selector is required for detail crawl",
        )
    try:
        user_id = current_user.get("id") or current_user.get("_id")
        logger.info(f"Detail crawl for {req.url} (user={user_id})")

        summary = scrape_listing_with_details(
            req.url,
            link_selector=req.link_selector,
            max_pages=req.max_pages or 100,
        )
        return {"success": True, "mode": "details", **summary}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detail crawl error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# PARSE (LLM)
# ============================================================

@router.post("/scraping/parse")
async def parse_endpoint(
    req: ParseRequest, current_user: dict = Depends(get_current_user)
):
    try:
        user_id = current_user.get("id") or current_user.get("_id")
        logger.info(f"Parsing content for user {user_id}")

        if not req.dom_content:
            return {"success": False, "result": "No content to parse"}

        chunks = split_dom_content(req.dom_content)
        result = parse_with_openrouter(chunks, req.parse_description)
        return {
            "success": True,
            "result": result,
            "chunks_processed": len(chunks),
        }
    except Exception as e:
        logger.error(f"Parsing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# JOBS
# ============================================================

@router.post("/jobs")
async def create_scraping_job(
    request: CreateJobRequest,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication failed")

    now = datetime.now(timezone.utc)
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
        "created_at": now,
        "updated_at": now,
        "scraped_at": None,
    }
    result = await db.jobs.insert_one(new_job)
    new_job["id"] = str(result.inserted_id)
    new_job["target"] = new_job["url"]

    logger.info(f"Created scraping job {result.inserted_id} for user {user_id}")
    # Strip _id before returning (already have "id")
    new_job.pop("_id", None)
    return new_job


@router.get("/jobs")
async def get_scraping_jobs(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication failed")

    query = {"user_id": user_id}
    if status:
        query["status"] = status

    cursor = db.jobs.find(query).sort("created_at", -1)
    jobs: List[dict] = []

    async for job in cursor:
        jobs.append({
            "id": str(job["_id"]),
            "name": job.get("name", ""),
            "url": job.get("url", ""),
            "target": job.get("url", ""),
            "status": job.get("status", "queued"),
            "progress": job.get("progress", 0),
            "records": job.get("records", 0),
            "frequency": job.get("frequency", "one-time"),
            "created_at": job["created_at"].isoformat()
                if job.get("created_at") else None,
            "updated_at": job["updated_at"].isoformat()
                if job.get("updated_at") else None,
            "scraped_content": job.get("scraped_content", ""),
            "error_message": job.get("error_message", ""),
        })
    return jobs


@router.get("/jobs/{job_id}")
async def get_scraping_job(
    job_id: str, current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")

    job = await db.jobs.find_one(
        {"_id": ObjectId(job_id), "user_id": user_id}
    )
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
        "created_at": job["created_at"].isoformat()
            if job.get("created_at") else None,
    }


@router.post("/jobs/{job_id}/start")
async def start_job(
    job_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User authentication failed")

    job = await db.jobs.find_one(
        {"_id": ObjectId(job_id), "user_id": user_id}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("status") == "running":
        return {"message": "Job is already running", "job_id": job_id}

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": "queued",
            "progress": 0,
            "error_message": None,
            "updated_at": datetime.now(timezone.utc),
        }},
    )

    background_tasks.add_task(job_executor.execute_job, job_id, user_id)

    logger.info(f"Job {job_id} queued for user {user_id}")
    return {"message": "Job started successfully",
            "job_id": job_id, "status": "queued"}


@router.post("/jobs/{job_id}/pause")
async def pause_job(
    job_id: str, current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")

    job = await db.jobs.find_one(
        {"_id": ObjectId(job_id), "user_id": user_id}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "running":
        raise HTTPException(status_code=400, detail="Job is not running")

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "paused",
                  "updated_at": datetime.now(timezone.utc)}},
    )
    return {"message": "Job paused", "job_id": job_id}


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str, current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")

    result = await db.jobs.delete_one(
        {"_id": ObjectId(job_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.parsed_results.delete_many({"job_id": ObjectId(job_id)})
    return {"message": "Job deleted successfully"}


# ============================================================
# JOB PARSING
# ============================================================

@router.post("/jobs/{job_id}/parse")
async def parse_job_content(
    job_id: str,
    parse_request: ParseRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")

        db = await get_database()
        user_id = current_user.get("id") or current_user.get("_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User authentication failed")

        job = await db.jobs.find_one(
            {"_id": ObjectId(job_id), "user_id": user_id}
        )
        if not job:
            raise HTTPException(status_code=404, detail="Job not found or access denied")

        scraped_content = job.get("scraped_content", "")
        if not scraped_content:
            raise HTTPException(
                status_code=400,
                detail="Job has no scraped content to parse. "
                       "Please run the scraping job first.",
            )

        chunks = split_dom_content(scraped_content)
        result = parse_with_openrouter(chunks, parse_request.parse_description)

        now = datetime.now(timezone.utc)
        await db.parsed_results.insert_one({
            "job_id": ObjectId(job_id),
            "user_id": user_id,
            "parse_description": parse_request.parse_description,
            "parsed_content": result,
            "created_at": now,
        })

        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "last_parsed_at": now,
                "last_parsed_description": parse_request.parse_description,
                "last_parsed_result": result[:500],
                "updated_at": now,
            }},
        )

        return {
            "success": True,
            "job_id": job_id,
            "parse_result": result,
            "chunks_processed": len(chunks),
            "message": "Content parsed successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Job parsing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/{job_id}/parsed-results")
async def get_parsed_results(
    job_id: str, current_user: dict = Depends(get_current_user)
):
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")

        db = await get_database()
        user_id = current_user.get("id") or current_user.get("_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User authentication failed")

        job = await db.jobs.find_one(
            {"_id": ObjectId(job_id), "user_id": user_id}
        )
        if not job:
            raise HTTPException(status_code=404, detail="Job not found or access denied")

        cursor = db.parsed_results.find(
            {"job_id": ObjectId(job_id)}
        ).sort("created_at", -1)

        results: List[dict] = []
        async for doc in cursor:
            results.append({
                "id": str(doc["_id"]),
                "parse_description": doc.get("parse_description", ""),
                "parsed_content": doc.get("parsed_content", ""),
                "created_at": doc.get("created_at", datetime.now(timezone.utc)).isoformat(),
            })

        return {
            "success": True,
            "job_id": job_id,
            "job_name": job.get("name", ""),
            "scraped_content_preview": (job.get("scraped_content") or "")[:500],
            "has_scraped_content": bool(job.get("scraped_content")),
            "parsed_results": results,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get parsed results error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get parsed results: {e}")


@router.delete("/results/{result_id}")
async def delete_parsed_result(
    result_id: str, current_user: dict = Depends(get_current_user)
):
    if not ObjectId.is_valid(result_id):
        raise HTTPException(status_code=400, detail="Invalid result ID format")

    db = await get_database()
    user_id = current_user.get("id") or current_user.get("_id")

    result = await db.parsed_results.delete_one(
        {"_id": ObjectId(result_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parse result not found")

    return {"message": "Parse result deleted successfully"}


@router.get("/scraping/test")
async def test_endpoint():
    SBR_WEBDRIVER = os.getenv("SBR_WEBDRIVER")
    return {
        "status": "ok",
        "message": "Scraping module is ready",
        "selenium_available": bool(SBR_WEBDRIVER),
    }