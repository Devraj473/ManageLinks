/**
 * ManageLinks - About Page
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';

export const AboutPage = {
  render() {
    const container = document.getElementById('content-area');

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8 mx-auto">
          <!-- Main Hero Box -->
          <div class="card border shadow-sm text-center p-4 mb-4">
            <div class="d-inline-flex p-3 rounded-3 bg-primary text-white mx-auto mb-3 shadow">
              ${Icons.get('bookmark', { size: 36, color: '#fff' })}
            </div>
            <h2 class="fw-bold mb-1">ManageLinks</h2>
            <div class="text-primary fw-semibold mb-2">Your Links. Your Categories. Your Control.</div>
            <p class="text-secondary max-w-lg mx-auto mb-3">
              Personal, privacy-first offline Progressive Web Application (PWA) for managing, organizing, backing up, and restoring web links across all your personal devices.
            </p>
            <div class="d-flex justify-content-center gap-2">
              <span class="badge bg-primary-subtle text-primary px-3 py-2">v1.0.0 Production</span>
              <span class="badge bg-success-subtle text-success px-3 py-2">100% Offline-First</span>
              <span class="badge bg-secondary-subtle text-secondary px-3 py-2">Zero Tracking</span>
            </div>
          </div>

          <!-- Developer & Tech Specs -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">Developer & Architecture</h6>
            </div>
            <div class="card-body">
              <div class="row g-3">
                <div class="col-sm-6">
                  <div class="text-muted small">Lead Developer & Architect</div>
                  <div class="fw-bold fs-6">Devraj Chauhan</div>
                </div>
                <div class="col-sm-6">
                  <div class="text-muted small">Application Type</div>
                  <div class="fw-bold fs-6">Progressive Web App (PWA)</div>
                </div>
                <div class="col-sm-6">
                  <div class="text-muted small">Storage Engine</div>
                  <div class="fw-bold fs-6">IndexedDB (ManageLinksDB v1)</div>
                </div>
                <div class="col-sm-6">
                  <div class="text-muted small">Cryptography</div>
                  <div class="fw-bold fs-6">Web Crypto API (PBKDF2 + AES-GCM)</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Privacy Commitment -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('shield', { size: 16, className: 'me-1' })} Strict Privacy Guarantee</h6>
            </div>
            <div class="card-body">
              <p class="small text-secondary mb-2">
                ManageLinks is built entirely client-side. It does not possess a backend server, user database, analytics trackers, or third-party advertising scripts.
              </p>
              <ul class="small text-secondary mb-0 ps-3">
                <li>All bookmarks and notes remain strictly inside your device's browser IndexedDB storage.</li>
                <li>No automated network requests are ever made to scrape or inspect external URLs.</li>
                <li>Backups can be strongly encrypted with your own master password before exporting.</li>
              </ul>
            </div>
          </div>

          <!-- Cross Device Portability Guide -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('share-2', { size: 16, className: 'me-1' })} Cross-Device Portability</h6>
            </div>
            <div class="card-body">
              <p class="small text-secondary mb-3">
                Because ManageLinks works 100% offline without storing your data on third-party cloud servers, each installation maintains its own secure local data. To transfer your links between PC, laptop, or phone:
              </p>
              <ol class="small text-secondary mb-0 ps-3">
                <li class="mb-1">Go to <strong>Data & Backup Center</strong> and click <strong>Generate & Download Backup</strong>.</li>
                <li class="mb-1">Transfer the downloaded backup file (.json or .zip) via USB, Bluetooth, local Wi-Fi, or private storage.</li>
                <li class="mb-1">Open ManageLinks on your target device.</li>
                <li class="mb-1">Navigate to <strong>Restore Wizard</strong>, select your backup file, and choose <strong>Merge</strong> or <strong>Replace</strong>.</li>
              </ol>
            </div>
          </div>

          <!-- Keyboard Shortcuts Reference -->
          <div class="card border shadow-sm mb-4">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('sliders', { size: 16, className: 'me-1' })} Keyboard Shortcuts</h6>
            </div>
            <div class="card-body p-0">
              <table class="table table-sm table-hover mb-0" style="font-size: 0.85rem;">
                <tbody>
                  <tr>
                    <td class="ps-3 py-2"><kbd>Ctrl</kbd> + <kbd>K</kbd></td>
                    <td>Open Global Instant Search dialog</td>
                  </tr>
                  <tr>
                    <td class="ps-3 py-2"><kbd>Ctrl</kbd> + <kbd>N</kbd></td>
                    <td>Add New Link modal</td>
                  </tr>
                  <tr>
                    <td class="ps-3 py-2"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd></td>
                    <td>Create New Category</td>
                  </tr>
                  <tr>
                    <td class="ps-3 py-2"><kbd>Ctrl</kbd> + <kbd>B</kbd></td>
                    <td>Open Backup Center</td>
                  </tr>
                  <tr>
                    <td class="ps-3 py-2"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd></td>
                    <td>Open Favourites</td>
                  </tr>
                  <tr>
                    <td class="ps-3 py-2"><kbd>/</kbd></td>
                    <td>Focus Search bar</td>
                  </tr>
                  <tr>
                    <td class="ps-3 py-2"><kbd>Esc</kbd></td>
                    <td>Close active dialog or modal</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    `;
  }
};
