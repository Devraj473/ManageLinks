/**
 * ManageLinks - Export Center
 * Developer: Devraj Chauhan
 * Generates JSON, CSV, Netscape HTML Bookmarks, TXT, and ZIP exports
 */

import { db } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';
import { FileUtils } from '../../utils/file-utils.js';
import { CsvParser } from '../../utils/csv-parser.js';
import { HtmlBookmarkParser } from '../../utils/html-bookmark-parser.js';
import { BackupManager } from './backup.js';

export const ExportManager = {
  /**
   * Export all or selected links to JSON
   */
  async exportToJson(links = null) {
    const list = links || await db.getAll('links');
    const jsonStr = JSON.stringify(list, null, 2);
    const dateStamp = DateUtils.formatForFilename();
    const filename = `ManageLinks_Links_${dateStamp}.json`;
    FileUtils.downloadFile(jsonStr, filename, 'application/json');
  },

  /**
   * Export all or filtered links to CSV
   */
  async exportToCsv(links = null) {
    const list = links || await db.getAll('links');
    const categories = await db.getAll('categories');
    const folders = await db.getAll('folders');

    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const folderMap = new Map(folders.map(f => [f.id, f.name]));

    const enriched = list.map(l => ({
      ...l,
      categoryName: l.categoryId ? (catMap.get(l.categoryId) || '') : '',
      folderName: l.folderId ? (folderMap.get(l.folderId) || '') : ''
    }));

    const csvContent = CsvParser.generate(enriched);
    const dateStamp = DateUtils.formatForFilename();
    const filename = `ManageLinks_Links_${dateStamp}.csv`;
    FileUtils.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Export links to Netscape HTML Bookmarks
   */
  async exportToHtml(links = null) {
    const list = links || await db.getAll('links');
    const folders = await db.getAll('folders');
    const htmlContent = HtmlBookmarkParser.generate(list, folders);
    const dateStamp = DateUtils.formatForFilename();
    const filename = `ManageLinks_Bookmarks_${dateStamp}.html`;
    FileUtils.downloadFile(htmlContent, filename, 'text/html;charset=utf-8;');
  },

  /**
   * Export URLs to plain text (1 URL per line)
   */
  async exportToTxt(links = null) {
    const list = links || await db.getAll('links');
    const txtContent = list.map(l => l.url).filter(Boolean).join('\r\n');
    const dateStamp = DateUtils.formatForFilename();
    const filename = `ManageLinks_Urls_${dateStamp}.txt`;
    FileUtils.downloadFile(txtContent, filename, 'text/plain;charset=utf-8;');
  },

  /**
   * Export complete backup to ZIP
   */
  async exportCompleteZip(password = null) {
    return await BackupManager.createBackup({
      type: 'complete',
      format: 'zip',
      password
    });
  }
};
