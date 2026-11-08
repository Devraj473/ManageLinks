/**
 * ManageLinks - Note Modal Component
 * Developer: Devraj Chauhan
 * Modal for creating and editing personal notes
 */

import { Icons } from '../assets/js/icons.js';
import { NotesManager } from '../assets/js/notes-manager.js';
import { Toast } from '../assets/js/notifications.js';
import { Security } from '../assets/js/security.js';

export const NoteModal = {
  currentNoteId: null,
  bsModal: null,

  init() {
    let modalEl = document.getElementById('noteModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'noteModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      modalEl.setAttribute('aria-hidden', 'true');
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content shadow-lg border">
            <div class="modal-header py-3 px-4">
              <h5 class="modal-title fw-bold" id="noteModalTitle">Create Personal Note</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <form id="note-form">
              <div class="modal-body py-3 px-4">
                <!-- Note Title -->
                <div class="mb-3">
                  <label for="note-title-input" class="form-label fw-semibold">Note Title <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" id="note-title-input" placeholder="e.g. Project Ideas, Important Memo, Snippet" required />
                </div>

                <!-- Note Content -->
                <div class="mb-3">
                  <label for="note-content-input" class="form-label fw-semibold">Content / Body</label>
                  <textarea class="form-control" id="note-content-input" rows="8" placeholder="Write your thoughts, memos, code snippets, or useful notes here..."></textarea>
                </div>

                <!-- Tags & Color Picker Row -->
                <div class="row g-3 mb-3">
                  <div class="col-md-7">
                    <label for="note-tags-input" class="form-label fw-semibold">Tags (comma-separated)</label>
                    <div class="input-group">
                      <span class="input-group-text">${Icons.get('tag', { size: 16 })}</span>
                      <input type="text" class="form-control" id="note-tags-input" placeholder="ideas, work, todo, dev" />
                    </div>
                  </div>
                  <div class="col-md-5">
                    <label class="form-label fw-semibold">Color Accent</label>
                    <select class="form-select" id="note-color-select">
                      <option value="default">Default (Slate)</option>
                      <option value="blue">Sky Blue</option>
                      <option value="green">Emerald Green</option>
                      <option value="yellow">Warm Amber</option>
                      <option value="purple">Violet Purple</option>
                      <option value="rose">Soft Rose</option>
                    </select>
                  </div>
                </div>

                <!-- Pin to Top Switch -->
                <div class="form-check form-switch p-3 bg-light rounded border">
                  <input class="form-check-input ms-0 me-2" type="checkbox" id="note-pin-switch">
                  <label class="form-check-label fw-semibold" for="note-pin-switch">
                    ${Icons.get('pin', { size: 16, className: 'me-1' })} Pin note to top
                  </label>
                  <div class="text-muted small ps-4">Pinned notes always stay at the very top of your list for quick access.</div>
                </div>
              </div>

              <div class="modal-footer py-2 px-4 bg-light">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary d-inline-flex align-items-center gap-2">
                  ${Icons.get('save', { size: 16, color: '#fff' })}
                  <span id="btn-save-note-text">Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
    }

    if (window.bootstrap && window.bootstrap.Modal) {
      this.bsModal = new window.bootstrap.Modal(modalEl);
    }

    // Submit handler
    const form = document.getElementById('note-form');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveNote();
    });
  },

  open(note = null) {
    if (!this.bsModal) this.init();

    this.currentNoteId = note ? note.id : null;
    const titleEl = document.getElementById('noteModalTitle');
    const saveBtnText = document.getElementById('btn-save-note-text');
    const titleInput = document.getElementById('note-title-input');
    const contentInput = document.getElementById('note-content-input');
    const tagsInput = document.getElementById('note-tags-input');
    const colorSelect = document.getElementById('note-color-select');
    const pinSwitch = document.getElementById('note-pin-switch');

    if (note) {
      titleEl.textContent = 'Edit Personal Note';
      saveBtnText.textContent = 'Update Note';
      titleInput.value = note.title || '';
      contentInput.value = note.content || '';
      tagsInput.value = Array.isArray(note.tags) ? note.tags.join(', ') : (note.tags || '');
      colorSelect.value = note.color || 'default';
      pinSwitch.checked = !!note.isPinned;
    } else {
      titleEl.textContent = 'Create Personal Note';
      saveBtnText.textContent = 'Save Note';
      titleInput.value = '';
      contentInput.value = '';
      tagsInput.value = '';
      colorSelect.value = 'default';
      pinSwitch.checked = false;
    }

    this.bsModal.show();
    setTimeout(() => titleInput.focus(), 250);
  },

  async saveNote() {
    const title = document.getElementById('note-title-input').value.trim();
    const content = document.getElementById('note-content-input').value.trim();
    const tags = document.getElementById('note-tags-input').value;
    const color = document.getElementById('note-color-select').value;
    const isPinned = document.getElementById('note-pin-switch').checked;

    if (!title) {
      Toast.error('Please enter a note title');
      return;
    }

    try {
      if (this.currentNoteId) {
        await NotesManager.update(this.currentNoteId, {
          title,
          content,
          tags,
          color,
          isPinned
        });
        Toast.success('Note updated successfully!');
      } else {
        await NotesManager.create({
          title,
          content,
          tags,
          color,
          isPinned
        });
        Toast.success('Personal note created successfully!');
      }

      this.bsModal.hide();
    } catch (err) {
      console.error('Error saving note:', err);
      Toast.error(`Failed to save note: ${err.message}`);
    }
  }
};
