# analytics_service.py
from datetime import datetime, timedelta
from typing import Dict, List
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self, db):
        self.db = db
    
    async def get_success_rate(self, user_id: str, days: int = 7) -> Dict:
        """Calculate success rate for jobs"""
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
            },
            {
                "$group": {
                    "_id": "$_id.date",
                    "statuses": {
                        "$push": {
                            "status": "$_id.status",
                            "count": "$count"
                        }
                    },
                    "total": {"$sum": "$count"}
                }
            }
        ]
        
        cursor = self.db.jobs.aggregate(pipeline)
        daily_stats = {}
        
        async for doc in cursor:
            date = doc["_id"]
            success_count = 0
            failed_count = 0
            
            for status in doc["statuses"]:
                if status["status"] in ["success", "completed"]:
                    success_count = status["count"]
                elif status["status"] in ["failed", "error"]:
                    failed_count = status["count"]
            
            total = doc["total"]
            success_rate = (success_count / total * 100) if total > 0 else 0
            
            daily_stats[date] = {
                "success_rate": round(success_rate, 1),
                "total_jobs": total,
                "successful": success_count,
                "failed": failed_count
            }
        
        # Fill missing dates
        result = []
        for i in range(days):
            date = (datetime.utcnow() - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
            stats = daily_stats.get(date, {
                "success_rate": 0,
                "total_jobs": 0,
                "successful": 0,
                "failed": 0
            })
            result.append({
                "date": date,
                **stats
            })
        
        return {
            "daily_stats": result,
            "overall_success_rate": self._calculate_overall_rate(result)
        }
    
    def _calculate_overall_rate(self, stats: List[Dict]) -> float:
        total_success = sum(s["successful"] for s in stats)
        total_jobs = sum(s["total_jobs"] for s in stats)
        return round((total_success / total_jobs * 100) if total_jobs > 0 else 0, 1)
    
    async def get_realtime_stats(self, user_id: str) -> Dict:
        """Get real-time statistics for dashboard"""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        active_jobs = await self.db.jobs.count_documents({
            "user_id": user_id,
            "status": {"$in": ["running", "queued"]}
        })
        
        today_jobs = await self.db.jobs.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": today_start}
        })
        
        # Count records from jobs created today
        jobs_today = await self.db.jobs.find({
            "user_id": user_id,
            "created_at": {"$gte": today_start},
            "records": {"$exists": True}
        }).to_list(length=100)
        
        today_records = sum(job.get("records", 0) for job in jobs_today)
        
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_errors = await self.db.jobs.count_documents({
            "user_id": user_id,
            "status": "failed",
            "updated_at": {"$gte": one_hour_ago}
        })
        
        return {
            "active_jobs": active_jobs,
            "today_jobs": today_jobs,
            "today_records": today_records,
            "recent_errors": recent_errors,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    async def get_export_stats(self, user_id: str, days: int = 30) -> Dict:
        """Get export statistics for user"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Check if collection exists
        collections = await self.db.list_collection_names()
        if "export_history" not in collections:
            return {
                "total_exports": 0,
                "total_rows_exported": 0,
                "exports_by_format": {}
            }
        
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "date": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$format",
                    "count": {"$sum": 1},
                    "total_rows": {"$sum": "$rows"}
                }
            }
        ]
        
        cursor = self.db.export_history.aggregate(pipeline)
        format_totals = defaultdict(int)
        total_exports = 0
        total_rows = 0
        
        async for doc in cursor:
            format_type = doc["_id"].lower() if doc["_id"] else "unknown"
            count = doc["count"]
            rows = doc["total_rows"]
            
            format_totals[format_type] = count
            total_exports += count
            total_rows += rows
        
        return {
            "total_exports": total_exports,
            "total_rows_exported": total_rows,
            "exports_by_format": dict(format_totals)
        }

analytics_service = None

async def get_analytics_service(db):
    global analytics_service
    if analytics_service is None:
        analytics_service = AnalyticsService(db)
    return analytics_service