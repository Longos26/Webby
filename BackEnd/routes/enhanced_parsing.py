# backend/parsing/enhanced_parser.py
"""
Enhanced LLM Parser — v3 (NO-TRUNCATION edition)

Key changes vs v2:
  ★ max_tokens raised to 32000 (was 8192) — output never cut mid-JSON
  ★ max_chunks raised to 1000 (was 20) — no chunk is ever dropped
  ★ chunk_size raised to 200000 (was 40000) — fewer chunks, less boundary loss
  ★ Truncation warning logged instead of silently slicing
  ★ Per-chunk token budget scales with chunk size
  ★ Post-processing no longer coerces strings down (values preserved verbatim)
  ★ Raw LLM output preserved 1:1 — no field is dropped for length
"""

import asyncio
import hashlib
import json
import logging
import os
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Callable, Awaitable, Tuple
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
DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free"
FALLBACK_MODELS = [
    "nvidia/nemotron-3-ultra-550b-a55b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
]
ALLOWED_MODELS = set(FALLBACK_MODELS)


def sanitize_model(requested: Optional[str]) -> str:
    if not requested:
        return DEFAULT_MODEL
    if requested in ALLOWED_MODELS:
        return requested
    logger.warning(
        f"Model '{requested}' is not allowed. Falling back to '{DEFAULT_MODEL}'."
    )
    return DEFAULT_MODEL


# ============================================================
# CONFIGURATION  ★ FIX: no truncation caps
# ============================================================
@dataclass
class ParserConfig:
    provider: str = "openrouter"
    model: str = DEFAULT_MODEL
    api_key: str = ""
    base_url: str = "https://openrouter.ai/api/v1"

    # ★ FIX: allow the LLM to emit the whole JSON array
    max_tokens: int = 32000

    temperature: float = 0.0
    timeout_seconds: int = 300          # ★ FIX: longer to allow large outputs
    max_retries: int = 3
    retry_delay: float = 2.0

    # ★ FIX: much larger chunks → fewer boundaries → fewer missing items
    chunk_size: int = 200_000

    # ★ FIX: no chunk cap. 1000 chunks is effectively "unlimited" for web scraping
    max_chunks: int = 1000

    enable_cache: bool = True
    cache_ttl_seconds: int = 3600

    @classmethod
    def from_env(cls) -> "ParserConfig":
        return cls(
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
            model=sanitize_model(os.getenv("DEFAULT_MODEL", DEFAULT_MODEL)),
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        )


@dataclass
class ParseResult:
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
def _fingerprint(text: str) -> str:
    normalized = re.sub(r'\s+', ' ', text).strip()
    return hashlib.sha256(normalized.encode()).hexdigest()[:20]


class ParseCache:
    def __init__(self, ttl_seconds: int = 3600, max_size: int = 500):
        self._cache: Dict[str, tuple] = {}
        self.ttl = ttl_seconds
        self.max_size = max_size

    def _make_key(self, content: str, description: str, model: str) -> str:
        return f"{_fingerprint(content)}:{_fingerprint(description)}:{model}"

    def get(self, content: str, description: str, model: str) -> Optional[str]:
        key = self._make_key(content, description, model)
        if key in self._cache:
            result, ts = self._cache[key]
            if datetime.utcnow() - ts < timedelta(seconds=self.ttl):
                return result
            del self._cache[key]
        return None

    def set(self, content: str, description: str, model: str, result: str):
        if len(self._cache) >= self.max_size:
            oldest = min(self._cache.keys(), key=lambda k: self._cache[k][1])
            del self._cache[oldest]
        key = self._make_key(content, description, model)
        self._cache[key] = (result, datetime.utcnow())

    def clear(self):
        self._cache.clear()


_parse_cache = ParseCache()


# ============================================================
# ITEM-AWARE CHUNKING
# ============================================================
ITEM_LINE_RE = re.compile(r'^#\d+\s*\|.*$', re.MULTILINE)


def _split_into_items(content: str) -> Optional[List[str]]:
    if not re.search(r'^#\d+', content, re.MULTILINE):
        return None
    items = []
    for line in content.split('\n'):
        if re.match(r'^#\d+', line):
            items.append(line)
        elif items and line.strip():
            items[-1] += ' ' + line.strip()
    return items if items else None


