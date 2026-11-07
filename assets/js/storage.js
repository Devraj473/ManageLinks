/**
 * ManageLinks - LocalStorage UI Preferences
 * Developer: Devraj Chauhan
 * Used only for lightweight UI state and preferences
 */

const PREF_PREFIX = 'managelinks_pref_';

export const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(PREF_PREFIX + key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(PREF_PREFIX + key);
      return true;
    } catch {
      return false;
    }
  },

  // Session state (cleared when browser tab closes)
  getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(PREF_PREFIX + key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  },

  setSession(key, value) {
    try {
      sessionStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  removeSession(key) {
    try {
      sessionStorage.removeItem(PREF_PREFIX + key);
      return true;
    } catch {
      return false;
    }
  }
};
