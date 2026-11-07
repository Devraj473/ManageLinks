/**
 * ManageLinks - Reading List Page (Read Later)
 * Developer: Devraj Chauhan
 * Statuses: Unread, Currently Reading, Completed
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { SearchEngine } from '../assets/js/search.js';
import { LinkCard } from '../components/link-card.js';
import { EmptyState } from '../components/empty-state.js';
import { UI } from '../assets/js/ui.js';
import { LinkManager } from '../assets/js/link-manager.js';
import { Toast } from '../assets/js/notifications.js';

export const ReadingListPage = {
  currentFilter: 'all', // 'all', 'unread', 'reading', 'completed'

  async render(param = null) {
    const container = document.getElementById('content-area');

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Reading List</h2>
          <p class="text-secondary mb-0">Articles, tutorials, and long-form resources saved for later.</p>
        </div>
      </div>

      <!-- Status Filter Tabs -->
      <div class="mb-4">
        <ul class="nav nav-pills gap-1">
          <li class="nav-item">
            <button class="nav-link ${this.currentFilter === 'all' ? 'active' : ''}" data-status="all">All Reading Links</button>
          </li>
          <li class="nav-item">
            <button class="nav-link ${this.currentFilter === 'unread' ? 'active' : ''}" data-status="unread">Unread</button>
          </li>
          <li class="nav-item">
            <button class="nav-link ${this.currentFilter === 'reading' ? 'active' : ''}" data-status="reading">Currently Reading</button>
          </li>
          <li class="nav-item">
            <button class="nav-link ${this.currentFilter === 'completed' ? 'active' : ''}" data-status="completed">Completed</button>
          </li>
        </ul>
      </div>

      <div id="reading-links-area">
        <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
      </div>
    `;

    this.bindTabEvents();
    await this.loadReadingLinks();
  },

  bindTabEvents() {
    document.querySelectorAll('.nav-pills .nav-link').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-pills .nav-link').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.getAttribute('data-status');
        this.loadReadingLinks();
      });
    });
  },

  async loadReadingLinks() {
    const area = document.getElementById('reading-links-area');
    if (!area) return;

    const categories = await db.getAll('categories');
    const catMap = new Map(categories.map(c => [c.id, c.name]));

    const options = {
      isArchived: false,
      isReadLater: true,
      readingStatus: this.currentFilter !== 'all' ? this.currentFilter : undefined,
      sortBy: 'newest'
    };

    const links = await SearchEngine.search('', options);

    if (links.length === 0) {
      area.innerHTML = EmptyState.render({
        icon: 'book-open',
        title: 'No Reading Items Found',
        description: 'Bookmark interesting articles and mark them as "Read Later" to track your reading progress.',
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

    UI.bindLinkEvents(area, () => this.loadReadingLinks());
  }
};
