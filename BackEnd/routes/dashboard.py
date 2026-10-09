# backend/routes/dashboard.py - FIXED VERSION
from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from mongodb.database import get_database
from routes.auth import get_current_user
import logging
import re
from urllib.parse import urlparse
from routes.jobs import extract_user_id_str, job_to_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


# ============================================================
# HELPERS
# ============================================================

def _utcnow() -> datetime:
    """Timezone-aware UTC now (avoids deprecated utcnow)."""
    return datetime.now(timezone.utc)


def _to_naive_utc(dt: datetime) -> datetime:
    """Normalize any datetime to naive UTC for comparison."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


async def _get_date_range(db, user_id: str, days: int):
    """
    Anchor the query window to the LATEST job date for this user,
    falling back to now if no jobs exist.

    This fixes the 'future-dated jobs' problem where jobs stored with
    timestamps in the future (or a skewed server clock) would be
    excluded by a `now - days` filter.
    """
    latest = await db.jobs.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    end_date = latest["created_at"] if latest and latest.get("created_at") else _utcnow()
    end_date = _to_naive_utc(end_date)
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


async def _get_latest_activity_date(db, user_id: str) -> datetime:
    """
    Get the most recent date across jobs AND scraped_pages so charts
    aren't empty when jobs are stale but pages are fresh (or vice-versa).
    """
    latest_job = await db.jobs.find_one(
        {"user_id": user_id}, sort=[("created_at", -1)]
    )
    latest_page = await db.scraped_pages.find_one(
        {"user_id": user_id}, sort=[("scraped_at", -1)]
    )

    candidates = []
    if latest_job and latest_job.get("created_at"):
        candidates.append(_to_naive_utc(latest_job["created_at"]))
    if latest_page and latest_page.get("scraped_at"):
        candidates.append(_to_naive_utc(latest_page["scraped_at"]))

    if candidates:
        return max(candidates)
    return _utcnow()


def _is_success_status(status: Optional[str]) -> bool:
    if not status:
        return False
    return status.lower() in ("success", "completed", "done")


def _is_failed_status(status: Optional[str]) -> bool:
    if not status:
        return False
    return status.lower() in ("failed", "error")


# ============================================================
# SUCCESS RATE
# ============================================================

@router.get("/success-rate")
async def get_success_rate_analytics(
    days: int = 7,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        user_id = extract_user_id_str(current_user)
        start_date, end_date = await _get_date_range(db, user_id, days)

        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$created_at"
                            }
                        },
                        "status": {"$toLower": "$status"}
                    },
                    "count": {"$sum": 1}
                }
            }
        ]

        daily_stats_dict: Dict[str, Dict[str, int]] = {}
        async for doc in db.jobs.aggregate(pipeline):
            date = doc["_id"]["date"]
            status = doc["_id"]["status"] or ""
            count = doc["count"]

            if date not in daily_stats_dict:
                daily_stats_dict[date] = {"success": 0, "failed": 0, "total": 0}

            if status in ("success", "completed", "done"):
                daily_stats_dict[date]["success"] += count
            elif status in ("failed", "error"):
                daily_stats_dict[date]["failed"] += count

            daily_stats_dict[date]["total"] += count

        # Build a complete series (fill missing days with zeros)
        result = []
        total_success = 0
        total_jobs = 0

        for i in range(days):
            date_str = (end_date - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
            stats = daily_stats_dict.get(
                date_str, {"success": 0, "failed": 0, "total": 0}
            )
            success_rate = (
                (stats["success"] / stats["total"] * 100)
                if stats["total"] > 0 else 0
            )
            result.append({
                "date": date_str,
                "success_rate": round(success_rate, 1),
                "total_jobs": stats["total"],
                "successful": stats["success"],
                "failed": stats["failed"]
            })
            total_success += stats["success"]
            total_jobs += stats["total"]

        overall_rate = (
            (total_success / total_jobs * 100) if total_jobs > 0 else 0
        )

        return {
            "daily_stats": result,
            "overall_success_rate": round(overall_rate, 1)
        }

    except Exception as e:
        logger.error(f"Success rate error: {e}", exc_info=True)
        return {"daily_stats": [], "overall_success_rate": 0}


# ============================================================
# REALTIME METRICS
# ============================================================

@router.get("/realtime")
async def get_realtime_metrics(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        user_id = extract_user_id_str(current_user)
        now = _to_naive_utc(_utcnow())
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$facet": {
                    "active": [
                        {
                            "$match": {
                                "status": {
                                    "$in": ["running", "queued", "pending", "Running", "Queued"]
                                }
                            }
                        },
                        {"$count": "count"}
                    ],
                    "today": [
                        {"$match": {"created_at": {"$gte": today_start}}},
                        {
                            "$group": {
                                "_id": None,
                                "total_jobs": {"$sum": 1},
                                "total_records": {
                                    "$sum": {"$ifNull": ["$records", "$items_count", 0]}
                                }
                            }
                        }
                    ]
                }
            }
        ]

        result = await db.jobs.aggregate(pipeline).to_list(1)
        data = result[0] if result else {}

        active_count = 0
        if data.get("active"):
            active_count = data["active"][0].get("count", 0)

        today_data = data.get("today", [{}])[0] if data.get("today") else {}

        return {
            "active_jobs": active_count,
            "today_jobs": today_data.get("total_jobs", 0),
            "today_records": today_data.get("total_records", 0),
            "last_updated": _utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Realtime metrics error: {e}", exc_info=True)
        return {
            "active_jobs": 0,
            "today_jobs": 0,
            "today_records": 0,
            "last_updated": _utcnow().isoformat()
        }


# ============================================================
# EXPORT STATS
# ============================================================

@router.get("/export-stats")
async def get_export_statistics(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        user_id = extract_user_id_str(current_user)
        start_date, end_date = await _get_date_range(db, user_id, days)

        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_exports": {"$sum": 1},
                    "total_rows_exported": {
                        "$sum": {"$ifNull": ["$rows", "$row_count", 0]}
                    }
                }
            }
        ]

        result = await db.export_history.aggregate(pipeline).to_list(1)
        data = result[0] if result else {}

        return {
            "total_exports": data.get("total_exports", 0),
            "total_rows_exported": data.get("total_rows_exported", 0),
        }

    except Exception as e:
        logger.error(f"Export stats error: {e}", exc_info=True)
        return {"total_exports": 0, "total_rows_exported": 0}


# ============================================================
# PERFORMANCE METRICS
# ============================================================

@router.get("/performance")
async def get_performance_metrics(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get performance metrics (last 7 days of realtime data)."""
    try:
        user_id = extract_user_id_str(current_user)
        start_date, end_date = await _get_date_range(db, user_id, 7)

        # Average job duration for successful jobs
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "status": {"$in": ["success", "completed", "Success", "Completed"]},
                    "completed_at": {"$exists": True, "$ne": None},
                    "created_at": {"$exists": True, "$ne": None, "$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$project": {
                    "duration_seconds": {
                        "$divide": [
                            {"$subtract": ["$completed_at", "$created_at"]},
                            1000
                        ]
                    }
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_duration": {"$avg": "$duration_seconds"}
                }
            }
        ]

        cursor = db.jobs.aggregate(pipeline)
        result = await cursor.to_list(length=1)

        avg_duration = 0
        if result and result[0].get("avg_duration"):
            avg_duration = round(result[0]["avg_duration"], 2)

        # 7-day success rate
        seven_day_stats = await db.jobs.aggregate([
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {"$toLower": "$status"},
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(length=20)

        total = sum(stat["count"] for stat in seven_day_stats)
        success = sum(
            stat["count"] for stat in seven_day_stats
            if stat["_id"] in ("success", "completed", "done")
        )
        success_rate_7d = round((success / total * 100) if total > 0 else 0, 1)

        # Today's realtime metrics
        now = _to_naive_utc(_utcnow())
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        today_stats = await db.jobs.aggregate([
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": today_start}
                }
            },
            {
                "$group": {
                    "_id": {"$toLower": "$status"},
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(length=20)

        today_total = sum(stat["count"] for stat in today_stats)
        today_success = sum(
            stat["count"] for stat in today_stats
            if stat["_id"] in ("success", "completed", "done")
        )
        today_success_rate = round(
            (today_success / today_total * 100) if today_total > 0 else 0, 1
        )

        return {
            "average_job_duration_seconds": avg_duration,
            "success_rate_7d": success_rate_7d,
            "today_success_rate": today_success_rate,
            "today_total_jobs": today_total,
            "last_7_days_total_jobs": total,
            "last_updated": _utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in performance endpoint: {e}", exc_info=True)
        return {
            "average_job_duration_seconds": 0,
            "success_rate_7d": 0,
            "today_success_rate": 0,
            "today_total_jobs": 0,
            "last_7_days_total_jobs": 0,
            "last_updated": _utcnow().isoformat()
        }


# ============================================================
# RECENT JOBS
# ============================================================

@router.get("/recent")
async def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get recent jobs for the current user (light version)."""
    try:
        user_id_str = extract_user_id_str(current_user)

        cursor = db.jobs.find(
            {"user_id": user_id_str}
        ).sort("created_at", -1).limit(limit)

        jobs = []
        async for job in cursor:
            full_response = job_to_response(job)
            light_job = {
                "id": full_response["id"],
                "name": full_response["name"],
                "target": full_response["target"],
                "status": full_response["status"],
                "progress": full_response["progress"],
                "records": full_response["records"],
                "created_at": full_response["created_at"],
                "frequency": full_response["frequency"]
            }
            jobs.append(light_job)

        return jobs

    except Exception as e:
        logger.error(f"Error fetching recent jobs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch recent jobs")


# ============================================================
# JOBS BY STATUS (Pie Chart)
# ============================================================

@router.get("/jobs-by-status")
async def get_jobs_by_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get job counts grouped by status for pie chart."""
    try:
        user_id = extract_user_id_str(current_user)

        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": {"$toLower": "$status"},
                    "count": {"$sum": 1}
                }
            },
            {"$match": {"count": {"$gt": 0}}}
        ]

        results = await db.jobs.aggregate(pipeline).to_list(20)

        color_map = {
            "success": "#00ED64", "completed": "#00ED64", "done": "#00ED64",
            "running": "#58A6FF",
            "failed": "#F85149", "error": "#F85149",
            "paused": "#D29922",
            "queued": "#A371F7",
            "pending": "#A371F7",
            "cancelled": "#6E7681", "canceled": "#6E7681",
        }

        jobs_by_status = []
        for r in results:
            raw = (r["_id"] or "unknown").lower()
            display = raw.capitalize()
            if raw in ("success", "completed", "done"):
                display = "Success"
            elif raw in ("failed", "error"):
                display = "Failed"
            elif raw in ("cancelled", "canceled"):
                display = "Cancelled"

            jobs_by_status.append({
                "name": display,
                "value": r["count"],
                "color": color_map.get(raw, "#6E7681")
            })

        # Sort largest first
        jobs_by_status.sort(key=lambda x: x["value"], reverse=True)
        return jobs_by_status

    except Exception as e:
        logger.error(f"Jobs by status error: {e}", exc_info=True)
        return []


# ============================================================
# RECORDS OVER TIME (Area Chart)
# ============================================================

@router.get("/records-over-time")
async def get_records_over_time(
    days: int = Query(14, ge=1, le=90),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get records collected per day for area chart.
    Uses scraped_pages (real page records) with fallback to jobs.
    """
    try:
        user_id = extract_user_id_str(current_user)
        end_date = await _get_latest_activity_date(db, user_id)
        start_date = end_date - timedelta(days=days)

        # Primary source: scraped_pages (real per-page records)
        pages_pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "scraped_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$scraped_at"
                        }
                    },
                    "records": {"$sum": 1},
                    "job_ids": {"$addToSet": "$job_id"}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        pages_results = await db.scraped_pages.aggregate(pages_pipeline).to_list(days + 1)

        # Fallback: jobs collection (in case scraped_pages is empty)
        jobs_pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    },
                    "records": {"$sum": {"$ifNull": ["$records", 0]}},
                    "jobs": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        jobs_results = await db.jobs.aggregate(jobs_pipeline).to_list(days + 1)

        pages_map = {r["_id"]: r for r in pages_results}
        jobs_map = {r["_id"]: r for r in jobs_results}

        records_over_time = []
        for i in range(days):
            date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
            day_label = (start_date + timedelta(days=i)).strftime("%b %d")

            page_day = pages_map.get(date, {})
            job_day = jobs_map.get(date, {})

            page_records = page_day.get("records", 0)
            job_records = job_day.get("records", 0)
            job_count = job_day.get("jobs", 0) or len(page_day.get("job_ids", []) or [])

            # Prefer page-level record count if we have any, else fall back to jobs
            records = page_records if page_records > 0 else job_records

            records_over_time.append({
                "date": date,
                "day": day_label,
                "records": records,
                "jobs": job_count
            })

        return records_over_time

    except Exception as e:
        logger.error(f"Records over time error: {e}", exc_info=True)
        return []


# ============================================================
# HOURLY ACTIVITY (Bar Chart)
# ============================================================

@router.get("/hourly-activity")
async def get_hourly_activity(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get activity grouped by hour for bar chart (last 7 days)."""
    try:
        user_id = extract_user_id_str(current_user)
        end_date = await _get_latest_activity_date(db, user_id)
        start_date = end_date - timedelta(days=7)

        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {"$hour": "$created_at"},
                    "jobs": {"$sum": 1},
                    "records": {"$sum": {"$ifNull": ["$records", 0]}}
                }
            }
        ]

        results = await db.jobs.aggregate(pipeline).to_list(24)
        hourly_map = {r["_id"]: r for r in results}

        # If jobs are empty, try scraped_pages as fallback
        if not results:
            pages_pipeline = [
                {
                    "$match": {
                        "user_id": user_id,
                        "scraped_at": {"$gte": start_date, "$lte": end_date}
                    }
                },
                {
                    "$group": {
                        "_id": {"$hour": "$scraped_at"},
                        "jobs": {"$addToSet": "$job_id"},
                        "records": {"$sum": 1}
                    }
                }
            ]
            page_results = await db.scraped_pages.aggregate(pages_pipeline).to_list(24)
            for r in page_results:
                hourly_map[r["_id"]] = {
                    "_id": r["_id"],
                    "jobs": len(r.get("jobs", []) or []),
                    "records": r.get("records", 0)
                }

        hourly_activity = []
        for hour in range(0, 24, 4):
            jobs = sum(
                hourly_map.get(h, {}).get("jobs", 0)
                for h in range(hour, hour + 4)
            )
            records = sum(
                hourly_map.get(h, {}).get("records", 0)
                for h in range(hour, hour + 4)
            )
            hourly_activity.append({
                "hour": f"{str(hour).zfill(2)}:00",
                "jobs": jobs,
                "records": records
            })

        return hourly_activity

    except Exception as e:
        logger.error(f"Hourly activity error: {e}", exc_info=True)
        return []


