/**
 * ManageLinks - Security, Privacy & PIN Protection
 * Developer: Devraj Chauhan
 * Uses Web Crypto PBKDF2 derived verifier for PIN locking
 */

import { db } from './database.js';
import { Storage } from './storage.js';
import { Encryption } from '../utils/encryption.js';

export const Security = {
  SESSION_UNLOCKED_KEY: 'app_session_unlocked',
  LAST_ACTIVITY_KEY: 'app_last_activity',
  inactivityTimer: null,
  inactivityMinutes: 15,

  /**
   * Safe HTML Escaper to prevent XSS
   */
  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Check if PIN lock is enabled in settings
   */
  async isPinEnabled() {
    const setting = await db.get('settings', 'pinLock');
    return !!(setting && setting.value && setting.value.enabled);
  },

  /**
   * Set new application PIN
   */
  async setPin(pin) {
    if (!pin || pin.length < 4) throw new Error('PIN must be at least 4 digits');
    const { salt, hash } = await Encryption.hashPin(pin);

    await db.put('settings', {
      key: 'pinLock',
      value: {
        enabled: true,
        salt,
        hash,
        updatedAt: new Date().toISOString()
      }
    });

    this.markSessionUnlocked();
    return true;
  },

  /**
   * Remove application PIN
   */
  async removePin() {
    await db.put('settings', {
      key: 'pinLock',
      value: {
        enabled: false,
        salt: null,
        hash: null,
        updatedAt: new Date().toISOString()
      }
    });
    Storage.removeSession(this.SESSION_UNLOCKED_KEY);
    return true;
  },

  /**
   * Verify entered PIN
   */
  async verifyPin(pin) {
    const setting = await db.get('settings', 'pinLock');
    if (!setting || !setting.value || !setting.value.enabled) return true;

    const isValid = await Encryption.verifyPin(pin, setting.value.salt, setting.value.hash);
    if (isValid) {
      this.markSessionUnlocked();
    }
    return isValid;
  },

  /**
   * Check if session is currently unlocked
   */
  isSessionUnlocked() {
    return !!Storage.getSession(this.SESSION_UNLOCKED_KEY, false);
  },

  markSessionUnlocked() {
    Storage.setSession(this.SESSION_UNLOCKED_KEY, true);
    this.updateActivity();
  },

  lockSession() {
    Storage.removeSession(this.SESSION_UNLOCKED_KEY);
    window.dispatchEvent(new CustomEvent('ml-lock-screen'));
  },

  /**
   * Setup inactivity auto-lock listener
   */
  initInactivityTracker(minutes = 15) {
    this.inactivityMinutes = minutes;
    if (this.inactivityMinutes <= 0) return;

    const resetTimer = () => {
      this.updateActivity();
    };

    window.addEventListener('mousemove', resetTimer, { passive: true });
    window.addEventListener('keydown', resetTimer, { passive: true });
    window.addEventListener('touchstart', resetTimer, { passive: true });

    if (this.inactivityTimer) clearInterval(this.inactivityTimer);

    this.inactivityTimer = setInterval(async () => {
      const pinEnabled = await this.isPinEnabled();
      if (!pinEnabled) return;

      const lastActivity = Storage.getSession(this.LAST_ACTIVITY_KEY, Date.now());
      const diffMs = Date.now() - lastActivity;
      if (diffMs > this.inactivityMinutes * 60 * 1000) {
        if (this.isSessionUnlocked()) {
          this.lockSession();
        }
      }
    }, 15000);
  },

  updateActivity() {
    Storage.setSession(this.LAST_ACTIVITY_KEY, Date.now());
  },

  /**
   * Clear all application data permanently
   */
  async wipeAllData() {
    await db.clear('links');
    await db.clear('categories');
    await db.clear('folders');
    await db.clear('collections');
    await db.clear('collectionLinks');
    await db.clear('tags');
    await db.clear('settings');
    await db.clear('deletedItems');
    await db.clear('backupHistory');
    localStorage.clear();
    sessionStorage.clear();
  }
};
