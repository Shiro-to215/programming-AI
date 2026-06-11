"""FastAPI backend for competitive programming AI assistant"""
import os
import sys

# Vercel環境でのインポートエラーを防ぐための検索パス追加
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# --- 修正後のインポート部分 ---
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os

# gemini_client からはこれだけをインポートする
from gemini_client import create_client, get_python_syntax_stream

from database import (
    init_db, save_syntax, get_all_syntaxes, search_syntaxes, 
    get_syntax_by_id, update_syntax, delete_syntax
)
# ----------------------------

# 一番外側の左端で定義
app = FastAPI(title="Programming AI Assistant")

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable not set")

gemini_client = create_client(api_key)


# Pydantic models
class SyntaxQuery(BaseModel):
    query: str
    language: str = "python"


class SyntaxCreate(BaseModel):
    title: str
    language: str
    code: str
    explanation: str = ""
    tags: List[str] = []


class SyntaxUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    explanation: Optional[str] = None
    tags: Optional[List[str]] = None

@app.post("/api/ask")
async def ask_syntax(query: SyntaxQuery):
    """Ask Gemini about syntax (Full Async version)"""
    try:
        # ❌ 誤り: stream = await get_python_syntax_stream(...)  <-- await があるとダメ
        # ✅ 正解: await を付けずに呼び出す
        stream = get_python_syntax_stream(gemini_client, query.query, query.language)
        
        # 非同期ジェネレータをそのまま渡す
        return StreamingResponse(stream, media_type="text/event-stream")
        
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        # ユーザーに表示されるエラーメッセージ
        return StreamingResponse(iter([f"data: ❌ エラーが発生しました: {str(e)}\n\n"]), media_type="text/event-stream")


@app.post("/api/syntax")
def create_syntax(syntax: SyntaxCreate):
    """Save a syntax to database"""
    try:
        result = save_syntax(
            title=syntax.title,
            language=syntax.language,
            code=syntax.code,
            explanation=syntax.explanation,
            tags=syntax.tags
        )
        return result
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/syntaxes")
def get_syntaxes(language: Optional[str] = None):
    """Get all saved syntaxes"""
    try:
        results = get_all_syntaxes(language)
        return {"results": results}
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/syntax/search")
def search(q: str, language: Optional[str] = None):
    """Search syntaxes by keyword"""
    try:
        results = search_syntaxes(q, language)
        return {"results": results}
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/syntax/{syntax_id}")
def get_syntax(syntax_id: int):
    """Get a specific syntax by ID"""
    try:
        syntax = get_syntax_by_id(syntax_id)
        if not syntax:
            raise HTTPException(status_code=404, detail="Syntax not found")
        return syntax
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/syntax/{syntax_id}")
def update_existing_syntax(syntax_id: int, syntax: SyntaxUpdate):
    """Update an existing syntax"""
    try:
        result = update_syntax(
            syntax_id=syntax_id,
            title=syntax.title,
            code=syntax.code,
            explanation=syntax.explanation,
            tags=syntax.tags
        )
        if not result:
            raise HTTPException(status_code=404, detail="Syntax not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/syntax/{syntax_id}")
def delete_existing_syntax(syntax_id: int):
    """Delete a syntax"""
    try:
        result = delete_syntax(syntax_id)
        return {"success": result}
    except Exception as e:
        print(f"DEBUG ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
