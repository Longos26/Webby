"""
Seed initial admin user.
"""
import asyncio
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
from mongodb.database import get_database


async def seed_admin():
    email = "mar@gmail.com".lower().strip()

    db = await get_database()
    existing = await db.users.find_one({"email": email})

    if not existing:
        print(f"❌ User {email} not found. Create it first.")
        return

    await db.users.update_one(
        {"_id": existing["_id"]},
        {
            "$set": {
                "role": "admin",
                "is_active": True,
                "plan": "enterprise",
                "updated_at": datetime.utcnow(),
            }
        },
    )
    print(f"✅ User {email} promoted to admin")


if __name__ == "__main__":
    asyncio.run(seed_admin())