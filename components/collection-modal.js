/**
 * ManageLinks - Collection Modal
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { CollectionManager } from '../assets/js/collection-manager.js';

export const CollectionModal = {
  modalEl: null,
  bsModal: null,
  currentId: null,

  init() {
    let existing = document.getElementById('collectionModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="collectionModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title fw-bold" id="collectionModalTitle">Create Collection</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="collectionForm">
              <div class="modal-body">
                <div class="mb-3">
                  <label for="colName" class="form-label fw-semibold">Collection Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="colName" placeholder="e.g. Website Redesign Project" required />
                </div>

                <div class="mb-3">
                  <label for="colDesc" class="form-label fw-semibold">Description</label>
                  <textarea class="form-control" id="colDesc" rows="2" placeholder="Purpose or scope of this collection..."></textarea>
                </div>

                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label for="colColor" class="form-label fw-semibold">Theme Color</label>
                    <input type="color" class="form-control form-control-color w-100" id="colColor" value="#6366f1" />
                  </div>
                  <div class="col-6">
                    <label for="colIcon" class="form-label fw-semibold">Icon</label>
                    <select class="form-select" id="colIcon">
                      <option value="layers">Layers</option>
                      <option value="folder">Folder</option>
                      <option value="briefcase">Project</option>
                      <option value="book-open">Study</option>
                      <option value="heart">Favorites</option>
                      <option value="cpu">Tech / AI</option>
                      <option value="code">Code</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn-ml-primary">Save Collection</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div.firstElementChild);
    this.modalEl = document.getElementById('collectionModal');
    this.bsModal = new bootstrap.Modal(this.modalEl);

    document.getElementById('collectionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveCollection();
    });
  },

  async open(collectionId = null) {
    this.currentId = collectionId;
    const titleEl = document.getElementById('collectionModalTitle');
    const form = document.getElementById('collectionForm');
    form.reset();

    if (collectionId) {
      titleEl.textContent = 'Edit Collection';
      const col = await db.get('collections', collectionId);
      if (col) {
        document.getElementById('colName').value = col.name;
        document.getElementById('colDesc').value = col.description || '';
        document.getElementById('colColor').value = col.coverColor || '#6366f1';
        document.getElementById('colIcon').value = col.icon || 'layers';
      }
    } else {
      titleEl.textContent = 'Create Collection';
      document.getElementById('colColor').value = '#6366f1';
    }

    this.bsModal.show();
    setTimeout(() => document.getElementById('colName').focus(), 250);
  },

  async saveCollection() {
    const name = document.getElementById('colName').value.trim();
    if (!name) return;

    const data = {
      name,
      description: document.getElementById('colDesc').value.trim(),
      coverColor: document.getElementById('colColor').value,
      icon: document.getElementById('colIcon').value
    };

    let saved;
    if (this.currentId) {
      saved = await CollectionManager.update(this.currentId, data);
    } else {
      saved = await CollectionManager.create(data);
    }

    this.bsModal.hide();
    window.dispatchEvent(new CustomEvent('ml-collection-saved', { detail: saved }));
  }
};
