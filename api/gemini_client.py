"""Gemini API client for competitive programming syntax assistance"""
from google import genai
from typing import Any

# Initialize Gemini client
def create_client(api_key: str):
    """Create and return Gemini client"""
    return genai.Client(api_key=api_key)


def get_python_syntax(client, query: str, language: str = "python") -> str:
    """Get Python syntax explanation from Gemini"""
    system_prompt = f"""You are a competitive programming expert specializing in {language}.
Your task is to provide:
1. **Simple syntax explanation** (1-2 lines)
2. **Quick code example** (3-5 lines)
3. **Key use cases** (2-3 bullet points)

Keep responses concise and practical for competitive programming.
Format: Use markdown with clear sections."""

    prompt = f"{system_prompt}\n\nUser Question: {query}"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    return response.text


async def get_python_syntax_stream(client, query: str, language: str = "python"):
    """Get Python syntax explanation from Gemini with streaming (Async version)"""
    system_prompt = f"""You are a competitive programming expert specializing in {language}.
Your task is to provide:
1. **Simple syntax explanation** (1-2 lines)
2. **Quick code example** (3-5 lines)
3. **Key use cases** (2-3 bullet points)

Keep responses concise and practical for competitive programming.
Format: Use markdown with clear sections."""

    prompt = f"{system_prompt}\n\nUser Question: {query}"
    
    response = await client.aio.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    for chunk in response:
        yield chunk.text
