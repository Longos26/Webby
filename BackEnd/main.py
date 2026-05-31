# backend/main.py - COMPLETE FIXED VERSION

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

# Configure logging
logging.basicConfig(level=logging.INFO)
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
    
    # Connect to MongoDB
    try:
        await connect_to_mongo()
        print("✅ Database connected successfully")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("⚠️  Continuing without database connection...")
    
    yield
    
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

# ============================================================
# ENHANCED CORS CONFIGURATION - Fix for all origins
# ============================================================

# Allow all origins for development/production
ALLOWED_ORIGINS = [
    "https://webby-production.up.railway.app",
    "https://webby-1osa.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "https://*.railway.app",
    "https://*.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all for testing
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Global OPTIONS handler for all routes
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    """Handle CORS preflight requests"""
    response = JSONResponse(content={"message": "OK"})
    origin = request.headers.get("origin")
    
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "3600"
    
    return response

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log request info"""
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    
    status_code = response.status_code
    if status_code >= 500:
        icon = "❌"
    elif status_code >= 400:
        icon = "⚠️"
    else:
        icon = "✅"
    
    print(f"{icon} {request.method} {request.url.path} → {status_code} ({duration_ms:.0f}ms)")
    
    # Add CORS headers to every response
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
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
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        reload=False
    )