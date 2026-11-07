/**
 * ManageLinks - Navbar Component
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';

export const NavbarComponent = {
  render() {
    return `
      <div class="d-flex align-items-center gap-2">
        <button id="sidebar-toggle-btn" class="btn-ml-icon" title="Toggle Navigation Sidebar">
          ${Icons.get('menu', { size: 20 })}
        </button>
        <span class="fw-bold fs-6 d-flex align-items-center gap-2 text-dark">
          <span class="d-none d-sm-inline">ManageLinks</span>
        </span>
      </div>

      <div class="header-search">
        <span class="search-icon">${Icons.get('search', { size: 16 })}</span>
        <input type="text" id="global-search-input" placeholder="Search links, tags, notes, categories..." readonly />
        <span class="kbd-shortcut">Ctrl K</span>
      </div>

      <div class="header-actions">
        <button id="nav-share-app-btn" class="btn-ml-icon text-primary d-inline-flex" title="Share & Download ManageLinks Tool">
          ${Icons.get('share-2', { size: 18, color: 'var(--ml-primary)' })}
        </button>

        <button id="nav-install-btn" class="btn-ml-icon text-success d-inline-flex" title="Install ManageLinks App on Device">
          ${Icons.get('smartphone', { size: 18, color: '#16a34a' })}
        </button>

        <button id="nav-pdf-btn" class="btn-ml-icon text-danger d-inline-flex" title="Export Links as Clickable PDF">
          ${Icons.get('file-text', { size: 18, color: '#dc2626' })}
        </button>

        <button id="nav-random-btn" class="btn-ml-icon d-none d-sm-inline-flex" title="Open Random Link">
          ${Icons.get('shuffle', { size: 18 })}
        </button>

        <button id="theme-toggle-btn" class="btn-ml-icon" title="Toggle Theme">
          ${Icons.get('sun', { size: 18, className: 'theme-icon-sun' })}
        </button>

        <a href="#data-management" class="btn-ml-icon" title="Backup Center">
          ${Icons.get('database', { size: 18 })}
        </a>

        <button id="btn-quick-add" class="btn-ml-primary">
          ${Icons.get('plus', { size: 18, color: '#fff' })}
          <span class="d-none d-sm-inline">Add Link</span>
        </button>
      </div>
    `;
  }
};
