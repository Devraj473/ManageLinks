/**
 * ManageLinks - Keyboard Shortcuts Handler
 * Developer: Devraj Chauhan
 */

export const Shortcuts = {
  init(callbacks = {}) {
    window.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable);

      // Escape: Close modals
      if (e.key === 'Escape') {
        if (callbacks.onEscape) callbacks.onEscape();
        return;
      }

      // Check for Ctrl or Meta (Command on Mac)
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl) {
        // Ctrl + K: Global Search
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          if (callbacks.onSearch) callbacks.onSearch();
          return;
        }

        // Ctrl + Shift + N: Create Category
        if (e.shiftKey && e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (callbacks.onCreateCategory) callbacks.onCreateCategory();
          return;
        }

        // Ctrl + N: Add New Link
        if (!e.shiftKey && e.key.toLowerCase() === 'n') {
          e.preventDefault();
          if (callbacks.onAddLink) callbacks.onAddLink();
          return;
        }

        // Ctrl + B: Backup Center
        if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          if (callbacks.onBackup) callbacks.onBackup();
          return;
        }

        // Ctrl + Shift + F: Open Favourites
        if (e.shiftKey && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          if (callbacks.onFavorites) callbacks.onFavorites();
          return;
        }
      }

      // '/' to focus search when not in input
      if (!isInput && e.key === '/') {
        e.preventDefault();
        if (callbacks.onSearch) callbacks.onSearch();
      }
    });
  }
};
