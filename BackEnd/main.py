from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import routers
from routes import auth, jobs, scraping, dashboard, activity, export, llm, notifications, settings, parsing
from mongodb.database import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting Webby Scraper API...")
    try:
        await connect_to_mongo()
        print("✅ Database connected")
    except Exception as e:
        print(f"❌ Database error: {e}")
    yield
    await close_mongo_connection()

app = FastAPI(title="Webby Scraper API", lifespan=lifespan)

# ============================================================
# COMPLETE CORS FIX - Allow all necessary origins
# ============================================================

ALLOWED_ORIGINS = [
    "https://webby-1kju.vercel.app",  # Your Vercel frontend
    "https://webby-1osa.onrender.com",  # Your Render backend
    "http://localhost:3000",
    "http://localhost:5173",
     "http://localhost:3002",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"],
    max_age=86400,
)

# Handle preflight requests for all routes
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    response = JSONResponse(content={"message": "OK"})
    origin = request.headers.get("origin")
    if origin and origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# Add CORS headers to every response
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin")
    if origin and origin in ALLOWED_ORIGINS:
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

@app.get("/")
async def root():
    return {"name": "Webby Scraper API", "status": "operational"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": __import__("datetime").datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)