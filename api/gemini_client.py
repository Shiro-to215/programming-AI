"""Gemini API client for competitive programming syntax assistance"""
import asyncio
from google import genai

def create_client(api_key: str):
    """Create and return Gemini client"""
    return genai.Client(api_key=api_key)


def get_python_syntax(client, query: str, language: str = "python") -> str:
    """Get Python syntax explanation from Gemini"""
    system_prompt = f"""あなたはプログラミング初心者向けの競プロ専門の解説者です。
余計な挨拶や前置き、馴れ馴れしい表現は一切省き、丁寧で分かりやすい日本語のマークダウン形式で回答してください。
{language} の構文について、以下の構成に厳密に従ってください。

### 💡 概要と解説
初心者でも直感的に理解できる簡単な説明や、具体的な例えを用いて1〜2行で解説してください。

### 🛒 活用シーン
競プロのどのような問題（例：データを特定の順に並べ替えたい時など）で使うのか、具体的なイメージができる例を挙げてください。

### 💻 実装コード
実践ですぐに使える、短くシンプルなコード例を記述してください。
必ずコードブロック（```python ... ``` や ```cpp ... ``` のような形式）を使用し、初心者でも迷わないよう各行に簡単なコメントを入れてください。

### ⚠️ 注意点
初心者がよくやるミスや、競プロでバグらせやすいポイントを1つだけ教えてください。"""

    prompt = f"{system_prompt}\n\nUser Question: {query}"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    return response.text


async def get_python_syntax_stream(client, query: str, language: str = "python"):
    """Get Python syntax explanation from Gemini with streaming (Async version)"""
    system_prompt = f"""あなたはプログラミング初心者向けの競プロ専門の解説者です。
余計な挨拶や前置き、馴れ馴れしい表現は一切省き、丁寧で分かりやすい日本語のマークダウン形式で回答してください。
{language} の構文について、以下の構成に厳密に従ってください。

### 💡 概要と解説
初心者でも直感的に理解できる簡単な説明や、具体的な例えを用いて1〜2行で解説してください。

### 🛒 活用シーン
競プロのどのような問題（例：データを特定の順に並べ替えたい時など）で使うのか、具体的なイメージができる例を挙げてください。

### 💻 実装コード
実践ですぐに使える、短くシンプルなコード例を記述してください。
必ずコードブロック（```python ... ``` のような形式）を使用し、初心者でも迷わないよう各行に簡単なコメントを入れてください。

### ⚠️ 注意点
初心者がよくやるミスや、競プロでバグらせやすいポイントを1つだけ教えてください。"""

    prompt = f"{system_prompt}\n\nUser Question: {query}"
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content_stream(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            async for chunk in response: # 3. awaitの戻り値を非同期ループで処理
                if chunk.text:
                    yield f"data: {chunk.text}\n\n"
            return # 成功したらループを抜けて終了

        except Exception as e:
            error_str = str(e)
            # 503エラー(混雑)または429エラー(制限)の場合のみリトライ
            if ("503" in error_str or "429" in error_str) and attempt < max_retries - 1:
                wait_time = 2 * (attempt + 1) # 待機時間を増やす
                await asyncio.sleep(wait_time)
                continue
            else:
                # 最終的に失敗した場合、フロントエンドにエラーを伝える
                yield f"data: ❌ エラーが発生しました: {error_str}\n\n"
                break
