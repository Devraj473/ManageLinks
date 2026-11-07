/**
 * ManageLinks - Categories Page
 * Developer: Devraj Chauhan
 * Category CRUD, Cards, Reassign Links on Delete, Category Filtered View
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { CategoryManager } from '../assets/js/category-manager.js';
import { CategoryModal } from '../components/category-modal.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { LinkCard } from '../components/link-card.js';
import { EmptyState } from '../components/empty-state.js';
import { UI } from '../assets/js/ui.js';
import { Toast } from '../assets/js/notifications.js';
import { Security } from '../assets/js/security.js';

export const CategoriesPage = {
  activeCategoryId: null,

  async render(param = null) {
    this.activeCategoryId = param;
    const container = document.getElementById('content-area');

    if (this.activeCategoryId) {
      await this.renderCategoryDetail(this.activeCategoryId);
      return;
    }

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Categories</h2>
          <p class="text-secondary mb-0">Organize your bookmarks by subject and domain.</p>
        </div>
        <div class="d-flex gap-2">
          <button id="btn-create-category" class="btn-ml-primary">
            ${Icons.get('plus', { size: 16, color: '#fff' })} New Category
          </button>
        </div>
      </div>

      <div id="categories-grid-area">
        <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
      </div>
    `;

    document.getElementById('btn-create-category')?.addEventListener('click', () => CategoryModal.open());
    await this.loadCategories();
  },

  async loadCategories() {
    const area = document.getElementById('categories-grid-area');
    if (!area) return;

    const categories = await CategoryManager.getAll();
    const allLinks = await db.getAll('links');

    // Count links per category
    const countMap = {};
    allLinks.forEach(l => {
      if (l.categoryId && !l.isArchived) {
        countMap[l.categoryId] = (countMap[l.categoryId] || 0) + 1;
      }
    });

    if (categories.length === 0) {
      area.innerHTML = EmptyState.render({
        icon: 'folder',
        title: 'No Categories Found',
        description: 'Create your first category to group related links.',
        actionText: '+ New Category',
        actionId: 'empty-cat-btn'
      });
      document.getElementById('empty-cat-btn')?.addEventListener('click', () => CategoryModal.open());
      return;
    }

    area.innerHTML = `
      <div class="category-grid">
        ${categories.map(c => {
          const count = countMap[c.id] || 0;
          return `
            <div class="category-card" data-id="${c.id}">
              <div class="color-stripe" style="background-color: ${c.color || '#2563eb'};"></div>
              
              <div class="d-flex align-items-start justify-content-between mb-2 mt-1">
                <div class="d-flex align-items-center gap-2">
                  <div class="p-2 rounded" style="background-color: ${c.color}20; color: ${c.color};">
                    ${Icons.get(c.icon || 'folder', { size: 20 })}
                  </div>
                  <div>
                    <h5 class="fw-bold mb-0">${Security.escapeHtml(c.name)}</h5>
                    <span class="text-muted small">${count} links</span>
                  </div>
                </div>

                <div class="dropdown">
                  <button class="link-action-btn" data-bs-toggle="dropdown" title="Category options">
                    ${Icons.get('more-vertical', { size: 16 })}
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size: 0.85rem;">
                    <li><button class="dropdown-item cat-edit-btn" data-id="${c.id}">Edit Category</button></li>
                    <li><button class="dropdown-item cat-star-btn" data-id="${c.id}">${c.isFavorite ? 'Remove Favourite' : 'Mark Favourite'}</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger cat-del-btn" data-id="${c.id}">Delete Category</button></li>
                  </ul>
                </div>
              </div>

              <p class="text-secondary small mb-3 flex-grow-1">
                ${Security.escapeHtml(c.description || 'No description.')}
              </p>

              <div class="d-flex align-items-center justify-content-between pt-2 border-top">
                <a href="#category/${c.id}" class="btn btn-sm btn-outline-primary py-1 px-3">
                  View Links (${count})
                </a>
                ${c.isFavorite ? Icons.get('star', { size: 16, color: '#f59e0b' }) : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindCategoryActions();
  },

  bindCategoryActions() {
    // Edit
    document.querySelectorAll('.cat-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) CategoryModal.open(id);
      });
    });

    // Star
    document.querySelectorAll('.cat-star-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          await CategoryManager.toggleFavorite(id);
          Toast.success('Category updated');
          await this.loadCategories();
        }
      });
    });

    // Safe Delete
    document.querySelectorAll('.cat-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;

        const cat = await CategoryManager.getById(id);
        const links = await db.getByIndex('links', 'categoryId', id);

        const ok = await ConfirmationModal.ask({
          title: `Delete Category "${cat.name}"?`,
          message: links.length > 0
            ? `This category contains ${links.length} link(s). Deleting it will safely move all links to the Unassigned Inbox.`
            : 'Are you sure you want to delete this category?',
          confirmText: 'Delete Category',
          btnClass: 'btn-danger'
        });

        if (ok) {
          await CategoryManager.safeDelete(id, null);
          Toast.info('Category deleted and links preserved in Inbox');
          await this.loadCategories();
        }
      });
    });
  },

  /**
   * Detail view showing all links in a single category
   */
  async renderCategoryDetail(categoryId) {
    const container = document.getElementById('content-area');
    const category = await CategoryManager.getById(categoryId);
    if (!category) {
      window.location.hash = '#categories';
      return;
    }

    const links = await db.getByIndex('links', 'categoryId', categoryId);
    const activeLinks = links.filter(l => !l.isArchived);

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <a href="#categories" class="btn-ml-icon" title="Back to Categories">&larr;</a>
            <h2 class="fw-bold mb-0">${Security.escapeHtml(category.name)}</h2>
          </div>
          <p class="text-secondary mb-0 ms-5">${Security.escapeHtml(category.description || 'Category links collection')}</p>
        </div>
        <div class="d-flex gap-2">
          <button id="btn-cat-pdf-export" class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" title="Export this Category as Clickable PDF">
            ${Icons.get('file-text', { size: 16, color: '#dc2626' })}
            <span>Export Category PDF</span>
          </button>
          <button id="btn-cat-add-link" class="btn-ml-primary">
            ${Icons.get('plus', { size: 16, color: '#fff' })} Add to Category
          </button>
        </div>
      </div>

      <div id="cat-links-list">
        ${activeLinks.length === 0 
          ? EmptyState.render({
              icon: 'link',
              title: 'No links in this category',
              description: 'Add bookmarks to this category using the button above.',
              actionText: '+ Add Link',
              actionId: 'cat-empty-add-btn'
            })
          : `<div class="link-grid">
              ${activeLinks.map(l => LinkCard.render(l, { viewMode: 'grid', categoryName: category.name })).join('')}
             </div>`
        }
      </div>
    `;

    document.getElementById('btn-cat-pdf-export')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ml-open-pdf-modal', {
        detail: {
          scope: 'category-id',
          categoryId: category.id,
          title: `${category.name} Bookmarks`
        }
      }));
    });
    document.getElementById('btn-cat-add-link')?.addEventListener('click', () => {
      import('../components/link-modal.js').then(m => m.LinkModal.openForAdd({ categoryId }));
    });
    document.getElementById('cat-empty-add-btn')?.addEventListener('click', () => {
      import('../components/link-modal.js').then(m => m.LinkModal.openForAdd({ categoryId }));
    });

    UI.bindLinkEvents(document.getElementById('cat-links-list'), () => this.renderCategoryDetail(categoryId));
  }
};
