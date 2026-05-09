from openai import OpenAI
import logging
from typing import List, Union, Optional, Dict, Any
from dotenv import load_dotenv
import os
import time
from functools import wraps
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

load_dotenv()
logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Model configuration
DEFAULT_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
FALLBACK_MODELS = [
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "openai/gpt-3.5-turbo",  # Fallback if needed
    "meta-llama/llama-3.2-3b-instruct:free"
]

# Rate limiting configuration
REQUEST_DELAY = 1.0  # seconds between requests
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]  # Exponential backoff

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    timeout=60.0,  # Add timeout
    max_retries=2,  # Built-in retries
)

# Enhanced system prompt
SYSTEM_PROMPT = """
You are a precise information extraction system. Extract the requested information accurately from the provided content.
Be concise and only return the extracted information without any additional commentary.
If the information is not found, return "NOT_FOUND".
Do not include any explanations, apologies, or extra text.
Format lists as numbered items or bullet points as appropriate.
"""

def rate_limited(max_per_minute: int = 60):
    """Decorator for rate limiting API calls"""
    min_interval = 60.0 / max_per_minute
    last_called = [0.0]
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_called[0]
            left_to_wait = min_interval - elapsed
            if left_to_wait > 0:
                time.sleep(left_to_wait)
            ret = func(*args, **kwargs)
            last_called[0] = time.time()
            return ret
        return wrapper
    return decorator

@retry(
    stop=stop_after_attempt(MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((Exception))
)
def _make_api_request(messages: List[Dict[str, str]], model: str = DEFAULT_MODEL, stream: bool = False) -> Any:
    """Make API request with retry logic"""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=stream,
            temperature=0.1,
            max_tokens=4096,  # Limit response size
            top_p=0.9,
            frequency_penalty=0,
            presence_penalty=0,
        )
        return response
    except Exception as e:
        logger.error(f"API request failed for model {model}: {str(e)}")
        raise

@rate_limited(max_per_minute=30)  # Adjust based on your API tier
def parse_with_openrouter(
    dom_content: Union[str, List[str]], 
    parse_description: str,
    model: str = DEFAULT_MODEL,
    chunk_size: int = 8000,
    overlap: int = 500,  # Overlap between chunks for context
    retry_on_fail: bool = True
) -> str:
    """
    Parse DOM content using OpenRouter to extract specific information
    
    Args:
        dom_content: The scraped content to parse (string or list of strings/chunks)
        parse_description: Description of what to extract
        model: Model to use for parsing
        chunk_size: Maximum characters per chunk
        overlap: Overlap between chunks for context preservation
        retry_on_fail: Whether to retry with fallback models on failure
    
    Returns:
        Extracted information as string
    """
    # Handle list input
    if isinstance(dom_content, list):
        dom_content = '\n\n---\n\n'.join(dom_content)
    
    if not dom_content or not dom_content.strip():
        logger.warning("Empty DOM content provided for parsing")
        return ""
    
    if not parse_description or not parse_description.strip():
        logger.warning("Empty parse description provided")
        return ""
    
    # Estimate token count (rough: 4 chars per token)
    estimated_tokens = len(dom_content) // 4
    logger.info(f"Content size: {len(dom_content)} chars, ~{estimated_tokens} tokens")
    
    try:
        # Process large content in chunks
        if len(dom_content) > chunk_size:
            chunks = _chunk_content_with_overlap(dom_content, chunk_size, overlap)
            logger.info(f"Processing {len(chunks)} chunks with {overlap} char overlap")
            
            parsed_results = []
            failed_chunks = []
            
            for i, chunk in enumerate(chunks, 1):
                logger.info(f"Processing chunk {i}/{len(chunks)}")
                
                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"""
Parse Description: {parse_description}

DOM Content (part {i} of {len(chunks)}):
{chunk}

Extract the requested information from this part only.
If multiple parts contain relevant info, you'll see them combined later.
                    """}
                ]
                
                try:
                    response = _make_api_request(messages, model=model)
                    extracted = response.choices[0].message.content
                    
                    # Log token usage
                    if hasattr(response, 'usage'):
                        logger.info(f"Chunk {i} - Tokens: {response.usage.total_tokens}")
                    
                    if extracted and extracted.strip() and extracted != "NOT_FOUND":
                        parsed_results.append(extracted)
                    elif extracted == "NOT_FOUND":
                        logger.info(f"Chunk {i}: No relevant information found")
                    else:
                        logger.warning(f"Chunk {i}: Empty response")
                        
                except Exception as e:
                    logger.error(f"Failed on chunk {i}: {str(e)}")
                    failed_chunks.append(i)
                    
                    if retry_on_fail and i < len(chunks):
                        logger.info(f"Retrying chunk {i} with fallback model...")
                        # Try fallback models
                        for fallback_model in FALLBACK_MODELS:
                            if fallback_model == model:
                                continue
                            try:
                                response = _make_api_request(messages, model=fallback_model)
                                extracted = response.choices[0].message.content
                                if extracted and extracted.strip():
                                    parsed_results.append(f"[From {fallback_model}] {extracted}")
                                    break
                            except:
                                continue
            
            if failed_chunks:
                logger.warning(f"Failed to process chunks: {failed_chunks}")
            
            # Combine results intelligently
            if parsed_results:
                # Check for duplicates and merge
                combined = _merge_extracted_results(parsed_results)
                return combined
            else:
                logger.warning("No information extracted from any chunk")
                return "NOT_FOUND"
        
        else:
            # Process small content directly
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"""
Parse Description: {parse_description}

DOM Content:
{dom_content}

Extract the requested information based on the parse description above.
                """}
            ]
            
            response = _make_api_request(messages, model=model)
            extracted = response.choices[0].message.content
            
            # Log token usage
            if hasattr(response, 'usage'):
                logger.info(f"Token usage - Prompt: {response.usage.prompt_tokens}, "
                          f"Completion: {response.usage.completion_tokens}, "
                          f"Total: {response.usage.total_tokens}")
            
            return extracted.strip() if extracted else "NOT_FOUND"
            
    except Exception as e:
        logger.error(f"Error parsing with OpenRouter: {str(e)}")
        
        # Try fallback model if main model fails
        if retry_on_fail and model != FALLBACK_MODELS[0]:
            logger.info(f"Attempting with fallback model: {FALLBACK_MODELS[0]}")
            return parse_with_openrouter(
                dom_content, 
                parse_description, 
                model=FALLBACK_MODELS[0],
                retry_on_fail=False
            )
        
        raise Exception(f"Failed to parse content: {str(e)}")

