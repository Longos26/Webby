from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from mongodb.database import get_database
from routes.auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/activity", tags=["activities"])

@router.get("/recent")
async def get_recent_activities(
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get recent activities for the user"""
    try:
        user_id = str(current_user.get("_id") or current_user.get("id"))
        
        # Check if activities collection exists
        collections = await db.list_collection_names()
        if "activities" not in collections:
            return []
        
        # Get recent activities
        cursor = db.activities.find({"user_id": user_id}).sort("created_at", -1).limit(limit)
        activities = []
        
        async for activity in cursor:
            created_at = activity.get("created_at", datetime.utcnow())
            time_ago = get_time_ago(created_at)
            
            activities.append({
                "id": str(activity["_id"]),
                "type": activity.get("type", "info"),
                "title": activity.get("title", "Activity"),
                "description": activity.get("description", ""),
                "timeAgo": time_ago,
                "created_at": created_at.isoformat() if hasattr(created_at, 'isoformat') else str(created_at)
            })
        
        return activities
    except Exception as e:
        logger.error(f"Error fetching recent activities: {e}")
        return []

def get_time_ago(dt):
    """Convert datetime to time ago string"""
    if not dt:
        return "just now"
    
    try:
        now = datetime.utcnow()
        diff = now - dt
        
        if diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            return f"{diff.seconds // 3600}h ago"
        elif diff.seconds > 60:
            return f"{diff.seconds // 60}m ago"
        else:
            return "just now"
    except:
        return "just now"