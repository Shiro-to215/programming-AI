/**
 * Main frontend application logic
 */

// API Base URL
const API_BASE = '/api';

// DOM Elements
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

// Modal Elements
const saveModal = document.getElementById('save-modal');
const viewModal = document.getElementById('view-modal');
const saveTitle = document.getElementById('save-title');
const saveCode = document.getElementById('save-code');
const saveExplanation = document.getElementById('save-explanation');
const saveTags = document.getElementById('save-tags');
const confirmSaveBtn = document.getElementById('confirm-save');
const cancelSaveBtn = document.getElementById('cancel-save');
const closeViewBtn = document.getElementById('close-view');
const deleteSyntaxBtn = document.getElementById('delete-syntax');

// State
let currentResponse = '';
let currentSyntaxId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupTabNavigation();
    setupEventListeners();
    loadSyntaxes();
});

// ============ TAB NAVIGATION ============
function setupTabNavigation() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    // Ask AI
    askBtn.addEventListener('click', askSyntax);
    queryInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') askSyntax();
    });

    // Save Syntax
    saveBtn.addEventListener('click', openSaveModal);
    confirmSaveBtn.addEventListener('click', saveSyntax);
    cancelSaveBtn.addEventListener('click', closeSaveModal);
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Library
    refreshBtn.addEventListener('click', loadSyntaxes);
    searchBox.addEventListener('input', (e) => {
        const query = e.target.value;
        if (query) {
            searchSyntaxes(query);
        } else {
            loadSyntaxes();
        }
    });

    // Delete Syntax
    deleteSyntaxBtn.addEventListener('click', deleteSyntax);
    closeViewBtn.addEventListener('click', closeModals);
}

// ============ ASK AI FUNCTIONALITY ============
async function askSyntax() {
    const query = queryInput.value.trim();
    const language = languageSelect.value;

    if (!query) {
        alert('質問を入力してください');
        return;
    }

    // UI初期化
    responseArea.classList.remove('hidden');
    loadingDiv.classList.remove('hidden');
    responseContent.innerHTML = '';
    currentResponse = '';
    saveBtn.classList.add('hidden');
    askBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                language: language
            })
        });

        if (!response.ok) {
            throw new Error(`サーバーエラー (ステータスコード: ${response.status})`);
        }

        const reader = response.body.getReader();
        // 💡 修正点1: 明示的に 'utf-8' を指定してiPadでの文字化け・データ消失を防ぎます
        const decoder = new TextDecoder('utf-8');
        
        // 「考え中」をここで消します
        loadingDiv.classList.add('hidden');

        while (true) {
            const { done, value } = await reader.read();
            
            // 💡 修正点2: Safariが文字をせき止めるのを防ぐため、
            // データが届くたびに、または通信が終わった瞬間に、バッファを強制的に吐き出させます
            if (done) {
                const finalChunk = decoder.decode(); // 残りの文字を強制フラッシュ
                if (finalChunk) {
                    processIncomingData(finalChunk);
                }
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            processIncomingData(chunk);
        }

        // 💡 届いたデータを安全に処理して画面に映すための、Safari用の補助関数
        function processIncomingData(textData) {
            // 前回の残りデータと結合して1行ずつ分解
            const lines = textData.split('\n');
            
            for (const line of lines) {
                // 前回設定した 「data: 」形式の目印をチェック
                if (line.startsWith('data: ')) {
                    currentResponse += line.slice(6);
                } else if (line.trim() !== '' && !line.startsWith('data:')) {
                    // 万が一「data:」がSafariのバグで削れて届いた場合の保険
                    currentResponse += line;
                }
            }
            
            // 💡 1文字でもデータがあれば、Safariの画面を強制的に書き換えます
            if (currentResponse) {
                responseContent.innerHTML = renderMarkdown(currentResponse);
            }
        }

        // 全て終わったら保存ボタンを出す
        if (currentResponse) {
            saveBtn.classList.remove('hidden');
        } else {
            // もしここまで来ても文字が空っぽだった場合の、本当の最終警告
            responseContent.innerHTML = `<p style="color: red;">⚠️ サーバーからデータは届きましたが、文字が空っぽです。GeminiのAPIキー（GEMINI_API_KEY）が正しいか確認してください。</p>`;
        }

    } catch (error) {
        console.error('Error:', error);
        loadingDiv.classList.add('hidden');
        alert(`❌ エラーが発生しました\n原因: ${error.message}`);
        responseContent.innerHTML = `<p style="color: red; font-weight: bold; padding: 10px; background: #fff3f3; border-radius: 5px;">【通信エラー】${error.message}</p>`;
    } finally {
        askBtn.disabled = false;
    }
}

// ============ MARKDOWN RENDERING ============
function renderMarkdown(text) {
    if (!text) return '';
    
    let html = escapeHtml(text);
    
    // 1. コードブロックの変換 (```lang ... ```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });
    
    // 2. インラインコードの変換 (`code`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 3. 太字の変換 (**text**)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 4. 箇条書き（* または - ）の変換
    // 行頭の「* 」や「- 」を <li> タグに変換し、連続する <li> を <ul> で囲みます
    html = html.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            return `<li>${trimmed.substring(2)}</li>`;
        }
        return line;
    }).join('\n');
    
    // <li> の塊を <ul> で包む簡単な処理
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    // 5. 改行を <br> に変換（ただし、すでにタグで囲まれている部分は除く）
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<\/pre><br>/g, '</pre>');
    html = html.replace(/<\/ul><br>/g, '</ul>');
    html = html.replace(/<br><li>/g, '<li>');
    html = html.replace(/<\/li><br>/g, '</li>');
    
    return html;
}

