from openai import OpenAI
import logging
from typing import List, Union
from dotenv import load_dotenv
import os

load_dotenv()
logger = logging.getLogger(__name__)


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),  
)

# Define the template/prompt
SYSTEM_PROMPT = """
You are a precise information extraction system. Extract the requested information accurately from the provided content.
Be concise and only return the extracted information without any additional commentary.
"""

def parse_with_openrouter(dom_content: Union[str, List[str]], parse_description: str) -> str:
    """
    Parse DOM content using OpenRouter (NVIDIA model) to extract specific information
    
    Args:
        dom_content: The scraped content to parse (can be string or list of strings/chunks)
        parse_description: Description of what to extract
    
    Returns:
        Extracted information as string
    """
    # Handle if dom_content is a list (from split_dom_content)
    if isinstance(dom_content, list):
        # If it's a list, join the chunks
        dom_content = '\n\n'.join(dom_content)
    
    if not dom_content or not dom_content.strip():
        logger.warning("Empty DOM content provided for parsing")
        return ""
    
    if not parse_description or not parse_description.strip():
        logger.warning("Empty parse description provided")
        return ""
    
    try:
        # For very large content, process in chunks
        if len(dom_content) > 10000:  # If content is large, split into chunks
            chunks = _chunk_content(dom_content, 8000)  # 8k tokens is safe for most models
            parsed_results = []
            
            for i, chunk in enumerate(chunks, 1):
                logger.info(f"Processing chunk {i}/{len(chunks)}")
                
                response = client.chat.completions.create(
                    model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": f"""
                        Parse Description: {parse_description}
                        
                        DOM Content:
                        {chunk}
                        
                        Extract the requested information based on the parse description above.
                        """}
                    ],
                    stream=False,  # Set to True if you want streaming
                    temperature=0.1,  # Lower temperature for more consistent extraction
                )
                
                extracted = response.choices[0].message.content
                
                # Log token usage if needed
                if hasattr(response, 'usage'):
                    logger.info(f"Chunk {i} usage - Prompt: {response.usage.prompt_tokens}, "
                              f"Completion: {response.usage.completion_tokens}, "
                              f"Total: {response.usage.total_tokens}")
                
                if extracted and extracted.strip():
                    parsed_results.append(extracted)
            
            return "\n\n---\n\n".join(parsed_results) if parsed_results else ""
        else:
            # Process small content directly
            response = client.chat.completions.create(
                model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"""
                    Parse Description: {parse_description}
                    
                    DOM Content:
                    {dom_content}
                    
                    Extract the requested information based on the parse description above.
                    """}
                ],
                stream=False,
                temperature=0.1,
            )
            
            extracted = response.choices[0].message.content
            return extracted.strip() if extracted else ""
            
    except Exception as e:
        logger.error(f"Error parsing with OpenRouter: {str(e)}")
        raise Exception(f"Failed to parse content: {str(e)}")

def parse_with_openrouter_streaming(dom_content: Union[str, List[str]], parse_description: str) -> str:
    """
    Parse DOM content using OpenRouter with streaming support
    This allows you to see reasoning tokens as they come
    """
    # Handle if dom_content is a list (from split_dom_content)
    if isinstance(dom_content, list):
        dom_content = '\n\n'.join(dom_content)
    
    if not dom_content or not dom_content.strip():
        logger.warning("Empty DOM content provided for parsing")
        return ""
    
    try:
        stream = client.chat.completions.create(
            model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"""
                Parse Description: {parse_description}
                
                DOM Content:
                {dom_content}
                
                Extract the requested information based on the parse description above.
                """}
            ],
            stream=True,
            temperature=0.1,
        )
        
        response = ""
        reasoning_tokens_usage = None
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                response += content
                # Uncomment if you want to see streaming output
                # print(content, end="")
            
            # Check for usage info if available (varies by model)
            if hasattr(chunk, 'usage') and chunk.usage:
                reasoning_tokens_usage = chunk.usage
        
        if reasoning_tokens_usage and hasattr(reasoning_tokens_usage, 'reasoning_tokens'):
            logger.info(f"Reasoning tokens used: {reasoning_tokens_usage.reasoning_tokens}")
        
        return response.strip()
        
    except Exception as e:
        logger.error(f"Error with streaming parse: {str(e)}")
        raise

def _chunk_content(content: str, chunk_size: int) -> List[str]:
    """Split content into chunks of approximately chunk_size characters"""
    words = content.split()
    chunks = []
    current_chunk = []
    current_size = 0
    
    for word in words:
        current_size += len(word) + 1  # +1 for space
        if current_size > chunk_size and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = [word]
            current_size = len(word)
        else:
            current_chunk.append(word)
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

# Example usage with streaming (like your original JavaScript code)
async def parse_with_reasoning_tokens(dom_content: Union[str, List[str]], parse_description: str):
    """
    Async version that shows reasoning tokens (like the original JS example)
    """
    # Handle if dom_content is a list
    if isinstance(dom_content, list):
        dom_content = '\n\n'.join(dom_content)
    
    try:
        stream = client.chat.completions.create(
            model="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"""
                Parse Description: {parse_description}
                
                DOM Content:
                {dom_content}
                
                Extract: {parse_description}
                """}
            ],
            stream=True,
            temperature=0.1,
        )
        
        response = ""
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                response += content
                print(content, end="")  # Stream to console
            
            # Check for reasoning tokens in the response
            if hasattr(chunk, 'reasoning_tokens'):
                print(f"\nReasoning tokens: {chunk.reasoning_tokens}")
        
        return response.strip()
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise
