/**
 * ManageLinks - Recently Deleted (Trash) Page
 * Developer: Devraj Chauhan
 * Safety net allowing full restoration or permanent purge
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { LinkManager } from '../assets/js/link-manager.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { EmptyState } from '../components/empty-state.js';
import { Toast } from '../assets/js/notifications.js';
import { DateUtils } from '../utils/date-utils.js';
import { Security } from '../assets/js/security.js';

export const TrashPage = {
  async render() {
    const container = document.getElementById('content-area');

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Recently Deleted</h2>
          <p class="text-secondary mb-0">Recover accidentally removed links and categories, or permanently purge them.</p>
        </div>
        <div>
          <button id="btn-empty-trash" class="btn btn-outline-danger d-inline-flex align-items-center gap-1">
            ${Icons.get('trash-2', { size: 16 })} Empty Trash
          </button>
        </div>
      </div>

      <div id="trash-items-area">
        <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
      </div>
    `;

    document.getElementById('btn-empty-trash')?.addEventListener('click', async () => {
      const items = await db.getAll('deletedItems');
      if (items.length === 0) {
        Toast.info('Trash is already empty');
        return;
      }
      const ok = await ConfirmationModal.ask({
        title: 'Empty Trash Permanently?',
        message: `This will permanently delete all ${items.length} items from your device. This action cannot be undone.`,
        confirmText: 'Empty Trash',
        btnClass: 'btn-danger'
      });
      if (ok) {
        await LinkManager.emptyTrash();
        Toast.info('Trash emptied permanently');
        await this.loadTrash();
      }
    });

    await this.loadTrash();
  },

  async loadTrash() {
    const area = document.getElementById('trash-items-area');
    if (!area) return;

    const items = await db.getAll('deletedItems');
    items.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    if (items.length === 0) {
      area.innerHTML = EmptyState.render({
        icon: 'trash-2',
        title: 'Trash is Empty',
        description: 'Items deleted from your workspace will appear here before permanent deletion.',
      });
      return;
    }

    area.innerHTML = `
      <div class="card border shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width: 100px;">Type</th>
                <th>Title / Name</th>
                <th>Deleted On</th>
                <th class="text-end" style="width: 180px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => {
                const title = item.data?.title || item.data?.name || 'Untitled Item';
                const url = item.data?.url || '';
                return `
                  <tr data-id="${item.id}">
                    <td>
                      <span class="badge bg-secondary-subtle text-secondary text-uppercase" style="font-size:0.7rem;">
                        ${item.type}
                      </span>
                    </td>
                    <td>
                      <div class="fw-semibold text-dark">${Security.escapeHtml(title)}</div>
                      ${url ? `<div class="text-muted small">${Security.escapeHtml(url)}</div>` : ''}
                    </td>
                    <td class="text-muted small">
                      ${DateUtils.formatDateTime(item.deletedAt)}
                    </td>
                    <td class="text-end">
                      <button class="btn btn-sm btn-outline-success py-1 px-2 trash-restore-btn me-1" data-id="${item.id}" title="Restore">
                        Restore
                      </button>
                      <button class="btn btn-sm btn-outline-danger py-1 px-2 trash-perm-btn" data-id="${item.id}" title="Delete Forever">
                        Purge
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.bindTrashActions();
  },

  bindTrashActions() {
    // Restore
    document.querySelectorAll('.trash-restore-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          await LinkManager.restoreFromTrash(id);
          Toast.success('Item restored successfully!');
          await this.loadTrash();
        }
      });
    });

    // Permanent delete
    document.querySelectorAll('.trash-perm-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          const ok = await ConfirmationModal.ask({
            title: 'Delete Permanently?',
            message: 'Are you sure you want to delete this record forever?',
            confirmText: 'Delete Forever',
            btnClass: 'btn-danger'
          });
          if (ok) {
            await LinkManager.permanentDeleteTrash(id);
            Toast.info('Item permanently deleted');
            await this.loadTrash();
          }
        }
      });
    });
  }
};
