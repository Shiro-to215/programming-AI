"""Gemini API client for competitive programming syntax assistance"""
import asyncio
from google import genai

def create_client(api_key: str):
    """Create and return Gemini client"""
    return genai.Client(api_key=api_key)

async def get_python_syntax_stream(client, query: str, language: str = "python"):
    """Get Python syntax explanation with automatic model fallback and retries"""
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
    
    # 使用するモデルのリスト（Flash Lite を優先またはフォールバックとして設定）
    models = ["gemini-2.5-flash", "gemini-3.1-flash-lite"]
    
    for model_name in models:
        max_retries = 2 # モデルごとの再試行回数
        for attempt in range(max_retries):
            try:
                response = await client.aio.models.generate_content_stream(
                    model=model_name,
                    contents=prompt
                )
                
                async for chunk in response:
                    if chunk.text:
                        yield f"data: {chunk.text}\n\n"
                
                return # 成功したら終了

            except Exception as e:
                error_str = str(e)
                # 429(制限)や503(混雑)の場合はリトライ、または次のモデルへ
                if ("429" in error_str or "503" in error_str):
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2 * (attempt + 1))
                        continue
                    else:
                        # このモデルでの再試行が尽きたので、次のモデルへ
                        break 
                else:
                    # その他の致命的なエラーは即時終了
                    yield f"data: ❌ エラーが発生しました ({model_name}): {error_str}\n\n"
                    return
    
    # 全モデルで失敗した場合
    yield f"data: ❌ 全てのモデルでエラーが発生しました。時間を置いて再度お試しください。\n\n"
