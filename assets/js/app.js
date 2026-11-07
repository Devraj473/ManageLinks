/**
 * ManageLinks - Core Application Bootstrap
 * Developer: Devraj Chauhan
 * PWA Architecture, Router Initialization, Event Delegation & PIN Management
 */

import { db } from './database.js';
import { Storage } from './storage.js';
import { SettingsManager } from './settings.js';
import { CategoryManager } from './category-manager.js';
import { Security } from './security.js';
import { Router } from './router.js';
import { Shortcuts } from './shortcuts.js';
import { Toast } from './notifications.js';
import { Icons } from './icons.js';

// Components
import { SidebarComponent } from '../../components/sidebar.js';
import { NavbarComponent } from '../../components/navbar.js';
import { LinkModal } from '../../components/link-modal.js';
import { CategoryModal } from '../../components/category-modal.js';
import { FolderModal } from '../../components/folder-modal.js';
import { CollectionModal } from '../../components/collection-modal.js';
import { SearchModal } from '../../components/search-modal.js';
import { ConfirmationModal } from '../../components/confirmation-modal.js';
import { PdfModal } from '../../components/pdf-modal.js';
import { ShareModal } from '../../components/share-modal.js';
import { PwaInstaller } from './pwa-installer.js';
import { AppDownloader } from '../../utils/app-downloader.js';

// Pages
import { DashboardPage } from '../../pages/dashboard.js';
import { AllLinksPage } from '../../pages/all-links.js';
import { LinkInboxPage } from '../../pages/link-inbox.js';
import { FavoritesPage } from '../../pages/favorites.js';
import { CategoriesPage } from '../../pages/categories.js';
import { FoldersPage } from '../../pages/folders.js';
import { CollectionsPage } from '../../pages/collections.js';
import { ReadingListPage } from '../../pages/reading-list.js';
import { ArchivePage } from '../../pages/archive.js';
import { TrashPage } from '../../pages/trash.js';
import { AnalyticsPage } from '../../pages/analytics.js';
import { DataManagementPage } from '../../pages/data-management.js';
import { SettingsPage } from '../../pages/settings.js';
import { AboutPage } from '../../pages/about.js';

