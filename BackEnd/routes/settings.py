# backend/routes/settings.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel, EmailStr
from mongodb.database import get_database
from routes.auth import get_current_user, verify_password, get_password_hash
import secrets
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/settings", tags=["settings"])

# ──────────────────────────────────────────────────────────────────
# Pydantic Models
# ──────────────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    date_format: Optional[str] = None

class PasswordUpdateRequest(BaseModel):
    current_password: str
    new_password: str

class NotificationPreferences(BaseModel):
    job_complete: bool = True
    job_failed: bool = True
    job_started: bool = False
    weekly_report: bool = True
    proxy_alert: bool = True
    quota_warning: bool = True

# ──────────────────────────────────────────────────────────────────
# Helper to extract user ID from current_user dict
# ──────────────────────────────────────────────────────────────────

def get_user_id_from_current(current_user: dict) -> str:
    """Extract user ID from the current_user dict returned by get_current_user."""
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    return user_id

# ──────────────────────────────────────────────────────────────────
# Profile Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile settings."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "email": user.get("email"),
        "timezone": user.get("timezone", "UTC"),
        "language": user.get("language", "English"),
        "date_format": user.get("date_format", "MM/DD/YYYY"),
        "avatar_url": user.get("avatar_url"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at")
    }

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user profile."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    # Filter out None values
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # If email is being updated, check if it's already taken
    if "email" in update_data:
        existing = await db.users.find_one({
            "email": update_data["email"],
            "_id": {"$ne": ObjectId(user_id)}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Profile updated successfully"}

@router.put("/password")
async def update_password(
    password_data: PasswordUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user password."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    new_password_hash = get_password_hash(password_data.new_password)
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password_hash": new_password_hash, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Password updated successfully"}

# ──────────────────────────────────────────────────────────────────
# Notification Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/notifications")
async def get_notification_preferences(current_user: dict = Depends(get_current_user)):
    """Get user notification preferences."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    prefs = await db.notification_preferences.find_one({"user_id": user_id})
    
    defaults = {
        "job_complete": True,
        "job_failed": True,
        "job_started": False,
        "weekly_report": True,
        "proxy_alert": True,
        "quota_warning": True
    }
    
    if not prefs:
        return defaults
    
    result = defaults.copy()
    for key in result.keys():
        if key in prefs:
            result[key] = prefs[key]
    
    return result

@router.put("/notifications")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update user notification preferences."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    update_data = preferences.dict()
    update_data["user_id"] = user_id
    update_data["updated_at"] = datetime.utcnow()
    
    await db.notification_preferences.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Notification preferences updated successfully"}

# ──────────────────────────────────────────────────────────────────
# Security Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/security/2fa")
async def get_two_factor_status(current_user: dict = Depends(get_current_user)):
    """Get 2FA status for user."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "enabled": user.get("two_factor_enabled", False),
        "verified": user.get("two_factor_verified", False)
    }

@router.post("/security/2fa/setup")
async def setup_two_factor(current_user: dict = Depends(get_current_user)):
    """Setup 2FA for user."""
    try:
        import pyotp
    except ImportError:
        raise HTTPException(status_code=500, detail="2FA service not available")
    
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    # Generate secret
    secret = pyotp.random_base32()
    
    # Store temporary secret
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "two_factor_temp_secret": secret,
            "two_factor_temp_secret_created": datetime.utcnow()
        }}
    )
    
    # Get user for email
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    # Generate OTP URI for QR code
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(user.get("email", ""), issuer_name="Webby Scraper")
    
    return {
        "secret": secret,
        "uri": uri,
        "message": "Scan QR code with authenticator app"
    }

@router.post("/security/2fa/verify")
async def verify_two_factor(
    verification_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Verify and enable 2FA."""
    try:
        import pyotp
    except ImportError:
        raise HTTPException(status_code=500, detail="2FA service not available")
    
    code = verification_data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Verification code required")
    
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    temp_secret = user.get("two_factor_temp_secret")
    if not temp_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
    
    # Verify code
    totp = pyotp.TOTP(temp_secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Enable 2FA permanently
    backup_codes = [secrets.token_hex(8) for _ in range(8)]
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "two_factor_enabled": True,
            "two_factor_verified": True,
            "two_factor_secret": temp_secret,
            "two_factor_backup_codes": backup_codes
        }, "$unset": {"two_factor_temp_secret": "", "two_factor_temp_secret_created": ""}}
    )
    
    return {
        "message": "2FA enabled successfully",
        "backup_codes": backup_codes
    }

@router.post("/security/2fa/disable")
async def disable_two_factor(
    current_user: dict = Depends(get_current_user)
):
    """Disable 2FA for user."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"two_factor_enabled": False, "two_factor_verified": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "2FA disabled successfully"}

@router.get("/security/sessions")
async def get_active_sessions(current_user: dict = Depends(get_current_user)):
    """Get all active sessions for user."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    # Check if sessions collection exists
    try:
        sessions = await db.sessions.find({"user_id": user_id}).to_list(100)
    except:
        return []
    
    result = []
    for session in sessions:
        result.append({
            "id": str(session["_id"]),
            "device": session.get("device", "Unknown device"),
            "location": session.get("location", "Unknown location"),
            "ip_address": session.get("ip_address", ""),
            "current": session.get("is_current", False),
            "last_active": session.get("last_active", session.get("created_at", datetime.utcnow())),
            "user_agent": session.get("user_agent", "")
        })
    
    return result

@router.delete("/security/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Revoke a specific session."""
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    try:
        result = await db.sessions.delete_one(
            {"_id": ObjectId(session_id), "user_id": user_id}
        )
    except:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session revoked successfully"}

@router.delete("/security/sessions/revoke-all")
async def revoke_all_sessions(
    current_user: dict = Depends(get_current_user)
):
    """Revoke all sessions for user."""
    db = await get_database()
    user_id = get_user_id_from_current(current_user)
    
    try:
        result = await db.sessions.delete_many({"user_id": user_id})
    except:
        return {"message": "No sessions to revoke"}
    
    return {"message": f"Revoked {result.deleted_count} sessions"}