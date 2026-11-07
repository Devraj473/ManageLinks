/**
 * ManageLinks - Favourites & Pinned Page
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { SearchEngine } from '../assets/js/search.js';
import { LinkCard } from '../components/link-card.js';
import { EmptyState } from '../components/empty-state.js';
import { UI } from '../assets/js/ui.js';

export const FavoritesPage = {
  isPinnedMode: false,

  async render(param = null) {
    this.isPinnedMode = window.location.hash.includes('pinned');
    const container = document.getElementById('content-area');

    const title = this.isPinnedMode ? 'Pinned Links' : 'Favourite Links';
    const desc = this.isPinnedMode ? 'Links pinned to the top of your workspace for instant access.' : 'Your curated star-marked bookmarks.';

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">${title}</h2>
          <p class="text-secondary mb-0">${desc}</p>
        </div>
        <div>
          <button id="btn-fav-pdf-export" class="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" title="Export as Clickable PDF">
            ${Icons.get('file-text', { size: 16, color: '#dc2626' })}
            <span>Export ${this.isPinnedMode ? 'Pinned' : 'Favourites'} PDF</span>
          </button>
        </div>
      </div>

      <div id="favorites-links-area">
        <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
      </div>
    `;

    document.getElementById('btn-fav-pdf-export')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('ml-open-pdf-modal', {
        detail: {
          scope: this.isPinnedMode ? 'pinned' : 'favorites',
          title: this.isPinnedMode ? 'ManageLinks - Pinned Bookmarks' : 'ManageLinks - Favourite Bookmarks'
        }
      }));
    });

    await this.loadLinks();
  },

  async loadLinks() {
    const area = document.getElementById('favorites-links-area');
    if (!area) return;

    const categories = await db.getAll('categories');
    const folders = await db.getAll('folders');
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const folderMap = new Map(folders.map(f => [f.id, f.name]));

    const options = {
      isArchived: false,
      isFavorite: this.isPinnedMode ? undefined : true,
      isPinned: this.isPinnedMode ? true : undefined,
      sortBy: 'newest'
    };

    const links = await SearchEngine.search('', options);

    if (links.length === 0) {
      area.innerHTML = EmptyState.render({
        icon: this.isPinnedMode ? 'pin' : 'star',
        title: this.isPinnedMode ? 'No pinned links' : 'No favourites yet',
        description: this.isPinnedMode ? 'Click the pin icon on any link card to keep it at the top.' : 'Click the star icon on any link to add it to your favourites list.',
      });
      return;
    }

    area.innerHTML = `
      <div class="link-grid">
        ${links.map(l => LinkCard.render(l, {
          viewMode: 'grid',
          categoryName: l.categoryId ? catMap.get(l.categoryId) : '',
          folderName: l.folderId ? folderMap.get(l.folderId) : '',
          isSelected: UI.selectedIds.has(l.id)
        })).join('')}
      </div>
    `;

    UI.bindLinkEvents(area, () => this.loadLinks());
  }
};
