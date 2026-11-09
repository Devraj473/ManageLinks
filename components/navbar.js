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
        <button id="nav-share-app-btn" class="btn-ml-icon text-primary d-inline-flex" title="Share ManageLinks App">
          ${Icons.get('share-2', { size: 18, color: 'var(--ml-primary)' })}
        </button>

        <button id="theme-toggle-btn" class="btn-ml-icon" title="Toggle Theme">
          ${Icons.get('sun', { size: 18, className: 'theme-icon-sun' })}
        </button>

        <button id="btn-quick-add" class="btn-ml-primary">
          ${Icons.get('plus', { size: 18, color: '#fff' })}
          <span class="d-none d-sm-inline">Add Link</span>
        </button>
      </div>
    `;
  }
};
