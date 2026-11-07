/**
 * ManageLinks - Folder Manager
 * Developer: Devraj Chauhan
 * Handles hierarchical nested folders and circular reference protection
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';

export const FolderManager = {
  /**
   * Get all folders
   */
  async getAll() {
    return await db.getAll('folders');
  },

  /**
   * Get folder by ID
   */
  async getById(id) {
    return await db.get('folders', id);
  },

  /**
   * Create new folder
   */
  async create(data) {
    const now = DateUtils.now();
    const folder = {
      id: data.id || generateId(),
      name: data.name.trim(),
      description: (data.description || '').trim(),
      parentId: data.parentId || null,
      color: data.color || '#3b82f6',
      order: data.order || 0,
      createdAt: now,
      updatedAt: now
    };

    await db.put('folders', folder);
    return folder;
  },

  /**
   * Update folder
   */
  async update(id, updates) {
    const existing = await db.get('folders', id);
    if (!existing) throw new Error('Folder not found');

    // Prevent circular reference if updating parentId
    if (updates.parentId !== undefined && updates.parentId !== existing.parentId) {
      if (updates.parentId === id) {
        throw new Error('A folder cannot be its own parent');
      }
      if (updates.parentId && await this.isDescendant(id, updates.parentId)) {
        throw new Error('Cannot move a folder into one of its subfolders');
      }
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: DateUtils.now()
    };

    await db.put('folders', updated);
    return updated;
  },

  /**
   * Check if candidateId is a descendant of folderId
   */
  async isDescendant(folderId, candidateId) {
    if (!candidateId) return false;
    let current = await db.get('folders', candidateId);
    while (current && current.parentId) {
      if (current.parentId === folderId) {
        return true;
      }
      current = await db.get('folders', current.parentId);
    }
    return false;
  },

  /**
   * Build hierarchical folder tree
   */
  async getFolderTree() {
    const allFolders = await db.getAll('folders');
    const folderMap = new Map();
    allFolders.forEach(f => folderMap.set(f.id, { ...f, children: [] }));

    const rootNodes = [];
    folderMap.forEach(folder => {
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(folder);
      } else {
        rootNodes.push(folder);
      }
    });

    return rootNodes;
  },

  /**
   * Safe delete folder
   * @param {string} id - Folder ID
   * @param {string|null} reassignFolderId - Move contents to parent or specific folder or null
   */
  async safeDelete(id, reassignFolderId = null) {
    const folder = await db.get('folders', id);
    if (!folder) return false;

    // Get direct subfolders and links
    const subfolders = await db.getByIndex('folders', 'parentId', id);
    const links = await db.getByIndex('links', 'folderId', id);

    const tx = await db.transaction(['folders', 'links', 'deletedItems'], 'readwrite');
    const folderStore = tx.objectStore('folders');
    const linkStore = tx.objectStore('links');
    const delStore = tx.objectStore('deletedItems');

    // Reassign links
    for (const link of links) {
      link.folderId = reassignFolderId;
      link.updatedAt = DateUtils.now();
      linkStore.put(link);
    }

    // Reassign subfolders to the target folder or parent
    for (const sub of subfolders) {
      sub.parentId = reassignFolderId;
      sub.updatedAt = DateUtils.now();
      folderStore.put(sub);
    }

    // Delete folder
    folderStore.delete(id);

    // Save trash record
    delStore.put({
      id: generateId(),
      type: 'folder',
      originalId: id,
      data: folder,
      deletedAt: DateUtils.now()
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  /**
   * Compute link count for each folder
   */
  async getFolderLinkCounts() {
    const links = await db.getAll('links');
    const counts = {};
    links.forEach(l => {
      if (l.folderId) {
        counts[l.folderId] = (counts[l.folderId] || 0) + 1;
      }
    });
    return counts;
  }
};
