/**
 * ManageLinks - UI Helpers & Common Card Action Bindings
 * Developer: Devraj Chauhan
 */

import { LinkManager } from './link-manager.js';
import { Toast } from './notifications.js';
import { UrlUtils } from '../utils/url-utils.js';
import { LinkModal } from '../components/link-modal.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';

export const UI = {
  selectedIds: new Set(),
  activeRefreshCallback: null,

  /**
   * Bind event delegation for all link card actions on a container
   */
  bindLinkEvents(container, refreshCallback) {
    this.activeRefreshCallback = refreshCallback;

    // 1. Open Link
    container.querySelectorAll('.action-open-link').forEach(el => {
      el.addEventListener('click', async (e) => {
        const id = el.getAttribute('data-id');
        if (id) {
          await LinkManager.recordVisit(id);
        }
      });
    });

    // 2. Star / Favorite
    container.querySelectorAll('.action-star').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          const updated = await LinkManager.toggleFavorite(id);
          Toast.success(updated.isFavorite ? 'Added to Favourites' : 'Removed from Favourites');
          if (refreshCallback) refreshCallback();
        }
      });
    });

    // 3. Pin to Top
    container.querySelectorAll('.action-pin').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          const updated = await LinkManager.togglePin(id);
          Toast.success(updated.isPinned ? 'Link Pinned' : 'Link Unpinned');
          if (refreshCallback) refreshCallback();
        }
      });
    });

    // 4. Read Later Toggle
    container.querySelectorAll('.action-readlater').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          const updated = await LinkManager.toggleReadLater(id);
          Toast.success(updated.isReadLater ? 'Added to Read Later' : 'Removed from Read Later');
          if (refreshCallback) refreshCallback();
        }
      });
    });

    // 5. Copy Formats
    container.querySelectorAll('.action-copy').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const format = btn.getAttribute('data-format') || 'url';
        const card = btn.closest('[data-id]');
        const link = card ? await (await import('./database.js')).db.get('links', id) : null;

        if (link) {
          const textToCopy = UrlUtils.formatCopy(format, link.title, link.url);
          try {
            await navigator.clipboard.writeText(textToCopy);
            Toast.success(`Copied (${format}) to clipboard!`);
          } catch {
            // Fallback for older contexts
            const ta = document.createElement('textarea');
            ta.value = textToCopy;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            Toast.success(`Copied to clipboard!`);
          }
        }
      });
    });

    // 6. Edit Link
    container.querySelectorAll('.action-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) LinkModal.openForEdit(id);
      });
    });

    // 7. Delete (Soft delete to trash)
    container.querySelectorAll('.action-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          const ok = await ConfirmationModal.ask({
            title: 'Delete Link',
            message: 'Move this link to Recently Deleted (Trash)? You can restore it anytime.',
            confirmText: 'Move to Trash',
            btnClass: 'btn-danger'
          });
          if (ok) {
            await LinkManager.softDeleteLink(id);
            Toast.info('Link moved to trash');
            if (refreshCallback) refreshCallback();
          }
        }
      });
    });

    // 8. Archive / Unarchive
    container.querySelectorAll('.action-archive').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          const updated = await LinkManager.toggleArchive(id);
          Toast.info(updated.isArchived ? 'Link archived' : 'Link restored from archive');
          if (refreshCallback) refreshCallback();
        }
      });
    });

    // 9. Duplicate Link
    container.querySelectorAll('.action-duplicate').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (id) {
          const existing = await (await import('./database.js')).db.get('links', id);
          if (existing) {
            const copy = { ...existing, id: null, title: `${existing.title} (Copy)` };
            await LinkManager.createLink(copy);
            Toast.success('Link duplicated successfully');
            if (refreshCallback) refreshCallback();
          }
        }
      });
    });

    // 10. Checkboxes for bulk selection
    container.querySelectorAll('.link-select-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = cb.getAttribute('data-id');
        if (cb.checked) {
          this.selectedIds.add(id);
        } else {
          this.selectedIds.delete(id);
        }
        this.updateBulkBar();
      });
    });
  },

  /**
   * Render or update the Floating Bulk Action Bar
   */
  updateBulkBar() {
    let bar = document.getElementById('bulk-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'bulk-bar';
      document.body.appendChild(bar);
    }

    const count = this.selectedIds.size;
    if (count === 0) {
      bar.classList.remove('visible');
      return;
    }

    bar.classList.add('visible');
    bar.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-primary text-white rounded-pill px-2 py-1">${count}</span>
        <span class="fw-semibold">Selected</span>
      </div>

      <div class="d-flex align-items-center gap-1 ms-3">
        <button id="bulk-btn-favorite" class="btn btn-sm btn-light py-1 px-2" title="Mark as Favorite">
          Star
        </button>
        <button id="bulk-btn-archive" class="btn btn-sm btn-light py-1 px-2" title="Archive Links">
          Archive
        </button>
        <button id="bulk-btn-delete" class="btn btn-sm btn-danger py-1 px-2" title="Delete Links">
          Delete
        </button>
        <button id="bulk-btn-clear" class="btn btn-sm btn-outline-light py-1 px-2 ms-2" title="Clear selection">
          Cancel
        </button>
      </div>
    `;

    document.getElementById('bulk-btn-favorite').onclick = async () => {
      await LinkManager.bulkFavorite(Array.from(this.selectedIds), true);
      Toast.success(`Updated ${count} links`);
      this.clearSelection();
      if (this.activeRefreshCallback) this.activeRefreshCallback();
    };

    document.getElementById('bulk-btn-archive').onclick = async () => {
      await LinkManager.bulkArchive(Array.from(this.selectedIds), true);
      Toast.info(`Archived ${count} links`);
      this.clearSelection();
      if (this.activeRefreshCallback) this.activeRefreshCallback();
    };

    document.getElementById('bulk-btn-delete').onclick = async () => {
      const ok = await ConfirmationModal.ask({
        title: 'Delete Selected Links',
        message: `Are you sure you want to move ${count} selected link(s) to trash?`,
        confirmText: 'Delete All',
        btnClass: 'btn-danger'
      });
      if (ok) {
        await LinkManager.bulkDelete(Array.from(this.selectedIds));
        Toast.info(`Moved ${count} links to trash`);
        this.clearSelection();
        if (this.activeRefreshCallback) this.activeRefreshCallback();
      }
    };

    document.getElementById('bulk-btn-clear').onclick = () => {
      this.clearSelection();
    };
  },

  clearSelection() {
    this.selectedIds.clear();
    document.querySelectorAll('.link-select-checkbox').forEach(cb => { cb.checked = false; });
    this.updateBulkBar();
  }
};
