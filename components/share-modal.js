/**
 * ManageLinks - Universal Share Modal
 * Developer: Devraj Chauhan
 * Handles Sharing Links & Sharing the ManageLinks Tool (WhatsApp, Telegram, Twitter, Email, Copy, Native Share)
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { Toast } from '../assets/js/notifications.js';
import { Security } from '../assets/js/security.js';
import { AppDownloader } from '../utils/app-downloader.js';
import { PwaInstaller } from '../assets/js/pwa-installer.js';
import { PdfGenerator } from '../utils/pdf-generator.js';
import { DateUtils } from '../utils/date-utils.js';

export const ShareModal = {
  modalEl: null,
  bsModal: null,

  init() {
    this.createModalDom();
  },

  createModalDom() {
    let existing = document.getElementById('shareModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="shareModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content shadow-lg">
            <div class="modal-header border-bottom py-3 px-4">
              <div class="d-flex align-items-center gap-2">
                <div class="bg-primary-subtle text-primary p-2 rounded">
                  ${Icons.get('share-2', { size: 20 })}
                </div>
                <div>
                  <h5 class="modal-title fw-bold mb-0" id="shareModalTitle">Share Link</h5>
                  <p class="text-secondary small mb-0" id="shareModalSubtitle">Share anywhere across platforms and devices</p>
                </div>
              </div>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body py-3 px-4" id="shareModalBody">
              <!-- Content injected dynamically -->
            </div>

            <div class="modal-footer py-2 px-4 border-top bg-light d-flex justify-content-between">
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
              <button type="button" id="btn-modal-native-share" class="btn btn-outline-primary btn-sm d-none align-items-center gap-1">
                ${Icons.get('share-2', { size: 14 })}
                <span>System Share Sheet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div.firstElementChild);
    this.modalEl = document.getElementById('shareModal');
    this.bsModal = new bootstrap.Modal(this.modalEl);
  },

  /**
   * Open modal to share a specific saved link
   */
  async openForLink(linkId) {
    if (!this.bsModal) this.init();

    const link = await db.get('links', linkId);
    if (!link) {
      Toast.error('Link not found');
      return;
    }

    const titleEl = document.getElementById('shareModalTitle');
    const subtitleEl = document.getElementById('shareModalSubtitle');
    const bodyEl = document.getElementById('shareModalBody');
    const nativeBtn = document.getElementById('btn-modal-native-share');

    titleEl.textContent = 'Share Link';
    subtitleEl.textContent = link.title;

    const shareUrl = link.url;
    const shareText = link.description ? `${link.title} - ${link.description}` : link.title;

    bodyEl.innerHTML = `
      <!-- Link Preview Box -->
      <div class="p-3 bg-light rounded border mb-3">
        <div class="fw-bold fs-6 text-primary text-truncate mb-1">${Security.escapeHtml(link.title)}</div>
        <div class="small text-muted text-break mb-1">${Security.escapeHtml(link.url)}</div>
        ${link.description ? `<div class="small text-secondary text-truncate">${Security.escapeHtml(link.description)}</div>` : ''}
      </div>

      <!-- Quick Copy Input -->
      <div class="mb-3">
        <label class="form-label fw-semibold small text-muted text-uppercase mb-1">Direct Link</label>
        <div class="input-group">
          <input type="text" class="form-control" id="shareCopyUrlInput" value="${Security.escapeHtml(shareUrl)}" readonly />
          <button class="btn btn-outline-primary" type="button" id="btn-copy-share-url">
            ${Icons.get('copy', { size: 16 })} Copy
          </button>
        </div>
      </div>

      <!-- Quick Share Platforms Grid -->
      <div class="mb-2">
        <label class="form-label fw-semibold small text-muted text-uppercase mb-2">Share to Platform</label>
        <div class="row g-2">
          <div class="col-6">
            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
              <span>WhatsApp</span>
            </a>
          </div>
          <div class="col-6">
            <a href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-info w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
              <span>Telegram</span>
            </a>
          </div>
          <div class="col-6">
            <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
              <span>X (Twitter)</span>
            </a>
          </div>
          <div class="col-6">
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
              <span>LinkedIn</span>
            </a>
          </div>
          <div class="col-12">
            <a href="mailto:?subject=${encodeURIComponent(link.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
              <span>Email Link</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // Copy event
    document.getElementById('btn-copy-share-url')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        Toast.success('URL copied to clipboard!');
      } catch {
        const input = document.getElementById('shareCopyUrlInput');
        input.select();
        document.execCommand('copy');
        Toast.success('URL copied to clipboard!');
      }
    });

    // Native share button
    if (navigator.share) {
      nativeBtn.classList.remove('d-none');
      nativeBtn.classList.add('d-inline-flex');
      nativeBtn.onclick = async () => {
        try {
          await navigator.share({
            title: link.title,
            text: shareText,
            url: shareUrl
          });
        } catch (e) {
          // Ignore abort
        }
      };
    } else {
      nativeBtn.classList.add('d-none');
      nativeBtn.classList.remove('d-inline-flex');
    }

    this.bsModal.show();
  },

  /**
   * Open modal to share the ManageLinks App itself & Install PWA
   */
  openForApp() {
    if (!this.bsModal) this.init();

    const titleEl = document.getElementById('shareModalTitle');
    const subtitleEl = document.getElementById('shareModalSubtitle');
    const bodyEl = document.getElementById('shareModalBody');
    const nativeBtn = document.getElementById('btn-modal-native-share');

    titleEl.textContent = 'Share & Install ManageLinks';
    subtitleEl.textContent = 'Progressive Web App (PWA) • 100% Offline • Zero Dependencies • By Devraj Chauhan';

    const appUrl = AppDownloader.getAppUrl();
    const appTitle = 'ManageLinks by Devraj Chauhan';
    const appSummary = 'ManageLinks is a 100% offline personal bookmark, link, and notes manager with Google Drive style folders, clickable links, and complete privacy. Zero cloud tracking, zero external servers, runs everywhere.';
    const shareMessage = `🚀 *ManageLinks v1.0* - Offline Personal Bookmark & Notes Manager\nDeveloper: Devraj Chauhan\n\n${appSummary}\n\n🌐 Live App / Install Link:\n${appUrl}\n\nOpen this link on any computer or phone and click "Install App" to use 100% offline!`;

    bodyEl.innerHTML = `
      <!-- App Header Badge -->
      <div class="p-3 bg-light rounded border mb-3">
        <div class="d-flex align-items-center justify-content-between mb-1">
          <span class="fw-bold fs-6 text-primary">ManageLinks v1.0</span>
          <span class="badge bg-success-subtle text-success border border-success-subtle">PWA Install Ready</span>
        </div>
        <div class="small text-muted mb-2">Developed by <strong>Devraj Chauhan</strong> (${Security.escapeHtml('dc4682786@gmail.com')})</div>
        <p class="small text-secondary mb-0">
          ManageLinks is a live Progressive Web App. Anyone can open the link and install it directly on their desktop, laptop, or phone without app stores or servers!
        </p>
      </div>

      <!-- Featured Action: Direct PWA Install on User Device -->
      <div class="card border-success shadow-sm mb-3" style="border-width: 1.5px; background: rgba(22, 163, 74, 0.04);">
        <div class="card-body p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              <span class="text-success">${Icons.get('smartphone', { size: 22 })}</span>
              <span class="fw-bold text-dark fs-6">Install Application on This Device</span>
            </div>
            <span class="badge bg-success text-white">Native App</span>
          </div>
          <p class="small text-secondary mb-3">
            Installs ManageLinks as a standalone desktop or mobile application with desktop icon, offline caching, and fast launch.
          </p>
          <button type="button" id="btn-install-app-featured" class="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm">
            ${Icons.get('smartphone', { size: 18, color: '#fff' })}
            <span class="fw-bold">Install ManageLinks (PWA)</span>
          </button>
        </div>
      </div>

      <!-- Direct 1-Click Platform Sharing -->
      <div class="card border shadow-sm mb-3">
        <div class="card-body p-3">
          <label class="form-label fw-bold text-dark small text-uppercase mb-2 d-flex align-items-center gap-1">
            ${Icons.get('send', { size: 14 })} <span>Share Live App Link</span>
          </label>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
                <span>WhatsApp</span>
              </a>
            </div>
            <div class="col-6">
              <a href="https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(appTitle + ' - ' + appSummary)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-info w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
                <span>Telegram</span>
              </a>
            </div>
            <div class="col-6">
              <a href="mailto:?subject=${encodeURIComponent('ManageLinks - Standalone Offline Link Manager by Devraj Chauhan')}&body=${encodeURIComponent(shareMessage.replace(/\*/g, ''))}" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
                <span>Email App</span>
              </a>
            </div>
            <div class="col-6">
              <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent('Check out ManageLinks: 100% Offline Personal Link & Bookmark Manager by Devraj Chauhan')}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
                <span>X (Twitter)</span>
              </a>
            </div>
          </div>

          <!-- Direct Copy Live App Link Input -->
          <label class="form-label fw-semibold text-muted small text-uppercase mb-1">Live Application Link</label>
          <div class="input-group mb-2">
            <input type="text" class="form-control form-control-sm" id="shareLiveAppUrlInput" value="${Security.escapeHtml(appUrl)}" readonly />
            <button class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" type="button" id="btn-copy-live-app-url">
              ${Icons.get('copy', { size: 14 })} <span>Copy Link</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Alternative Portable Offline ZIP Bundle -->
      <div class="card border border-secondary-subtle bg-light shadow-sm mb-2">
        <div class="card-body p-3">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="fw-semibold small text-dark">Portable Standalone ZIP Bundle</div>
              <div class="text-muted small" style="font-size: 0.76rem;">Download entire tool to run completely offline from a USB stick</div>
            </div>
            <button type="button" id="btn-share-download-zip" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              ${Icons.get('folder', { size: 14 })}
              <span>Download ZIP</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Install PWA
    document.getElementById('btn-install-app-featured')?.addEventListener('click', () => {
      PwaInstaller.promptInstall();
    });

    // Copy Live App URL button
    document.getElementById('btn-copy-live-app-url')?.addEventListener('click', () => {
      AppDownloader.copyAppUrl();
    });

    // Portable ZIP download
    document.getElementById('btn-share-download-zip')?.addEventListener('click', () => {
      AppDownloader.downloadAppZip();
    });

    // Bottom modal footer native share button
    nativeBtn.classList.remove('d-none');
    nativeBtn.classList.add('d-inline-flex');
    nativeBtn.innerHTML = `${Icons.get('share-2', { size: 14, color: '#fff' })} <span>System Share</span>`;
    nativeBtn.className = 'btn btn-primary btn-sm d-inline-flex align-items-center gap-1 shadow-sm';
    nativeBtn.onclick = () => {
      AppDownloader.shareLiveApp();
    };

    this.bsModal.show();
  },

  /**
   * Open modal to directly share the Database Backup file
   * Never downloads the file when opened or shared!
   */
  openForBackup(backupData) {
    if (!this.bsModal) this.init();

    const titleEl = document.getElementById('shareModalTitle');
    const subtitleEl = document.getElementById('shareModalSubtitle');
    const bodyEl = document.getElementById('shareModalBody');
    const nativeBtn = document.getElementById('btn-modal-native-share');

    titleEl.textContent = 'Directly Share Database Backup';
    subtitleEl.textContent = 'Share complete backup anywhere via System Share, WhatsApp, Telegram, or Email';

    const totalLinks = backupData.totalLinks || 0;
    const totalNotes = backupData.totalNotes || 0;
    const totalCats = backupData.totalCategories || 0;
    const totalFolders = backupData.totalFolders || 0;
    const sizeStr = backupData.totalSize || '0 KB';
    const dateStr = backupData.dateStamp || 'today';
    const jsonStr = backupData.jsonStr || '';

    const shareTitle = `ManageLinks Database Backup (${dateStr})`;
    const shareMessage = `📦 *ManageLinks Database Backup*\nDeveloper: Devraj Chauhan\n\nBackup Summary:\n• Links: ${totalLinks}\n• Notes: ${totalNotes}\n• Categories: ${totalCats}\n• Folders: ${totalFolders}\n• Backup Size: ${sizeStr}\n\nRestore this file anytime in ManageLinks -> Database & Backup Center -> Restore Wizard.`;

    bodyEl.innerHTML = `
      <!-- Backup Summary Header -->
      <div class="p-3 bg-light rounded border mb-3">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="fw-bold fs-6 text-primary">Database Backup Ready</span>
          <span class="badge bg-success-subtle text-success border border-success-subtle">${sizeStr}</span>
        </div>
        <div class="row g-2 text-secondary small">
          <div class="col-6"><strong>Links:</strong> ${totalLinks}</div>
          <div class="col-6"><strong>Notes:</strong> ${totalNotes}</div>
          <div class="col-6"><strong>Categories:</strong> ${totalCats}</div>
          <div class="col-6"><strong>Folders:</strong> ${totalFolders}</div>
        </div>
      </div>

      <!-- Option 1: System Share Sheet (Send Backup File Directly) -->
      <div class="card border-primary shadow-sm mb-3" style="border-width: 1.5px; background: rgba(37, 99, 235, 0.04);">
        <div class="card-body p-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div class="d-flex align-items-center gap-2">
              <span class="text-primary">${Icons.get('share-2', { size: 20 })}</span>
              <span class="fw-bold text-dark fs-6">Direct System Share (No Download)</span>
            </div>
            <span class="badge bg-primary text-white">Direct Transfer</span>
          </div>
          <p class="small text-secondary mb-3">
            Directly invoke the Windows / System Share Sheet to send this <code>.json</code> backup file via Nearby Share, Bluetooth, Mail, or connected apps.
          </p>
          <button type="button" id="btn-share-backup-native" class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 shadow-sm">
            ${Icons.get('share-2', { size: 18, color: '#fff' })}
            <span class="fw-bold">Open System Share Sheet</span>
          </button>
        </div>
      </div>

      <!-- Option 2: 1-Click Platform Sharing -->
      <div class="card border shadow-sm mb-3">
        <div class="card-body p-3">
          <label class="form-label fw-bold text-dark small text-uppercase mb-2 d-flex align-items-center gap-1">
            ${Icons.get('send', { size: 14 })} <span>Share Backup Summary & Data</span>
          </label>
          <div class="row g-2 mb-3">
            <div class="col-6">
              <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
                <span>WhatsApp</span>
              </a>
            </div>
            <div class="col-6">
              <a href="https://t.me/share/url?url=${encodeURIComponent(window.location.href.split('#')[0])}&text=${encodeURIComponent(shareMessage)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-info w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
                <span>Telegram</span>
              </a>
            </div>
            <div class="col-12">
              <a href="mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareMessage)}" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
                <span>Email Backup Summary</span>
              </a>
            </div>
          </div>

          <!-- Copy Backup JSON directly -->
          <button type="button" id="btn-copy-backup-json" class="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2">
            ${Icons.get('copy', { size: 16 })}
            <span class="fw-semibold">Copy Full Backup JSON to Clipboard</span>
          </button>
        </div>
      </div>

      <!-- Option 3: Download File to Disk (Optional) -->
      <div class="card border border-secondary-subtle bg-light shadow-sm">
        <div class="card-body p-3">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <div class="fw-semibold small text-dark">Save Backup File to Hard Drive</div>
              <div class="text-muted small" style="font-size: 0.76rem;">Only click if you want to physically download the .json file</div>
            </div>
            <button type="button" id="btn-download-backup-modal" class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
              ${Icons.get('download', { size: 14 })}
              <span>Download .JSON</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Native share handler
    document.getElementById('btn-share-backup-native')?.addEventListener('click', async () => {
      if (navigator.canShare && navigator.canShare({ files: [backupData.backupFile] })) {
        try {
          await navigator.share({
            files: [backupData.backupFile],
            title: shareTitle,
            text: shareMessage
          });
          Toast.success('Backup file shared successfully!');
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.warn('Native share aborted or error:', err);
        }
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareMessage
          });
          Toast.success('Backup summary shared!');
          return;
        } catch (e) {
          if (e.name === 'AbortError') return;
        }
      }

      Toast.info('System share not supported in this browser. Use WhatsApp, Telegram, or Copy JSON options!');
    });

    // Copy JSON to clipboard
    document.getElementById('btn-copy-backup-json')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(jsonStr);
        Toast.success('Full backup JSON copied to clipboard!');
      } catch {
        Toast.info('Backup JSON ready');
      }
    });

    // Explicit download button
    document.getElementById('btn-download-backup-modal')?.addEventListener('click', () => {
      import('../utils/file-utils.js').then(m => {
        m.FileUtils.downloadFile(backupData.blobContent, backupData.finalFilename, 'application/json');
        Toast.success('Backup file downloaded to disk!');
      });
    });

    // Footer native share button
    nativeBtn.classList.remove('d-none');
    nativeBtn.classList.add('d-inline-flex');
    nativeBtn.innerHTML = `${Icons.get('share-2', { size: 14, color: '#fff' })} <span>System Share</span>`;
    nativeBtn.className = 'btn btn-primary btn-sm d-inline-flex align-items-center gap-1 shadow-sm';
    nativeBtn.onclick = () => {
      document.getElementById('btn-share-backup-native')?.click();
    };

    this.bsModal.show();
  },

  /**
   * Open modal to directly share a Personal Note
   */
  openForNote(note, folderName = null) {
    if (!this.bsModal) this.init();

    const titleEl = document.getElementById('shareModalTitle');
    const subtitleEl = document.getElementById('shareModalSubtitle');
    const bodyEl = document.getElementById('shareModalBody');
    const nativeBtn = document.getElementById('btn-modal-native-share');

    titleEl.textContent = 'Share Personal Note';
    subtitleEl.textContent = note.title || 'Untitled Note';

    const createdStr = DateUtils.formatDateTime(note.createdAt);
    const updatedStr = DateUtils.formatDateTime(note.updatedAt || note.createdAt);
    const tagsStr = Array.isArray(note.tags) && note.tags.length > 0 ? note.tags.map(t => '#' + t).join(' ') : '';
    const shareText = `📝 *${note.title}*\n${folderName ? `📁 Folder: ${folderName}\n` : ''}Created: ${createdStr}\n${tagsStr ? `Tags: ${tagsStr}\n` : ''}\n----------------------------------\n${note.content || ''}\n----------------------------------\nShared via ManageLinks by Devraj Chauhan`;

    bodyEl.innerHTML = `
      <!-- Note Preview Box -->
      <div class="p-3 bg-light rounded border mb-3">
        <div class="fw-bold fs-6 text-primary mb-1">${Security.escapeHtml(note.title)}</div>
        <div class="small text-muted mb-2">
          <span>Created: ${createdStr}</span> &bull; <span>Updated: ${updatedStr}</span>
        </div>
        <div class="small text-secondary" style="max-height: 120px; overflow-y: auto; white-space: pre-wrap;">
          ${Security.escapeHtml(note.content || 'No content.')}
        </div>
      </div>

      <!-- Quick Actions Grid -->
      <div class="mb-3">
        <label class="form-label fw-bold text-dark small text-uppercase mb-2 d-flex align-items-center gap-1">
          ${Icons.get('send', { size: 14 })} <span>Share Note to Platform</span>
        </label>
        <div class="row g-2">
          <div class="col-6">
            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
              <span>WhatsApp</span>
            </a>
          </div>
          <div class="col-6">
            <a href="https://t.me/share/url?url=${encodeURIComponent(window.location.href.split('#')[0])}&text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-info w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
              <span>Telegram</span>
            </a>
          </div>
          <div class="col-12">
            <a href="mailto:?subject=${encodeURIComponent(note.title)}&body=${encodeURIComponent(shareText.replace(/\*/g, ''))}" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.88rem;">
              <span>Email Note</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Additional Actions: Copy Text & Export PDF -->
      <div class="row g-2 mb-2">
        <div class="col-6">
          <button type="button" id="btn-copy-note-text-modal" class="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-1">
            ${Icons.get('copy', { size: 15 })}
            <span class="small fw-semibold">Copy Note Text</span>
          </button>
        </div>
        <div class="col-6">
          <button type="button" id="btn-export-note-pdf-modal" class="btn btn-outline-danger w-100 py-2 d-flex align-items-center justify-content-center gap-1">
            ${Icons.get('file-text', { size: 15 })}
            <span class="small fw-semibold">Export as PDF</span>
          </button>
        </div>
      </div>
    `;

    // Copy note text
    document.getElementById('btn-copy-note-text-modal')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(`${note.title}\n\n${note.content || ''}`);
        Toast.success('Note text copied to clipboard!');
      } catch {
        Toast.info('Note copied');
      }
    });

    // Export note PDF
    document.getElementById('btn-export-note-pdf-modal')?.addEventListener('click', () => {
      PdfGenerator.generateSingleNotePdf(note, folderName);
    });

    // Footer native share button
    nativeBtn.classList.remove('d-none');
    nativeBtn.classList.add('d-inline-flex');
    nativeBtn.innerHTML = `${Icons.get('share-2', { size: 14, color: '#fff' })} <span>System Share</span>`;
    nativeBtn.className = 'btn btn-primary btn-sm d-inline-flex align-items-center gap-1 shadow-sm';
    nativeBtn.onclick = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: note.title,
            text: shareText
          });
          Toast.success('Note shared via system sheet!');
        } catch {}
      }
    };

    this.bsModal.show();
  }
};