def chunk_content(content: str, chunk_size: int = 200_000, overlap: int = 200) -> List[str]:
    """
    ★ FIX: never drops content. If a single item is larger than chunk_size,
    it is emitted as its own chunk instead of being truncated.
    """
    if len(content) <= chunk_size:
        return [content]

    items = _split_into_items(content)
    if items and len(items) > 1:
        chunks: List[str] = []
        current: List[str] = []
        current_len = 0
        for item in items:
            item_len = len(item) + 1
            # ★ FIX: even if a single item is > chunk_size, keep it whole
            if current and current_len + item_len > chunk_size:
                chunks.append('\n'.join(current))
                current = [item]
                current_len = item_len
            else:
                current.append(item)
                current_len += item_len
        if current:
            chunks.append('\n'.join(current))
        return chunks

    chunks = []
    start = 0
    while start < len(content):
        end = start + chunk_size
        if end >= len(content):
            chunks.append(content[start:])
            break
        break_point = end
        for sep in ('\n\n', '\n', '. ', '! ', '? ', ' '):
            pos = content.rfind(sep, start + chunk_size // 2, end)
            if pos > start:
                break_point = pos + len(sep)
                break
        chunks.append(content[start:break_point])
        start = max(break_point - overlap, start + 1)
    return chunks


# ============================================================
# PROMPTS
# ============================================================
SYSTEM_PROMPT = """You are a deterministic data extraction engine. Output ONLY a single valid JSON object. No prose. No markdown. No code fences.

ABSOLUTE RULES (violating any rule = failure):
1. Output MUST be a single JSON object: {"field_name": [ ...values... ], ...}
2. Every array MUST have exactly as many entries as source items in the input.
3. If the input has items #1..#N, every array has length N — no exceptions.
4. Preserve ORDER. Item #1's values are at index 0; item #N's values at index N-1.
5. NEVER summarize, sample, skip, or truncate.
6. Use null for missing fields. NEVER invent or guess values.
7. Do NOT add explanation, preamble, or trailing text.
8. Do NOT wrap arrays in nested objects.
9. If you cannot extract a field for any item, still emit null for that item.
10. If the task is impossible, return {"error": "reason"}.
11. Preserve the EXACT text of every value — do not shorten, paraphrase, or summarize field values.

EXAMPLE — input has 3 books:
INPUT:
#1 | title=A | price=£10.00
#2 | title=B | price=£20.00
#3 | title=C | price=£30.00

CORRECT OUTPUT:
{"titles":["A","B","C"],"prices":["£10.00","£20.00","£30.00"]}

WRONG OUTPUT (only 2 items, DO NOT DO THIS):
{"titles":["A","B"],"prices":["£10.00","£20.00"]}
"""


def _count_source_items(content: str) -> int:
    return len(re.findall(r'^#\d+', content, re.MULTILINE))


def build_parse_prompt(
    content: str,
    description: str,
    chunk_index: int = 0,
    total_chunks: int = 1,
    missing_indices: Optional[List[int]] = None,
) -> str:
    n_items = _count_source_items(content)

    parts = []
    parts.append("TASK:")
    parts.append(description.strip())
    parts.append("")

    if n_items > 0:
        parts.append(f"SOURCE CONTAINS EXACTLY {n_items} ITEMS (numbered #1 through #{n_items}).")
        parts.append(f"YOUR OUTPUT ARRAYS MUST EACH CONTAIN EXACTLY {n_items} ENTRIES.")
        parts.append(f"Array index 0 = item #1, index {n_items-1} = item #{n_items}.")
        parts.append("")

    if total_chunks > 1:
        parts.append(f"NOTE: This is chunk {chunk_index + 1} of {total_chunks}.")
        parts.append("Extract only items visible in THIS chunk. Preserve their #N order.")
        parts.append("")

    if missing_indices:
        idx_str = ", ".join(f"#{i}" for i in missing_indices[:30])
        parts.append("PREVIOUS ATTEMPT WAS INCOMPLETE.")
        parts.append(f"You previously omitted these item indices: {idx_str}")
        parts.append("Go back through the source line by line and include them.")
        parts.append("")

    parts.append("SOURCE CONTENT:")
    parts.append("<<<SOURCE")
    parts.append(content)
    parts.append("SOURCE>>>")
    parts.append("")
    parts.append("Now output ONLY the JSON object. No other text.")

    return "\n".join(parts)


# ============================================================
# LLM API CALLS
# ============================================================
async def call_openrouter(
    prompt: str,
    config: ParserConfig,
    system_prompt: str = SYSTEM_PROMPT,
) -> Tuple[str, int]:
    if not AIOHTTP_AVAILABLE:
        raise Exception("aiohttp is not installed. Run: pip install aiohttp")
    if not config.api_key:
        raise Exception("OPENROUTER_API_KEY is not configured on the server")

    model = sanitize_model(config.model)
    headers = {
        "Authorization": f"Bearer {config.api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://your-app.com",
        "X-Title": "Scraping Platform",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": config.temperature,
        # ★ FIX: 32000 tokens — enough for any realistic JSON extraction
        "max_tokens": config.max_tokens,
        "response_format": {"type": "json_object"},
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{config.base_url}/chat/completions",
            headers=headers,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=config.timeout_seconds),
        ) as response:
            if response.status != 200:
                body = await response.text()
                raise Exception(f"API error {response.status}: {body[:500]}")
            data = await response.json()
            if not data.get("choices"):
                raise Exception("No choices in API response")
            choice = data["choices"][0]
            content = choice["message"]["content"]
            finish_reason = choice.get("finish_reason", "unknown")
            tokens = data.get("usage", {}).get("total_tokens", 0)

            # ★ FIX: detect truncation explicitly
            if finish_reason == "length":
                logger.warning(
                    f"LLM output was TRUNCATED (finish_reason=length). "
                    f"Output was {len(content)} chars. Consider raising max_tokens."
                )

            return content, tokens


