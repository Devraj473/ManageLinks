/**
 * ManageLinks - Data & Backup Center
 * Developer: Devraj Chauhan
 * Unified single-page hub for Database Backup, Direct Share, Restore Wizard, Import, and Export
 */

import { Icons } from '../assets/js/icons.js';
import { db, generateId } from '../assets/js/database.js';
import { BackupManager } from '../assets/js/backup.js';
import { RestoreManager } from '../assets/js/restore.js';
import { ImportManager } from '../assets/js/import.js';
import { ExportManager } from '../assets/js/export.js';
import { ConfirmationModal } from '../components/confirmation-modal.js';
import { ShareModal } from '../components/share-modal.js';
import { Toast } from '../assets/js/notifications.js';
import { DateUtils } from '../utils/date-utils.js';
import { FileUtils } from '../utils/file-utils.js';
import { Security } from '../assets/js/security.js';

export const DataManagementPage = {
  stagedRestoreFile: null,
  stagedImportResult: null,

  async render() {
    const container = document.getElementById('content-area');
    const history = await BackupManager.getHistory();
    const preview = await BackupManager.getBackupPreview('complete');
    const allLinks = await db.getAll('links');

    container.innerHTML = `
      <!-- Page Header -->
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1 d-flex align-items-center gap-2">
            ${Icons.get('database', { size: 26, color: 'var(--ml-primary)' })}
            <span>Database & Backup Center</span>
          </h2>
          <p class="text-secondary mb-0">Complete data control: One-click backup, direct sharing, restore wizard, and open imports/exports.</p>
        </div>
        <div>
          <a href="#my-data" class="btn btn-outline-primary d-flex align-items-center gap-2">
            ${Icons.get('hard-drive', { size: 16 })}
            <span>View My Data & Storage</span>
          </a>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- SECTION 1: ONE-CLICK BACKUP & DIRECT SHARE -->
      <!-- ========================================================= -->
      <div id="sec-backup-center" class="mb-5">
        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <span class="text-primary">${Icons.get('download', { size: 22 })}</span>
          <h4 class="fw-bold mb-0">1. Database Backup & Direct Share</h4>
        </div>

        <!-- 1-Click Fast Backup & Direct Share Banner -->
        <div class="card border border-primary-subtle bg-primary-subtle bg-opacity-10 shadow-sm p-4 mb-4">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 class="fw-bold mb-1 text-primary d-flex align-items-center gap-2">
                ${Icons.get('database', { size: 22, color: 'var(--ml-primary)' })}
                <span>Instant Browser Database Backup</span>
              </h5>
              <p class="text-secondary small mb-0">
                Generate a clean, complete backup of all links, personal notes, note folders, categories, and settings.
              </p>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <!-- Direct Share Button -->
              <button type="button" id="btn-share-backup-direct" class="btn btn-success px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm">
                ${Icons.get('share-2', { size: 18, color: '#fff' })}
                <span>Directly Share Backup File</span>
              </button>
              <!-- Download JSON Button -->
              <button type="button" id="btn-backup-browser-data" class="btn btn-primary px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm">
                ${Icons.get('download', { size: 18, color: '#fff' })}
                <span>Download Backup (.json)</span>
              </button>
              <!-- Download Master ZIP Package -->
              <button type="button" id="btn-backup-zip-package" class="btn btn-outline-primary px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm bg-white">
                ${Icons.get('folder', { size: 18 })}
                <span>Download Master ZIP (.zip)</span>
              </button>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Custom Backup Scope & Encryption -->
          <div class="col-lg-7">
            <div class="card border shadow-sm h-100">
              <div class="card-header bg-transparent py-3">
                <h6 class="fw-bold mb-0">Custom / Encrypted Backup Options</h6>
              </div>
              <div class="card-body">
                <form id="backup-form">
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Backup Scope</label>
                    <select class="form-select" id="backup-type">
                      <option value="complete">Complete Library (Links, Notes, Categories, Folders, Collections)</option>
                      <option value="notes-only">Personal Notes & Note Folders Only</option>
                      <option value="links-only">Links Only</option>
                      <option value="categories-folders">Categories & Folders Only</option>
                      <option value="favorites-only">Favourites Only</option>
                    </select>
                  </div>

                  <!-- Password Protection Accordion -->
                  <div class="accordion mb-4" id="encAccordion">
                    <div class="accordion-item">
                      <h2 class="accordion-header">
                        <button class="accordion-button collapsed py-2" type="button" data-bs-toggle="collapse" data-bs-target="#collapseEnc">
                          ${Icons.get('lock', { size: 16, className: 'me-2' })} Encrypt Backup with Password (AES-GCM 256-bit)
                        </button>
                      </h2>
                      <div id="collapseEnc" class="accordion-collapse collapse" data-bs-parent="#encAccordion">
                        <div class="accordion-body">
                          <p class="small text-muted mb-2">
                            Encrypt your backup using Web Crypto PBKDF2 key derivation and AES-GCM 256-bit encryption. The file can only be decrypted with this password.
                          </p>
                          <div class="mb-2">
                            <label for="backupPassword" class="form-label small fw-semibold">Encryption Password</label>
                            <input type="password" class="form-control" id="backupPassword" placeholder="Leave empty for standard JSON" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Preview Summary Box -->
                  <div class="p-3 bg-light rounded border mb-4">
                    <div class="fw-semibold small mb-2">Live Database Statistics:</div>
                    <div class="d-flex flex-wrap gap-3 small text-secondary">
                      <span><strong>Links:</strong> ${preview.totalLinks}</span>
                      <span><strong>Personal Notes:</strong> ${preview.totalNotes || 0}</span>
                      <span><strong>Note Folders:</strong> ${preview.totalNoteFolders || 0}</span>
                      <span><strong>Categories:</strong> ${preview.totalCategories}</span>
                      <span><strong>Folders:</strong> ${preview.totalFolders}</span>
                      <span><strong>Estimated Size:</strong> ${preview.estimatedSize}</span>
                    </div>
                  </div>

                  <div class="d-flex gap-2">
                    <button type="submit" id="btn-download-backup" class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                      ${Icons.get('download', { size: 18, color: '#fff' })} Generate Custom Backup
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Backup History -->
          <div class="col-lg-5">
            <div class="card border shadow-sm h-100">
              <div class="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                <h6 class="fw-bold mb-0">Local Backup History</h6>
                ${history.length > 0 ? '<button id="btn-clear-history" class="btn btn-sm btn-link text-danger text-decoration-none p-0">Clear</button>' : ''}
              </div>
              <div class="card-body p-0">
                ${history.length === 0 
                  ? '<div class="text-center text-muted py-4 small">No backups created on this device yet.</div>'
                  : `<div class="list-group list-group-flush" style="max-height: 280px; overflow-y: auto;">
                      ${history.slice(0, 10).map(h => `
                        <div class="list-group-item py-2 px-3">
                          <div class="d-flex align-items-center justify-content-between">
                            <span class="fw-semibold small text-truncate" style="max-width: 190px;" title="${Security.escapeHtml(h.name)}">${Security.escapeHtml(h.name)}</span>
                            <span class="badge ${h.status === 'Shared' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}" style="font-size:0.68rem;">
                              ${h.status || 'JSON'}
                            </span>
                          </div>
                          <div class="d-flex justify-content-between text-muted mt-1" style="font-size: 0.72rem;">
                            <span>${DateUtils.formatDateTime(h.createdAt)}</span>
                            <span>${h.fileSize || ''}</span>
                          </div>
                        </div>
                      `).join('')}
                     </div>`
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- SECTION 2: RESTORATION WIZARD -->
      <!-- ========================================================= -->
      <div id="sec-restore-wizard" class="mb-5">
        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <span class="text-success">${Icons.get('refresh-cw', { size: 22 })}</span>
          <h4 class="fw-bold mb-0">2. Restoration Wizard</h4>
        </div>

        <div class="card border shadow-sm">
          <div class="card-body p-4">
            <p class="text-secondary small mb-4">
              Select or drop any ManageLinks database backup file (<code>.json</code> or <code>.mlb</code>). The wizard will inspect the records, check for duplicates, and let you choose how to merge or replace data with full safety snapshot protection.
            </p>

            <div class="row g-4">
              <div class="col-lg-6">
                <!-- File Select Box -->
                <div class="mb-3">
                  <label for="restoreFileInput" class="form-label fw-semibold">Select Backup File (.json, .zip, or .mlb)</label>
                  <input class="form-control" type="file" id="restoreFileInput" accept=".json,.mlb,.zip" />
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
              </div>

              <div class="col-lg-6">
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

                  <div class="mb-3" id="duplicateHandlingGroup">
                    <label class="form-label fw-semibold">Duplicate Policy</label>
                    <select class="form-select" id="restoreDuplicateAction">
                      <option value="skip">Skip duplicates (Keep existing records)</option>
                      <option value="replace">Replace existing records with backup data</option>
                      <option value="new">Import duplicates as fresh new links</option>
                    </select>
                  </div>

                  <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="restoreSafetyBackup" checked>
                    <label class="form-check-label small" for="restoreSafetyBackup">
                      Automatically create safety snapshot before restoring
                    </label>
                  </div>

                  <button type="button" id="btn-execute-restore" class="btn btn-success w-100 py-2 fw-semibold">
                    ${Icons.get('check', { size: 18, color: '#fff' })} Execute Restoration
                  </button>
                </div>

                <div id="restorePromptHelp" class="p-4 bg-light rounded text-center text-muted small">
                  Upload a JSON backup file on the left to inspect records and select restore options.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- SECTION 3: IMPORT BOOKMARKS & URLS -->
      <!-- ========================================================= -->
      <div id="sec-import-center" class="mb-5">
        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <span class="text-info">${Icons.get('upload', { size: 22 })}</span>
          <h4 class="fw-bold mb-0">3. Import Bookmarks & External Files</h4>
        </div>

        <div class="card border shadow-sm">
          <div class="card-body p-4">
            <p class="text-secondary small mb-4">
              Import bookmarks from Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari, CSV spreadsheets, or plain text URL lists.
            </p>

            <div class="row g-4">
              <div class="col-lg-6">
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

                <div class="mb-3">
                  <label for="importFileInput" class="form-label fw-semibold">Choose File to Import</label>
                  <input class="form-control" type="file" id="importFileInput" accept=".html,.htm,.csv,.txt,.json" />
                </div>
              </div>

              <div class="col-lg-6">
                <!-- Preview Table of parsed links -->
                <div id="importPreviewArea" class="d-none">
                  <div class="alert alert-success py-2 px-3 mb-3 d-flex justify-content-between align-items-center">
                    <span id="importSummaryBadge"></span>
                    <span class="badge bg-light text-dark" id="importDupBadge"></span>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Duplicate Policy</label>
                    <select class="form-select" id="importDupPolicy">
                      <option value="skip">Skip duplicate links (Recommended)</option>
                      <option value="replace">Update existing link details</option>
                      <option value="all">Import all as separate records</option>
                    </select>
                  </div>

                  <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="importAutoFolders" checked>
                    <label class="form-check-label small" for="importAutoFolders">
                      Auto-recreate nested folder hierarchy from browser bookmarks
                    </label>
                  </div>

                  <button type="button" id="btn-execute-import" class="btn btn-info text-white w-100 py-2 fw-semibold">
                    ${Icons.get('upload', { size: 18, color: '#fff' })} Complete Import
                  </button>
                </div>

                <div id="importPromptHelp" class="p-4 bg-light rounded text-center text-muted small">
                  Select a bookmark HTML file, CSV spreadsheet, or text file on the left to preview import.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================= -->
      <!-- SECTION 4: EXPORT FORMATS -->
      <!-- ========================================================= -->
      <div id="sec-export-center" class="mb-4">
        <div class="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <span class="text-secondary">${Icons.get('share-2', { size: 22 })}</span>
          <h4 class="fw-bold mb-0">4. Export Formats & Reports</h4>
        </div>

        <div class="card border shadow-sm">
          <div class="card-body p-4">
            <p class="text-secondary small mb-4">
              Export your saved links into interoperable open formats for spreadsheets, other browsers, automated scripts, or personal archives.
            </p>

            <div class="row g-3">
              <!-- HTML Bookmarks -->
              <div class="col-md-6 col-lg-3">
                <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between bg-light bg-opacity-50">
                  <div>
                    <h6 class="fw-bold mb-1">${Icons.get('file-text', { size: 16 })} Browser HTML</h6>
                    <p class="text-muted small mb-3">Standard Netscape HTML format. Ready to import into Chrome, Firefox, Edge, or Safari.</p>
                  </div>
                  <button id="exp-html-btn" class="btn btn-sm btn-outline-primary w-100">Export HTML</button>
                </div>
              </div>

              <!-- CSV Spreadsheet -->
              <div class="col-md-6 col-lg-3">
                <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between bg-light bg-opacity-50">
                  <div>
                    <h6 class="fw-bold mb-1">${Icons.get('file', { size: 16 })} CSV Spreadsheet</h6>
                    <p class="text-muted small mb-3">Standard CSV file compatible with Excel, Google Sheets, LibreOffice, and Airtable.</p>
                  </div>
                  <button id="exp-csv-btn" class="btn btn-sm btn-outline-success w-100">Export CSV</button>
                </div>
              </div>

              <!-- Raw JSON -->
              <div class="col-md-6 col-lg-3">
                <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between bg-light bg-opacity-50">
                  <div>
                    <h6 class="fw-bold mb-1">${Icons.get('code', { size: 16 })} JSON Records</h6>
                    <p class="text-muted small mb-3">Direct array of link objects for developers, automation workflows, and scripts.</p>
                  </div>
                  <button id="exp-json-btn" class="btn btn-sm btn-outline-info w-100">Export JSON</button>
                </div>
              </div>

              <!-- Plain TXT -->
              <div class="col-md-6 col-lg-3">
                <div class="p-3 border rounded h-100 d-flex flex-column justify-content-between bg-light bg-opacity-50">
                  <div>
                    <h6 class="fw-bold mb-1">${Icons.get('list', { size: 16 })} Plain Text (URLs)</h6>
                    <p class="text-muted small mb-3">Clean list of URLs, one line per link. Perfect for curl, wget, or bulk openers.</p>
                  </div>
                  <button id="exp-txt-btn" class="btn btn-sm btn-outline-secondary w-100">Export TXT</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(allLinks);
  },

  bindEvents(allLinks) {
    // 1. One-click Backup Browser Data (Download JSON)
    document.getElementById('btn-backup-browser-data')?.addEventListener('click', async () => {
      try {
        Toast.info('Downloading browser database backup...');
        await BackupManager.backupBrowserData();
        Toast.success('Browser database backup downloaded successfully!');
        await this.render();
      } catch (err) {
        Toast.error(`Backup failed: ${err.message}`);
      }
    });

    // 2. Direct Share Backup File (Opens share sheet / modal without downloading!)
    document.getElementById('btn-share-backup-direct')?.addEventListener('click', async () => {
      try {
        Toast.info('Preparing database backup for sharing...');
        const payload = await BackupManager.prepareBackupForSharing();
        ShareModal.openForBackup(payload);
      } catch (err) {
        Toast.error(`Direct share failed: ${err.message}`);
      }
    });

    // 3. Download Master ZIP Package
    document.getElementById('btn-backup-zip-package')?.addEventListener('click', async () => {
      try {
        Toast.info('Generating Master ZIP backup archive with files...');
        await BackupManager.createZipBackup({ type: 'complete' });
        Toast.success('Master ZIP backup archive downloaded successfully!');
        await this.render();
      } catch (err) {
        Toast.error(`ZIP backup failed: ${err.message}`);
      }
    });

    // Custom Backup Form Submit
    document.getElementById('backup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = document.getElementById('backup-type').value;
      const format = 'json';
      const password = document.getElementById('backupPassword').value;

      try {
        Toast.info('Generating JSON backup file...');
        await BackupManager.createBackup({ type, format, password });
        Toast.success('Backup file downloaded successfully!');
        await this.render();
      } catch (err) {
        Toast.error(`Backup failed: ${err.message}`);
      }
    });

    // Clear Backup History
    document.getElementById('btn-clear-history')?.addEventListener('click', async () => {
      await BackupManager.clearHistory();
      Toast.info('Backup history cleared');
      await this.render();
    });

    // ==========================================
    // RESTORE EVENTS
    // ==========================================
    const restoreFileInput = document.getElementById('restoreFileInput');
    const restorePasswordBox = document.getElementById('restorePasswordBox');
    const restorePasswordInput = document.getElementById('restorePassword');
    const btnDecrypt = document.getElementById('btn-submit-decrypt');

    let currentRestoreFile = null;

    restoreFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      currentRestoreFile = file;

      try {
        Toast.info('Inspecting backup file...');
        const result = await RestoreManager.parseBackupFile(file);

        if (result.isEncrypted) {
          restorePasswordBox?.classList.remove('d-none');
          restorePasswordInput?.focus();
          Toast.warning('File is encrypted. Please enter your backup password.');
        } else {
          restorePasswordBox?.classList.add('d-none');
          this.displayRestorePreview(result);
          Toast.success(`Backup valid: ${result.summary.linksCount} links found!`);
        }
      } catch (err) {
        Toast.error(`Inspection failed: ${err.message}`);
        restoreFileInput.value = '';
      }
    });

    btnDecrypt?.addEventListener('click', async () => {
      const password = restorePasswordInput.value;
      if (!password) {
        Toast.error('Please enter the decryption password');
        return;
      }

      try {
        Toast.info('Decrypting backup with AES-GCM...');
        const result = await RestoreManager.parseBackupFile(currentRestoreFile, password);
        restorePasswordBox?.classList.add('d-none');
        this.displayRestorePreview(result);
        Toast.success('Decryption successful!');
      } catch (err) {
        Toast.error(`Decryption failed: Incorrect password or corrupted payload.`);
      }
    });

    document.getElementById('btn-execute-restore')?.addEventListener('click', async () => {
      if (!this.stagedRestoreFile) return;

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
          await this.render();
        } catch (err) {
          Toast.error(`Restore failed: ${err.message}`);
        }
      }
    });

    // ==========================================
    // IMPORT EVENTS
    // ==========================================
    const importFileInput = document.getElementById('importFileInput');
    const importFormatSelect = document.getElementById('import-format-select');
    const importPreviewArea = document.getElementById('importPreviewArea');
    const importPromptHelp = document.getElementById('importPromptHelp');

    importFileInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        Toast.info('Parsing import file...');
        const parsed = await ImportManager.parseFile(file, importFormatSelect.value);
        this.stagedImportResult = parsed;

        document.getElementById('importSummaryBadge').innerHTML = `Detected <strong>${parsed.validCount}</strong> valid links (${parsed.invalidCount} invalid)`;
        document.getElementById('importDupBadge').textContent = `${parsed.duplicatesCount} Duplicates`;

        importPromptHelp?.classList.add('d-none');
        importPreviewArea?.classList.remove('d-none');
        Toast.success(`Parsed ${parsed.validCount} valid links!`);
      } catch (err) {
        Toast.error(`Import parse error: ${err.message}`);
        importFileInput.value = '';
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
        await this.render();
      } catch (err) {
        Toast.error(`Import failed: ${err.message}`);
      }
    });

    // ==========================================
    // EXPORT EVENTS
    // ==========================================
    document.getElementById('exp-html-btn')?.addEventListener('click', () => ExportManager.exportToHtml(allLinks));
    document.getElementById('exp-csv-btn')?.addEventListener('click', () => ExportManager.exportToCsv(allLinks));
    document.getElementById('exp-json-btn')?.addEventListener('click', () => ExportManager.exportToJson(allLinks));
    document.getElementById('exp-txt-btn')?.addEventListener('click', () => ExportManager.exportToTxt(allLinks));
  },

  displayRestorePreview(result) {
    this.stagedRestoreFile = result;
    const box = document.getElementById('restoreInspectionBox');
    const help = document.getElementById('restorePromptHelp');
    const summary = document.getElementById('restoreSummaryText');

    help?.classList.add('d-none');
    summary.innerHTML = `
      Found <strong>${result.summary.linksCount}</strong> links, 
      <strong>${result.summary.categoriesCount}</strong> categories, 
      <strong>${result.summary.foldersCount}</strong> folders. 
      Duplicates detected: <strong>${result.duplicates?.duplicateLinksCount || 0}</strong>.
    `;
    box?.classList.remove('d-none');
  }
};
