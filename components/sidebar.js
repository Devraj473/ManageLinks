/**
 * ManageLinks - Sidebar Component
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';

export const SidebarComponent = {
  render() {
    return `
      <div class="sidebar-brand">
        <div class="brand-icon" id="sidebar-brand-icon" title="Toggle Sidebar" style="cursor: pointer;">
          ${Icons.get('bookmark', { size: 20, color: '#fff' })}
        </div>
        <div class="d-flex flex-column brand-text">
          <span class="fw-bold fs-6">ManageLinks</span>
          <span class="text-muted" style="font-size: 0.68rem; font-weight: normal;">Your Control</span>
        </div>
        <!-- Desktop Collapse Button -->
        <button id="sidebar-collapse-desktop-btn" class="btn-ml-icon ms-auto d-none d-lg-flex" title="Collapse Sidebar">
          ${Icons.get('chevron-down', { size: 16, className: 'rotate-toggle' })}
        </button>
        <!-- Mobile Close Button -->
        <button id="sidebar-close-mobile-btn" class="btn-ml-icon ms-auto d-lg-none" title="Close Sidebar">
          ${Icons.get('x', { size: 18 })}
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-category-header">Main</div>
        <a href="#dashboard" class="nav-link-item active" data-nav="dashboard">
          ${Icons.get('layout-dashboard', { size: 18 })}
          <span>Dashboard</span>
        </a>
        <a href="#inbox" class="nav-link-item" data-nav="inbox">
          ${Icons.get('inbox', { size: 18 })}
          <span>Link Inbox</span>
          <span class="nav-badge" id="badge-inbox">0</span>
        </a>
        <a href="#all-links" class="nav-link-item" data-nav="all-links">
          ${Icons.get('link', { size: 18 })}
          <span>All Links</span>
          <span class="nav-badge" id="badge-all-links">0</span>
        </a>

        <div class="sidebar-category-header">Organize</div>
        <a href="#favorites" class="nav-link-item" data-nav="favorites">
          ${Icons.get('star', { size: 18 })}
          <span>Favourites</span>
          <span class="nav-badge" id="badge-favorites">0</span>
        </a>
        <a href="#pinned" class="nav-link-item" data-nav="pinned">
          ${Icons.get('pin', { size: 18 })}
          <span>Pinned Links</span>
          <span class="nav-badge" id="badge-pinned">0</span>
        </a>
        <a href="#categories" class="nav-link-item" data-nav="categories">
          ${Icons.get('folder', { size: 18 })}
          <span>Categories</span>
          <span class="nav-badge" id="badge-categories">0</span>
        </a>
        <a href="#folders" class="nav-link-item" data-nav="folders">
          ${Icons.get('folder-tree', { size: 18 })}
          <span>Nested Folders</span>
          <span class="nav-badge" id="badge-folders">0</span>
        </a>
        <a href="#collections" class="nav-link-item" data-nav="collections">
          ${Icons.get('layers', { size: 18 })}
          <span>Collections</span>
          <span class="nav-badge" id="badge-collections">0</span>
        </a>

        <div class="sidebar-category-header">Reading & History</div>
        <a href="#reading-list" class="nav-link-item" data-nav="reading-list">
          ${Icons.get('book-open', { size: 18 })}
          <span>Read Later</span>
          <span class="nav-badge" id="badge-reading">0</span>
        </a>
        <a href="#recently-visited" class="nav-link-item" data-nav="recently-visited">
          ${Icons.get('clock', { size: 18 })}
          <span>Recently Visited</span>
        </a>
        <a href="#archive" class="nav-link-item" data-nav="archive">
          ${Icons.get('archive', { size: 18 })}
          <span>Archive</span>
        </a>
        <a href="#trash" class="nav-link-item" data-nav="trash">
          ${Icons.get('trash-2', { size: 18 })}
          <span>Recently Deleted</span>
          <span class="nav-badge" id="badge-trash">0</span>
        </a>

        <div class="sidebar-category-header">System</div>
        <a href="#analytics" class="nav-link-item" data-nav="analytics">
          ${Icons.get('bar-chart-2', { size: 18 })}
          <span>Analytics</span>
        </a>
        <a href="#data-management" class="nav-link-item" data-nav="data-management">
          ${Icons.get('database', { size: 18 })}
          <span>Backup & Data</span>
        </a>
        <a href="#settings" class="nav-link-item" data-nav="settings">
          ${Icons.get('settings', { size: 18 })}
          <span>Settings</span>
        </a>
        <a href="#about" class="nav-link-item" data-nav="about">
          ${Icons.get('info', { size: 18 })}
          <span>About ManageLinks</span>
        </a>

        <div class="sidebar-category-header">Offline & Portability</div>
        <a href="javascript:void(0)" class="nav-link-item" id="sidebar-share-app-btn">
          ${Icons.get('share-2', { size: 18, color: 'var(--ml-primary)' })}
          <span>Share & Download App</span>
        </a>
        <a href="javascript:void(0)" class="nav-link-item btn-install-app" id="sidebar-install-pwa-btn">
          ${Icons.get('smartphone', { size: 18, color: '#16a34a' })}
          <span>Install App (PWA)</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="developer-badge">
          <div>ManageLinks v1.0.0</div>
          <div class="text-muted" style="font-size: 0.7rem;">By Devraj Chauhan</div>
        </div>
      </div>
    `;
  },

  async updateBadges() {
    try {
      const allLinks = await db.getAll('links');
      const categories = await db.getAll('categories');
      const folders = await db.getAll('folders');
      const collections = await db.getAll('collections');
      const trash = await db.getAll('deletedItems');

      let inbox = 0;
      let fav = 0;
      let pin = 0;
      let read = 0;
      let activeLinks = 0;

      allLinks.forEach(l => {
        if (!l.isArchived) {
          activeLinks++;
          if (!l.categoryId && !l.folderId) inbox++;
          if (l.isFavorite) fav++;
          if (l.isPinned) pin++;
          if (l.isReadLater && l.readingStatus !== 'completed') read++;
        }
      });

      const setBadge = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };

      setBadge('badge-inbox', inbox);
      setBadge('badge-all-links', activeLinks);
      setBadge('badge-favorites', fav);
      setBadge('badge-pinned', pin);
      setBadge('badge-categories', categories.length);
      setBadge('badge-folders', folders.length);
      setBadge('badge-collections', collections.length);
      setBadge('badge-reading', read);
      setBadge('badge-trash', trash.length);
    } catch (e) {
      console.warn('Error updating badges:', e);
    }
  }
};
