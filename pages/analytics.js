/**
 * ManageLinks - Analytics Page
 * Developer: Devraj Chauhan
 * 100% Local data visualization & usage trends
 */

import { Icons } from '../assets/js/icons.js';
import { Analytics } from '../assets/js/analytics.js';
import { Security } from '../assets/js/security.js';

export const AnalyticsPage = {
  async render() {
    const container = document.getElementById('content-area');
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>';

    const metrics = await Analytics.getMetrics();

    // Prepare monthly activity chart data
    const monthlyData = Object.entries(metrics.monthlyActivity)
      .slice(-6)
      .map(([month, count]) => ({
        label: month.slice(5), // 'MM'
        value: count
      }));

    if (monthlyData.length === 0) {
      monthlyData.push({ label: 'Current', value: metrics.activeLinks });
    }

    // Prepare reading status segments for Donut chart
    const readingSegments = [
      { label: 'Unread', value: metrics.readingStatuses.unread, color: '#f59e0b' },
      { label: 'Reading', value: metrics.readingStatuses.reading, color: '#3b82f6' },
      { label: 'Completed', value: metrics.readingStatuses.completed, color: '#10b981' }
    ];

    container.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 class="fw-bold mb-1">Local Analytics</h2>
          <p class="text-secondary mb-0">Insights and statistics derived 100% on-device. Zero external analytics.</p>
        </div>
      </div>

      <!-- Overview Stats -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div>
              <div class="stat-label">Total Links</div>
              <div class="stat-value text-primary">${metrics.totalLinks}</div>
            </div>
            <div class="stat-icon bg-primary-subtle text-primary">${Icons.get('link', { size: 22 })}</div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div>
              <div class="stat-label">Added This Month</div>
              <div class="stat-value text-success">${metrics.addedThisMonth}</div>
            </div>
            <div class="stat-icon bg-success-subtle text-success">${Icons.get('calendar', { size: 22 })}</div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div>
              <div class="stat-label">Added This Week</div>
              <div class="stat-value text-info">${metrics.addedThisWeek}</div>
            </div>
            <div class="stat-icon bg-info-subtle text-info">${Icons.get('clock', { size: 22 })}</div>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="stat-card">
            <div>
              <div class="stat-label">Favourites</div>
              <div class="stat-value text-warning">${metrics.favoriteCount}</div>
            </div>
            <div class="stat-icon bg-warning-subtle text-warning">${Icons.get('star', { size: 22 })}</div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="row g-4 mb-4">
        <!-- Monthly Activity Chart -->
        <div class="col-lg-8">
          <div class="card border shadow-sm h-100">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('bar-chart-2', { size: 16, className: 'me-1' })} Link Saving Activity</h6>
            </div>
            <div class="card-body p-4">
              ${Analytics.renderBarChart(monthlyData, { width: 560, height: 230, color: '#2563eb' })}
            </div>
          </div>
        </div>

        <!-- Reading List Progress Donut -->
        <div class="col-lg-4">
          <div class="card border shadow-sm h-100">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('book-open', { size: 16, className: 'me-1' })} Reading Progress</h6>
            </div>
            <div class="card-body p-4 text-center">
              ${Analytics.renderDonutChart(readingSegments, { size: 160, thickness: 22 })}
              
              <div class="d-flex justify-content-center gap-3 mt-3 small">
                <span class="d-flex align-items-center gap-1">
                  <span class="rounded-circle d-inline-block" style="width: 8px; height: 8px; background-color: #f59e0b;"></span>
                  Unread (${metrics.readingStatuses.unread})
                </span>
                <span class="d-flex align-items-center gap-1">
                  <span class="rounded-circle d-inline-block" style="width: 8px; height: 8px; background-color: #3b82f6;"></span>
                  Reading (${metrics.readingStatuses.reading})
                </span>
                <span class="d-flex align-items-center gap-1">
                  <span class="rounded-circle d-inline-block" style="width: 8px; height: 8px; background-color: #10b981;"></span>
                  Done (${metrics.readingStatuses.completed})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Categories & Most Visited Links -->
      <div class="row g-4">
        <!-- Top Categories Breakdown -->
        <div class="col-lg-6">
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('folder', { size: 16, className: 'me-1' })} Category Distribution</h6>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                ${metrics.categoryCounts.length === 0
                  ? '<div class="text-center text-muted py-4 small">No category data</div>'
                  : metrics.categoryCounts.map(cat => `
                      <div class="list-group-item d-flex align-items-center justify-content-between py-2 px-3">
                        <span class="fw-medium">${Security.escapeHtml(cat.name)}</span>
                        <span class="badge bg-primary-subtle text-primary rounded-pill">${cat.count}</span>
                      </div>
                    `).join('')
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Most Visited Bookmarks -->
        <div class="col-lg-6">
          <div class="card border shadow-sm">
            <div class="card-header bg-transparent py-3">
              <h6 class="fw-bold mb-0">${Icons.get('external-link', { size: 16, className: 'me-1' })} Most Visited Bookmarks</h6>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                ${metrics.mostVisited.length === 0
                  ? '<div class="text-center text-muted py-4 small">No visit records yet. Open links to track visits!</div>'
                  : metrics.mostVisited.map(link => `
                      <a href="${Security.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3">
                        <div class="min-w-0 me-2">
                          <div class="fw-semibold text-truncate" style="font-size: 0.9rem;">${Security.escapeHtml(link.title)}</div>
                          <div class="text-muted small text-truncate" style="font-size: 0.75rem;">${Security.escapeHtml(link.url)}</div>
                        </div>
                        <span class="badge bg-success-subtle text-success rounded-pill flex-shrink-0">${link.visitCount} visits</span>
                      </a>
                    `).join('')
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
