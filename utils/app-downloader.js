/**
 * ManageLinks - Portable Offline Tool Downloader & Live Sharing
 * Developer: Devraj Chauhan
 * 100% Client-Side Offline Tool Packaging & Live Progressive Web App Sharing
 */

import { Toast } from '../assets/js/notifications.js';
import { FileUtils } from './file-utils.js';

export const AppDownloader = {
  // Complete list of application assets to bundle into the standalone offline package
  APP_FILES: [
    'index.html',
    'manifest.json',
    'service-worker.js',
    'README.md',
    'LICENSE',
    'assets/vendor/bootstrap.min.css',
    'assets/vendor/bootstrap.bundle.min.js',
    'assets/vendor/jszip.min.js',
    'assets/css/style.css',
    'assets/css/responsive.css',
    'assets/css/themes.css',
    'assets/css/components.css',
    'assets/icons/favicon.svg',
    'assets/icons/icon-192.svg',
    'assets/icons/icon-512.svg',
    'assets/js/app.js',
    'assets/js/database.js',
    'assets/js/storage.js',
    'assets/js/icons.js',
    'assets/js/link-manager.js',
    'assets/js/category-manager.js',
    'assets/js/folder-manager.js',
    'assets/js/collection-manager.js',
    'assets/js/search.js',
    'assets/js/filters.js',
    'assets/js/notes-manager.js',
    'assets/js/analytics.js',
    'assets/js/backup.js',
    'assets/js/restore.js',
    'assets/js/import.js',
    'assets/js/export.js',
    'assets/js/security.js',
    'assets/js/settings.js',
    'assets/js/notifications.js',
    'assets/js/shortcuts.js',
    'assets/js/router.js',
    'assets/js/ui.js',
    'assets/js/pwa-installer.js',
    'components/sidebar.js',
    'components/navbar.js',
    'components/link-card.js',
    'components/link-modal.js',
    'components/note-modal.js',
    'components/category-modal.js',
    'components/folder-modal.js',
    'components/collection-modal.js',
    'components/search-modal.js',
    'components/confirmation-modal.js',
    'components/toast.js',
    'components/empty-state.js',
    'components/pdf-modal.js',
    'components/share-modal.js',
    'pages/dashboard.js',
    'pages/all-links.js',
    'pages/link-inbox.js',
    'pages/favorites.js',
    'pages/categories.js',
    'pages/folders.js',
    'pages/collections.js',
    'pages/notes.js',
    'pages/reading-list.js',
    'pages/archive.js',
    'pages/trash.js',
    'pages/analytics.js',
    'pages/data-management.js',
    'pages/settings.js',
    'pages/about.js',
    'utils/validators.js',
    'utils/date-utils.js',
    'utils/url-utils.js',
    'utils/file-utils.js',
    'utils/csv-parser.js',
    'utils/html-bookmark-parser.js',
    'utils/encryption.js',
    'utils/pdf-generator.js',
    'utils/app-downloader.js'
  ],

  /**
   * Resolves the live web application URL
   */
  getAppUrl() {
    const loc = window.location;
    const origin = (loc.origin && loc.origin !== 'null') ? loc.origin : '';
    let pathname = loc.pathname || '/';
    pathname = pathname.replace(/\/index\.html$/i, '');
    if (!pathname.endsWith('/')) pathname += '/';
    return `${origin}${pathname}`;
  },

  /**
   * Directly shares the live application URL via Web Share API
   */
  async shareLiveApp() {
    const appUrl = this.getAppUrl();
    const shareTitle = 'ManageLinks by Devraj Chauhan';
    const shareText = 'ManageLinks v1.0 - 100% Offline Personal Link & Note Manager. Install directly on your device, zero cloud database, zero servers, complete local privacy!';

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl
        });
        Toast.success('ManageLinks live application shared successfully!');
        return { success: true };
      } catch (err) {
        if (err.name === 'AbortError') return { success: false, aborted: true };
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(appUrl);
      Toast.success('ManageLinks application link copied to clipboard!');
    } catch {
      Toast.info('Link ready to share: ' + appUrl);
    }
  },

  /**
   * Copies the live application link to the clipboard
   */
  async copyAppUrl() {
    const appUrl = this.getAppUrl();
    try {
      await navigator.clipboard.writeText(appUrl);
      Toast.success('Application link copied to clipboard!');
      return true;
    } catch {
      const input = document.createElement('input');
      input.value = appUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      Toast.success('Application link copied to clipboard!');
      return true;
    }
  },

  /**
   * Bundles all web app files into a portable offline ZIP package
   * For users who want to run the tool from a USB flash drive without internet
   */
  async downloadAppZip() {
    if (typeof window.JSZip === 'undefined') {
      Toast.error('JSZip library is required to build the offline bundle.');
      return;
    }

    try {
      Toast.info('Packaging portable offline ManageLinks bundle...');
      const zip = new window.JSZip();

      // Fetch each file relative to app root
      let successCount = 0;
      await Promise.all(this.APP_FILES.map(async (filePath) => {
        try {
          const response = await fetch(`./${filePath}`);
          if (response.ok) {
            const blob = await response.blob();
            zip.file(filePath, blob);
            successCount++;
          }
        } catch (e) {
          console.warn(`Could not bundle file ${filePath}:`, e);
        }
      }));

      // Add a helpful portable offline README
      const readmeContent = `=====================================================
ManageLinks - Portable Standalone Offline Edition
Developed by: Devraj Chauhan (chauhandevraj473@gmail.com)
Application: 100% Offline-First Personal Bookmark & Note Manager
GitHub: https://github.com/Devraj473/ManageLinks
=====================================================

HOW TO USE THIS APPLICATION OFFLINE:
1. Extract all files from this ZIP package to any directory or USB flash drive.
2. Open "index.html" in any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari).
3. That's it! No internet connection, server, database, or hosting is required.

INSTALLING AS PWA:
- In Google Chrome or Microsoft Edge: Click the "Install" icon in the browser address bar or click "Install App" in the navigation.
- On Mobile (Android / iPhone): Open in browser, tap Share / Menu -> "Add to Home Screen" to install as a native offline app.

ManageLinks: Your Links. Your Categories. Your Control.
=====================================================`;

      zip.file('START_HERE_README.txt', readmeContent);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const filename = `ManageLinks-Portable-Offline-v1.0.zip`;
      FileUtils.downloadFile(zipBlob, filename, 'application/zip');

      Toast.success(`Portable offline tool downloaded (${FileUtils.formatSize(zipBlob.size)})! Extract and run anywhere without a server.`);
    } catch (err) {
      console.error('App download error:', err);
      Toast.error(`Failed to package offline app: ${err.message}`);
    }
  }
};
