/**
 * ManageLinks - Confirmation Dialog Modal
 * Developer: Devraj Chauhan
 * Provides safe verification for all destructive operations
 */

import { Icons } from '../assets/js/icons.js';

export const ConfirmationModal = {
  modalEl: null,
  bsModal: null,
  resolvePromise: null,

  init() {
    let existing = document.getElementById('confirmationModal');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="modal fade" id="confirmationModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title fw-bold" id="confirmTitle">Confirm Action</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="d-flex align-items-start gap-3">
                <div id="confirmIconContainer" class="flex-shrink-0 p-2 rounded-circle bg-danger-subtle text-danger">
                  ${Icons.get('alert-triangle', { size: 24, color: '#dc2626' })}
                </div>
                <div>
                  <p id="confirmMessage" class="mb-1 text-secondary">Are you sure you want to proceed?</p>
                  <div id="confirmExtraContent"></div>
                </div>
              </div>
            </div>
            <div class="modal-footer border-0 pt-0">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="btn-cancel-confirm">Cancel</button>
              <button type="button" class="btn btn-danger" id="btn-confirm-action">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(div.firstElementChild);
    this.modalEl = document.getElementById('confirmationModal');
    this.bsModal = new bootstrap.Modal(this.modalEl);

    document.getElementById('btn-confirm-action').addEventListener('click', () => {
      this.bsModal.hide();
      if (this.resolvePromise) this.resolvePromise(true);
    });

    document.getElementById('btn-cancel-confirm').addEventListener('click', () => {
      if (this.resolvePromise) this.resolvePromise(false);
    });

    this.modalEl.addEventListener('hidden.bs.modal', () => {
      if (this.resolvePromise) this.resolvePromise(false);
    });
  },

  ask({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Confirm', btnClass = 'btn-danger', extraHtml = '' }) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmExtraContent').innerHTML = extraHtml;

    const confirmBtn = document.getElementById('btn-confirm-action');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = `btn ${btnClass}`;

    this.bsModal.show();

    return new Promise(resolve => {
      this.resolvePromise = resolve;
    });
  }
};
