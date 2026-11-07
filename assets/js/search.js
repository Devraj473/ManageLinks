/**
 * ManageLinks - Global Search Engine
 * Developer: Devraj Chauhan
 * Searches locally across titles, URLs, descriptions, tags, notes, categories & folders
 */

import { db } from './database.js';
import { Storage } from './storage.js';

export const SearchEngine = {
  HISTORY_KEY: 'search_history',
  MAX_HISTORY: 10,

  /**
   * Search links given query and optional filter constraints
   */
  async search(query = '', options = {}) {
    const q = (query || '').trim().toLowerCase();
    const allLinks = await db.getAll('links');
    const categories = await db.getAll('categories');
    const folders = await db.getAll('folders');
    const collectionLinks = await db.getAll('collectionLinks');

    const catMap = new Map(categories.map(c => [c.id, c.name.toLowerCase()]));
    const folderMap = new Map(folders.map(f => [f.id, f.name.toLowerCase()]));

    // Map linkId -> collectionIds
    const linkCollectionsMap = new Map();
    collectionLinks.forEach(cl => {
      if (!linkCollectionsMap.has(cl.linkId)) linkCollectionsMap.set(cl.linkId, new Set());
      linkCollectionsMap.get(cl.linkId).add(cl.collectionId);
    });

    let results = allLinks.filter(link => {
      // 1. System state filters
      if (options.isArchived !== undefined && link.isArchived !== options.isArchived) return false;
      if (options.isFavorite !== undefined && link.isFavorite !== options.isFavorite) return false;
      if (options.isPinned !== undefined && link.isPinned !== options.isPinned) return false;
      if (options.isReadLater !== undefined && link.isReadLater !== options.isReadLater) return false;
      if (options.readingStatus && link.readingStatus !== options.readingStatus) return false;
      if (options.categoryId && link.categoryId !== options.categoryId) return false;
      if (options.folderId && link.folderId !== options.folderId) return false;
      if (options.inboxOnly && (link.categoryId || link.folderId)) return false;

      if (options.collectionId) {
        const colSet = linkCollectionsMap.get(link.id);
        if (!colSet || !colSet.has(options.collectionId)) return false;
      }

      if (options.tag) {
        if (!Array.isArray(link.tags) || !link.tags.some(t => t.toLowerCase() === options.tag.toLowerCase())) {
          return false;
        }
      }

      // 2. Text Search Query Matching
      if (!q) return true;

      const title = (link.title || '').toLowerCase();
      const url = (link.url || '').toLowerCase();
      const desc = (link.description || '').toLowerCase();
      const notes = (link.notes || '').toLowerCase();
      const tags = Array.isArray(link.tags) ? link.tags.map(t => t.toLowerCase()).join(' ') : '';
      const catName = link.categoryId ? (catMap.get(link.categoryId) || '') : '';
      const folderName = link.folderId ? (folderMap.get(link.folderId) || '') : '';

      const queryTokens = q.split(/\s+/).filter(Boolean);
      return queryTokens.every(token => 
        title.includes(token) ||
        url.includes(token) ||
        desc.includes(token) ||
        notes.includes(token) ||
        tags.includes(token) ||
        catName.includes(token) ||
        folderName.includes(token)
      );
    });

    // 3. Sorting
    const sort = options.sortBy || 'newest';
    results = this.sortLinks(results, sort);

    // Save query to search history if query exists
    if (q && q.length > 1 && !options.skipHistory) {
      this.addToHistory(q);
    }

    return results;
  },

  /**
   * Sort array of links
   */
  sortLinks(links, sortBy) {
    const list = [...links];
    switch (sortBy) {
      case 'az':
        return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'za':
        return list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      case 'oldest':
        return list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      case 'most-visited':
        return list.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
      case 'least-visited':
        return list.sort((a, b) => (a.visitCount || 0) - (b.visitCount || 0));
      case 'recently-visited':
        return list.sort((a, b) => new Date(b.lastVisitedAt || 0) - new Date(a.lastVisitedAt || 0));
      case 'newest':
      default:
        return list.sort((a, b) => {
          // Pinned links first if not explicitly disabled
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    }
  },

  /**
   * Search suggestions for autocomplete
   */
  async getSuggestions(prefix = '') {
    const p = prefix.trim().toLowerCase();
    if (!p) return [];

    const allLinks = await db.getAll('links');
    const categories = await db.getAll('categories');
    const suggestions = new Set();

    // Matching titles
    for (const link of allLinks) {
      if (link.title && link.title.toLowerCase().includes(p)) {
        suggestions.add(link.title);
      }
      if (Array.isArray(link.tags)) {
        for (const tag of link.tags) {
          if (tag.toLowerCase().includes(p)) {
            suggestions.add(`#${tag}`);
          }
        }
      }
      if (suggestions.size >= 8) break;
    }

    // Matching categories
    for (const cat of categories) {
      if (cat.name.toLowerCase().includes(p)) {
        suggestions.add(cat.name);
      }
    }

    return Array.from(suggestions).slice(0, 6);
  },

  /**
   * Highlight query term inside text (safe HTML escaping)
   */
  highlight(text, query) {
    if (!text) return '';
    if (!query || !query.trim()) {
      return this.escapeHtml(text);
    }

    const safeText = this.escapeHtml(text);
    const tokens = query.trim().split(/\s+/).filter(Boolean).map(t => this.escapeRegex(t));
    if (tokens.length === 0) return safeText;

    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    return safeText.replace(regex, '<mark class="bg-warning-subtle text-dark px-1 rounded">$1</mark>');
  },

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * Search History in LocalStorage
   */
  getHistory() {
    return Storage.get(this.HISTORY_KEY, []);
  },

  addToHistory(query) {
    const q = query.trim();
    if (!q) return;
    let list = this.getHistory().filter(item => item.toLowerCase() !== q.toLowerCase());
    list.unshift(q);
    if (list.length > this.MAX_HISTORY) list = list.slice(0, this.MAX_HISTORY);
    Storage.set(this.HISTORY_KEY, list);
  },

  clearHistory() {
    Storage.remove(this.HISTORY_KEY);
  }
};
