from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from dotenv import load_dotenv
import os

load_dotenv()
# MongoDB Atlas connection string
MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")


class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

database = Database()

async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    try:
        database.client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        database.db = database.client.get_database(MONGO_DB_NAME)

        # Create indexes for better performance
        await database.db.users.create_index("email", unique=True)
        await database.db.users.create_index("username", unique=True)
        await database.db.jobs.create_index("user_id")
        await database.db.activity.create_index("user_id")
        await database.db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        await database.db.notifications.create_index([("user_id", 1), ("read", 1)])
        await database.db.notifications.create_index([("created_at", -1)])

        # Ping to verify connection
        await database.client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
        return database.db
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        raise e

async def close_mongo_connection():
    """Close MongoDB connection"""
    if database.client:
        database.client.close()
        print("Closed MongoDB connection")

async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    if database.db is None:
        await connect_to_mongo()
    return database.db

async def ping_mongo():
    """Check MongoDB connection"""
    try:
        if database.client:
            await database.client.admin.command('ping')
            print("✅ MongoDB connection is active!")
            return True
        else:
            await connect_to_mongo()
            return True
    except Exception as e:
        print(f"❌ MongoDB connection error: {e}")
        return False