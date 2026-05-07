import os
import json
import time
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum

import aiohttp
import asyncio
from openai import AsyncOpenAI, OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),  
)

logger = logging.getLogger(__name__)

class ProviderType(Enum):
    OPENROUTER = "openrouter"
    ALIBABA = "alibaba"
    BYTEDANCE = "bytedance"

@dataclass
class ProviderConfig:
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    default_model: str = ""
    temperature: float = 0.7
    max_tokens: int = 4096
    
class LLMManager:
    def __init__(self):
        self.configs: Dict[str, ProviderConfig] = {}
        self.clients: Dict[str, Any] = {}
        self.usage_stats: Dict[str, Dict] = {}
        self._load_env_configs()
        
    def _load_env_configs(self):
        """Load configurations from environment variables"""
        # OpenRouter
        if os.getenv("OPENROUTER_API_KEY"):
            self.configs["openrouter"] = ProviderConfig(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/api/v1",
                default_model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
            )
        
        # Alibaba
        if os.getenv("OPENROUTER_API_KEY"):
            self.configs["alibaba"] = ProviderConfig(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/api/v1",
                default_model="alibaba/wan-2.7"
            )
        
        # ByteDance
        if os.getenv("OPENROUTER_API_KEY"):
            self.configs["bytedance"] = ProviderConfig(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/api/v1",
                default_model="bytedance/seedance-1-5-pro"
            )
        
    
    def _get_client(self, provider: str, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """Get or create API client for provider"""
        config = self.configs.get(provider, ProviderConfig())
        
        # Override with request-specific values
        effective_api_key = api_key or config.api_key
        effective_base_url = base_url or config.base_url
        
        if not effective_base_url:
            # Set default base URLs
            if provider == "openrouter":
                effective_base_url = "https://openrouter.ai/api/v1"
            elif provider == "alibaba":
                effective_base_url = "https://openrouter.ai/api/v1"
            elif provider == "bytedance":
                effective_base_url = "https://openrouter.ai/api/v1"
           
        
        # Create client
        client_key = f"{provider}:{effective_base_url}"
        if client_key not in self.clients:
            self.clients[client_key] = AsyncOpenAI(
                api_key=effective_api_key or "dummy",
                base_url=effective_base_url,
                timeout=60.0
            )
        
        return self.clients[client_key]
    
    async def parse_content(
        self,
        dom_content: str,
        parse_description: str,
        provider: str = "openrouter",
        model: Optional[str] = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Parse HTML/XML content using LLM"""
        start_time = time.time()
        
        try:
            config = self.configs.get(provider, ProviderConfig())
            model_to_use = model or config.default_model
            
            if not model_to_use:
                raise ValueError(f"No model specified for provider {provider}")
            
            # Create prompt
            prompt = self._create_parsing_prompt(dom_content, parse_description)
            
            client = self._get_client(provider, api_key, base_url)
            
            # Make API call
            response = await client.chat.completions.create(
                model=model_to_use,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a web scraping and data extraction expert. Extract exactly the requested information from the HTML content. Return only the extracted data, no explanations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            extracted_content = response.choices[0].message.content
            
            # Update usage stats
            processing_time = time.time() - start_time
            self._update_stats(provider, model_to_use, processing_time, True)
            
            return {
                "extracted": extracted_content,
                "error": None,
                "processing_time": processing_time
            }
            
        except Exception as e:
            logger.error(f"LLM parsing error: {str(e)}")
            processing_time = time.time() - start_time
            self._update_stats(provider, model or "unknown", processing_time, False)
            
            return {
                "extracted": "",
                "error": str(e),
                "processing_time": processing_time
            }
    
    def _create_parsing_prompt(self, dom_content: str, parse_description: str) -> str:
        """Create a detailed parsing prompt"""
        # Truncate content if too long
        max_length = 50000
        if len(dom_content) > max_length:
            dom_content = dom_content[:max_length] + "\n... (truncated)"
        
        return f"""Extract the following information from the HTML content below:

{parse_description}

HTML Content:
{dom_content}

Return ONLY the extracted data in a clean, structured format. Do not include any explanations or additional text."""
    
    def _update_stats(self, provider: str, model: str, processing_time: float, success: bool):
        """Update usage statistics"""
        key = f"{provider}:{model}"
        if key not in self.usage_stats:
            self.usage_stats[key] = {
                "total_requests": 0,
                "successful_requests": 0,
                "total_processing_time": 0,
                "errors": 0
            }
        
        stats = self.usage_stats[key]
        stats["total_requests"] += 1
        stats["total_processing_time"] += processing_time
        
        if success:
            stats["successful_requests"] += 1
        else:
            stats["errors"] += 1
    
    def test_connection(
        self,
        provider: str,
        model: str,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Test connection to LLM provider (synchronous for simplicity)"""
        try:
            # Try to make a simple test call
            import requests
            
            config = self.configs.get(provider, ProviderConfig())
            effective_api_key = api_key or config.api_key
            effective_base_url = base_url or config.base_url
            
            if provider == "openrouter":
                headers = {
                    "Authorization": f"Bearer {effective_api_key}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": model,
                    "messages": [{"role": "user", "content": "Test"}],
                    "max_tokens": 10
                }
                
                response = requests.post(
                    f"{effective_base_url}/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    return {"success": True, "message": "Connection successful"}
                else:
                    return {"success": False, "error": response.json().get("error", {}).get("message", "Unknown error")}
            
            elif provider in ["alibaba", "bytedance"]:
                # Similar test for other providers
                headers = {
                    "Authorization": f"Bearer {effective_api_key}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": model,
                    "messages": [{"role": "user", "content": "Test"}],
                    "max_tokens": 10
                }
                
                response = requests.post(
                    f"{effective_base_url}/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    return {"success": True, "message": "Connection successful"}
                else:
                    return {"success": False, "error": response.json().get("error", {}).get("message", "Unknown error")}
            
            elif provider == "ollama":
                response = requests.get(f"{effective_base_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    if any(m["name"].startswith(model) for m in models):
                        return {"success": True, "message": f"Ollama connected, model {model} available"}
                    else:
                        return {"success": False, "error": f"Model {model} not found in Ollama"}
                else:
                    return {"success": False, "error": "Cannot connect to Ollama"}
            
            else:
                return {"success": False, "error": f"Unknown provider: {provider}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_stats(self, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get usage statistics"""
        if provider:
            filtered_stats = {
                k: v for k, v in self.usage_stats.items()
                if k.startswith(f"{provider}:")
            }
        else:
            filtered_stats = self.usage_stats
        
        # Calculate aggregates
        total_requests = sum(s["total_requests"] for s in filtered_stats.values())
        total_success = sum(s["successful_requests"] for s in filtered_stats.values())
        total_time = sum(s["total_processing_time"] for s in filtered_stats.values())
        
        return {
            "by_model": filtered_stats,
            "total_requests": total_requests,
            "success_rate": (total_success / total_requests * 100) if total_requests > 0 else 0,
            "avg_processing_time": (total_time / total_requests) if total_requests > 0 else 0
        }

# Singleton instance
llm_manager = LLMManager()