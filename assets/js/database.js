/**
 * ManageLinks - IndexedDB Database Abstraction
 * Developer: Devraj Chauhan
 * Database: ManageLinksDB (v1)
 */

export const DB_NAME = 'ManageLinksDB';
export const DB_VERSION = 3;

export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'ml_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
}

export class Database {
  constructor() {
    this.db = null;
    this.isOpen = false;
  }

  /**
   * Open or initialize IndexedDB
   */
  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(new Error(`Failed to open IndexedDB: ${event.target.error?.message || 'Unknown error'}`));
      };

      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked by another open tab');
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 1. links store
        if (!db.objectStoreNames.contains('links')) {
          const linkStore = db.createObjectStore('links', { keyPath: 'id' });
          linkStore.createIndex('url', 'url', { unique: false });
          linkStore.createIndex('categoryId', 'categoryId', { unique: false });
          linkStore.createIndex('folderId', 'folderId', { unique: false });
          linkStore.createIndex('isFavorite', 'isFavorite', { unique: false });
          linkStore.createIndex('isPinned', 'isPinned', { unique: false });
          linkStore.createIndex('isArchived', 'isArchived', { unique: false });
          linkStore.createIndex('isReadLater', 'isReadLater', { unique: false });
          linkStore.createIndex('readingStatus', 'readingStatus', { unique: false });
          linkStore.createIndex('createdAt', 'createdAt', { unique: false });
          linkStore.createIndex('lastVisitedAt', 'lastVisitedAt', { unique: false });
          linkStore.createIndex('visitCount', 'visitCount', { unique: false });
          linkStore.createIndex('reviewDate', 'reviewDate', { unique: false });
        }

        // 2. categories store
        if (!db.objectStoreNames.contains('categories')) {
          const catStore = db.createObjectStore('categories', { keyPath: 'id' });
          catStore.createIndex('name', 'name', { unique: false });
          catStore.createIndex('order', 'order', { unique: false });
          catStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        }

        // 3. folders store
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          folderStore.createIndex('name', 'name', { unique: false });
          folderStore.createIndex('parentId', 'parentId', { unique: false });
          folderStore.createIndex('order', 'order', { unique: false });
        }

        // 4. collections store
        if (!db.objectStoreNames.contains('collections')) {
          const colStore = db.createObjectStore('collections', { keyPath: 'id' });
          colStore.createIndex('name', 'name', { unique: false });
          colStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 5. collectionLinks store (junction store)
        if (!db.objectStoreNames.contains('collectionLinks')) {
          const colLinkStore = db.createObjectStore('collectionLinks', { keyPath: 'id' });
          colLinkStore.createIndex('collectionId', 'collectionId', { unique: false });
          colLinkStore.createIndex('linkId', 'linkId', { unique: false });
          colLinkStore.createIndex('compound', ['collectionId', 'linkId'], { unique: true });
        }

        // 6. tags store
        if (!db.objectStoreNames.contains('tags')) {
          const tagStore = db.createObjectStore('tags', { keyPath: 'name' });
          tagStore.createIndex('count', 'count', { unique: false });
        }

        // 7. settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 8. deletedItems store (soft-delete trash)
        if (!db.objectStoreNames.contains('deletedItems')) {
          const delStore = db.createObjectStore('deletedItems', { keyPath: 'id' });
          delStore.createIndex('type', 'type', { unique: false });
          delStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        }

        // 9. backupHistory store
        if (!db.objectStoreNames.contains('backupHistory')) {
          const backupStore = db.createObjectStore('backupHistory', { keyPath: 'id' });
          backupStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 10. notes store (Personal Notes)
        let noteStore;
        if (!db.objectStoreNames.contains('notes')) {
          noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('title', 'title', { unique: false });
          noteStore.createIndex('folderId', 'folderId', { unique: false });
          noteStore.createIndex('isPinned', 'isPinned', { unique: false });
          noteStore.createIndex('createdAt', 'createdAt', { unique: false });
          noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        } else {
          noteStore = event.target.transaction.objectStore('notes');
          if (!noteStore.indexNames.contains('folderId')) {
            noteStore.createIndex('folderId', 'folderId', { unique: false });
          }
        }

        // 11. noteFolders store (Google Drive style Folders for Notes)
        if (!db.objectStoreNames.contains('noteFolders')) {
          const nfStore = db.createObjectStore('noteFolders', { keyPath: 'id' });
          nfStore.createIndex('name', 'name', { unique: false });
          nfStore.createIndex('parentId', 'parentId', { unique: false });
          nfStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isOpen = true;
        this.db.onversionchange = () => {
          this.db.close();
          this.isOpen = false;
        };
        resolve(this.db);
      };
    });
  }

  /**
   * Helper to execute a transaction
   */
  async transaction(storeNames, mode = 'readonly') {
    const db = await this.open();
    const stores = Array.isArray(storeNames) ? storeNames : [storeNames];
    return db.transaction(stores, mode);
  }

  /**
   * Get single item by key from a store
   */
  async get(storeName, key) {
    const tx = await this.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get all items from a store
   */
  async getAll(storeName) {
    const tx = await this.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Count items in store
   */
  async count(storeName) {
    const tx = await this.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Put (insert or update) single item into store
   */
  async put(storeName, item) {
    const tx = await this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Put multiple items in a single transaction
   */
  async putBulk(storeName, items) {
    if (!items || items.length === 0) return true;
    const tx = await this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      items.forEach(item => {
        store.put(item);
      });
    });
  }

  /**
   * Delete item by key
   */
  async delete(storeName, key) {
    const tx = await this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Delete multiple items by keys
   */
  async deleteBulk(storeName, keys) {
    if (!keys || keys.length === 0) return true;
    const tx = await this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      keys.forEach(k => store.delete(k));
    });
  }

  /**
   * Clear entire store
   */
  async clear(storeName) {
    const tx = await this.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Query records by index name and value
   */
  async getByIndex(storeName, indexName, value) {
    const tx = await this.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const req = index.getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Check storage quota and estimate
   */
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        return {
          usage: est.usage || 0,
          quota: est.quota || 0,
          percentUsed: est.quota ? ((est.usage / est.quota) * 100).toFixed(2) : 0,
          isPersisted: navigator.storage.persisted ? await navigator.storage.persisted() : false
        };
      } catch (e) {
        console.warn('Storage estimate failed:', e);
      }
    }
    return { usage: 0, quota: 0, percentUsed: 0, isPersisted: false };
  }

  /**
   * Request persistent storage to prevent eviction
   */
  async requestPersistence() {
    if (navigator.storage && navigator.storage.persist) {
      return await navigator.storage.persist();
    }
    return false;
  }
}

export const db = new Database();
