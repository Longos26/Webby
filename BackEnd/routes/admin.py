# backend/routes/admin.py
from fastapi import APIRouter, HTTPException, Depends, status, Query
from datetime import datetime, timedelta
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional, List
import logging

from mongodb.database import get_database
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============================================================
# MODELS
# ============================================================
class RoleUpdate(BaseModel):
    role: str  # "admin" | "user"


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None


class PlanUpdate(BaseModel):
    plan: str  # "free" | "pro" | "enterprise"


# ============================================================
# ADMIN GUARD
# ============================================================
async def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency that ensures the current user is an admin."""
    db = await get_database()
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ============================================================
# LIST USERS
# ============================================================
@router.get("/users")
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    role: Optional[str] = None,
    admin: dict = Depends(require_admin),
):
    """List all users with optional search/filter."""
    db = await get_database()

    query = {}
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}},
        ]
    if role:
        query["role"] = role

    total = await db.users.count_documents(query)
    cursor = (
        db.users.find(query, {"password_hash": 0})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    users = await cursor.to_list(length=limit)

    for u in users:
        u["_id"] = str(u["_id"])
        u.setdefault("role", "user")
        u.setdefault("plan", "free")

    return {"users": users, "total": total, "skip": skip, "limit": limit}


# ============================================================
# GET SINGLE USER
# ============================================================
@router.get("/users/{user_id}")
async def get_user(user_id: str, admin: dict = Depends(require_admin)):
    db = await get_database()
    try:
        user = await db.users.find_one(
            {"_id": ObjectId(user_id)}, {"password_hash": 0}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.setdefault("role", "user")
    user.setdefault("plan", "free")
    return user


# ============================================================
# USER ACTIVITY (scrapes, exports, logins, etc.)
# ============================================================
@router.get("/users/{user_id}/activity")
async def get_user_activity(
    user_id: str,
    limit: int = Query(100, ge=1, le=500),
    type: Optional[str] = None,  # "scrape" | "export" | "login" | "error" | "info"
    admin: dict = Depends(require_admin),
):
    """Fetch activity log entries for a specific user."""
    db = await get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    user = await db.users.find_one({"_id": oid}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    collections = await db.list_collection_names()
    activities = []

    # ---------- Primary source: activities collection ----------
    if "activities" in collections:
        query = {
            "$or": [
                {"user_id": user_id},
                {"user_id": str(user["_id"])},
                {"user_id": user.get("email")},
            ]
        }
        if type:
            query["type"] = type

        cursor = (
            db.activities.find(query)
            .sort("created_at", -1)
            .limit(limit)
        )

        async for a in cursor:
            created_at = a.get("created_at", datetime.utcnow())
            activities.append({
                "id": str(a["_id"]),
                "type": a.get("type", "info"),
                "title": a.get("title", "Activity"),
                "description": a.get("description", ""),
                "metadata": a.get("metadata") or {},
                "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
            })

    # ---------- Fallback: scrapes collection ----------
    if "scrapes" in collections:
        try:
            scrape_cursor = (
                db.scrapes.find({"user_id": {"$in": [user_id, str(user["_id"])]}})
                .sort("created_at", -1)
                .limit(limit)
            )
            async for s in scrape_cursor:
                created_at = s.get("created_at", datetime.utcnow())
                activities.append({
                    "id": str(s["_id"]),
                    "type": "scrape",
                    "title": s.get("title") or f"Scraped {s.get('url', 'page')}",
                    "description": s.get("url", ""),
                    "metadata": {
                        "url": s.get("url"),
                        "status": s.get("status"),
                        "items": s.get("items_count") or s.get("count"),
                    },
                    "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
                })
        except Exception as e:
            logger.warning(f"scrapes collection lookup failed: {e}")

    # ---------- Fallback: exports collection ----------
    if "exports" in collections:
        try:
            export_cursor = (
                db.exports.find({"user_id": {"$in": [user_id, str(user["_id"])]}})
                .sort("created_at", -1)
                .limit(limit)
            )
            async for x in export_cursor:
                created_at = x.get("created_at", datetime.utcnow())
                activities.append({
                    "id": str(x["_id"]),
                    "type": "export",
                    "title": x.get("title") or f"Exported {x.get('format', 'file')}",
                    "description": x.get("filename", ""),
                    "metadata": {
                        "format": x.get("format"),
                        "size": x.get("size"),
                    },
                    "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
                })
        except Exception as e:
            logger.warning(f"exports collection lookup failed: {e}")

    # ---------- Fallback: jobs collection (scraping jobs) ----------
    if "jobs" in collections:
        try:
            job_cursor = (
                db.jobs.find({"user_id": {"$in": [user_id, str(user["_id"])]}})
                .sort("created_at", -1)
                .limit(limit)
            )
            async for j in job_cursor:
                created_at = j.get("created_at", datetime.utcnow())
                activities.append({
                    "id": str(j["_id"]),
                    "type": "scrape",
                    "title": j.get("name") or f"Job: {j.get('url', 'untitled')}",
                    "description": j.get("url", ""),
                    "metadata": {
                        "status": j.get("status"),
                        "records": j.get("records_count") or j.get("results_count"),
                        "url": j.get("url"),
                    },
                    "created_at": created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at),
                })
        except Exception as e:
            logger.warning(f"jobs collection lookup failed: {e}")

    # ---------- Dedupe by id + sort desc ----------
    seen = set()
    deduped = []
    for a in sorted(activities, key=lambda x: x["created_at"], reverse=True):
        if a["id"] in seen:
            continue
        seen.add(a["id"])
        deduped.append(a)

    created = user.get("created_at")
    return {
        "user": {
            "_id": str(user["_id"]),
            "email": user.get("email"),
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "username": user.get("username"),
            "role": user.get("role", "user"),
            "plan": user.get("plan", "free"),
            "created_at": created.isoformat() if hasattr(created, "isoformat") else str(created or ""),
        },
        "activities": deduped[:limit],
        "total": len(deduped),
    }


# ============================================================
# UPDATE ROLE (promote / demote)
# ============================================================
@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: RoleUpdate,
    admin: dict = Depends(require_admin),
):
    """Promote ('admin') or demote ('user') a user."""
    if payload.role not in ("admin", "user"):
        raise HTTPException(
            status_code=400, detail="role must be 'admin' or 'user'"
        )

    if user_id == admin["id"] and payload.role != "admin":
        raise HTTPException(
            status_code=400,
            detail="You cannot demote yourself. Ask another admin.",
        )

    db = await get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    result = await db.users.update_one(
        {"_id": oid},
        {"$set": {"role": payload.role, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    logger.info(f"Admin {admin.get('email')} set role={payload.role} for user {user_id}")
    return {"success": True, "user_id": user_id, "role": payload.role}


# ============================================================
# UPDATE PLAN
# ============================================================
@router.put("/users/{user_id}/plan")
async def update_user_plan(
    user_id: str,
    payload: PlanUpdate,
    admin: dict = Depends(require_admin),
):
    if payload.plan not in ("free", "pro", "enterprise"):
        raise HTTPException(
            status_code=400, detail="plan must be free, pro, or enterprise"
        )
    db = await get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    result = await db.users.update_one(
        {"_id": oid},
        {"$set": {"plan": payload.plan, "updated_at": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"success": True, "user_id": user_id, "plan": payload.plan}


# ============================================================
# UPDATE PROFILE (name / username)
# ============================================================
@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    payload: ProfileUpdate,
    admin: dict = Depends(require_admin),
):
    db = await get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    updates = {k: v for k, v in payload.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    updates["updated_at"] = datetime.utcnow()

    if "username" in updates:
        existing = await db.users.find_one({
            "username": updates["username"],
            "_id": {"$ne": oid},
        })
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    result = await db.users.update_one({"_id": oid}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    user = await db.users.find_one({"_id": oid}, {"password_hash": 0})
    user["_id"] = str(user["_id"])
    user.setdefault("role", "user")
    user.setdefault("plan", "free")
    return user


# ============================================================
# DELETE USER
# ============================================================
@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    db = await get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")

    result = await db.users.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user_id": user_id}


# ============================================================
# ADMIN STATS
# ============================================================
@router.get("/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    db = await get_database()
    total_users = await db.users.count_documents({})
    admins = await db.users.count_documents({"role": "admin"})
    pro_users = await db.users.count_documents({"plan": "pro"})
    enterprise_users = await db.users.count_documents({"plan": "enterprise"})

    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_7d = await db.users.count_documents({"created_at": {"$gte": week_ago}})

    return {
        "total_users": total_users,
        "admins": admins,
        "regular_users": total_users - admins,
        "pro_users": pro_users,
        "enterprise_users": enterprise_users,
        "new_users_7d": new_users_7d,
    }