/**
 * ManageLinks - Local Analytics Engine & Visualizations
 * Developer: Devraj Chauhan
 * 100% Local data calculation, zero external dependencies, SVG-powered charts
 */

import { db } from './database.js';
import { DateUtils } from '../../utils/date-utils.js';

export const Analytics = {
  /**
   * Compute comprehensive metrics for dashboard and analytics views
   */
  async getMetrics() {
    const allLinks = await db.getAll('links');
    const categories = await db.getAll('categories');
    const folders = await db.getAll('folders');
    const collections = await db.getAll('collections');
    const trashItems = await db.getAll('deletedItems');

    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const folderMap = new Map(folders.map(f => [f.id, f.name]));

    let activeLinks = 0;
    let favoriteCount = 0;
    let pinnedCount = 0;
    let archivedCount = 0;
    let inboxCount = 0;
    let readLaterCount = 0;
    let addedThisWeek = 0;
    let addedThisMonth = 0;

    const readingStatuses = { unread: 0, reading: 0, completed: 0, none: 0 };
    const categoryCounts = {};
    const folderCounts = {};
    const tagCounts = {};
    const monthlyActivity = {}; // 'YYYY-MM' -> count

    allLinks.forEach(link => {
      if (link.isArchived) {
        archivedCount++;
      } else {
        activeLinks++;
      }

      if (link.isFavorite) favoriteCount++;
      if (link.isPinned) pinnedCount++;
      if (link.isReadLater) readLaterCount++;

      // Inbox: no category and no folder and not archived
      if (!link.categoryId && !link.folderId && !link.isArchived) {
        inboxCount++;
      }

      // Reading status
      const status = link.readingStatus || 'none';
      readingStatuses[status] = (readingStatuses[status] || 0) + 1;

      // Dates
      if (DateUtils.isThisWeek(link.createdAt)) addedThisWeek++;
      if (DateUtils.isThisMonth(link.createdAt)) addedThisMonth++;

      // Category distribution
      const catName = link.categoryId ? (catMap.get(link.categoryId) || 'Other') : 'Unassigned';
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;

      // Folder distribution
      if (link.folderId) {
        const fName = folderMap.get(link.folderId) || 'Unknown Folder';
        folderCounts[fName] = (folderCounts[fName] || 0) + 1;
      }

      // Tags
      if (Array.isArray(link.tags)) {
        link.tags.forEach(t => {
          const cleanTag = t.trim().toLowerCase();
          if (cleanTag) {
            tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
          }
        });
      }

      // Monthly activity
      if (link.createdAt) {
        const monthKey = link.createdAt.slice(0, 7); // 'YYYY-MM'
        monthlyActivity[monthKey] = (monthlyActivity[monthKey] || 0) + 1;
      }
    });

    // Top visited links
    const mostVisited = [...allLinks]
      .filter(l => (l.visitCount || 0) > 0)
      .sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
      .slice(0, 5);

    // Recently visited links
    const recentlyVisited = [...allLinks]
      .filter(l => !!l.lastVisitedAt)
      .sort((a, b) => new Date(b.lastVisitedAt) - new Date(a.lastVisitedAt))
      .slice(0, 5);

    // Recently added links
    const recentlyAdded = [...allLinks]
      .filter(l => !l.isArchived)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Top categories array
    const sortedCategories = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Top tags array
    const sortedTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLinks: allLinks.length,
      activeLinks,
      totalCategories: categories.length,
      totalFolders: folders.length,
      totalCollections: collections.length,
      trashCount: trashItems.length,
      favoriteCount,
      pinnedCount,
      archivedCount,
      inboxCount,
      readLaterCount,
      addedThisWeek,
      addedThisMonth,
      readingStatuses,
      categoryCounts: sortedCategories,
      folderCounts,
      topTags: sortedTags,
      monthlyActivity,
      mostVisited,
      recentlyVisited,
      recentlyAdded
    };
  },

  /**
   * Render clean SVG Bar Chart
   */
  renderBarChart(data, { width = 500, height = 220, color = '#2563eb' } = {}) {
    if (!data || data.length === 0) {
      return '<div class="text-center text-muted py-4">No data available</div>';
    }

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.max(16, Math.floor((width - 60) / data.length) - 8);
    const chartHeight = height - 50;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="w-100 h-auto" style="overflow: visible;">`;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = chartHeight - (i * (chartHeight / 4)) + 15;
      const valLabel = Math.round((maxVal / 4) * i);
      svg += `<line x1="40" y1="${y}" x2="${width - 10}" y2="${y}" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3,3" />`;
      svg += `<text x="32" y="${y + 4}" font-size="10" fill="currentColor" opacity="0.6" text-anchor="end">${valLabel}</text>`;
    }

    // Bars
    data.forEach((item, index) => {
      const x = 50 + index * (barWidth + 10);
      const barH = (item.value / maxVal) * (chartHeight - 10);
      const y = chartHeight + 15 - barH;

      svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${color}" opacity="0.9">
                <title>${item.label}: ${item.value}</title>
              </rect>`;
      svg += `<text x="${x + barWidth / 2}" y="${height - 10}" font-size="10" fill="currentColor" opacity="0.8" text-anchor="middle">${item.label}</text>`;
    });

    svg += `</svg>`;
    return svg;
  },

  /**
   * Render clean SVG Donut Chart for proportions (e.g. Reading status or Categories)
   */
  renderDonutChart(segments, { size = 180, thickness = 24 } = {}) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    if (total === 0) {
      return '<div class="text-center text-muted py-3">No data recorded yet</div>';
    }

    const radius = size / 2 - thickness / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="d-block mx-auto">
      <g transform="rotate(-90 ${size / 2} ${size / 2})">`;

    segments.forEach(seg => {
      if (seg.value === 0) return;
      const strokeLength = (seg.value / total) * circumference;
      svg += `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent"
                stroke="${seg.color}" stroke-width="${thickness}"
                stroke-dasharray="${strokeLength} ${circumference - strokeLength}"
                stroke-dashoffset="-${accumulatedOffset}"
                stroke-linecap="round">
                <title>${seg.label}: ${seg.value} (${Math.round((seg.value / total) * 100)}%)</title>
              </circle>`;
      accumulatedOffset += strokeLength;
    });

    svg += `</g>
      <text x="${size / 2}" y="${size / 2 + 5}" font-size="16" font-weight="700" fill="currentColor" text-anchor="middle">${total}</text>
      <text x="${size / 2}" y="${size / 2 + 20}" font-size="10" fill="currentColor" opacity="0.6" text-anchor="middle">Total</text>
    </svg>`;

    return svg;
  }
};
