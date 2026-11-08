/**
 * ManageLinks - Clickable PDF Document Generator
 * Developer: Devraj Chauhan
 * Generates vector printable documents with 100% clickable hyperlinks
 */

import { db } from '../assets/js/database.js';
import { DateUtils } from './date-utils.js';
import { UrlUtils } from './url-utils.js';

export const PdfGenerator = {
  /**
   * Generate Clickable PDF / Printable Document
   */
  async generatePdf({
    scope = 'all', // 'all', 'category-wise', 'folder-wise', 'favorites', 'pinned', 'reading', 'category-id'
    categoryId = null,
    includeDescription = true,
    includeTags = true,
    includeNotes = false,
    includeDates = true,
    documentTitle = 'ManageLinks Bookmark Catalog'
  } = {}) {
    // 1. Gather filtered links
    let links = await db.getAll('links');
    const categories = await db.getAll('categories');
    const folders = await db.getAll('folders');

    const catMap = new Map(categories.map(c => [c.id, c]));
    const folderMap = new Map(folders.map(f => [f.id, f.name]));

    // Filter by scope
    links = links.filter(l => !l.isArchived);

    if (scope === 'favorites') {
      links = links.filter(l => l.isFavorite);
    } else if (scope === 'pinned') {
      links = links.filter(l => l.isPinned);
    } else if (scope === 'reading') {
      links = links.filter(l => l.isReadLater);
    } else if (scope === 'category-id' && categoryId) {
      links = links.filter(l => l.categoryId === categoryId);
    }

    const timestamp = DateUtils.formatDateTime(new Date().toISOString());
    const totalCount = links.length;

    // 2. Build HTML body depending on scope
    let contentHtml = '';

    if (scope === 'category-wise' || scope === 'all') {
      // Group by Category
      const grouped = new Map();
      grouped.set('unassigned', { name: 'Unassigned Links', color: '#64748b', links: [] });

      categories.forEach(c => {
        grouped.set(c.id, { name: c.name, color: c.color || '#2563eb', links: [] });
      });

      links.forEach(l => {
        if (l.categoryId && grouped.has(l.categoryId)) {
          grouped.get(l.categoryId).links.push(l);
        } else {
          grouped.get('unassigned').links.push(l);
        }
      });

      grouped.forEach(group => {
        if (group.links.length === 0) return;
        contentHtml += `
          <div class="pdf-category-section">
            <div class="pdf-cat-header" style="border-left: 4px solid ${group.color};">
              <span class="pdf-cat-title">${this.escape(group.name)}</span>
              <span class="pdf-count-badge">${group.links.length} bookmarks</span>
            </div>
            <div class="pdf-items-list">
              ${group.links.map(l => this.renderLinkItem(l, { catMap, folderMap, includeDescription, includeTags, includeNotes, includeDates })).join('')}
            </div>
          </div>
        `;
      });
    } else {
      // Flat list
      contentHtml = `
        <div class="pdf-items-list">
          ${links.map(l => this.renderLinkItem(l, { catMap, folderMap, includeDescription, includeTags, includeNotes, includeDates })).join('')}
        </div>
      `;
    }

    // 3. Assemble complete print-ready HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escape(documentTitle)}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm 1.5cm 2cm 1.5cm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      margin: 0;
      padding: 1.5rem;
    }
    .pdf-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .pdf-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .pdf-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .pdf-meta {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .pdf-category-section {
      margin-bottom: 2rem;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .pdf-cat-header {
      background-color: #f8fafc;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pdf-cat-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .pdf-count-badge {
      font-size: 11px;
      background: #e2e8f0;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      color: #475569;
    }
    .pdf-items-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .pdf-item {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      background: #ffffff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .pdf-link-title {
      font-size: 14px;
      font-weight: 700;
      color: #2563eb;
      text-decoration: underline;
      display: inline-block;
      margin-bottom: 2px;
    }
    .pdf-link-url {
      font-size: 11px;
      color: #475569;
      text-decoration: underline;
      display: block;
      margin-bottom: 6px;
      word-break: break-all;
    }
    .pdf-link-desc {
      font-size: 12px;
      color: #334155;
      margin-bottom: 6px;
    }
    .pdf-link-notes {
      font-size: 11px;
      background: #f1f5f9;
      padding: 6px 10px;
      border-radius: 4px;
      color: #475569;
      font-style: italic;
      margin-bottom: 6px;
    }
    .pdf-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .pdf-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .pdf-badge-tag {
      background: #eff6ff;
      color: #2563eb;
      border-color: #bfdbfe;
    }
    .pdf-footer {
      margin-top: 2rem;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <!-- Print Control Bar (Screen only) -->
  <div class="no-print" style="background: #2563eb; color: #fff; padding: 12px 18px; margin: -1.5rem -1.5rem 1.5rem -1.5rem; display: flex; justify-content: space-between; align-items: center; border-radius: 0 0 8px 8px;">
    <div>
      <strong>Clickable PDF Document Preview</strong> &bull; ${totalCount} Bookmarks
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background: #ffffff; color: #2563eb; font-weight: bold; border: none; padding: 6px 16px; border-radius: 6px; cursor: pointer;">
        Save as PDF / Print
      </button>
      <button onclick="window.close()" style="background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); padding: 6px 14px; border-radius: 6px; cursor: pointer;">
        Close
      </button>
    </div>
  </div>

  <!-- Document Header -->
  <div class="pdf-header">
    <div>
      <h1 class="pdf-title">${this.escape(documentTitle)}</h1>
      <p class="pdf-subtitle">Personal Bookmark Catalog &bull; All links inside this PDF are clickable</p>
    </div>
    <div class="pdf-meta">
      <div><strong>Total Links:</strong> ${totalCount}</div>
      <div><strong>Generated:</strong> ${timestamp}</div>
    </div>
  </div>

  <!-- Main Content -->
  ${contentHtml}

  <!-- Document Footer -->
  <div class="pdf-footer">
    <div>ManageLinks &bull; Developed by <strong>Devraj Chauhan</strong></div>
    <div>Click on any title or URL above to open the destination website</div>
  </div>
</body>
</html>`;

    // 4. Open in print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Fallback: download as standalone clickable HTML file
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ManageLinks_Bookmarks_${DateUtils.formatForFilename()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { totalCount };
  },

  renderLinkItem(link, { catMap, folderMap, includeDescription, includeTags, includeNotes, includeDates }) {
    const category = link.categoryId ? catMap.get(link.categoryId) : null;
    const folderName = link.folderId ? folderMap.get(link.folderId) : null;

    return `
      <div class="pdf-item">
        <!-- Clickable Title with active href -->
        <a href="${this.escape(link.url)}" target="_blank" rel="noopener noreferrer" class="pdf-link-title">
          ${this.escape(link.title)}
        </a>

        <!-- Clickable Plain URL with active href -->
        <a href="${this.escape(link.url)}" target="_blank" rel="noopener noreferrer" class="pdf-link-url">
          ${this.escape(link.url)}
        </a>

        ${includeDescription && link.description ? `
          <div class="pdf-link-desc">${this.escape(link.description)}</div>
        ` : ''}

        ${includeNotes && link.notes ? `
          <div class="pdf-link-notes"><strong>Note:</strong> ${this.escape(link.notes)}</div>
        ` : ''}

        <div class="pdf-badges">
          ${category ? `
            <span class="pdf-badge" style="background-color: ${category.color}15; color: ${category.color}; border-color: ${category.color}40; font-weight: 600;">
              ${this.escape(category.name)}
            </span>
          ` : ''}

          ${folderName ? `
            <span class="pdf-badge">
              📁 ${this.escape(folderName)}
            </span>
          ` : ''}

          ${link.isFavorite ? `<span class="pdf-badge" style="color:#d97706; background:#fef3c7;">★ Favourite</span>` : ''}
          ${link.isPinned ? `<span class="pdf-badge" style="color:#2563eb; background:#eff6ff;">📌 Pinned</span>` : ''}

          ${includeTags && Array.isArray(link.tags) && link.tags.length > 0 ? 
            link.tags.map(t => `<span class="pdf-badge pdf-badge-tag">#${this.escape(t)}</span>`).join('') 
            : ''
          }

          ${includeDates && link.createdAt ? `
            <span class="pdf-badge text-muted" style="margin-left: auto;">
              Added: ${DateUtils.formatDate(link.createdAt, 'short')}
            </span>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Generate Clickable PDF for an Individual Personal Note
   */
  async generateSingleNotePdf(note, folderName = null) {
    if (!note) return;

    const createdStr = DateUtils.formatDateTime(note.createdAt);
    const updatedStr = DateUtils.formatDateTime(note.updatedAt || note.createdAt);
    const linkedBody = this.linkifyForPdf(note.content || 'No content.');

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escape(note.title)} - ManageLinks Note</title>
  <style>
    @page { size: A4; margin: 2cm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
      margin: 0;
      padding: 2rem;
    }
    .note-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 1.2rem;
      margin-bottom: 1.5rem;
    }
    .note-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .note-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 13px;
      color: #64748b;
      margin-top: 6px;
    }
    .note-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
    }
    .note-content {
      font-size: 15px;
      color: #334155;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.7;
      padding: 1rem 0;
    }
    .note-content a {
      color: #2563eb;
      text-decoration: underline;
      font-weight: 600;
    }
    .note-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
      margin-top: 2rem;
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="note-header">
    <h1 class="note-title">${this.escape(note.title)}</h1>
    <div class="note-metadata">
      ${folderName ? `<span class="note-badge">📁 ${this.escape(folderName)}</span>` : '<span class="note-badge">📁 Root Notes</span>'}
      ${note.isPinned ? `<span class="note-badge" style="background:#fef3c7; color:#b45309; border-color:#fde68a;">📌 Pinned</span>` : ''}
      <span><strong>Created:</strong> ${createdStr}</span>
      <span>&bull;</span>
      <span><strong>Updated:</strong> ${updatedStr}</span>
    </div>
    ${Array.isArray(note.tags) && note.tags.length > 0 ? `
      <div style="margin-top: 8px;">
        ${note.tags.map(t => `<span class="note-badge">#${this.escape(t)}</span>`).join(' ')}
      </div>
    ` : ''}
  </div>

  <div class="note-content">${linkedBody}</div>

  <div class="note-footer">
    <div>ManageLinks Personal Notes &bull; Developed by <strong>Devraj Chauhan</strong></div>
    <div>All web links in this document are clickable</div>
  </div>
</body>
</html>`;

    this.openPrintWindow(fullHtml, `ManageLinks_Note_${DateUtils.formatForFilename(note.title)}.html`);
  },

  /**
   * Generate Clickable PDF containing All Notes on page / folder
   */
  async generateNotesCatalogPdf({ notes = [], folderName = 'All Notes' } = {}) {
    if (!notes || notes.length === 0) return;

    const timestamp = DateUtils.formatDateTime(new Date().toISOString());

    const notesHtml = notes.map((n, idx) => {
      const createdStr = DateUtils.formatDateTime(n.createdAt);
      const updatedStr = DateUtils.formatDateTime(n.updatedAt || n.createdAt);
      const linkedBody = this.linkifyForPdf(n.content || 'No content.');

      return `
        <div class="note-block" style="margin-bottom: 2.5rem; page-break-inside: avoid; break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a;">${idx + 1}. ${this.escape(n.title)}</h3>
            ${n.isPinned ? `<span style="font-size: 11px; background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 4px;">📌 Pinned</span>` : ''}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
            <span><strong>Created:</strong> ${createdStr}</span> &bull; <span><strong>Updated:</strong> ${updatedStr}</span>
            ${Array.isArray(n.tags) && n.tags.length > 0 ? ` &bull; <span>${n.tags.map(t => '#' + this.escape(t)).join(' ')}</span>` : ''}
          </div>
          <div style="font-size: 14px; color: #334155; white-space: pre-wrap; word-break: break-word; line-height: 1.6;">${linkedBody}</div>
        </div>
      `;
    }).join('');

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>ManageLinks Personal Notes Collection - ${this.escape(folderName)}</title>
  <style>
    @page { size: A4; margin: 1.5cm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      margin: 0;
      padding: 1.5rem;
    }
    .pdf-header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 1rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .pdf-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .pdf-subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    a { color: #2563eb; text-decoration: underline; font-weight: 600; }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div>
      <h1 class="pdf-title">Personal Notes Catalog</h1>
      <p class="pdf-subtitle">Folder: <strong>${this.escape(folderName)}</strong> &bull; Total: ${notes.length} notes &bull; Clickable URLs</p>
    </div>
    <div style="text-align: right; font-size: 12px; color: #64748b;">
      <div><strong>Generated:</strong> ${timestamp}</div>
      <div>ManageLinks by Devraj Chauhan</div>
    </div>
  </div>

  ${notesHtml}

  <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; margin-top: 2rem; font-size: 12px; color: #94a3b8; display: flex; justify-content: space-between;">
    <div>ManageLinks Personal Notes &bull; Developed by <strong>Devraj Chauhan</strong></div>
    <div>All links in this PDF are clickable</div>
  </div>
</body>
</html>`;

    this.openPrintWindow(fullHtml, `ManageLinks_Notes_${DateUtils.formatForFilename(folderName)}.html`);
  },

  openPrintWindow(fullHtml, fallbackFilename) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
    } else {
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fallbackFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },

  linkifyForPdf(text) {
    if (!text) return '';
    let safe = this.escape(text);

    // Markdown links [title](url)
    safe = safe.replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Raw URLs
    const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;
    safe = safe.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    return safe;
  },

  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
