# backend/routes/monitoring.py - MONITORING & LOGS ENDPOINTS

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import logging

from mongodb.database import get_database
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])


def extract_user_id_str(current_user: dict) -> str:
    user_id = current_user.get("id") or current_user.get("_id") or current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return str(user_id)


# ============================================================
# LIVE JOBS
# ============================================================

@router.get("/live-jobs")
async def get_live_jobs(
    current_user: dict = Depends(get_current_user)
):
    """Get all currently running/queued jobs with live telemetry"""
    db = await get_database()
    user_id = extract_user_id_str(current_user)

    cursor = db.jobs.find({
        "user_id": user_id,
        "status": {"$in": ["running", "queued", "paused"]}
    }).sort("created_at", -1)

    jobs = []
    async for job in cursor:
        created = job.get("created_at")
        elapsed = 0
        if created:
            if isinstance(created, str):
                created = datetime.fromisoformat(created.replace("Z", "+00:00"))
            elapsed = (datetime.now(timezone.utc) - created.replace(tzinfo=timezone.utc)).total_seconds()

        jobs.append({
            "id": str(job["_id"]),
            "name": job.get("name", ""),
            "target": job.get("url") or job.get("target", ""),
            "status": job.get("status", "queued"),
            "progress": job.get("progress", 0),
            "records": job.get("records", 0),
            "pages_processed": job.get("pages_processed", 0),
            "pages_discovered": job.get("pages_discovered", 0),
            "duplicates_removed": job.get("duplicates_removed", 0),
            "records_skipped": job.get("records_skipped", 0),
            "detail_pages_processed": job.get("detail_pages_processed", 0),
            "last_page": job.get("last_page"),
            "current_url": job.get("current_url"),
            "error_message": job.get("error_message"),
            "errors": job.get("errors", [])[:10],
            "elapsed_seconds": round(elapsed, 1),
            "created_at": job["created_at"].isoformat() if job.get("created_at") else None,
            "updated_at": job["updated_at"].isoformat() if job.get("updated_at") else None,
        })

    return {"jobs": jobs, "count": len(jobs)}


# ============================================================
# EXECUTION LOGS
# ============================================================

