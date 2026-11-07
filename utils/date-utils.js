/**
 * ManageLinks - Date Utilities
 * Developer: Devraj Chauhan
 */

export const DateUtils = {
  /**
   * Return current date in ISO format
   */
  now() {
    return new Date().toISOString();
  },

  /**
   * Format ISO string to user-friendly local date
   */
  formatDate(isoString, format = 'medium') {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    if (format === 'short') {
      return date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit'
      });
    }

    if (format === 'long') {
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  },

  /**
   * Format ISO string to date & time
   */
  formatDateTime(isoString) {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Format date as relative time (e.g. "Just now", "5m ago", "Yesterday")
   */
  formatRelative(isoString) {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 0) return 'In the future';
    if (diffSec < 45) return 'Just now';
    if (diffSec < 90) return '1 minute ago';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 7200) return '1 hour ago';
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    if (diffSec < 172800) return 'Yesterday';
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;

    return this.formatDate(isoString);
  },

  /**
   * Format timestamp for backup filenames (YYYY-MM-DD_HH-mm)
   */
  formatForFilename(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  },

  /**
   * Check if date is in current calendar month
   */
  isThisMonth(isoString) {
    if (!isoString) return false;
    const date = new Date(isoString);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  },

  /**
   * Check if date is in current week
   */
  isThisWeek(isoString) {
    if (!isoString) return false;
    const date = new Date(isoString);
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return date >= startOfWeek;
  },

  /**
   * Check if a review date is today or overdue
   */
  isDueOrOverdue(isoString) {
    if (!isoString) return false;
    const reviewDate = new Date(isoString);
    const now = new Date();
    // End of today
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return reviewDate <= endOfToday;
  }
};
