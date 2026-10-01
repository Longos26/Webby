# routes/parsing.py
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from typing import Optional
import logging
import asyncio
import json as json_module
import traceback

from parsing.Ollama import (
    parse_with_openrouter_result,
    ParseResult,
    DEFAULT_MODEL,
    ALLOWED_MODELS,       # <-- imported for sanitization
)
from mongodb.database import get_database

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================================
# MODELS
# ============================================================
class ParseRequest(BaseModel):
    dom_content: Optional[str] = None
    parse_description: str
    model: Optional[str] = None
    temperature: Optional[float] = 0.1
    use_cache: bool = True

class ParseResponse(BaseModel):
    success: bool
    parse_result: str
    parse_description: str
    created_at: datetime
    tokens_used: int = 0
    processing_time_ms: float = 0
    cached: bool = False
    chunks_processed: int = 1
    error: Optional[str] = None

class GenerateRecommendationsRequest(BaseModel):
    content: str
    job_name: str = "Unknown"
    url: str = "Unknown"

# ============================================================
# HELPERS
# ============================================================
def _get_job_content(job: dict) -> str:
    for key in (
        "scraped_content",
        "content",
        "html_content",
        "raw_content",
        "text",
        "scraped_content_preview",
        "last_parsed_result",
    ):
        val = job.get(key)
        if val and isinstance(val, str) and val.strip():
            return val
    return ""

def _resolve_model(requested: Optional[str]) -> str:
    """
    Only allow models that are in ALLOWED_MODELS.
    This blocks stale/deprecated model IDs (e.g. anthropic/claude-3-haiku)
    that may be stored in the DB or sent by an old frontend build.
    """
    if not requested:
        return DEFAULT_MODEL
    if requested in ALLOWED_MODELS:
        return requested
    logger.warning(
        f"Rejecting model '{requested}' from request. Using '{DEFAULT_MODEL}'."
    )
    return DEFAULT_MODEL

# ============================================================
# PARSE ENDPOINT
# ============================================================
@router.post("/api/scraping/jobs/{job_id}/parse", response_model=ParseResponse)
async def parse_job_content(job_id: str, request: ParseRequest):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    db = await get_database()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    content = (request.dom_content or "").strip() or _get_job_content(job)
    if not content:
        raise HTTPException(
            status_code=400,
            detail="No content available to parse. Please scrape the website first.",
        )

    model_to_use = _resolve_model(request.model)
    logger.info(
        f"Parsing job {job_id}: {len(content)} chars, "
        f"desc={request.parse_description!r}, model={model_to_use}"
    )

    try:
        loop = asyncio.get_event_loop()
        result: ParseResult = await loop.run_in_executor(
            None,
            lambda: parse_with_openrouter_result(
                dom_content=content,
                parse_description=request.parse_description,
                model=model_to_use,
            ),
        )

        if not result.success:
            logger.error(f"Parse failed for job {job_id}: {result.error}")
            raise HTTPException(
                status_code=500,
                detail=result.error or "Parsing failed",
            )

        parse_doc = {
            "job_id": ObjectId(job_id),
            "parse_description": request.parse_description,
            "parsed_content": result.content,
            "tokens_used": result.tokens_used,
            "processing_time_ms": result.processing_time_ms,
            "chunks_processed": result.chunks_processed,
            "model": result.metadata.get("model"),
            "created_at": datetime.utcnow(),
        }
        insert_result = await db.parsed_results.insert_one(parse_doc)

        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {
                "$set": {
                    "last_parse_description": request.parse_description,
                    "last_parse_at": datetime.utcnow(),
                    "last_parsed_result": result.content,
                    "last_parse_tokens": result.tokens_used,
                }
            },
        )

        logger.info(
            f"Job {job_id}: parse saved id={insert_result.inserted_id}, "
            f"tokens={result.tokens_used}, time={result.processing_time_ms:.0f}ms"
        )

        return ParseResponse(
            success=True,
            parse_result=result.content,
            parse_description=request.parse_description,
            created_at=datetime.utcnow(),
            tokens_used=result.tokens_used,
            processing_time_ms=result.processing_time_ms,
            cached=result.cached,
            chunks_processed=result.chunks_processed,
        )

    except HTTPException:
        raise
    except asyncio.TimeoutError:
        logger.error(f"Parse timeout for job {job_id}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Parse request timed out. Try reducing content size.",
        )
    except Exception as e:
        logger.error(f"Error parsing job {job_id}: {e}")
        logger.error(traceback.format_exc())

        error_msg = str(e)
        if "rate limit" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait and try again.",
            )
        if "quota" in error_msg.lower() or "insufficient" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="API quota exceeded. Please check your credits.",
            )
        if "api_key" in error_msg.lower() or "unauthorized" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Server is not configured with a valid OPENROUTER_API_KEY.",
            )
        if "deprecated" in error_msg.lower() or "404" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "The configured LLM is unavailable. "
                    "Please check parsing.Ollama FALLBACK_MODELS."
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse content: {error_msg[:200]}",
        )

