"""Gemini API client for competitive programming syntax assistance"""
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
必ずコードブロック（```python ... ``` や ```cpp ... ``` のような形式）を使用し、初心者でも迷わないよう各行に簡単なコメントを入れてください。

### ⚠️ 注意点
初心者がよくやるミスや、競プロでバグらせやすいポイントを1つだけ教えてください。"""

    prompt = f"{system_prompt}\n\nUser Question: {query}"
    
    try:
        # ✅ 修正：非同期(aio)のストリーミング関数を使用します
        response_stream = await client.aio.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        # ✅ 修正：文字が届くたびに「data: 文字列\n\n」の形式で即座にフロント（iPad）へ流します
        async for chunk in response_stream:
            if chunk.text:
                yield f"data: {chunk.text}\n\n"
                
    except Exception as e:
        # エラーが起きた場合はフロントにエラーメッセージを流す
        yield f"data: ❌ Gemini APIエラーが発生しました: {str(e)}\n\n"
