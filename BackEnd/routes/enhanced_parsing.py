# backend/parsing/enhanced_parser.py
"""
Enhanced LLM Parser with chunking, retry logic, caching, and streaming support.
"""

import asyncio
import hashlib
import json
import logging
import os
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Callable, Awaitable
from dataclasses import dataclass, field

from fastapi import APIRouter

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False
    aiohttp = None

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/enhanced-parsing", tags=["Enhanced_Parsing"])


# ============================================================
# MODEL CONFIGURATION — SINGLE SOURCE OF TRUTH
# ============================================================
# Only currently-live free models on OpenRouter.
# DO NOT add deprecated IDs like "anthropic/claude-3-haiku".
DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"
FALLBACK_MODELS = [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
]
ALLOWED_MODELS = set(FALLBACK_MODELS)


def sanitize_model(requested: Optional[str]) -> str:
    """Block stale/deprecated model IDs from breaking parsing."""
    if not requested:
        return DEFAULT_MODEL
    if requested in ALLOWED_MODELS:
        return requested
    logger.warning(
        f"Model '{requested}' is not allowed. Falling back to '{DEFAULT_MODEL}'."
    )
    return DEFAULT_MODEL


# ============================================================
# CONFIGURATION
# ============================================================

@dataclass
class ParserConfig:
    """Configuration for the enhanced parser"""
    provider: str = "openrouter"
    model: str = DEFAULT_MODEL                        # was "anthropic/claude-3-haiku"
    api_key: str = ""
    base_url: str = "https://openrouter.ai/api/v1"
    max_tokens: int = 4096
    temperature: float = 0.1
    timeout_seconds: int = 120
    max_retries: int = 3
    retry_delay: float = 2.0
    chunk_size: int = 12000
    max_chunks: int = 10
    enable_cache: bool = True
    cache_ttl_seconds: int = 3600

    @classmethod
    def from_env(cls) -> "ParserConfig":
        return cls(
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
            # Never fall back to a deprecated model — use our DEFAULT_MODEL
            model=sanitize_model(os.getenv("DEFAULT_MODEL", DEFAULT_MODEL)),
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        )


@dataclass
class ParseResult:
    """Result of a parsing operation"""
    success: bool
    content: str
    chunks_processed: int = 0
    total_chunks: int = 0
    tokens_used: int = 0
    processing_time_ms: float = 0
    cached: bool = False
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


# ============================================================
# IN-MEMORY CACHE
# ============================================================

class ParseCache:
    """Simple in-memory cache for parse results"""

    def __init__(self, ttl_seconds: int = 3600, max_size: int = 100):
        self._cache: Dict[str, tuple] = {}
        self.ttl = ttl_seconds
        self.max_size = max_size

    def _make_key(self, content: str, description: str, model: str) -> str:
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
        desc_hash = hashlib.sha256(description.encode()).hexdigest()[:8]
        return f"{content_hash}:{desc_hash}:{model}"

    def get(self, content: str, description: str, model: str) -> Optional[str]:
        key = self._make_key(content, description, model)
        if key in self._cache:
            result, timestamp = self._cache[key]
            if datetime.utcnow() - timestamp < timedelta(seconds=self.ttl):
                return result
            else:
                del self._cache[key]
        return None

    def set(self, content: str, description: str, model: str, result: str):
        if len(self._cache) >= self.max_size:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k][1])
            del self._cache[oldest_key]
        key = self._make_key(content, description, model)
        self._cache[key] = (result, datetime.utcnow())

    def clear(self):
        self._cache.clear()


_parse_cache = ParseCache()


# ============================================================
# CONTENT CHUNKING
# ============================================================

