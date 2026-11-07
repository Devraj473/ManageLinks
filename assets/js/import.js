/**
 * ManageLinks - Import Center
 * Developer: Devraj Chauhan
 * Handles JSON, CSV, HTML Bookmarks, and TXT imports with validation & preview
 */

import { db, generateId } from './database.js';
import { Validators } from '../utils/validators.js';
import { UrlUtils } from '../utils/url-utils.js';
import { DateUtils } from '../utils/date-utils.js';
import { FileUtils } from '../utils/file-utils.js';
import { CsvParser } from '../utils/csv-parser.js';
import { HtmlBookmarkParser } from '../utils/html-bookmark-parser.js';
import { LinkManager } from './link-manager.js';
import { FolderManager } from './folder-manager.js';

export const ImportManager = {
  /**
   * Parse uploaded file according to format
   */
  async parseFile(file, format = 'auto') {
    if (!file) throw new Error('No file provided');

    const text = await FileUtils.readFileAsText(file);
    const filename = file.name.toLowerCase();

    // Auto-detect format if not explicitly given
    if (format === 'auto') {
      if (filename.endsWith('.json')) format = 'json';
      else if (filename.endsWith('.csv')) format = 'csv';
      else if (filename.endsWith('.html') || filename.endsWith('.htm')) format = 'html';
      else if (filename.endsWith('.txt')) format = 'txt';
      else {
        // Inspect content
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) format = 'json';
        else if (text.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>') || text.includes('<H3>') || text.includes('<A HREF=')) format = 'html';
        else if (text.includes(',') && text.split('\n')[0].includes(',')) format = 'csv';
        else format = 'txt';
      }
    }

    let parsedItems = [];
    switch (format) {
      case 'json':
        parsedItems = this.parseJson(text);
        break;
      case 'csv':
        parsedItems = this.parseCsv(text);
        break;
      case 'html':
        parsedItems = this.parseHtml(text);
        break;
      case 'txt':
        parsedItems = this.parseTxt(text);
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }

    // Run preview analysis: valid, invalid, duplicates, missing titles
    return await this.analyzeImportItems(parsedItems, format);
  },

  parseJson(text) {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) return data;
      if (data.links && Array.isArray(data.links)) return data.links;
      throw new Error('JSON does not contain a list of links');
    } catch (e) {
      throw new Error(`JSON parsing failed: ${e.message}`);
    }
  },

  parseCsv(text) {
    const rows = CsvParser.parse(text);
    return rows.map(r => ({
      title: r.title || r.name || '',
      url: r.url || r.link || r.website || '',
      description: r.description || r.desc || '',
      category: r.category || '',
      folder: r.folder || '',
      tags: r.tags ? r.tags.split(';').map(t => t.trim()).filter(Boolean) : [],
      notes: r.notes || '',
      isFavorite: r.favorite === 'true' || r.favorite === '1' || r.isFavorite === 'true',
      isPinned: r.pinned === 'true' || r.isPinned === 'true'
    }));
  },

  parseHtml(text) {
    return HtmlBookmarkParser.parse(text);
  },

  parseTxt(text) {
    const lines = text.split(/\r?\n/);
    const items = [];
    for (const line of lines) {
      const trimmed = line.trim();
      // Ignore empty lines and comments
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
      items.push({
        url: trimmed,
        title: ''
      });
    }
    return items;
  },

  /**
   * Analyze raw parsed items against database
   */
  async analyzeImportItems(items, format) {
    const existingLinks = await db.getAll('links');
    const existingCategories = await db.getAll('categories');
    const existingFolders = await db.getAll('folders');

    const catNameMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));
    const folderNameMap = new Map(existingFolders.map(f => [f.name.toLowerCase(), f.id]));
    const existingUrlMap = new Map();
    existingLinks.forEach(l => existingUrlMap.set(UrlUtils.normalizeUrl(l.url), l));

    const validItems = [];
    const invalidItems = [];
    let duplicatesCount = 0;
    let missingTitlesCount = 0;

    for (let index = 0; index < items.length; index++) {
      const raw = items[index];
      let url = (raw.url || '').trim();
      if (!url) {
        invalidItems.push({ item: raw, index, error: 'Empty URL' });
        continue;
      }

      url = Validators.ensureProtocol(url);
      if (!Validators.isValidUrl(url)) {
        invalidItems.push({ item: raw, index, error: 'Invalid URL format' });
        continue;
      }

      const normalizedUrl = UrlUtils.normalizeUrl(url);
      const isDuplicate = existingUrlMap.has(normalizedUrl);
      if (isDuplicate) duplicatesCount++;

      let title = (raw.title || '').trim();
      let wasTitleGenerated = false;
      if (!title) {
        title = UrlUtils.generateTitleFromUrl(url);
        wasTitleGenerated = true;
        missingTitlesCount++;
      }

      // Check category match or suggestion
      let categoryId = null;
      if (raw.category && catNameMap.has(raw.category.toLowerCase())) {
        categoryId = catNameMap.get(raw.category.toLowerCase());
      } else if (raw.categoryId) {
        categoryId = raw.categoryId;
      }

      // Check folder match
      let folderId = null;
      if (raw.folder && folderNameMap.has(raw.folder.toLowerCase())) {
        folderId = folderNameMap.get(raw.folder.toLowerCase());
      } else if (raw.folderId) {
        folderId = raw.folderId;
      }

      // Tags
      let tags = [];
      if (Array.isArray(raw.tags)) {
        tags = raw.tags;
      } else if (typeof raw.tags === 'string' && raw.tags) {
        tags = raw.tags.split(/[;,]/).map(t => t.trim()).filter(Boolean);
      }

      validItems.push({
        index,
        title,
        url: normalizedUrl,
        rawUrl: raw.url,
        description: raw.description || '',
        notes: raw.notes || '',
        categoryId,
        folderId,
        folderPath: raw.folderPath || [],
        tags,
        isFavorite: !!raw.isFavorite,
        isPinned: !!raw.isPinned,
        isDuplicate,
        wasTitleGenerated
      });
    }

    return {
      format,
      totalCount: items.length,
      validCount: validItems.length,
      invalidCount: invalidItems.length,
      duplicatesCount,
      missingTitlesCount,
      validItems,
      invalidItems
    };
  },

  /**
   * Execute Import of approved valid items
   */
  async executeImport(validItems, { duplicateHandling = 'skip', autoCreateFolders = true, defaultCategoryId = null } = {}) {
    const existingLinks = await db.getAll('links');
    const existingUrlMap = new Map();
    existingLinks.forEach(l => existingUrlMap.set(UrlUtils.normalizeUrl(l.url), l));

    // Handle nested folder creation if HTML bookmarks have folderPath
    const folderCache = new Map(); // 'ParentPath/FolderName' -> folderId
    const existingFolders = await db.getAll('folders');
    existingFolders.forEach(f => folderCache.set(f.name.toLowerCase(), f.id));

    let importedCount = 0;
    let skippedCount = 0;
    const linksToInsert = [];

    for (const item of validItems) {
      // Duplicate handling
      if (item.isDuplicate && existingUrlMap.has(item.url)) {
        if (duplicateHandling === 'skip') {
          skippedCount++;
          continue;
        } else if (duplicateHandling === 'replace') {
          const target = existingUrlMap.get(item.url);
          target.title = item.title;
          target.description = item.description || target.description;
          target.updatedAt = DateUtils.now();
          linksToInsert.push(target);
          importedCount++;
          continue;
        }
      }

      // Resolve or create folder from folderPath
      let targetFolderId = item.folderId;
      if (!targetFolderId && autoCreateFolders && item.folderPath && item.folderPath.length > 0) {
        let parentId = null;
        for (const folderName of item.folderPath) {
          const key = (parentId ? `${parentId}_` : '') + folderName.toLowerCase();
          if (folderCache.has(key)) {
            parentId = folderCache.get(key);
          } else {
            const newFolder = await FolderManager.create({
              name: folderName,
              parentId
            });
            folderCache.set(key, newFolder.id);
            parentId = newFolder.id;
          }
        }
        targetFolderId = parentId;
      }

      const record = {
        id: generateId(),
        title: item.title,
        url: item.url,
        description: item.description || '',
        categoryId: item.categoryId || defaultCategoryId || null,
        folderId: targetFolderId || null,
        tags: item.tags || [],
        notes: item.notes || '',
        isFavorite: item.isFavorite || false,
        isPinned: item.isPinned || false,
        isArchived: false,
        isReadLater: false,
        readingStatus: 'none',
        createdAt: item.createdAt || DateUtils.now(),
        updatedAt: DateUtils.now(),
        lastVisitedAt: null,
        visitCount: 0
      };

      linksToInsert.push(record);
      importedCount++;
    }

    if (linksToInsert.length > 0) {
      await db.putBulk('links', linksToInsert);
    }

    return {
      success: true,
      importedCount,
      skippedCount
    };
  }
};
