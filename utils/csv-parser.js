/**
 * ManageLinks - CSV Parser and Generator
 * Developer: Devraj Chauhan
 * Compliant with RFC 4180
 */

export const CsvParser = {
  /**
   * Parse CSV string into array of row objects
   */
  parse(csvText) {
    if (!csvText || typeof csvText !== 'string') return [];

    const lines = this.splitIntoRows(csvText);
    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.trim().toLowerCase());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      // Skip empty rows
      if (row.length === 1 && !row[0].trim()) continue;

      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = (row[index] !== undefined) ? row[index].trim() : '';
      });
      records.push(obj);
    }

    return records;
  },

  /**
   * Split raw CSV into rows and fields accounting for quotes and embedded linebreaks
   */
  splitIntoRows(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    // Normalize CRLF to LF
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      const nextChar = normalized[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote: "" -> "
            currentField += '"';
            i++;
          } else {
            // End of quotes
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\n') {
          currentRow.push(currentField);
          rows.push(currentRow);
          currentRow = [];
          currentField = '';
        } else {
          currentField += char;
        }
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows;
  },

  /**
   * Convert array of link records into CSV string
   */
  generate(records) {
    const headers = ['title', 'url', 'description', 'category', 'folder', 'tags', 'notes', 'favorite', 'pinned', 'created_at'];
    
    const escapeField = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (Array.isArray(val)) {
        str = val.join(';');
      }
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerRow = headers.join(',');
    const dataRows = records.map(r => {
      return [
        escapeField(r.title),
        escapeField(r.url),
        escapeField(r.description || ''),
        escapeField(r.categoryName || r.categoryId || ''),
        escapeField(r.folderName || r.folderId || ''),
        escapeField(Array.isArray(r.tags) ? r.tags.join(';') : (r.tags || '')),
        escapeField(r.notes || ''),
        escapeField(r.isFavorite ? 'true' : 'false'),
        escapeField(r.isPinned ? 'true' : 'false'),
        escapeField(r.createdAt || '')
      ].join(',');
    });

    return [headerRow, ...dataRows].join('\r\n');
  }
};
