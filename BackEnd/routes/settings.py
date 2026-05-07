# backend/routes/settings.py
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field
from mongodb.database import get_database
from routes.auth import get_current_user
from models.models import UserInDB
import secrets
import hashlib
import hmac

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
    email_digest: bool = False
    slack_enabled: bool = False
    slack_webhook_url: Optional[str] = None

class ProxyPool(BaseModel):
    id: Optional[str] = None
    name: str
    type: str  # Residential, Datacenter, Mobile
    nodes: int
    health: int
    status: str  # running, paused, failed
    config: Optional[Dict[str, Any]] = {}

class ProxyRotationSettings(BaseModel):
    strategy: str = "round-robin"  # round-robin, random, sticky, least-used
    retry_on_failure: int = 3
    retry_delay: int = 1  # seconds

class ApiKeyCreate(BaseModel):
    name: str
    scopes: List[str]  # read, write, export, admin

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key: str
    scopes: List[str]
    created_at: datetime
    last_used: Optional[datetime]
    expires_at: Optional[datetime]

class WebhookEndpoint(BaseModel):
    id: Optional[str] = None
    url: str
    secret_token: Optional[str] = None
    events: List[str]  # job.complete, job.failed, job.started, etc.
    active: bool = True
    created_at: Optional[datetime] = None

class TwoFactorSetup(BaseModel):
    enabled: bool
    secret: Optional[str] = None
    verified: bool = False

class SessionResponse(BaseModel):
    id: str
    device: str
    location: str
    ip_address: str
    current: bool
    last_active: datetime
    user_agent: str

class BillingInfo(BaseModel):
    plan: str  # starter, pro, team, enterprise
    subscription_id: Optional[str] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool = False
    payment_method_id: Optional[str] = None
    payment_method_last4: Optional[str] = None
    payment_method_expiry: Optional[str] = None

class UsageStats(BaseModel):
    records_scraped: int
    records_limit: int
    api_requests: int
    api_limit: int
    export_downloads: int
    export_limit: int
    concurrent_jobs: int
    concurrent_jobs_limit: int

# ──────────────────────────────────────────────────────────────────
# Helper Functions
# ──────────────────────────────────────────────────────────────────

def generate_api_key(name: str) -> str:
    """Generate a secure API key"""
    prefix = "wby"
    if "development" in name.lower() or "dev" in name.lower():
        prefix = "wby_dev"
    else:
        prefix = "wby_live"
    
    random_part = secrets.token_hex(24)
    return f"{prefix}_sk_{random_part}"

def hash_api_key(key: str) -> str:
    """Hash API key for storage"""
    return hashlib.sha256(key.encode()).hexdigest()

def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    """Verify API key against stored hash"""
    return hmac.compare_digest(hashlib.sha256(plain_key.encode()).hexdigest(), hashed_key)

