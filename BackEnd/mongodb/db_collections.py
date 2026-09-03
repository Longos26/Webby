from .database import get_database

async def get_users_collection():
    """Get users collection"""
    db = await get_database()
    return db.users

async def get_jobs_collection():
    """Get jobs collection"""
    db = await get_database()
    return db.jobs

async def get_activity_collection():
    """Get activity collection"""
    db = await get_database()
    return db.activity

async def get_parsed_results_collection():
    """Get parsed results collection"""
    db = await get_database()
    return db.parsed_results

async def get_notifications_collection():
    """Get notifications collection"""
    db = await get_database()
    return db.notifications

async def get_sessions_collection():
    """Get sessions collection"""
    db = await get_database()
    return db.sessions

async def get_analytics_collection():
    """Get analytics collection"""
    db = await get_database()
    return db.analytics