/**
 * ManageLinks - Service Worker (Offline-First Cache)
 * Developer: Devraj Chauhan
 * Caches application shell assets while leaving user IndexedDB data intact
 */

const CACHE_NAME = 'managelinks-shell-v1.4.0';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/vendor/bootstrap.min.css',
  './assets/vendor/bootstrap.bundle.min.js',
  './assets/vendor/jszip.min.js',
  './assets/css/themes.css',
  './assets/css/style.css',
  './assets/css/components.css',
  './assets/css/responsive.css',
  './assets/js/app.js',
  './assets/js/database.js',
  './assets/js/storage.js',
  './assets/js/icons.js',
  './assets/js/link-manager.js',
  './assets/js/category-manager.js',
  './assets/js/folder-manager.js',
  './assets/js/collection-manager.js',
  './assets/js/notes-manager.js',
  './assets/js/search.js',
  './assets/js/filters.js',
  './assets/js/analytics.js',
  './assets/js/backup.js',
  './assets/js/restore.js',
  './assets/js/import.js',
  './assets/js/export.js',
  './assets/js/security.js',
  './assets/js/settings.js',
  './assets/js/notifications.js',
  './assets/js/shortcuts.js',
  './assets/js/router.js',
  './assets/js/ui.js',
  './assets/js/pwa-installer.js',
  './components/sidebar.js',
  './components/navbar.js',
  './components/link-card.js',
  './components/link-modal.js',
  './components/note-modal.js',
  './components/category-modal.js',
  './components/folder-modal.js',
  './components/collection-modal.js',
  './components/search-modal.js',
  './components/confirmation-modal.js',
  './components/pdf-modal.js',
  './components/share-modal.js',
  './components/toast.js',
  './components/empty-state.js',
  './pages/dashboard.js',
  './pages/all-links.js',
  './pages/link-inbox.js',
  './pages/favorites.js',
  './pages/categories.js',
  './pages/folders.js',
  './pages/collections.js',
  './pages/notes.js',
  './pages/reading-list.js',
  './pages/archive.js',
  './pages/trash.js',
  './pages/analytics.js',
  './pages/data-management.js',
  './pages/settings.js',
  './pages/about.js',
  './utils/validators.js',
  './utils/date-utils.js',
  './utils/url-utils.js',
  './utils/file-utils.js',
  './utils/csv-parser.js',
  './utils/pdf-generator.js',
  './utils/app-downloader.js',
  './utils/html-bookmark-parser.js',
  './utils/encryption.js',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.svg',
  './assets/icons/icon-512.svg'
];

// Install: Cache all core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline application shell');
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('[ServiceWorker] Some assets could not be cached immediately:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first strategy for local application assets, network fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore cross-origin external requests (never cache user external bookmark websites)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache valid local resources dynamically
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to index.html for navigation requests when offline
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
