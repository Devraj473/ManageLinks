/**
 * ManageLinks - Toast Notification System
 * Developer: Devraj Chauhan
 */

import { Icons } from './icons.js';

export const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `ml-toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    else if (type === 'error') iconName = 'alert-triangle';
    else if (type === 'warning') iconName = 'alert-circle';

    const iconHtml = Icons.get(iconName, { size: 18 });

    toast.innerHTML = `
      <div class="toast-icon flex-shrink-0">${iconHtml}</div>
      <div class="toast-content flex-grow-1">${this.escape(message)}</div>
      <button type="button" class="btn-close ms-2 btn-close-sm" aria-label="Close"></button>
    `;

    const closeBtn = toast.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  },

  success(msg, dur) { return this.show(msg, 'success', dur); },
  error(msg, dur = 5000) { return this.show(msg, 'error', dur); },
  warning(msg, dur = 4000) { return this.show(msg, 'warning', dur); },
  info(msg, dur) { return this.show(msg, 'info', dur); },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.style.transition = 'all 0.25s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 250);
  },

  escape(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
  }
};
