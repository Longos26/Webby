# parsing/Ollama.py
from openai import OpenAI
import logging
from typing import List, Union, Optional, Dict, Any
from dotenv import load_dotenv
import os
import time
from functools import wraps
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, retry_if_result
import asyncio

load_dotenv()
logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Model configuration
DEFAULT_MODEL = "openai/gpt-3.5-turbo"  # Changed to more stable model
FALLBACK_MODELS = [
    "openai/gpt-3.5-turbo",
    "meta-llama/llama-3.2-3b-instruct:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
]

# Rate limiting configuration - REDUCED for free tier
REQUEST_DELAY = 3.0  # Increased between requests
MAX_RETRIES = 5
INITIAL_DELAY = 2
MAX_DELAY = 60

# Create client with better timeout settings
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    timeout=120.0,  # Increased timeout
    max_retries=3,  # Built-in retries
)

# Enhanced system prompt to reduce token usage
SYSTEM_PROMPT = """
You are a precise information extraction system. Extract ONLY the requested information.
Be extremely concise. Return ONLY the extracted data, nothing else.
If not found, return "NOT_FOUND". No explanations, no apologies.
"""

def is_rate_limit_error(exception):
    """Check if exception is a rate limit error"""
    error_str = str(exception).lower()
    return any(phrase in error_str for phrase in [
        'rate limit', 'rate_limit', 'too many requests', 
        '429', 'ratelimit', 'quota'
    ])

@retry(
    stop=stop_after_attempt(MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=INITIAL_DELAY, max=MAX_DELAY),
    retry=retry_if_exception_type(Exception),
    before_sleep=lambda retry_state: logger.warning(
        f"Retry {retry_state.attempt_number}/{MAX_RETRIES} after error: {retry_state.outcome.exception()}"
    )
)
def _make_api_request_with_retry(messages: List[Dict[str, str]], model: str = DEFAULT_MODEL) -> str:
    """Make API request with comprehensive retry logic"""
    
    # Check for rate limit before making request
    time.sleep(REQUEST_DELAY)  # Always delay between requests
    
    try:
        logger.info(f"Making API request with model: {model}")
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=False,
            temperature=0.1,  # Lower temperature for consistent results
            max_tokens=2000,  # Reduced to avoid quota issues
            top_p=0.9,
            frequency_penalty=0,
            presence_penalty=0,
        )
        
        # Extract the content
        content = response.choices[0].message.content
        
        # Log token usage for debugging
        if hasattr(response, 'usage'):
            logger.info(f"Token usage - Total: {response.usage.total_tokens}, "
                       f"Prompt: {response.usage.prompt_tokens}, "
                       f"Completion: {response.usage.completion_tokens}")
        
        return content.strip() if content else "NOT_FOUND"
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"API request failed for model {model}: {error_msg}")
        
        # Check if it's a rate limit error
        if is_rate_limit_error(e):
            logger.warning(f"Rate limit hit for model {model}")
            
            # Try fallback models if available
            if model != FALLBACK_MODELS[0]:
                logger.info(f"Switching to fallback model: {FALLBACK_MODELS[0]}")
                return _make_api_request_with_retry(messages, FALLBACK_MODELS[0])
        
        raise Exception(f"API request failed: {error_msg}")

def parse_with_openrouter(
    dom_content: Union[str, List[str]], 
    parse_description: str,
    model: str = DEFAULT_MODEL,
    max_chunk_size: int = 6000,  # Reduced chunk size
    overlap: int = 200,  # Reduced overlap
    simple_mode: bool = True  # New: simpler parsing for large content
) -> str:
    """
    Parse DOM content using OpenRouter with rate limit handling
    """
    # Handle empty input
    if not dom_content:
        logger.warning("Empty DOM content provided")
        return ""
    
    # Handle list input
    if isinstance(dom_content, list):
        dom_content = '\n\n---\n\n'.join(dom_content)
    
    # Truncate extremely long content to avoid token limits
    if len(dom_content) > 50000:
        logger.warning(f"Content too long ({len(dom_content)} chars), truncating to 50000")
        dom_content = dom_content[:50000]
    
    # For large content, use simple mode (more efficient)
    if simple_mode and len(dom_content) > max_chunk_size:
        return _parse_simple_mode(dom_content, parse_description, model)
    
    # For smaller content, process directly
    if len(dom_content) <= max_chunk_size:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"""
Extract from the content below:
{parse_description}

Content:
{dom_content[:max_chunk_size]}

Return ONLY the extracted information or NOT_FOUND.
            """}
        ]
        
        try:
            result = _make_api_request_with_retry(messages, model)
            return result
        except Exception as e:
            logger.error(f"Parse failed: {str(e)}")
            return f"ERROR: {str(e)[:100]}"
    
    # Process in chunks if needed
    return _parse_chunked_mode(dom_content, parse_description, model, max_chunk_size, overlap)

