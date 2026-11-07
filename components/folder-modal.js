/**
 * ManageLinks - Folder Modal
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';
import { db } from '../assets/js/database.js';
import { FolderManager } from '../assets/js/folder-manager.js';

export const FolderModal = {
  modalEl: null,
  bsModal: null,
  currentId: null,

  init() {
    let existing = document.getElementById('folderModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="folderModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <form id="folderForm" class="modal-content shadow-lg">
            <div class="modal-header border-bottom py-3 px-4">
              <h5 class="modal-title fw-bold" id="folderModalTitle">Create Folder</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body py-3 px-4">
                <div class="mb-3">
                  <label for="folderName" class="form-label fw-semibold">Folder Name <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="folderName" placeholder="e.g. Frontend Resources" required />
                </div>

                <div class="mb-3">
                  <label for="folderParent" class="form-label fw-semibold">Parent Folder (for nesting)</label>
                  <select class="form-select" id="folderParent">
                    <option value="">None (Top-level folder)</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label for="folderDesc" class="form-label fw-semibold">Description</label>
                  <textarea class="form-control" id="folderDesc" rows="2" placeholder="Optional notes about this folder..."></textarea>
                </div>

                <div class="mb-3">
                  <label for="folderColor" class="form-label fw-semibold">Folder Accent Color</label>
                  <input type="color" class="form-control form-control-color w-100" id="folderColor" value="#0284c7" />
                </div>
              </div>
              <div class="modal-footer py-2 px-4 border-top bg-light">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn-ml-primary">Save Folder</button>
              </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(div.firstElementChild);
    this.modalEl = document.getElementById('folderModal');
    this.bsModal = new bootstrap.Modal(this.modalEl);

    document.getElementById('folderForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveFolder();
    });
  },

  async open(folderId = null, defaultParentId = null) {
    this.currentId = folderId;
    const titleEl = document.getElementById('folderModalTitle');
    const form = document.getElementById('folderForm');
    form.reset();

    const parentSelect = document.getElementById('folderParent');
    const folders = await db.getAll('folders');

    parentSelect.innerHTML = '<option value="">None (Top-level folder)</option>';
    for (const f of folders) {
      // Exclude self and descendants from parent options to prevent circular hierarchy
      if (folderId) {
        if (f.id === folderId) continue;
        const isDesc = await FolderManager.isDescendant(folderId, f.id);
        if (isDesc) continue;
      }
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.name;
      parentSelect.appendChild(opt);
    }

    if (folderId) {
      titleEl.textContent = 'Edit Folder';
      const folder = await db.get('folders', folderId);
      if (folder) {
        document.getElementById('folderName').value = folder.name;
        document.getElementById('folderDesc').value = folder.description || '';
        document.getElementById('folderColor').value = folder.color || '#0284c7';
        if (folder.parentId) parentSelect.value = folder.parentId;
      }
    } else {
      titleEl.textContent = 'Create Folder';
      document.getElementById('folderColor').value = '#0284c7';
      if (defaultParentId) parentSelect.value = defaultParentId;
    }

    this.bsModal.show();
    setTimeout(() => document.getElementById('folderName').focus(), 250);
  },

  async saveFolder() {
    const name = document.getElementById('folderName').value.trim();
    if (!name) return;

    const data = {
      name,
      parentId: document.getElementById('folderParent').value || null,
      description: document.getElementById('folderDesc').value.trim(),
      color: document.getElementById('folderColor').value
    };

    let saved;
    if (this.currentId) {
      saved = await FolderManager.update(this.currentId, data);
    } else {
      saved = await FolderManager.create(data);
    }

    this.bsModal.hide();
    window.dispatchEvent(new CustomEvent('ml-folder-saved', { detail: saved }));
  }
};
