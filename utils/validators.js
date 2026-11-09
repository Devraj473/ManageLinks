/**
 * ManageLinks - Validation Utilities
 * Developer: Devraj Chauhan
 */

export const Validators = {
  /**
   * Validate if a URL has a valid web scheme and hostname
   * Supports http, https, and optional special protocols (ftp, mailto, etc.)
   */
  isValidUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') return false;
    const trimmed = urlString.trim();
    if (!trimmed) return false;

    try {
      const parsed = new URL(trimmed);
      return ['http:', 'https:', 'ftp:'].includes(parsed.protocol);
    } catch {
      // Check if user entered domain without protocol, e.g. "github.com"
      // We will suggest adding https://
      return false;
    }
  },

  /**
   * Ensure URL has a protocol, defaulting to https:// if missing
   */
  ensureProtocol(urlString) {
    if (!urlString) return '';
    const trimmed = urlString.trim();
    if (!/^https?:\/\//i.test(trimmed) && !/^ftp:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  },

  /**
   * Validate non-empty string with length constraints
   */
  isValidTitle(title) {
    if (!title || typeof title !== 'string') return false;
    return title.trim().length > 0 && title.trim().length <= 255;
  },

  /**
   * Validate category or folder name
   */
  isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    return name.trim().length > 0 && name.trim().length <= 100;
  },

  /**
   * Validate tag name (alphanumeric, dash, underscore, space)
   */
  isValidTag(tag) {
    if (!tag || typeof tag !== 'string') return false;
    const trimmed = tag.trim();
    return trimmed.length >= 1 && trimmed.length <= 50;
  },

  /**
   * Validate hex color string
   */
  isValidHexColor(color) {
    if (!color) return false;
    return /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(color.trim());
  },

  /**
   * Validate PIN (4-8 numeric digits)
   */
  isValidPin(pin) {
    if (!pin) return false;
    return /^\d{4,8}$/.test(pin.trim());
  },

  /**
   * Validate email address format
   */
  isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  /**
   * Validate integer within range
   */
  isValidNumber(val, min = 0, max = Infinity) {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= min && num <= max;
  }
};
