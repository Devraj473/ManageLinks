/**
 * ManageLinks - Settings Manager
 * Developer: Devraj Chauhan
 * Local settings persistence in IndexedDB and LocalStorage
 */

import { db } from './database.js';
import { Storage } from './storage.js';

export const DEFAULT_SETTINGS = {
  theme: 'system', // 'light', 'dark', 'system'
  defaultView: 'grid', // 'grid', 'list', 'compact'
  defaultSort: 'newest',
  defaultCategoryId: null,
  compactMode: false,
  sidebarCollapsed: false,
  confirmDelete: true,
  searchInNotes: true,
  backupReminderFreq: 'weekly', // 'never', 'weekly', 'monthly'
  autoLockMinutes: 15, // 0 for disabled
  dateFormat: 'medium', // 'short', 'medium', 'long'
  firstLaunchCompleted: false
};

export const SettingsManager = {
  cache: null,

  /**
   * Get all settings merged with defaults
   */
  async getAll() {
    if (this.cache) return { ...this.cache };

    const records = await db.getAll('settings');
    const settingsObj = { ...DEFAULT_SETTINGS };

    records.forEach(r => {
      settingsObj[r.key] = r.value;
    });

    // Check LocalStorage overrides for theme/view if present
    const lsTheme = Storage.get('theme');
    if (lsTheme) settingsObj.theme = lsTheme;

    const lsView = Storage.get('defaultView');
    if (lsView) settingsObj.defaultView = lsView;

    const lsSidebar = Storage.get('sidebarCollapsed');
    if (lsSidebar !== null) settingsObj.sidebarCollapsed = lsSidebar;

    this.cache = settingsObj;
    return settingsObj;
  },

  /**
   * Get single setting
   */
  async get(key, defaultValue = null) {
    const all = await this.getAll();
    return all[key] !== undefined ? all[key] : defaultValue;
  },

  /**
   * Update single setting
   */
  async set(key, value) {
    await db.put('settings', { key, value });
    if (!this.cache) this.cache = { ...DEFAULT_SETTINGS };
    this.cache[key] = value;

    // Sync key UI preferences to LocalStorage for instant early load before DB opens
    if (['theme', 'defaultView', 'sidebarCollapsed', 'compactMode'].includes(key)) {
      Storage.set(key, value);
    }

    // Apply immediate side-effects
    if (key === 'theme') {
      this.applyTheme(value);
    }

    window.dispatchEvent(new CustomEvent('ml-settings-changed', { detail: { key, value } }));
    return value;
  },

  /**
   * Apply Theme to document HTML element
   */
  applyTheme(theme) {
    let effectiveTheme = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-bs-theme', effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  },

  /**
   * Reset settings to default values
   */
  async resetToDefaults() {
    await db.clear('settings');
    this.cache = null;
    Storage.remove('theme');
    Storage.remove('defaultView');
    Storage.remove('sidebarCollapsed');
    Storage.remove('compactMode');
    return await this.getAll();
  }
};
