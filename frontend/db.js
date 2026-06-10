/**
 * IndexedDB management for offline syntax storage
 */
class SyntaxDB {
    constructor() {
        this.dbName = 'programming-ai-db';
        this.storeName = 'syntaxes';
        this.db = null;
        this.initPromise = this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2); // バージョンを上げて確実に更新
            
            request.onerror = () => {
                console.error('IndexedDB open error:', request.error);
                reject(request.error);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('language', 'language', { unique: false });
                    store.createIndex('created_at', 'created_at', { unique: false });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
        });
    }

    async ensureDb() {
        if (!this.db) {
            await this.initPromise;
        }
    }

    async add(syntax) {
        await this.ensureDb();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            
            syntax.created_at = new Date().toISOString();
            syntax.updated_at = new Date().toISOString();
            
            const request = store.add(syntax);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getAll() {
        await this.ensureDb();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    async search(query, language = 'all') {
        const all = await this.getAll();
        return all.filter(item => {
            const matchesLang = language === 'all' || item.language === language;
            const matchesQuery = !query || 
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                (item.explanation && item.explanation.toLowerCase().includes(query.toLowerCase())) ||
                item.code.toLowerCase().includes(query.toLowerCase());
            return matchesLang && matchesQuery;
        });
    }

    async getById(id) {
        await this.ensureDb();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.storeName], 'readonly');
            const store = tx.objectStore(this.storeName);
            const request = store.get(Number(id));
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async delete(id) {
        await this.ensureDb();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([this.storeName], 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.delete(Number(id));
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

// Global instance
const syntaxDB = new SyntaxDB();
