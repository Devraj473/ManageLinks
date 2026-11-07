/**
 * ManageLinks - Portable Offline Tool Downloader
 * Developer: Devraj Chauhan
 * Packages the entire application into a portable, zero-server standalone ZIP
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
   * Bundles all app files into a portable ZIP package and initiates download
   */
  async downloadAppZip() {
    if (typeof window.JSZip === 'undefined') {
      Toast.error('JSZip is required to build the offline bundle.');
      return;
    }

    try {
      Toast.info('Packaging portable offline ManageLinks tool...');
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
Developed by: Devraj Chauhan
Application: 100% Offline-First Personal Bookmark Manager
=====================================================

HOW TO USE THIS APPLICATION:
1. Extract all files from this ZIP package to any directory or USB flash drive.
2. Open "index.html" in any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari, etc.).
3. That's it! No internet connection, server, database, or hosting is required.

FEATURES & PRIVACY:
- All your links, categories, folders, and notes are stored 100% locally on your computer in your browser's IndexedDB.
- Zero tracking, zero cloud dependencies, zero external subscriptions.
- Create JSON/ZIP backups anytime to move your bookmarks to another computer or phone.
- Export clickable PDFs and HTML bookmarks anytime.

ManageLinks: Your Links. Your Categories. Your Control.
=====================================================`;

      zip.file('START_HERE_README.txt', readmeContent);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      const filename = `ManageLinks-Portable-Offline-v1.1.zip`;
      FileUtils.downloadFile(zipBlob, filename, 'application/zip');

      Toast.success(`Portable offline tool downloaded (${FileUtils.formatSize(zipBlob.size)})! Extract and run anywhere without a server.`);
    } catch (err) {
      console.error('App download error:', err);
      Toast.error(`Failed to package offline app: ${err.message}`);
    }
  }
};
