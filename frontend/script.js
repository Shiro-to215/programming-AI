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

// ============ SAVE MODAL FUNCTIONALITY ============
function openSaveModal() {
    if (!currentResponse) return;

    // AIの返答から ``` で囲まれたプログラムコード部分のみを自動抽出するロジックを安全に追加
    const codeBlockRegex = /
http://googleusercontent.com/immersive_entry_chip/0
