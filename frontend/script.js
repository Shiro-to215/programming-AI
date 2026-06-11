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
    
    // ここでボタンをロックします（連打防止）
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
        const decoder = new TextDecoder('utf-8');
        
        loadingDiv.classList.add('hidden');

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                const finalChunk = decoder.decode();
                if (finalChunk) {
                    processIncomingData(finalChunk);
                }
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            processIncomingData(chunk);
        }

        function processIncomingData(textData) {
            const lines = textData.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    currentResponse += line.slice(6);
                } else if (line.trim() !== '' && !line.startsWith('data:')) {
                    currentResponse += line;
                }
            }
            
            if (currentResponse) {
                responseContent.innerHTML = renderMarkdown(currentResponse);
            }
        }

        // 全て終わったら保存ボタンを出す
        if (currentResponse) {
            saveBtn.classList.remove('hidden');
        } else {
            responseContent.innerHTML = `<p style="color: red;">⚠️ サーバーからデータは届きましたが、文字が空っぽです。GeminiのAPIキー（GEMINI_API_KEY）が正しいか確認してください。</p>`;
        }

    } catch (error) {
        console.error('Error:', error);
        loadingDiv.classList.add('hidden');
        
        if (error.message.includes('429')) {
            alert("⚠️ API制限に達しました。\n無料枠の上限（1日20回）を超えたようです。明日まで待つか、APIキーの設定を見直してください。");
        } else {
            alert(`❌ エラーが発生しました\n原因: ${error.message}`);
        }
        
        responseContent.innerHTML = `<p style="color: red; font-weight: bold;">通信エラーが発生しました。</p>`;
    } finally {
        // 💡 追加修正：成功してもエラーになっても、最後に必ずボタンのロックを解除する！
        askBtn.disabled = false;
    }
}


function renderMarkdown(text) {
    if (!text) return '';
    try {
        return marked.parse(text);
    } catch (e) {
        return text.replace(/\n/g, '<br>');
    }
}

// ============ SAVE SYNTAX ============
function openSaveModal() {
    saveTitle.value = queryInput.value ? `${queryInput.value.substring(0, 15)}...` : '新しい構文';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = responseContent.innerHTML;
    const codeElement = tempDiv.querySelector('pre code');
    
    if (codeElement) {
        saveCode.value = codeElement.textContent;
    } else {
        saveCode.value = currentResponse.replace(/<[^>]*>/g, '');
    }
    
    saveExplanation.value = '';
    saveTags.value = languageSelect.value;
    
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
        await syntaxDB.add({
            title,
            language,
            code,
            explanation,
            tags
        });

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
