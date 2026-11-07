/**
 * ManageLinks - Add / Edit Link Modal
 * Developer: Devraj Chauhan
 * Features Duplicate Detection, Smart Suggestions, and Complete Form Fields
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { Validators } from '../utils/validators.js';
import { UrlUtils } from '../utils/url-utils.js';
import { LinkManager } from '../assets/js/link-manager.js';
import { CollectionManager } from '../assets/js/collection-manager.js';
import { Security } from '../assets/js/security.js';

export const LinkModal = {
  modalEl: null,
  bsModal: null,
  currentLinkId: null,
  duplicateCheckTimer: null,

  init() {
    this.createModalDom();
  },

  createModalDom() {
    let existing = document.getElementById('linkModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="linkModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <form id="linkForm" class="modal-content shadow-lg" novalidate>
            <div class="modal-header border-bottom py-3 px-4">
              <h5 class="modal-title fw-bold" id="linkModalTitle">Add New Link</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <div class="modal-body py-3 px-4">
                <!-- Duplicate URL Alert Banner -->
                <div id="duplicate-warning-banner" class="alert alert-warning d-none d-flex align-items-center justify-content-between py-2 px-3 mb-3">
                  <div class="d-flex align-items-center gap-2">
                    ${Icons.get('alert-triangle', { size: 18, color: '#b45309' })}
                    <span id="duplicate-warning-text" style="font-size: 0.88rem;">This URL is already saved in your links.</span>
                  </div>
                  <button type="button" id="btn-open-duplicate" class="btn btn-sm btn-outline-dark" style="font-size:0.75rem;">View Existing</button>
                </div>

                <!-- URL Field -->
                <div class="mb-3">
                  <label for="linkUrl" class="form-label fw-semibold">Website URL <span class="text-danger">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text">${Icons.get('link', { size: 16 })}</span>
                    <input type="url" class="form-control" id="linkUrl" placeholder="https://example.com/page" required />
                  </div>
                  <div class="invalid-feedback" id="linkUrlFeedback">Please enter a valid web URL.</div>
                </div>

                <!-- Title Field -->
                <div class="mb-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <label for="linkTitle" class="form-label fw-semibold">Link Title <span class="text-danger">*</span></label>
                    <button type="button" id="btn-auto-title" class="btn btn-link btn-sm text-decoration-none p-0" style="font-size: 0.78rem;">
                      ${Icons.get('refresh-cw', { size: 12 })} Generate from URL
                    </button>
                  </div>
                  <input type="text" class="form-control" id="linkTitle" placeholder="Page or Resource Title" required />
                  <div class="invalid-feedback">Title is required.</div>
                </div>

                <!-- Smart Category Suggestion Badge -->
                <div id="category-suggestion-pill" class="mb-2 d-none">
                  <span class="text-muted small me-2">Suggested Category:</span>
                  <button type="button" id="btn-apply-suggestion" class="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle py-1 px-2 text-decoration-none" style="cursor: pointer;"></button>
                </div>

                <!-- Category & Folder Selection -->
                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label for="linkCategory" class="form-label fw-semibold">Category</label>
                    <select class="form-select" id="linkCategory">
                      <option value="">Unassigned (Inbox)</option>
                    </select>
                  </div>

                  <div class="col-md-6">
                    <label for="linkFolder" class="form-label fw-semibold">Folder</label>
                    <select class="form-select" id="linkFolder">
                      <option value="">None (Root)</option>
                    </select>
                  </div>
                </div>

                <!-- Collections Selection -->
                <div class="mb-3">
                  <label class="form-label fw-semibold">Collections</label>
                  <div id="linkCollectionsContainer" class="d-flex flex-wrap gap-2 p-2 border rounded" style="max-height: 110px; overflow-y: auto;">
                    <span class="text-muted small">Loading collections...</span>
                  </div>
                </div>

                <!-- Description Field -->
                <div class="mb-3">
                  <label for="linkDescription" class="form-label fw-semibold">Description</label>
                  <textarea class="form-control" id="linkDescription" rows="2" placeholder="Brief summary of this link..."></textarea>
                </div>

                <!-- Tags Input -->
                <div class="mb-3">
                  <label for="linkTags" class="form-label fw-semibold">Tags (comma-separated)</label>
                  <div class="input-group">
                    <span class="input-group-text">${Icons.get('tag', { size: 16 })}</span>
                    <input type="text" class="form-control" id="linkTags" placeholder="tools, javascript, tutorial" />
                  </div>
                </div>

                <!-- Notes & Reminder Accordion -->
                <div class="accordion mb-3" id="linkExtraAccordion">
                  <div class="accordion-item">
                    <h2 class="accordion-header">
                      <button class="accordion-button collapsed py-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseNotes">
                        ${Icons.get('file-text', { size: 16, className: 'me-2' })} Notes & Review Reminder
                      </button>
                    </h2>
                    <div id="collapseNotes" class="accordion-collapse collapse" data-bs-parent="#linkExtraAccordion">
                      <div class="accordion-body">
                        <div class="mb-3">
                          <label for="linkNotes" class="form-label fw-semibold">Personal Notes</label>
                          <textarea class="form-control" id="linkNotes" rows="3" placeholder="Add rich personal notes, commands, instructions..."></textarea>
                        </div>
                        <div class="row g-2">
                          <div class="col-md-6">
                            <label for="linkReviewDate" class="form-label fw-semibold">Review Reminder Date</label>
                            <input type="date" class="form-control" id="linkReviewDate" />
                          </div>
                          <div class="col-md-6">
                            <label for="linkColor" class="form-label fw-semibold">Custom Highlight Color</label>
                            <input type="color" class="form-control form-control-color w-100" id="linkColor" value="#2563eb" title="Choose color" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Flags: Favorite, Pin, Read Later -->
                <div class="p-3 bg-light rounded border">
                  <div class="row g-2">
                    <div class="col-sm-4">
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="linkIsFavorite" />
                        <label class="form-check-label fw-semibold" for="linkIsFavorite">
                          ${Icons.get('star', { size: 14, color: '#f59e0b' })} Favourite
                        </label>
                      </div>
                    </div>

                    <div class="col-sm-4">
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="linkIsPinned" />
                        <label class="form-check-label fw-semibold" for="linkIsPinned">
                          ${Icons.get('pin', { size: 14, color: 'var(--ml-primary)' })} Pin to Top
                        </label>
                      </div>
                    </div>

                    <div class="col-sm-4">
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="linkIsReadLater" />
                        <label class="form-check-label fw-semibold" for="linkIsReadLater">
                          ${Icons.get('book-open', { size: 14 })} Read Later
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Reading Status (visible when Read Later is checked) -->
                  <div id="readingStatusWrapper" class="mt-2 pt-2 border-top d-none">
                    <label class="form-label fw-semibold small mb-1">Reading Status:</label>
                    <div class="d-flex gap-3">
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="readingStatus" id="readStatusUnread" value="unread" checked>
                        <label class="form-check-label small" for="readStatusUnread">Unread</label>
                      </div>
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="readingStatus" id="readStatusReading" value="reading">
                        <label class="form-check-label small" for="readStatusReading">Currently Reading</label>
                      </div>
                      <div class="form-check">
                        <input class="form-check-input" type="radio" name="readingStatus" id="readStatusCompleted" value="completed">
                        <label class="form-check-label small" for="readStatusCompleted">Completed</label>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <div class="modal-footer py-2 px-4 border-top bg-light">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" id="btn-save-link" class="btn-ml-primary">Save Link</button>
              </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(div.firstElementChild);
    this.modalEl = document.getElementById('linkModal');
    this.bsModal = new bootstrap.Modal(this.modalEl);

    this.bindEvents();
  },

  bindEvents() {
    const urlInput = document.getElementById('linkUrl');
    const titleInput = document.getElementById('linkTitle');
    const autoTitleBtn = document.getElementById('btn-auto-title');
    const readLaterCheck = document.getElementById('linkIsReadLater');
    const readingStatusWrapper = document.getElementById('readingStatusWrapper');
    const suggestionPill = document.getElementById('category-suggestion-pill');
    const applySuggestionBtn = document.getElementById('btn-apply-suggestion');
    const form = document.getElementById('linkForm');

    // Read later toggle
    readLaterCheck.addEventListener('change', () => {
      if (readLaterCheck.checked) {
        readingStatusWrapper.classList.remove('d-none');
      } else {
        readingStatusWrapper.classList.add('d-none');
      }
    });

    // Auto title button
    autoTitleBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (url) {
        titleInput.value = UrlUtils.generateTitleFromUrl(url);
      }
    });

    // URL input typing: Duplicate detection & auto title derivation & smart category suggestion
    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim();

      if (this.duplicateCheckTimer) clearTimeout(this.duplicateCheckTimer);

      this.duplicateCheckTimer = setTimeout(async () => {
        if (!url) {
          document.getElementById('duplicate-warning-banner').classList.add('d-none');
          suggestionPill.classList.add('d-none');
          return;
        }

        // Auto-fill title if empty
        if (!titleInput.value.trim()) {
          titleInput.value = UrlUtils.generateTitleFromUrl(url);
        }

        // Check duplicate
        const dup = await LinkManager.checkDuplicate(url, this.currentLinkId);
        const dupBanner = document.getElementById('duplicate-warning-banner');
        const dupText = document.getElementById('duplicate-warning-text');
        const dupBtn = document.getElementById('btn-open-duplicate');

        if (dup) {
          dupText.textContent = `This URL already exists as "${dup.title}".`;
          dupBanner.classList.remove('d-none');
          dupBtn.onclick = () => {
            this.openForEdit(dup.id);
          };
        } else {
          dupBanner.classList.add('d-none');
        }

        // Smart category suggestion
        const suggested = await LinkManager.suggestCategory(url, titleInput.value);
        if (suggested && document.getElementById('linkCategory').value !== suggested.id) {
          applySuggestionBtn.textContent = `${suggested.name}`;
          suggestionPill.classList.remove('d-none');
          applySuggestionBtn.onclick = () => {
            document.getElementById('linkCategory').value = suggested.id;
            suggestionPill.classList.add('d-none');
          };
        } else {
          suggestionPill.classList.add('d-none');
        }
      }, 350);
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveLink();
    });
  },

  async openForAdd(defaults = {}) {
    this.currentLinkId = null;
    document.getElementById('linkModalTitle').textContent = 'Add New Link';
    document.getElementById('linkForm').reset();
    document.getElementById('duplicate-warning-banner').classList.add('d-none');
    document.getElementById('category-suggestion-pill').classList.add('d-none');
    document.getElementById('readingStatusWrapper').classList.add('d-none');

    await this.populateDropdowns(defaults.categoryId, defaults.folderId);
    await this.populateCollections([]);

    if (defaults.url) document.getElementById('linkUrl').value = defaults.url;
    if (defaults.title) document.getElementById('linkTitle').value = defaults.title;
    if (defaults.isFavorite) document.getElementById('linkIsFavorite').checked = true;
    if (defaults.isPinned) document.getElementById('linkIsPinned').checked = true;
    if (defaults.isReadLater) {
      document.getElementById('linkIsReadLater').checked = true;
      document.getElementById('readingStatusWrapper').classList.remove('d-none');
    }

    this.bsModal.show();
    setTimeout(() => document.getElementById('linkUrl').focus(), 250);
  },

  async openForEdit(linkId) {
    this.currentLinkId = linkId;
    const link = await db.get('links', linkId);
    if (!link) return;

    document.getElementById('linkModalTitle').textContent = 'Edit Link';
    document.getElementById('duplicate-warning-banner').classList.add('d-none');
    document.getElementById('category-suggestion-pill').classList.add('d-none');

    await this.populateDropdowns(link.categoryId, link.folderId);

    const linkCollections = await CollectionManager.getCollectionsForLink(linkId);
    await this.populateCollections(linkCollections.map(c => c.id));

    document.getElementById('linkUrl').value = link.url || '';
    document.getElementById('linkTitle').value = link.title || '';
    document.getElementById('linkDescription').value = link.description || '';
    document.getElementById('linkTags').value = Array.isArray(link.tags) ? link.tags.join(', ') : '';
    document.getElementById('linkNotes').value = link.notes || '';
    document.getElementById('linkReviewDate').value = link.reviewDate || '';
    document.getElementById('linkColor').value = link.color || '#2563eb';

    document.getElementById('linkIsFavorite').checked = !!link.isFavorite;
    document.getElementById('linkIsPinned').checked = !!link.isPinned;
    document.getElementById('linkIsReadLater').checked = !!link.isReadLater;

    const readingStatusWrapper = document.getElementById('readingStatusWrapper');
    if (link.isReadLater) {
      readingStatusWrapper.classList.remove('d-none');
      const rInput = document.querySelector(`input[name="readingStatus"][value="${link.readingStatus || 'unread'}"]`);
      if (rInput) rInput.checked = true;
    } else {
      readingStatusWrapper.classList.add('d-none');
    }

    this.bsModal.show();
  },

  async populateDropdowns(selectedCatId = null, selectedFolderId = null) {
    const catSelect = document.getElementById('linkCategory');
    const folderSelect = document.getElementById('linkFolder');

    const categories = await db.getAll('categories');
    const folders = await db.getAll('folders');

    catSelect.innerHTML = '<option value="">Unassigned (Inbox)</option>';
    categories.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      if (c.id === selectedCatId) opt.selected = true;
      catSelect.appendChild(opt);
    });

    folderSelect.innerHTML = '<option value="">None (Root)</option>';
    folders.sort((a, b) => a.name.localeCompare(b.name)).forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      if (f.id === selectedFolderId) opt.selected = true;
      folderSelect.appendChild(opt);
    });
  },

  async populateCollections(selectedIds = []) {
    const container = document.getElementById('linkCollectionsContainer');
    const collections = await db.getAll('collections');

    if (collections.length === 0) {
      container.innerHTML = '<span class="text-muted small">No collections created yet. You can create one from the Collections page.</span>';
      return;
    }

    const set = new Set(selectedIds);
    container.innerHTML = collections.map(col => `
      <div class="form-check form-check-inline m-0">
        <input class="form-check-input col-checkbox" type="checkbox" value="${col.id}" id="col_${col.id}" ${set.has(col.id) ? 'checked' : ''} />
        <label class="form-check-label small" for="col_${col.id}">${Security.escapeHtml(col.name)}</label>
      </div>
    `).join('');
  },

  async saveLink() {
    let url = document.getElementById('linkUrl').value.trim();
    const urlInput = document.getElementById('linkUrl');

    if (!url) {
      urlInput.classList.add('is-invalid');
      return;
    }

    url = Validators.ensureProtocol(url);
    if (!Validators.isValidUrl(url)) {
      urlInput.classList.add('is-invalid');
      document.getElementById('linkUrlFeedback').textContent = 'Please enter a valid HTTP/HTTPS URL.';
      return;
    }
    urlInput.classList.remove('is-invalid');

    let title = document.getElementById('linkTitle').value.trim();
    if (!title) {
      title = UrlUtils.generateTitleFromUrl(url);
    }

    const isReadLater = document.getElementById('linkIsReadLater').checked;
    let readingStatus = 'none';
    if (isReadLater) {
      const checkedRadio = document.querySelector('input[name="readingStatus"]:checked');
      readingStatus = checkedRadio ? checkedRadio.value : 'unread';
    }

    const tagsRaw = document.getElementById('linkTags').value;
    const tags = tagsRaw.split(/[,;]/).map(t => t.trim()).filter(Boolean);

    const payload = {
      title,
      url,
      description: document.getElementById('linkDescription').value.trim(),
      categoryId: document.getElementById('linkCategory').value || null,
      folderId: document.getElementById('linkFolder').value || null,
      tags,
      notes: document.getElementById('linkNotes').value.trim(),
      reviewDate: document.getElementById('linkReviewDate').value || null,
      color: document.getElementById('linkColor').value || null,
      isFavorite: document.getElementById('linkIsFavorite').checked,
      isPinned: document.getElementById('linkIsPinned').checked,
      isReadLater,
      readingStatus
    };

    let savedLink;
    if (this.currentLinkId) {
      savedLink = await LinkManager.updateLink(this.currentLinkId, payload);
    } else {
      savedLink = await LinkManager.createLink(payload);
    }

    // Save Collections
    const selectedCols = Array.from(document.querySelectorAll('.col-checkbox:checked')).map(cb => cb.value);
    await CollectionManager.setLinkCollections(savedLink.id, selectedCols);

    this.bsModal.hide();

    window.dispatchEvent(new CustomEvent('ml-link-saved', {
      detail: { link: savedLink, isNew: !this.currentLinkId }
    }));
  }
};
