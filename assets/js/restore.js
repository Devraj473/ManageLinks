/**
 * ManageLinks - Restore Center
 * Developer: Devraj Chauhan
 * Handles File Validation, Decryption, Duplicate Detection, Safety Snapshots & Restoration
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';
import { UrlUtils } from '../../utils/url-utils.js';
import { FileUtils } from '../../utils/file-utils.js';
import { Validators } from '../../utils/validators.js';
import { Encryption } from '../../utils/encryption.js';
import { BackupManager } from './backup.js';
import { CategoryManager } from './category-manager.js';

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
      let json;
      try {
        json = JSON.parse(text);
      } catch (err) {
        throw new Error(`JSON parsing failed: ${err.message}`);
      }

      if (json && json.encrypted) {
        isEncrypted = true;
        if (!password) {
          return { isEncrypted: true, envelope: json, filename: file.name };
        }
        parsedData = await Encryption.decrypt(json, password);
      } else {
        parsedData = json;
      }
    }

    // Normalize any JSON format (Array of links, official backup package, or bookmark object)
    parsedData = this.normalizeBackupPayload(parsedData);

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
   * Normalize arbitrary JSON into standard ManageLinks payload
   */
  normalizeBackupPayload(payload) {
    if (!payload) return { links: [], categories: [], folders: [], collections: [] };

    // 1. If payload is a direct Array of link objects
    if (Array.isArray(payload)) {
      return {
        manifest: {
          app: 'ManageLinks',
          version: '1.0.0',
          backupType: 'links-only',
          createdAt: DateUtils.now()
        },
        links: payload,
        categories: [],
        folders: [],
        collections: [],
        collectionLinks: [],
        notes: []
      };
    }

    // 2. If payload has bookmarks or items instead of links
    if (typeof payload === 'object') {
      if (!payload.links && Array.isArray(payload.bookmarks)) {
        payload.links = payload.bookmarks;
      } else if (!payload.links && Array.isArray(payload.items)) {
        payload.links = payload.items;
      }

      payload.manifest = payload.manifest || {
        app: 'ManageLinks',
        version: '1.0.0',
        backupType: 'custom',
        createdAt: DateUtils.now()
      };
      payload.links = Array.isArray(payload.links) ? payload.links : [];
      payload.categories = Array.isArray(payload.categories) ? payload.categories : [];
      payload.folders = Array.isArray(payload.folders) ? payload.folders : [];
      payload.collections = Array.isArray(payload.collections) ? payload.collections : [];
      payload.collectionLinks = Array.isArray(payload.collectionLinks) ? payload.collectionLinks : [];
      payload.notes = Array.isArray(payload.notes) ? payload.notes : [];
    }

    return payload;
  },

  /**
   * Validate that the incoming data conforms to ManageLinks structure
   */
  validateBackupData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Malformed backup data: Expected valid JSON object');
    }

    const hasLinks = Array.isArray(data.links) && data.links.length > 0;
    const hasCategories = Array.isArray(data.categories) && data.categories.length > 0;
    const hasFolders = Array.isArray(data.folders) && data.folders.length > 0;

    if (!hasLinks && !hasCategories && !hasFolders) {
      throw new Error('No valid links, categories, or folders found in this backup file.');
    }
  },

  /**
   * Compare incoming backup records with existing DB records
   */
  async analyzeDuplicates(incomingData) {
    const existingLinks = await db.getAll('links');
    const linkIdSet = new Set(existingLinks.map(l => l.id));
    const urlMap = new Map();
    existingLinks.forEach(l => urlMap.set(UrlUtils.normalizeUrl(l.url), l));

    const duplicateLinks = [];
    const incomingLinks = incomingData.links || [];

    incomingLinks.forEach(inLink => {
      if (!inLink.url) return;
      const norm = UrlUtils.normalizeUrl(inLink.url);
      if (inLink.id && linkIdSet.has(inLink.id)) {
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
   * Sanitize an incoming link to guarantee valid IndexedDB key and non-null fields
   */
  sanitizeLink(raw) {
    let url = (raw.url || '').trim();
    if (!url) return null;
    url = Validators.ensureProtocol(url);
    const normalizedUrl = UrlUtils.normalizeUrl(url);

    return {
      id: (raw.id && typeof raw.id === 'string' && raw.id.trim()) ? raw.id.trim() : generateId(),
      title: (raw.title || '').trim() || UrlUtils.generateTitleFromUrl(url),
      url: normalizedUrl,
      description: (raw.description || '').trim(),
      categoryId: raw.categoryId || null,
      folderId: raw.folderId || null,
      tags: Array.isArray(raw.tags) ? raw.tags.map(t => String(t).trim()).filter(Boolean) : (typeof raw.tags === 'string' ? raw.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : []),
      notes: (raw.notes || '').trim(),
      isFavorite: !!raw.isFavorite,
      isPinned: !!raw.isPinned,
      isArchived: !!raw.isArchived,
      isReadLater: !!raw.isReadLater,
      readingStatus: raw.readingStatus || (raw.isReadLater ? 'unread' : 'none'),
      createdAt: raw.createdAt || DateUtils.now(),
      updatedAt: DateUtils.now(),
      lastVisitedAt: raw.lastVisitedAt || null,
      visitCount: typeof raw.visitCount === 'number' ? raw.visitCount : 0,
      reviewDate: raw.reviewDate || null,
      color: raw.color || null,
      icon: raw.icon || null
    };
  },

  sanitizeCategory(raw) {
    if (!raw) return null;
    const name = (raw.name || '').trim();
    if (!name && !raw.id) return null;

    return {
      id: (raw.id && typeof raw.id === 'string' && raw.id.trim()) ? raw.id.trim() : generateId(),
      name: name || 'Unnamed Category',
      description: (raw.description || '').trim(),
      color: raw.color || '#2563eb',
      icon: raw.icon || 'folder',
      isFavorite: !!raw.isFavorite,
      createdAt: raw.createdAt || DateUtils.now(),
      updatedAt: DateUtils.now()
    };
  },

  sanitizeFolder(raw) {
    if (!raw) return null;
    const name = (raw.name || '').trim();
    if (!name && !raw.id) return null;

    return {
      id: (raw.id && typeof raw.id === 'string' && raw.id.trim()) ? raw.id.trim() : generateId(),
      name: name || 'Unnamed Folder',
      parentId: raw.parentId || null,
      description: (raw.description || '').trim(),
      color: raw.color || '#0284c7',
      createdAt: raw.createdAt || DateUtils.now(),
      updatedAt: DateUtils.now()
    };
  },

  sanitizeCollection(raw) {
    if (!raw) return null;
    const name = (raw.name || '').trim();
    if (!name && !raw.id) return null;

    return {
      id: (raw.id && typeof raw.id === 'string' && raw.id.trim()) ? raw.id.trim() : generateId(),
      name: name || 'Unnamed Collection',
      description: (raw.description || '').trim(),
      color: raw.color || '#8b5cf6',
      icon: raw.icon || 'layers',
      createdAt: raw.createdAt || DateUtils.now(),
      updatedAt: DateUtils.now()
    };
  },

  /**
   * Create an emergency automatic safety backup before performing full replacement
   */
  async createSafetySnapshot() {
    return await BackupManager.gatherBackupData('complete');
  },

  /**
   * Execute Restoration
   * @param {Object} backupData - Validated backup payload
   * @param {Object} options - mode: 'replace' | 'merge', duplicateAction: 'skip' | 'replace' | 'new', createSafety: boolean
   */
  async executeRestore(backupData, options = {}) {
    const { mode = 'merge', duplicateAction = 'skip', createSafety = true } = options;

    // Safety snapshot
    let safetyBackup = null;
    if (createSafety) {
      safetyBackup = await this.createSafetySnapshot();
    }

    // Sanitize incoming entities
    const sanitizedCategories = (backupData.categories || []).map(c => this.sanitizeCategory(c)).filter(Boolean);
    const sanitizedFolders = (backupData.folders || []).map(f => this.sanitizeFolder(f)).filter(Boolean);
    const sanitizedCollections = (backupData.collections || []).map(col => this.sanitizeCollection(col)).filter(Boolean);
    const sanitizedCollectionLinks = (backupData.collectionLinks || []).filter(cl => cl && cl.collectionId && cl.linkId);
    const sanitizedLinks = (backupData.links || []).map(l => this.sanitizeLink(l)).filter(Boolean);

    let restoredLinksCount = 0;
    let skippedCount = 0;

    if (mode === 'replace') {
      // Clear existing stores
      await db.clear('links');
      await db.clear('collections');
      await db.clear('collectionLinks');

      if (sanitizedCategories.length > 0) {
        await db.clear('categories');
        await db.putBulk('categories', sanitizedCategories);
      } else {
        // Re-seed defaults if categories were empty
        await CategoryManager.seedDefaults();
      }

      if (sanitizedFolders.length > 0) {
        await db.clear('folders');
        await db.putBulk('folders', sanitizedFolders);
      }

      if (sanitizedCollections.length > 0) {
        await db.putBulk('collections', sanitizedCollections);
      }
      if (sanitizedCollectionLinks.length > 0) {
        await db.putBulk('collectionLinks', sanitizedCollectionLinks);
      }
      if (sanitizedLinks.length > 0) {
        await db.putBulk('links', sanitizedLinks);
      }
      if (Array.isArray(backupData.notes) && backupData.notes.length > 0) {
        await db.clear('notes');
        await db.putBulk('notes', backupData.notes);
      }
      if (Array.isArray(backupData.noteFolders) && backupData.noteFolders.length > 0) {
        await db.clear('noteFolders');
        await db.putBulk('noteFolders', backupData.noteFolders);
      }

      restoredLinksCount = sanitizedLinks.length;
    } else {
      // Merge mode
      const existingLinks = await db.getAll('links');
      const existingCategories = await db.getAll('categories');
      const existingFolders = await db.getAll('folders');
      const existingCollections = await db.getAll('collections');
      const existingNotes = await db.getAll('notes');

      const existingCatIds = new Set(existingCategories.map(c => c.id));
      const existingFolderIds = new Set(existingFolders.map(f => f.id));
      const existingColIds = new Set(existingCollections.map(c => c.id));
      const existingNoteIds = new Set(existingNotes.map(n => n.id));
      const existingUrlMap = new Map();
      existingLinks.forEach(l => existingUrlMap.set(l.url, l));
      const existingLinkIdSet = new Set(existingLinks.map(l => l.id));

      // 1. Merge Categories
      const catsToInsert = sanitizedCategories.filter(c => !existingCatIds.has(c.id));
      if (catsToInsert.length > 0) await db.putBulk('categories', catsToInsert);

      // 2. Merge Folders
      const foldersToInsert = sanitizedFolders.filter(f => !existingFolderIds.has(f.id));
      if (foldersToInsert.length > 0) await db.putBulk('folders', foldersToInsert);

      // 3. Merge Collections
      const colsToInsert = sanitizedCollections.filter(c => !existingColIds.has(c.id));
      if (colsToInsert.length > 0) await db.putBulk('collections', colsToInsert);

      // 4. Merge Links according to duplicate policy
      const linksToPut = [];
      for (const link of sanitizedLinks) {
        const hasIdMatch = existingLinkIdSet.has(link.id);
        const hasUrlMatch = existingUrlMap.has(link.url);

        if (hasIdMatch || hasUrlMatch) {
          if (duplicateAction === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateAction === 'replace') {
            const targetId = hasIdMatch ? link.id : existingUrlMap.get(link.url).id;
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
      if (sanitizedCollectionLinks.length > 0) {
        await db.putBulk('collectionLinks', sanitizedCollectionLinks);
      }

      // Merge Notes
      if (Array.isArray(backupData.notes) && backupData.notes.length > 0) {
        const notesToPut = backupData.notes.filter(n => !existingNoteIds.has(n.id));
        if (notesToPut.length > 0) {
          await db.putBulk('notes', notesToPut);
        }
      }

      // Merge Note Folders
      if (Array.isArray(backupData.noteFolders) && backupData.noteFolders.length > 0) {
        const existingNoteFolders = await db.getAll('noteFolders');
        const existingNfIds = new Set(existingNoteFolders.map(f => f.id));
        const nfToPut = backupData.noteFolders.filter(f => !existingNfIds.has(f.id));
        if (nfToPut.length > 0) {
          await db.putBulk('noteFolders', nfToPut);
        }
      }
    }

    const outcome = {
      success: true,
      mode,
      restoredLinksCount,
      skippedCount,
      categoriesCount: sanitizedCategories.length,
      foldersCount: sanitizedFolders.length,
      collectionsCount: sanitizedCollections.length,
      safetyBackupAvailable: !!safetyBackup
    };

    // Dispatch global event so all pages and badges update immediately!
    window.dispatchEvent(new CustomEvent('ml-data-restored', { detail: outcome }));

    return outcome;
  }
};
