const API_BASE = '/api';

const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const queryInput = document.getElementById('query');
const languageSelect = document.getElementById('language');
const askBtn = document.getElementById('ask-btn');
const responseArea = document.getElementById('response-area');
const responseContent = document.getElementById('response-content');
const loadingDiv = document.getElementById('loading');
const saveBtn = document.getElementById('save-btn');
const searchBox = document.getElementById('search-box');
const refreshBtn = document.getElementById('refresh-btn');
const syntaxesList = document.getElementById('syntaxes-list');

const saveModal = document.getElementById('save-modal');
const viewModal = document.getElementById('view-modal');
const saveTitle = document.getElementById('save-title');
const saveCode = document.getElementById('save-code');
const saveExplanation = document.getElementById('save-explanation');
const saveTags = document.getElementById('save-tags');
const confirmSaveBtn = document.getElementById('confirm-save');
const cancelSaveBtn = document.getElementById('cancel-save');
const closeViewBtn = document.querySelector('#view-modal .close-btn');
const closeViewFooterBtn = document.getElementById('close-view');
const deleteSyntaxBtn = document.getElementById('delete-syntax');

let currentResponse = '';
let currentSyntaxId = null;

document.addEventListener('DOMContentLoaded', async () => {
    initTabs();
    initEventListeners();
    await syntaxDB.ensureDb();
    await loadSyntaxes();
});

function initTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const tabId = `${tab.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');

            if (tab.dataset.tab === 'library') {
                await loadSyntaxes();
            }
        });
    });
}

function initEventListeners() {
    askBtn.addEventListener('click', askAI);
    saveBtn.addEventListener('click', openSaveModal);
    confirmSaveBtn.addEventListener('click', saveCurrentSyntax);
    cancelSaveBtn.addEventListener('click', closeModals);
    if (closeViewBtn) closeViewBtn.addEventListener('click', closeModals);
    if (closeViewFooterBtn) closeViewFooterBtn.addEventListener('click', closeModals);
    deleteSyntaxBtn.addEventListener('click', deleteSyntax);
    searchBox.addEventListener('input', () => loadSyntaxes());
}

async function askAI() {
    const query = queryInput.value.trim();
    if (!query) return;

    askBtn.disabled = true;
    loadingDiv.classList.remove('hidden');
    responseArea.classList.add('hidden');
    responseContent.innerHTML = '';
    currentResponse = '';

    try {
        const response = await fetch(`${API_BASE}/ask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query, language: languageSelect.value })
        });

        if (!response.ok) throw new Error(`サーバーエラー (${response.status})`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        responseArea.classList.remove('hidden');
        loadingDiv.classList.add('hidden');

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                const finalChunk = decoder.decode();
                if (finalChunk) processStreamChunk(finalChunk);
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            processStreamChunk(chunk);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        loadingDiv.classList.add('hidden');
        responseArea.classList.remove('hidden');
        responseContent.innerHTML = `<p class="error-msg">【通信エラー】${error.message}</p>`;
    } finally {
        askBtn.disabled = false;
    }
}

function processStreamChunk(chunk) {
    const lines = chunk.split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            currentResponse += line.slice(6);
        } else if (line.trim() !== '' && !line.startsWith('data:')) {
            currentResponse += line;
        }
    }
    if (currentResponse) {
        responseContent.innerHTML = renderMarkdown(currentResponse);
        saveBtn.classList.remove('hidden');
    }
}

function openSaveModal() {
    if (!currentResponse) return;
    
    // ``` で囲まれた純粋なコード部分だけをすべて抽出
    const codeBlockRegex = /
http://googleusercontent.com/immersive_entry_chip/0

---

### 4. `api/gemini_client.py`（AIの口調修正）

余計なノイズや馴れ馴れしい話し方を徹底的に排除し、競プロ用の解説として最も無駄のない丁寧なトーンに変更しています。

```python
"""Gemini API client for competitive programming syntax assistance"""
from google import genai

def create_client(api_key: str):
    """Create and return Gemini client"""
    return genai.Client(api_key=api_key)


def get_python_syntax(client, query: str, language: str = "python") -> str:
    """Get Python syntax explanation from Gemini"""
    system_prompt = f"""あなたはプログラミング初心者向けの競プロ専門の解説者です。
丁寧で分かりやすい日本語のマークダウン形式で回答してください。
{language} の構文について、以下の構成に厳密に従ってください。

### 💡 概要と解説
初心者でも直感的に理解できる簡単な説明や、具体的な例えを用いて解説してください。

### 🛒 活用シーン
競プロのどのような問題で使うのか、具体的なイメージができる例を挙げてください。

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
丁寧で分かりやすい日本語のマークダウン形式で回答してください。
{language} の構文について、以下の構成に厳密に従ってください。

### 💡 概要と解説
初心者でも直感的に理解できる簡単な説明や、具体的な例えを用いて解説してください。

### 🛒 活用シーン
競プロのどのような問題で使うのか、具体的なイメージができる例を挙げてください。

### 💻 実装コード
実践ですぐに使える、短くシンプルなコード例を記述してください。
必ずコードブロック（```python ... ``` や ```cpp ... ``` のような形式）を使用し、初心者でも迷わないよう各行に簡単なコメントを入れてください。

### ⚠️ 注意点
初心者がよくやるミスや、競プロでバグらせやすいポイントを1つだけ教えてください。"""

    prompt = f"{system_prompt}\n\nUser Question: {query}"
    
    response = await client.aio.models.generate_content_stream(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    for chunk in response:
        yield chunk.text
