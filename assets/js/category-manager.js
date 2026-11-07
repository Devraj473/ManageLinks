/**
 * ManageLinks - Category Manager
 * Developer: Devraj Chauhan
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';

export const DEFAULT_CATEGORIES = [
  { name: 'AI Tools', description: 'Artificial Intelligence, LLMs, and generators', icon: 'cpu', color: '#6366f1' },
  { name: 'Development', description: 'Coding, tools, documentation, and repositories', icon: 'code', color: '#0284c7' },
  { name: 'Learning', description: 'Tutorials, guides, blogs, and study resources', icon: 'book-open', color: '#10b981' },
  { name: 'Education', description: 'Academic papers, courses, and educational institutions', icon: 'book', color: '#8b5cf6' },
  { name: 'Social Media', description: 'Social networks, communities, and forums', icon: 'users', color: '#ec4899' },
  { name: 'Entertainment', description: 'Videos, music, gaming, and multimedia', icon: 'film', color: '#f59e0b' },
  { name: 'Work', description: 'Professional resources, team portals, and projects', icon: 'briefcase', color: '#3b82f6' },
  { name: 'Freelancing', description: 'Freelance platforms, client portals, and gigs', icon: 'dollar-sign', color: '#14b8a6' },
  { name: 'Shopping', description: 'E-commerce, deals, and product wishlists', icon: 'shopping-bag', color: '#f43f5e' },
  { name: 'Finance', description: 'Banking, investments, taxes, and crypto', icon: 'shield', color: '#059669' },
  { name: 'Government', description: 'Official government portals, tax, and citizen services', icon: 'shield', color: '#64748b' },
  { name: 'Personal', description: 'Personal blogs, private bookmarks, and hobbies', icon: 'heart', color: '#e11d48' }
];

export const CategoryManager = {
  /**
   * Seed default categories if none exist
   */
  async seedDefaults() {
    const existing = await db.getAll('categories');
    if (existing.length > 0) return existing;

    const now = DateUtils.now();
    const categoriesToInsert = DEFAULT_CATEGORIES.map((cat, index) => ({
      id: generateId(),
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      isFavorite: false,
      order: index,
      createdAt: now,
      updatedAt: now
    }));

    await db.putBulk('categories', categoriesToInsert);
    return categoriesToInsert;
  },

  /**
   * Get all categories sorted by order
   */
  async getAll() {
    const categories = await db.getAll('categories');
    return categories.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  /**
   * Get category by ID
   */
  async getById(id) {
    return await db.get('categories', id);
  },

  /**
   * Create new category
   */
  async create(data) {
    const now = DateUtils.now();
    const existing = await db.getAll('categories');
    const maxOrder = existing.reduce((max, c) => Math.max(max, c.order || 0), -1);

    const category = {
      id: data.id || generateId(),
      name: data.name.trim(),
      description: (data.description || '').trim(),
      icon: data.icon || 'folder',
      color: data.color || '#3b82f6',
      isFavorite: !!data.isFavorite,
      order: data.order !== undefined ? data.order : maxOrder + 1,
      createdAt: now,
      updatedAt: now
    };

    await db.put('categories', category);
    return category;
  },

  /**
   * Update category
   */
  async update(id, updates) {
    const existing = await db.get('categories', id);
    if (!existing) throw new Error('Category not found');

    const updated = {
      ...existing,
      ...updates,
      updatedAt: DateUtils.now()
    };

    await db.put('categories', updated);
    return updated;
  },

  /**
   * Delete category safely
   * @param {string} id - Category ID to delete
   * @param {string|null} reassignCategoryId - Optional category ID to transfer links to, or null for unassigned
   */
  async safeDelete(id, reassignCategoryId = null) {
    const category = await db.get('categories', id);
    if (!category) return false;

    // Fetch links in this category
    const links = await db.getByIndex('links', 'categoryId', id);

    const tx = await db.transaction(['links', 'categories', 'deletedItems'], 'readwrite');
    const linkStore = tx.objectStore('links');
    const catStore = tx.objectStore('categories');
    const delStore = tx.objectStore('deletedItems');

    // Reassign links
    for (const link of links) {
      link.categoryId = reassignCategoryId;
      link.updatedAt = DateUtils.now();
      linkStore.put(link);
    }

    // Delete category
    catStore.delete(id);

    // Save deletion record
    delStore.put({
      id: generateId(),
      type: 'category',
      originalId: id,
      data: category,
      reassignedLinksCount: links.length,
      deletedAt: DateUtils.now()
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Reorder categories
   */
  async reorder(orderedIds) {
    const categories = await db.getAll('categories');
    const catMap = new Map(categories.map(c => [c.id, c]));

    const updatedList = [];
    orderedIds.forEach((id, index) => {
      const cat = catMap.get(id);
      if (cat) {
        cat.order = index;
        cat.updatedAt = DateUtils.now();
        updatedList.push(cat);
      }
    });

    await db.putBulk('categories', updatedList);
    return true;
  },

  /**
   * Toggle favorite category
   */
  async toggleFavorite(id) {
    const cat = await db.get('categories', id);
    if (!cat) return null;
    cat.isFavorite = !cat.isFavorite;
    cat.updatedAt = DateUtils.now();
    await db.put('categories', cat);
    return cat;
  }
};
