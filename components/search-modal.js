/**
 * ManageLinks - Global Search Modal (Ctrl + K)
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';
import { SearchEngine } from '../assets/js/search.js';
import { LinkManager } from '../assets/js/link-manager.js';
import { UrlUtils } from '../utils/url-utils.js';
import { Security } from '../assets/js/security.js';

export const SearchModal = {
  modalEl: null,
  bsModal: null,
  debounceTimer: null,

  init() {
    let existing = document.getElementById('searchModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="searchModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content shadow-lg border-0">
            <div class="modal-body p-0">
              <div class="p-3 border-bottom d-flex align-items-center gap-2">
                <span class="text-muted">${Icons.get('search', { size: 20 })}</span>
                <input type="text" id="quick-search-input" class="form-control form-control-lg border-0 shadow-none p-0" placeholder="Type to search links, tags, categories..." autocomplete="off" />
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>

              <!-- Search History / Suggestions Chips -->
              <div id="search-chips-container" class="px-3 pt-2 pb-1 d-flex flex-wrap gap-1 border-bottom bg-light">
                <span class="text-muted small align-self-center me-1">Recent:</span>
              </div>

              <!-- Results Area -->
              <div id="search-modal-results" class="p-2" style="max-height: 420px; overflow-y: auto;">
                <div class="text-center text-muted py-4 small">Type a keyword or URL to begin searching...</div>
              </div>
            </div>
            <div class="modal-footer py-2 px-3 justify-content-between bg-light border-top">
              <div class="small text-muted">
                <span class="badge bg-secondary-subtle text-secondary me-1">ESC</span> to close
                <span class="badge bg-secondary-subtle text-secondary ms-2 me-1">Ctrl + K</span> to open
              </div>
              <a href="#all-links" class="small text-decoration-none fw-semibold" id="btn-view-all-results">Open in All Links &rarr;</a>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div.firstElementChild);
    this.modalEl = document.getElementById('searchModal');
    this.bsModal = new bootstrap.Modal(this.modalEl);

    this.bindEvents();
  },

  bindEvents() {
    const input = document.getElementById('quick-search-input');

    input.addEventListener('input', () => {
      const q = input.value.trim();
      if (this.debounceTimer) clearTimeout(this.debounceTimer);

      this.debounceTimer = setTimeout(() => {
        this.executeSearch(q);
      }, 200);
    });

    document.getElementById('btn-view-all-results').addEventListener('click', () => {
      this.bsModal.hide();
    });
  },

  open() {
    this.bsModal.show();
    this.renderHistoryChips();
    const input = document.getElementById('quick-search-input');
    input.value = '';
    document.getElementById('search-modal-results').innerHTML = '<div class="text-center text-muted py-4 small">Type a keyword, tag, or URL to search across all links...</div>';
    setTimeout(() => input.focus(), 250);
  },

  renderHistoryChips() {
    const container = document.getElementById('search-chips-container');
    const history = SearchEngine.getHistory();

    if (history.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = '<span class="text-muted small align-self-center me-1">Recent:</span>';

    history.slice(0, 5).forEach(term => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-secondary py-0 px-2 rounded-pill small';
      btn.style.fontSize = '0.75rem';
      btn.textContent = term;
      btn.onclick = () => {
        document.getElementById('quick-search-input').value = term;
        this.executeSearch(term);
      };
      container.appendChild(btn);
    });
  },

  async executeSearch(query) {
    const resultsContainer = document.getElementById('search-modal-results');
    if (!query) {
      resultsContainer.innerHTML = '<div class="text-center text-muted py-4 small">Type a keyword or URL to begin searching...</div>';
      return;
    }

    const results = await SearchEngine.search(query, { isArchived: false });

    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="text-center py-4">
          <div class="text-muted mb-2">${Icons.get('search', { size: 32 })}</div>
          <div class="fw-semibold">No matching links found</div>
          <div class="text-muted small">Try different keywords or check for typos</div>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = results.slice(0, 15).map(link => {
      const highlightedTitle = SearchEngine.highlight(link.title, query);
      const highlightedUrl = SearchEngine.highlight(UrlUtils.formatForDisplay(link.url, 50), query);
      const initials = UrlUtils.getDomainInitials(link.url);

      return `
        <div class="d-flex align-items-center justify-content-between p-2 rounded hover-bg-light border-bottom search-item" style="cursor: pointer;" data-id="${link.id}">
          <div class="d-flex align-items-center gap-2 min-w-0 flex-grow-1">
            <div class="link-favicon flex-shrink-0" style="width: 32px; height: 32px; font-size: 0.75rem;">${initials}</div>
            <div class="min-w-0">
              <a href="${Security.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="fw-semibold text-decoration-none text-dark d-block text-truncate quick-open-btn" data-id="${link.id}">
                ${highlightedTitle}
              </a>
              <div class="text-muted small text-truncate">${highlightedUrl}</div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-1 ms-2">
            <a href="${Security.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-primary py-1 px-2 quick-open-btn" data-id="${link.id}">
              ${Icons.get('external-link', { size: 14 })}
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers to open links & record visit
    resultsContainer.querySelectorAll('.quick-open-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        if (id) {
          await LinkManager.recordVisit(id);
        }
      });
    });
  }
};
