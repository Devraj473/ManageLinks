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
   * Open modal to share the ManageLinks App itself
   */
  openForApp() {
    if (!this.bsModal) this.init();

    const titleEl = document.getElementById('shareModalTitle');
    const subtitleEl = document.getElementById('shareModalSubtitle');
    const bodyEl = document.getElementById('shareModalBody');
    const nativeBtn = document.getElementById('btn-modal-native-share');

    titleEl.textContent = 'Share & Install ManageLinks';
    subtitleEl.textContent = '100% Offline Personal Bookmark Tool • Zero Server Required';

    const appUrl = window.location.origin + window.location.pathname;
    const shareText = 'ManageLinks - Personal Offline Link Manager & Bookmark Catalog. Zero servers, zero tracking, total control!';

    bodyEl.innerHTML = `
      <!-- App Info Box -->
      <div class="p-3 bg-light rounded border mb-3">
        <div class="fw-bold fs-6 text-primary mb-1">ManageLinks</div>
        <div class="small text-muted mb-2">Developed by <strong>Devraj Chauhan</strong></div>
        <p class="small text-secondary mb-0">
          Personal link management, organization, storage, backup and restoration across devices. Works 100% offline without database, server, or cloud subscriptions!
        </p>
      </div>

      <!-- App URL Copy -->
      <div class="mb-3">
        <label class="form-label fw-semibold small text-muted text-uppercase mb-1">App Address</label>
        <div class="input-group">
          <input type="text" class="form-control" id="shareAppUrlInput" value="${Security.escapeHtml(appUrl)}" readonly />
          <button class="btn btn-outline-primary" type="button" id="btn-copy-app-url">
            ${Icons.get('copy', { size: 16 })} Copy
          </button>
        </div>
      </div>

      <!-- Action Cards: Download Offline Zip & Install App -->
      <div class="row g-2 mb-3">
        <div class="col-sm-6">
          <button type="button" id="btn-share-download-zip" class="btn btn-outline-primary w-100 py-2 d-flex flex-column align-items-center text-center">
            <span class="mb-1">${Icons.get('download', { size: 20 })}</span>
            <span class="fw-bold" style="font-size: 0.88rem;">Download Offline Tool</span>
            <span class="text-muted" style="font-size: 0.72rem;">Portable ZIP • Zero server</span>
          </button>
        </div>
        <div class="col-sm-6">
          <button type="button" id="btn-share-install-pwa" class="btn btn-outline-success w-100 py-2 d-flex flex-column align-items-center text-center">
            <span class="mb-1">${Icons.get('smartphone', { size: 20 })}</span>
            <span class="fw-bold" style="font-size: 0.88rem;">Install as App</span>
            <span class="text-muted" style="font-size: 0.72rem;">Desktop / Mobile PWA</span>
          </button>
        </div>
      </div>

      <!-- Social Sharing Buttons -->
      <div class="mb-2">
        <label class="form-label fw-semibold small text-muted text-uppercase mb-2">Share via</label>
        <div class="row g-2">
          <div class="col-6">
            <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + appUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.85rem;">
              <span>WhatsApp</span>
            </a>
          </div>
          <div class="col-6">
            <a href="https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-info w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.85rem;">
              <span>Telegram</span>
            </a>
          </div>
          <div class="col-6">
            <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.85rem;">
              <span>X (Twitter)</span>
            </a>
          </div>
          <div class="col-6">
            <a href="mailto:?subject=${encodeURIComponent('Check out ManageLinks - Offline Personal Bookmark Manager')}&body=${encodeURIComponent(shareText + '\n\n' + appUrl)}" class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2 py-2" style="font-size: 0.85rem;">
              <span>Email App</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // Copy event
    document.getElementById('btn-copy-app-url')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(appUrl);
        Toast.success('ManageLinks URL copied to clipboard!');
      } catch {
        const input = document.getElementById('shareAppUrlInput');
        input.select();
        document.execCommand('copy');
        Toast.success('ManageLinks URL copied to clipboard!');
      }
    });

    // Portable ZIP download
    document.getElementById('btn-share-download-zip')?.addEventListener('click', () => {
      AppDownloader.downloadAppZip();
    });

    // PWA Install
    document.getElementById('btn-share-install-pwa')?.addEventListener('click', () => {
      PwaInstaller.promptInstall();
    });

    // Native share button
    if (navigator.share) {
      nativeBtn.classList.remove('d-none');
      nativeBtn.classList.add('d-inline-flex');
      nativeBtn.onclick = async () => {
        try {
          await navigator.share({
            title: 'ManageLinks - Personal Offline Link Manager',
            text: shareText,
            url: appUrl
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
  }
};
