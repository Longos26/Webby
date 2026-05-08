from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timezone
import json
from fastapi.responses import StreamingResponse

from mongodb.database import get_database
from routes.auth import get_current_user
from services.notification_service import NotificationService
from routes.jobs import extract_user_id_str

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/")
async def get_notifications(
    unread_only: bool = Query(False, alias="unreadOnly"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get all notifications for the current user"""
    user_id_str = extract_user_id_str(current_user)
    
    result = await NotificationService.get_user_notifications(
        user_id=user_id_str,
        unread_only=unread_only,
        limit=limit,
        offset=offset
    )
    
    return result["notifications"]

@router.get("/unread/count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """Get unread notification count"""
    user_id_str = extract_user_id_str(current_user)
    
    result = await NotificationService.get_user_notifications(
        user_id=user_id_str,
        unread_only=True,
        limit=1
    )
    
    return {"unread_count": result["unread_count"]}

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    user_id_str = extract_user_id_str(current_user)
    
    success = await NotificationService.mark_as_read(notification_id, user_id_str)
    
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read"""
    user_id_str = extract_user_id_str(current_user)
    
    count = await NotificationService.mark_all_as_read(user_id_str)
    
    return {"message": f"Marked {count} notifications as read"}

@router.delete("/clear")
async def clear_all_notifications(
    current_user: dict = Depends(get_current_user)
):
    """Delete all notifications for the current user"""
    user_id_str = extract_user_id_str(current_user)
    
    count = await NotificationService.delete_all_notifications(user_id_str)
    
    return {"message": f"Deleted {count} notifications"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a specific notification"""
    user_id_str = extract_user_id_str(current_user)
    
    success = await NotificationService.delete_notification(notification_id, user_id_str)
    
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification deleted"}

@router.get("/{notification_id}")
async def get_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific notification"""
    user_id_str = extract_user_id_str(current_user)
    db = await get_database()
    
    if not ObjectId.is_valid(notification_id):
        raise HTTPException(status_code=400, detail="Invalid notification ID")
    
    notification = await db.notifications.find_one({
        "_id": ObjectId(notification_id),
        "user_id": user_id_str
    })
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification["id"] = str(notification["_id"])
    del notification["_id"]
    
    return notification

@router.get("/stream")
async def stream_notifications(
    current_user: dict = Depends(get_current_user)
):
    """Stream notifications in real-time using Server-Sent Events"""
    user_id_str = extract_user_id_str(current_user)
    
    async def event_stream():
        db = await get_database()
        # Watch the notifications collection for changes
        async with db.notifications.watch() as stream:
            async for change in stream:
                if change["operationType"] in ["insert", "update"]:
                    # Check if notification belongs to this user
                    if change.get("fullDocument", {}).get("user_id") == user_id_str:
                        if change["operationType"] == "insert":
                            notification = change["fullDocument"]
                            notification["id"] = str(notification["_id"])
                            yield f"data: {json.dumps({'type': 'new', 'notification': notification})}\n\n"
                        elif change["operationType"] == "update" and change.get("updateDescription", {}).get("updatedFields", {}).get("read") == True:
                            yield f"data: {json.dumps({'type': 'read', 'notification_id': str(change['documentKey']['_id'])})}\n\n"
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")