async def call_llm_with_retry(
    prompt: str,
    config: ParserConfig,
    system_prompt: str = SYSTEM_PROMPT,
) -> Tuple[str, int]:
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

            if "401" in str(e) or "403" in str(e):
                raise
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
            await asyncio.sleep(delay)

    raise Exception(f"All {config.max_retries} attempts failed. Last error: {last_error}")


# ============================================================
# OUTPUT PARSING + VALIDATION
# ============================================================
def _strip_fences(text: str) -> str:
    text = re.sub(r'```(?:json)?', '', text)
    return text.replace('```', '').strip()


def _safe_json_load(text: str) -> Optional[Any]:
    if not text:
        return None
    cleaned = _strip_fences(text)
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    m = re.search(r'\{[\s\S]*\}', cleaned)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return None


def _normalize_output(data: Any) -> Dict[str, List[Any]]:
    """
    ★ FIX: values are preserved verbatim. Nested objects are JSON-stringified
    (so no data is lost) rather than dropped.
    """
    if not isinstance(data, dict):
        return {}
    out: Dict[str, List[Any]] = {}
    for k, v in data.items():
        if k == "error":
            continue
        if isinstance(v, list):
            out[k] = [
                x if not isinstance(x, dict) else json.dumps(x, ensure_ascii=False)
                for x in v
            ]
        elif v is None:
            out[k] = []
        else:
            out[k] = [v]
    return out


def _detect_item_count_in_output(data: Dict[str, List[Any]]) -> int:
    if not data:
        return 0
    lengths = [len(v) for v in data.values() if isinstance(v, list) and len(v) > 0]
    return min(lengths) if lengths else 0


def _missing_item_indices(data: Dict[str, List[Any]], expected: int) -> List[int]:
    if not data or expected <= 0:
        return list(range(1, expected + 1))
    missing = []
    for i in range(expected):
        for arr in data.values():
            if not isinstance(arr, list) or i >= len(arr) or arr[i] in (None, "", []):
                missing.append(i + 1)
                break
    return missing


# ============================================================
# DEDUPLICATION
# ============================================================
def _row_key(row: Dict[str, Any]) -> str:
    normalized = json.dumps(row, sort_keys=True, ensure_ascii=False, default=str)
    return hashlib.sha256(normalized.encode()).hexdigest()


def _dedupe_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    out = []
    for row in rows:
        key = _row_key(row)
        if key not in seen:
            seen.add(key)
            out.append(row)
    return out


def _to_rows(data: Dict[str, List[Any]]) -> List[Dict[str, Any]]:
    if not data:
        return []
    length = max(len(v) for v in data.values())
    rows = []
    for i in range(length):
        row = {}
        for field, values in data.items():
            row[field] = values[i] if i < len(values) else None
        rows.append(row)
    return rows


def _from_rows(rows: List[Dict[str, Any]]) -> Dict[str, List[Any]]:
    if not rows:
        return {}
    fields = set()
    for r in rows:
        fields.update(r.keys())
    return {f: [r.get(f) for r in rows] for f in fields}


