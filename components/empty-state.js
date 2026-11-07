/**
 * ManageLinks - Empty State Component
 * Developer: Devraj Chauhan
 */

import { Icons } from '../assets/js/icons.js';

export const EmptyState = {
  render({
    icon = 'inbox',
    title = 'No links found',
    description = 'There are no items matching your criteria.',
    actionText = null,
    actionId = null,
    secondaryText = null,
    secondaryId = null
  } = {}) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          ${Icons.get(icon, { size: 36, color: 'var(--ml-text-muted)' })}
        </div>
        <h4 class="empty-state-title">${title}</h4>
        <p class="empty-state-desc">${description}</p>
        <div class="d-flex align-items-center gap-2">
          ${actionText ? `<button type="button" class="btn-ml-primary" id="${actionId}">${actionText}</button>` : ''}
          ${secondaryText ? `<button type="button" class="btn-ml-secondary" id="${secondaryId}">${secondaryText}</button>` : ''}
        </div>
      </div>
    `;
  }
};