export const App = {
  router: null,

  async init() {
    try {
      // 1. Open IndexedDB
      await db.open();

      // 2. Load settings and apply theme
      const settings = await SettingsManager.getAll();
      SettingsManager.applyTheme(settings.theme || 'system');

      // 3. Seed default categories if first launch
      await CategoryManager.seedDefaults();

      // 4. Render Layout Shell
      this.renderAppShell();

      // 5. Initialize Modals
      LinkModal.init();
      CategoryModal.init();
      FolderModal.init();
      CollectionModal.init();
      SearchModal.init();
      ConfirmationModal.init();
      PdfModal.init();
      ShareModal.init();
      PwaInstaller.init();
      Toast.init();

      // 6. Check PIN Lock
      const pinEnabled = await Security.isPinEnabled();
      if (pinEnabled && !Security.isSessionUnlocked()) {
        this.showPinLock();
      }

      // Initialize inactivity auto-lock
      if (settings.autoLockMinutes > 0) {
        Security.initInactivityTracker(settings.autoLockMinutes);
      }

      // 7. Setup SPA Router
      this.setupRouter();

      // 8. Register Global Shortcuts & Listeners
      this.setupShortcuts();
      this.setupGlobalEvents();

      // 9. Register Service Worker for PWA
      this.registerServiceWorker();

      // 10. Update sidebar badge counts
      SidebarComponent.updateBadges();

      // Listen for data modifications to keep badges AND the current view updated in real time!
      const handleDataChange = () => this.refreshCurrentView();
      window.addEventListener('ml-link-saved', handleDataChange);
      window.addEventListener('ml-link-deleted', handleDataChange);
      window.addEventListener('ml-category-saved', handleDataChange);
      window.addEventListener('ml-category-deleted', handleDataChange);
      window.addEventListener('ml-folder-saved', handleDataChange);
      window.addEventListener('ml-folder-deleted', handleDataChange);
      window.addEventListener('ml-collection-saved', handleDataChange);
      window.addEventListener('ml-collection-deleted', handleDataChange);
      window.addEventListener('ml-data-restored', handleDataChange);

      console.log('ManageLinks initialized successfully. Developed by Devraj Chauhan.');
    } catch (err) {
      console.error('Fatal initialization error:', err);
      document.body.innerHTML = `
        <div class="p-5 text-center">
          <h3 class="text-danger">Failed to initialize ManageLinks</h3>
          <p class="text-secondary">${err.message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Reload App</button>
        </div>
      `;
    }
  },

  renderAppShell() {
    const root = document.getElementById('app-root');
    root.innerHTML = `
      <!-- Desktop Sidebar -->
      <aside id="sidebar">
        ${SidebarComponent.render()}
      </aside>

      <!-- Sidebar Mobile Backdrop -->
      <div id="sidebar-backdrop"></div>

      <!-- Main Wrapper -->
      <div id="main-wrapper">
        <!-- Top Navbar -->
        <header id="top-header">
          ${NavbarComponent.render()}
        </header>

        <!-- Dynamic Content View Area -->
        <main id="content-area">
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
        </main>

        <!-- App Footer -->
        <footer id="app-footer">
          <div>ManageLinks &copy; 2026 &bull; Developed by <strong>Devraj Chauhan</strong></div>
          <div class="text-muted">100% Offline PWA &bull; Client-Side Storage</div>
        </footer>
      </div>

      <!-- Mobile Bottom Navigation -->
      <nav id="mobile-bottom-nav">
        <a href="#dashboard" class="mobile-nav-item active">
          ${Icons.get('layout-dashboard', { size: 18 })}
          <span>Home</span>
        </a>
        <a href="#all-links" class="mobile-nav-item">
          ${Icons.get('link', { size: 18 })}
          <span>Links</span>
        </a>
        <a href="#inbox" class="mobile-nav-item">
          ${Icons.get('inbox', { size: 18 })}
          <span>Inbox</span>
        </a>
        <a href="#favorites" class="mobile-nav-item">
          ${Icons.get('star', { size: 18 })}
          <span>Starred</span>
        </a>
        <a href="#categories" class="mobile-nav-item">
          ${Icons.get('folder', { size: 18 })}
          <span>Categories</span>
        </a>
      </nav>

      <!-- Mobile Floating Add Button -->
      <button id="fab-add" title="Add Link">
        ${Icons.get('plus', { size: 24, color: '#fff' })}
      </button>

      <!-- Toast Notification Container -->
      <div id="toast-container"></div>
    `;

    this.bindShellEvents();
  },

  bindShellEvents() {
    // Quick Add button
    document.getElementById('btn-quick-add')?.addEventListener('click', () => LinkModal.openForAdd());
    document.getElementById('fab-add')?.addEventListener('click', () => LinkModal.openForAdd());

    // Export PDF button in Navbar
    document.getElementById('nav-pdf-btn')?.addEventListener('click', () => PdfModal.open());
    window.addEventListener('ml-open-pdf-modal', (e) => PdfModal.open(e.detail || {}));

    // Share Tool & Install buttons
    document.getElementById('nav-share-app-btn')?.addEventListener('click', () => ShareModal.openForApp());
    document.getElementById('nav-install-btn')?.addEventListener('click', () => PwaInstaller.promptInstall());
    document.getElementById('sidebar-share-app-btn')?.addEventListener('click', () => ShareModal.openForApp());
    document.getElementById('sidebar-install-pwa-btn')?.addEventListener('click', () => PwaInstaller.promptInstall());
    window.addEventListener('ml-open-share-modal', (e) => {
      if (e.detail?.linkId) {
        ShareModal.openForLink(e.detail.linkId);
      } else {
        ShareModal.openForApp();
      }
    });
    window.addEventListener('ml-download-offline-app', () => AppDownloader.downloadAppZip());
    window.addEventListener('ml-prompt-install', () => PwaInstaller.promptInstall());

    // Search bar click opens Search Modal
    document.getElementById('global-search-input')?.addEventListener('click', () => SearchModal.open());

    // Theme toggle button
    document.getElementById('theme-toggle-btn')?.addEventListener('click', async () => {
      const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      await SettingsManager.set('theme', next);
    });

    // Random Link Opener
    document.getElementById('nav-random-btn')?.addEventListener('click', async () => {
      const allLinks = await db.getAll('links');
      const active = allLinks.filter(l => !l.isArchived);
      if (active.length === 0) {
        Toast.info('No active links to open');
        return;
      }
      const randomLink = active[Math.floor(Math.random() * active.length)];
      const { LinkManager } = await import('./link-manager.js');
      await LinkManager.recordVisit(randomLink.id);
      window.open(randomLink.url, '_blank', 'noopener,noreferrer');
      Toast.info(`Opened: ${randomLink.title}`);
    });

    // Universal Sidebar Toggle (Desktop Collapse & Mobile Slide-in)
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    const toggleSidebar = () => {
      const isDesktop = window.innerWidth >= 992;
      if (isDesktop) {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        Storage.set('sidebarCollapsed', isCollapsed);
      } else {
        const willShow = !sidebar.classList.contains('show-mobile');
        sidebar.classList.toggle('show-mobile', willShow);
        backdrop.classList.toggle('show', willShow);
      }
    };

    const closeMobileSidebar = () => {
      sidebar.classList.remove('show-mobile');
      backdrop.classList.remove('show');
    };

    // Navbar toggle button (works everywhere)
    document.getElementById('sidebar-toggle-btn')?.addEventListener('click', toggleSidebar);

    // Sidebar internal toggle buttons
    document.getElementById('sidebar-brand-icon')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-collapse-desktop-btn')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-close-mobile-btn')?.addEventListener('click', closeMobileSidebar);

    // Backdrop dismissal
    backdrop?.addEventListener('click', closeMobileSidebar);

    // Auto-close sidebar on mobile when navigating
    document.querySelectorAll('.sidebar-nav .nav-link-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth < 992) {
          closeMobileSidebar();
        }
      });
    });

    if (window.innerWidth >= 992 && Storage.get('sidebarCollapsed', false)) {
      sidebar.classList.add('collapsed');
    }
  },

  refreshCurrentView() {
    SidebarComponent.updateBadges();
    const route = this.router ? this.router.currentRoute : 'dashboard';
    const param = this.router ? this.router.currentParam : null;

    if (route === 'all-links' && typeof AllLinksPage.loadLinks === 'function') {
      AllLinksPage.loadLinks();
    } else if (route === 'favorites' || route === 'pinned') {
      if (typeof FavoritesPage.loadLinks === 'function') {
        FavoritesPage.loadLinks();
      } else {
        FavoritesPage.render();
      }
    } else if (route === 'inbox') {
      if (typeof LinkInboxPage.loadInboxLinks === 'function') {
        LinkInboxPage.loadInboxLinks();
      } else {
        LinkInboxPage.render();
      }
    } else if (route === 'reading-list') {
      if (typeof ReadingListPage.loadReadingLinks === 'function') {
        ReadingListPage.loadReadingLinks();
      } else {
        ReadingListPage.render();
      }
    } else if (route === 'categories' || route === 'category') {
      CategoriesPage.render(param);
    } else if (route === 'folders' || route === 'folder') {
      FoldersPage.render(param);
    } else if (route === 'collections' || route === 'collection') {
      CollectionsPage.render(param);
    } else if (route === 'dashboard') {
      DashboardPage.render();
    } else if (route === 'archive') {
      ArchivePage.render?.();
    } else if (route === 'trash') {
      TrashPage.render?.();
    } else if (this.router) {
      this.router.refresh();
    }
  },

  setupRouter() {
    this.router = new Router({
      'dashboard': () => DashboardPage.render(),
      'inbox': () => LinkInboxPage.render(),
      'all-links': () => AllLinksPage.render(),
      'favorites': () => FavoritesPage.render(),
      'pinned': () => FavoritesPage.render(),
      'categories': () => CategoriesPage.render(),
      'category': (id) => CategoriesPage.render(id),
      'folders': () => FoldersPage.render(),
      'folder': (id) => FoldersPage.render(id),
      'collections': () => CollectionsPage.render(),
      'collection': (id) => CollectionsPage.render(id),
      'reading-list': () => ReadingListPage.render(),
      'recently-visited': async () => {
        // Recently visited view
        const container = document.getElementById('content-area');
        container.innerHTML = `
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
            <div>
              <h2 class="fw-bold mb-1">Recently Visited</h2>
              <p class="text-secondary mb-0">Bookmarks you have opened recently, sorted by last visit.</p>
            </div>
          </div>
          <div id="recent-visited-list"><div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div></div>
        `;
        const { SearchEngine } = await import('./search.js');
        const { LinkCard } = await import('../../components/link-card.js');
        const { EmptyState } = await import('../../components/empty-state.js');
        const { UI } = await import('./ui.js');

        const links = await SearchEngine.search('', { sortBy: 'recently-visited' });
        const visitedOnly = links.filter(l => !!l.lastVisitedAt && !l.isArchived);
        const listEl = document.getElementById('recent-visited-list');

        if (visitedOnly.length === 0) {
          listEl.innerHTML = EmptyState.render({
            icon: 'clock',
            title: 'No visited links yet',
            description: 'Open any saved link to automatically track your visit history.'
          });
        } else {
          listEl.innerHTML = `
            <div class="link-grid">
              ${visitedOnly.map(l => LinkCard.render(l, { viewMode: 'grid' })).join('')}
            </div>
          `;
          UI.bindLinkEvents(listEl, () => window.location.reload());
        }
      },
      'archive': () => ArchivePage.render(),
      'trash': () => TrashPage.render(),
      'analytics': () => AnalyticsPage.render(),
      'data-management': (subTab) => DataManagementPage.render(subTab),
      'settings': () => SettingsPage.render(),
      'about': () => AboutPage.render()
    });

    this.router.init();
  },

  setupShortcuts() {
    Shortcuts.init({
      onSearch: () => SearchModal.open(),
      onAddLink: () => LinkModal.openForAdd(),
      onCreateCategory: () => CategoryModal.open(),
      onBackup: () => { window.location.hash = '#data-management/backup'; },
      onFavorites: () => { window.location.hash = '#favorites'; },
      onEscape: () => {
        document.querySelectorAll('.modal.show').forEach(m => {
          const bsModal = bootstrap.Modal.getInstance(m);
          if (bsModal) bsModal.hide();
        });
      }
    });
  },

  setupGlobalEvents() {
    // Lock screen event
    window.addEventListener('ml-lock-screen', () => {
      this.showPinLock();
    });

    // Online / Offline notifications
    window.addEventListener('online', () => {
      Toast.info('Device is back online');
    });
    window.addEventListener('offline', () => {
      Toast.warning('Offline mode active &bull; All changes saved locally');
    });
  },

  showPinLock() {
    let overlay = document.getElementById('pin-lock-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pin-lock-overlay';
      overlay.innerHTML = `
        <div class="pin-lock-box">
          <div class="mb-3 text-primary">
            ${Icons.get('lock', { size: 40 })}
          </div>
          <h4 class="fw-bold mb-1">ManageLinks Locked</h4>
          <p class="text-secondary small mb-3">Enter your master PIN to access your bookmarks.</p>

          <form id="pin-lock-form">
            <div class="mb-3">
              <input type="password" id="pin-entry-input" class="form-control form-control-lg text-center" maxlength="8" placeholder="&bull; &bull; &bull; &bull;" autofocus autocomplete="off" required />
              <div id="pin-error-feedback" class="text-danger small mt-2 d-none">Incorrect PIN. Please try again.</div>
            </div>
            <button type="submit" class="btn-ml-primary w-100 justify-content-center py-2">Unlock</button>
          </form>
        </div>
      `;
      document.body.appendChild(overlay);

      document.getElementById('pin-lock-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pin = document.getElementById('pin-entry-input').value.trim();
        const feedback = document.getElementById('pin-error-feedback');

        const valid = await Security.verifyPin(pin);
        if (valid) {
          overlay.remove();
          Toast.success('Unlocked');
        } else {
          feedback.classList.remove('d-none');
          document.getElementById('pin-entry-input').value = '';
          document.getElementById('pin-entry-input').focus();
        }
      });
    }
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => {
            console.log('ServiceWorker registered with scope:', reg.scope);
          })
          .catch(err => {
            console.warn('ServiceWorker registration failed (requires http/https):', err);
          });
      });
    }
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
