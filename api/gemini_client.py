"""Gemini API client for competitive programming syntax assistance"""
from google import genai
from typing import Any

# Initialize Gemini client
def create_client(api_key: str):
    """Create and return Gemini client"""
    return genai.Client(api_key=api_key)


def get_python_syntax(client, query: str, language: str = "python") -> str:
    """Get Python syntax explanation from Gemini"""
    system_prompt = f"""あなたはプログラミング初心者向けの、世界一わかりやすい競プロ専門の優しい先生です。
{language} の構文について、以下の構成に厳密に従って、マークダウン形式で回答してください。

### 💡 ざっくり言うと？（150文字以内）
プログラミングを全くやったことがない人でも「あ、そういうことね！」と直感的に理解できる例え話や、噛み砕いた簡単な説明を1〜2行で書いてください。

### 🛒 どんな時に使う？（例え話）
競プロのどんな問題（例：荷物を重い順に並べ替えたい時、同じ作業を10回繰り返したい時など）で使うのか、具体的なイメージができる例を挙げてください。

### 💻 実際のコードと使い方
実践ですぐに使える、短くシンプルなコード例を書いてください。
必ずコードブロック（```python ... ``` や ```cpp ... ```）を使って囲んでください。
コードの中には、初心者が迷わないように1行ずつ丁寧なコメント（# 〜）を入れてください。

### ⚠️ ここだけは気をつけて！
初心者がよくやるミスや、競プロでバグらせやすいポイントを1つだけ優しく教えてあげてください。"""

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
