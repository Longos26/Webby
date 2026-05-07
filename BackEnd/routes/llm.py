from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging
import json
from datetime import datetime
from services.LLM_manager import LLMManager, ProviderConfig

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/llm", tags=["LLM"])
llm_manager = LLMManager()

# Request/Response Models
class ParseRequest(BaseModel):
    dom_content: str
    parse_description: str
    provider: str = "openrouter"
    model: Optional[str] = None
    temperature: float = 0.1
    max_tokens: int = 4096
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class ParseResponse(BaseModel):
    extracted_content: str
    provider: str
    model: str
    tokens_used: Optional[int] = None
    processing_time_ms: float
    success: bool
    error: Optional[str] = None

class TestConnectionRequest(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None

class ProviderConfigSave(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    default_model: str
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 4096

class ProviderConfigResponse(BaseModel):
    api_key_masked: Optional[str] = None
    base_url: Optional[str] = None
    default_model: str
    temperature: float
    max_tokens: int

@router.get("/providers")
async def get_providers():
    """Get list of available LLM providers with their configurations"""
    providers = {
        "openrouter": {
            "name": "OpenRouter",
            "icon": "🌐",
            "color": "#8b5cf6",
            "description": "Access to multiple AI models through one API",
            "models": [
                {"id": "openrouter/owl-alpha", "name": "Owl Alpha", "description": "Advanced reasoning model for complex tasks", "recommended": True, "speed": "medium", "context_length": 8192},
                {"id": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "name": "NVIDIA Nemotron (Free)", "description": "Free NVIDIA reasoning model, great for extraction", "recommended": True, "speed": "fast", "context_length": 4096},
                {"id": "openai/gpt-oss-120b:free", "name": "GPT OSS 120B (Free)", "description": "OpenAI's open-source model, balanced performance", "recommended": True, "speed": "medium", "context_length": 8192},
                {"id": "z-ai/glm-4.5-air:free", "name": "GLM 4.5 Air (Free)", "description": "Fast and efficient GLM model", "recommended": False, "speed": "fast", "context_length": 4096},
                {"id": "minimax/minimax-m2.5:free", "name": "MiniMax M2.5 (Free)", "description": "Good for general purpose extraction", "recommended": False, "speed": "fast", "context_length": 4096},
                {"id": "poolside/laguna-m.1:free", "name": "Poolside Laguna (Free)", "description": "Lightweight model for simple tasks", "recommended": False, "speed": "fast", "context_length": 4096},
                {"id": "mistralai/mixtral-8x7b", "name": "Mixtral 8x7B", "description": "High-quality open-source model", "recommended": False, "speed": "slow", "context_length": 32768}
            ],
            "fields": [
                {"key": "apiKey", "label": "OpenRouter API Key", "type": "password", "required": True, "placeholder": "sk-or-v1-..."}
            ],
            "requires_api_key": True,
            "free_tier_available": True
        },
        "alibaba": {
            "name": "Alibaba Wan",
            "icon": "🏮",
            "color": "#ff6a00",
            "description": "Alibaba Cloud's DashScope API",
            "models": [
                {"id": "alibaba/wan-2.7", "name": "Wan 2.7", "description": "Latest Alibaba model, good for Chinese content", "recommended": True, "speed": "medium", "context_length": 8192},
                {"id": "alibaba/qwen-max", "name": "Qwen Max", "description": "Premium Qwen model", "recommended": False, "speed": "slow", "context_length": 8192},
                {"id": "alibaba/qwen-plus", "name": "Qwen Plus", "description": "Balanced Qwen model", "recommended": False, "speed": "medium", "context_length": 8192}
            ],
            "fields": [
                {"key": "apiKey", "label": "DashScope API Key", "type": "password", "required": True, "placeholder": "sk-..."},
                {"key": "baseUrl", "label": "Base URL", "type": "text", "required": False, "placeholder": "https://openrouter.ai/api/v1",}
            ],
            "requires_api_key": True,
            "free_tier_available": False
        },
        "bytedance": {
            "name": "ByteDance Seedance",
            "icon": "🎯",
            "color": "#00a8ff",
            "description": "ByteDance's ARK platform API",
            "models": [
                {"id": "bytedance/seedance-1-5-pro", "name": "Seedance 1.5 Pro", "description": "Advanced ByteDance model", "recommended": True, "speed": "medium", "context_length": 8192},
                {"id": "bytedance/seedance-lite", "name": "Seedance Lite", "description": "Faster, lighter version", "recommended": False, "speed": "fast", "context_length": 4096}
            ],
            "fields": [
                {"key": "apiKey", "label": "ARK API Key", "type": "password", "required": True, "placeholder": "ark-..."},
                {"key": "baseUrl", "label": "Base URL", "type": "text", "required": False, "placeholder": "https://openrouter.ai/api/v1",}
            ],
            "requires_api_key": True,
            "free_tier_available": False
        },
    }
    return providers

@router.post("/parse", response_model=ParseResponse)
async def parse_content(request: ParseRequest, background_tasks: BackgroundTasks):
    """Parse content using selected LLM provider"""
    import time
    start_time = time.time()
    
    try:
        # Validate provider
        valid_providers = ["openrouter", "alibaba", "bytedance", "ollama"]
        if request.provider not in valid_providers:
            raise HTTPException(status_code=400, detail=f"Invalid provider. Must be one of: {valid_providers}")
        
        # Validate required fields
        if request.provider != "ollama" and not request.api_key:
            # Check if we have saved config
            config = llm_manager.configs.get(request.provider)
            if not config or not config.api_key:
                raise HTTPException(status_code=400, detail=f"API key required for {request.provider}")
        
        # Perform parsing
        result = await llm_manager.parse_content(
            dom_content=request.dom_content,
            parse_description=request.parse_description,
            provider=request.provider,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            api_key=request.api_key,
            base_url=request.base_url
        )
        
        processing_time = (time.time() - start_time) * 1000
        
        # Log the request in background
        background_tasks.add_task(
            log_llm_request,
            request.provider,
            request.model or "default",
            len(request.dom_content),
            result["error"] is None
        )
        
        return ParseResponse(
            extracted_content=result["extracted"],
            provider=request.provider,
            model=request.model or llm_manager.configs.get(request.provider, ProviderConfig()).default_model,
            tokens_used=None,  # We don't have token counting yet
            processing_time_ms=round(processing_time, 2),
            success=result["error"] is None,
            error=result["error"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in parse_content: {str(e)}")
        processing_time = (time.time() - start_time) * 1000
        return ParseResponse(
            extracted_content="",
            provider=request.provider,
            model=request.model or "unknown",
            processing_time_ms=round(processing_time, 2),
            success=False,
            error=str(e)
        )

@router.post("/test")
async def test_connection(request: TestConnectionRequest):
    """Test connection to LLM provider"""
    try:
        result = llm_manager.test_connection(
            provider=request.provider,
            model=request.model,
            api_key=request.api_key,
            base_url=request.base_url
        )
        return result
    except Exception as e:
        logger.error(f"Test connection error: {str(e)}")
        return {"success": False, "error": str(e)}

@router.post("/config/{provider}")
async def save_provider_config(provider: str, config: ProviderConfigSave):
    """Save provider configuration"""
    try:
        valid_providers = ["openrouter", "alibaba", "bytedance", "ollama"]
        if provider not in valid_providers:
            raise HTTPException(status_code=400, detail=f"Invalid provider. Must be one of: {valid_providers}")
        
        # For Ollama, base_url is required
        if provider == "ollama" and not config.base_url:
            raise HTTPException(status_code=400, detail="Base URL required for Ollama")
        
        # Save configuration
       
        llm_manager.configs[provider] = ProviderConfig(
            api_key=config.api_key,
            base_url=config.base_url,
            default_model=config.default_model,
            temperature=config.temperature or 0.7,
            max_tokens=config.max_tokens or 4096
        )
        
        # Optionally save to environment or database here
        
        return {"success": True, "message": f"Configuration saved for {provider}"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving config: {str(e)}")
        return {"success": False, "error": str(e)}

@router.get("/config/{provider}")
async def get_provider_config(provider: str):
    """Get provider configuration (masked)"""
    try:
        config = llm_manager.configs.get(provider)
        if not config:
            return {
                "api_key_masked": None,
                "base_url": None,
                "default_model": "",
                "temperature": 0.7,
                "max_tokens": 4096
            }
        
        # Mask API key
        api_key_masked = None
        if config.api_key:
            if len(config.api_key) > 8:
                api_key_masked = config.api_key[:8] + "..." + config.api_key[-4:]
            else:
                api_key_masked = "*" * len(config.api_key)
        
        return {
            "api_key_masked": api_key_masked,
            "base_url": config.base_url,
            "default_model": config.default_model,
            "temperature": config.temperature,
            "max_tokens": config.max_tokens
        }
    
    except Exception as e:
        logger.error(f"Error getting config: {str(e)}")
        return {
            "api_key_masked": None,
            "base_url": None,
            "default_model": "",
            "temperature": 0.7,
            "max_tokens": 4096
        }

@router.get("/stats")
async def get_llm_stats(provider: Optional[str] = None):
    """Get LLM usage statistics"""
    try:
        stats = llm_manager.get_stats(provider)
        return stats
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        return {"error": str(e)}

@router.get("/available-models/{provider}")
async def get_available_models(provider: str):
    """Get available models for a provider"""
    try:
        providers_data = await get_providers()
        if provider not in providers_data:
            raise HTTPException(status_code=404, detail=f"Provider {provider} not found")
        
        return providers_data[provider]["models"]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        return []

async def log_llm_request(provider: str, model: str, content_length: int, success: bool):
    """Background task to log LLM requests"""
    try:
        # Could save to database or analytics service
        logger.info(f"LLM Request - Provider: {provider}, Model: {model}, Content Length: {content_length}, Success: {success}")
    except Exception as e:
        logger.error(f"Error logging LLM request: {str(e)}")