# ============================================================
# MODEL USAGE
# ============================================================

@router.get("/model-usage")
async def get_model_usage(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get LLM model usage statistics from parsed results.
    Returns [] if nothing has been parsed yet (expected before first parse).
    """
    try:
        user_id = extract_user_id_str(current_user)

        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": "$model",
                    "count": {"$sum": 1},
                    "total_tokens": {"$sum": {"$ifNull": ["$tokens_used", 0]}},
                    "total_items": {"$sum": {"$ifNull": ["$items_extracted", 0]}}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]

        results = await db.parsed_results.aggregate(pipeline).to_list(10)

        if not results:
            return []

        total = sum(r["count"] for r in results)

        model_usage = []
        for r in results:
            model_name = r["_id"] or "Unknown"
            if "/" in model_name:
                model_name = model_name.split("/")[-1].split(":")[0][:25]

            model_usage.append({
                "name": model_name,
                "usage": round((r["count"] / total * 100), 1) if total > 0 else 0,
                "jobs": r["count"],
                "tokens": r.get("total_tokens", 0),
                "items": r.get("total_items", 0)
            })

        return model_usage

    except Exception as e:
        logger.error(f"Model usage error: {e}", exc_info=True)
        return []


# ============================================================
# TOP SITES
# ============================================================

@router.get("/top-sites")
async def get_top_sites(
    limit: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get top performing sites by records collected."""
    try:
        user_id = extract_user_id_str(current_user)

        # Aggregate scraped_pages by URL
        pipeline = [
            {"$match": {"user_id": user_id}},
            {
                "$group": {
                    "_id": "$url",
                    "pages": {"$sum": 1},
                    "job_ids": {"$addToSet": "$job_id"}
                }
            }
        ]

        results = await db.scraped_pages.aggregate(pipeline).to_list(5000)

        # Group by domain
        domain_stats: Dict[str, Dict[str, Any]] = {}

        for r in results:
            url = r["_id"] or ""
            try:
                domain = urlparse(url).netloc or url
            except Exception:
                domain = url

            if not domain:
                continue

            # Normalize domain (strip www.)
            if domain.startswith("www."):
                domain = domain[4:]

            if domain not in domain_stats:
                domain_stats[domain] = {"pages": 0, "job_ids": set()}
            domain_stats[domain]["pages"] += r["pages"]
            for jid in r.get("job_ids", []) or []:
                domain_stats[domain]["job_ids"].add(str(jid))

        # If no pages, fall back to jobs by URL
        if not domain_stats:
            jobs_cursor = db.jobs.find(
                {"user_id": user_id}, {"url": 1, "status": 1, "records": 1}
            )
            async for job in jobs_cursor:
                url = job.get("url", "")
                try:
                    domain = urlparse(url).netloc or url
                except Exception:
                    domain = url
                if domain.startswith("www."):
                    domain = domain[4:]
                if not domain:
                    continue
                if domain not in domain_stats:
                    domain_stats[domain] = {"pages": 0, "job_ids": set(), "records": 0}
                domain_stats[domain]["pages"] += 1
                domain_stats[domain]["records"] = (
                    domain_stats[domain].get("records", 0) + job.get("records", 0)
                )

        # Build top sites list
        top_sites = []
        sorted_domains = sorted(
            domain_stats.items(),
            key=lambda x: x[1]["pages"],
            reverse=True
        )[:limit]

        for domain, stats in sorted_domains:
            # Success rate from jobs matching this domain
            total = await db.jobs.count_documents({
                "user_id": user_id,
                "url": {"$regex": re.escape(domain), "$options": "i"}
            })
            success = await db.jobs.count_documents({
                "user_id": user_id,
                "url": {"$regex": re.escape(domain), "$options": "i"},
                "status": {"$in": ["success", "completed", "Success", "Completed"]}
            })

            if total > 0:
                success_rate = round(success / total * 100)
            else:
                success_rate = 100

            records = stats.get("records", 0) or stats["pages"]

            top_sites.append({
                "site": domain,
                "records": records,
                "pages": stats["pages"],
                "success": success_rate
            })

        return top_sites

    except Exception as e:
        logger.error(f"Top sites error: {e}", exc_info=True)
        return []


# ============================================================
# ACTIVITY FEED
# ============================================================

@router.get("/activity")
async def get_activity_feed(
    limit: int = Query(15, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get recent activity feed for dashboard."""
    try:
        user_id = extract_user_id_str(current_user)

        cursor = db.jobs.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(limit)

        activities = []
        async for job in cursor:
            status = (job.get("status") or "unknown").lower()

            if status in ("success", "completed", "done"):
                activity_type = "success"
                title = "Job Completed"
            elif status in ("failed", "error"):
                activity_type = "error"
                title = "Job Failed"
            elif status == "running":
                activity_type = "info"
                title = "Job Running"
            elif status == "queued":
                activity_type = "default"
                title = "Job Queued"
            else:
                activity_type = "default"
                title = f"Job {status.title()}"

            updated_at = job.get("updated_at") or job.get("created_at")

            activities.append({
                "id": str(job["_id"]),
                "type": activity_type,
                "title": title,
                "description": job.get("name", "Untitled job"),
                "url": job.get("url", ""),
                "records": job.get("records", 0),
                "created_at": updated_at.isoformat() if updated_at else None
            })

        return activities

    except Exception as e:
        logger.error(f"Activity feed error: {e}", exc_info=True)
        return []


# ============================================================
# DEBUG ENDPOINT — USE THIS TO DIAGNOSE
# ============================================================

@router.get("/debug")
async def debug_dashboard(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Diagnostic endpoint. Hit /api/dashboard/debug to see:
      - how many jobs, scraped_pages, parsed_results exist
      - sample documents with their field names & timestamp values
      - the effective date window your charts are using
      - the current server time
    """
    try:
        user_id = extract_user_id_str(current_user)

        jobs_count = await db.jobs.count_documents({"user_id": user_id})
        pages_count = await db.scraped_pages.count_documents({"user_id": user_id})
        parsed_count = await db.parsed_results.count_documents({})

        sample_jobs = await db.jobs.find({"user_id": user_id}).limit(3).to_list(3)
        sample_pages = await db.scraped_pages.find({"user_id": user_id}).limit(2).to_list(2)

        # Distinct user_id formats in jobs (to check for string vs ObjectId mismatch)
        distinct_user_ids = await db.jobs.distinct("user_id")

        # Distinct statuses
        statuses = await db.jobs.distinct("status", {"user_id": user_id})

        # Latest job date + date range used by charts
        start_7, end_7 = await _get_date_range(db, user_id, 7)
        latest_activity = await _get_latest_activity_date(db, user_id)

        def clean(doc):
            if not doc:
                return doc
            doc = dict(doc)
            doc["_id"] = str(doc["_id"])
            for k, v in list(doc.items()):
                if isinstance(v, datetime):
                    doc[k] = v.isoformat()
                elif hasattr(v, "__str__") and type(v).__name__ == "ObjectId":
                    doc[k] = str(v)
            return doc

        return {
            "user_id_used_in_query": user_id,
            "user_id_type": type(user_id).__name__,
            "distinct_user_ids_in_jobs": [str(u) for u in distinct_user_ids][:10],
            "jobs_count": jobs_count,
            "scraped_pages_count": pages_count,
            "parsed_results_count": parsed_count,
            "distinct_statuses": statuses,
            "date_window_7d": {
                "start": start_7.isoformat(),
                "end": end_7.isoformat(),
            },
            "latest_activity_date": latest_activity.isoformat(),
            "server_now_utc": _utcnow().isoformat(),
            "sample_jobs": [clean(j) for j in sample_jobs],
            "sample_pages": [clean(p) for p in sample_pages],
        }

    except Exception as e:
        logger.error(f"Debug endpoint error: {e}", exc_info=True)
        return {"error": str(e)}