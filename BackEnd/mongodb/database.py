from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
    AsyncIOMotorGridFSBucket,
)
from typing import Optional
from dotenv import load_dotenv
import os
import asyncio
import logging
import io

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")
logger = logging.getLogger(__name__)


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None
    fs: Optional[AsyncIOMotorGridFSBucket] = None


database = Database()


async def connect_to_mongo():
    """Connect to MongoDB Atlas with Render-compatible settings"""
    try:
        safe_uri = (
            MONGO_URI.split('@')[0].split('//')[0] + '//' + MONGO_URI.split('@')[1]
            if '@' in MONGO_URI else MONGO_URI
        )
        logger.info(f"Connecting to MongoDB: {safe_uri}")

        client_kwargs = {
            "serverSelectionTimeoutMS": 30000,
            "connectTimeoutMS": 30000,
            "socketTimeoutMS": 30000,
            "retryWrites": True,
            "retryReads": True,
            "tls": True,
            "tlsAllowInvalidCertificates": True,
            "tlsAllowInvalidHostnames": True,
        }

        database.client = AsyncIOMotorClient(MONGO_URI, **client_kwargs)
        database.db = database.client.get_database(MONGO_DB_NAME)
        database.fs = AsyncIOMotorGridFSBucket(database.db)   # ← FIXED

        await database.client.admin.command('ping')
        logger.info("✅ Successfully connected to MongoDB Atlas!")
        logger.info(f"📊 Database: {MONGO_DB_NAME}")

        asyncio.create_task(create_indexes())
        return database.db

    except Exception as e:
        logger.error(f"❌ MongoDB connection error: {e}")
        logger.error(f"Connection string format: {MONGO_URI[:50]}...")
        raise e


async def create_indexes():
    """Create database indexes (safe: drops stale username_1 first)"""
    try:
        if database.db is None:
            return

        # Drop the stale unique username index if it exists
        try:
            await database.db.users.drop_index("username_1")
            logger.info("✅ Dropped stale username_1 index")
        except Exception:
            # Index didn't exist — that's fine
            pass

        # Create indexes (non-blocking, tolerant of failures)
        await asyncio.gather(
            database.db.users.create_index("email", unique=True),
            # Partial + sparse: only enforce uniqueness when username is a string
            database.db.users.create_index(
                "username",
                unique=True,
                sparse=True,
                partialFilterExpression={"username": {"$type": "string"}},
            ),
            database.db.jobs.create_index("user_id"),
            database.db.activity.create_index("user_id"),
            database.db.parsed_results.create_index("job_id"),
            database.db.parsed_results.create_index("created_at"),
            database.db.notifications.create_index([("user_id", 1), ("created_at", -1)]),
            database.db.notifications.create_index([("user_id", 1), ("read", 1)]),
            database.db.notifications.create_index([("created_at", -1)]),
            return_exceptions=True,
        )
        logger.info("✅ Indexes created/verified")
    except Exception as e:
        logger.warning(f"⚠️ Index creation warning: {e}")


async def close_mongo_connection():
    """Close MongoDB connection"""
    if database.client:
        database.client.close()
        logger.info("Closed MongoDB connection")


async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance — returns AsyncIOMotorDatabase"""
    if database.db is None:
        await connect_to_mongo()
    return database.db


async def ping_mongo():
    """Check MongoDB connection"""
    try:
        if database.client:
            await database.client.admin.command('ping')
            return True
        else:
            await connect_to_mongo()
            return True
    except Exception as e:
        logger.error(f"MongoDB ping failed: {e}")
        return False