# ============================================================
# STREAMING PARSE
# ============================================================
@router.post("/api/scraping/jobs/{job_id}/parse-stream")
async def parse_job_content_stream(job_id: str, request: ParseRequest):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    db = await get_database()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    content = (request.dom_content or "").strip() or _get_job_content(job)
    if not content:
        raise HTTPException(status_code=400, detail="No content available to parse")

    model_to_use = _resolve_model(request.model)

    async def event_generator():
        try:
            yield f"data: {json_module.dumps({'type': 'status', 'message': 'Parsing started'})}\n\n"

            loop = asyncio.get_event_loop()
            result: ParseResult = await loop.run_in_executor(
                None,
                lambda: parse_with_openrouter_result(
                    dom_content=content,
                    parse_description=request.parse_description,
                    model=model_to_use,
                ),
            )

            if result.success:
                parse_doc = {
                    "job_id": ObjectId(job_id),
                    "parse_description": request.parse_description,
                    "parsed_content": result.content,
                    "tokens_used": result.tokens_used,
                    "processing_time_ms": result.processing_time_ms,
                    "chunks_processed": result.chunks_processed,
                    "model": result.metadata.get("model"),
                    "created_at": datetime.utcnow(),
                }
                await db.parsed_results.insert_one(parse_doc)
                await db.jobs.update_one(
                    {"_id": ObjectId(job_id)},
                    {
                        "$set": {
                            "last_parse_description": request.parse_description,
                            "last_parse_at": datetime.utcnow(),
                            "last_parsed_result": result.content,
                        }
                    },
                )

            payload = {
                "type": "result",
                "success": result.success,
                "content": result.content,
                "tokens_used": result.tokens_used,
                "processing_time_ms": result.processing_time_ms,
                "error": result.error,
            }
            yield f"data: {json_module.dumps(payload)}\n\n"
            yield f"data: {json_module.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Stream error for job {job_id}: {e}")
            logger.error(traceback.format_exc())
            yield f"data: {json_module.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ============================================================
# GET PARSED RESULTS
# ============================================================
@router.get("/api/scraping/jobs/{job_id}/parsed-results")
async def get_parsed_results(job_id: str, limit: int = 50):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    db = await get_database()
    cursor = db.parsed_results.find(
        {"job_id": ObjectId(job_id)}
    ).sort("created_at", -1).limit(limit)

    parsed_results = []
    async for result in cursor:
        parsed_results.append({
            "id": str(result["_id"]),
            "job_id": str(result["job_id"]),
            "parse_description": result.get("parse_description", ""),
            "parsed_content": result.get("parsed_content", ""),
            "tokens_used": result.get("tokens_used", 0),
            "processing_time_ms": result.get("processing_time_ms", 0),
            "model": result.get("model"),
            "created_at": result.get("created_at", datetime.utcnow()),
        })

    return {
        "success": True,
        "parsed_results": parsed_results,
        "count": len(parsed_results),
    }

