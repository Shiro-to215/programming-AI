/**
 * IndexedDB management for offline syntax storage
 * Falls back to localStorage if IndexedDB is unavailable
 */

class SyntaxDB {
    constructor() {
        this.dbName = 'programming-ai-db';
        this.storeName = 'syntaxes';
        this.db = null;
        this.useIndexedDB = 'indexedDB' in window;
        this.init();
    }

    async init() {
        if (this.useIndexedDB) {
            try {
                this.db = await new Promise((resolve, reject) => {
                    const request = indexedDB.open(this.dbName, 1);
                    request.onerror = () => reject(request.error);
                    request.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(this.storeName)) {
                            const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                            store.createIndex('language', 'language', { unique: false });
                            store.createIndex('created_at', 'created_at', { unique: false });
                        }
                    };
                    request.onsuccess = () => resolve(request.result);
                });
            } catch (err) {
                console.warn('IndexedDB not available, using localStorage fallback', err);
                this.useIndexedDB = false;
            }
        }
    }

    async add(syntax) {
        syntax.created_at = new Date().toISOString();
        syntax.updated_at = new Date().toISOString();

        if (this.useIndexedDB) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([this.storeName], 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.add(syntax);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        } else {
            // Fallback to localStorage
            let syntaxes = JSON.parse(localStorage.getItem('syntaxes') || '[]');
            syntax.id = Math.max(...syntaxes.map(s => s.id || 0), 0) + 1;
            syntaxes.push(syntax);
            localStorage.setItem('syntaxes', JSON.stringify(syntaxes));
            return syntax.id;
        }
    }

    async getAll(language = null) {
        if (this.useIndexedDB) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([this.storeName], 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = language ? store.index('language').getAll(language) : store.getAll();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const results = request.result.sort((a, b) => 
                        new Date(b.created_at) - new Date(a.created_at)
                    );
                    resolve(results);
                };
            });
        } else {
            // Fallback to localStorage
            let syntaxes = JSON.parse(localStorage.getItem('syntaxes') || '[]');
            if (language) {
                syntaxes = syntaxes.filter(s => s.language === language);
            }
            return syntaxes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    }

    async search(query, language = null) {
        const syntaxes = await this.getAll(language);
        const q = query.toLowerCase();
        return syntaxes.filter(s =>
            s.title.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.tags.some(tag => tag.toLowerCase().includes(q))
        );
    }

    async getById(id) {
        if (this.useIndexedDB) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([this.storeName], 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.get(id);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        } else {
            // Fallback to localStorage
            const syntaxes = JSON.parse(localStorage.getItem('syntaxes') || '[]');
            return syntaxes.find(s => s.id === id);
        }
    }

    async update(id, syntax) {
        syntax.updated_at = new Date().toISOString();

        if (this.useIndexedDB) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([this.storeName], 'readwrite');
                const store = tx.objectStore(this.storeName);
                syntax.id = id;
                const request = store.put(syntax);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        } else {
            // Fallback to localStorage
            let syntaxes = JSON.parse(localStorage.getItem('syntaxes') || '[]');
            const index = syntaxes.findIndex(s => s.id === id);
            if (index !== -1) {
                syntax.id = id;
                syntaxes[index] = syntax;
                localStorage.setItem('syntaxes', JSON.stringify(syntaxes));
                return id;
            }
            throw new Error('Syntax not found');
        }
    }

    async delete(id) {
        if (this.useIndexedDB) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction([this.storeName], 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.delete(id);
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } else {
            // Fallback to localStorage
            let syntaxes = JSON.parse(localStorage.getItem('syntaxes') || '[]');
            syntaxes = syntaxes.filter(s => s.id !== id);
            localStorage.setItem('syntaxes', JSON.stringify(syntaxes));
        }
    }
}

// Global instance
const syntaxDB = new SyntaxDB();