def _chunk_content_with_overlap(content: str, chunk_size: int, overlap: int) -> List[str]:
    """Split content into chunks with overlap for context preservation"""
    if overlap >= chunk_size:
        overlap = chunk_size // 4  # Max 25% overlap
    
    chunks = []
    start = 0
    content_length = len(content)
    
    while start < content_length:
        end = min(start + chunk_size, content_length)
        chunk = content[start:end]
        chunks.append(chunk)
        
        # Move start position, accounting for overlap
        start += chunk_size - overlap
        
        # Avoid infinite loop
        if start >= content_length:
            break
    
    # Add context markers to each chunk
    for i, chunk in enumerate(chunks):
        chunks[i] = f"[Chunk {i+1}/{len(chunks)}]\n{chunk}"
    
    return chunks

def _merge_extracted_results(results: List[str]) -> str:
    """Merge extracted results from multiple chunks, removing duplicates"""
    if not results:
        return ""
    
    # Simple deduplication based on exact matches
    unique_results = []
    seen = set()
    
    for result in results:
        # Normalize for comparison
        normalized = result.strip().lower()
        if normalized not in seen and normalized != "not_found":
            seen.add(normalized)
            unique_results.append(result)
    
    if not unique_results:
        return "NOT_FOUND"
    
    # Combine with separators
    if len(unique_results) == 1:
        return unique_results[0]
    else:
        return "\n\n---\n\n".join(unique_results)

def parse_with_openrouter_streaming(
    dom_content: Union[str, List[str]], 
    parse_description: str,
    model: str = DEFAULT_MODEL,
    show_reasoning: bool = False
) -> str:
    """
    Parse DOM content using OpenRouter with streaming support
    
    Args:
        dom_content: The scraped content to parse
        parse_description: Description of what to extract
        model: Model to use
        show_reasoning: Whether to log reasoning token information
    
    Returns:
        Extracted information as string
    """
    # Handle list input
    if isinstance(dom_content, list):
        dom_content = '\n\n'.join(dom_content)
    
    if not dom_content or not dom_content.strip():
        logger.warning("Empty DOM content provided for parsing")
        return ""
    
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"""
Parse Description: {parse_description}

DOM Content:
{dom_content}

Extract the requested information based on the parse description above.
            """}
        ]
        
        stream = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            temperature=0.1,
            max_tokens=4096,
        )
        
        response = ""
        chunk_count = 0
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                response += content
                chunk_count += 1
                
                # Optional: stream to console
                # print(content, end="", flush=True)
            
            # Check for reasoning tokens (model-specific)
            if show_reasoning and hasattr(chunk, 'usage') and chunk.usage:
                if hasattr(chunk.usage, 'reasoning_tokens'):
                    logger.info(f"Reasoning tokens: {chunk.usage.reasoning_tokens}")
        
        logger.info(f"Streaming complete: {chunk_count} chunks received")
        return response.strip() if response else "NOT_FOUND"
        
    except Exception as e:
        logger.error(f"Error with streaming parse: {str(e)}")
        raise

# Convenience function for simple extractions
def extract_info(
    dom_content: Union[str, List[str]], 
    info_type: str,
    context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simple interface for common extraction tasks
    
    Args:
        dom_content: Content to parse
        info_type: Type of info to extract (e.g., 'email', 'phone', 'price', 'title')
        context: Additional context about what to look for
    
    Returns:
        Dictionary with extracted info and metadata
    """
    parse_templates = {
        'email': "Extract all email addresses from the content.",
        'phone': "Extract phone numbers in international format.",
        'price': "Extract all prices mentioned in the content.",
        'title': "Extract the main title or heading.",
        'description': "Extract the main product or page description.",
        'links': "Extract all URLs and their anchor text.",
        'dates': "Extract all dates in ISO format (YYYY-MM-DD)."
    }
    
    parse_desc = parse_templates.get(info_type, f"Extract the {info_type} from the content.")
    if context:
        parse_desc += f" Context: {context}"
    
    try:
        result = parse_with_openrouter(dom_content, parse_desc)
        return {
            'success': True,
            'data': result,
            'info_type': info_type,
            'timestamp': time.time()
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