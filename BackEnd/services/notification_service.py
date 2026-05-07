import logging
from datetime import datetime
from typing import Optional
from bson import ObjectId
from mongodb.database import get_database

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    async def create_notification(
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "job_completed",
        job_id: Optional[str] = None,
        metadata: Optional[dict] = None
    ):
        """Create a notification for a user"""
        db = await get_database()
        
        notification = {
            "user_id": user_id,
            "title": title,
            "message": message,
            "type": notification_type,
            "job_id": job_id,
            "metadata": metadata or {},
            "read": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.notifications.insert_one(notification)
        notification["id"] = str(result.inserted_id)
        
        logger.info(f"Created notification {result.inserted_id} for user {user_id}")
        return notification
    
    @staticmethod
    async def get_user_notifications(
        user_id: str,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ):
        """Get notifications for a user"""
        db = await get_database()
        
        query = {"user_id": user_id}
        if unread_only:
            query["read"] = False
        
        cursor = db.notifications.find(query).sort("created_at", -1).skip(offset).limit(limit)
        notifications = []
        
        async for notification in cursor:
            notification["id"] = str(notification["_id"])
            del notification["_id"]
            notifications.append(notification)
        
        # Get unread count
        unread_count = await db.notifications.count_documents({
            "user_id": user_id,
            "read": False
        })
        
        return {
            "notifications": notifications,
            "unread_count": unread_count,
            "total": await db.notifications.count_documents(query)
        }
    
    @staticmethod
    async def mark_as_read(notification_id: str, user_id: str):
        """Mark a specific notification as read"""
        db = await get_database()
        
        result = await db.notifications.update_one(
            {"_id": ObjectId(notification_id), "user_id": user_id},
            {"$set": {"read": True, "updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count > 0
    
    @staticmethod
    async def mark_all_as_read(user_id: str):
        """Mark all notifications as read for a user"""
        db = await get_database()
        
        result = await db.notifications.update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True, "updated_at": datetime.utcnow()}}
        )
        
        return result.modified_count
    
    @staticmethod
    async def delete_notification(notification_id: str, user_id: str):
        """Delete a notification"""
        db = await get_database()
        
        result = await db.notifications.delete_one({
            "_id": ObjectId(notification_id),
            "user_id": user_id
        })
        
        return result.deleted_count > 0
    
    @staticmethod
    async def delete_all_notifications(user_id: str):
        """Delete all notifications for a user"""
        db = await get_database()
        
        result = await db.notifications.delete_many({"user_id": user_id})
        return result.deleted_count