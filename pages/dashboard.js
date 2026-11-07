/**
 * ManageLinks - Dashboard Page
 * Developer: Devraj Chauhan
 * Calculates live metrics from IndexedDB; No hardcoded values
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { Analytics } from '../assets/js/analytics.js';
import { LinkCard } from '../components/link-card.js';
import { LinkModal } from '../components/link-modal.js';
import { CategoryModal } from '../components/category-modal.js';
import { FolderModal } from '../components/folder-modal.js';
import { CollectionModal } from '../components/collection-modal.js';
import { ExportManager } from '../assets/js/export.js';
import { FileUtils } from '../utils/file-utils.js';
import { DateUtils } from '../utils/date-utils.js';

export const DashboardPage = {
  async render() {
    const container = document.getElementById('content-area');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

    const metrics = await Analytics.getMetrics();
    const storageEst = await db.getStorageEstimate();
    const backupHistory = await db.getAll('backupHistory');
    const lastBackup = backupHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;

    const html = `
      <!-- Welcome Banner -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Welcome to ManageLinks</h2>
          <p class="text-secondary mb-0">Your Links. Your Categories. Your Control. Offline & Private.</p>
        </div>
        <div class="d-flex gap-2">
          <button id="dash-btn-add-link" class="btn-ml-primary">
            ${Icons.get('plus', { size: 16, color: '#fff' })} Add Link
          </button>
          <a href="#data-management" class="btn-ml-secondary">
            ${Icons.get('download', { size: 16 })} Backup Center
          </a>
        </div>
      </div>

      <!-- Live Statistics Cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-4 col-xl-2">
          <div class="stat-card">
            <div>
              <div class="stat-label">Total Links</div>
              <div class="stat-value text-primary">${metrics.activeLinks}</div>
            </div>
            <div class="stat-icon bg-primary-subtle text-primary">
              ${Icons.get('link', { size: 24 })}
            </div>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="stat-card">
            <div>
              <div class="stat-label">Inbox</div>
              <div class="stat-value text-warning">${metrics.inboxCount}</div>
            </div>
            <div class="stat-icon bg-warning-subtle text-warning">
              ${Icons.get('inbox', { size: 24 })}
            </div>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="stat-card">
            <div>
              <div class="stat-label">Favourites</div>
              <div class="stat-value text-warning">${metrics.favoriteCount}</div>
            </div>
            <div class="stat-icon bg-warning-subtle text-warning">
              ${Icons.get('star', { size: 24 })}
            </div>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="stat-card">
            <div>
              <div class="stat-label">Categories</div>
              <div class="stat-value text-info">${metrics.totalCategories}</div>
            </div>
            <div class="stat-icon bg-info-subtle text-info">
              ${Icons.get('folder', { size: 24 })}
            </div>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="stat-card">
            <div>
              <div class="stat-label">Folders</div>
              <div class="stat-value text-success">${metrics.totalFolders}</div>
            </div>
            <div class="stat-icon bg-success-subtle text-success">
              ${Icons.get('folder-tree', { size: 24 })}
            </div>
          </div>
        </div>

        <div class="col-6 col-md-4 col-xl-2">
          <div class="stat-card">
            <div>
              <div class="stat-label">Collections</div>
              <div class="stat-value text-indigo" style="color: #6366f1;">${metrics.totalCollections}</div>
            </div>
            <div class="stat-icon bg-light text-primary">
              ${Icons.get('layers', { size: 24 })}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="card border mb-4 shadow-sm">
        <div class="card-body p-3">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h6 class="fw-bold mb-0">${Icons.get('sliders', { size: 16, className: 'me-1' })} Quick Actions</h6>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button id="qa-add-link" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1">
              ${Icons.get('plus', { size: 14 })} Add Link
            </button>
            <button id="qa-add-category" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
              ${Icons.get('folder', { size: 14 })} Create Category
            </button>
            <button id="qa-add-folder" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
              ${Icons.get('folder-tree', { size: 14 })} Create Folder
            </button>
            <button id="qa-add-collection" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
              ${Icons.get('layers', { size: 14 })} Create Collection
            </button>
            <a href="#data-management" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
              ${Icons.get('upload', { size: 14 })} Import Bookmarks
            </a>
            <button id="qa-quick-export" class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1">
              ${Icons.get('download', { size: 14 })} Export Backup
            </button>
          </div>
        </div>
      </div>

      <!-- Two-Column Layout for Recents & Storage Overview -->
      <div class="row g-4 mb-4">
        <!-- Recently Added Links -->
        <div class="col-lg-8">
          <div class="card border shadow-sm h-100">
            <div class="card-header bg-transparent d-flex align-items-center justify-content-between py-3">
              <h6 class="fw-bold mb-0">${Icons.get('link', { size: 16, className: 'me-1' })} Recently Added Links</h6>
              <a href="#all-links" class="small text-decoration-none fw-semibold">View All (${metrics.activeLinks}) &rarr;</a>
            </div>
            <div class="card-body p-0">
              ${metrics.recentlyAdded.length === 0 
                ? '<div class="text-center text-muted py-5">No links added yet. Click "+ Add Link" to save your first website!</div>'
                : `<div class="link-compact border-0">
                    ${metrics.recentlyAdded.map(l => LinkCard.renderCompact(l, {})).join('')}
                   </div>`
              }
            </div>
          </div>
        </div>

        <!-- System & Storage Status -->
        <div class="col-lg-4">
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('database', { size: 16, className: 'me-1' })} Storage & Backup Status</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span>IndexedDB Estimated Usage</span>
                  <span>${FileUtils.formatSize(storageEst.usage)}</span>
                </div>
                <div class="progress" style="height: 6px;">
                  <div class="progress-bar bg-primary" role="progressbar" style="width: ${Math.min(storageEst.percentUsed, 100)}%;"></div>
                </div>
                <div class="d-flex justify-content-between mt-1 text-muted" style="font-size: 0.72rem;">
                  <span>Quota: ${storageEst.quota ? FileUtils.formatSize(storageEst.quota) : 'Device Quota'}</span>
                  <span>${storageEst.isPersisted ? 'Storage Persisted' : 'Transient'}</span>
                </div>
              </div>

              <hr class="my-2" />

              <div class="mb-2">
                <div class="small fw-semibold">Last Backup:</div>
                <div class="text-muted small">
                  ${lastBackup ? `${DateUtils.formatDateTime(lastBackup.createdAt)} (${lastBackup.fileSize || 'Standard'})` : 'No backup created yet'}
                </div>
              </div>

              <div class="mt-3">
                <a href="#data-management" class="btn btn-sm btn-outline-primary w-100">
                  Open Backup Center
                </a>
              </div>
            </div>
          </div>

          <!-- Category Distribution Snapshot -->
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0">${Icons.get('folder', { size: 16, className: 'me-1' })} Top Categories</h6>
              <a href="#categories" class="small text-decoration-none fw-semibold">Manage &rarr;</a>
            </div>
            <div class="card-body p-2">
              ${metrics.categoryCounts.length === 0
                ? '<div class="text-center text-muted py-3 small">No categories used yet</div>'
                : metrics.categoryCounts.slice(0, 5).map(cat => `
                    <div class="d-flex align-items-center justify-content-between py-2 px-2 border-bottom">
                      <span class="small fw-medium">${cat.name}</span>
                      <span class="badge bg-light text-dark border">${cat.count} links</span>
                    </div>
                  `).join('')
              }
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.bindEvents();
  },

  bindEvents() {
    // Quick action buttons
    document.getElementById('dash-btn-add-link')?.addEventListener('click', () => LinkModal.openForAdd());
    document.getElementById('qa-add-link')?.addEventListener('click', () => LinkModal.openForAdd());
    document.getElementById('qa-add-category')?.addEventListener('click', () => CategoryModal.open());
    document.getElementById('qa-add-folder')?.addEventListener('click', () => FolderModal.open());
    document.getElementById('qa-add-collection')?.addEventListener('click', () => CollectionModal.open());

    document.getElementById('qa-quick-export')?.addEventListener('click', async () => {
      await ExportManager.exportToJson();
    });

    // Link card click handlers
    document.querySelectorAll('.action-open-link').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (id) {
          const { LinkManager } = await import('../assets/js/link-manager.js');
          await LinkManager.recordVisit(id);
        }
      });
    });

    document.querySelectorAll('.action-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) LinkModal.openForEdit(id);
      });
    });
  }
};
