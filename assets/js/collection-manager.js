/**
 * ManageLinks - Collection Manager
 * Developer: Devraj Chauhan
 * Independent project-based link groupings
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';

export const CollectionManager = {
  /**
   * Get all collections
   */
  async getAll() {
    return await db.getAll('collections');
  },

  /**
   * Get collection by ID
   */
  async getById(id) {
    return await db.get('collections', id);
  },

  /**
   * Create collection
   */
  async create(data) {
    const now = DateUtils.now();
    const collection = {
      id: data.id || generateId(),
      name: data.name.trim(),
      description: (data.description || '').trim(),
      icon: data.icon || 'layers',
      coverColor: data.coverColor || '#2563eb',
      createdAt: now,
      updatedAt: now
    };

    await db.put('collections', collection);
    return collection;
  },

  /**
   * Update collection
   */
  async update(id, updates) {
    const existing = await db.get('collections', id);
    if (!existing) throw new Error('Collection not found');

    const updated = {
      ...existing,
      ...updates,
      updatedAt: DateUtils.now()
    };

    await db.put('collections', updated);
    return updated;
  },

  /**
   * Delete collection and remove links associations
   */
  async delete(id) {
    const collection = await db.get('collections', id);
    if (!collection) return false;

    // Find and delete all collectionLinks for this collection
    const links = await db.getByIndex('collectionLinks', 'collectionId', id);
    const linkIds = links.map(l => l.id);

    const tx = await db.transaction(['collections', 'collectionLinks', 'deletedItems'], 'readwrite');
    tx.objectStore('collections').delete(id);
    const clStore = tx.objectStore('collectionLinks');
    linkIds.forEach(clId => clStore.delete(clId));

    tx.objectStore('deletedItems').put({
      id: generateId(),
      type: 'collection',
      originalId: id,
      data: collection,
      deletedAt: DateUtils.now()
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Add a link to a collection
   */
  async addLink(collectionId, linkId) {
    const all = await db.getByIndex('collectionLinks', 'collectionId', collectionId);
    if (all.some(item => item.linkId === linkId)) return true; // already in collection

    const item = {
      id: generateId(),
      collectionId,
      linkId,
      addedAt: DateUtils.now()
    };

    await db.put('collectionLinks', item);
    return true;
  },

  /**
   * Remove a link from a collection
   */
  async removeLink(collectionId, linkId) {
    const all = await db.getByIndex('collectionLinks', 'collectionId', collectionId);
    const match = all.find(item => item.linkId === linkId);
    if (match) {
      await db.delete('collectionLinks', match.id);
    }
    return true;
  },

  /**
   * Get all link objects inside a collection
   */
  async getLinks(collectionId) {
    const items = await db.getByIndex('collectionLinks', 'collectionId', collectionId);
    const linkIds = items.map(i => i.linkId);
    if (linkIds.length === 0) return [];

    const allLinks = await db.getAll('links');
    const set = new Set(linkIds);
    return allLinks.filter(l => set.has(l.id));
  },

  /**
   * Get all collections a link belongs to
   */
  async getCollectionsForLink(linkId) {
    const items = await db.getByIndex('collectionLinks', 'linkId', linkId);
    const colIds = new Set(items.map(i => i.collectionId));
    const allCols = await db.getAll('collections');
    return allCols.filter(c => colIds.has(c.id));
  },

  /**
   * Update collection associations for a single link
   */
  async setLinkCollections(linkId, targetCollectionIds) {
    const current = await db.getByIndex('collectionLinks', 'linkId', linkId);
    const currentIds = new Set(current.map(c => c.collectionId));
    const targetSet = new Set(targetCollectionIds);

    // Remove old
    for (const item of current) {
      if (!targetSet.has(item.collectionId)) {
        await db.delete('collectionLinks', item.id);
      }
    }

    // Add new
    for (const colId of targetCollectionIds) {
      if (!currentIds.has(colId)) {
        await this.addLink(colId, linkId);
      }
    }
    return true;
  },

  /**
   * Get link counts for all collections
   */
  async getLinkCounts() {
    const all = await db.getAll('collectionLinks');
    const counts = {};
    all.forEach(item => {
      counts[item.collectionId] = (counts[item.collectionId] || 0) + 1;
    });
    return counts;
  }
};
