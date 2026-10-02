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
import re
import traceback

# --- Use the new enhanced parser directly ---
from routes.enhanced_parsing import (
    parse_content_async,
    ParseResult,
    DEFAULT_MODEL,
    ALLOWED_MODELS,
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
    temperature: Optional[float] = 0.0
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
    items_extracted: int = 0
    items_expected: int = 0
    fields: list = []

class GenerateRecommendationsRequest(BaseModel):
    content: str
    job_name: str = "Unknown"
    url: str = "Unknown"

# ============================================================
# HELPERS
# ============================================================
def _get_job_content(job: dict) -> str:
    """
    Prefer structured `items` (per-record) over the text blob.
    Emits the "#N | key=value" format the enhanced parser counts.
    """
    items = job.get("items") or []
    if items:
        lines = []
        for i, it in enumerate(items, 1):
            parts = [f"#{i}"]
            for k, v in it.items():
                if v in (None, "", []):
                    continue
                if k in ("raw_html", "clean_text", "source_page", "_id"):
                    continue
                if isinstance(v, (dict, list)):
                    continue
                parts.append(f"{k}={str(v)[:200]}")
            lines.append(" | ".join(parts))
        return "\n".join(lines)

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
    if not requested:
        return DEFAULT_MODEL
    if requested in ALLOWED_MODELS:
        return requested
    logger.warning(
        f"Rejecting model '{requested}' from request. Using '{DEFAULT_MODEL}'."
    )
    return DEFAULT_MODEL

def _count_items(text: str) -> int:
    """
    Return the *minimum* array length across all fields in the LLM's JSON.
    This is the number of fully-populated rows, not just the longest array.
    """
    if not text:
        return 0
    try:
        cleaned = re.sub(r'```(?:json)?', '', text).replace('```', '').strip()
        data = json_module.loads(cleaned)
        if isinstance(data, list):
            return len(data)
        if isinstance(data, dict):
            arrays = [len(v) for v in data.values() if isinstance(v, list) and v]
            return min(arrays) if arrays else 0
    except Exception:
        return 0
    return 0

def _count_expected(content: str) -> int:
    """Count "#N" lines in the source content."""
    return len(re.findall(r'^#\d+', content, re.MULTILINE))

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

    expected_items = _count_expected(content)
    model_to_use = _resolve_model(request.model)
    logger.info(
        f"Parsing job {job_id}: {len(content)} chars, "
        f"{expected_items} expected items, "
        f"desc={request.parse_description!r}, model={model_to_use}"
    )

    try:
        result: ParseResult = await parse_content_async(
            content=content,
            description=request.parse_description,
            job_id=job_id,
            model=model_to_use,
        )

        if not result.success:
            logger.error(f"Parse failed for job {job_id}: {result.error}")
            raise HTTPException(
                status_code=500,
                detail=result.error or "Parsing failed",
            )

        actual_items = _count_items(result.content)
        fields = result.metadata.get("fields", [])
        logger.info(
            f"Job {job_id}: extracted {actual_items}/{expected_items} items, "
            f"fields={fields}"
        )

        parse_doc = {
            "job_id": ObjectId(job_id),
            "parse_description": request.parse_description,
            "parsed_content": result.content,
            "tokens_used": result.tokens_used,
            "processing_time_ms": result.processing_time_ms,
            "chunks_processed": result.chunks_processed,
            "total_chunks": result.total_chunks,
            "model": result.metadata.get("model"),
            "fields": fields,
            "items_extracted": actual_items,
            "items_expected": expected_items,
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
                    "last_parse_items_extracted": actual_items,
                    "last_parse_items_expected": expected_items,
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
            items_extracted=actual_items,
            items_expected=expected_items,
            fields=fields,
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
                    "Please check parsing.enhanced_parser FALLBACK_MODELS."
                ),
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse content: {error_msg[:200]}",
        )

