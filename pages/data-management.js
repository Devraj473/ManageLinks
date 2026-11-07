/**
 * ManageLinks - Data Management Page
 * Developer: Devraj Chauhan
 * Houses the Complete Backup Center, Restore Wizard, Import Wizard, and Export Center
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { BackupManager } from '../assets/js/backup.js';
import { RestoreManager } from '../assets/js/restore.js';
import { ImportManager } from '../assets/js/import.js';
import { ExportManager } from '../assets/js/export.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { Toast } from '../assets/js/notifications.js';
import { DateUtils } from '../utils/date-utils.js';
import { FileUtils } from '../utils/file-utils.js';
import { Security } from '../assets/js/security.js';
import { AppDownloader } from '../utils/app-downloader.js';

export const DataManagementPage = {
  activeTab: 'backup', // 'backup', 'restore', 'import', 'export'
  stagedRestoreFile: null,
  stagedImportResult: null,

  async render(param = null) {
    if (param && ['backup', 'restore', 'import', 'export'].includes(param)) {
      this.activeTab = param;
    }

    const container = document.getElementById('content-area');
    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Data & Backup Center</h2>
          <p class="text-secondary mb-0">Total control over your data: Export, Backup, Restore, and Import.</p>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-tabs mb-4" id="dataTabs">
        <li class="nav-item">
          <button class="nav-link ${this.activeTab === 'backup' ? 'active' : ''}" data-tab="backup">
            ${Icons.get('download', { size: 16, className: 'me-1' })} Backup Center
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link ${this.activeTab === 'restore' ? 'active' : ''}" data-tab="restore">
            ${Icons.get('refresh-cw', { size: 16, className: 'me-1' })} Restore Wizard
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link ${this.activeTab === 'import' ? 'active' : ''}" data-tab="import">
            ${Icons.get('upload', { size: 16, className: 'me-1' })} Import Center
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link ${this.activeTab === 'export' ? 'active' : ''}" data-tab="export">
            ${Icons.get('share-2', { size: 16, className: 'me-1' })} Export Formats
          </button>
        </li>
      </ul>

      <!-- Tab Content Area -->
      <div id="data-tab-content"></div>
    `;

    this.bindTabSwitching();
    await this.renderActiveTab();
  },

  bindTabSwitching() {
    document.querySelectorAll('#dataTabs .nav-link').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('#dataTabs .nav-link').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeTab = btn.getAttribute('data-tab');
        await this.renderActiveTab();
      });
    });
  },

  async renderActiveTab() {
    const content = document.getElementById('data-tab-content');
    if (!content) return;

    if (this.activeTab === 'backup') await this.renderBackupTab(content);
    else if (this.activeTab === 'restore') await this.renderRestoreTab(content);
    else if (this.activeTab === 'import') await this.renderImportTab(content);
    else if (this.activeTab === 'export') await this.renderExportTab(content);
  },

  // ==========================================
  // 1. BACKUP CENTER
  // ==========================================
  async renderBackupTab(container) {
    const history = await BackupManager.getHistory();
    const preview = await BackupManager.getBackupPreview('complete');

    container.innerHTML = `
      <div class="row g-4">
        <!-- 1-Click Fast Backup Banner -->
        <div class="col-12">
          <div class="card border border-primary-subtle bg-primary-subtle bg-opacity-10 shadow-sm p-4">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h5 class="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
                  ${Icons.get('database', { size: 22, color: 'var(--ml-primary)' })}
                  <span>One-Click Browser Data Backup</span>
                </h5>
                <p class="text-secondary small mb-0">
                  Instantly download all your links, categories, folders, collections, and settings from browser database into a clean JSON file.
                </p>
              </div>
              <button type="button" id="btn-backup-browser-data" class="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2">
                ${Icons.get('download', { size: 18, color: '#fff' })}
                <span>Backup Browser Data</span>
              </button>
            </div>
          </div>
        </div>

        <div class="col-lg-7">
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0">Custom Backup Options</h5>
            </div>
            <div class="card-body">
              <form id="backup-form">
                <div class="mb-3">
                  <label class="form-label fw-semibold">Backup Scope</label>
                  <select class="form-select" id="backup-type">
                    <option value="complete">Complete Backup (Links, Categories, Folders, Collections, Settings)</option>
                    <option value="links-only">Links Only</option>
                    <option value="categories-folders">Categories & Folders Only</option>
                    <option value="favorites-only">Favourites Only</option>
                  </select>
                </div>

                <input type="hidden" id="backupFormat" value="json" />

                <!-- Password Protection Accordion -->
                <div class="accordion mb-4" id="encAccordion">
                  <div class="accordion-item">
                    <h2 class="accordion-header">
                      <button class="accordion-button collapsed py-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseEnc">
                        ${Icons.get('lock', { size: 16, className: 'me-2' })} Password Encryption (Web Crypto PBKDF2 + AES-GCM)
                      </button>
                    </h2>
                    <div id="collapseEnc" class="accordion-collapse collapse" data-bs-parent="#encAccordion">
                      <div class="accordion-body">
                        <p class="small text-muted mb-2">
                          Protect your backup with 256-bit AES-GCM encryption. You will need this password to restore your data on any device.
                        </p>
                        <div class="mb-2">
                          <label for="backupPassword" class="form-label small fw-semibold">Backup Password</label>
                          <input type="password" class="form-control" id="backupPassword" placeholder="Leave empty for unencrypted backup" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Preview Summary Box -->
                <div class="p-3 bg-light rounded border mb-4">
                  <div class="fw-semibold small mb-2">Backup Payload Preview:</div>
                  <div class="d-flex flex-wrap gap-3 small text-secondary">
                    <span><strong>Links:</strong> ${preview.totalLinks}</span>
                    <span><strong>Categories:</strong> ${preview.totalCategories}</span>
                    <span><strong>Folders:</strong> ${preview.totalFolders}</span>
                    <span><strong>Collections:</strong> ${preview.totalCollections}</span>
                    <span><strong>Estimated Size:</strong> ${preview.estimatedSize}</span>
                  </div>
                </div>

                <button type="submit" id="btn-download-backup" class="btn-ml-primary w-100 justify-content-center py-2">
                  ${Icons.get('download', { size: 18, color: '#fff' })} Generate & Download Backup
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Backup History -->
        <div class="col-lg-5">
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
              <h6 class="fw-bold mb-0">Local Backup History</h6>
              ${history.length > 0 ? '<button id="btn-clear-history" class="btn btn-sm btn-link text-danger text-decoration-none p-0">Clear History</button>' : ''}
            </div>
            <div class="card-body p-0">
              ${history.length === 0 
                ? '<div class="text-center text-muted py-4 small">No backup history recorded yet.</div>'
                : `<div class="list-group list-group-flush">
                    ${history.slice(0, 8).map(h => `
                      <div class="list-group-item py-2 px-3">
                        <div class="d-flex align-items-center justify-content-between">
                          <span class="fw-semibold small text-truncate" style="max-width: 180px;">${Security.escapeHtml(h.name)}</span>
                          <span class="badge ${h.isEncrypted ? 'bg-warning-subtle text-warning' : 'bg-secondary-subtle text-secondary'}" style="font-size:0.68rem;">
                            ${h.isEncrypted ? 'Encrypted' : h.format.toUpperCase()}
                          </span>
                        </div>
                        <div class="d-flex justify-content-between text-muted" style="font-size: 0.72rem;">
                          <span>${DateUtils.formatDateTime(h.createdAt)}</span>
                          <span>${h.fileSize || ''}</span>
                        </div>
                      </div>
                    `).join('')}
                   </div>`
              }
            </div>
          </div>

          <!-- Standalone App (.exe) & Portable Offline Tool Package -->
          <div class="card border shadow-sm mt-3 border-primary-subtle bg-primary-subtle bg-opacity-10">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0 text-primary">${Icons.get('monitor', { size: 16, className: 'me-1' })} Standalone Application (.exe)</h6>
            </div>
            <div class="card-body">
              <p class="small text-secondary mb-3">
                Download or share the standalone Windows installer (<code>ManageLinks-Setup.exe</code>). Runs completely offline without any database, web server, or internet connection.
              </p>
              <div class="d-flex flex-column gap-2">
                <button type="button" id="btn-download-app-exe-center" class="btn btn-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2 shadow-sm">
                  ${Icons.get('download', { size: 16, color: '#fff' })}
                  <span class="fw-bold">Download Windows App (.exe)</span>
                </button>
                <button type="button" id="btn-share-app-exe-center" class="btn btn-outline-primary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2">
                  ${Icons.get('share-2', { size: 16 })}
                  <span>Share Application (.exe)</span>
                </button>
                <button type="button" id="btn-download-app-zip-center" class="btn btn-outline-secondary btn-sm w-100 d-inline-flex align-items-center justify-content-center gap-2">
                  ${Icons.get('folder', { size: 16 })}
                  <span>Download Portable Tool (.zip)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // One-click Backup Browser Data
    document.getElementById('btn-backup-browser-data')?.addEventListener('click', async () => {
      try {
        Toast.info('Downloading browser database backup...');
        await BackupManager.backupBrowserData();
        Toast.success('Browser database backup downloaded successfully!');
        await this.renderBackupTab(container);
      } catch (err) {
        Toast.error(`Backup failed: ${err.message}`);
      }
    });

    document.getElementById('backup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = document.getElementById('backup-type').value;
      const format = 'json';
      const password = document.getElementById('backupPassword').value;

      try {
        Toast.info('Generating JSON backup file...');
        await BackupManager.createBackup({ type, format, password });
        Toast.success('Backup file downloaded successfully!');
        await this.renderBackupTab(container);
      } catch (err) {
        Toast.error(`Backup failed: ${err.message}`);
      }
    });

    document.getElementById('btn-download-app-exe-center')?.addEventListener('click', () => {
      AppDownloader.downloadInstallerExe();
    });

    document.getElementById('btn-share-app-exe-center')?.addEventListener('click', () => {
      import('../components/share-modal.js').then(m => m.ShareModal.openForApp());
    });

    document.getElementById('btn-download-app-zip-center')?.addEventListener('click', () => {
      AppDownloader.downloadAppZip();
    });

    document.getElementById('btn-clear-history')?.addEventListener('click', async () => {
      await BackupManager.clearHistory();
      Toast.info('Backup history cleared');
      await this.renderBackupTab(container);
    });
  },

  // ==========================================
  // 2. RESTORE CENTER
  // ==========================================
  async renderRestoreTab(container) {
    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8 mx-auto">
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0">Restoration Wizard</h5>
            </div>
            <div class="card-body">
              <p class="text-secondary small mb-3">
                Upload your ManageLinks database backup file (.json). The wizard will inspect the records, detect duplicates, and let you choose how to merge or replace data.
              </p>

              <!-- File Select Box -->
              <div class="mb-4">
                <label for="restoreFileInput" class="form-label fw-semibold">Select Backup File (.json)</label>
                <input class="form-control" type="file" id="restoreFileInput" accept=".json,.mlb" />
              </div>

              <!-- Password Prompt Box (Hidden initially) -->
              <div id="restorePasswordBox" class="mb-3 p-3 bg-warning-subtle border border-warning-subtle rounded d-none">
                <label for="restorePassword" class="form-label fw-semibold text-warning-emphasis">
                  ${Icons.get('lock', { size: 16 })} This backup is encrypted. Enter password:
                </label>
                <div class="input-group">
                  <input type="password" class="form-control" id="restorePassword" placeholder="Enter encryption password..." />
                  <button type="button" id="btn-submit-decrypt" class="btn btn-warning">Decrypt & Inspect</button>
                </div>
              </div>

              <!-- Inspection Results (Hidden until file parsed) -->
              <div id="restoreInspectionBox" class="d-none">
                <div class="alert alert-info py-2 px-3 mb-3">
                  <div class="fw-semibold">Backup Inspection Succeeded:</div>
                  <div class="small" id="restoreSummaryText"></div>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold">Restoration Mode</label>
                  <select class="form-select" id="restoreMode">
                    <option value="merge">Merge (Preserve existing links, add new records)</option>
                    <option value="replace">Full Replace (Replace entire database with this backup)</option>
                  </select>
                </div>

                <div class="mb-4" id="duplicateHandlingGroup">
                  <label class="form-label fw-semibold">Duplicate Handling Policy</label>
                  <select class="form-select" id="restoreDuplicateAction">
                    <option value="skip">Skip duplicates (Keep existing records)</option>
                    <option value="replace">Replace existing records with backup data</option>
                    <option value="new">Import duplicates as fresh new links</option>
                  </select>
                </div>

                <div class="form-check mb-4">
                  <input class="form-check-input" type="checkbox" id="restoreSafetyBackup" checked>
                  <label class="form-check-label small" for="restoreSafetyBackup">
                    Automatically create safety snapshot before restoring
                  </label>
                </div>

                <button type="button" id="btn-execute-restore" class="btn-ml-primary w-100 justify-content-center py-2">
                  Execute Restoration
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;

    const fileInput = document.getElementById('restoreFileInput');
    const passwordBox = document.getElementById('restorePasswordBox');
    const inspectionBox = document.getElementById('restoreInspectionBox');
    const decryptBtn = document.getElementById('btn-submit-decrypt');

    let currentFile = null;

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      currentFile = file;

      try {
        Toast.info('Inspecting backup file...');
        const result = await RestoreManager.parseBackupFile(file);

        if (result.isEncrypted) {
          passwordBox.classList.remove('d-none');
          inspectionBox.classList.add('d-none');
          this.stagedRestoreFile = result;
          Toast.warning('Backup is encrypted. Please enter the password.');
        } else {
          passwordBox.classList.add('d-none');
          this.displayRestorePreview(result);
        }
      } catch (err) {
        Toast.error(`Validation error: ${err.message}`);
        fileInput.value = '';
      }
    });

    decryptBtn.addEventListener('click', async () => {
      const password = document.getElementById('restorePassword').value;
      if (!password) {
        Toast.error('Please enter a password');
        return;
      }

      try {
        Toast.info('Decrypting with Web Crypto...');
        const result = await RestoreManager.parseBackupFile(currentFile, password);
        passwordBox.classList.add('d-none');
        this.displayRestorePreview(result);
        Toast.success('Decryption successful!');
      } catch (err) {
        Toast.error(err.message);
      }
    });

    document.getElementById('btn-execute-restore')?.addEventListener('click', async () => {
      if (!this.stagedRestoreFile || !this.stagedRestoreFile.data) return;

      const mode = document.getElementById('restoreMode').value;
      const duplicateAction = document.getElementById('restoreDuplicateAction').value;
      const createSafety = document.getElementById('restoreSafetyBackup').checked;

      const ok = await ConfirmationModal.ask({
        title: mode === 'replace' ? 'Confirm Full Database Replacement' : 'Confirm Restoration',
        message: mode === 'replace' 
          ? 'WARNING: This will replace your current links with the backup data. A safety snapshot will be taken.'
          : 'Ready to merge backup records into your library?',
        confirmText: 'Restore Now',
        btnClass: mode === 'replace' ? 'btn-danger' : 'btn-primary'
      });

      if (ok) {
        try {
          Toast.info('Executing restore transaction...');
          const outcome = await RestoreManager.executeRestore(this.stagedRestoreFile.data, {
            mode,
            duplicateAction,
            createSafety
          });

          Toast.success(`Restore finished: Restored ${outcome.restoredLinksCount} link(s)!`);
          await this.renderRestoreTab(container);
        } catch (err) {
          Toast.error(`Restore failed: ${err.message}`);
        }
      }
    });
  },

  displayRestorePreview(result) {
    this.stagedRestoreFile = result;
    const box = document.getElementById('restoreInspectionBox');
    const summary = document.getElementById('restoreSummaryText');

    summary.innerHTML = `
      Found <strong>${result.summary.linksCount}</strong> links, 
      <strong>${result.summary.categoriesCount}</strong> categories, 
      <strong>${result.summary.foldersCount}</strong> folders. 
      Duplicates detected: <strong>${result.duplicates.duplicateLinksCount}</strong>.
    `;
    box.classList.remove('d-none');
  },

  // ==========================================
  // 3. IMPORT CENTER (JSON, CSV, HTML, TXT)
  // ==========================================
  async renderImportTab(container) {
    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8 mx-auto">
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0">Import Bookmarks & URLs</h5>
            </div>
            <div class="card-body">
              <p class="text-secondary small mb-3">
                Import bookmarks from Chrome, Edge, Firefox, or CSV spreadsheets and plain text URL lists.
              </p>

              <div class="mb-3">
                <label class="form-label fw-semibold">Source Format</label>
                <select class="form-select" id="import-format-select">
                  <option value="auto">Auto-detect from file extension</option>
                  <option value="html">Browser Bookmarks HTML (Chrome, Edge, Firefox, Safari)</option>
                  <option value="csv">CSV Spreadsheet (title, url, category, tags...)</option>
                  <option value="txt">Plain Text (1 URL per line)</option>
                  <option value="json">ManageLinks JSON File</option>
                </select>
              </div>

              <div class="mb-4">
                <label for="importFileInput" class="form-label fw-semibold">Choose File to Import</label>
                <input class="form-control" type="file" id="importFileInput" accept=".html,.htm,.csv,.txt,.json" />
              </div>

              <!-- Preview Table of parsed links -->
              <div id="importPreviewArea" class="d-none">
                <div class="alert alert-success py-2 px-3 mb-3 d-flex justify-content-between align-items-center">
                  <span id="importSummaryBadge"></span>
                  <span class="badge bg-light text-dark" id="importDupBadge"></span>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-semibold">Duplicate URL Policy</label>
                  <select class="form-select" id="importDupPolicy">
                    <option value="skip">Skip duplicate links (Recommended)</option>
                    <option value="replace">Update existing link details</option>
                    <option value="all">Import all as separate records</option>
                  </select>
                </div>

                <div class="form-check mb-4">
                  <input class="form-check-input" type="checkbox" id="importAutoFolders" checked>
                  <label class="form-check-label small" for="importAutoFolders">
                    Auto-recreate nested folder hierarchy from browser bookmarks
                  </label>
                </div>

                <button type="button" id="btn-execute-import" class="btn-ml-primary w-100 justify-content-center py-2">
                  Complete Import
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;

    const fileInput = document.getElementById('importFileInput');
    const formatSelect = document.getElementById('import-format-select');
    const previewArea = document.getElementById('importPreviewArea');

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        Toast.info('Parsing import file...');
        const parsed = await ImportManager.parseFile(file, formatSelect.value);
        this.stagedImportResult = parsed;

        document.getElementById('importSummaryBadge').innerHTML = `Detected <strong>${parsed.validCount}</strong> valid links (${parsed.invalidCount} invalid)`;
        document.getElementById('importDupBadge').textContent = `${parsed.duplicatesCount} Duplicates`;

        previewArea.classList.remove('d-none');
        Toast.success(`Parsed ${parsed.validCount} valid links!`);
      } catch (err) {
        Toast.error(`Import parse error: ${err.message}`);
        fileInput.value = '';
      }
    });

    document.getElementById('btn-execute-import')?.addEventListener('click', async () => {
      if (!this.stagedImportResult || !this.stagedImportResult.validItems) return;

      const duplicateHandling = document.getElementById('importDupPolicy').value;
      const autoCreateFolders = document.getElementById('importAutoFolders').checked;

      try {
        Toast.info('Saving imported links...');
        const res = await ImportManager.executeImport(this.stagedImportResult.validItems, {
          duplicateHandling,
          autoCreateFolders
        });

        Toast.success(`Successfully imported ${res.importedCount} links! (${res.skippedCount} skipped)`);
        await this.renderImportTab(container);
      } catch (err) {
        Toast.error(`Import failed: ${err.message}`);
      }
    });
  },

  // ==========================================
  // 4. EXPORT CENTER
  // ==========================================
  async renderExportTab(container) {
    const allLinks = await db.getAll('links');

    container.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-8 mx-auto">
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3">
              <h5 class="fw-bold mb-0">Export Your Library</h5>
            </div>
            <div class="card-body">
              <p class="text-secondary small mb-4">
                Export your saved links into interoperable open formats for spreadsheets, other browsers, or personal archives.
              </p>

              <div class="row g-3">
                <div class="col-md-6">
                  <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 class="fw-bold mb-1">${Icons.get('file-text', { size: 16 })} Browser HTML Bookmarks</h6>
                      <p class="text-muted small mb-3">Compatible with Google Chrome, Microsoft Edge, Mozilla Firefox, and Safari.</p>
                    </div>
                    <button id="exp-html-btn" class="btn btn-sm btn-outline-primary w-100">Export HTML</button>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 class="fw-bold mb-1">${Icons.get('file', { size: 16 })} CSV Spreadsheet</h6>
                      <p class="text-muted small mb-3">Spreadsheet format with title, url, tags, category, notes, and favorite status.</p>
                    </div>
                    <button id="exp-csv-btn" class="btn btn-sm btn-outline-primary w-100">Export CSV</button>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 class="fw-bold mb-1">${Icons.get('code', { size: 16 })} Raw JSON Records</h6>
                      <p class="text-muted small mb-3">Standard JSON array of all link objects for developers and automation scripts.</p>
                    </div>
                    <button id="exp-json-btn" class="btn btn-sm btn-outline-primary w-100">Export JSON</button>
                  </div>
                </div>

                <div class="col-md-6">
                  <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between">
                    <div>
                      <h6 class="fw-bold mb-1">${Icons.get('list', { size: 16 })} Plain URLs Text (.txt)</h6>
                      <p class="text-muted small mb-3">Simple clean list of URLs, 1 link per line. Perfect for curl, wget, or bulk openers.</p>
                    </div>
                    <button id="exp-txt-btn" class="btn btn-sm btn-outline-primary w-100">Export TXT</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('exp-html-btn')?.addEventListener('click', () => ExportManager.exportToHtml(allLinks));
    document.getElementById('exp-csv-btn')?.addEventListener('click', () => ExportManager.exportToCsv(allLinks));
    document.getElementById('exp-json-btn')?.addEventListener('click', () => ExportManager.exportToJson(allLinks));
    document.getElementById('exp-txt-btn')?.addEventListener('click', () => ExportManager.exportToTxt(allLinks));
  }
};
