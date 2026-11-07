/**
 * ManageLinks - Clickable PDF Export Modal
 * Developer: Devraj Chauhan
 * Provides interactive options to configure and generate vector printable PDFs with active hyperlinks
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { PdfGenerator } from '../utils/pdf-generator.js';
import { Toast } from '../assets/js/notifications.js';
import { DateUtils } from '../utils/date-utils.js';

export const PdfModal = {
  modalEl: null,
  bsModal: null,

  init() {
    this.createModalDom();
  },

  createModalDom() {
    let existing = document.getElementById('pdfModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="pdfModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
          <form id="pdfExportForm" class="modal-content shadow-lg" novalidate>
            <div class="modal-header border-bottom py-3 px-4">
              <div class="d-flex align-items-center gap-2">
                <div class="bg-danger-subtle text-danger p-2 rounded">
                  ${Icons.get('file-text', { size: 20, color: '#dc2626' })}
                </div>
                <div>
                  <h5 class="modal-title fw-bold mb-0">Export Clickable PDF</h5>
                  <p class="text-secondary small mb-0">Generate a document with 100% active, clickable hyperlinks</p>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body py-3 px-4">
              <!-- Scope Selection -->
              <div class="mb-3">
                <label for="pdfScope" class="form-label fw-semibold">Links Scope</label>
                <select class="form-select" id="pdfScope">
                  <option value="all">All Saved Links (Categorized)</option>
                  <option value="favorites">★ Favourite / Starred Links Only</option>
                  <option value="pinned">📌 Pinned Links Only</option>
                  <option value="reading">📖 Read Later List Only</option>
                  <option value="category-id">📁 Specific Category...</option>
                </select>
              </div>

              <!-- Specific Category Selector (Visible when 'category-id' chosen) -->
              <div class="mb-3 d-none" id="pdfCategorySelectWrapper">
                <label for="pdfSelectedCategory" class="form-label fw-semibold">Select Category</label>
                <select class="form-select" id="pdfSelectedCategory"></select>
              </div>

              <!-- Live Counter Alert -->
              <div class="alert alert-info py-2 px-3 mb-3 d-flex align-items-center justify-content-between" style="font-size: 0.88rem;">
                <span class="d-flex align-items-center gap-2">
                  ${Icons.get('check-circle', { size: 16, color: '#2563eb' })}
                  <span id="pdfLinksCountNotice">Calculating matching links...</span>
                </span>
                <span class="badge bg-primary rounded-pill px-2 py-1" id="pdfLinksCountBadge">0 links</span>
              </div>

              <!-- Document Title -->
              <div class="mb-3">
                <label for="pdfDocTitle" class="form-label fw-semibold">Document Title</label>
                <input type="text" class="form-control" id="pdfDocTitle" value="ManageLinks Bookmark Catalog" placeholder="Catalog Title" />
              </div>

              <!-- Content Options -->
              <div class="p-3 bg-light rounded border mb-3">
                <label class="form-label fw-semibold small text-uppercase text-muted mb-2">Include in PDF Document</label>
                <div class="row g-2">
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="pdfIncDesc" checked>
                      <label class="form-check-label small" for="pdfIncDesc">Descriptions</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="pdfIncTags" checked>
                      <label class="form-check-label small" for="pdfIncTags">Tags (#tag)</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="pdfIncNotes">
                      <label class="form-check-label small" for="pdfIncNotes">Personal Notes</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="pdfIncDates" checked>
                      <label class="form-check-label small" for="pdfIncDates">Date Added</label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Clickable Explanation Note -->
              <div class="d-flex align-items-start gap-2 p-2 rounded bg-body-tertiary border" style="font-size: 0.82rem; color: var(--ml-text-secondary);">
                <div class="text-primary mt-1">${Icons.get('info', { size: 16 })}</div>
                <div>
                  <strong>How clickable links work:</strong> When clicking <em>Print / Save as PDF</em>, choose <strong>Save as PDF</strong> as the printer destination in your browser. All website URLs and titles will remain active clickable hyperlinks in Adobe Reader, Chrome, Edge, and mobile PDF viewers.
                </div>
              </div>
            </div>

            <div class="modal-footer py-2 px-4 border-top bg-light d-flex justify-content-between">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
              <div class="d-flex gap-2">
                <button type="button" id="btn-pdf-download-html" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
                  ${Icons.get('download', { size: 14 })}
                  <span>Download HTML</span>
                </button>
                <button type="submit" id="btn-pdf-generate-print" class="btn-ml-primary btn-sm d-inline-flex align-items-center gap-1">
                  ${Icons.get('printer', { size: 14, color: '#fff' })}
                  <span>Save as PDF</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(div.firstElementChild);
    this.modalEl = document.getElementById('pdfModal');
    this.bsModal = new bootstrap.Modal(this.modalEl);

    this.bindEvents();
  },

  bindEvents() {
    const scopeSelect = document.getElementById('pdfScope');
    const catSelect = document.getElementById('pdfSelectedCategory');
    const catWrapper = document.getElementById('pdfCategorySelectWrapper');
    const form = document.getElementById('pdfExportForm');
    const downloadHtmlBtn = document.getElementById('btn-pdf-download-html');

    scopeSelect?.addEventListener('change', () => {
      if (scopeSelect.value === 'category-id') {
        catWrapper.classList.remove('d-none');
      } else {
        catWrapper.classList.add('d-none');
      }
      this.updateCountBadge();
    });

    catSelect?.addEventListener('change', () => {
      this.updateCountBadge();
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.executeExport(false);
    });

    downloadHtmlBtn?.addEventListener('click', async () => {
      await this.executeExport(true);
    });
  },

  async open(options = {}) {
    if (!this.bsModal) this.init();

    // Populate categories
    const categories = await db.getAll('categories');
    const catSelect = document.getElementById('pdfSelectedCategory');
    catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${this.escape(c.name)}</option>`).join('');

    // Preselect options if provided
    const scopeSelect = document.getElementById('pdfScope');
    const catWrapper = document.getElementById('pdfCategorySelectWrapper');

    if (options.scope) {
      scopeSelect.value = options.scope;
      if (options.scope === 'category-id' && options.categoryId) {
        catSelect.value = options.categoryId;
        catWrapper.classList.remove('d-none');
      } else {
        catWrapper.classList.add('d-none');
      }
    } else {
      scopeSelect.value = 'all';
      catWrapper.classList.add('d-none');
    }

    if (options.title) {
      document.getElementById('pdfDocTitle').value = options.title;
    } else {
      document.getElementById('pdfDocTitle').value = 'ManageLinks Bookmark Catalog';
    }

    await this.updateCountBadge();
    this.bsModal.show();
  },

  async updateCountBadge() {
    const scope = document.getElementById('pdfScope').value;
    const catId = document.getElementById('pdfSelectedCategory').value;
    let links = await db.getAll('links');
    links = links.filter(l => !l.isArchived);

    if (scope === 'favorites') {
      links = links.filter(l => l.isFavorite);
    } else if (scope === 'pinned') {
      links = links.filter(l => l.isPinned);
    } else if (scope === 'reading') {
      links = links.filter(l => l.isReadLater);
    } else if (scope === 'category-id' && catId) {
      links = links.filter(l => l.categoryId === catId);
    }

    const count = links.length;
    document.getElementById('pdfLinksCountBadge').textContent = `${count} ${count === 1 ? 'link' : 'links'}`;
    document.getElementById('pdfLinksCountNotice').textContent = `Ready to generate clickable PDF for ${count} links.`;
  },

  async executeExport(downloadHtmlOnly = false) {
    const scope = document.getElementById('pdfScope').value;
    const categoryId = scope === 'category-id' ? document.getElementById('pdfSelectedCategory').value : null;
    const includeDescription = document.getElementById('pdfIncDesc').checked;
    const includeTags = document.getElementById('pdfIncTags').checked;
    const includeNotes = document.getElementById('pdfIncNotes').checked;
    const includeDates = document.getElementById('pdfIncDates').checked;
    const documentTitle = document.getElementById('pdfDocTitle').value.trim() || 'ManageLinks Bookmark Catalog';

    try {
      this.bsModal.hide();
      Toast.info('Preparing document with clickable links...');

      if (downloadHtmlOnly) {
        // Trigger download of standalone HTML
        let links = await db.getAll('links');
        const categories = await db.getAll('categories');
        const folders = await db.getAll('folders');

        const catMap = new Map(categories.map(c => [c.id, c]));
        const folderMap = new Map(folders.map(f => [f.id, f.name]));

        links = links.filter(l => !l.isArchived);
        if (scope === 'favorites') links = links.filter(l => l.isFavorite);
        else if (scope === 'pinned') links = links.filter(l => l.isPinned);
        else if (scope === 'reading') links = links.filter(l => l.isReadLater);
        else if (scope === 'category-id' && categoryId) links = links.filter(l => l.categoryId === categoryId);

        let contentHtml = '';
        if (scope === 'category-wise' || scope === 'all') {
          const grouped = new Map();
          grouped.set('unassigned', { name: 'Unassigned Links', color: '#64748b', links: [] });
          categories.forEach(c => grouped.set(c.id, { name: c.name, color: c.color || '#2563eb', links: [] }));
          links.forEach(l => {
            if (l.categoryId && grouped.has(l.categoryId)) grouped.get(l.categoryId).links.push(l);
            else grouped.get('unassigned').links.push(l);
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
                  ${group.links.map(l => PdfGenerator.renderLinkItem(l, { catMap, folderMap, includeDescription, includeTags, includeNotes, includeDates })).join('')}
                </div>
              </div>
            `;
          });
        } else {
          contentHtml = `
            <div class="pdf-items-list">
              ${links.map(l => PdfGenerator.renderLinkItem(l, { catMap, folderMap, includeDescription, includeTags, includeNotes, includeDates })).join('')}
            </div>
          `;
        }

        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${this.escape(documentTitle)}</title>
  <style>
    @page { size: A4; margin: 1.5cm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b; background: #ffffff; line-height: 1.5; margin: 0; padding: 2rem; }
    .pdf-header { border-bottom: 2px solid #2563eb; padding-bottom: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; }
    .pdf-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
    .pdf-subtitle { font-size: 13px; color: #64748b; margin: 0; }
    .pdf-meta { text-align: right; font-size: 12px; color: #64748b; }
    .pdf-category-section { margin-bottom: 2rem; page-break-inside: avoid; }
    .pdf-cat-header { background-color: #f8fafc; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .pdf-cat-title { font-size: 15px; font-weight: 700; color: #0f172a; }
    .pdf-count-badge { font-size: 11px; background: #e2e8f0; padding: 2px 8px; border-radius: 12px; font-weight: 600; color: #475569; }
    .pdf-items-list { display: flex; flex-direction: column; gap: 10px; }
    .pdf-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; background: #ffffff; page-break-inside: avoid; }
    .pdf-link-title { font-size: 14px; font-weight: 700; color: #2563eb; text-decoration: underline; display: inline-block; margin-bottom: 2px; }
    .pdf-link-url { font-size: 11px; color: #475569; text-decoration: underline; display: block; margin-bottom: 6px; word-break: break-all; }
    .pdf-link-desc { font-size: 12px; color: #334155; margin-bottom: 6px; }
    .pdf-link-notes { font-size: 11px; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; color: #475569; font-style: italic; margin-bottom: 6px; }
    .pdf-badges { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .pdf-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
    .pdf-badge-tag { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
    .pdf-footer { margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div>
      <h1 class="pdf-title">${this.escape(documentTitle)}</h1>
      <p class="pdf-subtitle">Personal Bookmark Catalog &bull; All links inside are clickable</p>
    </div>
    <div class="pdf-meta">
      <div><strong>Total Links:</strong> ${links.length}</div>
      <div><strong>Exported:</strong> ${DateUtils.formatDateTime(new Date().toISOString())}</div>
    </div>
  </div>
  ${contentHtml}
  <div class="pdf-footer">
    <div>ManageLinks &bull; Developed by <strong>Devraj Chauhan</strong></div>
    <div>Click any link or URL to open the website directly.</div>
  </div>
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ManageLinks_Clickable_${DateUtils.formatForFilename()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Toast.success('Clickable HTML catalog downloaded successfully!');
      } else {
        const res = await PdfGenerator.generatePdf({
          scope,
          categoryId,
          includeDescription,
          includeTags,
          includeNotes,
          includeDates,
          documentTitle
        });
        Toast.success(`Clickable PDF generated for ${res.totalCount} links! Select "Save as PDF" to save.`);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      Toast.error(`Failed to generate PDF: ${err.message}`);
    }
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
