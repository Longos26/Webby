from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone
from mongodb.database import get_database
from routes.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

def extract_user_id_str(current_user: dict) -> str:
    user_id = current_user.get("id") or current_user.get("_id") or current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")
    return str(user_id)

@router.get("")
async def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get all notifications for the current user"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    query = {"user_id": user_id_str}
    
    cursor = db.notifications.find(query).sort("created_at", -1).skip(offset).limit(limit)
    notifications = []
    
    async for notif in cursor:
        notifications.append({
            "id": str(notif["_id"]),
            "title": notif.get("title", ""),
            "message": notif.get("message", ""),
            "type": notif.get("type", "info"),
            "read": notif.get("read", False),
            "created_at": notif.get("created_at", datetime.utcnow()).isoformat() if notif.get("created_at") else None,
            "job_id": notif.get("job_id"),
            "metadata": notif.get("metadata", {})
        })
    
    unread_count = await db.notifications.count_documents({"user_id": user_id_str, "read": False})
    
    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total": await db.notifications.count_documents(query)
    }

@router.get("/unread/count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    count = await db.notifications.count_documents({"user_id": user_id_str, "read": False})
    return {"unread_count": count}

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    
    result = await db.notifications.update_one(
        {"_id": ObjectId(notification_id), "user_id": user_id_str},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    result = await db.notifications.update_many(
        {"user_id": user_id_str, "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": f"Marked {result.modified_count} notifications as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific notification"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    
    result = await db.notifications.delete_one({
        "_id": ObjectId(notification_id),
        "user_id": user_id_str
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}

@router.delete("/clear")
async def clear_all_notifications(current_user: dict = Depends(get_current_user)):
    """Delete all notifications for the current user"""
    db = await get_database()
    user_id_str = extract_user_id_str(current_user)
    
    result = await db.notifications.delete_many({"user_id": user_id_str})
    return {"message": f"Deleted {result.deleted_count} notifications"}