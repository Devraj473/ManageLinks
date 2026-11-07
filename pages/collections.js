/**
 * ManageLinks - Collections Page
 * Developer: Devraj Chauhan
 * Cross-category Project and Topic Collections
 */

import { Icons } from '../assets/js/icons.js';
import { CollectionManager } from '../assets/js/collection-manager.js';
import { CollectionModal } from '../components/collection-modal.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { LinkCard } from '../components/link-card.js';
import { EmptyState } from '../components/empty-state.js';
import { UI } from '../assets/js/ui.js';
import { Toast } from '../assets/js/notifications.js';
import { Security } from '../assets/js/security.js';

export const CollectionsPage = {
  activeCollectionId: null,

  async render(param = null) {
    this.activeCollectionId = param;
    const container = document.getElementById('content-area');

    if (this.activeCollectionId) {
      await this.renderCollectionDetail(this.activeCollectionId);
      return;
    }

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Collections</h2>
          <p class="text-secondary mb-0">Project-based link groupings that span across categories.</p>
        </div>
        <div class="d-flex gap-2">
          <button id="btn-create-collection" class="btn-ml-primary">
            ${Icons.get('plus', { size: 16, color: '#fff' })} New Collection
          </button>
        </div>
      </div>

      <div id="collections-grid-area">
        <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
      </div>
    `;

    document.getElementById('btn-create-collection')?.addEventListener('click', () => CollectionModal.open());
    await this.loadCollections();
  },

  async loadCollections() {
    const area = document.getElementById('collections-grid-area');
    if (!area) return;

    const collections = await CollectionManager.getAll();
    const linkCounts = await CollectionManager.getLinkCounts();

    if (collections.length === 0) {
      area.innerHTML = EmptyState.render({
        icon: 'layers',
        title: 'No Collections Created',
        description: 'Group links from any category into project boards (e.g. "MCA Study Resources", "AI Research").',
        actionText: '+ New Collection',
        actionId: 'empty-col-btn'
      });
      document.getElementById('empty-col-btn')?.addEventListener('click', () => CollectionModal.open());
      return;
    }

    area.innerHTML = `
      <div class="collection-grid">
        ${collections.map(c => {
          const count = linkCounts[c.id] || 0;
          return `
            <div class="collection-card" data-id="${c.id}">
              <div class="color-stripe" style="background-color: ${c.coverColor || '#6366f1'};"></div>
              
              <div class="d-flex align-items-start justify-content-between mb-2 mt-1">
                <div class="d-flex align-items-center gap-2">
                  <div class="p-2 rounded" style="background-color: ${c.coverColor}20; color: ${c.coverColor};">
                    ${Icons.get(c.icon || 'layers', { size: 20 })}
                  </div>
                  <div>
                    <h5 class="fw-bold mb-0">${Security.escapeHtml(c.name)}</h5>
                    <span class="text-muted small">${count} links</span>
                  </div>
                </div>

                <div class="dropdown">
                  <button class="link-action-btn" data-bs-toggle="dropdown" title="Collection options">
                    ${Icons.get('more-vertical', { size: 16 })}
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size: 0.85rem;">
                    <li><button class="dropdown-item col-edit-btn" data-id="${c.id}">Edit Collection</button></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger col-del-btn" data-id="${c.id}">Delete Collection</button></li>
                  </ul>
                </div>
              </div>

              <p class="text-secondary small mb-3 flex-grow-1">
                ${Security.escapeHtml(c.description || 'No description.')}
              </p>

              <div class="d-flex align-items-center justify-content-between pt-2 border-top">
                <a href="#collection/${c.id}" class="btn btn-sm btn-outline-primary py-1 px-3">
                  Open Collection (${count})
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.bindCollectionActions();
  },

  bindCollectionActions() {
    // Edit
    document.querySelectorAll('.col-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) CollectionModal.open(id);
      });
    });

    // Delete
    document.querySelectorAll('.col-del-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!id) return;

        const col = await CollectionManager.getById(id);
        const ok = await ConfirmationModal.ask({
          title: `Delete Collection "${col.name}"?`,
          message: 'Deleting this collection does not delete your saved links. It only removes this grouping.',
          confirmText: 'Delete Collection',
          btnClass: 'btn-danger'
        });

        if (ok) {
          await CollectionManager.delete(id);
          Toast.info('Collection deleted');
          await this.loadCollections();
        }
      });
    });
  },

  async renderCollectionDetail(collectionId) {
    const container = document.getElementById('content-area');
    const collection = await CollectionManager.getById(collectionId);
    if (!collection) {
      window.location.hash = '#collections';
      return;
    }

    const links = await CollectionManager.getLinks(collectionId);
    const activeLinks = links.filter(l => !l.isArchived);

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <a href="#collections" class="btn-ml-icon" title="Back to Collections">&larr;</a>
            <h2 class="fw-bold mb-0">${Security.escapeHtml(collection.name)}</h2>
          </div>
          <p class="text-secondary mb-0 ms-5">${Security.escapeHtml(collection.description || 'Collection links')}</p>
        </div>
      </div>

      <div id="collection-links-list">
        ${activeLinks.length === 0 
          ? EmptyState.render({
              icon: 'layers',
              title: 'No links in this collection yet',
              description: 'You can add links to this collection from the Add/Edit Link form.',
            })
          : `<div class="link-grid">
              ${activeLinks.map(l => LinkCard.render(l, { viewMode: 'grid' })).join('')}
             </div>`
        }
      </div>
    `;

    UI.bindLinkEvents(document.getElementById('collection-links-list'), () => this.renderCollectionDetail(collectionId));
  }
};
