/**
 * ManageLinks - Link Manager
 * Developer: Devraj Chauhan
 */

import { db, generateId } from './database.js';
import { UrlUtils } from '../../utils/url-utils.js';
import { DateUtils } from '../../utils/date-utils.js';

export const LinkManager = {
  /**
   * Create or save a link
   */
  async createLink(linkData) {
    const now = DateUtils.now();
    const url = UrlUtils.normalizeUrl(linkData.url);
    const title = linkData.title && linkData.title.trim() 
      ? linkData.title.trim() 
      : UrlUtils.generateTitleFromUrl(url);

    const record = {
      id: linkData.id || generateId(),
      title,
      url,
      description: (linkData.description || '').trim(),
      categoryId: linkData.categoryId || null,
      folderId: linkData.folderId || null,
      tags: Array.isArray(linkData.tags) ? linkData.tags.map(t => t.trim()).filter(Boolean) : [],
      notes: (linkData.notes || '').trim(),
      isFavorite: !!linkData.isFavorite,
      isPinned: !!linkData.isPinned,
      isArchived: !!linkData.isArchived,
      isReadLater: !!linkData.isReadLater,
      readingStatus: linkData.readingStatus || (linkData.isReadLater ? 'unread' : 'none'),
      createdAt: linkData.createdAt || now,
      updatedAt: now,
      lastVisitedAt: linkData.lastVisitedAt || null,
      visitCount: linkData.visitCount || 0,
      reviewDate: linkData.reviewDate || null,
      color: linkData.color || null,
      icon: linkData.icon || null
    };

    await db.put('links', record);
    window.dispatchEvent(new CustomEvent('ml-link-saved', { detail: { link: record, isNew: true } }));
    return record;
  },

  /**
   * Update an existing link
   */
  async updateLink(id, updates) {
    const existing = await db.get('links', id);
    if (!existing) throw new Error('Link not found');

    const updated = {
      ...existing,
      ...updates,
      updatedAt: DateUtils.now()
    };

    if (updates.url) {
      updated.url = UrlUtils.normalizeUrl(updates.url);
    }

    await db.put('links', updated);
    window.dispatchEvent(new CustomEvent('ml-link-saved', { detail: { link: updated, isNew: false } }));
    return updated;
  },

  /**
   * Soft-delete a link (move to deletedItems trash)
   */
  async softDeleteLink(id) {
    const link = await db.get('links', id);
    if (!link) return false;

    const trashRecord = {
      id: generateId(),
      type: 'link',
      originalId: link.id,
      data: link,
      deletedAt: DateUtils.now()
    };

    const tx = await db.transaction(['links', 'deletedItems'], 'readwrite');
    tx.objectStore('links').delete(id);
    tx.objectStore('deletedItems').put(trashRecord);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('ml-link-deleted', { detail: { id } }));
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Restore a soft-deleted link from trash
   */
  async restoreFromTrash(trashId) {
    const item = await db.get('deletedItems', trashId);
    if (!item || item.type !== 'link') return false;

    const link = item.data;
    const tx = await db.transaction(['links', 'deletedItems'], 'readwrite');
    tx.objectStore('links').put(link);
    tx.objectStore('deletedItems').delete(trashId);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        window.dispatchEvent(new CustomEvent('ml-link-saved', { detail: { link, restored: true } }));
        resolve(link);
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Permanently delete link or trash item
   */
  async permanentDeleteTrash(trashId) {
    return await db.delete('deletedItems', trashId);
  },

  /**
   * Empty entire trash
   */
  async emptyTrash() {
    return await db.clear('deletedItems');
  },

  /**
   * Record visit and increment counter
   */
  async recordVisit(id) {
    const link = await db.get('links', id);
    if (!link) return null;

    link.visitCount = (link.visitCount || 0) + 1;
    link.lastVisitedAt = DateUtils.now();
    await db.put('links', link);
    return link;
  },

  /**
   * Toggle favorite
   */
  async toggleFavorite(id) {
    const link = await db.get('links', id);
    if (!link) return null;
    link.isFavorite = !link.isFavorite;
    link.updatedAt = DateUtils.now();
    await db.put('links', link);
    return link;
  },

  /**
   * Toggle pinned
   */
  async togglePin(id) {
    const link = await db.get('links', id);
    if (!link) return null;
    link.isPinned = !link.isPinned;
    link.updatedAt = DateUtils.now();
    await db.put('links', link);
    return link;
  },

  /**
   * Toggle archive
   */
  async toggleArchive(id) {
    const link = await db.get('links', id);
    if (!link) return null;
    link.isArchived = !link.isArchived;
    link.updatedAt = DateUtils.now();
    await db.put('links', link);
    return link;
  },

  /**
   * Toggle read later
   */
  async toggleReadLater(id) {
    const link = await db.get('links', id);
    if (!link) return null;
    link.isReadLater = !link.isReadLater;
    if (link.isReadLater && (!link.readingStatus || link.readingStatus === 'none')) {
      link.readingStatus = 'unread';
    } else if (!link.isReadLater) {
      link.readingStatus = 'none';
    }
    link.updatedAt = DateUtils.now();
    await db.put('links', link);
    return link;
  },

  /**
   * Update reading status ('unread', 'reading', 'completed')
   */
  async setReadingStatus(id, status) {
    const link = await db.get('links', id);
    if (!link) return null;
    link.readingStatus = status;
    link.isReadLater = status !== 'none';
    link.updatedAt = DateUtils.now();
    await db.put('links', link);
    return link;
  },

  /**
   * Check for duplicate URL among existing active links
   */
  async checkDuplicate(url, excludeId = null) {
    if (!url) return null;
    const normalized = UrlUtils.normalizeUrl(url);
    const allLinks = await db.getAll('links');
    return allLinks.find(l => l.id !== excludeId && UrlUtils.areDuplicates(l.url, normalized)) || null;
  },

  /**
   * Smart category suggestion based on URL hostname and text content
   */
  async suggestCategory(url, title = '', tags = []) {
    const categories = await db.getAll('categories');
    if (categories.length === 0) return null;

    const hostname = UrlUtils.extractHostname(url).toLowerCase();
    const searchContext = `${hostname} ${title} ${tags.join(' ')}`.toLowerCase();

    // Specific keyword hints
    const keywordMap = {
      'github.com': 'Development',
      'gitlab.com': 'Development',
      'stackoverflow.com': 'Development',
      'npmjs.com': 'Development',
      'developer.mozilla.org': 'Development',
      'openai.com': 'AI Tools',
      'anthropic.com': 'AI Tools',
      'huggingface.co': 'AI Tools',
      'chatgpt.com': 'AI Tools',
      'youtube.com': 'Entertainment',
      'netflix.com': 'Entertainment',
      'spotify.com': 'Entertainment',
      'twitter.com': 'Social Media',
      'x.com': 'Social Media',
      'linkedin.com': 'Social Media',
      'facebook.com': 'Social Media',
      'instagram.com': 'Social Media',
      'amazon.com': 'Shopping',
      'ebay.com': 'Shopping',
      'coursera.org': 'Learning',
      'edx.org': 'Learning',
      'udemy.com': 'Learning',
      'upwork.com': 'Freelancing',
      'fiverr.com': 'Freelancing'
    };

    for (const [domain, catName] of Object.entries(keywordMap)) {
      if (hostname.includes(domain)) {
        const found = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        if (found) return found;
      }
    }

    // Keyword match against category names and descriptions
    for (const cat of categories) {
      const name = cat.name.toLowerCase();
      if (searchContext.includes(name)) return cat;
      if (cat.description) {
        const descWords = cat.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        if (descWords.some(w => searchContext.includes(w))) return cat;
      }
    }

    return null;
  },

  /**
   * Bulk operations
   */
  async bulkDelete(ids) {
    for (const id of ids) {
      await this.softDeleteLink(id);
    }
    return true;
  },

  async bulkArchive(ids, archiveState = true) {
    const tx = await db.transaction('links', 'readwrite');
    const store = tx.objectStore('links');
    for (const id of ids) {
      const link = await new Promise(r => {
        const req = store.get(id);
        req.onsuccess = () => r(req.result);
      });
      if (link) {
        link.isArchived = archiveState;
        link.updatedAt = DateUtils.now();
        store.put(link);
      }
    }
  },

  async bulkFavorite(ids, favState = true) {
    const tx = await db.transaction('links', 'readwrite');
    const store = tx.objectStore('links');
    for (const id of ids) {
      const link = await new Promise(r => {
        const req = store.get(id);
        req.onsuccess = () => r(req.result);
      });
      if (link) {
        link.isFavorite = favState;
        link.updatedAt = DateUtils.now();
        store.put(link);
      }
    }
  },

  async bulkMoveCategory(ids, categoryId) {
    const tx = await db.transaction('links', 'readwrite');
    const store = tx.objectStore('links');
    for (const id of ids) {
      const link = await new Promise(r => {
        const req = store.get(id);
        req.onsuccess = () => r(req.result);
      });
      if (link) {
        link.categoryId = categoryId;
        link.updatedAt = DateUtils.now();
        store.put(link);
      }
    }
  },

  async bulkMoveFolder(ids, folderId) {
    const tx = await db.transaction('links', 'readwrite');
    const store = tx.objectStore('links');
    for (const id of ids) {
      const link = await new Promise(r => {
        const req = store.get(id);
        req.onsuccess = () => r(req.result);
      });
      if (link) {
        link.folderId = folderId;
        link.updatedAt = DateUtils.now();
        store.put(link);
      }
    }
  }
};