def chunk_content(content: str, chunk_size: int = 12000, overlap: int = 500) -> List[str]:
    """Split content into overlapping chunks at natural boundaries."""
    if len(content) <= chunk_size:
        return [content]

    chunks = []
    start = 0

    while start < len(content):
        end = start + chunk_size

        if end >= len(content):
            chunks.append(content[start:])
            break

        break_point = end

        para_break = content.rfind('\n\n', start + chunk_size // 2, end)
        if para_break > start:
            break_point = para_break + 2
        else:
            line_break = content.rfind('\n', start + chunk_size // 2, end)
            if line_break > start:
                break_point = line_break + 1
            else:
                sentence_end = max(
                    content.rfind('. ', start + chunk_size // 2, end),
                    content.rfind('! ', start + chunk_size // 2, end),
                    content.rfind('? ', start + chunk_size // 2, end)
                )
                if sentence_end > start:
                    break_point = sentence_end + 2
                else:
                    space = content.rfind(' ', start + chunk_size // 2, end)
                    if space > start:
                        break_point = space + 1

        chunks.append(content[start:break_point])
        start = break_point - overlap if break_point < len(content) else break_point

    return chunks


# ============================================================
# PROMPTS
# ============================================================

SYSTEM_PROMPT = """You are an expert data extraction assistant. Your job is to extract structured information from web content based on user instructions.

IMPORTANT RULES:
1. Extract ONLY what is requested - do not add extra information
2. Format output as clean, readable text or JSON as appropriate
3. If data is not found, say "Not found" for that field
4. Be precise and accurate - do not hallucinate data
5. Preserve the original data values exactly as they appear
6. For lists, use bullet points or numbered lists
7. For structured data, use JSON format with proper indentation"""


def build_parse_prompt(content: str, description: str, chunk_info: Optional[str] = None) -> str:
    chunk_context = f"\n[NOTE: {chunk_info}]\n" if chunk_info else ""
    return f"""Extract the following information from the web content below:

**EXTRACTION INSTRUCTIONS:**
{description}

**WEB CONTENT:**
{content}
{chunk_context}

**OUTPUT REQUIREMENTS:**
- Extract exactly what was requested
- Use clean formatting (JSON for structured data, text for summaries)
- If a requested field is not found, write "Not found"
- Be accurate and do not make up information"""


# ============================================================
# LLM API CALLS
# ============================================================

async def call_openrouter(prompt: str, config: ParserConfig, system_prompt: str = SYSTEM_PROMPT):
    if not AIOHTTP_AVAILABLE:
        raise Exception("aiohttp is not installed. Run: pip install aiohttp")

    if not config.api_key:
        raise Exception("OPENROUTER_API_KEY is not configured on the server")

    # Sanitize again in case the config was constructed with a stale model
    model = sanitize_model(config.model)

    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "Scraping Platform"
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": config.temperature,
        "max_tokens": config.max_tokens
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{config.base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=config.timeout_seconds)
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"API error {response.status}: {error_text[:500]}")

            data = await response.json()

            if "choices" not in data or not data["choices"]:
                raise Exception("No choices in API response")

            content = data["choices"][0]["message"]["content"]
            tokens = data.get("usage", {}).get("total_tokens", 0)
            return content, tokens


async def call_llm_with_retry(prompt: str, config: ParserConfig, system_prompt: str = SYSTEM_PROMPT):
    last_error = None
    model = sanitize_model(config.model)

    for attempt in range(config.max_retries):
        try:
            return await call_openrouter(prompt, config, system_prompt)
        except asyncio.TimeoutError:
            last_error = "Request timed out"
            logger.warning(f"Attempt {attempt + 1} timed out")
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Attempt {attempt + 1} failed on {model}: {e}")

            # Auth errors won't be fixed by retrying — bail out immediately
            if "401" in str(e) or "403" in str(e):
                raise

            # Deprecated model — don't retry the same dead model
            if "deprecated" in str(e).lower() or "404" in str(e):
                raise Exception(
                    f"Model '{model}' is unavailable. "
                    f"Update ParserConfig.model or ALLOWED_MODELS."
                )

            if "rate limit" in str(e).lower():
                await asyncio.sleep(config.retry_delay * (attempt + 2))
                continue

        if attempt < config.max_retries - 1:
            delay = config.retry_delay * (2 ** attempt)
            logger.info(f"Retrying in {delay} seconds...")
            await asyncio.sleep(delay)

    raise Exception(f"All {config.max_retries} attempts failed. Last error: {last_error}")


# ============================================================
# MAIN PARSER
# ============================================================

class EnhancedParser:
    """Enhanced LLM parser with chunking, caching, and retry logic."""

    def __init__(self, config: Optional[ParserConfig] = None):
        self.config = config or ParserConfig.from_env()
        # Guarantee the config is never holding a dead model ID
        self.config.model = sanitize_model(self.config.model)
        self.cache = _parse_cache

    async def parse(
        self,
        content: str,
        description: str,
        job_id: Optional[str] = None,
        stream_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None
    ) -> ParseResult:
        start_time = datetime.utcnow()

        if not content or len(content.strip()) < 10:
            return ParseResult(
                success=False,
                content="",
                error="Content is empty or too short to parse"
            )

        if not description or len(description.strip()) < 5:
            return ParseResult(
                success=False,
                content="",
                error="Parse description is required"
            )

        if self.config.enable_cache:
            cached = self.cache.get(content, description, self.config.model)
            if cached:
                logger.info(f"Cache hit for job {job_id}")
                return ParseResult(
                    success=True,
                    content=cached,
                    cached=True,
                    processing_time_ms=(datetime.utcnow() - start_time).total_seconds() * 1000,
                    metadata={"model": self.config.model, "cached": True}
                )

        chunks = chunk_content(content, self.config.chunk_size)
        total_chunks = len(chunks)

        logger.info(
            f"Job {job_id}: Processing {total_chunks} chunk(s), "
            f"total {len(content)} chars, model={self.config.model}"
        )

        if stream_callback:
            await stream_callback({
                "type": "start",
                "total_chunks": total_chunks,
                "total_chars": len(content),
                "model": self.config.model,
            })

        all_results = []
        total_tokens = 0
        errors = []

        for i, chunk in enumerate(chunks):
            chunk_info = None
            if total_chunks > 1:
                chunk_info = f"This is chunk {i + 1} of {total_chunks}. Extract relevant data from this portion."

            prompt = build_parse_prompt(chunk, description, chunk_info)

            try:
                if stream_callback:
                    await stream_callback({
                        "type": "chunk_start",
                        "chunk_index": i,
                        "total_chunks": total_chunks
                    })

                result, tokens = await call_llm_with_retry(prompt, self.config)
                all_results.append(result)
                total_tokens += tokens

                if stream_callback:
                    await stream_callback({
                        "type": "chunk_complete",
                        "chunk_index": i,
                        "total_chunks": total_chunks,
                        "content": result,
                        "tokens": tokens
                    })

                logger.info(f"Job {job_id}: Chunk {i + 1}/{total_chunks} complete ({tokens} tokens)")

            except Exception as e:
                error_msg = f"Chunk {i + 1} failed: {str(e)}"
                logger.error(f"Job {job_id}: {error_msg}")
                errors.append(error_msg)

                if stream_callback:
                    await stream_callback({
                        "type": "chunk_error",
                        "chunk_index": i,
                        "error": str(e)
                    })

        if total_chunks == 1:
            combined_content = all_results[0] if all_results else ""
        else:
            combined_content = self._merge_chunk_results(all_results, description)

        if combined_content and not errors and self.config.enable_cache:
            self.cache.set(content, description, self.config.model, combined_content)

        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000

        result = ParseResult(
            success=len(all_results) > 0 and bool(combined_content),
            content=combined_content,
            chunks_processed=len(all_results),
            total_chunks=total_chunks,
            tokens_used=total_tokens,
            processing_time_ms=processing_time,
            cached=False,
            error="; ".join(errors) if errors and not combined_content else None,
            metadata={
                "model": self.config.model,
                "provider": self.config.provider,
                "description": description[:200],
                "partial_errors": errors if errors and combined_content else None,
            }
        )

        if stream_callback:
            await stream_callback({
                "type": "complete",
                "success": result.success,
                "total_tokens": total_tokens,
                "processing_time_ms": processing_time
            })

        logger.info(
            f"Job {job_id}: Parse complete - "
            f"{result.chunks_processed}/{total_chunks} chunks, "
            f"{total_tokens} tokens, "
            f"{processing_time:.0f}ms "
            f"model={self.config.model}"
        )

        return result

    def _merge_chunk_results(self, results: List[str], description: str) -> str:
        if not results:
            return ""
        if len(results) == 1:
            return results[0]

        json_results = []
        all_json = True
        for r in results:
            try:
                json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', r)
                if json_match:
                    json_results.append(json.loads(json_match.group(1)))
                else:
                    json_results.append(json.loads(r))
            except (json.JSONDecodeError, TypeError):
                all_json = False
                break

        if all_json and json_results and all(isinstance(j, dict) for j in json_results):
            merged = {}
            for j in json_results:
                for key, value in j.items():
                    if key in merged:
                        if isinstance(merged[key], list) and isinstance(value, list):
                            merged[key].extend(value)
                        elif isinstance(merged[key], str) and isinstance(value, str):
                            if value != "Not found" and value not in merged[key]:
                                merged[key] += f"\n{value}"
                    else:
                        merged[key] = value
            return json.dumps(merged, indent=2, ensure_ascii=False)

        sections = []
        for i, result in enumerate(results):
            if result.strip():
                sections.append(f"--- Part {i + 1} ---\n{result}")

        return "\n\n".join(sections)

    def clear_cache(self):
        self.cache.clear()


# ============================================================
# SINGLETON
# ============================================================

_parser_instance: Optional[EnhancedParser] = None


def get_parser(config: Optional[ParserConfig] = None) -> EnhancedParser:
    global _parser_instance
    if _parser_instance is None or config is not None:
        _parser_instance = EnhancedParser(config)
    return _parser_instance


# ============================================================
# CONVENIENCE FUNCTIONS
# ============================================================

async def parse_content_async(
    content: str,
    description: str,
    job_id: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    stream_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None
) -> ParseResult:
    base = get_parser()
    config = ParserConfig(
        api_key=api_key or base.config.api_key or os.getenv("OPENROUTER_API_KEY", ""),
        # Was: model or base.config.model or "anthropic/claude-3-haiku"
        model=sanitize_model(model or base.config.model or DEFAULT_MODEL),
        base_url=base.config.base_url or os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
    )
    parser = EnhancedParser(config)
    parser.cache = base.cache
    return await parser.parse(content, description, job_id, stream_callback)


def parse_content_sync(
    content: str,
    description: str,
    job_id: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> ParseResult:
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(asyncio.run, parse_content_async(
                    content, description, job_id, api_key, model
                ))
                return future.result()
    except RuntimeError:
        pass

    return asyncio.run(parse_content_async(content, description, job_id, api_key, model))