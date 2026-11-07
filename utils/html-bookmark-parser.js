/**
 * ManageLinks - HTML Bookmark Parser and Generator
 * Developer: Devraj Chauhan
 * Netscape Bookmark HTML standard (Chrome, Edge, Firefox compatible)
 */

export const HtmlBookmarkParser = {
  /**
   * Parse Netscape Bookmark HTML string into a flat list of links with folder paths
   */
  parse(htmlText) {
    if (!htmlText || typeof htmlText !== 'string') return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const links = [];

    // Recursive traversal of DOM tree
    const traverse = (node, folderPath = []) => {
      let currentFolder = [...folderPath];

      for (const child of node.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = child.tagName.toUpperCase();

          if (tagName === 'DT') {
            // Check if this DT contains an H3 (folder) or A (link)
            const h3 = child.querySelector(':scope > h3');
            const a = child.querySelector(':scope > a');
            const dl = child.querySelector(':scope > dl');

            if (h3) {
              const folderTitle = (h3.textContent || '').trim();
              if (folderTitle && folderTitle.toLowerCase() !== 'bookmarks bar' && folderTitle.toLowerCase() !== 'bookmarks') {
                const subPath = [...folderPath, folderTitle];
                if (dl) {
                  traverse(dl, subPath);
                } else {
                  // Sometimes DL is next sibling
                  let next = child.nextElementSibling;
                  while (next && next.tagName.toUpperCase() !== 'DL' && next.tagName.toUpperCase() !== 'DT') {
                    next = next.nextElementSibling;
                  }
                  if (next && next.tagName.toUpperCase() === 'DL') {
                    traverse(next, subPath);
                  }
                }
              } else if (dl) {
                traverse(dl, folderPath);
              }
            } else if (a) {
              const href = a.getAttribute('href');
              const title = (a.textContent || '').trim() || href;
              const addDate = a.getAttribute('add_date');
              const tags = (a.getAttribute('tags') || '').split(',').map(t => t.trim()).filter(Boolean);

              if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('ftp://'))) {
                let createdAt = new Date().toISOString();
                if (addDate) {
                  // Netscape format timestamp is in seconds
                  const timestamp = parseInt(addDate, 10);
                  if (!isNaN(timestamp)) {
                    createdAt = new Date(timestamp * 1000).toISOString();
                  }
                }

                links.push({
                  title: title || href,
                  url: href,
                  createdAt,
                  tags,
                  folderPath: [...folderPath]
                });
              }
            }
          } else if (tagName === 'DL') {
            traverse(child, currentFolder);
          } else if (tagName === 'P' || tagName === 'BODY') {
            traverse(child, currentFolder);
          }
        }
      }
    };

    const body = doc.body || doc;
    traverse(body, []);

    // Fallback: if traversal found 0 links (some exports lack standard DT/DL nesting), scan all anchor tags
    if (links.length === 0) {
      const anchors = doc.querySelectorAll('a[href]');
      anchors.forEach(a => {
        const href = a.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('ftp://'))) {
          links.push({
            title: (a.textContent || '').trim() || href,
            url: href,
            createdAt: new Date().toISOString(),
            tags: [],
            folderPath: []
          });
        }
      });
    }

    return links;
  },

  /**
   * Generate standard Netscape Bookmark HTML string from links and folder hierarchy
   */
  generate(links, folders = []) {
    const timestamp = Math.floor(Date.now() / 1000);

    // Map folder tree
    const folderMap = new Map();
    folders.forEach(f => folderMap.set(f.id, f));

    // Group links by folder
    const unfiledLinks = [];
    const folderLinks = new Map();

    links.forEach(l => {
      if (l.folderId && folderMap.has(l.folderId)) {
        if (!folderLinks.has(l.folderId)) {
          folderLinks.set(l.folderId, []);
        }
        folderLinks.get(l.folderId).push(l);
      } else {
        unfiledLinks.push(l);
      }
    });

    const escapeXml = (unsafe) => {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    // Render folder nodes
    const renderFolder = (folderId, indent = '    ') => {
      const folder = folderMap.get(folderId);
      if (!folder) return '';

      let out = `${indent}<DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">${escapeXml(folder.name)}</H3>\n`;
      out += `${indent}<DL><p>\n`;

      // Links inside this folder
      const fLinks = folderLinks.get(folderId) || [];
      fLinks.forEach(l => {
        const addTime = l.createdAt ? Math.floor(new Date(l.createdAt).getTime() / 1000) : timestamp;
        out += `${indent}    <DT><A HREF="${escapeXml(l.url)}" ADD_DATE="${addTime}">${escapeXml(l.title)}</A>\n`;
      });

      // Subfolders
      folders.filter(f => f.parentId === folderId).forEach(sub => {
        out += renderFolder(sub.id, indent + '    ');
      });

      out += `${indent}</DL><p>\n`;
      return out;
    };

    // Render root folders
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(rf => {
      html += renderFolder(rf.id);
    });

    // Render unfiled links at root
    unfiledLinks.forEach(l => {
      const addTime = l.createdAt ? Math.floor(new Date(l.createdAt).getTime() / 1000) : timestamp;
      html += `    <DT><A HREF="${escapeXml(l.url)}" ADD_DATE="${addTime}">${escapeXml(l.title)}</A>\n`;
    });

    html += `</DL><p>\n`;
    return html;
  }
};
