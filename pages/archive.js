/**
 * ManageLinks - Archive Page
 * Developer: Devraj Chauhan
 * Archived links hidden from regular views but permanently preserved
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { SearchEngine } from '../assets/js/search.js';
import { LinkCard } from '../components/link-card.js';
import { EmptyState } from '../components/empty-state.js';
import { UI } from '../assets/js/ui.js';

export const ArchivePage = {
  async render() {
    const container = document.getElementById('content-area');

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Archived Links</h2>
          <p class="text-secondary mb-0">Inactive bookmarks kept for reference without cluttering your workspace.</p>
        </div>
      </div>

      <div id="archive-links-area">
        <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
      </div>
    `;

    await this.loadArchive();
  },

  async loadArchive() {
    const area = document.getElementById('archive-links-area');
    if (!area) return;

    const categories = await db.getAll('categories');
    const catMap = new Map(categories.map(c => [c.id, c.name]));

    const links = await SearchEngine.search('', {
      isArchived: true,
      sortBy: 'newest'
    });

    if (links.length === 0) {
      area.innerHTML = EmptyState.render({
        icon: 'archive',
        title: 'Archive is Empty',
        description: 'You can archive links from their menu when they are no longer in active use.',
      });
      return;
    }

    area.innerHTML = `
      <div class="link-grid">
        ${links.map(l => LinkCard.render(l, {
          viewMode: 'grid',
          categoryName: l.categoryId ? catMap.get(l.categoryId) : '',
          isSelected: UI.selectedIds.has(l.id)
        })).join('')}
      </div>
    `;

    UI.bindLinkEvents(area, () => this.loadArchive());
  }
};
