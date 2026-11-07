/**
 * ManageLinks - Import & Export Test Suite
 * Developer: Devraj Chauhan
 */

import { CsvParser } from '../utils/csv-parser.js';
import { HtmlBookmarkParser } from '../utils/html-bookmark-parser.js';
import { ImportManager } from '../assets/js/import.js';

export async function runImportExportTests(assert) {
  console.log('Running Import & Export tests...');

  // 1. CSV Parser & Generator
  const rawLinks = [
    {
      title: 'GitHub, "The Code Platform"',
      url: 'https://github.com',
      description: 'Where code lives,\nand commits happen',
      categoryName: 'Development',
      tags: ['git', 'code'],
      isFavorite: true
    },
    {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      description: 'Web standards',
      categoryName: 'Learning',
      tags: ['docs'],
      isFavorite: false
    }
  ];

  const generatedCsv = CsvParser.generate(rawLinks);
  assert(generatedCsv.includes('GitHub, ""The Code Platform""'), 'CSV escaping handles embedded quotes and commas');

  const parsedCsvRows = CsvParser.parse(generatedCsv);
  assert(parsedCsvRows.length === 2, 'CSV parsed back exact row count');
  assert(parsedCsvRows[0].url === 'https://github.com', 'CSV URL parsed accurately');

  // 2. Netscape HTML Bookmarks Parser & Generator
  const testFolders = [
    { id: 'f1', name: 'Work Folders', parentId: null }
  ];
  const testFolderLinks = [
    { title: 'Project Jira', url: 'https://jira.company.com', folderId: 'f1', createdAt: new Date().toISOString() },
    { title: 'Root Bookmarks', url: 'https://example.com', folderId: null, createdAt: new Date().toISOString() }
  ];

  const generatedHtml = HtmlBookmarkParser.generate(testFolderLinks, testFolders);
  assert(generatedHtml.includes('<!DOCTYPE NETSCAPE-Bookmark-file-1>'), 'Netscape DOCTYPE header present');
  assert(generatedHtml.includes('<H3'), 'Folder H3 tags generated');
  assert(generatedHtml.includes('HREF="https://jira.company.com"'), 'Anchor tag with href generated');

  const parsedHtmlBookmarks = HtmlBookmarkParser.parse(generatedHtml);
  assert(parsedHtmlBookmarks.length >= 2, 'Parsed back all bookmarks from HTML export');
  const jira = parsedHtmlBookmarks.find(b => b.url === 'https://jira.company.com');
  assert(jira !== undefined, 'Found specific bookmark in parsed HTML');
  assert(jira.folderPath.includes('Work Folders'), 'Folder path preserved in Netscape HTML parsing');

  // 3. Plain TXT Parser
  const sampleTxt = `
    # Personal Quick URLs
    https://news.ycombinator.com
    https://lobste.rs

    // Another comment
    https://dev.to
  `;
  const txtItems = ImportManager.parseTxt(sampleTxt);
  assert(txtItems.length === 3, 'TXT import extracts exactly 3 URLs, ignoring comments and whitespace');
}