// ============ SAVE SYNTAX ============
function openSaveModal() {
    // タイトルの初期値（質問文の先頭15文字など）
    saveTitle.value = queryInput.value ? `${queryInput.value.substring(0, 15)}...` : '新しい構文';
    
    // 💡 AIの返答（HTMLに変換された後）から、<code>...</code> の中身だけを抽出する
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = responseContent.innerHTML;
    const codeElement = tempDiv.querySelector('pre code');
    
    if (codeElement) {
        // コードブロックが見つかったら、その中身（テキスト）だけをセット
        // 以前エスケープされた文字（&lt; など）を元に戻すために textContent を使います
        saveCode.value = codeElement.textContent;
    } else {
        // 万が一コードブロックがなかった場合は、タグを除去した全テキストをフォールバックとしてセット
        saveCode.value = currentResponse.replace(/<[^>]*>/g, '');
    }
    
    saveExplanation.value = '';
    saveTags.value = languageSelect.value; // 初期タグに言語を設定
    
    saveModal.classList.remove('hidden');
}

function closeSaveModal() {
    saveModal.classList.add('hidden');
}

async function saveSyntax() {
    const title = saveTitle.value.trim();
    const code = saveCode.value.trim();
    const explanation = saveExplanation.value.trim();
    const tags = saveTags.value.split(',').map(t => t.trim()).filter(t => t);
    const language = languageSelect.value;

    if (!title || !code) {
        alert('タイトルとコードは必須です');
        return;
    }

    try {
        // 1. まずブラウザ側（IndexedDB）に確実に保存する
        await syntaxDB.add({
            title,
            language,
            code,
            explanation,
            tags
        });

        // 2. サーバー（Vercel）への保存を試みる
        // Vercel上ではSQLiteファイルへの書き込み制限で失敗する可能性が高いですが、
        // 失敗してもキャッチ（catch）して、エラー画面を出さずにそのまま進めます
        try {
            await fetch(`${API_BASE}/syntax`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    language,
                    code,
                    explanation,
                    tags
                })
            });
        } catch (err) {
            console.warn('サーバーへの同期はスキップされました（ローカルには安全に保存されています）:', err);
        }

        // 3. 画面を閉じて、ライブラリタブに切り替える
        closeSaveModal();
        alert('構文を保存しました！');
        
        const libraryTab = document.querySelector('[data-tab="library"]');
        if (libraryTab) libraryTab.click();
        await loadSyntaxes();
        
    } catch (error) {
        console.error('Save error:', error);
        alert('ローカルへの保存自体に失敗しました');
    }
}

// ============ SYNTAX LIBRARY ============
async function loadSyntaxes() {
    try {
        const syntaxes = await syntaxDB.getAll();
        renderSyntaxesList(syntaxes);
    } catch (error) {
        console.error('Load error:', error);
        syntaxesList.innerHTML = '<p class="empty-message">エラーが発生しました</p>';
    }
}

async function searchSyntaxes(query) {
    try {
        const results = await syntaxDB.search(query);
        renderSyntaxesList(results);
    } catch (error) {
        console.error('Search error:', error);
        syntaxesList.innerHTML = '<p class="empty-message">検索に失敗しました</p>';
    }
}

function renderSyntaxesList(syntaxes) {
    if (syntaxes.length === 0) {
        syntaxesList.innerHTML = '<p class="empty-message">構文がありません</p>';
        return;
    }

    syntaxesList.innerHTML = syntaxes.map(syntax => `
        <div class="syntax-card" onclick="viewSyntax(${syntax.id})">
            <div class="syntax-card-title">${escapeHtml(syntax.title)}</div>
            <div class="syntax-card-meta">
                <span>📝 ${syntax.language}</span>
                <span>📅 ${new Date(syntax.created_at).toLocaleDateString('ja-JP')}</span>
            </div>
            <div class="syntax-card-code">${escapeHtml(syntax.code)}</div>
            ${syntax.tags.length > 0 ? `
                <div class="syntax-card-tags">
                    ${syntax.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// ============ VIEW/DELETE SYNTAX ============
async function viewSyntax(id) {
    try {
        const syntax = await syntaxDB.getById(id);
        if (!syntax) {
            alert('構文が見つかりません');
            return;
        }

        currentSyntaxId = id;

        document.getElementById('view-title').textContent = syntax.title;
        document.getElementById('view-language').textContent = syntax.language;
        document.getElementById('view-date').textContent = new Date(syntax.created_at).toLocaleDateString('ja-JP');
        document.getElementById('view-code').textContent = syntax.code;
        document.getElementById('view-explanation').textContent = syntax.explanation || '（説明なし）';

        const tagsDiv = document.getElementById('view-tags');
        tagsDiv.innerHTML = syntax.tags.length > 0
            ? syntax.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
            : '';

        viewModal.classList.remove('hidden');
    } catch (error) {
        console.error('View error:', error);
        alert('エラーが発生しました');
    }
}

async function deleteSyntax() {
    if (!currentSyntaxId) return;

    if (confirm('この構文を削除してもよろしいですか？')) {
        try {
            await syntaxDB.delete(currentSyntaxId);
            closeModals();
            await loadSyntaxes();
            alert('構文を削除しました');
        } catch (error) {
            console.error('Delete error:', error);
            alert('削除に失敗しました');
        }
    }
}

// ============ UTILITIES ============
function closeModals() {
    saveModal.classList.add('hidden');
    viewModal.classList.add('hidden');
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