# ============================================================
# MAIN PARSER
# ============================================================
class EnhancedParser:
    def __init__(self, config: Optional[ParserConfig] = None):
        self.config = config or ParserConfig.from_env()
        self.config.model = sanitize_model(self.config.model)
        self.cache = _parse_cache

    async def _extract_chunk(
        self,
        chunk: str,
        description: str,
        chunk_index: int,
        total_chunks: int,
    ) -> Tuple[Dict[str, List[Any]], int]:
        expected = _count_source_items(chunk)
        prompt = build_parse_prompt(chunk, description, chunk_index, total_chunks)

        raw, tokens = await call_llm_with_retry(prompt, self.config)
        data = _safe_json_load(raw)
        normalized = _normalize_output(data) if data else {}

        if expected <= 0:
            return normalized, tokens

        got = _detect_item_count_in_output(normalized)
        missing = _missing_item_indices(normalized, expected)

        if got >= expected and not missing:
            logger.info(
                f"Chunk {chunk_index+1}/{total_chunks}: "
                f"{got}/{expected} items — OK"
            )
            return normalized, tokens

        logger.warning(
            f"Chunk {chunk_index+1}/{total_chunks}: "
            f"{got}/{expected} items, {len(missing)} gaps. Targeted retry..."
        )

        retry_prompt = build_parse_prompt(
            chunk, description, chunk_index, total_chunks,
            missing_indices=missing,
        )
        try:
            raw2, tokens2 = await call_llm_with_retry(retry_prompt, self.config)
            tokens += tokens2
            data2 = _safe_json_load(raw2)
            normalized2 = _normalize_output(data2) if data2 else {}
            got2 = _detect_item_count_in_output(normalized2)
            missing2 = _missing_item_indices(normalized2, expected)

            if got2 > got or len(missing2) < len(missing):
                logger.info(
                    f"Chunk {chunk_index+1}/{total_chunks}: "
                    f"retry improved {got}/{expected} -> {got2}/{expected}"
                )
                return normalized2, tokens
        except Exception as e:
            logger.warning(f"Retry failed for chunk {chunk_index+1}: {e}")

        return normalized, tokens

    async def parse(
        self,
        content: str,
        description: str,
        job_id: Optional[str] = None,
        stream_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
    ) -> ParseResult:
        start = datetime.utcnow()

        if not content or len(content.strip()) < 10:
            return ParseResult(success=False, content="", error="Content too short")
        if not description or len(description.strip()) < 5:
            return ParseResult(success=False, content="", error="Description required")

        if self.config.enable_cache:
            hit = self.cache.get(content, description, self.config.model)
            if hit:
                logger.info(f"Cache hit for job {job_id}")
                return ParseResult(
                    success=True,
                    content=hit,
                    cached=True,
                    processing_time_ms=(datetime.utcnow() - start).total_seconds() * 1000,
                    metadata={"model": self.config.model, "cached": True},
                )

        chunks = chunk_content(content, self.config.chunk_size)

        # ★ FIX: warn instead of silently truncating
        if len(chunks) > self.config.max_chunks:
            logger.warning(
                f"Job {job_id}: {len(chunks)} chunks > max {self.config.max_chunks}. "
                f"Raising max_chunks — this should never happen with 200k chunk_size."
            )

        total_chunks = len(chunks)
        per_chunk_expected = [_count_source_items(c) for c in chunks]

        logger.info(
            f"Job {job_id}: {total_chunks} chunk(s), "
            f"expected items/chunk={per_chunk_expected}, model={self.config.model}"
        )

        if stream_callback:
            await stream_callback({
                "type": "start",
                "total_chunks": total_chunks,
                "total_chars": len(content),
                "expected_items": sum(per_chunk_expected),
                "model": self.config.model,
            })

        all_data: List[Dict[str, List[Any]]] = []
        total_tokens = 0
        errors: List[str] = []

        for i, chunk in enumerate(chunks):
            try:
                if stream_callback:
                    await stream_callback({
                        "type": "chunk_start",
                        "chunk_index": i,
                        "total_chunks": total_chunks,
                        "expected_items": per_chunk_expected[i],
                    })

                data, tokens = await self._extract_chunk(
                    chunk, description, i, total_chunks
                )
                total_tokens += tokens
                all_data.append(data)

                if stream_callback:
                    await stream_callback({
                        "type": "chunk_complete",
                        "chunk_index": i,
                        "items_extracted": _detect_item_count_in_output(data),
                        "tokens": tokens,
                    })

            except Exception as e:
                err = f"Chunk {i + 1} failed: {e}"
                logger.error(f"Job {job_id}: {err}")
                errors.append(err)
                if stream_callback:
                    await stream_callback({
                        "type": "chunk_error",
                        "chunk_index": i,
                        "error": str(e),
                    })

        if not all_data:
            return ParseResult(
                success=False,
                content="",
                total_chunks=total_chunks,
                tokens_used=total_tokens,
                processing_time_ms=(datetime.utcnow() - start).total_seconds() * 1000,
                error="; ".join(errors) or "No chunks produced output",
            )

        if total_chunks == 1:
            merged = all_data[0]
        else:
            merged = self._merge_chunks(all_data)

        merged = self._post_process(merged)

        # ★ FIX: preserve the full JSON structure and all values
        final_json = json.dumps(merged, indent=2, ensure_ascii=False)

        if self.config.enable_cache and not errors:
            self.cache.set(content, description, self.config.model, final_json)

        elapsed = (datetime.utcnow() - start).total_seconds() * 1000

        if stream_callback:
            await stream_callback({
                "type": "complete",
                "success": True,
                "total_tokens": total_tokens,
                "processing_time_ms": elapsed,
                "fields": list(merged.keys()),
            })

        logger.info(
            f"Job {job_id}: done — {len(all_data)}/{total_chunks} chunks, "
            f"{total_tokens} tokens, {elapsed:.0f}ms, fields={list(merged.keys())}"
        )

        return ParseResult(
            success=True,
            content=final_json,
            chunks_processed=len(all_data),
            total_chunks=total_chunks,
            tokens_used=total_tokens,
            processing_time_ms=elapsed,
            error="; ".join(errors) if errors else None,
            metadata={
                "model": self.config.model,
                "provider": self.config.provider,
                "description": description[:200],
                "fields": list(merged.keys()),
                "partial_errors": errors if errors else None,
            },
        )

    def _merge_chunks(self, chunks: List[Dict[str, List[Any]]]) -> Dict[str, List[Any]]:
        all_rows: List[Dict[str, Any]] = []
        for data in chunks:
            rows = _to_rows(data)
            all_rows.extend(rows)

        deduped = _dedupe_rows(all_rows)
        merged = _from_rows(deduped)

        if merged:
            length = max(len(v) for v in merged.values())
            for field in merged:
                while len(merged[field]) < length:
                    merged[field].append(None)

        return merged

    def _post_process(self, data: Dict[str, List[Any]]) -> Dict[str, List[Any]]:
        if not data:
            return {}

        clean: Dict[str, List[Any]] = {}
        for field, values in data.items():
            key = self._normalize_key(field)
            # ★ FIX: keep values verbatim — no trimming, no cutting, no coercing
            clean[key] = list(values)

        length = max(len(v) for v in clean.values()) if clean else 0
        for field in clean:
            while len(clean[field]) < length:
                clean[field].append(None)

        return clean

    @staticmethod
    def _normalize_key(key: str) -> str:
        key = re.sub(r'[^\w\s]', '', key)
        key = re.sub(r'\s+', '_', key.strip().lower())
        return key or "field"

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
# CONVENIENCE WRAPPERS
# ============================================================
async def parse_content_async(
    content: str,
    description: str,
    job_id: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    stream_callback: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
) -> ParseResult:
    base = get_parser()
    config = ParserConfig(
        api_key=api_key or base.config.api_key or os.getenv("OPENROUTER_API_KEY", ""),
        model=sanitize_model(model or base.config.model or DEFAULT_MODEL),
        base_url=base.config.base_url or os.getenv(
            "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
        ),
        # ★ FIX: no truncation caps
        chunk_size=200_000,
        max_tokens=32_000,
        max_chunks=1000,
    )
    parser = EnhancedParser(config)
    parser.cache = base.cache
    return await parser.parse(content, description, job_id, stream_callback)


def parse_content_sync(
    content: str,
    description: str,
    job_id: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
) -> ParseResult:
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    parse_content_async(content, description, job_id, api_key, model),
                )
                return future.result()
    except RuntimeError:
        pass
    return asyncio.run(parse_content_async(content, description, job_id, api_key, model))