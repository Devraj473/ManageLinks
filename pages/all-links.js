/**
 * ManageLinks - All Links Page
 * Developer: Devraj Chauhan
 * Primary Link Management View: Filters, Sorting, Search, Grid/List/Compact views
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { SearchEngine } from '../assets/js/search.js';
import { LinkCard } from '../components/link-card.js';
import { LinkModal } from '../components/link-modal.js';
import { EmptyState } from '../components/empty-state.js';
import { UI } from '../assets/js/ui.js';
import { Storage } from '../assets/js/storage.js';

export const AllLinksPage = {
  viewMode: 'grid',
  sortBy: 'newest',
  selectedCategory: '',
  selectedFolder: '',
  selectedCollection: '',
  selectedTag: '',
  searchQuery: '',

  async render(param = null) {
    const container = document.getElementById('content-area');
    this.viewMode = Storage.get('defaultView', 'grid');
    this.sortBy = Storage.get('defaultSort', 'newest');

    // Fetch filters data
    const categories = await db.getAll('categories');
    const folders = await db.getAll('folders');
    const collections = await db.getAll('collections');

    container.innerHTML = `
      <!-- Page Header -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">All Links</h2>
          <p class="text-secondary mb-0">Browse, filter, and organize all your saved web resources.</p>
        </div>
        <div class="d-flex gap-2">
          <button id="btn-page-add-link" class="btn-ml-primary">
            ${Icons.get('plus', { size: 16, color: '#fff' })} Add Link
          </button>
        </div>
      </div>

      <!-- Controls & Filter Toolbar -->
      <div class="card border mb-4 shadow-sm">
        <div class="card-body p-3">
          <div class="row g-2 align-items-center">
            <!-- Search bar -->
            <div class="col-12 col-md-4">
              <div class="input-group">
                <span class="input-group-text bg-transparent">${Icons.get('search', { size: 15 })}</span>
                <input type="text" id="filter-search-input" class="form-control" placeholder="Search title, URL, tag..." value="${this.searchQuery}" />
              </div>
            </div>

            <!-- Category filter -->
            <div class="col-6 col-md-2">
              <select id="filter-category" class="form-select">
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c.id}" ${this.selectedCategory === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>

            <!-- Folder filter -->
            <div class="col-6 col-md-2">
              <select id="filter-folder" class="form-select">
                <option value="">All Folders</option>
                ${folders.map(f => `<option value="${f.id}" ${this.selectedFolder === f.id ? 'selected' : ''}>${f.name}</option>`).join('')}
              </select>
            </div>

            <!-- Sort By -->
            <div class="col-6 col-md-2">
              <select id="filter-sort" class="form-select">
                <option value="newest" ${this.sortBy === 'newest' ? 'selected' : ''}>Newest First</option>
                <option value="oldest" ${this.sortBy === 'oldest' ? 'selected' : ''}>Oldest First</option>
                <option value="az" ${this.sortBy === 'az' ? 'selected' : ''}>A &rarr; Z</option>
                <option value="za" ${this.sortBy === 'za' ? 'selected' : ''}>Z &rarr; A</option>
                <option value="most-visited" ${this.sortBy === 'most-visited' ? 'selected' : ''}>Most Visited</option>
                <option value="recently-visited" ${this.sortBy === 'recently-visited' ? 'selected' : ''}>Recently Visited</option>
              </select>
            </div>

            <!-- View Switcher -->
            <div class="col-6 col-md-2 d-flex justify-content-end gap-1">
              <div class="btn-group" role="group">
                <button type="button" class="btn btn-outline-secondary btn-sm ${this.viewMode === 'grid' ? 'active' : ''}" id="btn-view-grid" title="Grid View">
                  ${Icons.get('grid', { size: 16 })}
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm ${this.viewMode === 'list' ? 'active' : ''}" id="btn-view-list" title="List View">
                  ${Icons.get('list', { size: 16 })}
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm ${this.viewMode === 'compact' ? 'active' : ''}" id="btn-view-compact" title="Compact Table View">
                  ${Icons.get('layers', { size: 16 })}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Links Container -->
      <div id="links-display-area">
        <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
      </div>
    `;

    this.bindControls();
    await this.loadLinks();
  },

  bindControls() {
    document.getElementById('btn-page-add-link')?.addEventListener('click', () => LinkModal.openForAdd());

    // Search input
    let timer;
    document.getElementById('filter-search-input')?.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.searchQuery = e.target.value.trim();
        this.loadLinks();
      }, 250);
    });

    // Category filter
    document.getElementById('filter-category')?.addEventListener('change', (e) => {
      this.selectedCategory = e.target.value;
      this.loadLinks();
    });

    // Folder filter
    document.getElementById('filter-folder')?.addEventListener('change', (e) => {
      this.selectedFolder = e.target.value;
      this.loadLinks();
    });

    // Sort order
    document.getElementById('filter-sort')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      Storage.set('defaultSort', this.sortBy);
      this.loadLinks();
    });

    // View mode switchers
    const setView = (mode) => {
      this.viewMode = mode;
      Storage.set('defaultView', mode);
      document.querySelectorAll('#btn-view-grid, #btn-view-list, #btn-view-compact').forEach(btn => btn.classList.remove('active'));
      document.getElementById(`btn-view-${mode}`)?.classList.add('active');
      this.loadLinks();
    };

    document.getElementById('btn-view-grid')?.addEventListener('click', () => setView('grid'));
    document.getElementById('btn-view-list')?.addEventListener('click', () => setView('list'));
    document.getElementById('btn-view-compact')?.addEventListener('click', () => setView('compact'));
  },

  async loadLinks() {
    const displayArea = document.getElementById('links-display-area');
    if (!displayArea) return;

    const categories = await db.getAll('categories');
    const folders = await db.getAll('folders');
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const folderMap = new Map(folders.map(f => [f.id, f.name]));

    const options = {
      isArchived: false,
      sortBy: this.sortBy,
      categoryId: this.selectedCategory || undefined,
      folderId: this.selectedFolder || undefined
    };

    const links = await SearchEngine.search(this.searchQuery, options);

    if (links.length === 0) {
      displayArea.innerHTML = EmptyState.render({
        icon: 'link',
        title: this.searchQuery || this.selectedCategory || this.selectedFolder ? 'No matching links' : 'No links saved yet',
        description: this.searchQuery ? 'Try clearing your search filters or adding a new link.' : 'Get started by saving your first favorite website.',
        actionText: '+ Add Link',
        actionId: 'empty-add-link-btn'
      });
      document.getElementById('empty-add-link-btn')?.addEventListener('click', () => LinkModal.openForAdd());
      return;
    }

    let linksHtml = '';
    const containerClass = this.viewMode === 'grid' ? 'link-grid' : (this.viewMode === 'list' ? 'link-list' : 'link-compact');

    linksHtml = `
      <div class="${containerClass}">
        ${links.map(l => LinkCard.render(l, {
          viewMode: this.viewMode,
          categoryName: l.categoryId ? catMap.get(l.categoryId) : '',
          folderName: l.folderId ? folderMap.get(l.folderId) : '',
          isSelected: UI.selectedIds.has(l.id)
        })).join('')}
      </div>
    `;

    displayArea.innerHTML = linksHtml;
    UI.bindLinkEvents(displayArea, () => this.loadLinks());
  }
};
