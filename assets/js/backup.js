/**
 * ManageLinks - Backup Center
 * Developer: Devraj Chauhan
 * Handles Complete & Selective Backups, JSON, ZIP, and PBKDF2+AES-GCM Encryption
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../utils/date-utils.js';
import { FileUtils } from '../utils/file-utils.js';
import { Encryption } from '../utils/encryption.js';

export const BackupManager = {
  /**
   * Calculate backup preview metrics before export
   */
  async getBackupPreview(type = 'complete', customSelection = {}) {
    const data = await this.gatherBackupData(type, customSelection);
    const jsonString = JSON.stringify(data);
    const estimatedBytes = new TextEncoder().encode(jsonString).length;

    return {
      type,
      totalLinks: data.links?.length || 0,
      totalCategories: data.categories?.length || 0,
      totalFolders: data.folders?.length || 0,
      totalCollections: data.collections?.length || 0,
      totalRecords: (data.links?.length || 0) + 
                    (data.categories?.length || 0) + 
                    (data.folders?.length || 0) + 
                    (data.collections?.length || 0),
      estimatedSize: FileUtils.formatSize(estimatedBytes),
      estimatedBytes,
      data
    };
  },

  /**
   * Gather data based on backup type
   */
  async gatherBackupData(type = 'complete', selection = {}) {
    const now = DateUtils.now();
    const manifest = {
      app: 'ManageLinks',
      version: '1.0.0',
      developer: 'Devraj Chauhan',
      backupType: type,
      createdAt: now
    };

    let links = await db.getAll('links');
    let categories = await db.getAll('categories');
    let folders = await db.getAll('folders');
    let collections = await db.getAll('collections');
    let collectionLinks = await db.getAll('collectionLinks');
    let settings = await db.getAll('settings');
    let deletedItems = await db.getAll('deletedItems');

    switch (type) {
      case 'links-only':
        categories = [];
        folders = [];
        collections = [];
        collectionLinks = [];
        deletedItems = [];
        break;

      case 'categories-folders':
        links = [];
        collections = [];
        collectionLinks = [];
        deletedItems = [];
        break;

      case 'favorites-only':
        links = links.filter(l => l.isFavorite);
        const favCatIds = new Set(links.map(l => l.categoryId).filter(Boolean));
        const favFolderIds = new Set(links.map(l => l.folderId).filter(Boolean));
        categories = categories.filter(c => favCatIds.has(c.id));
        folders = folders.filter(f => favFolderIds.has(f.id));
        collections = [];
        collectionLinks = [];
        deletedItems = [];
        break;

      case 'selected-category':
        if (selection.categoryId) {
          categories = categories.filter(c => c.id === selection.categoryId);
          links = links.filter(l => l.categoryId === selection.categoryId);
          folders = [];
          collections = [];
          collectionLinks = [];
          deletedItems = [];
        }
        break;

      case 'selected-folder':
        if (selection.folderId) {
          folders = folders.filter(f => f.id === selection.folderId);
          links = links.filter(l => l.folderId === selection.folderId);
          categories = [];
          collections = [];
          collectionLinks = [];
          deletedItems = [];
        }
        break;

      case 'selected-collection':
        if (selection.collectionId) {
          collections = collections.filter(c => c.id === selection.collectionId);
          const cLinks = collectionLinks.filter(cl => cl.collectionId === selection.collectionId);
          const linkIds = new Set(cLinks.map(cl => cl.linkId));
          links = links.filter(l => linkIds.has(l.id));
          collectionLinks = cLinks;
          categories = [];
          folders = [];
          deletedItems = [];
        }
        break;

      case 'complete':
      default:
        // Everything included
        break;
    }

    return {
      manifest,
      links,
      categories,
      folders,
      collections,
      collectionLinks,
      settings,
      deletedItems
    };
  },

  /**
   * Execute backup download
   */
  async createBackup({ type = 'complete', format = 'json', password = null, selection = {} } = {}) {
    const data = await this.gatherBackupData(type, selection);
    const dateStamp = DateUtils.formatForFilename();
    let filenameBase = `ManageLinks_Backup_${dateStamp}`;
    let blobContent;
    let finalFilename;
    let mimeType;

    // Handle Encryption if requested
    let exportData = data;
    if (password && password.trim()) {
      exportData = await Encryption.encrypt(data, password.trim());
      filenameBase += '_encrypted';
    }

    if (format === 'zip') {
      // Use JSZip
      if (typeof window.JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
      }
      const zip = new window.JSZip();
      zip.file('manifest.json', JSON.stringify(data.manifest, null, 2));

      if (password && password.trim()) {
        zip.file('encrypted-data.mlb', JSON.stringify(exportData, null, 2));
      } else {
        zip.file('managelinks-data.json', JSON.stringify(data, null, 2));
      }

      blobContent = await zip.generateAsync({ type: 'blob' });
      finalFilename = `${filenameBase}.zip`;
      mimeType = 'application/zip';
    } else {
      // JSON format
      const jsonStr = JSON.stringify(exportData, null, 2);
      blobContent = new Blob([jsonStr], { type: 'application/json' });
      finalFilename = `${filenameBase}.json`;
      mimeType = 'application/json';
    }

    // Trigger download
    FileUtils.downloadFile(blobContent, finalFilename, mimeType);

    // Record into backup history in IndexedDB
    const historyItem = {
      id: generateId(),
      name: finalFilename,
      type,
      format,
      isEncrypted: !!(password && password.trim()),
      recordCount: (data.links?.length || 0) + (data.categories?.length || 0),
      fileSize: FileUtils.formatSize(blobContent.size),
      sizeBytes: blobContent.size,
      status: 'Downloaded',
      createdAt: DateUtils.now()
    };

    await db.put('backupHistory', historyItem);
    return historyItem;
  },

  /**
   * Get backup history
   */
  async getHistory() {
    const list = await db.getAll('backupHistory');
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Delete history record
   */
  async deleteHistory(id) {
    return await db.delete('backupHistory', id);
  },

  /**
   * Clear all history records
   */
  async clearHistory() {
    return await db.clear('backupHistory');
  }
};
