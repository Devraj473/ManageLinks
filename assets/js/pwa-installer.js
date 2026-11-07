/**
 * ManageLinks - PWA Installer & Device Installation Manager
 * Developer: Devraj Chauhan
 * Handles beforeinstallprompt, standalone detection, and guided install modal
 */

import { Toast } from './notifications.js';
import { Icons } from './icons.js';

export const PwaInstaller = {
  deferredPrompt: null,
  isInstalled: false,

  init() {
    // Check if app is running as standalone installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      this.isInstalled = true;
    }

    // Capture install prompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.updateInstallButtons(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.updateInstallButtons(false);
      Toast.success('ManageLinks installed successfully on your device!');
    });
  },

  updateInstallButtons(isReady) {
    document.querySelectorAll('.btn-install-app').forEach(btn => {
      if (isReady && !this.isInstalled) {
        btn.classList.remove('d-none');
      }
    });
  },

  async promptInstall() {
    if (this.isInstalled) {
      Toast.info('ManageLinks is already installed as a standalone app on this device.');
      return;
    }

    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        Toast.success('Installing ManageLinks...');
      }
      this.deferredPrompt = null;
    } else {
      // Show guided instructions for Chrome, Edge, Safari iOS, and Android
      this.showGuidedInstallModal();
    }
  },

  showGuidedInstallModal() {
    let existing = document.getElementById('pwaInstallModal');
    if (existing) existing.remove();

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = `
      <div class="modal fade" id="pwaInstallModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg">
            <div class="modal-header border-bottom py-3 px-4">
              <div class="d-flex align-items-center gap-2">
                <div class="bg-primary text-white p-2 rounded">
                  ${Icons.get('smartphone', { size: 20, color: '#fff' })}
                </div>
                <div>
                  <h5 class="modal-title fw-bold mb-0">Install ManageLinks</h5>
                  <p class="text-secondary small mb-0">100% Offline PWA App on your device</p>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body py-3 px-4">
              ${isIos ? `
                <div class="p-3 bg-light rounded border mb-3">
                  <h6 class="fw-bold mb-2">Install on iOS (iPhone / iPad):</h6>
                  <ol class="small text-secondary ps-3 mb-0">
                    <li class="mb-2">Tap the <strong>Share</strong> button at the bottom of Safari (${Icons.get('share-2', { size: 14 })}).</li>
                    <li class="mb-2">Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> in the top right corner.</li>
                  </ol>
                </div>
              ` : `
                <div class="p-3 bg-light rounded border mb-3">
                  <h6 class="fw-bold mb-2">Install on Desktop (Chrome, Edge, Brave):</h6>
                  <ol class="small text-secondary ps-3 mb-0">
                    <li class="mb-2">Look at the right side of your browser address bar for the <strong>Install</strong> icon (${Icons.get('download', { size: 14 })}).</li>
                    <li class="mb-2">Click <strong>Install ManageLinks</strong>.</li>
                    <li>The app will launch in its own standalone window without browser toolbars.</li>
                  </ol>
                </div>

                <div class="p-3 bg-light rounded border mb-3">
                  <h6 class="fw-bold mb-2">Install on Android:</h6>
                  <ol class="small text-secondary ps-3 mb-0">
                    <li class="mb-2">Tap the three dots menu (<strong>⋮</strong>) in Chrome.</li>
                    <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                  </ol>
                </div>
              `}
              <div class="alert alert-info py-2 px-3 small d-flex align-items-center gap-2 mb-0">
                ${Icons.get('shield', { size: 16, color: '#2563eb' })}
                <span>ManageLinks runs offline with zero server requirements. All data stays strictly on your device.</span>
              </div>
            </div>
            <div class="modal-footer py-2 px-4 border-top bg-light">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv.firstElementChild);
    const bsModal = new bootstrap.Modal(document.getElementById('pwaInstallModal'));
    bsModal.show();
  }
};
