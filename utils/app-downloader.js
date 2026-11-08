/**
 * ManageLinks - Portable Offline Tool Downloader
 * Developer: Devraj Chauhan
 * Packages the entire application into a portable, zero-server standalone ZIP
 */

import { Toast } from '../assets/js/notifications.js';
import { FileUtils } from './file-utils.js';

export const AppDownloader = {
  cachedExeBlob: null,
  cachedZipBlob: null,
  isPreparingCache: false,

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
   * Resolves direct public / LAN URLs for the application installer files
   */
  getInstallerUrls() {
    const loc = window.location;
    const origin = (loc.origin && loc.origin !== 'null') ? loc.origin : '';
    let pathname = loc.pathname || '/';
    pathname = pathname.replace(/\/index\.html$/i, '');
    if (!pathname.endsWith('/')) pathname += '/';
    const baseUrl = `${origin}${pathname}`;
    return {
      baseUrl,
      exeUrl: `${baseUrl}ManageLinks-Setup.exe`,
      zipUrl: `${baseUrl}ManageLinks-Windows-Installer.zip`
    };
  },

  /**
   * Pre-fetches installer binaries into memory in the background
   * This ensures navigator.share retains transient user activation (no async delays on click)
   */
  async prepareCache() {
    if (this.isPreparingCache) return;
    this.isPreparingCache = true;

    try {
      if (!this.cachedZipBlob) {
        const resZip = await fetch('ManageLinks-Windows-Installer.zip');
        if (resZip.ok) this.cachedZipBlob = await resZip.blob();
      }
    } catch (e) {
      console.warn('Could not pre-fetch installer zip:', e);
    }

    try {
      if (!this.cachedExeBlob) {
        const resExe = await fetch('ManageLinks-Setup.exe');
        if (resExe.ok) this.cachedExeBlob = await resExe.blob();
      }
    } catch (e) {
      console.warn('Could not pre-fetch installer exe:', e);
    }

    this.isPreparingCache = false;
  },

  /**
   * Directly shares the installer file or application via Web Share API
   * Under NO circumstances does this trigger a file download!
   */
  async shareDirectly() {
    const { exeUrl } = this.getInstallerUrls();
    const shareTitle = 'ManageLinks by Devraj Chauhan';
    const shareText = 'ManageLinks v1.0 - 100% Offline Personal Link & Bookmark Manager. Zero server, zero cloud database, zero dependencies. Run standalone on your PC!';

    // Ensure cache is available or at least attempted
    if (!this.cachedZipBlob && !this.cachedExeBlob) {
      await this.prepareCache();
    }

    if (!navigator.share) {
      Toast.warning('System share sheet is not supported by your browser. Use the direct WhatsApp, Telegram, Email, or Copy Link buttons below!');
      return { success: false, reason: 'unsupported' };
    }

    try {
      // 1. Attempt sharing the compressed installer bundle (Chromium Web Share accepts application/zip)
      if (this.cachedZipBlob) {
        const zipFile = new File([this.cachedZipBlob], 'ManageLinks-Windows-Installer.zip', { type: 'application/zip' });
        if (navigator.canShare && navigator.canShare({ files: [zipFile] })) {
          await navigator.share({
            files: [zipFile],
            title: shareTitle,
            text: `${shareText}\n\nInstaller package attached! Extract and run ManageLinks-Setup.exe to install.`
          });
          Toast.success('ManageLinks installer package shared successfully!');
          return { success: true, method: 'native-file' };
        }
      }

      // 2. Attempt sharing the raw .exe if the environment supports executable file sharing
      if (this.cachedExeBlob) {
        const exeFile = new File([this.cachedExeBlob], 'ManageLinks-Setup.exe', { type: 'application/x-msdownload' });
        if (navigator.canShare && navigator.canShare({ files: [exeFile] })) {
          await navigator.share({
            files: [exeFile],
            title: shareTitle,
            text: `${shareText}\n\nInstaller file attached! Double-click ManageLinks-Setup.exe to install.`
          });
          Toast.success('ManageLinks-Setup.exe shared successfully!');
          return { success: true, method: 'native-file' };
        }
      }

      // 3. Fallback to sharing the direct URL and summary through the native share sheet
      await navigator.share({
        title: shareTitle,
        text: `${shareText}\n\nDirect Installer Link: ${exeUrl}`,
        url: exeUrl
      });
      Toast.success('Application shared via System Share Sheet!');
      return { success: true, method: 'native-url' };
    } catch (err) {
      if (err.name === 'AbortError') {
        // User closed or dismissed the share sheet - do nothing, never download!
        return { success: false, aborted: true };
      }
      console.warn('System share error:', err);
      Toast.warning('Could not launch system share sheet. Use the direct WhatsApp, Telegram, or Email options below!');
      return { success: false, error: err };
    }
  },

  /**
   * Alias for shareDirectly (strictly never downloads!)
   */
  async shareInstallerExe() {
    return this.shareDirectly();
  },

  /**
   * Copies the direct .exe installer link to the clipboard
   */
  async copyInstallerUrl() {
    const { exeUrl } = this.getInstallerUrls();
    try {
      await navigator.clipboard.writeText(exeUrl);
      Toast.success('Direct .EXE installer link copied to clipboard!');
      return true;
    } catch {
      const input = document.createElement('input');
      input.value = exeUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      Toast.success('Direct .EXE installer link copied to clipboard!');
      return true;
    }
  },

  /**
   * Downloads the compiled standalone Windows installer (.exe)
   * Only called when user explicitly clicks a Download button!
   */
  downloadInstallerExe() {
    try {
      Toast.info('Downloading ManageLinks-Setup.exe installer...');
      const a = document.createElement('a');
      a.href = 'ManageLinks-Setup.exe';
      a.download = 'ManageLinks-Setup.exe';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      Toast.success('ManageLinks-Setup.exe download started! Run it to automatically install.');
    } catch (err) {
      console.error('Download error:', err);
      Toast.error('Download failed: ' + err.message);
    }
  },

  /**
   * Downloads the standalone Windows installer ZIP package
   * Only called when user explicitly clicks a Download button!
   */
  downloadInstallerZip() {
    try {
      Toast.info('Downloading ManageLinks-Windows-Installer.zip...');
      const a = document.createElement('a');
      a.href = 'ManageLinks-Windows-Installer.zip';
      a.download = 'ManageLinks-Windows-Installer.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      Toast.success('ManageLinks-Windows-Installer.zip download started!');
    } catch (err) {
      console.error('Download error:', err);
      Toast.error('Download failed: ' + err.message);
    }
  },

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
