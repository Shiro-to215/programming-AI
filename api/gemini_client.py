"""Gemini API client for competitive programming syntax assistance"""
from google import genai
from typing import Generator

# Initialize Gemini client
def create_client(api_key: str):
    """Create and return Gemini client"""
    return genai.Client(api_key=api_key)


def get_python_syntax(client, query: str, language: str = "python") -> str:
    """
    Get Python syntax explanation from Gemini
    
    Args:
        client: Gemini client instance
        query: User's question about syntax
        language: Programming language (default: python)
    
    Returns:
        AI response with syntax explanation
    """
    system_prompt = f"""You are a competitive programming expert specializing in {language}.
Your task is to provide:
1. **Simple syntax explanation** (1-2 lines)
2. **Quick code example** (3-5 lines)
3. **Key use cases** (2-3 bullet points)

Keep responses concise and practical for competitive programming.
Format: Use markdown with clear sections."""

    prompt = f"{system_prompt}\n\nUser Question: {query}"
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt
    )
    
    return response.text


def get_python_syntax_stream(client, query: str, language: str = "python") -> Generator:
    """
    Get Python syntax explanation from Gemini with streaming
    
    Args:
        client: Gemini client instance
        query: User's question about syntax
        language: Programming language (default: python)
    
    Yields:
        Streamed text chunks
    """
    system_prompt = f"""You are a competitive programming expert specializing in {language}.
Your task is to provide:
1. **Simple syntax explanation** (1-2 lines)
2. **Quick code example** (3-5 lines)
3. **Key use cases** (2-3 bullet points)

Keep responses concise and practical for competitive programming.
Format: Use markdown with clear sections."""

    prompt = f"{system_prompt}\n\nUser Question: {query}"
    
    response = client.models.generate_content_stream(
        model="gemini-3.5-flash",
        contents=prompt
    )
    
    for chunk in response:
        if chunk.text:
            yield chunk.text