# ──────────────────────────────────────────────────────────────────
# Profile Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/profile")
async def get_profile(current_user: UserInDB = Depends(get_current_user)):
    """Get user profile settings"""
    db = await get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "email": user.get("email"),
        "timezone": user.get("timezone", "UTC+8 — Manila"),
        "language": user.get("language", "English"),
        "date_format": user.get("date_format", "MM/DD/YYYY"),
        "avatar_url": user.get("avatar_url"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at")
    }

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update user profile"""
    db = await get_database()
    
    update_data = profile_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Profile updated successfully"}

@router.put("/password")
async def update_password(
    password_data: PasswordUpdateRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update user password"""
    from BackEnd.routes.auth import verify_password, get_password_hash
    
    db = await get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    if not verify_password(password_data.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    new_password_hash = get_password_hash(password_data.new_password)
    
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"password_hash": new_password_hash, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Password updated successfully"}

# ──────────────────────────────────────────────────────────────────
# Notification Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/notifications")
async def get_notification_preferences(current_user: UserInDB = Depends(get_current_user)):
    """Get user notification preferences"""
    db = await get_database()
    prefs = await db.notification_preferences.find_one({"user_id": current_user.id})
    
    if not prefs:
        # Return default preferences
        return {
            "job_complete": True,
            "job_failed": True,
            "job_started": False,
            "weekly_report": True,
            "proxy_alert": True,
            "quota_warning": True,
            "email_digest": False,
            "slack_enabled": False,
            "slack_webhook_url": None
        }
    
    # Remove MongoDB-specific fields
    prefs.pop("_id", None)
    prefs.pop("user_id", None)
    return prefs

@router.put("/notifications")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update user notification preferences"""
    db = await get_database()
    
    update_data = preferences.dict()
    update_data["user_id"] = current_user.id
    update_data["updated_at"] = datetime.utcnow()
    
    await db.notification_preferences.update_one(
        {"user_id": current_user.id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Notification preferences updated successfully"}

# ──────────────────────────────────────────────────────────────────
# Proxy Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/proxies/pools")
async def get_proxy_pools(current_user: UserInDB = Depends(get_current_user)):
    """Get all proxy pools for user"""
    db = await get_database()
    pools = await db.proxy_pools.find({"user_id": current_user.id}).to_list(100)
    
    for pool in pools:
        pool["id"] = str(pool.pop("_id"))
    
    return pools

@router.post("/proxies/pools")
async def create_proxy_pool(
    pool_data: ProxyPool,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new proxy pool"""
    db = await get_database()
    
    pool_dict = pool_data.dict()
    pool_dict["user_id"] = current_user.id
    pool_dict["created_at"] = datetime.utcnow()
    
    result = await db.proxy_pools.insert_one(pool_dict)
    
    return {"id": str(result.inserted_id), "message": "Proxy pool created successfully"}

@router.put("/proxies/pools/{pool_id}")
async def update_proxy_pool(
    pool_id: str,
    pool_data: ProxyPool,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update a proxy pool"""
    if not ObjectId.is_valid(pool_id):
        raise HTTPException(status_code=400, detail="Invalid pool ID")
    
    db = await get_database()
    
    update_data = pool_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.proxy_pools.update_one(
        {"_id": ObjectId(pool_id), "user_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proxy pool not found")
    
    return {"message": "Proxy pool updated successfully"}

@router.delete("/proxies/pools/{pool_id}")
async def delete_proxy_pool(
    pool_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a proxy pool"""
    if not ObjectId.is_valid(pool_id):
        raise HTTPException(status_code=400, detail="Invalid pool ID")
    
    db = await get_database()
    result = await db.proxy_pools.delete_one({"_id": ObjectId(pool_id), "user_id": current_user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proxy pool not found")
    
    return {"message": "Proxy pool deleted successfully"}

@router.get("/proxies/rotation")
async def get_proxy_rotation_settings(current_user: UserInDB = Depends(get_current_user)):
    """Get proxy rotation settings"""
    db = await get_database()
    settings = await db.proxy_rotation_settings.find_one({"user_id": current_user.id})
    
    if not settings:
        return {"strategy": "round-robin", "retry_on_failure": 3, "retry_delay": 1}
    
    settings.pop("_id", None)
    settings.pop("user_id", None)
    return settings

@router.put("/proxies/rotation")
async def update_proxy_rotation_settings(
    rotation_settings: ProxyRotationSettings,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update proxy rotation settings"""
    db = await get_database()
    
    update_data = rotation_settings.dict()
    update_data["user_id"] = current_user.id
    update_data["updated_at"] = datetime.utcnow()
    
    await db.proxy_rotation_settings.update_one(
        {"user_id": current_user.id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Rotation settings updated successfully"}

# ──────────────────────────────────────────────────────────────────
# API Key Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/api-keys")
async def get_api_keys(current_user: UserInDB = Depends(get_current_user)):
    """Get all API keys for user"""
    db = await get_database()
    keys = await db.api_keys.find({"user_id": current_user.id}).to_list(100)
    
    # Don't return the actual keys, just metadata
    result = []
    for key in keys:
        result.append({
            "id": str(key["_id"]),
            "name": key["name"],
            "scopes": key["scopes"],
            "created_at": key["created_at"],
            "last_used": key.get("last_used"),
            "expires_at": key.get("expires_at")
        })
    
    return result

@router.post("/api-keys")
async def create_api_key(
    key_data: ApiKeyCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new API key"""
    db = await get_database()
    
    # Generate the actual API key
    plain_key = generate_api_key(key_data.name)
    hashed_key = hash_api_key(plain_key)
    
    key_dict = {
        "user_id": current_user.id,
        "name": key_data.name,
        "key_hash": hashed_key,
        "scopes": key_data.scopes,
        "created_at": datetime.utcnow(),
        "last_used": None,
        "expires_at": datetime.utcnow() + timedelta(days=365)  # 1 year expiry
    }
    
    result = await db.api_keys.insert_one(key_dict)
    
    # Return the plain key once (won't be stored again)
    return {
        "id": str(result.inserted_id),
        "name": key_data.name,
        "key": plain_key,  # Only returned once
        "scopes": key_data.scopes,
        "created_at": key_dict["created_at"],
        "expires_at": key_dict["expires_at"]
    }

@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete an API key"""
    if not ObjectId.is_valid(key_id):
        raise HTTPException(status_code=400, detail="Invalid key ID")
    
    db = await get_database()
    result = await db.api_keys.delete_one({"_id": ObjectId(key_id), "user_id": current_user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    
    return {"message": "API key deleted successfully"}

@router.get("/api-keys/usage")
async def get_api_usage(current_user: UserInDB = Depends(get_current_user)):
    """Get API usage statistics"""
    db = await get_database()
    
    # Get usage from the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    api_requests = await db.api_logs.count_documents({
        "user_id": current_user.id,
        "timestamp": {"$gte": thirty_days_ago}
    })
    
    export_calls = await db.export_logs.count_documents({
        "user_id": current_user.id,
        "timestamp": {"$gte": thirty_days_ago}
    })
    
    # Get user's plan limits
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    plan = user.get("plan", "pro")
    
    limits = {
        "starter": {"api_limit": 500, "export_limit": 10, "concurrent_jobs": 3},
        "pro": {"api_limit": 20000, "export_limit": 100, "concurrent_jobs": 20},
        "team": {"api_limit": 100000, "export_limit": 500, "concurrent_jobs": 100},
        "enterprise": {"api_limit": 1000000, "export_limit": 5000, "concurrent_jobs": 1000}
    }
    
    current_concurrent = await db.jobs.count_documents({
        "user_id": current_user.id,
        "status": {"$in": ["running", "pending"]}
    })
    
    return {
        "api_requests": api_requests,
        "api_limit": limits.get(plan, limits["pro"])["api_limit"],
        "export_calls": export_calls,
        "export_limit": limits.get(plan, limits["pro"])["export_limit"],
        "concurrent_jobs": current_concurrent,
        "concurrent_jobs_limit": limits.get(plan, limits["pro"])["concurrent_jobs"]
    }

# ──────────────────────────────────────────────────────────────────
# Webhook Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/webhooks")
async def get_webhooks(current_user: UserInDB = Depends(get_current_user)):
    """Get all webhook endpoints for user"""
    db = await get_database()
    webhooks = await db.webhooks.find({"user_id": current_user.id}).to_list(100)
    
    for webhook in webhooks:
        webhook["id"] = str(webhook.pop("_id"))
        # Don't return secret token in list view
        webhook.pop("secret_token", None)
    
    return webhooks

@router.post("/webhooks")
async def create_webhook(
    webhook_data: WebhookEndpoint,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new webhook endpoint"""
    db = await get_database()
    
    webhook_dict = webhook_data.dict()
    webhook_dict["user_id"] = current_user.id
    webhook_dict["created_at"] = datetime.utcnow()
    
    # Generate secret token if not provided
    if not webhook_dict.get("secret_token"):
        webhook_dict["secret_token"] = secrets.token_urlsafe(32)
    
    result = await db.webhooks.insert_one(webhook_dict)
    
    return {"id": str(result.inserted_id), "message": "Webhook created successfully"}

@router.put("/webhooks/{webhook_id}")
async def update_webhook(
    webhook_id: str,
    webhook_data: WebhookEndpoint,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update a webhook endpoint"""
    if not ObjectId.is_valid(webhook_id):
        raise HTTPException(status_code=400, detail="Invalid webhook ID")
    
    db = await get_database()
    
    update_data = webhook_data.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.webhooks.update_one(
        {"_id": ObjectId(webhook_id), "user_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    return {"message": "Webhook updated successfully"}

@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Delete a webhook endpoint"""
    if not ObjectId.is_valid(webhook_id):
        raise HTTPException(status_code=400, detail="Invalid webhook ID")
    
    db = await get_database()
    result = await db.webhooks.delete_one({"_id": ObjectId(webhook_id), "user_id": current_user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    return {"message": "Webhook deleted successfully"}

@router.post("/webhooks/{webhook_id}/test")
async def test_webhook(
    webhook_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Send a test payload to a webhook"""
    if not ObjectId.is_valid(webhook_id):
        raise HTTPException(status_code=400, detail="Invalid webhook ID")
    
    db = await get_database()
    webhook = await db.webhooks.find_one({"_id": ObjectId(webhook_id), "user_id": current_user.id})
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    # Send test webhook
    import httpx
    test_payload = {
        "event": "test.webhook",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {"message": "This is a test webhook notification"}
    }
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {"Content-Type": "application/json"}
            if webhook.get("secret_token"):
                # Generate signature
                signature = hmac.new(
                    webhook["secret_token"].encode(),
                    str(test_payload).encode(),
                    hashlib.sha256
                ).hexdigest()
                headers["X-Webby-Signature"] = signature
            
            response = await client.post(webhook["url"], json=test_payload, headers=headers, timeout=10.0)
            
            return {
                "success": response.status_code < 400,
                "status_code": response.status_code,
                "message": "Test webhook sent successfully" if response.status_code < 400 else f"Received status {response.status_code}"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to send test webhook: {str(e)}"
        }

# ──────────────────────────────────────────────────────────────────
# Security Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/security/2fa")
async def get_two_factor_status(current_user: UserInDB = Depends(get_current_user)):
    """Get 2FA status for user"""
    db = await get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    return {
        "enabled": user.get("two_factor_enabled", False),
        "verified": user.get("two_factor_verified", False)
    }

@router.post("/security/2fa/setup")
async def setup_two_factor(current_user: UserInDB = Depends(get_current_user)):
    """Setup 2FA for user"""
    import pyotp
    
    db = await get_database()
    
    # Generate secret
    secret = pyotp.random_base32()
    
    # Store temporary secret
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "two_factor_temp_secret": secret,
            "two_factor_temp_secret_created": datetime.utcnow()
        }}
    )
    
    # Generate OTP URI for QR code
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(current_user.email, issuer_name="Webby Scraper")
    
    return {
        "secret": secret,
        "uri": uri,
        "message": "Scan QR code with authenticator app"
    }

@router.post("/security/2fa/verify")
async def verify_two_factor(
    verification_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Verify and enable 2FA"""
    import pyotp
    
    code = verification_data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Verification code required")
    
    db = await get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    temp_secret = user.get("two_factor_temp_secret")
    if not temp_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
    
    # Verify code
    totp = pyotp.TOTP(temp_secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Enable 2FA permanently
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "two_factor_enabled": True,
            "two_factor_verified": True,
            "two_factor_secret": temp_secret,
            "two_factor_backup_codes": [secrets.token_hex(8) for _ in range(8)]
        }, "$unset": {"two_factor_temp_secret": "", "two_factor_temp_secret_created": ""}}
    )
    
    return {"message": "2FA enabled successfully"}

@router.post("/security/2fa/disable")
async def disable_two_factor(
    current_user: UserInDB = Depends(get_current_user)
):
    """Disable 2FA for user"""
    db = await get_database()
    
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"two_factor_enabled": False, "two_factor_verified": False}}
    )
    
    return {"message": "2FA disabled successfully"}

@router.get("/security/sessions")
async def get_active_sessions(current_user: UserInDB = Depends(get_current_user)):
    """Get all active sessions for user"""
    db = await get_database()
    
    sessions = await db.sessions.find({"user_id": current_user.id}).to_list(100)
    
    result = []
    for session in sessions:
        result.append({
            "id": str(session["_id"]),
            "device": session.get("device", "Unknown device"),
            "location": session.get("location", "Unknown location"),
            "ip_address": session.get("ip_address"),
            "current": current_user.id == session["user_id"] and session.get("is_current", False),
            "last_active": session.get("last_active", session["created_at"]),
            "user_agent": session.get("user_agent", "")
        })
    
    return result

@router.delete("/security/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """Revoke a specific session"""
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    db = await get_database()
    result = await db.sessions.delete_one({"_id": ObjectId(session_id), "user_id": current_user.id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Session revoked successfully"}

@router.delete("/security/sessions/revoke-all")
async def revoke_all_sessions(
    current_user: UserInDB = Depends(get_current_user),
    current_session_id: Optional[str] = None
):
    """Revoke all other sessions except current"""
    db = await get_database()
    
    query = {"user_id": current_user.id}
    if current_session_id and ObjectId.is_valid(current_session_id):
        query["_id"] = {"$ne": ObjectId(current_session_id)}
    
    result = await db.sessions.delete_many(query)
    
    return {"message": f"Revoked {result.deleted_count} sessions"}

# ──────────────────────────────────────────────────────────────────
# Billing Settings Endpoints
# ──────────────────────────────────────────────────────────────────

@router.get("/billing/plan")
async def get_current_plan(current_user: UserInDB = Depends(get_current_user)):
    """Get user's current billing plan"""
    db = await get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    plan = user.get("plan", "pro")
    
    plans_info = {
        "starter": {"name": "Starter", "price": "$0", "records_limit": 10000, "jobs_limit": 3},
        "pro": {"name": "Pro", "price": "$49", "records_limit": 500000, "jobs_limit": 20},
        "team": {"name": "Team", "price": "$149", "records_limit": 2000000, "jobs_limit": 100},
        "enterprise": {"name": "Enterprise", "price": "Custom", "records_limit": None, "jobs_limit": None}
    }
    
    subscription = await db.subscriptions.find_one({"user_id": current_user.id, "status": "active"})
    
    return {
        "plan": plan,
        "plan_info": plans_info.get(plan, plans_info["pro"]),
        "subscription_id": subscription.get("subscription_id") if subscription else None,
        "current_period_end": subscription.get("current_period_end") if subscription else None,
        "cancel_at_period_end": subscription.get("cancel_at_period_end", False) if subscription else False
    }

@router.post("/billing/plan/upgrade")
async def upgrade_plan(
    plan_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Upgrade user's plan"""
    new_plan = plan_data.get("plan")
    
    if new_plan not in ["starter", "pro", "team", "enterprise"]:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    db = await get_database()
    
    # Update user's plan
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"plan": new_plan, "updated_at": datetime.utcnow()}}
    )
    
    # Create or update subscription
    await db.subscriptions.update_one(
        {"user_id": current_user.id},
        {"$set": {
            "plan": new_plan,
            "status": "active",
            "current_period_start": datetime.utcnow(),
            "current_period_end": datetime.utcnow() + timedelta(days=30),
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {"message": f"Plan upgraded to {new_plan.capitalize()}"}

@router.post("/billing/plan/cancel")
async def cancel_subscription(current_user: UserInDB = Depends(get_current_user)):
    """Cancel subscription at period end"""
    db = await get_database()
    
    await db.subscriptions.update_one(
        {"user_id": current_user.id},
        {"$set": {"cancel_at_period_end": True, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Subscription will be cancelled at the end of the billing period"}

@router.get("/billing/usage")
async def get_usage_stats(current_user: UserInDB = Depends(get_current_user)):
    """Get current month usage statistics"""
    db = await get_database()
    
    # Get start of current month
    now = datetime.utcnow()
    start_of_month = datetime(now.year, now.month, 1)
    
    # Get user's plan
    user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    plan = user.get("plan", "pro")
    
    limits = {
        "starter": {"records_limit": 10000, "api_limit": 1000, "export_limit": 10},
        "pro": {"records_limit": 500000, "api_limit": 20000, "export_limit": 100},
        "team": {"records_limit": 2000000, "api_limit": 100000, "export_limit": 500},
        "enterprise": {"records_limit": None, "api_limit": None, "export_limit": None}
    }
    
    # Aggregate usage
    records_scraped = await db.job_results.count_documents({
        "user_id": current_user.id,
        "created_at": {"$gte": start_of_month}
    })
    
    api_requests = await db.api_logs.count_documents({
        "user_id": current_user.id,
        "timestamp": {"$gte": start_of_month}
    })
    
    export_downloads = await db.export_logs.count_documents({
        "user_id": current_user.id,
        "timestamp": {"$gte": start_of_month}
    })
    
    concurrent_jobs = await db.jobs.count_documents({
        "user_id": current_user.id,
        "status": {"$in": ["running", "pending"]}
    })
    
    plan_limits = limits.get(plan, limits["pro"])
    
    return {
        "records_scraped": records_scraped,
        "records_limit": plan_limits["records_limit"] if plan_limits["records_limit"] else "Unlimited",
        "api_requests": api_requests,
        "api_limit": plan_limits["api_limit"] if plan_limits["api_limit"] else "Unlimited",
        "export_downloads": export_downloads,
        "export_limit": plan_limits["export_limit"] if plan_limits["export_limit"] else "Unlimited",
        "concurrent_jobs": concurrent_jobs,
        "concurrent_jobs_limit": limits.get(plan, limits["pro"]).get("concurrent_jobs_limit", 20)
    }

@router.get("/billing/payment-method")
async def get_payment_method(current_user: UserInDB = Depends(get_current_user)):
    """Get user's payment method"""
    db = await get_database()
    payment = await db.payment_methods.find_one({"user_id": current_user.id})
    
    if not payment:
        return None
    
    return {
        "id": str(payment["_id"]),
        "last4": payment.get("last4"),
        "expiry_month": payment.get("expiry_month"),
        "expiry_year": payment.get("expiry_year"),
        "card_brand": payment.get("card_brand", "visa"),
        "is_default": payment.get("is_default", True)
    }

@router.put("/billing/payment-method")
async def update_payment_method(
    payment_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update payment method (mock - integrate with Stripe in production)"""
    db = await get_database()
    
    await db.payment_methods.update_one(
        {"user_id": current_user.id},
        {"$set": {
            "last4": payment_data.get("last4", "4242"),
            "expiry_month": payment_data.get("expiry_month", 8),
            "expiry_year": payment_data.get("expiry_year", 27),
            "card_brand": payment_data.get("card_brand", "visa"),
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {"message": "Payment method updated successfully"}

@router.get("/billing/invoices")
async def get_invoices(current_user: UserInDB = Depends(get_current_user)):
    """Get billing invoices"""
    db = await get_database()
    invoices = await db.invoices.find({"user_id": current_user.id}).sort("created_at", -1).to_list(50)
    
    result = []
    for invoice in invoices:
        result.append({
            "id": str(invoice["_id"]),
            "amount": invoice.get("amount"),
            "status": invoice.get("status", "paid"),
            "created_at": invoice.get("created_at"),
            "pdf_url": invoice.get("pdf_url")
        })
    
    return result