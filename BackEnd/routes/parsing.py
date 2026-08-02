# routes/parsing.py
from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from typing import Optional
from parsing.Ollama import parse_with_openrouter, parse_with_openrouter_async
from mongodb.database import get_database
from routes.auth import get_current_user
import logging
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

class ParseRequest(BaseModel):
    dom_content: Optional[str] = None  
    parse_description: str
    use_simple_mode: bool = True

class ParseResponse(BaseModel):
    parse_result: str
    parse_description: str
    created_at: datetime

@router.post("/api/scraping/jobs/{job_id}/parse")
async def parse_job_content(job_id: str, request: ParseRequest):
    """
    Parse job content using OpenRouter with proper error handling
    """
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    db = await get_database()
    
    # Get the job to access its content
    job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get DOM content
    dom_content = request.dom_content if request.dom_content else job.get("scraped_content")
    
    if not dom_content:
        raise HTTPException(
            status_code=400, 
            detail="No content available to parse"
        )
    
    try:
        # Parse with timeout and better error handling
        parsed_result = await asyncio.wait_for(
            parse_with_openrouter_async(
                dom_content, 
                request.parse_description
            ),
            timeout=120.0  # Increased timeout for large content
        )
        
        # Save the parse result - NO TRUNCATION
        parse_doc = {
            "job_id": ObjectId(job_id),
            "parse_description": request.parse_description,
            "parsed_content": parsed_result,  # FULL CONTENT - NO TRUNCATION
            "created_at": datetime.utcnow()
        }
        
        result = await db.parsed_results.insert_one(parse_doc)
        
        # Update job with FULL result (not truncated)
        await db.jobs.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {
                "last_parse_description": request.parse_description, 
                "last_parse_at": datetime.utcnow(),
                "last_parsed_result": parsed_result  # FULL CONTENT - NO TRUNCATION
            }}
        )
        
        return ParseResponse(
            parse_result=parsed_result,
            parse_description=request.parse_description,
            created_at=datetime.utcnow()
        )
        
    except asyncio.TimeoutError:
        logger.error(f"Parse timeout for job {job_id}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Parse request timed out after 120 seconds"
        )
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error parsing job {job_id}: {error_msg}")
        
        # Provide more specific error messages
        if "rate limit" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please wait a moment and try again."
            )
        elif "quota" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="API quota exceeded. Please check your OpenRouter credits."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse content: {error_msg[:200]}"
            )


@router.get("/api/scraping/jobs/{job_id}/parsed-results")
async def get_parsed_results(job_id: str):
    """
    Get all parsed results for a job
    """
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    db = await get_database()
    
    # Get all parsed results for this job
    cursor = db.parsed_results.find({"job_id": ObjectId(job_id)}).sort("created_at", -1)
    parsed_results = []
    
    async for result in cursor:
        parsed_results.append({
            "id": str(result["_id"]),
            "job_id": str(result["job_id"]),
            "parse_description": result["parse_description"],
            "parsed_content": result["parsed_content"],  # FULL CONTENT
            "created_at": result["created_at"]
        })
    
    return {"parsed_results": parsed_results, "success": True}


