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
const closeViewBtn = document.getElementById('close-view');
const deleteSyntaxBtn = document.getElementById('delete-syntax');

let currentResponse = '';
let currentSyntaxId = null;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initEventListeners();
    loadSyntaxes();
});

function initTabs() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const tabId = `${tab.dataset.tab}-tab`;
            document.getElementById(tabId).classList.add('active');

            if (tab.dataset.tab === 'library') {
                loadSyntaxes();
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
    
    const codeBlockRegex = /
http://googleusercontent.com/immersive_entry_chip/0
