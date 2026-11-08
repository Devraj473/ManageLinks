/**
 * ManageLinks - Personal Notes Page
 * Developer: Devraj Chauhan
 * 100% Offline Personal Notes, Memos & Snippets
 */

import { Icons } from '../assets/js/icons.js';
import { NotesManager } from '../assets/js/notes-manager.js';
import { NoteModal } from '../components/note-modal.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { Toast } from '../assets/js/notifications.js';
import { DateUtils } from '../utils/date-utils.js';
import { Security } from '../assets/js/security.js';
import { FileUtils } from '../utils/file-utils.js';

export const NotesPage = {
  currentSearch: '',
  selectedTag: '',
  sortBy: 'updatedAt',

  async render() {
    const container = document.getElementById('content-area');
    const allTags = await NotesManager.getAllTags();
    const notes = await NotesManager.getAll({
      search: this.currentSearch,
      tag: this.selectedTag,
      sortBy: this.sortBy
    });

    const pinnedNotes = notes.filter(n => n.isPinned);
    const otherNotes = notes.filter(n => !n.isPinned);

    container.innerHTML = `
      <!-- Page Header -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1 d-flex align-items-center gap-2">
            ${Icons.get('file-text', { size: 26, color: 'var(--ml-primary)' })}
            <span>Personal Notes</span>
          </h2>
          <p class="text-secondary mb-0">Offline personal notes, code snippets, memos, and ideas saved locally.</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button id="btn-add-note-top" class="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm">
            ${Icons.get('plus', { size: 18, color: '#fff' })}
            <span class="fw-semibold">Create Note</span>
          </button>
        </div>
      </div>

      <!-- Controls: Search, Tag Filter & Sorting -->
      <div class="card border shadow-sm mb-4">
        <div class="card-body p-3">
          <div class="row g-2 align-items-center">
            <!-- Search -->
            <div class="col-md-5">
              <div class="input-group">
                <span class="input-group-text bg-transparent">${Icons.get('search', { size: 16 })}</span>
                <input type="text" id="notes-search-input" class="form-control" placeholder="Search notes by title, content, or tags..." value="${Security.escapeHtml(this.currentSearch)}" />
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

      <!-- Notes Content List -->
      <div id="notes-list-container">
        ${notes.length === 0 ? this.renderEmptyState() : this.renderNotesGrid(pinnedNotes, otherNotes)}
      </div>
    `;

    this.bindEvents();
  },

  renderEmptyState() {
    if (this.currentSearch || this.selectedTag) {
      return `
        <div class="card border shadow-sm text-center p-5">
          <div class="text-muted mb-3">${Icons.get('search', { size: 48 })}</div>
          <h5 class="fw-bold mb-2">No matching notes found</h5>
          <p class="text-secondary mb-3">Try adjusting your search terms or selecting a different tag.</p>
          <div>
            <button id="btn-reset-note-filters" class="btn btn-outline-primary btn-sm">Clear Filters</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="card border shadow-sm text-center p-5">
        <div class="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-3">
          ${Icons.get('file-text', { size: 40 })}
        </div>
        <h4 class="fw-bold mb-2">No Notes Yet</h4>
        <p class="text-secondary max-w-md mx-auto mb-4" style="max-width: 480px;">
          Create your first note to store quick thoughts, website checklists, code snippets, or useful reference material 100% locally on your computer.
        </p>
        <div>
          <button id="btn-add-note-empty" class="btn btn-primary d-inline-flex align-items-center gap-2">
            ${Icons.get('plus', { size: 18, color: '#fff' })}
            <span>Create Your First Note</span>
          </button>
        </div>
      </div>
    `;
  },

  renderNotesGrid(pinned, others) {
    let html = '';

    if (pinned.length > 0) {
      html += `
        <div class="mb-4">
          <div class="d-flex align-items-center gap-2 mb-3">
            <span class="text-warning">${Icons.get('pin', { size: 18 })}</span>
            <h6 class="fw-bold text-uppercase small text-muted mb-0">Pinned Notes (${pinned.length})</h6>
          </div>
          <div class="row g-3">
            ${pinned.map(n => this.renderNoteCard(n)).join('')}
          </div>
        </div>
      `;
    }

    if (others.length > 0) {
      if (pinned.length > 0) {
        html += `
          <div class="d-flex align-items-center gap-2 mb-3 mt-4">
            <h6 class="fw-bold text-uppercase small text-muted mb-0">Other Notes (${others.length})</h6>
          </div>
        `;
      }
      html += `
        <div class="row g-3">
          ${others.map(n => this.renderNoteCard(n)).join('')}
        </div>
      `;
    }

    return html;
  },

  renderNoteCard(note) {
    const colorClasses = {
      default: 'border-secondary-subtle',
      blue: 'border-primary border-opacity-50 bg-primary-subtle bg-opacity-10',
      green: 'border-success border-opacity-50 bg-success-subtle bg-opacity-10',
      yellow: 'border-warning border-opacity-50 bg-warning-subtle bg-opacity-10',
      purple: 'border-info border-opacity-50 bg-info-subtle bg-opacity-10',
      rose: 'border-danger border-opacity-50 bg-danger-subtle bg-opacity-10'
    };

    const cardClass = colorClasses[note.color] || colorClasses.default;
    const formattedDate = DateUtils.formatRelative(note.updatedAt || note.createdAt);

    return `
      <div class="col-md-6 col-xl-4" id="note-card-${note.id}">
        <div class="card h-100 shadow-sm border ${cardClass} position-relative transition-all">
          <div class="card-header bg-transparent border-0 pt-3 px-3 pb-1 d-flex align-items-start justify-content-between gap-2">
            <h6 class="fw-bold text-dark mb-0 text-truncate" title="${Security.escapeHtml(note.title)}">
              ${Security.escapeHtml(note.title)}
            </h6>
            <button class="btn btn-sm btn-link p-0 text-decoration-none btn-toggle-pin ${note.isPinned ? 'text-warning' : 'text-muted'}" data-id="${note.id}" title="${note.isPinned ? 'Unpin Note' : 'Pin to top'}">
              ${Icons.get('pin', { size: 16 })}
            </button>
          </div>

          <div class="card-body px-3 py-2">
            <div class="note-card-content text-secondary small" style="white-space: pre-wrap; max-height: 180px; overflow-y: auto; font-size: 0.88rem; line-height: 1.5;">
              ${Security.escapeHtml(note.content || 'No content.')}
            </div>
          </div>

          <div class="card-footer bg-transparent border-0 px-3 pb-3 pt-1">
            <!-- Tags -->
            ${Array.isArray(note.tags) && note.tags.length > 0 ? `
              <div class="d-flex flex-wrap gap-1 mb-2">
                ${note.tags.map(t => `<span class="badge bg-light text-secondary border fw-normal" style="font-size: 0.72rem;">#${Security.escapeHtml(t)}</span>`).join('')}
              </div>
            ` : ''}

            <!-- Bottom Row: Date & Actions -->
            <div class="d-flex align-items-center justify-content-between pt-2 border-top border-light">
              <span class="text-muted" style="font-size: 0.75rem;">${formattedDate}</span>
              <div class="d-flex align-items-center gap-1">
                <button class="btn btn-sm btn-outline-secondary py-1 px-2 btn-copy-note" data-id="${note.id}" title="Copy note text">
                  ${Icons.get('copy', { size: 14 })}
                </button>
                <button class="btn btn-sm btn-outline-secondary py-1 px-2 btn-download-note" data-id="${note.id}" title="Download as .txt file">
                  ${Icons.get('download', { size: 14 })}
                </button>
                <button class="btn btn-sm btn-outline-primary py-1 px-2 btn-edit-note" data-id="${note.id}" title="Edit note">
                  ${Icons.get('edit', { size: 14 })}
                </button>
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

  bindEvents() {
    // Add Note Buttons
    document.getElementById('btn-add-note-top')?.addEventListener('click', () => NoteModal.open());
    document.getElementById('btn-add-note-empty')?.addEventListener('click', () => NoteModal.open());

    // Search Input
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

    // Tag Filter
    document.getElementById('notes-tag-select')?.addEventListener('change', (e) => {
      this.selectedTag = e.target.value;
      this.render();
    });

    // Sort By
    document.getElementById('notes-sort-select')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.render();
    });

    // Card Actions via event delegation
    const container = document.getElementById('notes-list-container');
    container?.addEventListener('click', async (e) => {
      const pinBtn = e.target.closest('.btn-toggle-pin');
      if (pinBtn) {
        const id = pinBtn.getAttribute('data-id');
        await NotesManager.togglePin(id);
        await this.render();
        return;
      }

      const copyBtn = e.target.closest('.btn-copy-note');
      if (copyBtn) {
        const id = copyBtn.getAttribute('data-id');
        const note = await NotesManager.get(id);
        if (note) {
          const textToCopy = `${note.title}\n\n${note.content || ''}`;
          try {
            await navigator.clipboard.writeText(textToCopy);
            Toast.success('Note copied to clipboard!');
          } catch {
            Toast.info('Note copied');
          }
        }
        return;
      }

      const downloadBtn = e.target.closest('.btn-download-note');
      if (downloadBtn) {
        const id = downloadBtn.getAttribute('data-id');
        const note = await NotesManager.get(id);
        if (note) {
          const textContent = `${note.title}\n${'='.repeat(note.title.length)}\nDate: ${new Date(note.createdAt).toLocaleString()}\nTags: ${(note.tags || []).join(', ')}\n\n${note.content || ''}`;
          const safeName = (note.title || 'note').replace(/[^a-z0-9_-]/gi, '_');
          FileUtils.downloadFile(textContent, `${safeName}.txt`, 'text/plain');
          Toast.success(`Note downloaded as ${safeName}.txt`);
        }
        return;
      }

      const editBtn = e.target.closest('.btn-edit-note');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const note = await NotesManager.get(id);
        if (note) {
          NoteModal.open(note);
        }
        return;
      }

      const deleteBtn = e.target.closest('.btn-delete-note');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
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

    // Listen to note changes
    if (!this._hasListener) {
      window.addEventListener('ml-notes-changed', () => {
        const activeRoute = window.location.hash.slice(1).split('/')[0];
        if (activeRoute === 'notes') {
          this.render();
        }
      });
      this._hasListener = true;
    }
  },

  searchTimer: null,
  debouncedSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.render();
    }, 250);
  }
};