@router.delete("/api/scraping/results/{result_id}")
async def delete_parsed_result(result_id: str):
    """
    Delete a specific parsed result
    """
    if not ObjectId.is_valid(result_id):
        raise HTTPException(status_code=400, detail="Invalid result ID format")
    
    db = await get_database()
    result = await db.parsed_results.delete_one({"_id": ObjectId(result_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parse result not found")
    
    return {"message": "Parse result deleted successfully"}

class GenerateRecommendationsRequest(BaseModel):
    content: str
    job_name: str
    url: str

@router.post("/generate-recommendations")
async def generate_recommendations(
    request: GenerateRecommendationsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI-powered parsing recommendations based on content"""
    try:
        user_id = current_user.get("id") or current_user.get("_id")
        logger.info(f"Generating recommendations for user {user_id}")
        
        # Analyze content to determine what it contains
        content_lower = request.content.lower()
        recommendations = []
        
        # Detect content type and suggest relevant parsing
        if any(keyword in content_lower for keyword in ['pokémon', 'pokemon', 'pokedex', 'evolution', 'type', 'ability']):
            recommendations = [
                {"label": "🔍 Pokémon Names", "desc": "Extract all Pokémon names"},
                {"label": "⚡ Types", "desc": "Extract Pokémon types (Fire, Water, Grass, etc.)"},
                {"label": "📊 Stats", "desc": "Extract Pokémon stats (HP, Attack, Defense, Speed)"},
                {"label": "🔄 Evolutions", "desc": "Extract evolution chains and requirements"},
                {"label": "🏆 Abilities", "desc": "Extract Pokémon abilities and descriptions"},
                {"label": "📍 Locations", "desc": "Extract where Pokémon can be found"},
                {"label": "🎯 Move Sets", "desc": "Extract moves and their effects"},
                {"label": "⭐ Rarity", "desc": "Extract rarity or legendary status"}
            ]
        elif any(keyword in content_lower for keyword in ['product', 'price', 'buy', 'shop', 'store', 'cart']):
            recommendations = [
                {"label": "📦 Product Names", "desc": "Extract all product names"},
                {"label": "💲 Prices", "desc": "Extract product prices"},
                {"label": "📝 Descriptions", "desc": "Extract product descriptions"},
                {"label": "⭐ Ratings", "desc": "Extract product ratings and reviews"},
                {"label": "🛒 In Stock", "desc": "Extract availability status"},
                {"label": "🏷️ Categories", "desc": "Extract product categories"},
                {"label": "📸 Images", "desc": "Extract image URLs"}
            ]
        elif any(keyword in content_lower for keyword in ['article', 'blog', 'post', 'news']):
            recommendations = [
                {"label": "📰 Headlines", "desc": "Extract article headlines"},
                {"label": "✍️ Authors", "desc": "Extract author names"},
                {"label": "📅 Dates", "desc": "Extract publication dates"},
                {"label": "🏷️ Categories", "desc": "Extract categories or tags"},
                {"label": "📊 Key Points", "desc": "Extract key points and summaries"},
                {"label": "🔗 References", "desc": "Extract references and sources"}
            ]
        elif any(keyword in content_lower for keyword in ['job', 'hiring', 'career', 'position', 'salary']):
            recommendations = [
                {"label": "💼 Job Titles", "desc": "Extract job titles"},
                {"label": "🏢 Companies", "desc": "Extract company names"},
                {"label": "📍 Locations", "desc": "Extract job locations"},
                {"label": "💰 Salaries", "desc": "Extract salary ranges"},
                {"label": "📋 Requirements", "desc": "Extract job requirements"},
                {"label": "📅 Deadlines", "desc": "Extract application deadlines"}
            ]
        elif any(keyword in content_lower for keyword in ['email', 'contact', 'phone', 'address']):
            recommendations = [
                {"label": "📧 Email Addresses", "desc": "Extract all email addresses"},
                {"label": "📞 Phone Numbers", "desc": "Extract phone numbers"},
                {"label": "📍 Addresses", "desc": "Extract physical addresses"},
                {"label": "🔗 URLs", "desc": "Extract all URLs and links"},
                {"label": "👤 Names", "desc": "Extract person/contact names"}
            ]
        else:
            # Generic recommendations
            recommendations = [
                {"label": "📋 Content Summary", "desc": "Summarize the entire content"},
                {"label": "🔗 All Links", "desc": "Extract all URLs from the content"},
                {"label": "📧 Email Addresses", "desc": "Extract all email addresses"},
                {"label": "📞 Phone Numbers", "desc": "Extract phone numbers"},
                {"label": "📅 Dates", "desc": "Extract all dates mentioned"},
                {"label": "💰 Prices", "desc": "Extract all prices and costs"}
            ]
        
        return {
            "success": True,
            "recommendations": recommendations[:8],
            "content_type": "detected",
            "message": f"Generated {len(recommendations)} recommendations"
        }
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        # Return fallback recommendations
        return {
            "success": True,
            "recommendations": [
                {"label": "📋 Summary", "desc": "Summarize the content"},
                {"label": "🔗 Links", "desc": "Extract all URLs"},
                {"label": "📧 Emails", "desc": "Extract all email addresses"},
                {"label": "📞 Phone", "desc": "Extract phone numbers"},
                {"label": "📅 Dates", "desc": "Extract all dates"},
                {"label": "💰 Prices", "desc": "Extract all prices"}
            ],
            "message": "Using fallback recommendations"
        }