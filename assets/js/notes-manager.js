/**
 * ManageLinks - Personal Notes & Folders Manager
 * Developer: Devraj Chauhan
 * 100% Offline, Local IndexedDB Storage for Personal Notes, Snippets & Google Drive Style Folders
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';
import { Security } from './security.js';

export const NotesManager = {
  // =========================================================
  // FOLDER MANAGEMENT (Google Drive Style)
  // =========================================================

  /**
   * Get all note folders
   */
  async getAllFolders() {
    try {
      const folders = await db.getAll('noteFolders');
      return folders.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } catch {
      return [];
    }
  },

  /**
   * Get single folder by ID
   */
  async getFolder(id) {
    if (!id) return null;
    try {
      return await db.get('noteFolders', id);
    } catch {
      return null;
    }
  },

  /**
   * Create a new note folder
   */
  async createFolder(folderData) {
    const name = (folderData.name || '').trim();
    if (!name) throw new Error('Folder name is required');

    const now = DateUtils.now();
    const folder = {
      id: generateId(),
      name,
      parentId: folderData.parentId || null,
      color: folderData.color || 'blue',
      icon: folderData.icon || 'folder',
      createdAt: now,
      updatedAt: now
    };

    await db.put('noteFolders', folder);
    window.dispatchEvent(new CustomEvent('ml-notes-changed', { detail: { action: 'create-folder', folder } }));
    return folder;
  },

  /**
   * Rename or update a note folder
   */
  async updateFolder(id, updates) {
    const existing = await this.getFolder(id);
    if (!existing) throw new Error('Folder not found');

    const updatedFolder = {
      ...existing,
      ...updates,
      id,
      name: updates.name ? updates.name.trim() : existing.name,
      updatedAt: DateUtils.now()
    };

    await db.put('noteFolders', updatedFolder);
    window.dispatchEvent(new CustomEvent('ml-notes-changed', { detail: { action: 'update-folder', folder: updatedFolder } }));
    return updatedFolder;
  },

  /**
   * Delete a note folder
   * Notes inside this folder are moved to root (folderId: null) rather than lost!
   */
  async deleteFolder(id) {
    const folder = await this.getFolder(id);
    if (!folder) return false;

    // Move any notes in this folder back to root
    const allNotes = await db.getAll('notes');
    for (const note of allNotes) {
      if (note.folderId === id) {
        await this.update(note.id, { folderId: null });
      }
    }

    await db.delete('noteFolders', id);
    window.dispatchEvent(new CustomEvent('ml-notes-changed', { detail: { action: 'delete-folder', id } }));
    return true;
  },

  // =========================================================
  // NOTES MANAGEMENT
  // =========================================================

  /**
   * Get all notes with optional search, tag, folder, and sort filters
   */
  async getAll(options = {}) {
    const { search = '', tag = '', folderId = undefined, isPinned = null, sortBy = 'updatedAt' } = options;
    let notes = await db.getAll('notes');

    // Filter by Folder if specified (null means root notes only, undefined means all folders)
    if (folderId !== undefined) {
      if (folderId === null || folderId === '' || folderId === 'root') {
        notes = notes.filter(n => !n.folderId);
      } else {
        notes = notes.filter(n => n.folderId === folderId);
      }
    }

    // Filter by Pinned status if requested
    if (isPinned !== null) {
      notes = notes.filter(n => !!n.isPinned === isPinned);
    }

    // Filter by Tag if requested
    if (tag && tag.trim()) {
      const cleanTag = tag.trim().toLowerCase();
      notes = notes.filter(n => Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase() === cleanTag));
    }

    // Filter by Search Query (searches in title, content, and tags)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      notes = notes.filter(n => {
        const titleMatch = (n.title || '').toLowerCase().includes(q);
        const contentMatch = (n.content || '').toLowerCase().includes(q);
        const tagMatch = Array.isArray(n.tags) && n.tags.some(t => t.toLowerCase().includes(q));
        return titleMatch || contentMatch || tagMatch;
      });
    }

    // Sort notes: Pinned notes first, then by sortBy
    notes.sort((a, b) => {
      // Pinned always on top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else {
        // default newest updated
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      }
    });

    return notes;
  },

  /**
   * Get single note by ID
   */
  async get(id) {
    if (!id) return null;
    return await db.get('notes', id);
  },

  /**
   * Create new note
   */
  async create(noteData) {
    const now = DateUtils.now();
    const id = generateId();

    const note = {
      id,
      title: (noteData.title || '').trim() || 'Untitled Note',
      content: (noteData.content || '').trim(),
      folderId: noteData.folderId || null,
      tags: Array.isArray(noteData.tags) 
        ? noteData.tags.map(t => String(t).trim()).filter(Boolean)
        : (typeof noteData.tags === 'string' ? noteData.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      color: noteData.color || 'default',
      isPinned: !!noteData.isPinned,
      createdAt: now,
      updatedAt: now
    };

    await db.put('notes', note);
    window.dispatchEvent(new CustomEvent('ml-notes-changed', { detail: { action: 'create', note } }));
    return note;
  },

  /**
   * Update existing note
   */
  async update(id, updates) {
    const existing = await this.get(id);
    if (!existing) throw new Error('Note not found');

    const updatedNote = {
      ...existing,
      ...updates,
      id,
      title: updates.title !== undefined ? updates.title.trim() || 'Untitled Note' : existing.title,
      content: updates.content !== undefined ? updates.content.trim() : existing.content,
      folderId: updates.folderId !== undefined ? (updates.folderId || null) : existing.folderId,
      tags: updates.tags !== undefined 
        ? (Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim()).filter(Boolean))
        : existing.tags,
      color: updates.color !== undefined ? updates.color : existing.color,
      isPinned: updates.isPinned !== undefined ? !!updates.isPinned : existing.isPinned,
      updatedAt: DateUtils.now()
    };

    await db.put('notes', updatedNote);
    window.dispatchEvent(new CustomEvent('ml-notes-changed', { detail: { action: 'update', note: updatedNote } }));
    return updatedNote;
  },

  /**
   * Move note to a folder (or null for root)
   */
  async moveToFolder(id, folderId) {
    return await this.update(id, { folderId: folderId || null });
  },

  /**
   * Toggle note pinned state
   */
  async togglePin(id) {
    const note = await this.get(id);
    if (!note) return null;
    const isPinned = !note.isPinned;
    return await this.update(id, { isPinned });
  },

  /**
   * Delete note
   */
  async delete(id) {
    const note = await this.get(id);
    if (!note) return false;

    // Archive to deletedItems store for recovery
    await db.put('deletedItems', {
      id: generateId(),
      originalId: note.id,
      type: 'note',
      item: note,
      deletedAt: DateUtils.now()
    });

    await db.delete('notes', id);
    window.dispatchEvent(new CustomEvent('ml-notes-changed', { detail: { action: 'delete', id } }));
    return true;
  },

  /**
   * Get all distinct tags used across notes
   */
  async getAllTags() {
    const notes = await db.getAll('notes');
    const tagsSet = new Set();
    notes.forEach(n => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach(t => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet).sort();
  },

  // =========================================================
  // URL DETECTION & CLICKABLE LINKIFY
  // =========================================================

  /**
   * Safely linkifies plain text into HTML:
   * Converts raw URLs (https://...) and Markdown links ([text](url)) into active, clickable hyperlinks
   */
  linkify(text) {
    if (!text) return '';

    // First escape raw HTML to prevent injection
    let safe = Security.escapeHtml(text);

    // 1. Convert Markdown links: [Title](https://...)
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary text-decoration-underline fw-semibold note-active-link">$1</a>');

    // 2. Convert raw URLs (http:// or https://) that are not already inside an <a> tag
    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;
    safe = safe.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary text-decoration-underline note-active-link">${url}</a>`;
    });

    return safe;
  }
};
