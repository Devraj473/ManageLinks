/**
 * ManageLinks - Settings Page
 * Developer: Devraj Chauhan
 * Preferences, PIN Protection, Storage Management, and Reset
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { SettingsManager } from '../assets/js/settings.js';
import { Security } from '../assets/js/security.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { Toast } from '../assets/js/notifications.js';
import { FileUtils } from '../utils/file-utils.js';

export const SettingsPage = {
  async render() {
    const container = document.getElementById('content-area');
    const settings = await SettingsManager.getAll();
    const isPinActive = await Security.isPinEnabled();
    const storageEst = await db.getStorageEstimate();

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Application Settings</h2>
          <p class="text-secondary mb-0">Configure your appearance, display preferences, and privacy options.</p>
        </div>
      </div>

      <div class="row g-4">
        <!-- Appearance & Display -->
        <div class="col-lg-6">
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('sun', { size: 16, className: 'me-1' })} Appearance & Display</h6>
            </div>
            <div class="card-body">
              <!-- Theme -->
              <div class="mb-3">
                <label for="setting-theme" class="form-label fw-semibold">Color Theme</label>
                <select class="form-select" id="setting-theme">
                  <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System Default</option>
                  <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light Theme</option>
                  <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark Theme</option>
                </select>
              </div>

              <!-- Default View Mode -->
              <div class="mb-3">
                <label for="setting-view" class="form-label fw-semibold">Default Link View Mode</label>
                <select class="form-select" id="setting-view">
                  <option value="grid" ${settings.defaultView === 'grid' ? 'selected' : ''}>Grid View (Cards)</option>
                  <option value="list" ${settings.defaultView === 'list' ? 'selected' : ''}>List View (Horizontal)</option>
                  <option value="compact" ${settings.defaultView === 'compact' ? 'selected' : ''}>Compact View (Dense Table)</option>
                </select>
              </div>

              <!-- Default Sort -->
              <div class="mb-3">
                <label for="setting-sort" class="form-label fw-semibold">Default Sort Order</label>
                <select class="form-select" id="setting-sort">
                  <option value="newest" ${settings.defaultSort === 'newest' ? 'selected' : ''}>Newest First</option>
                  <option value="oldest" ${settings.defaultSort === 'oldest' ? 'selected' : ''}>Oldest First</option>
                  <option value="az" ${settings.defaultSort === 'az' ? 'selected' : ''}>A &rarr; Z Alphabetical</option>
                  <option value="za" ${settings.defaultSort === 'za' ? 'selected' : ''}>Z &rarr; A Reverse</option>
                  <option value="most-visited" ${settings.defaultSort === 'most-visited' ? 'selected' : ''}>Most Visited</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Security & PIN Lock -->
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('lock', { size: 16, className: 'me-1' })} Security & Privacy</h6>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <div class="fw-semibold">Application PIN Lock</div>
                  <div class="text-muted small">Require numeric PIN code when opening the app</div>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="setting-pin-toggle" ${isPinActive ? 'checked' : ''}>
                </div>
              </div>

              <div id="pin-setup-box" class="p-3 bg-light rounded border ${isPinActive ? 'd-none' : 'd-none'} mb-3">
                <label for="new-pin-input" class="form-label small fw-semibold">Set 4-8 Digit PIN</label>
                <div class="input-group">
                  <input type="password" class="form-control" id="new-pin-input" maxlength="8" placeholder="e.g. 1234" />
                  <button class="btn btn-primary" id="btn-save-pin">Set PIN</button>
                </div>
              </div>

              <div class="mb-3">
                <label for="setting-autolock" class="form-label fw-semibold">Auto-Lock on Inactivity</label>
                <select class="form-select" id="setting-autolock">
                  <option value="0" ${settings.autoLockMinutes === 0 ? 'selected' : ''}>Disabled</option>
                  <option value="5" ${settings.autoLockMinutes === 5 ? 'selected' : ''}>5 Minutes</option>
                  <option value="15" ${settings.autoLockMinutes === 15 ? 'selected' : ''}>15 Minutes</option>
                  <option value="30" ${settings.autoLockMinutes === 30 ? 'selected' : ''}>30 Minutes</option>
                </select>
              </div>

              <p class="text-muted small fst-italic mb-0">
                Note: Browser-based PIN locking locks the interface session using cryptographic hashing. It prevents casual access on shared devices.
              </p>
            </div>
          </div>
        </div>

        <!-- Storage Management & Danger Zone -->
        <div class="col-lg-6">
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('database', { size: 16, className: 'me-1' })} Local Storage Management</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span>IndexedDB Estimated Usage</span>
                  <span>${FileUtils.formatSize(storageEst.usage)}</span>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar bg-primary" role="progressbar" style="width: ${Math.min(storageEst.percentUsed, 100)}%;"></div>
                </div>
                <div class="text-muted mt-1 small">
                  Quota: ${storageEst.quota ? FileUtils.formatSize(storageEst.quota) : 'Device Quota'}
                </div>
              </div>

              <div class="d-flex align-items-center justify-content-between p-3 bg-light rounded border mb-3">
                <div>
                  <div class="fw-semibold small">Persistent Storage Permission</div>
                  <div class="text-muted" style="font-size:0.75rem;">Status: ${storageEst.isPersisted ? 'Granted (Safe from eviction)' : 'Not persistent'}</div>
                </div>
                <button id="btn-request-persist" class="btn btn-sm btn-outline-primary" ${storageEst.isPersisted ? 'disabled' : ''}>
                  ${storageEst.isPersisted ? 'Persisted' : 'Request Persistence'}
                </button>
              </div>

              <div class="d-flex gap-2">
                <a href="#data-management" class="btn btn-sm btn-outline-secondary w-100">Open Backup Center</a>
              </div>
            </div>
          </div>

          <!-- Offline Portability & App Installation -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('monitor', { size: 16, className: 'me-1' })} Offline Installation & App (.exe)</h6>
            </div>
            <div class="card-body">
              <p class="small text-secondary mb-3">
                ManageLinks is 100% serverless. Download the standalone Windows installer (.exe) or install it as a PWA on this device.
              </p>
              <div class="d-flex flex-column gap-2">
                <button type="button" id="settings-download-exe-btn" class="btn btn-primary btn-sm d-flex align-items-center justify-content-center gap-2 shadow-sm">
                  ${Icons.get('download', { size: 16, color: '#fff' })}
                  <span class="fw-bold">Download Windows App (.exe)</span>
                </button>
                <button type="button" id="settings-install-pwa-btn" class="btn btn-outline-success btn-sm d-flex align-items-center justify-content-center gap-2">
                  ${Icons.get('smartphone', { size: 16 })}
                  <span>Install ManageLinks App (PWA)</span>
                </button>
                <button type="button" id="settings-download-zip-btn" class="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center gap-2">
                  ${Icons.get('folder', { size: 16 })}
                  <span>Download Portable Tool (.zip)</span>
                </button>
                <button type="button" id="settings-share-app-btn" class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-2">
                  ${Icons.get('share-2', { size: 16 })}
                  <span>Share App Installer (.exe)</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Danger Zone -->
          <div class="card border border-danger-subtle shadow-sm">
            <div class="card-header bg-danger-subtle text-danger py-3">
              <h6 class="fw-bold mb-0">${Icons.get('alert-triangle', { size: 16, className: 'me-1' })} Danger Zone</h6>
            </div>
            <div class="card-body">
              <p class="text-secondary small mb-3">
                Permanently purge all links, categories, folders, settings, and database tables from this device.
              </p>
              <button id="btn-wipe-database" class="btn btn-danger w-100">
                Purge All Local Data & Reset App
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(isPinActive);
  },

  bindEvents(isPinActive) {
    // Portable & Installation buttons
    document.getElementById('settings-download-exe-btn')?.addEventListener('click', () => {
      import('../utils/app-downloader.js').then(m => m.AppDownloader.downloadInstallerExe());
    });
    document.getElementById('settings-install-pwa-btn')?.addEventListener('click', () => {
      import('../assets/js/pwa-installer.js').then(m => m.PwaInstaller.promptInstall());
    });
    document.getElementById('settings-download-zip-btn')?.addEventListener('click', () => {
      import('../utils/app-downloader.js').then(m => m.AppDownloader.downloadAppZip());
    });
    document.getElementById('settings-share-app-btn')?.addEventListener('click', () => {
      import('../components/share-modal.js').then(m => m.ShareModal.openForApp());
    });

    // Theme change
    document.getElementById('setting-theme')?.addEventListener('change', async (e) => {
      await SettingsManager.set('theme', e.target.value);
      Toast.success('Theme updated');
    });

    // View mode change
    document.getElementById('setting-view')?.addEventListener('change', async (e) => {
      await SettingsManager.set('defaultView', e.target.value);
      Toast.success('Default view mode updated');
    });

    // Sort order change
    document.getElementById('setting-sort')?.addEventListener('change', async (e) => {
      await SettingsManager.set('defaultSort', e.target.value);
      Toast.success('Default sort order updated');
    });

    // PIN toggle
    const pinToggle = document.getElementById('setting-pin-toggle');
    const pinSetupBox = document.getElementById('pin-setup-box');

    pinToggle?.addEventListener('change', async () => {
      if (pinToggle.checked) {
        pinSetupBox.classList.remove('d-none');
        document.getElementById('new-pin-input')?.focus();
      } else {
        await Security.removePin();
        pinSetupBox.classList.add('d-none');
        Toast.info('PIN lock disabled');
      }
    });

    document.getElementById('btn-save-pin')?.addEventListener('click', async () => {
      const pin = document.getElementById('new-pin-input').value.trim();
      if (!pin || pin.length < 4) {
        Toast.error('PIN must be at least 4 digits');
        return;
      }
      await Security.setPin(pin);
      pinSetupBox.classList.add('d-none');
      Toast.success('Application PIN lock set successfully!');
    });

    // Request Persistence
    document.getElementById('btn-request-persist')?.addEventListener('click', async () => {
      const granted = await db.requestPersistence();
      if (granted) {
        Toast.success('Persistent storage granted by browser!');
        await this.render();
      } else {
        Toast.warning('Persistent storage not granted by browser');
      }
    });

    // Wipe Database
    document.getElementById('btn-wipe-database')?.addEventListener('click', async () => {
      const ok = await ConfirmationModal.ask({
        title: 'PERMANENT DATA WIPE',
        message: 'This will DELETE ALL saved bookmarks, categories, and settings from your device. Are you absolutely certain?',
        confirmText: 'Yes, Purge Everything',
        btnClass: 'btn-danger'
      });
      if (ok) {
        await Security.wipeAllData();
        Toast.error('All local data wiped');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
  }
};