# ============================================================
# DELETE PARSED RESULT
# ============================================================
@router.delete("/api/scraping/results/{result_id}")
async def delete_parsed_result(result_id: str):
    if not ObjectId.is_valid(result_id):
        raise HTTPException(status_code=400, detail="Invalid result ID format")

    db = await get_database()
    result = await db.parsed_results.delete_one({"_id": ObjectId(result_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parse result not found")

    return {"success": True, "message": "Parse result deleted successfully"}

# ============================================================
# AI RECOMMENDATIONS
# ============================================================
@router.post("/api/scraping/generate-recommendations")
async def generate_recommendations(request: GenerateRecommendationsRequest):
    try:
        content_lower = (request.content or "").lower()
        recommendations = []

        content_patterns = {
            "pokemon": {
                "keywords": ["pokémon", "pokemon", "pokedex", "evolution", "pokéball", "trainer"],
                "recommendations": [
                    {"label": "🔍 Names", "desc": "Extract all Pokémon names"},
                    {"label": "⚡ Types", "desc": "Extract Pokémon types (Fire, Water, Grass, etc.)"},
                    {"label": "📊 Stats", "desc": "Extract stats (HP, Attack, Defense, Speed)"},
                    {"label": "🔄 Evolutions", "desc": "Extract evolution chains and requirements"},
                    {"label": "🏆 Abilities", "desc": "Extract abilities and descriptions"},
                    {"label": "🎯 Moves", "desc": "Extract moves and their effects"},
                ],
            },
            "ecommerce": {
                "keywords": ["product", "price", "buy", "shop", "cart", "checkout", "add to cart"],
                "recommendations": [
                    {"label": "📦 Products", "desc": "Extract all product names and IDs"},
                    {"label": "💲 Prices", "desc": "Extract prices with currency"},
                    {"label": "📝 Descriptions", "desc": "Extract product descriptions"},
                    {"label": "⭐ Ratings", "desc": "Extract ratings and review counts"},
                    {"label": "🛒 Availability", "desc": "Extract stock status"},
                    {"label": "🏷️ Categories", "desc": "Extract product categories"},
                ],
            },
            "article": {
                "keywords": ["article", "blog", "post", "news", "published", "author"],
                "recommendations": [
                    {"label": "📰 Headlines", "desc": "Extract article titles and headlines"},
                    {"label": "✍️ Authors", "desc": "Extract author names"},
                    {"label": "📅 Dates", "desc": "Extract publication dates"},
                    {"label": "📊 Summary", "desc": "Create a summary of each article"},
                    {"label": "🔗 Links", "desc": "Extract all links from articles"},
                ],
            },
            "jobs": {
                "keywords": ["job", "hiring", "career", "position", "salary", "apply"],
                "recommendations": [
                    {"label": "💼 Titles", "desc": "Extract job titles"},
                    {"label": "🏢 Companies", "desc": "Extract company names"},
                    {"label": "📍 Locations", "desc": "Extract job locations"},
                    {"label": "💰 Salaries", "desc": "Extract salary ranges"},
                    {"label": "📋 Requirements", "desc": "Extract job requirements"},
                ],
            },
            "contact": {
                "keywords": ["contact", "email", "phone", "address", "reach us"],
                "recommendations": [
                    {"label": "📧 Emails", "desc": "Extract all email addresses"},
                    {"label": "📞 Phones", "desc": "Extract phone numbers"},
                    {"label": "📍 Addresses", "desc": "Extract physical addresses"},
                    {"label": "👤 Names", "desc": "Extract contact person names"},
                ],
            },
        }

        detected_type = None
        max_matches = 0
        for content_type, data in content_patterns.items():
            matches = sum(1 for kw in data["keywords"] if kw in content_lower)
            if matches > max_matches:
                max_matches = matches
                detected_type = content_type

        if detected_type and max_matches >= 2:
            recommendations = content_patterns[detected_type]["recommendations"]
        else:
            recommendations = [
                {"label": "📋 Summary", "desc": "Create a comprehensive summary of the content"},
                {"label": "🔗 Links", "desc": "Extract all URLs and links"},
                {"label": "📧 Emails", "desc": "Extract all email addresses"},
                {"label": "📞 Phones", "desc": "Extract all phone numbers"},
                {"label": "📅 Dates", "desc": "Extract all dates mentioned"},
                {"label": "💰 Prices", "desc": "Extract all prices and costs"},
                {"label": "📊 Tables", "desc": "Extract any tabular data"},
                {"label": "🏷️ Keywords", "desc": "Extract key topics and keywords"},
            ]

        return {
            "success": True,
            "recommendations": recommendations[:8],
            "detected_type": detected_type,
            "confidence": max_matches / 5 if max_matches else 0,
        }

    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        logger.error(traceback.format_exc())
        return {
            "success": True,
            "recommendations": [
                {"label": "📋 Summary", "desc": "Summarize the content"},
                {"label": "🔗 Links", "desc": "Extract all URLs"},
                {"label": "📧 Emails", "desc": "Extract email addresses"},
                {"label": "📞 Phones", "desc": "Extract phone numbers"},
            ],
            "detected_type": "generic",
            "confidence": 0,
        }

# ============================================================
# CACHE MANAGEMENT
# ============================================================
@router.delete("/api/scraping/cache")
async def clear_parse_cache():
    return {"success": True, "message": "Cache cleared"}