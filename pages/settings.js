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
                  <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System Default (Auto Manage Dark/Light)</option>
                  <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light Theme</option>
                  <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark Theme</option>
                </select>
                <div class="form-text small">System Default automatically matches your computer or phone's operating system appearance.</div>
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
          <!-- Local Storage Overview -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('database', { size: 16, className: 'me-1' })} Local Storage Overview</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <div class="d-flex justify-content-between small text-muted mb-1">
                  <span>IndexedDB Estimated Usage</span>
                  <span class="fw-bold">${FileUtils.formatSize(storageEst.usage)}</span>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar bg-primary" role="progressbar" style="width: ${Math.min(storageEst.percentUsed, 100)}%;"></div>
                </div>
                <div class="text-muted mt-2 small">
                  Device Storage Quota: ${storageEst.quota ? FileUtils.formatSize(storageEst.quota) : 'Unlimited Local Device Storage'}
                </div>
              </div>
              <p class="small text-secondary mb-0">
                All your links, categories, folders, collections, notes, and preferences are stored 100% inside your browser's local IndexedDB sandbox. No external servers or cloud accounts.
              </p>
            </div>
          </div>

          <!-- Application & Data Hub Navigation -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('grid', { size: 16, className: 'me-1' })} Data & Application Hub</h6>
            </div>
            <div class="card-body">
              <p class="small text-secondary mb-3">
                Quick access to complete data backup, restoration, software sharing, installation, and application details.
              </p>
              <div class="d-flex flex-column gap-2">
                <!-- My Data & Storage Hub -->
                <a href="#my-data" class="btn btn-outline-primary d-flex align-items-center justify-content-between py-2 px-3 text-decoration-none">
                  <div class="d-flex align-items-center gap-2">
                    ${Icons.get('hard-drive', { size: 18, color: 'var(--ml-primary)' })}
                    <div class="text-start">
                      <div class="fw-bold fs-6 text-dark">My Data & Storage Profile</div>
                      <div class="text-muted small" style="font-size: 0.72rem;">View linked email, browser storage location, quota & item details</div>
                    </div>
                  </div>
                  <span class="text-primary">&rarr;</span>
                </a>

                <!-- Backup & Data -->
                <a href="#data-management" class="btn btn-primary d-flex align-items-center justify-content-between py-2 px-3 text-decoration-none">
                  <div class="d-flex align-items-center gap-2">
                    ${Icons.get('database', { size: 18, color: '#fff' })}
                    <div class="text-start">
                      <div class="fw-bold fs-6 text-white">Database & Backup Center</div>
                      <div class="small text-white-50" style="font-size: 0.72rem;">One-click backup, restore wizard, import & export</div>
                    </div>
                  </div>
                  <span>&rarr;</span>
                </a>

                <!-- Share Live App -->
                <button type="button" id="settings-share-app-btn" class="btn btn-outline-primary d-flex align-items-center justify-content-between py-2 px-3 text-start">
                  <div class="d-flex align-items-center gap-2">
                    ${Icons.get('share-2', { size: 18 })}
                    <div>
                      <div class="fw-bold">Share Live Application</div>
                      <div class="text-muted small" style="font-size: 0.72rem;">Share live link via WhatsApp, Telegram, Email, or System Share</div>
                    </div>
                  </div>
                  <span>&rarr;</span>
                </button>

                <!-- Install App -->
                <button type="button" id="settings-install-pwa-btn" class="btn btn-outline-success d-flex align-items-center justify-content-between py-2 px-3 text-start">
                  <div class="d-flex align-items-center gap-2">
                    ${Icons.get('smartphone', { size: 18 })}
                    <div>
                      <div class="fw-bold">Install Application (PWA)</div>
                      <div class="text-muted small" style="font-size: 0.72rem;">Install native Progressive Web App on desktop or mobile</div>
                    </div>
                  </div>
                  <span>&rarr;</span>
                </button>

                <!-- About & Policies -->
                <a href="#about" class="btn btn-outline-secondary d-flex align-items-center justify-content-between py-2 px-3 text-decoration-none text-start">
                  <div class="d-flex align-items-center gap-2">
                    ${Icons.get('info', { size: 18 })}
                    <div>
                      <div class="fw-bold text-dark">About ManageLinks by Devraj Chauhan</div>
                      <div class="text-muted small" style="font-size: 0.72rem;">Privacy policy, storage details, terms & developer contact</div>
                    </div>
                  </div>
                  <span class="text-secondary">&rarr;</span>
                </a>
              </div>
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

    // Auto-Lock on Inactivity change
    document.getElementById('setting-autolock')?.addEventListener('change', async (e) => {
      const minutes = parseInt(e.target.value, 10);
      await SettingsManager.set('autoLockMinutes', minutes);
      Security.initInactivityTracker(minutes);
      Toast.success(minutes > 0 ? `Auto-lock set to ${minutes} minutes of inactivity` : 'Auto-lock disabled');
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
  }
};
