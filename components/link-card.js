/**
 * ManageLinks - Link Card Component
 * Developer: Devraj Chauhan
 * Supports Grid View, List View, Compact View, and Full Actions
 */

import { Icons } from '../assets/js/icons.js';
import { UrlUtils } from '../utils/url-utils.js';
import { DateUtils } from '../utils/date-utils.js';
import { Security } from '../assets/js/security.js';

export const LinkCard = {
  /**
   * Render link in specified view mode
   */
  render(link, { viewMode = 'grid', categoryName = '', folderName = '', searchQuery = '', isSelected = false } = {}) {
    if (viewMode === 'compact') {
      return this.renderCompact(link, { categoryName, folderName, isSelected });
    }
    if (viewMode === 'list') {
      return this.renderList(link, { categoryName, folderName, searchQuery, isSelected });
    }
    return this.renderGrid(link, { categoryName, folderName, searchQuery, isSelected });
  },

  /**
   * Grid View
   */
  renderGrid(link, { categoryName, folderName, searchQuery, isSelected }) {
    const initials = UrlUtils.getDomainInitials(link.url);
    const displayUrl = UrlUtils.formatForDisplay(link.url, 40);
    const escapedTitle = Security.escapeHtml(link.title);
    const escapedDesc = Security.escapeHtml(link.description || '');

    const tagsHtml = (link.tags || []).map(t => 
      `<span class="badge-tag">${Icons.get('tag', { size: 12 })} ${Security.escapeHtml(t)}</span>`
    ).join('');

    const categoryBadge = categoryName ? `
      <span class="badge-category" style="background-color: var(--ml-primary-light); color: var(--ml-primary);">
        ${Icons.get('folder', { size: 12 })} ${Security.escapeHtml(categoryName)}
      </span>
    ` : '';

    const folderBadge = folderName ? `
      <span class="badge-folder">
        ${Icons.get('folder-tree', { size: 12 })} ${Security.escapeHtml(folderName)}
      </span>
    ` : '';

    const readingBadge = link.isReadLater ? `
      <span class="badge-tag text-capitalize" style="background-color: #fef3c7; color: #92400e;">
        ${Icons.get('book-open', { size: 12 })} ${link.readingStatus || 'unread'}
      </span>
    ` : '';

    return `
      <div class="link-card ${link.isPinned ? 'pinned' : ''}" data-id="${link.id}">
        <div class="card-header-row">
          <input type="checkbox" class="form-check-input link-select-checkbox mt-1 me-1" ${isSelected ? 'checked' : ''} data-id="${link.id}" title="Select for bulk action" />
          
          <div class="link-favicon" ${link.color ? `style="border-color:${link.color}; color:${link.color};"` : ''}>
            ${initials}
          </div>

          <div class="link-card-meta">
            <a href="${Security.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-card-title action-open-link" data-id="${link.id}">
              ${escapedTitle}
            </a>
            <a href="${Security.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-card-url action-open-link" data-id="${link.id}">
              ${Icons.get('external-link', { size: 12 })}
              <span>${displayUrl}</span>
            </a>
          </div>

          <button class="link-action-btn action-star ${link.isFavorite ? 'active-star' : ''}" data-id="${link.id}" title="${link.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            ${Icons.get('star', { size: 18, color: link.isFavorite ? '#f59e0b' : 'currentColor' })}
          </button>
        </div>

        ${escapedDesc ? `<div class="link-card-desc">${escapedDesc}</div>` : '<div class="link-card-desc text-muted fst-italic" style="font-size:0.8rem;">No description provided</div>'}

        <div class="link-card-badges">
          ${categoryBadge}
          ${folderBadge}
          ${readingBadge}
          ${tagsHtml}
        </div>

        <div class="link-card-actions">
          <div class="d-flex align-items-center gap-1">
            <button class="link-action-btn action-pin ${link.isPinned ? 'active-pin' : ''}" data-id="${link.id}" title="${link.isPinned ? 'Unpin' : 'Pin to top'}">
              ${Icons.get('pin', { size: 15, color: link.isPinned ? 'var(--ml-primary)' : 'currentColor' })}
            </button>

            <button class="link-action-btn action-readlater ${link.isReadLater ? 'text-primary' : ''}" data-id="${link.id}" title="${link.isReadLater ? 'Reading list' : 'Add to Read Later'}">
              ${Icons.get('book-open', { size: 15 })}
            </button>

            <!-- Copy dropdown -->
            <div class="dropdown d-inline">
              <button class="link-action-btn" data-bs-toggle="dropdown" title="Copy options">
                ${Icons.get('copy', { size: 15 })}
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size: 0.85rem;">
                <li><button class="dropdown-item action-copy" data-id="${link.id}" data-format="url">Copy URL</button></li>
                <li><button class="dropdown-item action-copy" data-id="${link.id}" data-format="markdown">Copy Markdown [Title](URL)</button></li>
                <li><button class="dropdown-item action-copy" data-id="${link.id}" data-format="html">Copy HTML Link</button></li>
                <li><button class="dropdown-item action-copy" data-id="${link.id}" data-format="title-url">Copy Title & URL</button></li>
              </ul>
            </div>
          </div>

          <div class="d-flex align-items-center gap-1">
            <button class="link-action-btn action-edit" data-id="${link.id}" title="Edit Link">
              ${Icons.get('edit', { size: 15 })}
            </button>

            <!-- More dropdown -->
            <div class="dropdown d-inline">
              <button class="link-action-btn" data-bs-toggle="dropdown" title="More options">
                ${Icons.get('more-vertical', { size: 15 })}
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm" style="font-size: 0.85rem;">
                <li><button class="dropdown-item action-open-link" data-id="${link.id}">Open in New Tab</button></li>
                <li><button class="dropdown-item action-details" data-id="${link.id}">View Details & Notes</button></li>
                <li><button class="dropdown-item action-archive" data-id="${link.id}">${link.isArchived ? 'Unarchive' : 'Archive'}</button></li>
                <li><button class="dropdown-item action-duplicate" data-id="${link.id}">Duplicate Record</button></li>
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item text-danger action-delete" data-id="${link.id}">Delete Link</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * List View
   */
  renderList(link, { categoryName, folderName, isSelected }) {
    const initials = UrlUtils.getDomainInitials(link.url);
    const displayUrl = UrlUtils.formatForDisplay(link.url, 45);
    const escapedTitle = Security.escapeHtml(link.title);

    return `
      <div class="link-card ${link.isPinned ? 'pinned' : ''}" data-id="${link.id}">
        <input type="checkbox" class="form-check-input link-select-checkbox me-2" ${isSelected ? 'checked' : ''} data-id="${link.id}" />

        <div class="link-favicon me-3">
          ${initials}
        </div>

        <div class="flex-grow-1 min-w-0 me-3">
          <div class="d-flex align-items-center gap-2">
            <a href="${Security.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-card-title action-open-link" data-id="${link.id}">
              ${escapedTitle}
            </a>
            ${link.isPinned ? Icons.get('pin', { size: 14, color: 'var(--ml-primary)' }) : ''}
            ${link.isFavorite ? Icons.get('star', { size: 14, color: '#f59e0b' }) : ''}
          </div>
          <div class="d-flex align-items-center gap-3">
            <a href="${Security.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-card-url action-open-link" data-id="${link.id}">
              ${displayUrl}
            </a>
            ${categoryName ? `<span class="badge-category" style="background-color: var(--ml-primary-light); color: var(--ml-primary); font-size:0.7rem;">${Security.escapeHtml(categoryName)}</span>` : ''}
          </div>
        </div>

        <div class="link-card-actions">
          <button class="link-action-btn action-star ${link.isFavorite ? 'active-star' : ''}" data-id="${link.id}">
            ${Icons.get('star', { size: 16, color: link.isFavorite ? '#f59e0b' : 'currentColor' })}
          </button>
          <button class="link-action-btn action-edit" data-id="${link.id}">
            ${Icons.get('edit', { size: 16 })}
          </button>
          <button class="link-action-btn action-delete text-danger" data-id="${link.id}">
            ${Icons.get('trash-2', { size: 16 })}
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Compact View
   */
  renderCompact(link, { categoryName, folderName, isSelected }) {
    const escapedTitle = Security.escapeHtml(link.title);
    const displayUrl = UrlUtils.formatForDisplay(link.url, 40);

    return `
      <div class="link-compact-row" data-id="${link.id}">
        <input type="checkbox" class="form-check-input link-select-checkbox me-2" ${isSelected ? 'checked' : ''} data-id="${link.id}" />

        <button class="link-action-btn action-star p-0 me-2 ${link.isFavorite ? 'active-star' : ''}" data-id="${link.id}">
          ${Icons.get('star', { size: 14, color: link.isFavorite ? '#f59e0b' : 'currentColor' })}
        </button>

        <a href="${Security.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="compact-title action-open-link" data-id="${link.id}">
          ${escapedTitle}
        </a>

        <span class="compact-url d-none d-md-inline">
          ${displayUrl}
        </span>

        <span class="compact-cat d-none d-sm-inline">
          ${categoryName ? `<span class="badge bg-light text-dark border">${Security.escapeHtml(categoryName)}</span>` : ''}
        </span>

        <div class="ms-auto d-flex align-items-center gap-1">
          <button class="link-action-btn action-edit p-1" data-id="${link.id}">
            ${Icons.get('edit', { size: 14 })}
          </button>
          <button class="link-action-btn action-delete p-1 text-danger" data-id="${link.id}">
            ${Icons.get('trash-2', { size: 14 })}
          </button>
        </div>
      </div>
    `;
  }
};
