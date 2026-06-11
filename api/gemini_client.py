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
    
    # 使用するモデルのリスト
    models = ["gemini-2.5-flash", "gemini-3.1-flash-lite"]
    
    for model_name in models:
        try:
            response = await client.aio.models.generate_content_stream(
                model=model_name,
                contents=prompt
            )
            
            async for chunk in response:
                if chunk.text:
                    yield f"data: {chunk.text}\n\n"
            
            # 正常終了したらループを抜けて終了
            return 

        except Exception as e:
            error_str = str(e)
            # エラーが最後（リストの最後）のモデルでなければ次のループへ
            if model_name != models[-1]:
                continue
            else:
                # 最後のモデルでもダメならエラーを流す
                yield f"data: ❌ エラーが発生しました ({model_name}): {error_str}\n\n"
    
    yield "data: ❌ 全てのモデルでエラーが発生しました。\n\n"
