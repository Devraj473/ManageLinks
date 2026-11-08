/**
 * ManageLinks - Personal Notes Manager
 * Developer: Devraj Chauhan
 * 100% Offline, Local IndexedDB Storage for Personal Notes & Snippets
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';

export const NotesManager = {
  /**
   * Get all notes with optional search, tag, and sort filters
   */
  async getAll(options = {}) {
    const { search = '', tag = '', isPinned = null, sortBy = 'updatedAt' } = options;
    let notes = await db.getAll('notes');

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
      tags: updates.tags !== undefined 
        ? (Array.isArray(updates.tags) ? updates.tags : updates.tags.split(',').map(t => t.trim()).filter(Boolean))
        : existing.tags,
      updatedAt: DateUtils.now()
    };

    await db.put('notes', updatedNote);
    window.dispatchEvent(new CustomEvent('ml-notes-changed', { detail: { action: 'update', note: updatedNote } }));
    return updatedNote;
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
  }
};
