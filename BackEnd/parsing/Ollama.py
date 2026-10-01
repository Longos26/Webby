# parsing/Ollama.py
import os
import time
import asyncio
import logging
from typing import List, Union, Optional, Dict, Any
from dataclasses import dataclass, field

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# ------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------
# Primary model — verified working free model on OpenRouter
DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"

# Only include models that are CURRENTLY live and free on OpenRouter.
# DO NOT add: anthropic/claude-3-haiku (deprecated Sep 2026),
#             openai/gpt-3.5-turbo (requires paid credits),
#             meta-llama/llama-3.1-* (deprecated)
FALLBACK_MODELS = [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
]

# A set for fast membership checks (used by route sanitization)
ALLOWED_MODELS = set(FALLBACK_MODELS)

REQUEST_DELAY = 1.0        # reduced from 2.0 — free tier tolerates 1s
MAX_RETRIES = 3
INITIAL_DELAY = 2
MAX_DELAY = 30

# ------------------------------------------------------------
# API KEY CHECK
# ------------------------------------------------------------
_api_key = os.getenv("OPENROUTER_API_KEY")
if not _api_key:
    logger.error("OPENROUTER_API_KEY is not set! Parsing will fail.")
    client = None
else:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=_api_key,
        timeout=120.0,
        max_retries=2,
    )

# ------------------------------------------------------------
# RESULT TYPE
# ------------------------------------------------------------
@dataclass
class ParseResult:
    success: bool
    content: str = ""
    tokens_used: int = 0
    processing_time_ms: float = 0.0
    cached: bool = False
    chunks_processed: int = 1
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

# ------------------------------------------------------------
# SYSTEM PROMPT
# ------------------------------------------------------------
SYSTEM_PROMPT = (
    "You are a precise information extraction system. Extract ONLY the requested "
    "information. Be extremely concise. Return ONLY the extracted data, nothing else. "
    'If not found, return "NOT_FOUND". No explanations, no apologies.'
)

# ------------------------------------------------------------
# HELPERS
# ------------------------------------------------------------
def is_rate_limit_error(exception: Exception) -> bool:
    s = str(exception).lower()
    return any(p in s for p in [
        "rate limit", "rate_limit", "too many requests",
        "429", "ratelimit", "quota"
    ])

def is_auth_error(exception: Exception) -> bool:
    s = str(exception).lower()
    return any(p in s for p in [
        "401", "unauthorized", "invalid api key",
        "no auth", "authentication"
    ])

def is_model_not_found_error(exception: Exception) -> bool:
    """Detects 404 / deprecated-model errors so we can skip them fast."""
    s = str(exception).lower()
    return any(p in s for p in [
        "404", "deprecated", "not found", "no endpoints found",
        "model not found", "does not exist"
    ])

def sanitize_model(requested: Optional[str]) -> str:
    """
    Ensure the model passed in is one we explicitly allow.
    Prevents stale/deprecated model IDs from the frontend or DB
    (e.g. 'anthropic/claude-3-haiku') from breaking parsing.
    """
    if not requested:
        return DEFAULT_MODEL
    if requested in ALLOWED_MODELS:
        return requested
    logger.warning(
        f"Requested model '{requested}' is not in ALLOWED_MODELS. "
        f"Falling back to '{DEFAULT_MODEL}'."
    )
    return DEFAULT_MODEL

# ------------------------------------------------------------
# CORE API CALL
# ------------------------------------------------------------
def _make_api_request(messages: List[Dict[str, str]], model: str) -> Dict[str, Any]:
    """Single API call. Returns {content, tokens_used}."""
    if client is None:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not configured. Set it in your .env file."
        )

    time.sleep(REQUEST_DELAY)

    logger.info(f"OpenRouter request → model={model}, messages={len(messages)}")
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        stream=False,
        temperature=0.1,
        max_tokens=4000,
        top_p=0.9,
    )

    content = (response.choices[0].message.content or "").strip() or "NOT_FOUND"
    tokens = 0
    if getattr(response, "usage", None):
        tokens = getattr(response.usage, "total_tokens", 0) or 0
        logger.info(
            f"Tokens: total={response.usage.total_tokens} "
            f"prompt={response.usage.prompt_tokens} "
            f"completion={response.usage.completion_tokens}"
        )
    return {"content": content, "tokens_used": tokens}

def _call_with_fallback(messages: List[Dict[str, str]], model: str) -> Dict[str, Any]:
    """Try model, then each fallback. Raise only if all fail."""
    tried = []
    candidates = [model] + [m for m in FALLBACK_MODELS if m != model]

    last_err = None
    for candidate in candidates:
        tried.append(candidate)
        try:
            return _make_api_request(messages, candidate)
        except Exception as e:
            last_err = e

            # Auth errors won't be fixed by switching model — bail immediately
            if is_auth_error(e):
                logger.error(f"Auth error on {candidate}: {e}")
                raise

            # Deprecated/404 model — skip to next immediately
            if is_model_not_found_error(e):
                logger.warning(
                    f"Model {candidate} unavailable (404/deprecated). "
                    f"Trying next fallback."
                )
                continue

            # Rate limit — try next fallback
            if is_rate_limit_error(e):
                logger.warning(f"Rate limit on {candidate}. Trying next fallback.")
                continue

            # Any other error — still try next fallback
            logger.warning(f"Model {candidate} failed: {e}")
            continue

    raise RuntimeError(
        f"All {len(tried)} model attempts failed. "
        f"Tried: {tried}. Last error: {last_err}"
    )

