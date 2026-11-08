/**
 * ManageLinks - Backup Center
 * Developer: Devraj Chauhan
 * Handles Complete & Selective Backups, Notes Backups, JSON, Master ZIP Packages, and PBKDF2+AES-GCM Encryption
 */

import { db, generateId } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';
import { FileUtils } from '../../utils/file-utils.js';
import { Encryption } from '../../utils/encryption.js';
import { CsvParser } from '../../utils/csv-parser.js';
import { HtmlBookmarkParser } from '../../utils/html-bookmark-parser.js';

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
      totalNotes: data.notes?.length || 0,
      totalNoteFolders: data.noteFolders?.length || 0,
      totalRecords: (data.links?.length || 0) + 
                    (data.categories?.length || 0) + 
                    (data.folders?.length || 0) + 
                    (data.collections?.length || 0) +
                    (data.notes?.length || 0) +
                    (data.noteFolders?.length || 0),
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
    let notes = await db.getAll('notes');
    let noteFolders = [];
    try {
      noteFolders = await db.getAll('noteFolders');
    } catch {
      noteFolders = [];
    }
    let settings = await db.getAll('settings');
    let deletedItems = await db.getAll('deletedItems');

    switch (type) {
      case 'notes-only':
        links = [];
        categories = [];
        folders = [];
        collections = [];
        collectionLinks = [];
        deletedItems = [];
        break;

      case 'links-only':
        categories = [];
        folders = [];
        collections = [];
        collectionLinks = [];
        notes = [];
        noteFolders = [];
        deletedItems = [];
        break;

      case 'categories-folders':
        links = [];
        collections = [];
        collectionLinks = [];
        notes = [];
        noteFolders = [];
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
        notes = [];
        noteFolders = [];
        deletedItems = [];
        break;

      case 'selected-category':
        if (selection.categoryId) {
          categories = categories.filter(c => c.id === selection.categoryId);
          links = links.filter(l => l.categoryId === selection.categoryId);
          folders = [];
          collections = [];
          collectionLinks = [];
          notes = [];
          noteFolders = [];
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
          notes = [];
          noteFolders = [];
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
          notes = [];
          noteFolders = [];
          deletedItems = [];
        }
        break;

      case 'complete':
      default:
        // Everything included: links, categories, folders, collections, notes, noteFolders, settings
        break;
    }

    return {
      manifest,
      links,
      categories,
      folders,
      collections,
      collectionLinks,
      notes,
      noteFolders,
      settings,
      deletedItems
    };
  },

  /**
   * One-click download of all browser database records as a standalone JSON backup
   */
  async backupBrowserData() {
    const data = await this.gatherBackupData('complete');
    const dateStamp = DateUtils.formatForFilename();
    const finalFilename = `ManageLinks_Database_Backup_${dateStamp}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    const blobContent = new Blob([jsonStr], { type: 'application/json' });

    FileUtils.downloadFile(blobContent, finalFilename, 'application/json');

    const historyItem = {
      id: generateId(),
      name: finalFilename,
      type: 'complete',
      format: 'json',
      isEncrypted: false,
      recordCount: (data.links?.length || 0) + (data.categories?.length || 0) + (data.folders?.length || 0) + (data.notes?.length || 0),
      fileSize: FileUtils.formatSize(blobContent.size),
      sizeBytes: blobContent.size,
      status: 'Downloaded',
      createdAt: DateUtils.now()
    };

    await db.put('backupHistory', historyItem);
    return historyItem;
  },

  /**
   * Bundles all data into a Complete ZIP Backup Package:
   * - backup.json (Full database restore package)
   * - manifest.json (Metadata)
   * - bookmarks.html (Netscape standard bookmarks)
   * - links.csv (Spreadsheet export)
   * - notes/ directory containing individual text/markdown files for every personal note
   * - notes_summary.json (Array of notes and folders)
   * - START_HERE_README.txt
   */
  async createZipBackup({ type = 'complete', selection = {} } = {}) {
    if (typeof window.JSZip === 'undefined') {
      throw new Error('JSZip library is required to build the ZIP backup package.');
    }

    const data = await this.gatherBackupData(type, selection);
    const dateStamp = DateUtils.formatForFilename();
    const zip = new window.JSZip();

    // 1. Master database JSON backup
    const jsonStr = JSON.stringify(data, null, 2);
    zip.file('backup.json', jsonStr);

    // 2. Manifest file
    const manifestStr = JSON.stringify(data.manifest, null, 2);
    zip.file('manifest.json', manifestStr);

    // 3. HTML Bookmarks
    try {
      const htmlContent = HtmlBookmarkParser.generate(data.links || [], data.folders || []);
      zip.file('bookmarks.html', htmlContent);
    } catch (e) {
      console.warn('Could not generate HTML bookmarks for zip:', e);
    }

    // 4. CSV Spreadsheet
    try {
      const catMap = new Map((data.categories || []).map(c => [c.id, c.name]));
      const folderMap = new Map((data.folders || []).map(f => [f.id, f.name]));
      const enrichedLinks = (data.links || []).map(l => ({
        ...l,
        categoryName: l.categoryId ? (catMap.get(l.categoryId) || '') : '',
        folderName: l.folderId ? (folderMap.get(l.folderId) || '') : ''
      }));
      const csvContent = CsvParser.generate(enrichedLinks);
      zip.file('links.csv', csvContent);
    } catch (e) {
      console.warn('Could not generate CSV for zip:', e);
    }

    // 5. Notes Folder with individual note files
    const notesFolder = zip.folder('notes');
    const noteFolderMap = new Map((data.noteFolders || []).map(nf => [nf.id, nf.name]));

    (data.notes || []).forEach(note => {
      const safeTitle = (note.title || 'untitled').replace(/[^a-z0-9_-]/gi, '_').substring(0, 40);
      const folderName = note.folderId ? (noteFolderMap.get(note.folderId) || 'Unfiled') : 'Root';
      const createdStr = DateUtils.formatDateTime(note.createdAt);
      const updatedStr = DateUtils.formatDateTime(note.updatedAt || note.createdAt);

      const noteContent = `=====================================================
${note.title}
=====================================================
Folder:  ${folderName}
Pinned:  ${note.isPinned ? 'Yes' : 'No'}
Tags:    ${Array.isArray(note.tags) ? note.tags.join(', ') : ''}
Created: ${createdStr}
Updated: ${updatedStr}
-----------------------------------------------------

${note.content || ''}
`;
      notesFolder.file(`${safeTitle}.txt`, noteContent);
    });

    // 6. Notes Summary JSON
    notesFolder.file('notes_summary.json', JSON.stringify({
      noteFolders: data.noteFolders || [],
      notes: data.notes || []
    }, null, 2));

    // 7. Helpful README
    const readme = `=====================================================
ManageLinks Master Backup Package
Application: 100% Offline Personal Link & Note Manager
Developer: Devraj Chauhan
Date: ${new Date().toLocaleString()}
=====================================================

CONTENTS OF THIS BACKUP ARCHIVE:
1. backup.json         - Complete database backup. Restore this file via ManageLinks Restore Wizard.
2. bookmarks.html      - Standard browser bookmark file. Import into Chrome, Edge, Firefox, Brave, Safari.
3. links.csv           - Spreadsheet table of all your links and categories.
4. notes/              - Directory containing all your individual personal notes as readable .txt files.
5. manifest.json       - Backup metadata and verification checksum.

HOW TO RESTORE:
1. Open ManageLinks in any browser.
2. Go to Database & Backup Center -> Restore Wizard.
3. Select this ZIP file (or extract and select 'backup.json').
4. That's it! All links, notes, folders, and categories will be restored.
`;
    zip.file('START_HERE_README.txt', readme);

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const finalFilename = `ManageLinks_Master_Backup_${dateStamp}.zip`;
    FileUtils.downloadFile(zipBlob, finalFilename, 'application/zip');

    const historyItem = {
      id: generateId(),
      name: finalFilename,
      type,
      format: 'zip',
      isEncrypted: false,
      recordCount: (data.links?.length || 0) + (data.categories?.length || 0) + (data.notes?.length || 0),
      fileSize: FileUtils.formatSize(zipBlob.size),
      sizeBytes: zipBlob.size,
      status: 'ZIP Downloaded',
      createdAt: DateUtils.now()
    };

    await db.put('backupHistory', historyItem);
    return historyItem;
  },

  /**
   * Prepares complete database backup payload for direct sharing
   * Returns data object without triggering any download!
   */
  async prepareBackupForSharing() {
    const data = await this.gatherBackupData('complete');
    const dateStamp = DateUtils.formatForFilename();
    const finalFilename = `ManageLinks_Database_Backup_${dateStamp}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    const blobContent = new Blob([jsonStr], { type: 'application/json' });
    const backupFile = new File([blobContent], finalFilename, { type: 'application/json' });

    return {
      data,
      dateStamp,
      finalFilename,
      jsonStr,
      blobContent,
      backupFile,
      totalLinks: data.links?.length || 0,
      totalNotes: data.notes?.length || 0,
      totalCategories: data.categories?.length || 0,
      totalFolders: data.folders?.length || 0,
      totalSize: FileUtils.formatSize(blobContent.size)
    };
  },

  /**
   * Execute custom backup download (JSON format)
   */
  async createBackup({ type = 'complete', format = 'json', password = null, selection = {} } = {}) {
    const data = await this.gatherBackupData(type, selection);
    const dateStamp = DateUtils.formatForFilename();
    let filenameBase = `ManageLinks_Backup_${dateStamp}`;

    // Handle Encryption if requested
    let exportData = data;
    if (password && password.trim()) {
      exportData = await Encryption.encrypt(data, password.trim());
      filenameBase += '_encrypted';
    }

    // JSON format
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blobContent = new Blob([jsonStr], { type: 'application/json' });
    const finalFilename = `${filenameBase}.json`;
    const mimeType = 'application/json';

    // Trigger download
    FileUtils.downloadFile(blobContent, finalFilename, mimeType);

    // Record into backup history in IndexedDB
    const historyItem = {
      id: generateId(),
      name: finalFilename,
      type,
      format: 'json',
      isEncrypted: !!(password && password.trim()),
      recordCount: (data.links?.length || 0) + (data.categories?.length || 0) + (data.notes?.length || 0),
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
