# backend/routes/auth.py
from fastapi import APIRouter, HTTPException, Depends, status, Header
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
from bson import ObjectId
from typing import Optional
import os
import logging
import bcrypt
import jwt
from jwt import ExpiredSignatureError, InvalidTokenError
from dotenv import load_dotenv

load_dotenv()
from mongodb.database import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# JWT settings
SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "change-me-in-production-this-must-be-at-least-32-chars-long",
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


# ---------- Models ----------
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str

class AdminUserCreate(UserCreate):
    role: str = "admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ---------- Role helpers ----------
def get_user_role(user: dict) -> str:
    """Get normalized role from user document"""
    return user.get("role", "user").lower()


def is_admin(user: dict) -> bool:
    return get_user_role(user) == "admin"


# ---------- Auth dependencies ----------
async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """Get the current user from the JWT token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        email = payload.get("sub")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        db = await get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user.get("is_active", True) is False:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated. Contact an administrator.",
            )

        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "username": user.get("username", ""),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "role": get_user_role(user),
        }

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def require_admin(current_user: dict = Depends(get_current_user)):
    """Dependency that requires admin role"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required",
        )
    return current_user


async def require_registered_user(current_user: dict = Depends(get_current_user)):
    """Dependency that requires a registered (non-guest) user"""
    if not current_user or not current_user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return current_user


async def get_optional_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """Optional auth — returns None for guests, user dict for authenticated users"""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


# ---------- Signup (force role = user) ----------
@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """Register a new user — always creates a 'user' role, never admin"""
    logger.info(f"Signup attempt for email: {user_data.email}")
    db = await get_database()
    email = user_data.email.lower().strip()

    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please login instead.",
        )

    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    base_username = email.split("@")[0]
    username = base_username
    suffix = 1
    while await db.users.find_one({"username": username}):
        suffix += 1
        username = f"{base_username}{suffix}"

    try:
        password_hash = get_password_hash(user_data.password)
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing password",
        )

    user_dict = {
        "email": email,
        "username": username,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "password_hash": password_hash,
        "role": "user",           # <-- NEVER accept role from client
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "plan": "pro",
    }

    try:
        result = await db.users.insert_one(user_dict)
        user_id = str(result.inserted_id)

        access_token = create_access_token(
            data={"sub": email, "user_id": user_id}
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": email,
                "username": username,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "role": "user",
            },
        }
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account",
        )


# ---------- Login (include role) ----------
@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    db = await get_database()
    email = login_data.email.lower().strip()

    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if user.get("is_active", True) is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an administrator.",
        )

    stored_hash = user.get("password_hash")
    if not stored_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(login_data.password, stored_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow(), "updated_at": datetime.utcnow()}},
    )

    access_token = create_access_token(
        data={"sub": user["email"], "user_id": str(user["_id"])}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "username": user.get("username", ""),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "role": get_user_role(user),
        },
    }


# ---------- Admin user management ----------
class UserRoleUpdate(BaseModel):
    role: str
    is_active: Optional[bool] = None


@router.get("/users")
async def list_users(
    skip: int = 0,
    limit: int = 20,
    admin: dict = Depends(require_admin),
):
    """List all users (admin only)"""
    db = await get_database()
    cursor = db.users.find({}, {"password_hash": 0}).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    total = await db.users.count_documents({})
    return {
        "users": [
            {
                "id": str(u["_id"]),
                "email": u["email"],
                "username": u.get("username", ""),
                "first_name": u.get("first_name", ""),
                "last_name": u.get("last_name", ""),
                "role": get_user_role(u),
                "is_active": u.get("is_active", True),
                "created_at": u.get("created_at"),
                "last_login": u.get("last_login"),
            }
            for u in users
        ],
        "total": total,
    }


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    admin: dict = Depends(require_admin),
):
    """Update a user's role or active status (admin only)"""
    if payload.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'user'")

    if user_id == admin["id"] and payload.role != "admin":
        raise HTTPException(status_code=400, detail="You cannot demote yourself")

    db = await get_database()
    update = {"role": payload.role, "updated_at": datetime.utcnow()}
    if payload.is_active is not None:
        update["is_active"] = payload.is_active

    result = await db.users.update_one(
        {"_id": ObjectId(user_id)}, {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User updated successfully"}


# ---------- Password helpers (direct bcrypt) ----------
def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly"""
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash"""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a JWT access token (PyJWT)"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ---------- Auth dependency ----------
async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """Get the current user from the JWT token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        email = payload.get("sub")

        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )

        db = await get_database()
        user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "username": user.get("username", ""),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
        }

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------- Signup ----------
@router.post("/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """Register a new user"""
    logger.info(f"Signup attempt for email: {user_data.email}")

    db = await get_database()

    # Normalize email
    email = user_data.email.lower().strip()

    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        logger.warning(f"User already exists: {email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please login instead.",
        )

    # Password strength
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long",
        )

    # Generate a unique username from email
    base_username = email.split("@")[0]
    username = base_username
    suffix = 1
    while await db.users.find_one({"username": username}):
        suffix += 1
        username = f"{base_username}{suffix}"

    # Hash password
    try:
        password_hash = get_password_hash(user_data.password)
        logger.info("Password hash generated successfully")
    except Exception as e:
        logger.error(f"Password hashing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing password",
        )

    user_dict = {
        "email": email,
        "username": username,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "password_hash": password_hash,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "plan": "pro",
    }

    try:
        result = await db.users.insert_one(user_dict)
        user_id = str(result.inserted_id)
        logger.info(f"User created successfully: {user_id}")

        access_token = create_access_token(
            data={"sub": email, "user_id": user_id}
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": email,
                "username": username,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
            },
        }
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account",
        )


# ---------- Login ----------
@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    """Authenticate user and return token"""
    logger.info(f"Login attempt for email: {login_data.email}")

    db = await get_database()
    email = login_data.email.lower().strip()

    user = await db.users.find_one({"email": email})
    if not user:
        logger.warning(f"User not found: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    stored_hash = user.get("password_hash")
    if not stored_hash:
        logger.error(f"No password hash found for user: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    try:
        is_valid = verify_password(login_data.password, stored_hash)
        logger.info(f"Password verification result: {is_valid}")
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        is_valid = False

    if not is_valid:
        logger.warning(f"Invalid password for user: {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow(), "updated_at": datetime.utcnow()}},
    )

    access_token = create_access_token(
        data={"sub": user["email"], "user_id": str(user["_id"])}
    )

    logger.info(f"User logged in successfully: {user['email']}")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "username": user.get("username", ""),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
        },
    }


# ---------- Me / Logout ----------
@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout endpoint (client-side token removal only)"""
    return {"message": "Successfully logged out"}