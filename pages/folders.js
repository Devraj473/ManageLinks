/**
 * ManageLinks - Nested Folders Page
 * Developer: Devraj Chauhan
 * Hierarchical Tree with Circular-Safe Movement, Nested Subfolders & Link Listing
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { FolderManager } from '../assets/js/folder-manager.js';
import { FolderModal } from '../components/folder-modal.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { LinkCard } from '../components/link-card.js';
import { EmptyState } from '../components/empty-state.js';
import { UI } from '../assets/js/ui.js';
import { Toast } from '../assets/js/notifications.js';
import { Security } from '../assets/js/security.js';

export const FoldersPage = {
  activeFolderId: null,

  async render(param = null) {
    this.activeFolderId = param;
    const container = document.getElementById('content-area');

    if (this.activeFolderId) {
      await this.renderFolderDetail(this.activeFolderId);
      return;
    }

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Nested Folders</h2>
          <p class="text-secondary mb-0">Deep hierarchical directory structure for your bookmarks.</p>
        </div>
        <div class="d-flex gap-2">
          <button id="btn-create-root-folder" class="btn-ml-primary">
            ${Icons.get('plus', { size: 16, color: '#fff' })} New Folder
          </button>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-12">
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('folder-tree', { size: 18, className: 'me-1' })} Folder Tree</h6>
            </div>
            <div class="card-body p-3" id="folder-tree-container">
              <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-create-root-folder')?.addEventListener('click', () => FolderModal.open());
    await this.loadFolderTree();
  },

  async loadFolderTree() {
    const container = document.getElementById('folder-tree-container');
    if (!container) return;

    const rootNodes = await FolderManager.getFolderTree();
    const linkCounts = await FolderManager.getFolderLinkCounts();

    if (rootNodes.length === 0) {
      container.innerHTML = EmptyState.render({
        icon: 'folder-tree',
        title: 'No Folders Created',
        description: 'Organize bookmarks into deep hierarchies with custom folders.',
        actionText: '+ Create Root Folder',
        actionId: 'empty-folder-btn'
      });
      document.getElementById('empty-folder-btn')?.addEventListener('click', () => FolderModal.open());
      return;
    }

    const renderNode = (node) => {
      const count = linkCounts[node.id] || 0;
      const hasChildren = node.children && node.children.length > 0;

      return `
        <div class="folder-tree-item" data-id="${node.id}">
          <div class="folder-tree-node">
            <span class="tree-toggle-icon text-muted" style="cursor: pointer;">
              ${hasChildren ? Icons.get('chevron-down', { size: 16 }) : Icons.get('folder', { size: 16, color: node.color || '#0284c7' })}
            </span>

            <a href="#folder/${node.id}" class="text-decoration-none fw-semibold text-dark flex-grow-1">
              ${Security.escapeHtml(node.name)}
            </a>

            <span class="badge bg-light text-secondary border me-2">${count} links</span>

            <div class="btn-group btn-group-sm">
              <button class="btn btn-sm btn-outline-secondary py-0 px-2 add-sub-btn" data-id="${node.id}" title="Add Subfolder">
                ${Icons.get('plus', { size: 12 })}
              </button>
              <button class="btn btn-sm btn-outline-secondary py-0 px-2 edit-folder-btn" data-id="${node.id}" title="Edit Folder">
                ${Icons.get('edit', { size: 12 })}
              </button>
              <button class="btn btn-sm btn-outline-danger py-0 px-2 del-folder-btn" data-id="${node.id}" title="Delete Folder">
                ${Icons.get('trash-2', { size: 12 })}
              </button>
            </div>
          </div>

          ${hasChildren ? `
            <div class="folder-children">
              ${node.children.map(renderNode).join('')}
            </div>
          ` : ''}
        </div>
      `;
    };

    container.innerHTML = `
      <div class="folder-tree">
        ${rootNodes.map(renderNode).join('')}
      </div>
    `;

    this.bindTreeEvents();
  },

  bindTreeEvents() {
    // Add subfolder
    document.querySelectorAll('.add-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parentId = btn.getAttribute('data-id');
        FolderModal.open(null, parentId);
      });
    });

    // Edit folder
    document.querySelectorAll('.edit-folder-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        FolderModal.open(id);
      });
    });

    // Delete folder safely
    document.querySelectorAll('.del-folder-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const folder = await FolderManager.getById(id);
        const ok = await ConfirmationModal.ask({
          title: `Delete Folder "${folder.name}"?`,
          message: 'Subfolders and links will be safely moved to the parent directory or root level. No bookmark data will be lost.',
          confirmText: 'Delete Folder',
          btnClass: 'btn-danger'
        });

        if (ok) {
          await FolderManager.safeDelete(id, folder.parentId || null);
          Toast.info('Folder deleted and contents preserved');
          await this.loadFolderTree();
        }
      });
    });
  },

  /**
   * Detail view showing all links in this specific folder
   */
  async renderFolderDetail(folderId) {
    const container = document.getElementById('content-area');
    const folder = await FolderManager.getById(folderId);
    if (!folder) {
      window.location.hash = '#folders';
      return;
    }

    const links = await db.getByIndex('links', 'folderId', folderId);
    const activeLinks = links.filter(l => !l.isArchived);

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <a href="#folders" class="btn-ml-icon" title="Back to Folders">&larr;</a>
            <h2 class="fw-bold mb-0">${Security.escapeHtml(folder.name)}</h2>
          </div>
          <p class="text-secondary mb-0 ms-5">${Security.escapeHtml(folder.description || 'Folder links')}</p>
        </div>
        <div class="d-flex gap-2">
          <button id="btn-folder-add-link" class="btn-ml-primary">
            ${Icons.get('plus', { size: 16, color: '#fff' })} Add to Folder
          </button>
        </div>
      </div>

      <div id="folder-links-list">
        ${activeLinks.length === 0 
          ? EmptyState.render({
              icon: 'link',
              title: 'No links in this folder',
              description: 'Save or move bookmarks to this folder for easy grouping.',
              actionText: '+ Add Link',
              actionId: 'folder-empty-add-btn'
            })
          : `<div class="link-grid">
              ${activeLinks.map(l => LinkCard.render(l, { viewMode: 'grid', folderName: folder.name })).join('')}
             </div>`
        }
      </div>
    `;

    document.getElementById('btn-folder-add-link')?.addEventListener('click', () => {
      import('../components/link-modal.js').then(m => m.LinkModal.openForAdd({ folderId }));
    });
    document.getElementById('folder-empty-add-btn')?.addEventListener('click', () => {
      import('../components/link-modal.js').then(m => m.LinkModal.openForAdd({ folderId }));
    });

    UI.bindLinkEvents(document.getElementById('folder-links-list'), () => this.renderFolderDetail(folderId));
  }
};
