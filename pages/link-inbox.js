/**
 * ManageLinks - Link Inbox Page
 * Developer: Devraj Chauhan
 * Section for unassigned links with Quick Add and Bulk Organization
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { SearchEngine } from '../assets/js/search.js';
import { LinkManager } from '../assets/js/link-manager.js';
import { LinkCard } from '../components/link-card.js';
import { EmptyState } from '../components/empty-state.js';
import { UI } from '../assets/js/ui.js';
import { Toast } from '../assets/js/notifications.js';
import { Validators } from '../utils/validators.js';

export const LinkInboxPage = {
  async render() {
    const container = document.getElementById('content-area');

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Link Inbox</h2>
          <p class="text-secondary mb-0">Unassigned links awaiting categorization and organization.</p>
        </div>
      </div>

      <!-- Quick Add Bar -->
      <div class="card border mb-4 shadow-sm bg-primary-subtle border-primary-subtle">
        <div class="card-body p-3">
          <form id="inbox-quick-add-form" class="row g-2 align-items-center">
            <div class="col-12 col-md-8">
              <div class="input-group">
                <span class="input-group-text bg-white">${Icons.get('link', { size: 16 })}</span>
                <input type="url" id="inbox-quick-url" class="form-control" placeholder="Quickly paste a URL and press Enter..." required />
              </div>
            </div>
            <div class="col-12 col-md-4">
              <button type="submit" class="btn btn-primary w-100 d-inline-flex align-items-center justify-content-center gap-1">
                ${Icons.get('plus', { size: 16, color: '#fff' })} Quick Save to Inbox
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Inbox Links List -->
      <div id="inbox-links-area">
        <div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>
      </div>
    `;

    this.bindEvents();
    await this.loadInboxLinks();
  },

  bindEvents() {
    const form = document.getElementById('inbox-quick-add-form');
    const input = document.getElementById('inbox-quick-url');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let url = input.value.trim();
      if (!url) return;

      url = Validators.ensureProtocol(url);
      if (!Validators.isValidUrl(url)) {
        Toast.error('Please enter a valid website URL');
        return;
      }

      await LinkManager.createLink({ url });
      input.value = '';
      Toast.success('Saved to Inbox!');
      await this.loadInboxLinks();
    });
  },

  async loadInboxLinks() {
    const area = document.getElementById('inbox-links-area');
    if (!area) return;

    // Filter links with no category and no folder and not archived
    const links = await SearchEngine.search('', {
      isArchived: false,
      inboxOnly: true,
      sortBy: 'newest'
    });

    if (links.length === 0) {
      area.innerHTML = EmptyState.render({
        icon: 'inbox',
        title: 'Your Inbox is Clean!',
        description: 'All your links have been organized into categories or folders. Paste a URL above to quick-save anytime.',
      });
      return;
    }

    area.innerHTML = `
      <div class="d-flex align-items-center justify-content-between mb-3">
        <span class="text-muted small fw-semibold">${links.length} unorganized links</span>
      </div>
      <div class="link-grid">
        ${links.map(l => LinkCard.render(l, {
          viewMode: 'grid',
          isSelected: UI.selectedIds.has(l.id)
        })).join('')}
      </div>
    `;

    UI.bindLinkEvents(area, () => this.loadInboxLinks());
  }
};
