
from datetime import datetime, timedelta, UTC
from typing import Dict, List, Optional, TypedDict, Literal, AsyncIterator
from collections import defaultdict
from enum import Enum
import asyncio
import logging
from functools import lru_cache, wraps
from dataclasses import dataclass, field
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import PyMongoError, OperationFailure
from cachetools import TTLCache, cached

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    """Job status enumeration for type safety"""
    SUCCESS = "success"
    COMPLETED = "completed"
    FAILED = "failed"
    ERROR = "error"
    RUNNING = "running"
    QUEUED = "queued"
    PENDING = "pending"
    
    @classmethod
    def success_statuses(cls) -> set:
        return {cls.SUCCESS, cls.COMPLETED}
    
    @classmethod
    def failed_statuses(cls) -> set:
        return {cls.FAILED, cls.ERROR}
    
    @classmethod
    def active_statuses(cls) -> set:
        return {cls.RUNNING, cls.QUEUED}


class ExportFormat(str, Enum):
    """Export format enumeration"""
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    PDF = "pdf"
    UNKNOWN = "unknown"


class DailyStats(TypedDict):
    """Type definition for daily statistics"""
    success_rate: float
    total_jobs: int
    successful: int
    failed: int


class DailyStatsResponse(TypedDict):
    """Daily stats response with date"""
    date: str
    success_rate: float
    total_jobs: int
    successful: int
    failed: int


class SuccessRateResponse(TypedDict):
    """Complete success rate response"""
    daily_stats: List[DailyStatsResponse]
    overall_success_rate: float


class RealtimeStatsResponse(TypedDict):
    """Real-time dashboard statistics"""
    active_jobs: int
    today_jobs: int
    today_records: int
    recent_errors: int
    last_updated: str


class ExportStatsResponse(TypedDict):
    """Export statistics response"""
    total_exports: int
    total_rows_exported: int
    exports_by_format: Dict[str, int]


@dataclass
class QueryConfig:
    """Configuration for database queries"""
    max_days: int = 365
    default_days: int = 7
    max_batch_size: int = 1000
    query_timeout_seconds: int = 30
    cache_ttl_seconds: int = 300


class AnalyticsServiceError(Exception):
    """Custom exception for analytics service errors"""
    pass