def _parse_simple_mode(content: str, parse_description: str, model: str) -> str:
    """Simple mode - only extract from beginning of content for efficiency"""
    # Take first 4000 chars which usually contains key info
    sample_content = content[:4000]
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"""
Extract: {parse_description}

From content start:
{sample_content}

Return ONLY the extracted information.
        """}
    ]
    
    try:
        result = _make_api_request_with_retry(messages, model)
        return result
    except Exception as e:
        logger.error(f"Simple parse failed: {str(e)}")
        return f"ERROR: {str(e)[:100]}"

def _parse_chunked_mode(content: str, parse_description: str, model: str, chunk_size: int, overlap: int) -> str:
    """Process content in chunks with better error handling"""
    chunks = []
    start = 0
    
    while start < len(content):
        end = min(start + chunk_size, len(content))
        chunk = content[start:end]
        chunks.append(chunk)
        start += chunk_size - overlap
        
        if len(chunks) > 10:  # Limit chunks to avoid too many API calls
            logger.warning("Too many chunks, truncating")
            break
    
    logger.info(f"Processing {len(chunks)} chunks")
    
    results = []
    failed_count = 0
    
    for i, chunk in enumerate(chunks, 1):
        # Add delay between chunk processing
        if i > 1:
            time.sleep(2)  # 2 second delay between chunks
        
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"""
Extract: {parse_description}

Chunk {i}/{len(chunks)}:
{chunk}

Return extracted info or NOT_FOUND.
            """}
        ]
        
        try:
            result = _make_api_request_with_retry(messages, model)
            if result and result != "NOT_FOUND":
                results.append(result)
            logger.info(f"Chunk {i}/{len(chunks)} completed")
        except Exception as e:
            failed_count += 1
            logger.error(f"Chunk {i} failed: {str(e)[:100]}")
            
            if failed_count > 2:  # Stop if too many failures
                logger.error("Too many chunk failures, aborting")
                break
    
    # Combine results
    if results:
        # Remove duplicates while preserving order
        seen = set()
        unique_results = []
        for r in results:
            normalized = r.strip().lower()
            if normalized not in seen and normalized != "not_found":
                seen.add(normalized)
                unique_results.append(r)
        
        return '\n\n---\n\n'.join(unique_results[:5])  # Limit to 5 results
    
    return "NOT_FOUND"

# Async version for better concurrency handling
async def parse_with_openrouter_async(
    dom_content: str,
    parse_description: str,
    model: str = DEFAULT_MODEL
) -> str:
    """Async version with proper rate limiting"""
    # Add delay to avoid rate limits
    await asyncio.sleep(1)
    
    # Run sync function in thread pool
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        parse_with_openrouter,
        dom_content,
        parse_description,
        model
    )
    return result

# Convenience function for simple extractions
def extract_info(
    dom_content: Union[str, List[str]], 
    info_type: str,
    context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simple interface for common extraction tasks
    """
    parse_templates = {
        'email': "Extract all email addresses.",
        'phone': "Extract phone numbers.",
        'price': "Extract all prices.",
        'title': "Extract the main title.",
        'description': "Extract the main description.",
        'links': "Extract all URLs."
    }
    
    parse_desc = parse_templates.get(info_type, f"Extract the {info_type}.")
    if context:
        parse_desc += f" Context: {context}"
    
    try:
        start_time = time.time()
        result = parse_with_openrouter(dom_content, parse_desc, simple_mode=True)
        elapsed = time.time() - start_time
        
        return {
            'success': True,
            'data': result,
            'info_type': info_type,
            'elapsed_seconds': round(elapsed, 2)
        }
    except Exception as e:
        logger.error(f"Failed to extract {info_type}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'info_type': info_type
        }

# Example usage
if __name__ == "__main__":
    # Test the parser
    sample_content = """
    <html>
        <h1>Product Title: Awesome Widget</h1>
        <div class="price">$99.99</div>
        <p>Contact us at support@example.com or call +1-555-123-4567</p>
    </html>
    """
    
    # Extract email
    result = extract_info(sample_content, 'email')
    print(f"Extracted email: {result}")
    
    # Extract with custom description
    custom_result = parse_with_openrouter(
        sample_content,
        "Extract the product title, price, and any contact information"
    )
    print(f"Custom extraction: {custom_result}")