# ------------------------------------------------------------
# SYNC PARSE
# ------------------------------------------------------------
def parse_with_openrouter(
    dom_content: Union[str, List[str]],
    parse_description: str,
    model: str = DEFAULT_MODEL,
    max_chunk_size: int = 6000,
    overlap: int = 200,
    simple_mode: bool = True,
) -> str:
    """Public sync API — returns the extracted string (or 'ERROR: ...')."""
    result = parse_with_openrouter_result(
        dom_content=dom_content,
        parse_description=parse_description,
        model=model,
        max_chunk_size=max_chunk_size,
        overlap=overlap,
        simple_mode=simple_mode,
    )
    return result.content if result.success else f"ERROR: {result.error}"

def parse_with_openrouter_result(
    dom_content: Union[str, List[str]],
    parse_description: str,
    model: str = DEFAULT_MODEL,
    max_chunk_size: int = 6000,
    overlap: int = 200,
    simple_mode: bool = True,
) -> ParseResult:
    """Structured result — used by routes/parsing.py."""
    started = time.time()

    # ALWAYS sanitize the model first
    model = sanitize_model(model)

    if not dom_content:
        return ParseResult(
            success=False,
            error="Empty DOM content",
            processing_time_ms=0,
        )

    if isinstance(dom_content, list):
        dom_content = "\n\n---\n\n".join(str(x) for x in dom_content)

    if len(dom_content) > 50000:
        logger.warning(f"Content too long ({len(dom_content)}), truncating to 50000")
        dom_content = dom_content[:50000]

    try:
        if simple_mode and len(dom_content) > max_chunk_size:
            content, tokens, chunks = _parse_simple(dom_content, parse_description, model)
        elif len(dom_content) <= max_chunk_size:
            content, tokens, chunks = _parse_single(dom_content, parse_description, model)
        else:
            content, tokens, chunks = _parse_chunked(
                dom_content, parse_description, model, max_chunk_size, overlap
            )

        elapsed = (time.time() - started) * 1000
        return ParseResult(
            success=True,
            content=content,
            tokens_used=tokens,
            processing_time_ms=elapsed,
            chunks_processed=chunks,
            metadata={"model": model},
        )
    except Exception as e:
        elapsed = (time.time() - started) * 1000
        logger.error(f"parse_with_openrouter failed: {e}")
        return ParseResult(
            success=False,
            error=str(e)[:300],
            processing_time_ms=elapsed,
            metadata={"model": model},
        )

def _parse_single(content: str, description: str, model: str):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Extract from the content below:\n{description}\n\n"
                f"Content:\n{content[:6000]}\n\n"
                "Return ONLY the extracted information or NOT_FOUND."
            ),
        },
    ]
    r = _call_with_fallback(messages, model)
    return r["content"], r["tokens_used"], 1

def _parse_simple(content: str, description: str, model: str):
    sample = content[:4000]
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Extract: {description}\n\nFrom content start:\n{sample}\n\n"
                "Return ONLY the extracted information."
            ),
        },
    ]
    r = _call_with_fallback(messages, model)
    return r["content"], r["tokens_used"], 1

def _parse_chunked(content: str, description: str, model: str,
                   chunk_size: int, overlap: int):
    chunks = []
    start = 0
    while start < len(content) and len(chunks) < 10:
        end = min(start + chunk_size, len(content))
        chunks.append(content[start:end])
        start += chunk_size - overlap

    logger.info(f"Processing {len(chunks)} chunks")
    results = []
    total_tokens = 0
    failures = 0

    for i, chunk in enumerate(chunks, 1):
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"Extract: {description}\n\nChunk {i}/{len(chunks)}:\n{chunk}\n\n"
                    "Return extracted info or NOT_FOUND."
                ),
            },
        ]
        try:
            r = _call_with_fallback(messages, model)
            total_tokens += r["tokens_used"]
            if r["content"] and r["content"] != "NOT_FOUND":
                results.append(r["content"])
        except Exception as e:
            failures += 1
            logger.error(f"Chunk {i} failed: {e}")
            if failures > 2:
                logger.error("Too many chunk failures — aborting")
                break

    if not results:
        return "NOT_FOUND", total_tokens, len(chunks)

    # Deduplicate
    seen = set()
    unique = []
    for r in results:
        key = r.strip().lower()
        if key not in seen and key != "not_found":
            seen.add(key)
            unique.append(r)

    return "\n\n---\n\n".join(unique[:5]), total_tokens, len(chunks)

# ------------------------------------------------------------
# ASYNC WRAPPER
# ------------------------------------------------------------
async def parse_with_openrouter_async(
    dom_content: str,
    parse_description: str,
    model: str = DEFAULT_MODEL,
) -> ParseResult:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None,
        lambda: parse_with_openrouter_result(
            dom_content=dom_content,
            parse_description=parse_description,
            model=model,
        ),
    )

# ------------------------------------------------------------
# CONVENIENCE
# ------------------------------------------------------------
def extract_info(dom_content, info_type: str, context: Optional[str] = None) -> Dict[str, Any]:
    templates = {
        "email": "Extract all email addresses.",
        "phone": "Extract phone numbers.",
        "price": "Extract all prices.",
        "title": "Extract the main title.",
        "description": "Extract the main description.",
        "links": "Extract all URLs.",
    }
    desc = templates.get(info_type, f"Extract the {info_type}.")
    if context:
        desc += f" Context: {context}"

    start = time.time()
    result = parse_with_openrouter_result(dom_content, desc, simple_mode=True)
    return {
        "success": result.success,
        "data": result.content,
        "error": result.error,
        "info_type": info_type,
        "elapsed_seconds": round(time.time() - start, 2),
    }

if __name__ == "__main__":
    sample = "Contact us at support@example.com or call +1-555-123-4567"
    print(extract_info(sample, "email"))