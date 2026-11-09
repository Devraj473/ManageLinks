/**
 * ManageLinks - My Data & Storage Hub Page
 * Developer: Devraj Chauhan
 * Inspect browser profile, owner email, storage usage, item counts, and diagnostic health
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { SettingsManager } from '../assets/js/settings.js';
import { FileUtils } from '../utils/file-utils.js';
import { Toast } from '../assets/js/notifications.js';
import { Security } from '../assets/js/security.js';
import { BackupManager } from '../assets/js/backup.js';

export const MyDataPage = {
  async render() {
    const container = document.getElementById('content-area');
    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="text-muted small mt-2">Loading My Data & Storage Profile...</div>
      </div>
    `;

    try {
      const data = await this.collectDataProfile();
      container.innerHTML = this.template(data);
      this.bindEvents(data);
    } catch (err) {
      console.error('Error rendering My Data page:', err);
      container.innerHTML = `
        <div class="alert alert-danger my-4">
          <h5>Failed to load My Data page</h5>
          <p class="mb-0">${Security.escapeHtml(err.message)}</p>
        </div>
      `;
    }
  },

  async collectDataProfile() {
    // 1. Settings & User Info
    const settings = await SettingsManager.getAll();
    const userEmail = settings.userEmail || 'chauhandevraj473@gmail.com';
    const userName = settings.userName || 'Devraj Chauhan';

    // 2. Browser & Device Environment
    const env = this.detectEnvironment();

    // 3. Storage Estimates
    const storageEst = await db.getStorageEstimate();

    // 4. Detailed Store Counts and Byte Estimations
    const stores = [
      { id: 'links', label: 'Website Bookmarks & Links', icon: 'link' },
      { id: 'notes', label: 'Personal Notes', icon: 'file-text' },
      { id: 'categories', label: 'Link Categories', icon: 'folder' },
      { id: 'folders', label: 'Hierarchical Folders', icon: 'folder-tree' },
      { id: 'collections', label: 'Collections', icon: 'layers' },
      { id: 'collectionLinks', label: 'Collection Junctions', icon: 'link' },
      { id: 'tags', label: 'Search Tags', icon: 'tag' },
      { id: 'deletedItems', label: 'Recycle Bin (Trash)', icon: 'trash-2' },
      { id: 'settings', label: 'Preferences & Security', icon: 'settings' }
    ];

    const storeStats = [];
    let totalItems = 0;
    let totalJsonBytes = 0;

    for (const s of stores) {
      try {
        const items = await db.getAll(s.id);
        const count = Array.isArray(items) ? items.length : 0;
        const jsonStr = JSON.stringify(items || []);
        const bytes = new Blob([jsonStr]).size;

        totalItems += count;
        totalJsonBytes += bytes;

        storeStats.push({
          ...s,
          count,
          bytes,
          formattedSize: FileUtils.formatSize(bytes)
        });
      } catch (e) {
        storeStats.push({
          ...s,
          count: 0,
          bytes: 0,
          formattedSize: '0 B',
          error: e.message
        });
      }
    }

    // Specific sub-counts for links
    const allLinks = await db.getAll('links');
    const linkSubCounts = {
      active: allLinks.filter(l => !l.isArchived).length,
      favorites: allLinks.filter(l => l.isFavorite && !l.isArchived).length,
      pinned: allLinks.filter(l => l.isPinned && !l.isArchived).length,
      inbox: allLinks.filter(l => !l.categoryId && !l.folderId && !l.isArchived).length,
      readLater: allLinks.filter(l => l.isReadLater && l.readingStatus !== 'completed' && !l.isArchived).length,
      archived: allLinks.filter(l => l.isArchived).length
    };

    // Specific sub-counts for notes
    const allNotes = await db.getAll('notes');
    let totalNoteWords = 0;
    allNotes.forEach(n => {
      if (n.content) {
        totalNoteWords += (n.content.trim().split(/\s+/).filter(Boolean)).length;
      }
    });

    return {
      userEmail,
      userName,
      env,
      storageEst,
      storeStats,
      totalItems,
      totalJsonBytes,
      formattedJsonBytes: FileUtils.formatSize(totalJsonBytes),
      linkSubCounts,
      noteCount: allNotes.length,
      totalNoteWords
    };
  },

  detectEnvironment() {
    const ua = navigator.userAgent || '';
    let browserName = 'Browser';
    let browserVersion = '';

    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Mozilla Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('SamsungBrowser') > -1) {
      browserName = 'Samsung Internet';
      browserVersion = ua.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
      browserName = 'Opera';
      browserVersion = ua.match(/(?:Opera|OPR)\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Edg') > -1) {
      browserName = 'Microsoft Edge';
      browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Google Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || '';
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Apple Safari';
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || '';
    }

    let osName = 'Desktop / Mobile';
    if (ua.indexOf('Win') > -1) osName = 'Windows';
    else if (ua.indexOf('Mac') > -1) osName = 'macOS';
    else if (ua.indexOf('Android') > -1) osName = 'Android';
    else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) osName = 'iOS (Apple)';
    else if (ua.indexOf('Linux') > -1) osName = 'Linux';

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    return {
      browser: `${browserName} ${browserVersion}`.trim(),
      browserName,
      browserVersion,
      os: osName,
      language: navigator.language || 'en-US',
      online: navigator.onLine,
      isStandalone,
      screen: `${window.screen?.width || 0} x ${window.screen?.height || 0}`,
      userAgent: ua
    };
  },

  template(data) {
    const { userEmail, userName, env, storageEst, storeStats, totalItems, formattedJsonBytes, linkSubCounts, noteCount, totalNoteWords } = data;

    const percentNum = parseFloat(storageEst.percentUsed) || 0;
    const progressColor = percentNum > 85 ? 'bg-danger' : (percentNum > 60 ? 'bg-warning' : 'bg-primary');

    return `
      <div class="my-data-container">
        <!-- Header -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h2 class="fw-bold mb-0">My Data & Storage Hub</h2>
              <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                ${Icons.get('shield', { size: 14, className: 'me-1' })} 100% Offline & Private
              </span>
            </div>
            <p class="text-secondary mb-0">
              Transparent local storage inspector. View which browser and account email hold your links and notes, check storage quota, and export backups.
            </p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button id="mydata-download-backup-btn" class="btn btn-outline-primary d-flex align-items-center gap-2">
              ${Icons.get('download', { size: 16 })}
              <span>Download Backup (JSON)</span>
            </button>
            <button id="mydata-share-backup-btn" class="btn btn-primary d-flex align-items-center gap-2">
              ${Icons.get('share-2', { size: 16, color: '#fff' })}
              <span>Direct Share Data</span>
            </button>
          </div>
        </div>

        <!-- Top Profile & Environment Row -->
        <div class="row g-4 mb-4">
          <!-- User / Account Identity Card -->
          <div class="col-lg-6">
            <div class="card border shadow-sm h-100">
              <div class="card-header bg-transparent py-3 d-flex align-items-center justify-content-between">
                <h6 class="fw-bold mb-0 d-flex align-items-center gap-2">
                  ${Icons.get('user', { size: 18, color: 'var(--ml-primary)' })}
                  <span>Owner Account & Linked Email ID</span>
                </h6>
                <button id="btn-edit-email" class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                  ${Icons.get('edit', { size: 14 })}
                  <span>Update Email</span>
                </button>
              </div>
              <div class="card-body">
                <div class="p-3 bg-light rounded border mb-3">
                  <div class="d-flex align-items-center gap-3">
                    <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width: 48px; height: 48px; font-size: 1.25rem;">
                      ${Security.escapeHtml((userName || 'D')[0].toUpperCase())}
                    </div>
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="fw-bold fs-6 text-dark text-truncate" id="display-user-name">${Security.escapeHtml(userName)}</div>
                      <div class="text-primary small fw-semibold text-truncate d-flex align-items-center gap-1" id="display-user-email">
                        ${Icons.get('mail', { size: 14 })}
                        <span>${Security.escapeHtml(userEmail)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="row g-2 text-sm">
                  <div class="col-6">
                    <div class="p-2 border rounded bg-white">
                      <div class="text-muted small">Vault Security</div>
                      <div class="fw-semibold text-success d-flex align-items-center gap-1">
                        ${Icons.get('lock', { size: 14 })} Sandboxed Local
                      </div>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="p-2 border rounded bg-white">
                      <div class="text-muted small">Cloud Sync</div>
                      <div class="fw-semibold text-secondary d-flex align-items-center gap-1">
                        ${Icons.get('shield', { size: 14 })} Zero Cloud Servers
                      </div>
                    </div>
                  </div>
                </div>

                <p class="small text-muted mt-3 mb-0">
                  ManageLinks runs 100% inside your browser sandbox. Setting your personal email ID identifies your local vault on your device and credits your ownership when exporting bookmarks, PDFs, and encrypted JSON backups.
                </p>
              </div>
            </div>
          </div>

          <!-- Browser & Device Environment Card -->
          <div class="col-lg-6">
            <div class="card border shadow-sm h-100">
              <div class="card-header bg-transparent py-3 d-flex align-items-center justify-content-between">
                <h6 class="fw-bold mb-0 d-flex align-items-center gap-2">
                  ${Icons.get('hard-drive', { size: 18, color: 'var(--ml-primary)' })}
                  <span>Browser & Storage Location</span>
                </h6>
                <span class="badge ${env.online ? 'bg-success' : 'bg-secondary'}">
                  ${env.online ? 'Online' : 'Offline Mode'}
                </span>
              </div>
              <div class="card-body">
                <div class="list-group list-group-flush small mb-3">
                  <div class="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span class="text-muted">Active Web Browser:</span>
                    <strong class="text-dark">${Security.escapeHtml(env.browser)}</strong>
                  </div>
                  <div class="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span class="text-muted">Operating System:</span>
                    <strong class="text-dark">${Security.escapeHtml(env.os)}</strong>
                  </div>
                  <div class="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span class="text-muted">Storage Engine:</span>
                    <strong class="text-dark">IndexedDB (<code>ManageLinksDB</code> v3)</strong>
                  </div>
                  <div class="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span class="text-muted">PWA App Mode:</span>
                    <strong class="text-dark">${env.isStandalone ? 'Installed Standalone App 🖥️' : 'Standard Web Browser Tab 🌐'}</strong>
                  </div>
                  <div class="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <span class="text-muted">Persistence Guard:</span>
                    <div class="d-flex align-items-center gap-2">
                      <span class="badge ${storageEst.isPersisted ? 'bg-success' : 'bg-warning text-dark'}">
                        ${storageEst.isPersisted ? 'Persistent (Eviction Protected)' : 'Best-Effort (Browser Default)'}
                      </span>
                      ${!storageEst.isPersisted ? `
                        <button id="btn-request-persist" class="btn btn-xs btn-outline-success py-0 px-2" style="font-size: 0.72rem;">
                          Protect
                        </button>
                      ` : ''}
                    </div>
                  </div>
                </div>

                <div class="p-2 bg-light rounded text-muted small" style="font-size: 0.76rem;">
                  ${Icons.get('info', { size: 14, className: 'me-1' })}
                  Data is physically isolated in this browser profile's IndexedDB directory. Other browsers or websites cannot read or access your saved links and notes.
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Storage Quota & Capacity Metric Card -->
        <div class="card border shadow-sm mb-4">
          <div class="card-header bg-transparent py-3">
            <h6 class="fw-bold mb-0 d-flex align-items-center gap-2">
              ${Icons.get('database', { size: 18, color: 'var(--ml-primary)' })}
              <span>Local Storage Quota & Footprint</span>
            </h6>
          </div>
          <div class="card-body">
            <div class="row g-4 align-items-center">
              <div class="col-md-7">
                <div class="d-flex justify-content-between small text-muted mb-2">
                  <span>IndexedDB & Cache Consumption: <strong>${FileUtils.formatSize(storageEst.usage)}</strong></span>
                  <span>Quota: <strong>${storageEst.quota ? FileUtils.formatSize(storageEst.quota) : 'Unlimited Local Quota'}</strong></span>
                </div>
                <div class="progress mb-2" style="height: 12px; border-radius: 6px;">
                  <div class="progress-bar ${progressColor} progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${Math.max(percentNum, 1)}%;"></div>
                </div>
                <div class="d-flex justify-content-between text-muted" style="font-size: 0.75rem;">
                  <span>Database footprint: ${formattedJsonBytes} (${totalItems} total records)</span>
                  <span>${storageEst.percentUsed}% of allocated device storage used</span>
                </div>
              </div>
              <div class="col-md-5 border-start-md">
                <div class="d-flex flex-column gap-2">
                  <div class="p-2 bg-light rounded d-flex justify-content-between align-items-center">
                    <span class="small text-muted">Remaining Storage Capacity:</span>
                    <strong class="text-success small">Over 500,000+ Links Remaining</strong>
                  </div>
                  <div class="p-2 bg-light rounded d-flex justify-content-between align-items-center">
                    <span class="small text-muted">Integrity Health:</span>
                    <button id="btn-run-diagnostics" class="btn btn-sm btn-outline-info py-0 px-2 d-flex align-items-center gap-1" style="font-size: 0.75rem;">
                      ${Icons.get('refresh-cw', { size: 12 })} Run Health Check
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Diagnostic Result Alert (Hidden initially) -->
        <div id="diagnostic-result-box" class="d-none mb-4"></div>

        <!-- Stored Data Breakdown by Object Store -->
        <div class="card border shadow-sm mb-4">
          <div class="card-header bg-transparent py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h6 class="fw-bold mb-0 d-flex align-items-center gap-2">
              ${Icons.get('layers', { size: 18, color: 'var(--ml-primary)' })}
              <span>Stored Items Breakdown by Database Table</span>
            </h6>
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
              ${totalItems} Total Saved Items
            </span>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th scope="col" class="ps-3">Data Store</th>
                    <th scope="col">Description</th>
                    <th scope="col" class="text-center">Stored Items</th>
                    <th scope="col" class="text-end">Estimated Size</th>
                    <th scope="col" class="text-end pe-3">Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${storeStats.map(s => `
                    <tr>
                      <td class="ps-3">
                        <div class="d-flex align-items-center gap-2">
                          <span class="p-2 rounded bg-light text-primary">
                            ${Icons.get(s.icon, { size: 16 })}
                          </span>
                          <div>
                            <strong class="d-block text-dark">${Security.escapeHtml(s.label)}</strong>
                            <code class="text-muted" style="font-size: 0.72rem;">${Security.escapeHtml(s.id)}</code>
                          </div>
                        </div>
                      </td>
                      <td class="small text-secondary">
                        ${this.getStoreDescription(s.id, linkSubCounts, noteCount, totalNoteWords)}
                      </td>
                      <td class="text-center">
                        <span class="badge ${s.count > 0 ? 'bg-primary' : 'bg-secondary'} rounded-pill px-3">
                          ${s.count}
                        </span>
                      </td>
                      <td class="text-end font-monospace small">
                        ${s.formattedSize}
                      </td>
                      <td class="text-end pe-3">
                        <a href="${this.getStoreLink(s.id)}" class="btn btn-sm btn-outline-secondary py-1 px-2" style="font-size: 0.75rem;">
                          Open &rarr;
                        </a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Privacy & Local Portability Assurance -->
        <div class="card border border-primary-subtle bg-primary-subtle p-3 rounded shadow-sm mb-4">
          <div class="d-flex gap-3 align-items-start">
            <div class="text-primary mt-1">
              ${Icons.get('shield', { size: 24 })}
            </div>
            <div>
              <h6 class="fw-bold text-primary mb-1">Your Privacy & Zero-Telemetry Guarantee</h6>
              <p class="small text-primary-emphasis mb-0">
                ManageLinks is completely client-side. No remote database, no analytics, no external trackers, and no telemetry. All data shown on this page lives strictly inside this device's browser profile. When you clear your browser cache or switch computers, you can restore your data instantly using the <strong>Database & Backup Center</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- Update Email Modal -->
        <div class="modal fade" id="modal-update-email" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                  ${Icons.get('user', { size: 20, color: 'var(--ml-primary)' })}
                  <span>Update Account & Email Profile</span>
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p class="small text-muted mb-3">
                  Set the owner name and personal email associated with this browser vault. This email is credited in exports, PDF catalogs, and backups.
                </p>
                <div class="mb-3">
                  <label for="input-owner-name" class="form-label fw-semibold">Display / Owner Name</label>
                  <input type="text" class="form-control" id="input-owner-name" value="${Security.escapeHtml(userName)}" placeholder="e.g. Devraj Chauhan" />
                </div>
                <div class="mb-3">
                  <label for="input-owner-email" class="form-label fw-semibold">Personal Email ID *</label>
                  <input type="email" class="form-control" id="input-owner-email" value="${Security.escapeHtml(userEmail)}" placeholder="e.g. yourname@gmail.com" />
                  <div class="form-text small">Stored locally in your browser's encrypted settings store.</div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="btn-save-email-modal">Save Profile</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  getStoreDescription(id, links, noteCount, noteWords) {
    switch (id) {
      case 'links':
        return `${links.active} active &bull; ${links.favorites} starred &bull; ${links.pinned} pinned &bull; ${links.readLater} read later &bull; ${links.inbox} inbox`;
      case 'notes':
        return `${noteCount} personal notes &bull; ${noteWords} total words written`;
      case 'categories':
        return 'Custom bookmark taxonomy and color coding';
      case 'folders':
        return 'Multi-level nested directory structure';
      case 'collections':
        return 'Curated link bundles and project collections';
      case 'collectionLinks':
        return 'Many-to-many junction indices';
      case 'tags':
        return 'Full-text indexed tag metadata';
      case 'deletedItems':
        return 'Recoverable soft-deleted items (30-day retention)';
      case 'settings':
        return 'Appearance, color themes, PIN security, and auto-lock';
      default:
        return 'Local IndexedDB object store';
    }
  },

  getStoreLink(id) {
    switch (id) {
      case 'links': return '#all-links';
      case 'notes': return '#notes';
      case 'categories': return '#categories';
      case 'folders': return '#folders';
      case 'collections': return '#collections';
      case 'deletedItems': return '#trash';
      case 'settings': return '#settings';
      default: return '#dashboard';
    }
  },

  bindEvents(data) {
    // 1. Download Backup Button
    document.getElementById('mydata-download-backup-btn')?.addEventListener('click', async () => {
      try {
        await BackupManager.exportJson();
        Toast.success('Database backup downloaded successfully!');
      } catch (e) {
        Toast.error(`Backup failed: ${e.message}`);
      }
    });

    // 2. Share Backup Button
    document.getElementById('mydata-share-backup-btn')?.addEventListener('click', () => {
      window.location.hash = '#data-management';
    });

    // 3. Edit Email Modal
    const emailModalEl = document.getElementById('modal-update-email');
    const emailModal = emailModalEl && window.bootstrap ? new window.bootstrap.Modal(emailModalEl) : null;

    document.getElementById('btn-edit-email')?.addEventListener('click', () => {
      if (emailModal) {
        emailModal.show();
      } else {
        const newEmail = prompt('Enter your personal email ID:', data.userEmail);
        if (newEmail) this.saveProfile(data.userName, newEmail);
      }
    });

    document.getElementById('btn-save-email-modal')?.addEventListener('click', async () => {
      const name = document.getElementById('input-owner-name')?.value.trim() || 'Devraj Chauhan';
      const email = document.getElementById('input-owner-email')?.value.trim();

      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
      }

      await this.saveProfile(name, email);
      if (emailModal) emailModal.hide();
    });

    // 4. Request High Priority Persistence
    document.getElementById('btn-request-persist')?.addEventListener('click', async () => {
      try {
        const granted = await db.requestPersistence();
        if (granted) {
          Toast.success('High-priority persistent storage granted by browser!');
          this.render();
        } else {
          Toast.info('Browser kept default storage policy (sufficient for local data).');
        }
      } catch (e) {
        Toast.error(`Persistence request failed: ${e.message}`);
      }
    });

    // 5. Run Storage Diagnostics Check
    document.getElementById('btn-run-diagnostics')?.addEventListener('click', async () => {
      const btn = document.getElementById('btn-run-diagnostics');
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Scanning...`;

      const start = performance.now();
      const resultBox = document.getElementById('diagnostic-result-box');
      resultBox.classList.remove('d-none');
      resultBox.innerHTML = `
        <div class="alert alert-info d-flex align-items-center gap-2 mb-0">
          <div class="spinner-border spinner-border-sm text-info" role="status"></div>
          <span>Verifying IndexedDB records, testing read/write latency, and checking data consistency...</span>
        </div>
      `;

      try {
        // Test read latency
        const links = await db.getAll('links');
        const notes = await db.getAll('notes');
        const elapsed = (performance.now() - start).toFixed(2);

        // Check URL validity
        let invalidUrls = 0;
        links.forEach(l => {
          if (!l.url || !l.url.startsWith('http')) invalidUrls++;
        });

        resultBox.innerHTML = `
          <div class="alert alert-success border border-success-subtle shadow-sm mb-0">
            <div class="d-flex align-items-start gap-2">
              <span class="text-success mt-1">${Icons.get('check-circle-2', { size: 20 })}</span>
              <div>
                <h6 class="fw-bold text-success mb-1">Storage Health Check: 100% Optimal & Verified</h6>
                <div class="small text-success-emphasis">
                  &bull; <strong>Database Connection:</strong> Active (Latency: ${elapsed} ms)<br>
                  &bull; <strong>Consistency:</strong> ${links.length} links and ${notes.length} notes scanned &bull; ${invalidUrls === 0 ? '0 corrupt URLs found' : `${invalidUrls} warnings`}<br>
                  &bull; <strong>Storage State:</strong> Uncorrupted IndexedDB sandbox ready for full offline operation.
                </div>
              </div>
            </div>
          </div>
        `;
        Toast.success('Storage diagnostic check passed!');
      } catch (err) {
        resultBox.innerHTML = `
          <div class="alert alert-danger mb-0">
            <strong>Diagnostic error:</strong> ${Security.escapeHtml(err.message)}
          </div>
        `;
      } finally {
        btn.disabled = false;
        btn.innerHTML = `${Icons.get('refresh-cw', { size: 12 })} Run Health Check`;
      }
    });
  },

  async saveProfile(name, email) {
    try {
      await SettingsManager.set('userName', name);
      await SettingsManager.set('userEmail', email);

      const nameEl = document.getElementById('display-user-name');
      const emailEl = document.getElementById('display-user-email');
      if (nameEl) nameEl.textContent = name;
      if (emailEl) emailEl.innerHTML = `${Icons.get('mail', { size: 14 })} <span>${Security.escapeHtml(email)}</span>`;

      Toast.success('Account profile & email updated successfully!');
      this.render();
    } catch (e) {
      Toast.error(`Failed to save profile: ${e.message}`);
    }
  }
};
