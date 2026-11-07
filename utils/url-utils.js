/**
 * ManageLinks - URL Utilities
 * Developer: Devraj Chauhan
 */

export const UrlUtils = {
  /**
   * Normalize URL for accurate comparison and duplicate detection
   * Removes trailing slashes on root, lowercases host, strips hash fragments
   */
  normalizeUrl(urlString) {
    if (!urlString || typeof urlString !== 'string') return '';
    let trimmed = urlString.trim();
    if (!/^https?:\/\//i.test(trimmed) && !/^ftp:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }

    try {
      const parsed = new URL(trimmed);
      // Lowercase protocol and hostname
      const protocol = parsed.protocol.toLowerCase();
      const host = parsed.hostname.toLowerCase();
      
      // Port normalization
      let port = parsed.port;
      if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
        port = '';
      }
      const hostWithPort = port ? `${host}:${port}` : host;

      // Path normalization: remove trailing slash if path is "/"
      let pathname = parsed.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      } else if (pathname === '/') {
        pathname = '';
      }

      // Keep search query params sorted for consistent duplicate detection
      let search = '';
      if (parsed.search) {
        const params = new URLSearchParams(parsed.search);
        params.sort();
        const searchStr = params.toString();
        if (searchStr) {
          search = `?${searchStr}`;
        }
      }

      // Ignore hash/fragment for duplicate matching
      return `${protocol}//${hostWithPort}${pathname}${search}`;
    } catch {
      return trimmed.toLowerCase().replace(/\/+$/, '');
    }
  },

  /**
   * Check if two URLs are duplicates based on normalized comparison
   */
  areDuplicates(url1, url2) {
    return this.normalizeUrl(url1) === this.normalizeUrl(url2);
  },

  /**
   * Extract hostname from URL
   */
  extractHostname(urlString) {
    try {
      let trimmed = (urlString || '').trim();
      if (!/^https?:\/\//i.test(trimmed)) {
        trimmed = `https://${trimmed}`;
      }
      const parsed = new URL(trimmed);
      return parsed.hostname.replace(/^www\./i, '');
    } catch {
      return urlString || '';
    }
  },

  /**
   * Generate an intelligent title from a URL if user left it blank
   */
  generateTitleFromUrl(urlString) {
    try {
      let trimmed = (urlString || '').trim();
      if (!/^https?:\/\//i.test(trimmed)) {
        trimmed = `https://${trimmed}`;
      }
      const parsed = new URL(trimmed);
      const host = parsed.hostname.replace(/^www\./i, '');
      const pathParts = parsed.pathname.split('/').filter(p => p && p.trim().length > 0);

      if (pathParts.length > 0) {
        const lastPart = decodeURIComponent(pathParts[pathParts.length - 1])
          .replace(/[-_]/g, ' ')
          .replace(/\.(html|php|asp|aspx|jsp)$/i, '');
        
        // Capitalize words
        const formatted = lastPart
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        
        if (formatted.length > 2 && formatted.length < 50) {
          return `${formatted} - ${host}`;
        }
      }

      return host.charAt(0).toUpperCase() + host.slice(1);
    } catch {
      return urlString || 'Untitled Link';
    }
  },

  /**
   * Extract domain initials (e.g. "github.com" -> "GH") for icon fallback
   */
  getDomainInitials(urlString) {
    const host = this.extractHostname(urlString);
    const parts = host.split('.');
    if (parts.length >= 2) {
      const name = parts[0];
      if (name.length >= 2) {
        return name.slice(0, 2).toUpperCase();
      }
      return name.slice(0, 1).toUpperCase();
    }
    return host.slice(0, 2).toUpperCase() || 'LK';
  },

  /**
   * Shorten long URL for clean display
   */
  formatForDisplay(urlString, maxLength = 45) {
    if (!urlString) return '';
    try {
      const parsed = new URL(urlString);
      const display = parsed.hostname.replace(/^www\./i, '') + parsed.pathname;
      if (display.length <= maxLength) return display;
      return display.slice(0, maxLength - 3) + '...';
    } catch {
      if (urlString.length <= maxLength) return urlString;
      return urlString.slice(0, maxLength - 3) + '...';
    }
  },

  /**
   * Format link into different copy formats:
   * - plain URL
   * - markdown [Title](URL)
   * - HTML <a href="URL">Title</a>
   * - title + URL
   */
  formatCopy(format, title, url) {
    const cleanTitle = (title || 'Link').trim();
    const cleanUrl = (url || '').trim();

    switch (format) {
      case 'markdown':
        return `[${cleanTitle}](${cleanUrl})`;
      case 'html':
        return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanTitle}</a>`;
      case 'title-url':
        return `${cleanTitle} - ${cleanUrl}`;
      case 'url':
      default:
        return cleanUrl;
    }
  }
};
