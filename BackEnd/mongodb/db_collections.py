from .database import get_database

async def get_user_collection():
    """Get users collection"""
    db = await get_database()
    return db.users

async def get_other_collection():
    """Get other collection"""
    db = await get_database()
    return db.other_collection

async def get_session_collection():
    """Get sessions collection"""
    db = await get_database()
    return db.sessions

async def get_analytics_collection():
    """Get analytics collection"""
    db = await get_database()
    return db.analytics