/**
 * ManageLinks - Personal Notes & Folders Workspace (Google Drive Style)
 * Developer: Devraj Chauhan
 * 100% Offline Personal Notes, Google Drive Folders, Clickable Links, Full-Page Editor, Share & PDF
 */

import { Icons } from '../assets/js/icons.js';
import { NotesManager } from '../assets/js/notes-manager.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { ShareModal } from '../components/share-modal.js';
import { Toast } from '../assets/js/notifications.js';
import { DateUtils } from '../utils/date-utils.js';
import { Security } from '../assets/js/security.js';
import { FileUtils } from '../utils/file-utils.js';
import { PdfGenerator } from '../utils/pdf-generator.js';

export const NotesPage = {
  activeFolderId: null, // null = All / Root notes, or string folder ID
  currentSearch: '',
  selectedTag: '',
  sortBy: 'updatedAt',
  
  // Full-page Editor state
  editingNoteId: null,
  isEditorOpen: false,
  editorMode: 'write', // 'write' | 'preview'
  editorData: {
    title: '',
    content: '',
    folderId: null,
    tags: '',
    color: 'default',
    isPinned: false
  },

  async render() {
    const container = document.getElementById('content-area');

    // If full-page editor is currently active, render the full-page workspace!
    if (this.isEditorOpen) {
      await this.renderFullPageEditor(container);
      return;
    }

    // Otherwise render the Google Drive style folder & notes browser
    await this.renderNotesHub(container);
  },

  // =========================================================
  // VIEW 1: GOOGLE DRIVE STYLE NOTES & FOLDERS BROWSER
  // =========================================================

  async renderNotesHub(container) {
    const allFolders = await NotesManager.getAllFolders();
    const allTags = await NotesManager.getAllTags();
    const activeFolder = this.activeFolderId ? allFolders.find(f => f.id === this.activeFolderId) : null;

    // Fetch notes matching current folder, search, tag, sort
    const notes = await NotesManager.getAll({
      folderId: this.activeFolderId === null ? undefined : this.activeFolderId,
      search: this.currentSearch,
      tag: this.selectedTag,
      sortBy: this.sortBy
    });

    const folderMap = new Map(allFolders.map(f => [f.id, f.name]));
    const allNotesGlobal = await NotesManager.getAll();

    // Calculate note counts per folder
    const folderNoteCounts = new Map();
    allNotesGlobal.forEach(n => {
      if (n.folderId) {
        folderNoteCounts.set(n.folderId, (folderNoteCounts.get(n.folderId) || 0) + 1);
      }
    });

    const pinnedNotes = notes.filter(n => n.isPinned);
    const otherNotes = notes.filter(n => !n.isPinned);

    container.innerHTML = `
      <!-- Top Navigation & Actions Bar -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <!-- Google Drive Breadcrumb -->
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-1 align-items-center">
              <li class="breadcrumb-item">
                <button type="button" class="btn btn-link p-0 text-decoration-none fw-bold text-dark d-inline-flex align-items-center gap-1 btn-nav-root-notes">
                  ${Icons.get('file-text', { size: 20, color: 'var(--ml-primary)' })}
                  <span>Personal Notes</span>
                </button>
              </li>
              ${activeFolder ? `
                <li class="breadcrumb-item active text-primary fw-semibold d-inline-flex align-items-center gap-1" aria-current="page">
                  📁 ${Security.escapeHtml(activeFolder.name)}
                </li>
              ` : ''}
            </ol>
          </nav>
          <p class="text-secondary small mb-0">
            ${activeFolder ? `Folder: ${Security.escapeHtml(activeFolder.name)} &bull; ${notes.length} notes stored locally.` : 'Google Drive style folders, clickable web links, full-page writing workspace & PDF export.'}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex flex-wrap align-items-center gap-2">
          <!-- Create Folder Button -->
          <button id="btn-create-note-folder" class="btn btn-outline-primary d-inline-flex align-items-center gap-2 shadow-sm bg-white">
            ${Icons.get('folder', { size: 16 })}
            <span class="fw-semibold">New Folder</span>
          </button>

          <!-- Export All Notes to PDF -->
          <button id="btn-export-notes-pdf" class="btn btn-outline-danger d-inline-flex align-items-center gap-2 shadow-sm bg-white" title="Export all notes in current view as clickable PDF">
            ${Icons.get('file-text', { size: 16 })}
            <span class="fw-semibold">Export PDF</span>
          </button>

          <!-- Full Page Create Note Button -->
          <button id="btn-create-note-full" class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm">
            ${Icons.get('plus', { size: 18, color: '#fff' })}
            <span class="fw-semibold">Create Note</span>
          </button>
        </div>
      </div>

      <!-- Google Drive Style Folders Section (Shown when at root or when folders exist) -->
      ${!activeFolder && allFolders.length > 0 ? `
        <div class="mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold text-dark text-uppercase small mb-0 d-flex align-items-center gap-2">
              <span class="text-primary">${Icons.get('folder', { size: 16 })}</span>
              <span>Folders (${allFolders.length})</span>
            </h6>
          </div>
          <div class="row g-3">
            ${allFolders.map(folder => {
              const count = folderNoteCounts.get(folder.id) || 0;
              return `
                <div class="col-sm-6 col-md-4 col-xl-3">
                  <div class="card h-100 border shadow-sm transition-all note-folder-card" data-folder-id="${folder.id}" style="cursor: pointer;">
                    <div class="card-body p-3 d-flex align-items-center justify-content-between">
                      <div class="d-flex align-items-center gap-3 text-truncate">
                        <div class="p-2 rounded bg-primary-subtle text-primary flex-shrink-0">
                          ${Icons.get('folder', { size: 22 })}
                        </div>
                        <div class="text-truncate">
                          <div class="fw-bold text-dark text-truncate" title="${Security.escapeHtml(folder.name)}">${Security.escapeHtml(folder.name)}</div>
                          <div class="small text-muted">${count} ${count === 1 ? 'note' : 'notes'}</div>
                        </div>
                      </div>
                      <div class="dropdown" onclick="event.stopPropagation();">
                        <button class="btn btn-sm btn-link text-muted p-1 text-decoration-none" data-bs-toggle="dropdown">
                          ${Icons.get('more-vertical', { size: 16 })}
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                          <li><button class="dropdown-item btn-open-folder" data-folder-id="${folder.id}">Open Folder</button></li>
                          <li><button class="dropdown-item btn-rename-folder" data-folder-id="${folder.id}" data-folder-name="${Security.escapeHtml(folder.name)}">Rename</button></li>
                          <li><hr class="dropdown-divider"></li>
                          <li><button class="dropdown-item text-danger btn-delete-folder" data-folder-id="${folder.id}" data-folder-name="${Security.escapeHtml(folder.name)}">Delete Folder</button></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Search, Tag Filter & Sort Controls -->
      <div class="card border shadow-sm mb-4">
        <div class="card-body p-3">
          <div class="row g-2 align-items-center">
            <!-- Search -->
            <div class="col-md-5">
              <div class="input-group">
                <span class="input-group-text bg-transparent">${Icons.get('search', { size: 16 })}</span>
                <input type="text" id="notes-search-input" class="form-control" placeholder="Search notes, clickable links, tags..." value="${Security.escapeHtml(this.currentSearch)}" />
                ${this.currentSearch ? `<button class="btn btn-outline-secondary" id="btn-clear-note-search">${Icons.get('x', { size: 14 })}</button>` : ''}
              </div>
            </div>

            <!-- Tag Filter -->
            <div class="col-md-4">
              <select id="notes-tag-select" class="form-select">
                <option value="">All Tags (${allTags.length})</option>
                ${allTags.map(t => `<option value="${Security.escapeHtml(t)}" ${this.selectedTag === t ? 'selected' : ''}>#${Security.escapeHtml(t)}</option>`).join('')}
              </select>
            </div>

            <!-- Sort By -->
            <div class="col-md-3">
              <select id="notes-sort-select" class="form-select">
                <option value="updatedAt" ${this.sortBy === 'updatedAt' ? 'selected' : ''}>Recently Updated</option>
                <option value="oldest" ${this.sortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
                <option value="title" ${this.sortBy === 'title' ? 'selected' : ''}>Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes Grid / List Area -->
      <div id="notes-list-container">
        ${notes.length === 0 ? this.renderEmptyState(activeFolder) : this.renderNotesGrid(pinnedNotes, otherNotes, folderMap, allFolders)}
      </div>
    `;

    this.bindHubEvents(notes, activeFolder, allFolders);
  },

  renderEmptyState(activeFolder) {
    if (this.currentSearch || this.selectedTag) {
      return `
        <div class="card border shadow-sm text-center p-5">
          <div class="text-muted mb-3">${Icons.get('search', { size: 48 })}</div>
          <h5 class="fw-bold mb-2">No matching notes found</h5>
          <p class="text-secondary mb-3">Try adjusting your search terms or clearing your tag filters.</p>
          <div>
            <button id="btn-reset-note-filters" class="btn btn-outline-primary btn-sm">Clear Filters</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="card border shadow-sm text-center p-5">
        <div class="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-3">
          ${Icons.get('file-text', { size: 42 })}
        </div>
        <h4 class="fw-bold mb-2">${activeFolder ? `No notes in "${Security.escapeHtml(activeFolder.name)}"` : 'Your Personal Notes Library'}</h4>
        <p class="text-secondary max-w-md mx-auto mb-4" style="max-width: 520px;">
          Create notes, memos, checklists, and code snippets with live clickable hyperlinks. Organize into Google Drive style folders and export clickable PDFs.
        </p>
        <div class="d-flex justify-content-center gap-2">
          <button id="btn-empty-create-note" class="btn btn-primary d-inline-flex align-items-center gap-2">
            ${Icons.get('plus', { size: 18, color: '#fff' })}
            <span>Create Note</span>
          </button>
          ${!activeFolder ? `
            <button id="btn-empty-create-folder" class="btn btn-outline-primary d-inline-flex align-items-center gap-2">
              ${Icons.get('folder', { size: 18 })}
              <span>New Folder</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  renderNotesGrid(pinned, others, folderMap, allFolders) {
    let html = '';

    if (pinned.length > 0) {
      html += `
        <div class="mb-4">
          <div class="d-flex align-items-center gap-2 mb-3">
            <span class="text-warning">${Icons.get('pin', { size: 18 })}</span>
            <h6 class="fw-bold text-uppercase small text-muted mb-0">Pinned Notes (${pinned.length})</h6>
          </div>
          <div class="row g-3">
            ${pinned.map(n => this.renderNoteCard(n, folderMap, allFolders)).join('')}
          </div>
        </div>
      `;
    }

    if (others.length > 0) {
      if (pinned.length > 0) {
        html += `
          <div class="d-flex align-items-center gap-2 mb-3 mt-4">
            <h6 class="fw-bold text-uppercase small text-muted mb-0">Notes (${others.length})</h6>
          </div>
        `;
      }
      html += `
        <div class="row g-3">
          ${others.map(n => this.renderNoteCard(n, folderMap, allFolders)).join('')}
        </div>
      `;
    }

    return html;
  },

  renderNoteCard(note, folderMap, allFolders) {
    const colorClasses = {
      default: 'border-secondary-subtle',
      blue: 'border-primary border-opacity-50 bg-primary-subtle bg-opacity-10',
      green: 'border-success border-opacity-50 bg-success-subtle bg-opacity-10',
      yellow: 'border-warning border-opacity-50 bg-warning-subtle bg-opacity-10',
      purple: 'border-info border-opacity-50 bg-info-subtle bg-opacity-10',
      rose: 'border-danger border-opacity-50 bg-danger-subtle bg-opacity-10'
    };

    const cardClass = colorClasses[note.color] || colorClasses.default;
    const folderName = note.folderId ? folderMap.get(note.folderId) : null;
    const createdStr = DateUtils.formatDateTime(note.createdAt);
    const updatedStr = DateUtils.formatDateTime(note.updatedAt || note.createdAt);
    const relativeTime = DateUtils.formatRelative(note.updatedAt || note.createdAt);

    // Live linkified content with clickable hyperlinks
    const clickableContent = NotesManager.linkify(note.content || 'No content.');

    return `
      <div class="col-md-6 col-xl-4" id="note-card-${note.id}">
        <div class="card h-100 shadow-sm border ${cardClass} position-relative transition-all note-grid-card">
          <!-- Card Header -->
          <div class="card-header bg-transparent border-0 pt-3 px-3 pb-1 d-flex align-items-start justify-content-between gap-2">
            <div class="d-flex flex-column text-truncate">
              <h6 class="fw-bold text-dark mb-1 text-truncate" title="${Security.escapeHtml(note.title)}">
                ${Security.escapeHtml(note.title)}
              </h6>
              ${folderName ? `
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle text-truncate align-self-start" style="font-size: 0.68rem;">
                  📁 ${Security.escapeHtml(folderName)}
                </span>
              ` : ''}
            </div>
            <button class="btn btn-sm btn-link p-0 text-decoration-none btn-toggle-pin ${note.isPinned ? 'text-warning' : 'text-muted'}" data-id="${note.id}" title="${note.isPinned ? 'Unpin Note' : 'Pin to top'}">
              ${Icons.get('pin', { size: 16 })}
            </button>
          </div>

          <!-- Card Body with Live Clickable Links -->
          <div class="card-body px-3 py-2">
            <div class="note-card-content text-secondary small" style="white-space: pre-wrap; max-height: 170px; overflow-y: auto; font-size: 0.88rem; line-height: 1.55;">
              ${clickableContent}
            </div>
          </div>

          <!-- Card Footer with Timestamps & Direct Action Buttons -->
          <div class="card-footer bg-transparent border-0 px-3 pb-3 pt-1">
            <!-- Tags -->
            ${Array.isArray(note.tags) && note.tags.length > 0 ? `
              <div class="d-flex flex-wrap gap-1 mb-2">
                ${note.tags.map(t => `<span class="badge bg-light text-secondary border fw-normal" style="font-size: 0.72rem;">#${Security.escapeHtml(t)}</span>`).join('')}
              </div>
            ` : ''}

            <!-- Timestamps Row -->
            <div class="d-flex flex-column gap-1 pt-2 pb-2 border-top border-light text-muted" style="font-size: 0.72rem;">
              <div class="d-flex justify-content-between">
                <span><strong>Created:</strong> ${createdStr}</span>
                <span>${relativeTime}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span><strong>Updated:</strong> ${updatedStr}</span>
              </div>
            </div>

            <!-- Action Buttons Row -->
            <div class="d-flex align-items-center justify-content-between pt-2 border-top border-light">
              <div class="d-flex align-items-center gap-1">
                <!-- Share Button -->
                <button class="btn btn-sm btn-outline-success py-1 px-2 btn-share-note" data-id="${note.id}" title="Directly share note via WhatsApp, Telegram, Email, or System Sheet">
                  ${Icons.get('share-2', { size: 14 })}
                </button>
                <!-- PDF Button -->
                <button class="btn btn-sm btn-outline-danger py-1 px-2 btn-pdf-note" data-id="${note.id}" title="Export this note as Clickable PDF">
                  ${Icons.get('file-text', { size: 14 })}
                </button>
                <!-- Move to Folder Dropdown -->
                <div class="dropdown d-inline-block">
                  <button class="btn btn-sm btn-outline-secondary py-1 px-2 dropdown-toggle-no-caret" data-bs-toggle="dropdown" title="Move to folder">
                    ${Icons.get('folder', { size: 14 })}
                  </button>
                  <ul class="dropdown-menu shadow-sm" style="font-size: 0.82rem;">
                    <li><h6 class="dropdown-header">Move to Folder</h6></li>
                    <li><button class="dropdown-item btn-move-to-folder ${!note.folderId ? 'active' : ''}" data-id="${note.id}" data-folder-id="">None (Root)</button></li>
                    ${allFolders.map(f => `
                      <li><button class="dropdown-item btn-move-to-folder ${note.folderId === f.id ? 'active' : ''}" data-id="${note.id}" data-folder-id="${f.id}">📁 ${Security.escapeHtml(f.name)}</button></li>
                    `).join('')}
                  </ul>
                </div>
              </div>

              <div class="d-flex align-items-center gap-1">
                <!-- Edit in Full Page -->
                <button class="btn btn-sm btn-primary py-1 px-2 btn-open-editor" data-id="${note.id}" title="Open full-page writing workspace">
                  ${Icons.get('edit', { size: 14, color: '#fff' })}
                  <span class="ms-1" style="font-size: 0.78rem;">Edit</span>
                </button>
                <!-- Delete -->
                <button class="btn btn-sm btn-outline-danger py-1 px-2 btn-delete-note" data-id="${note.id}" title="Delete note">
                  ${Icons.get('trash-2', { size: 14 })}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // =========================================================
  // VIEW 2: FULL-PAGE WRITING & EDITING WORKSPACE
  // =========================================================

  async renderFullPageEditor(container) {
    const allFolders = await NotesManager.getAllFolders();
    const isNew = !this.editingNoteId;

    const words = this.countWords(this.editorData.content);
    const chars = (this.editorData.content || '').length;

    container.innerHTML = `
      <div class="note-fullpage-editor animate-fade-in">
        <!-- Top Workspace Bar -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-white border rounded shadow-sm mb-3">
          <div class="d-flex align-items-center gap-2">
            <!-- Back Button -->
            <button type="button" id="btn-editor-back" class="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1">
              <span>&larr;</span>
              <span>Back to Notes</span>
            </button>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
              ${isNew ? 'New Note' : 'Editing Note'}
            </span>
          </div>

          <!-- Metadata Pickers: Folder, Color, Pin -->
          <div class="d-flex flex-wrap align-items-center gap-2">
            <!-- Folder Select -->
            <div class="d-flex align-items-center gap-1">
              <span class="text-muted small">${Icons.get('folder', { size: 16 })}</span>
              <select id="editor-folder-select" class="form-select form-select-sm" style="max-width: 170px;">
                <option value="">Root (No Folder)</option>
                ${allFolders.map(f => `<option value="${f.id}" ${this.editorData.folderId === f.id ? 'selected' : ''}>📁 ${Security.escapeHtml(f.name)}</option>`).join('')}
              </select>
            </div>

            <!-- Color Accent Picker -->
            <select id="editor-color-select" class="form-select form-select-sm" style="max-width: 140px;">
              <option value="default" ${this.editorData.color === 'default' ? 'selected' : ''}>Slate Theme</option>
              <option value="blue" ${this.editorData.color === 'blue' ? 'selected' : ''}>Sky Blue</option>
              <option value="green" ${this.editorData.color === 'green' ? 'selected' : ''}>Emerald</option>
              <option value="yellow" ${this.editorData.color === 'yellow' ? 'selected' : ''}>Warm Amber</option>
              <option value="purple" ${this.editorData.color === 'purple' ? 'selected' : ''}>Violet</option>
              <option value="rose" ${this.editorData.color === 'rose' ? 'selected' : ''}>Rose</option>
            </select>

            <!-- Pin Toggle -->
            <button type="button" id="editor-pin-toggle" class="btn btn-sm ${this.editorData.isPinned ? 'btn-warning text-dark' : 'btn-outline-secondary'} d-inline-flex align-items-center gap-1" title="Pin note to top">
              ${Icons.get('pin', { size: 14 })}
              <span>${this.editorData.isPinned ? 'Pinned' : 'Pin'}</span>
            </button>

            <!-- Live Word & Character Stats -->
            <span class="text-muted small px-2 py-1 bg-light rounded border" id="editor-live-stats" style="font-size: 0.78rem;">
              ${words} words &bull; ${chars} chars
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="d-flex align-items-center gap-2">
            ${!isNew ? `
              <button type="button" id="btn-editor-share" class="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1">
                ${Icons.get('share-2', { size: 14 })}
                <span>Share</span>
              </button>
              <button type="button" id="btn-editor-pdf" class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1">
                ${Icons.get('file-text', { size: 14 })}
                <span>PDF</span>
              </button>
            ` : ''}

            <button type="button" id="btn-editor-save" class="btn btn-primary btn-sm d-inline-flex align-items-center gap-1 shadow-sm px-3">
              ${Icons.get('save', { size: 15, color: '#fff' })}
              <span class="fw-bold">Save Note</span>
            </button>
          </div>
        </div>

        <!-- Note Title Input (Large full-width heading) -->
        <div class="bg-white border rounded shadow-sm p-3 mb-3">
          <input type="text" id="editor-title-input" class="form-control form-control-lg fw-bold border-0 fs-3 px-1 py-1" placeholder="Title your note..." value="${Security.escapeHtml(this.editorData.title)}" />
          <div class="mt-2 pt-2 border-top d-flex flex-wrap align-items-center gap-2">
            <span class="text-muted small">${Icons.get('tag', { size: 14 })}</span>
            <input type="text" id="editor-tags-input" class="form-control form-control-sm border-0 px-1 py-0" style="max-width: 420px;" placeholder="Add comma-separated tags: ideas, work, links, code..." value="${Security.escapeHtml(this.editorData.tags)}" />
          </div>
        </div>

        <!-- Editor & Preview Controls & Formatting Toolbar -->
        <div class="card border shadow-sm mb-4">
          <div class="card-header bg-white py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom">
            <!-- Formatting Shortcuts Toolbar -->
            <div class="d-flex flex-wrap align-items-center gap-1">
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="bold" title="Bold (**text**)"><strong>B</strong></button>
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="italic" title="Italic (*text*)"><em>I</em></button>
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="h1" title="Heading 1 (# Heading)"><strong>H1</strong></button>
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="h2" title="Heading 2 (## Heading)"><strong>H2</strong></button>
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="bullet" title="Bullet List (- item)">List</button>
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="check" title="Checklist (- [ ] task)">Checklist</button>
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="link" title="Clickable Link ([Title](https://...))">🔗 Link</button>
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="code" title="Code Block (\`\`\`code\`\`\`)">Code</button>
              <button type="button" class="btn btn-sm btn-light border py-1 px-2 btn-format" data-format="quote" title="Quote (> quote)">Quote</button>
            </div>

            <!-- View Switcher Tabs: Write vs Preview -->
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" id="tab-editor-write" class="btn ${this.editorMode === 'write' ? 'btn-primary' : 'btn-outline-secondary'}">
                ${Icons.get('edit', { size: 14 })} Write
              </button>
              <button type="button" id="tab-editor-preview" class="btn ${this.editorMode === 'preview' ? 'btn-primary' : 'btn-outline-secondary'}">
                ${Icons.get('eye', { size: 14 })} Preview Links
              </button>
            </div>
          </div>

          <!-- Body Content Area -->
          <div class="card-body p-0">
            ${this.editorMode === 'write' ? `
              <textarea id="editor-body-textarea" class="form-control border-0 p-4" style="min-height: 480px; resize: vertical; font-size: 1.05rem; line-height: 1.65; outline: none;" placeholder="Write your thoughts, memos, meeting notes, code snippets, or paste website URLs here. Web URLs (https://...) are automatically converted into clickable hyperlinks!">${Security.escapeHtml(this.editorData.content)}</textarea>
            ` : `
              <div class="p-4" style="min-height: 480px; font-size: 1.05rem; line-height: 1.65; background-color: #fafafa;">
                <div class="mb-3 text-muted small pb-2 border-bottom">
                  <span>Clickable Hyperlink Preview Mode</span> &bull; <span>Links will open in a new tab</span>
                </div>
                <div style="white-space: pre-wrap; word-break: break-word;">
                  ${NotesManager.linkify(this.editorData.content || 'Nothing written yet. Switch to "Write" tab to begin writing.')}
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    this.bindEditorEvents();
  },

  // =========================================================
  // EVENT BINDINGS FOR HUB VIEW
  // =========================================================

  bindHubEvents(notes, activeFolder, allFolders) {
    // 1. Breadcrumb Root click
    document.querySelector('.btn-nav-root-notes')?.addEventListener('click', () => {
      this.activeFolderId = null;
      this.render();
    });

    // 2. Folder card click (navigates into folder)
    document.querySelectorAll('.note-folder-card')?.forEach(el => {
      el.addEventListener('click', () => {
        this.activeFolderId = el.getAttribute('data-folder-id');
        this.render();
      });
    });

    // Open folder dropdown action
    document.querySelectorAll('.btn-open-folder')?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeFolderId = btn.getAttribute('data-folder-id');
        this.render();
      });
    });

    // Create New Folder Button
    document.getElementById('btn-create-note-folder')?.addEventListener('click', () => {
      this.promptCreateFolder();
    });
    document.getElementById('btn-empty-create-folder')?.addEventListener('click', () => {
      this.promptCreateFolder();
    });

    // Rename Folder
    document.querySelectorAll('.btn-rename-folder')?.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-folder-id');
        const currentName = btn.getAttribute('data-folder-name');
        const newName = prompt('Enter new folder name:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
          try {
            await NotesManager.updateFolder(id, { name: newName.trim() });
            Toast.success('Folder renamed successfully!');
            await this.render();
          } catch (err) {
            Toast.error(err.message);
          }
        }
      });
    });

    // Delete Folder
    document.querySelectorAll('.btn-delete-folder')?.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-folder-id');
        const name = btn.getAttribute('data-folder-name');
        const ok = await ConfirmationModal.ask({
          title: `Delete Folder "${name}"?`,
          message: `Are you sure you want to delete this folder? Any notes inside will be safely moved to Root (they will NOT be deleted).`,
          confirmText: 'Delete Folder',
          btnClass: 'btn-danger'
        });
        if (ok) {
          await NotesManager.deleteFolder(id);
          if (this.activeFolderId === id) this.activeFolderId = null;
          Toast.success('Folder deleted. Notes moved to Root.');
          await this.render();
        }
      });
    });

    // 3. Create Note Button (Opens Full Page Editor)
    document.getElementById('btn-create-note-full')?.addEventListener('click', () => {
      this.openEditorForNew(activeFolder ? activeFolder.id : null);
    });
    document.getElementById('btn-empty-create-note')?.addEventListener('click', () => {
      this.openEditorForNew(activeFolder ? activeFolder.id : null);
    });

    // 4. Export All Notes to Clickable PDF
    document.getElementById('btn-export-notes-pdf')?.addEventListener('click', () => {
      if (!notes || notes.length === 0) {
        Toast.warning('No notes available to export.');
        return;
      }
      const folderName = activeFolder ? activeFolder.name : 'All Personal Notes';
      Toast.info(`Generating Clickable PDF for ${notes.length} notes...`);
      PdfGenerator.generateNotesCatalogPdf({ notes, folderName });
    });

    // 5. Search input
    const searchInput = document.getElementById('notes-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.currentSearch = e.target.value;
      this.debouncedSearch();
    });

    document.getElementById('btn-clear-note-search')?.addEventListener('click', () => {
      this.currentSearch = '';
      this.render();
    });

    document.getElementById('btn-reset-note-filters')?.addEventListener('click', () => {
      this.currentSearch = '';
      this.selectedTag = '';
      this.render();
    });

    // 6. Tag Filter
    document.getElementById('notes-tag-select')?.addEventListener('change', (e) => {
      this.selectedTag = e.target.value;
      this.render();
    });

    // 7. Sort By
    document.getElementById('notes-sort-select')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.render();
    });

    // 8. Note Card Action Delegation
    const listContainer = document.getElementById('notes-list-container');
    listContainer?.addEventListener('click', async (e) => {
      // Toggle Pin
      const pinBtn = e.target.closest('.btn-toggle-pin');
      if (pinBtn) {
        const id = pinBtn.getAttribute('data-id');
        await NotesManager.togglePin(id);
        await this.render();
        return;
      }

      // Share Note
      const shareBtn = e.target.closest('.btn-share-note');
      if (shareBtn) {
        const id = shareBtn.getAttribute('data-id');
        const note = await NotesManager.get(id);
        if (note) {
          const fName = note.folderId ? (allFolders.find(f => f.id === note.folderId)?.name || 'Folder') : null;
          ShareModal.openForNote(note, fName);
        }
        return;
      }

      // PDF Note
      const pdfBtn = e.target.closest('.btn-pdf-note');
      if (pdfBtn) {
        const id = pdfBtn.getAttribute('data-id');
        const note = await NotesManager.get(id);
        if (note) {
          const fName = note.folderId ? (allFolders.find(f => f.id === note.folderId)?.name || 'Folder') : null;
          Toast.info(`Exporting "${note.title}" as Clickable PDF...`);
          PdfGenerator.generateSingleNotePdf(note, fName);
        }
        return;
      }

      // Move to Folder
      const moveBtn = e.target.closest('.btn-move-to-folder');
      if (moveBtn) {
        const id = moveBtn.getAttribute('data-id');
        const folderId = moveBtn.getAttribute('data-folder-id') || null;
        await NotesManager.moveToFolder(id, folderId);
        Toast.success('Note moved to folder!');
        await this.render();
        return;
      }

      // Open Full-Page Editor
      const editBtn = e.target.closest('.btn-open-editor');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const note = await NotesManager.get(id);
        if (note) {
          this.openEditorForExisting(note);
        }
        return;
      }

      // Delete Note
      const delBtn = e.target.closest('.btn-delete-note');
      if (delBtn) {
        const id = delBtn.getAttribute('data-id');
        const note = await NotesManager.get(id);
        if (!note) return;

        const ok = await ConfirmationModal.ask({
          title: 'Delete Personal Note',
          message: `Are you sure you want to delete "${note.title}"? You can restore it later from Trash.`,
          confirmText: 'Delete Note',
          btnClass: 'btn-danger'
        });

        if (ok) {
          await NotesManager.delete(id);
          Toast.info('Note moved to Trash');
          await this.render();
        }
        return;
      }
    });
  },

  // =========================================================
  // EVENT BINDINGS FOR FULL-PAGE EDITOR
  // =========================================================

  bindEditorEvents() {
    // Back to hub
    document.getElementById('btn-editor-back')?.addEventListener('click', async () => {
      this.closeEditor();
    });

    // Folder select
    document.getElementById('editor-folder-select')?.addEventListener('change', (e) => {
      this.editorData.folderId = e.target.value || null;
    });

    // Color select
    document.getElementById('editor-color-select')?.addEventListener('change', (e) => {
      this.editorData.color = e.target.value;
    });

    // Pin toggle
    document.getElementById('editor-pin-toggle')?.addEventListener('click', () => {
      this.editorData.isPinned = !this.editorData.isPinned;
      const btn = document.getElementById('editor-pin-toggle');
      if (btn) {
        btn.className = `btn btn-sm ${this.editorData.isPinned ? 'btn-warning text-dark' : 'btn-outline-secondary'} d-inline-flex align-items-center gap-1`;
        btn.querySelector('span').textContent = this.editorData.isPinned ? 'Pinned' : 'Pin';
      }
    });

    // Tabs: Write vs Preview
    document.getElementById('tab-editor-write')?.addEventListener('click', () => {
      this.syncEditorInputs();
      this.editorMode = 'write';
      this.render();
    });

    document.getElementById('tab-editor-preview')?.addEventListener('click', () => {
      this.syncEditorInputs();
      this.editorMode = 'preview';
      this.render();
    });

    // Formatting Toolbar Buttons
    document.querySelectorAll('.btn-format')?.forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.getAttribute('data-format');
        this.applyFormat(format);
      });
    });

    // Live textarea typing word/char count
    const textarea = document.getElementById('editor-body-textarea');
    textarea?.addEventListener('input', () => {
      const text = textarea.value;
      const words = this.countWords(text);
      const chars = text.length;
      const statsEl = document.getElementById('editor-live-stats');
      if (statsEl) statsEl.textContent = `${words} words • ${chars} chars`;
    });

    // Save Note
    document.getElementById('btn-editor-save')?.addEventListener('click', async () => {
      await this.saveEditorNote();
    });

    // Share Note from Editor
    document.getElementById('btn-editor-share')?.addEventListener('click', async () => {
      if (this.editingNoteId) {
        const note = await NotesManager.get(this.editingNoteId);
        if (note) {
          const folders = await NotesManager.getAllFolders();
          const fName = note.folderId ? (folders.find(f => f.id === note.folderId)?.name || 'Folder') : null;
          ShareModal.openForNote(note, fName);
        }
      }
    });

    // PDF Note from Editor
    document.getElementById('btn-editor-pdf')?.addEventListener('click', async () => {
      if (this.editingNoteId) {
        const note = await NotesManager.get(this.editingNoteId);
        if (note) {
          const folders = await NotesManager.getAllFolders();
          const fName = note.folderId ? (folders.find(f => f.id === note.folderId)?.name || 'Folder') : null;
          PdfGenerator.generateSingleNotePdf(note, fName);
        }
      }
    });

    // Keyboard Shortcut Ctrl+S to save
    const keyHandler = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        await this.saveEditorNote();
      }
    };
    window.addEventListener('keydown', keyHandler, { once: true });
  },

  syncEditorInputs() {
    const titleInput = document.getElementById('editor-title-input');
    const tagsInput = document.getElementById('editor-tags-input');
    const textarea = document.getElementById('editor-body-textarea');

    if (titleInput) this.editorData.title = titleInput.value.trim();
    if (tagsInput) this.editorData.tags = tagsInput.value.trim();
    if (textarea) this.editorData.content = textarea.value;
  },

  async saveEditorNote() {
    this.syncEditorInputs();
    const title = this.editorData.title.trim() || 'Untitled Note';
    const content = this.editorData.content.trim();
    const folderId = this.editorData.folderId;
    const tags = this.editorData.tags;
    const color = this.editorData.color;
    const isPinned = this.editorData.isPinned;

    try {
      if (this.editingNoteId) {
        await NotesManager.update(this.editingNoteId, {
          title,
          content,
          folderId,
          tags,
          color,
          isPinned
        });
        Toast.success('Personal note updated successfully!');
      } else {
        const created = await NotesManager.create({
          title,
          content,
          folderId,
          tags,
          color,
          isPinned
        });
        this.editingNoteId = created.id;
        Toast.success('Personal note created successfully!');
      }

      this.closeEditor();
    } catch (err) {
      console.error('Error saving note:', err);
      Toast.error(`Failed to save note: ${err.message}`);
    }
  },

  applyFormat(format) {
    const textarea = document.getElementById('editor-body-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = '';

    switch (format) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'h1':
        replacement = `\n# ${selectedText || 'Heading 1'}\n`;
        break;
      case 'h2':
        replacement = `\n## ${selectedText || 'Heading 2'}\n`;
        break;
      case 'bullet':
        replacement = `\n- ${selectedText || 'List item'}`;
        break;
      case 'check':
        replacement = `\n- [ ] ${selectedText || 'Task to do'}`;
        break;
      case 'link':
        const urlPrompt = prompt('Enter destination URL (https://...):', 'https://');
        if (urlPrompt) {
          replacement = `[${selectedText || 'Link Title'}](${urlPrompt.trim()})`;
        } else {
          return;
        }
        break;
      case 'code':
        replacement = `\n\`\`\`\n${selectedText || '// code snippet'}\n\`\`\`\n`;
        break;
      case 'quote':
        replacement = `\n> ${selectedText || 'Quote text'}\n`;
        break;
    }

    textarea.setRangeText(replacement, start, end, 'end');
    textarea.focus();
  },

  openEditorForNew(folderId = null) {
    this.editingNoteId = null;
    this.isEditorOpen = true;
    this.editorMode = 'write';
    this.editorData = {
      title: '',
      content: '',
      folderId: folderId || null,
      tags: '',
      color: 'default',
      isPinned: false
    };
    this.render();
  },

  openEditorForExisting(note) {
    this.editingNoteId = note.id;
    this.isEditorOpen = true;
    this.editorMode = 'write';
    this.editorData = {
      title: note.title || '',
      content: note.content || '',
      folderId: note.folderId || null,
      tags: Array.isArray(note.tags) ? note.tags.join(', ') : (note.tags || ''),
      color: note.color || 'default',
      isPinned: !!note.isPinned
    };
    this.render();
  },

  closeEditor() {
    this.isEditorOpen = false;
    this.editingNoteId = null;
    this.render();
  },

  async promptCreateFolder() {
    const name = prompt('Enter new note folder name (e.g. Work, Research, Meeting Notes, Ideas):');
    if (!name || !name.trim()) return;

    try {
      await NotesManager.createFolder({ name: name.trim() });
      Toast.success(`Folder "${name.trim()}" created successfully!`);
      await this.render();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  countWords(str) {
    if (!str || !str.trim()) return 0;
    return str.trim().split(/\s+/).length;
  },

  searchTimer: null,
  debouncedSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.render();
    }, 250);
  }
};