def with_error_handling(func):
    """Decorator for consistent error handling"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except PyMongoError as e:
            logger.error(f"Database error in {func.__name__}: {e}", exc_info=True)
            raise AnalyticsServiceError(f"Database operation failed: {str(e)}") from e
        except ValueError as e:
            logger.error(f"Validation error in {func.__name__}: {e}")
            raise AnalyticsServiceError(f"Invalid input: {str(e)}") from e
        except Exception as e:
            logger.error(f"Unexpected error in {func.__name__}: {e}", exc_info=True)
            raise AnalyticsServiceError(f"Operation failed: {str(e)}") from e
    return wrapper


class AnalyticsService:
    """
    Modern analytics service with caching, type safety, and optimized queries
    """
    
    def __init__(
        self, 
        db: AsyncIOMotorDatabase,
        config: Optional[QueryConfig] = None,
        cache_size: int = 100
    ):
        """
        Initialize analytics service
        
        Args:
            db: MongoDB database connection
            config: Query configuration settings
            cache_size: Size of LRU cache for results
        """
        self.db = db
        self.config = config or QueryConfig()
        self._cache = TTLCache(maxsize=cache_size, ttl=self.config.cache_ttl_seconds)
        
        # Collection references for easier access
        self.jobs_collection = db.jobs
        self.export_history_collection = db.export_history
    
    def _validate_days(self, days: int, max_days: Optional[int] = None) -> int:
        """Validate and sanitize days parameter"""
        max_allowed = max_days or self.config.max_days
        if days < 1:
            logger.warning(f"Days parameter {days} less than 1, using default 1")
            return 1
        if days > max_allowed:
            logger.warning(f"Days {days} exceeds max {max_allowed}, capping")
            return max_allowed
        return days
    
    def _validate_user_id(self, user_id: str) -> str:
        """Validate user_id format"""
        if not user_id or not isinstance(user_id, str):
            raise ValueError("Invalid user_id: must be non-empty string")
        return user_id.strip()
    
    @cached(cache={})
    @with_error_handling
    async def get_success_rate(
        self, 
        user_id: str, 
        days: int = 7
    ) -> SuccessRateResponse:
        """
        Calculate success rate for jobs with optimized aggregation pipeline
        
        Args:
            user_id: User identifier
            days: Number of days to analyze (capped at config.max_days)
        
        Returns:
            Success rate statistics with daily breakdown
        """
        user_id = self._validate_user_id(user_id)
        days = self._validate_days(days)
        start_date = datetime.now(UTC) - timedelta(days=days)
        
        # Optimized pipeline with single pass aggregation
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": start_date},
                    "status": {"$in": list(JobStatus)}
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                        "is_success": {
                            "$in": ["$status", list(JobStatus.success_statuses())]
                        }
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.date",
                    "successful": {
                        "$sum": {
                            "$cond": [{"$eq": ["$_id.is_success", True]}, "$count", 0]
                        }
                    },
                    "failed": {
                        "$sum": {
                            "$cond": [{"$eq": ["$_id.is_success", False]}, "$count", 0]
                        }
                    },
                    "total": {"$sum": "$count"}
                }
            },
            {
                "$project": {
                    "success_rate": {
                        "$round": [
                            {"$multiply": [
                                {"$divide": ["$successful", {"$max": ["$total", 1]}]},
                                100
                            ]},
                            1
                        ]
                    },
                    "total_jobs": "$total",
                    "successful": 1,
                    "failed": 1
                }
            }
        ]
        
        try:
            cursor = self.jobs_collection.aggregate(
                pipeline, 
                maxTimeMS=self.config.query_timeout_seconds * 1000
            )
            daily_stats = {}
            
            async for doc in cursor:
                date = doc["_id"]
                daily_stats[date] = DailyStats(
                    success_rate=doc["success_rate"],
                    total_jobs=doc["total_jobs"],
                    successful=doc["successful"],
                    failed=doc["failed"]
                )
            
            # Fill missing dates with zero stats
            result: List[DailyStatsResponse] = []
            total_successful = 0
            total_jobs = 0
            
            for i in range(days):
                date = (datetime.now(UTC) - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
                stats = daily_stats.get(date, DailyStats(
                    success_rate=0.0,
                    total_jobs=0,
                    successful=0,
                    failed=0
                ))
                
                result.append(DailyStatsResponse(date=date, **stats))
                total_successful += stats["successful"]
                total_jobs += stats["total_jobs"]
            
            overall_rate = round(
                (total_successful / total_jobs * 100) if total_jobs > 0 else 0, 
                1
            )
            
            return SuccessRateResponse(
                daily_stats=result,
                overall_success_rate=overall_rate
            )
            
        except OperationFailure as e:
            logger.error(f"Aggregation failed for user {user_id}: {e}")
            raise AnalyticsServiceError(f"Failed to calculate success rate: {str(e)}")
    
    @with_error_handling
    async def get_realtime_stats(self, user_id: str) -> RealtimeStatsResponse:
        """
        Get real-time statistics for dashboard using parallel queries
        
        Args:
            user_id: User identifier
        
        Returns:
            Real-time dashboard statistics
        """
        user_id = self._validate_user_id(user_id)
        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        one_hour_ago = datetime.now(UTC) - timedelta(hours=1)
        
        # Execute independent queries in parallel for better performance
        active_jobs_query = self.jobs_collection.count_documents({
            "user_id": user_id,
            "status": {"$in": list(JobStatus.active_statuses())}
        })
        
        today_jobs_query = self.jobs_collection.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": today_start}
        })
        
        recent_errors_query = self.jobs_collection.count_documents({
            "user_id": user_id,
            "status": {"$in": list(JobStatus.failed_statuses())},
            "updated_at": {"$gte": one_hour_ago}
        })
        
        # Optimized records query with projection to reduce data transfer
        today_records_query = self.jobs_collection.aggregate([
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": today_start},
                    "records": {"$exists": True, "$gte": 0}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_records": {"$sum": "$records"}
                }
            }
        ]).to_list(length=1)
        
        # Run queries concurrently
        active_jobs, today_jobs, recent_errors, records_result = await asyncio.gather(
            active_jobs_query,
            today_jobs_query,
            recent_errors_query,
            today_records_query
        )
        
        today_records = records_result[0]["total_records"] if records_result else 0
        
        return RealtimeStatsResponse(
            active_jobs=active_jobs,
            today_jobs=today_jobs,
            today_records=today_records,
            recent_errors=recent_errors,
            last_updated=datetime.now(UTC).isoformat()
        )
    
    @with_error_handling
    async def get_export_stats(
        self, 
        user_id: str, 
        days: int = 30
    ) -> ExportStatsResponse:
        """
        Get export statistics with optimized aggregation
        
        Args:
            user_id: User identifier
            days: Number of days to analyze
        
        Returns:
            Export statistics by format
        """
        user_id = self._validate_user_id(user_id)
        days = self._validate_days(days)
        start_date = datetime.now(UTC) - timedelta(days=days)
        
        # Check if collection exists without loading all collections
        try:
            # Use list_collection_names with filter for efficiency
            collections = await self.db.list_collection_names(
                filter={"name": "export_history"}
            )
            if "export_history" not in collections:
                logger.info(f"Export history collection not found for user {user_id}")
                return ExportStatsResponse(
                    total_exports=0,
                    total_rows_exported=0,
                    exports_by_format={}
                )
        except PyMongoError as e:
            logger.warning(f"Failed to check export_history collection: {e}")
            return ExportStatsResponse(
                total_exports=0,
                total_rows_exported=0,
                exports_by_format={}
            )
        
        # Optimized pipeline with proper error handling for null values
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "date": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$toLower": {
                            "$ifNull": ["$format", ExportFormat.UNKNOWN.value]
                        }
                    },
                    "count": {"$sum": 1},
                    "total_rows": {"$sum": {"$ifNull": ["$rows", 0]}}
                }
            },
            {
                "$sort": {"count": -1}  # Sort by most used format
            }
        ]
        
        try:
            cursor = self.export_history_collection.aggregate(
                pipeline,
                maxTimeMS=self.config.query_timeout_seconds * 1000
            )
            
            exports_by_format = {}
            total_exports = 0
            total_rows = 0
            
            async for doc in cursor:
                format_type = doc["_id"] or ExportFormat.UNKNOWN.value
                count = doc["count"]
                rows = doc["total_rows"]
                
                exports_by_format[format_type] = count
                total_exports += count
                total_rows += rows
            
            return ExportStatsResponse(
                total_exports=total_exports,
                total_rows_exported=total_rows,
                exports_by_format=exports_by_format
            )
            
        except OperationFailure as e:
            logger.error(f"Export stats aggregation failed: {e}")
            return ExportStatsResponse(
                total_exports=0,
                total_rows_exported=0,
                exports_by_format={}
            )
    
    def invalidate_cache(self, user_id: Optional[str] = None):
        """
        Invalidate cached results for a specific user or all users
        
        Args:
            user_id: Optional specific user to invalidate
        """
        if user_id:
            # Invalidate cache keys containing this user_id
            keys_to_remove = [
                k for k in self._cache.keys() 
                if isinstance(k, tuple) and user_id in str(k)
            ]
            for key in keys_to_remove:
                del self._cache[key]
            logger.debug(f"Invalidated cache for user {user_id}")
        else:
            self._cache.clear()
            logger.debug("Invalidated entire cache")
    
    async def health_check(self) -> Dict:
        """
        Check service health and database connectivity
        
        Returns:
            Health status dictionary
        """
        try:
            # Test database connectivity
            await self.db.command("ping")
            return {
                "status": "healthy",
                "database": "connected",
                "timestamp": datetime.now(UTC).isoformat()
            }
        except PyMongoError as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now(UTC).isoformat()
            }


# Dependency injection for FastAPI integration
async def get_analytics_service(
    db: AsyncIOMotorDatabase,
    config: Optional[QueryConfig] = None
) -> AnalyticsService:
    """
    Factory function for creating AnalyticsService instances
    Use this for FastAPI dependency injection
    
    Args:
        db: Database connection
        config: Optional configuration
    
    Returns:
        Configured AnalyticsService instance
    """
    # Each request gets its own instance for better isolation
    # Remove global singleton pattern for testability
    return AnalyticsService(db, config)


# Optional: Singleton for backward compatibility (deprecated)
_deprecated_analytics_service: Optional[AnalyticsService] = None


async def get_analytics_service_deprecated(db: AsyncIOMotorDatabase) -> AnalyticsService:
    """
    DEPRECATED: Use get_analytics_service instead
    Maintained for backward compatibility
    """
    import warnings
    warnings.warn(
        "get_analytics_service_deprecated is deprecated, use get_analytics_service",
        DeprecationWarning,
        stacklevel=2
    )
    
    global _deprecated_analytics_service
    if _deprecated_analytics_service is None:
        _deprecated_analytics_service = AnalyticsService(db)
    return _deprecated_analytics_service