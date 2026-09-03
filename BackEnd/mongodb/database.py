from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from gridfs import GridFSBucket
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
    fs: Optional[GridFSBucket] = None

database = Database()

async def connect_to_mongo():
    """Connect to MongoDB Atlas with Render-compatible settings"""
    try:
        # Log connection attempt (without password)
        safe_uri = MONGO_URI.split('@')[0].split('//')[0] + '//' + MONGO_URI.split('@')[1] if '@' in MONGO_URI else MONGO_URI
        logger.info(f"Connecting to MongoDB: {safe_uri}")
        
        # Connection parameters for Render compatibility
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
        
        # Get database instance
        database.db = database.client.get_database(MONGO_DB_NAME)
        
        # Initialize GridFS for large content
        database.fs = GridFSBucket(database.db)
        
        # Verify connection
        await database.client.admin.command('ping')
        logger.info("✅ Successfully connected to MongoDB Atlas!")
        logger.info(f"📊 Database: {MONGO_DB_NAME}")
        
        # Create indexes in background
        asyncio.create_task(create_indexes())
        
        return database.db  # Return AsyncIOMotorDatabase
        
    except Exception as e:
        logger.error(f"❌ MongoDB connection error: {e}")
        logger.error(f"Connection string format: {MONGO_URI[:50]}...")
        raise e


async def create_indexes():
    """Create database indexes"""
    try:
        if database.db is None:
            return
            
        # Create indexes (non-blocking)
        await asyncio.gather(
            database.db.users.create_index("email", unique=True),
            database.db.users.create_index("username", unique=True),
            database.db.jobs.create_index("user_id"),
            database.db.activity.create_index("user_id"),
            database.db.parsed_results.create_index("job_id"),
            database.db.parsed_results.create_index("created_at"),
            database.db.notifications.create_index([("user_id", 1), ("created_at", -1)]),
            database.db.notifications.create_index([("user_id", 1), ("read", 1)]),
            database.db.notifications.create_index([("created_at", -1)]),
            return_exceptions=True
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
    """Get database instance - returns AsyncIOMotorDatabase"""
    if database.db is None:
        await connect_to_mongo()
    return database.db  # Returns AsyncIOMotorDatabase

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