# ============================================================
# PARSE (ENHANCED DIAGNOSTICS)
# ============================================================
@router.post("/api/scraping/jobs/{job_id}/parse-enhanced")
async def parse_job_content_enhanced(job_id: str, request: ParseRequest):
    """Same as /parse but returns detailed diagnostics."""
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")

    db = await get_database()
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    content = (request.dom_content or "").strip() or _get_job_content(job)
    if not content:
        raise HTTPException(status_code=400, detail="No content available to parse")

    expected_items = _count_expected(content)
    model_to_use = _resolve_model(request.model)

    result: ParseResult = await parse_content_async(
        content=content,
        description=request.parse_description,
        job_id=job_id,
        model=model_to_use,
    )

    actual_items = _count_items(result.content)

    return {
        "success": result.success,
        "items_expected": expected_items,
        "items_extracted": actual_items,
        "completeness": (actual_items / expected_items) if expected_items else 1.0,
        "chunks_processed": result.chunks_processed,
        "total_chunks": result.total_chunks,
        "tokens_used": result.tokens_used,
        "processing_time_ms": result.processing_time_ms,
        "cached": result.cached,
        "fields": result.metadata.get("fields", []),
        "errors": result.metadata.get("partial_errors"),
        "content": result.content,
    }

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
    expected_items = _count_expected(content)

    # Queue to bridge the parser's stream_callback into the SSE generator
    queue: asyncio.Queue = asyncio.Queue()

    async def stream_callback(event: dict):
        await queue.put(event)

    async def run_parser():
        try:
            result = await parse_content_async(
                content=content,
                description=request.parse_description,
                job_id=job_id,
                model=model_to_use,
                stream_callback=stream_callback,
            )
            await queue.put({"_final_result": result})
        except Exception as e:
            logger.error(f"Stream parser error for job {job_id}: {e}")
            logger.error(traceback.format_exc())
            await queue.put({"_error": str(e)})

    async def event_generator():
        task = asyncio.create_task(run_parser())
        try:
            yield f"data: {json_module.dumps({'type': 'status', 'message': 'Parsing started', 'expected_items': expected_items})}\n\n"

            while True:
                event = await queue.get()
                if "_final_result" in event:
                    result: ParseResult = event["_final_result"]
                    actual_items = _count_items(result.content)

                    if result.success:
                        parse_doc = {
                            "job_id": ObjectId(job_id),
                            "parse_description": request.parse_description,
                            "parsed_content": result.content,
                            "tokens_used": result.tokens_used,
                            "processing_time_ms": result.processing_time_ms,
                            "chunks_processed": result.chunks_processed,
                            "total_chunks": result.total_chunks,
                            "model": result.metadata.get("model"),
                            "fields": result.metadata.get("fields", []),
                            "items_extracted": actual_items,
                            "items_expected": expected_items,
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
                                    "last_parse_items_extracted": actual_items,
                                    "last_parse_items_expected": expected_items,
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
                        "items_extracted": actual_items,
                        "items_expected": expected_items,
                        "fields": result.metadata.get("fields", []),
                    }
                    yield f"data: {json_module.dumps(payload)}\n\n"
                    yield f"data: {json_module.dumps({'type': 'done'})}\n\n"
                    break

                if "_error" in event:
                    yield f"data: {json_module.dumps({'type': 'error', 'error': event['_error']})}\n\n"
                    break

                # Forward chunk-level events
                yield f"data: {json_module.dumps(event)}\n\n"

        finally:
            if not task.done():
                task.cancel()

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
            "fields": result.get("fields", []),
            "items_extracted": result.get("items_extracted", 0),
            "items_expected": result.get("items_expected", 0),
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
                    {"label": "🔍 Extract All Names", "desc": "Extract all Pokémon names from the content"},
                    {"label": "⚡ Extract All Types", "desc": "Extract all Pokémon types (Fire, Water, Grass, etc.)"},
                    {"label": "📊 Extract All Stats", "desc": "Extract all Pokémon stats (HP, Attack, Defense, Speed)"},
                    {"label": "🔄 Extract All Evolutions", "desc": "Extract all evolution chains and requirements"},
                    {"label": "🏆 Extract All Abilities", "desc": "Extract all Pokémon abilities and descriptions"},
                    {"label": "🎯 Extract All Moves", "desc": "Extract all moves and their effects"},
                ],
            },
            "ecommerce": {
                "keywords": ["product", "price", "buy", "shop", "cart", "checkout", "add to cart", "£", "$", "€"],
                "recommendations": [
                    {"label": "📦 Extract All Products", "desc": "Extract all product names and IDs"},
                    {"label": "💲 Extract All Prices", "desc": "Extract all prices for every product"},
                    {"label": "📝 Extract All Descriptions", "desc": "Extract all product descriptions"},
                    {"label": "⭐ Extract All Ratings", "desc": "Extract all product ratings and review counts"},
                    {"label": "🛒 Extract All Stock Status", "desc": "Extract the stock/availability status for every product"},
                    {"label": "🏷️ Extract All Categories", "desc": "Extract all product categories"},
                ],
            },
            "article": {
                "keywords": ["article", "blog", "post", "news", "published", "author"],
                "recommendations": [
                    {"label": "📰 Extract All Headlines", "desc": "Extract all article headlines and titles"},
                    {"label": "✍️ Extract All Authors", "desc": "Extract all author names"},
                    {"label": "📅 Extract All Dates", "desc": "Extract all publication dates"},
                    {"label": "📊 Extract All Summaries", "desc": "Extract key points and summaries for every article"},
                    {"label": "🔗 Extract All Links", "desc": "Extract all links from every article"},
                ],
            },
            "jobs": {
                "keywords": ["job", "hiring", "career", "position", "salary", "apply"],
                "recommendations": [
                    {"label": "💼 Extract All Job Titles", "desc": "Extract all job titles"},
                    {"label": "🏢 Extract All Companies", "desc": "Extract all company names"},
                    {"label": "📍 Extract All Locations", "desc": "Extract all job locations"},
                    {"label": "💰 Extract All Salaries", "desc": "Extract all salary ranges"},
                    {"label": "📋 Extract All Requirements", "desc": "Extract all job requirements"},
                ],
            },
            "contact": {
                "keywords": ["contact", "email", "phone", "address", "reach us"],
                "recommendations": [
                    {"label": "📧 Extract All Emails", "desc": "Extract all email addresses"},
                    {"label": "📞 Extract All Phones", "desc": "Extract all phone numbers"},
                    {"label": "📍 Extract All Addresses", "desc": "Extract all physical addresses"},
                    {"label": "👤 Extract All Names", "desc": "Extract all contact person names"},
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
                {"label": "📋 Extract Full Summary", "desc": "Extract a comprehensive summary of the content"},
                {"label": "🔗 Extract All Links", "desc": "Extract all URLs and links"},
                {"label": "📧 Extract All Emails", "desc": "Extract all email addresses"},
                {"label": "📞 Extract All Phones", "desc": "Extract all phone numbers"},
                {"label": "📅 Extract All Dates", "desc": "Extract all dates mentioned"},
                {"label": "💰 Extract All Prices", "desc": "Extract all prices and costs"},
                {"label": "📊 Extract All Tables", "desc": "Extract any tabular data"},
                {"label": "🏷️ Extract All Keywords", "desc": "Extract all key topics and keywords"},
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
                {"label": "📋 Extract Full Summary", "desc": "Extract a comprehensive summary of the content"},
                {"label": "🔗 Extract All Links", "desc": "Extract all URLs"},
                {"label": "📧 Extract All Emails", "desc": "Extract all email addresses"},
                {"label": "📞 Extract All Phones", "desc": "Extract all phone numbers"},
            ],
            "detected_type": "generic",
            "confidence": 0,
        }

# ============================================================
# CACHE MANAGEMENT
# ============================================================
@router.delete("/api/scraping/cache")
async def clear_parse_cache():
    from routes.enhanced_parsing import get_parser
    get_parser().clear_cache()
    return {"success": True, "message": "Cache cleared"}