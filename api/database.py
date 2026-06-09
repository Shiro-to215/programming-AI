"""SQLite database management for storing saved syntaxes"""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional

DB_PATH = "syntaxes.db"


def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS syntaxes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            language TEXT NOT NULL,
            code TEXT NOT NULL,
            explanation TEXT,
            tags TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()


def save_syntax(title: str, language: str, code: str, explanation: str = "", tags: List[str] = None) -> Dict:
    """Save a new syntax to database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    tags_json = json.dumps(tags or [])
    
    c.execute('''
        INSERT INTO syntaxes (title, language, code, explanation, tags)
        VALUES (?, ?, ?, ?, ?)
    ''', (title, language, code, explanation, tags_json))
    
    syntax_id = c.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "id": syntax_id,
        "title": title,
        "language": language,
        "code": code,
        "explanation": explanation,
        "tags": tags or []
    }


def get_all_syntaxes(language: str = None) -> List[Dict]:
    """Get all syntaxes, optionally filtered by language"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    if language:
        c.execute('SELECT * FROM syntaxes WHERE language = ? ORDER BY created_at DESC', (language,))
    else:
        c.execute('SELECT * FROM syntaxes ORDER BY created_at DESC')
    
    rows = c.fetchall()
    conn.close()
    
    syntaxes = []
    for row in rows:
        syntaxes.append({
            "id": row[0],
            "title": row[1],
            "language": row[2],
            "code": row[3],
            "explanation": row[4],
            "tags": json.loads(row[5]),
            "created_at": row[6],
            "updated_at": row[7]
        })
    
    return syntaxes


def search_syntaxes(query: str, language: str = None) -> List[Dict]:
    """Search syntaxes by title, code, or tags"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    search_pattern = f"%{query}%"
    
    if language:
        c.execute('''
            SELECT * FROM syntaxes 
            WHERE language = ? AND (title LIKE ? OR code LIKE ? OR tags LIKE ?)
            ORDER BY created_at DESC
        ''', (language, search_pattern, search_pattern, search_pattern))
    else:
        c.execute('''
            SELECT * FROM syntaxes 
            WHERE title LIKE ? OR code LIKE ? OR tags LIKE ?
            ORDER BY created_at DESC
        ''', (search_pattern, search_pattern, search_pattern))
    
    rows = c.fetchall()
    conn.close()
    
    syntaxes = []
    for row in rows:
        syntaxes.append({
            "id": row[0],
            "title": row[1],
            "language": row[2],
            "code": row[3],
            "explanation": row[4],
            "tags": json.loads(row[5]),
            "created_at": row[6],
            "updated_at": row[7]
        })
    
    return syntaxes


def get_syntax_by_id(syntax_id: int) -> Optional[Dict]:
    """Get a specific syntax by ID"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('SELECT * FROM syntaxes WHERE id = ?', (syntax_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        return None
    
    return {
        "id": row[0],
        "title": row[1],
        "language": row[2],
        "code": row[3],
        "explanation": row[4],
        "tags": json.loads(row[5]),
        "created_at": row[6],
        "updated_at": row[7]
    }


def update_syntax(syntax_id: int, title: str = None, code: str = None, explanation: str = None, tags: List[str] = None) -> Dict:
    """Update an existing syntax"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Get current values
    current = get_syntax_by_id(syntax_id)
    if not current:
        conn.close()
        return None
    
    # Use provided values or keep current
    new_title = title or current["title"]
    new_code = code or current["code"]
    new_explanation = explanation or current["explanation"]
    new_tags = json.dumps(tags or current["tags"])
    
    c.execute('''
        UPDATE syntaxes 
        SET title = ?, code = ?, explanation = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (new_title, new_code, new_explanation, new_tags, syntax_id))
    
    conn.commit()
    conn.close()
    
    return {
        "id": syntax_id,
        "title": new_title,
        "language": current["language"],
        "code": new_code,
        "explanation": new_explanation,
        "tags": tags or current["tags"]
    }


def delete_syntax(syntax_id: int) -> bool:
    """Delete a syntax by ID"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute('DELETE FROM syntaxes WHERE id = ?', (syntax_id,))
    conn.commit()
    conn.close()
    
    return True
