# backend/main.py - FIXED LIFESPAN FUNCTION
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Optional
import logging
import os
import time
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Import all routers
from routes import auth, jobs, scraping, dashboard, activity, export, llm, notifications, settings, parsing
from mongodb.database import connect_to_mongo, close_mongo_connection, get_database
from services.job_executor import JobExecutor

# ============================================================
# CLEAN LOGGING CONFIGURATION - No verbose headers
# ============================================================

# Suppress all default uvicorn and fastapi logs
logging.getLogger("uvicorn").setLevel(logging.ERROR)
logging.getLogger("uvicorn.access").setLevel(logging.ERROR)
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)
logging.getLogger("fastapi").setLevel(logging.ERROR)

# Configure root logger to only show what we want
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'  # Simple format without timestamp (add if needed)
)

# Create logger for this module
logger = logging.getLogger(__name__)

# Initialize global services
job_executor = JobExecutor()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    print("\n" + "="*50)
    print("🚀 Starting Webby Scraper API...")
    print("="*50 + "\n")
    
    # Connect to MongoDB - Don't raise on error, just log
    try:
        await connect_to_mongo()
        print("✅ Database connected successfully")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("⚠️  Continuing without database connection...")
        # Don't raise - let the app start even if DB is down
        # This helps with debugging on Render
    
    yield  # This is where the app runs
    
    # Shutdown
    print("\n🛑 Shutting down Webby Scraper API...")
    await close_mongo_connection()
# Create FastAPI app
app = FastAPI(
    title="Webby Scraper API",
    description="Enterprise web scraping and data extraction platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://webby-production.up.railway.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# CLEAN REQUEST LOGGING - Only shows method, path, status, duration
# ============================================================
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log only essential request info (no headers)"""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    
    # Get status code
    status_code = response.status_code
    
    # Status indicators
    if status_code >= 500:
        icon = "❌"  # Server error
    elif status_code >= 400:
        icon = "⚠️"  # Client error  
    elif status_code >= 300:
        icon = "➡️"  # Redirect
    else:
        icon = "✅"  # Success
    
    # Clean log - just what you need
    print(f"{icon} {request.method} {request.url.path} → {status_code} ({duration_ms:.0f}ms)")
    
    return response

# Include routers
app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(scraping.router)
app.include_router(dashboard.router)
app.include_router(activity.router)
app.include_router(export.router)
app.include_router(llm.router)
app.include_router(notifications.router)
app.include_router(settings.router)
app.include_router(parsing.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": "Webby Scraper API",
        "version": "1.0.0",
        "status": "operational",
        "message": "API is running. See /docs for documentation."
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    db_status = "connected"
    try:
        db = await get_database()
        await db.command("ping")
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        log_level="info"
    )