@router.get("/logs")
async def get_execution_logs(
    level: Optional[str] = Query(None, description="Filter by level: info, warning, error, success"),
    job_id: Optional[str] = Query(None, description="Filter by job ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get execution logs from activities collection"""
    db = await get_database()
    user_id = extract_user_id_str(current_user)

    query = {"user_id": user_id}

    if level and level != "all":
        if level == "success":
            query["type"] = {"$in": ["success", "job_completed"]}
        elif level == "error":
            query["type"] = {"$in": ["error", "job_failed"]}
        else:
            query["type"] = level

    if job_id and ObjectId.is_valid(job_id):
        query["job_id"] = job_id

    total = await db.activities.count_documents(query)
    cursor = db.activities.find(query).sort("created_at", -1).skip(offset).limit(limit)

    logs = []
    async for activity in cursor:
        activity_type = activity.get("type", "info")
        level_map = {
            "success": "success",
            "job_completed": "success",
            "error": "error",
            "job_failed": "error",
            "warning": "warning",
        }

        logs.append({
            "id": str(activity["_id"]),
            "level": level_map.get(activity_type, "info"),
            "message": activity.get("description") or activity.get("title", ""),
            "title": activity.get("title", ""),
            "source": activity.get("source", "system"),
            "job_id": str(activity.get("job_id")) if activity.get("job_id") else None,
            "metadata": activity.get("metadata", {}),
            "timestamp": activity["created_at"].isoformat() if activity.get("created_at") else None,
        })

    return {
        "logs": logs,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


# ============================================================
# ERRORS
# ============================================================

@router.get("/errors")
async def get_errors(
    job_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    """Get all extraction errors"""
    db = await get_database()
    user_id = extract_user_id_str(current_user)

    # Get errors from activities
    query = {
        "user_id": user_id,
        "type": {"$in": ["error", "job_failed"]}
    }
    if job_id and ObjectId.is_valid(job_id):
        query["job_id"] = job_id

    cursor = db.activities.find(query).sort("created_at", -1).limit(limit)

    errors = []
    async for activity in cursor:
        errors.append({
            "id": str(activity["_id"]),
            "message": activity.get("description") or activity.get("title", ""),
            "job_id": str(activity.get("job_id")) if activity.get("job_id") else None,
            "url": activity.get("metadata", {}).get("url"),
            "error": activity.get("metadata", {}).get("error") or activity.get("description"),
            "timestamp": activity["created_at"].isoformat() if activity.get("created_at") else None,
        })

    # Also get errors from jobs that have errors array
    jobs_cursor = db.jobs.find({
        "user_id": user_id,
        "errors": {"$exists": True, "$ne": []}
    }).limit(20)

    async for job in jobs_cursor:
        for err in (job.get("errors") or [])[:5]:
            errors.append({
                "id": f"{job['_id']}_{err.get('url', 'unknown')[:20]}",
                "message": err.get("error", "Unknown error"),
                "job_id": str(job["_id"]),
                "job_name": job.get("name"),
                "url": err.get("url"),
                "error": err.get("error"),
                "timestamp": job.get("updated_at", job.get("created_at")).isoformat()
                    if job.get("updated_at") or job.get("created_at") else None,
            })

    return {"errors": errors[:limit], "count": len(errors[:limit])}


# ============================================================
# RETRY JOB
# ============================================================

@router.post("/retry/{job_id}")
async def retry_job(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retry a failed job"""
    db = await get_database()
    user_id = extract_user_id_str(current_user)

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await db.jobs.find_one({
        "_id": ObjectId(job_id),
        "user_id": user_id
    })

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Reset job status
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": "queued",
            "progress": 0,
            "error_message": None,
            "errors": [],
            "records": 0,
            "pages_processed": 0,
            "duplicates_removed": 0,
            "records_skipped": 0,
            "updated_at": datetime.now(timezone.utc),
        }}
    )

    # Trigger job execution
    from services.job_executor import job_executor
    import asyncio
    asyncio.create_task(job_executor.execute_job(job_id, user_id))

    # Log the retry
    await db.activities.insert_one({
        "type": "info",
        "title": "Job Retry Initiated",
        "description": f"Retrying job: {job.get('name')}",
        "user_id": user_id,
        "job_id": ObjectId(job_id),
        "source": "monitoring",
        "created_at": datetime.now(timezone.utc),
    })

    return {"message": "Job retry initiated", "job_id": job_id}


# ============================================================
# CANCEL JOB
# ============================================================

@router.post("/cancel/{job_id}")
async def cancel_job_monitoring(
    job_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a running job from monitoring"""
    db = await get_database()
    user_id = extract_user_id_str(current_user)

    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    job = await db.jobs.find_one({
        "_id": ObjectId(job_id),
        "user_id": user_id
    })

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.get("status") not in ("running", "queued", "paused"):
        raise HTTPException(status_code=400, detail="Job is not active")

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "status": "cancelled",
            "updated_at": datetime.now(timezone.utc),
        }}
    )

    # Log the cancellation
    await db.activities.insert_one({
        "type": "warning",
        "title": "Job Cancelled",
        "description": f"Job '{job.get('name')}' was cancelled by user",
        "user_id": user_id,
        "job_id": ObjectId(job_id),
        "source": "monitoring",
        "created_at": datetime.now(timezone.utc),
    })

    return {"message": "Job cancelled", "job_id": job_id}


# ============================================================
# DASHBOARD STATS
# ============================================================

@router.get("/stats")
async def get_monitoring_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get monitoring dashboard statistics"""
    db = await get_database()
    user_id = extract_user_id_str(current_user)

    # Job status counts
    running = await db.jobs.count_documents({"user_id": user_id, "status": "running"})
    completed = await db.jobs.count_documents({"user_id": user_id, "status": {"$in": ["success", "completed"]}})
    failed = await db.jobs.count_documents({"user_id": user_id, "status": "failed"})
    queued = await db.jobs.count_documents({"user_id": user_id, "status": "queued"})

    # Aggregate stats
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "total_records": {"$sum": "$records"},
            "total_pages": {"$sum": "$pages_processed"},
            "total_duplicates": {"$sum": "$duplicates_removed"},
        }}
    ]

    agg_result = None
    async for doc in db.jobs.aggregate(pipeline):
        agg_result = doc
        break

    # Recent errors count (last 24 hours)
    day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_errors = await db.activities.count_documents({
        "user_id": user_id,
        "type": {"$in": ["error", "job_failed"]},
        "created_at": {"$gte": day_ago}
    })

    return {
        "running": running,
        "completed": completed,
        "failed": failed,
        "queued": queued,
        "total_records": agg_result.get("total_records", 0) if agg_result else 0,
        "total_pages": agg_result.get("total_pages", 0) if agg_result else 0,
        "total_duplicates": agg_result.get("total_duplicates", 0) if agg_result else 0,
        "recent_errors_24h": recent_errors,
    }


# ============================================================
# LOG RETENTION / CLEANUP
# ============================================================

@router.delete("/logs/clear")
async def clear_old_logs(
    days: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user)
):
    """Clear logs older than N days"""
    db = await get_database()
    user_id = extract_user_id_str(current_user)

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.activities.delete_many({
        "user_id": user_id,
        "created_at": {"$lt": cutoff}
    })

    return {
        "message": f"Cleared {result.deleted_count} old log entries",
        "deleted_count": result.deleted_count,
        "older_than_days": days,
    }