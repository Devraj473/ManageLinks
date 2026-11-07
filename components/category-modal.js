/**
 * ManageLinks - Category Modal
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { CategoryManager } from '../assets/js/category-manager.js';

export const CategoryModal = {
  modalEl: null,
  bsModal: null,
  currentId: null,

  init() {
    let existing = document.getElementById('categoryModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="categoryModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title fw-bold" id="categoryModalTitle">Create Category</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="categoryForm">
              <div class="modal-body">
                <div class="mb-3">
                  <label for="catName" class="form-label fw-semibold">Category Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="catName" placeholder="e.g. Artificial Intelligence" required />
                </div>

                <div class="mb-3">
                  <label for="catDesc" class="form-label fw-semibold">Description</label>
                  <textarea class="form-control" id="catDesc" rows="2" placeholder="Brief summary of bookmarks in this category..."></textarea>
                </div>

                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label for="catColor" class="form-label fw-semibold">Color</label>
                    <input type="color" class="form-control form-control-color w-100" id="catColor" value="#2563eb" />
                  </div>
                  <div class="col-6">
                    <label for="catIcon" class="form-label fw-semibold">Icon</label>
                    <select class="form-select" id="catIcon">
                      <option value="folder">Folder</option>
                      <option value="cpu">AI / CPU</option>
                      <option value="code">Development</option>
                      <option value="book-open">Learning</option>
                      <option value="book">Education</option>
                      <option value="users">Social</option>
                      <option value="film">Entertainment</option>
                      <option value="briefcase">Work</option>
                      <option value="dollar-sign">Freelancing</option>
                      <option value="shopping-bag">Shopping</option>
                      <option value="shield">Finance/Gov</option>
                      <option value="heart">Personal</option>
                      <option value="star">Star</option>
                    </select>
                  </div>
                </div>

                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="catFavorite" />
                  <label class="form-check-label fw-semibold" for="catFavorite">Mark as Favourite Category</label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn-ml-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div.firstElementChild);
    this.modalEl = document.getElementById('categoryModal');
    this.bsModal = new bootstrap.Modal(this.modalEl);

    document.getElementById('categoryForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveCategory();
    });
  },

  async open(categoryId = null) {
    this.currentId = categoryId;
    const titleEl = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');
    form.reset();

    if (categoryId) {
      titleEl.textContent = 'Edit Category';
      const cat = await db.get('categories', categoryId);
      if (cat) {
        document.getElementById('catName').value = cat.name;
        document.getElementById('catDesc').value = cat.description || '';
        document.getElementById('catColor').value = cat.color || '#2563eb';
        document.getElementById('catIcon').value = cat.icon || 'folder';
        document.getElementById('catFavorite').checked = !!cat.isFavorite;
      }
    } else {
      titleEl.textContent = 'Create Category';
      document.getElementById('catColor').value = '#2563eb';
    }

    this.bsModal.show();
    setTimeout(() => document.getElementById('catName').focus(), 250);
  },

  async saveCategory() {
    const name = document.getElementById('catName').value.trim();
    if (!name) return;

    const data = {
      name,
      description: document.getElementById('catDesc').value.trim(),
      color: document.getElementById('catColor').value,
      icon: document.getElementById('catIcon').value,
      isFavorite: document.getElementById('catFavorite').checked
    };

    let saved;
    if (this.currentId) {
      saved = await CategoryManager.update(this.currentId, data);
    } else {
      saved = await CategoryManager.create(data);
    }

    this.bsModal.hide();
    window.dispatchEvent(new CustomEvent('ml-category-saved', { detail: saved }));
  }
};
