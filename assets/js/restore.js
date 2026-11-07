/**
 * ManageLinks - Restore Center
 * Developer: Devraj Chauhan
 * Handles File Validation, Decryption, Duplicate Detection, Safety Snapshots & Restoration
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';
import { UrlUtils } from '../../utils/url-utils.js';
import { FileUtils } from '../../utils/file-utils.js';
import { Encryption } from '../../utils/encryption.js';
import { BackupManager } from './backup.js';

export const RestoreManager = {
  /**
   * Parse and validate uploaded backup file
   */
  async parseBackupFile(file, password = null) {
    if (!file) throw new Error('No file provided');

    const filename = file.name.toLowerCase();
    let parsedData = null;
    let isEncrypted = false;

    if (filename.endsWith('.zip')) {
      if (typeof window.JSZip === 'undefined') {
        throw new Error('JSZip library is required to unpack ZIP backups');
      }
      const zip = new window.JSZip();
      const zipContent = await zip.loadAsync(file);

      // Check for encrypted file or normal json
      if (zipContent.file('encrypted-data.mlb')) {
        isEncrypted = true;
        const encText = await zipContent.file('encrypted-data.mlb').async('string');
        const envelope = JSON.parse(encText);
        if (!password) {
          return { isEncrypted: true, envelope, filename: file.name };
        }
        parsedData = await Encryption.decrypt(envelope, password);
      } else if (zipContent.file('managelinks-data.json')) {
        const jsonText = await zipContent.file('managelinks-data.json').async('string');
        parsedData = JSON.parse(jsonText);
      } else {
        throw new Error('Invalid ZIP backup: missing data file');
      }
    } else {
      // JSON format
      const text = await FileUtils.readFileAsText(file);
      const json = JSON.parse(text);

      if (json.encrypted) {
        isEncrypted = true;
        if (!password) {
          return { isEncrypted: true, envelope: json, filename: file.name };
        }
        parsedData = await Encryption.decrypt(json, password);
      } else {
        parsedData = json;
      }
    }

    // Validate structure
    this.validateBackupData(parsedData);

    // Analyze duplicates against current database
    const duplicates = await this.analyzeDuplicates(parsedData);

    return {
      isEncrypted: false,
      data: parsedData,
      filename: file.name,
      duplicates,
      summary: {
        linksCount: parsedData.links?.length || 0,
        categoriesCount: parsedData.categories?.length || 0,
        foldersCount: parsedData.folders?.length || 0,
        collectionsCount: parsedData.collections?.length || 0,
        appVersion: parsedData.manifest?.version || '1.0.0',
        backupDate: parsedData.manifest?.createdAt || 'Unknown'
      }
    };
  },

  /**
   * Validate that the incoming data conforms to ManageLinks structure
   */
  validateBackupData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Malformed backup data: Expected valid JSON object');
    }

    if (!data.manifest || data.manifest.app !== 'ManageLinks') {
      // Fallback for raw arrays or older versions
      if (!Array.isArray(data.links) && !Array.isArray(data.categories)) {
        throw new Error('Invalid backup file: ManageLinks signature not recognized');
      }
    }
  },

  /**
   * Compare incoming backup records with existing DB records
   */
  async analyzeDuplicates(incomingData) {
    const existingLinks = await db.getAll('links');
    const existingCategories = await db.getAll('categories');
    const existingFolders = await db.getAll('folders');

    const linkIdSet = new Set(existingLinks.map(l => l.id));
    const urlMap = new Map();
    existingLinks.forEach(l => urlMap.set(UrlUtils.normalizeUrl(l.url), l));

    const duplicateLinks = [];
    const incomingLinks = incomingData.links || [];

    incomingLinks.forEach(inLink => {
      const norm = UrlUtils.normalizeUrl(inLink.url);
      if (linkIdSet.has(inLink.id)) {
        duplicateLinks.push({ incoming: inLink, existing: existingLinks.find(l => l.id === inLink.id), reason: 'ID Match' });
      } else if (urlMap.has(norm)) {
        duplicateLinks.push({ incoming: inLink, existing: urlMap.get(norm), reason: 'URL Match' });
      }
    });

    return {
      duplicateLinksCount: duplicateLinks.length,
      duplicateLinks
    };
  },

  /**
   * Create an emergency automatic safety backup before performing full replacement
   */
  async createSafetySnapshot() {
    const snapshot = await BackupManager.gatherBackupData('complete');
    return snapshot;
  },

  /**
   * Execute Restoration
   * @param {Object} backupData - Validated backup payload
   * @param {Object} options - mode: 'replace' | 'merge' | 'selective', duplicateAction: 'skip' | 'replace' | 'new', selectiveItems: {...}
   */
  async executeRestore(backupData, options = {}) {
    const { mode = 'merge', duplicateAction = 'skip', createSafety = true } = options;

    // Safety snapshot
    let safetyBackup = null;
    if (createSafety) {
      safetyBackup = await this.createSafetySnapshot();
    }

    const inLinks = backupData.links || [];
    const inCategories = backupData.categories || [];
    const inFolders = backupData.folders || [];
    const inCollections = backupData.collections || [];
    const inCollectionLinks = backupData.collectionLinks || [];

    let restoredLinksCount = 0;
    let skippedCount = 0;

    if (mode === 'replace') {
      // Clear existing stores
      await db.clear('links');
      await db.clear('categories');
      await db.clear('folders');
      await db.clear('collections');
      await db.clear('collectionLinks');

      // Put all incoming records
      if (inCategories.length > 0) await db.putBulk('categories', inCategories);
      if (inFolders.length > 0) await db.putBulk('folders', inFolders);
      if (inCollections.length > 0) await db.putBulk('collections', inCollections);
      if (inCollectionLinks.length > 0) await db.putBulk('collectionLinks', inCollectionLinks);
      if (inLinks.length > 0) await db.putBulk('links', inLinks);

      restoredLinksCount = inLinks.length;
    } else {
      // Merge mode
      const existingLinks = await db.getAll('links');
      const existingCategories = await db.getAll('categories');
      const existingFolders = await db.getAll('folders');
      const existingCollections = await db.getAll('collections');

      const existingCatIds = new Set(existingCategories.map(c => c.id));
      const existingFolderIds = new Set(existingFolders.map(f => f.id));
      const existingColIds = new Set(existingCollections.map(c => c.id));
      const existingUrlMap = new Map();
      existingLinks.forEach(l => existingUrlMap.set(UrlUtils.normalizeUrl(l.url), l));
      const existingLinkIdSet = new Set(existingLinks.map(l => l.id));

      // 1. Merge Categories
      const catsToInsert = inCategories.filter(c => !existingCatIds.has(c.id));
      if (catsToInsert.length > 0) await db.putBulk('categories', catsToInsert);

      // 2. Merge Folders
      const foldersToInsert = inFolders.filter(f => !existingFolderIds.has(f.id));
      if (foldersToInsert.length > 0) await db.putBulk('folders', foldersToInsert);

      // 3. Merge Collections
      const colsToInsert = inCollections.filter(c => !existingColIds.has(c.id));
      if (colsToInsert.length > 0) await db.putBulk('collections', colsToInsert);

      // 4. Merge Links according to duplicate policy
      const linksToPut = [];
      for (const link of inLinks) {
        const norm = UrlUtils.normalizeUrl(link.url);
        const hasIdMatch = existingLinkIdSet.has(link.id);
        const hasUrlMatch = existingUrlMap.has(norm);

        if (hasIdMatch || hasUrlMatch) {
          if (duplicateAction === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateAction === 'replace') {
            const targetId = hasIdMatch ? link.id : existingUrlMap.get(norm).id;
            linksToPut.push({ ...link, id: targetId, updatedAt: DateUtils.now() });
            restoredLinksCount++;
          } else if (duplicateAction === 'new') {
            // Assign fresh unique ID
            linksToPut.push({ ...link, id: generateId(), updatedAt: DateUtils.now() });
            restoredLinksCount++;
          }
        } else {
          linksToPut.push(link);
          restoredLinksCount++;
        }
      }

      if (linksToPut.length > 0) {
        await db.putBulk('links', linksToPut);
      }

      // Merge collectionLinks
      if (inCollectionLinks.length > 0) {
        await db.putBulk('collectionLinks', inCollectionLinks);
      }
    }

    return {
      success: true,
      mode,
      restoredLinksCount,
      skippedCount,
      categoriesCount: inCategories.length,
      foldersCount: inFolders.length,
      collectionsCount: inCollections.length,
      safetyBackupAvailable: !!safetyBackup
    };
  }
};
