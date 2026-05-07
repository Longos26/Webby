from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timedelta
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from mongodb.database import get_database
from routes.auth import get_current_user
import logging
from routes.jobs import extract_user_id_str, job_to_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/success-rate")
async def get_success_rate_analytics(
    days: int = 7,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        start_date = datetime.utcnow() - timedelta(days=days)

        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                        "status": "$status"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]

        daily_stats_dict = {}
        async for doc in db.jobs.aggregate(pipeline):
            date = doc["_id"]["date"]
            status = doc["_id"]["status"]
            count = doc["count"]

            if date not in daily_stats_dict:
                daily_stats_dict[date] = {"success": 0, "failed": 0, "total": 0}

            if status in ["success", "completed"]:
                daily_stats_dict[date]["success"] += count
            elif status in ["failed", "error"]:
                daily_stats_dict[date]["failed"] += count

            daily_stats_dict[date]["total"] += count

        # Build result for frontend
        result = []
        total_success = 0
        total_jobs = 0

        for i in range(days):
            date_str = (datetime.utcnow() - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
            stats = daily_stats_dict.get(date_str, {"success": 0, "failed": 0, "total": 0})
            
            success_rate = (stats["success"] / stats["total"] * 100) if stats["total"] > 0 else 0

            result.append({
                "date": date_str,
                "success_rate": round(success_rate, 1),
                "total_jobs": stats["total"],
                "successful": stats["success"],
                "failed": stats["failed"]
            })

            total_success += stats["success"]
            total_jobs += stats["total"]

        overall_rate = (total_success / total_jobs * 100) if total_jobs > 0 else 0

        return {
            "daily_stats": result,
            "overall_success_rate": round(overall_rate, 1)
        }

    except Exception as e:
        logger.error(f"Success rate error: {e}", exc_info=True)
        return {"daily_stats": [], "overall_success_rate": 0}

@router.get("/realtime")
async def get_realtime_metrics(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        pipeline = [
            {
                "$match": {
                    "user_id": user_id
                }
            },
            {
                "$facet": {
                    "active": [
                        {"$match": {"status": {"$in": ["running", "queued", "pending"]}}},
                        {"$count": "count"}
                    ],
                    "today": [
                        {"$match": {"created_at": {"$gte": today_start}}},
                        {
                            "$group": {
                                "_id": None,
                                "total_jobs": {"$sum": 1},
                                "total_records": {"$sum": {"$ifNull": ["$records", "$items_count", 0]}}
                            }
                        }
                    ]
                }
            }
        ]

        result = await db.jobs.aggregate(pipeline).to_list(1)
        data = result[0] if result else {}

        active_count = data.get("active", [{}])[0].get("count", 0) if data.get("active") else 0
        today_data = data.get("today", [{}])[0] if data.get("today") else {}

        return {
            "active_jobs": active_count,
            "today_jobs": today_data.get("total_jobs", 0),
            "today_records": today_data.get("total_records", 0),
            "last_updated": now.isoformat()
        }

    except Exception as e:
        logger.error(f"Realtime metrics error: {e}", exc_info=True)
        return {
            "active_jobs": 0,
            "today_jobs": 0,
            "today_records": 0,
            "last_updated": datetime.utcnow().isoformat()
        }
@router.get("/export-stats")
async def get_export_statistics(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        start_date = datetime.utcnow() - timedelta(days=days)

        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_exports": {"$sum": 1},
                    "total_rows_exported": {"$sum": {"$ifNull": ["$rows", "$row_count", 0]}}
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
        return {
            "total_exports": 0,
            "total_rows_exported": 0,
        }

@router.get("/performance")
async def get_performance_metrics(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get performance metrics (last 7 days realtime data)"""
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        # Get average job duration for successful jobs in last 7 days
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "status": {"$in": ["success", "completed"]},
                    "completed_at": {"$exists": True, "$ne": None},
                    "created_at": {"$exists": True, "$ne": None},
                    "created_at": {"$gte": seven_days_ago}  # Only last 7 days
                }
            },
            {
                "$project": {
                    "duration_seconds": {
                                "$divide": [
                                    {"$subtract": ["$completed_at", "$created_at"]},
                                    1000  # Convert milliseconds to seconds
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
        
        # Get success rate for last 7 days
        seven_day_stats = await db.jobs.aggregate([
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": seven_days_ago}
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(length=10)
        
        total = sum(stat["count"] for stat in seven_day_stats)
        success = sum(stat["count"] for stat in seven_day_stats 
                     if stat["_id"] in ["success", "completed"])
        success_rate_7d = round((success / total * 100) if total > 0 else 0, 1)
        
        # Also get today's realtime metrics
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_stats = await db.jobs.aggregate([
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": today_start}
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]).to_list(length=10)
        
        today_total = sum(stat["count"] for stat in today_stats)
        today_success = sum(stat["count"] for stat in today_stats 
                          if stat["_id"] in ["success", "completed"])
        today_success_rate = round((today_success / today_total * 100) if today_total > 0 else 0, 1)
        
        return {
            "average_job_duration_seconds": avg_duration,
            "success_rate_7d": success_rate_7d,
            "today_success_rate": today_success_rate,
            "today_total_jobs": today_total,
            "last_7_days_total_jobs": total,
            "last_updated": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in performance endpoint: {e}", exc_info=True)
        return {
            "average_job_duration_seconds": 0,
            "success_rate_7d": 0,
            "today_success_rate": 0,
            "today_total_jobs": 0,
            "last_7_days_total_jobs": 0,
            "last_updated": datetime.utcnow().isoformat()
        }

@router.get("/recent")
async def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get recent jobs for the current user (light version)"""
    try:
        user_id_str = extract_user_id_str(current_user)
        
        cursor = db.jobs.find(
            {"user_id": user_id_str}
        ).sort("created_at", -1).limit(limit)
        
        jobs = []
        async for job in cursor:
            full_response = job_to_response(job)
            # Keep only the fields needed for "recent" view to reduce payload
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
