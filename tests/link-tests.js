/**
 * ManageLinks - Link Operations Test Suite
 * Developer: Devraj Chauhan
 */

import { db, generateId } from '../assets/js/database.js';
import { LinkManager } from '../assets/js/link-manager.js';

export async function runLinkTests(assert) {
  console.log('Running Link operations tests...');

  // 1. Create Link
  const linkData = {
    title: 'Test Google Search',
    url: 'https://google.com/search?q=test',
    tags: ['search', 'google'],
    notes: 'Primary test note'
  };

  const created = await LinkManager.createLink(linkData);
  assert(created && created.id, 'Link created with unique ID');
  assert(created.url.startsWith('https://google.com'), 'Link URL normalized');
  assert(created.visitCount === 0, 'Initial visit count is 0');

  // 2. Favorite & Pin Toggles
  const favUpdated = await LinkManager.toggleFavorite(created.id);
  assert(favUpdated.isFavorite === true, 'Link successfully marked as favourite');

  const pinUpdated = await LinkManager.togglePin(created.id);
  assert(pinUpdated.isPinned === true, 'Link successfully marked as pinned');

  // 3. Record Visit
  const visited = await LinkManager.recordVisit(created.id);
  assert(visited.visitCount === 1, 'Visit count increments to 1');
  assert(visited.lastVisitedAt !== null, 'lastVisitedAt timestamp recorded');

  // 4. Duplicate Detection
  const dupCheck = await LinkManager.checkDuplicate('https://google.com/search?q=test#hash');
  assert(dupCheck && dupCheck.id === created.id, 'Duplicate detected accurately across hash differences');

  // 5. Soft Delete & Restore
  await LinkManager.softDeleteLink(created.id);
  const activeCheck = await db.get('links', created.id);
  assert(activeCheck === null, 'Soft-deleted link removed from active links store');

  const trashList = await db.getAll('deletedItems');
  const trashItem = trashList.find(t => t.originalId === created.id);
  assert(trashItem !== undefined, 'Item preserved in deletedItems (trash)');

  // Restore
  await LinkManager.restoreFromTrash(trashItem.id);
  const restoredCheck = await db.get('links', created.id);
  assert(restoredCheck && restoredCheck.id === created.id, 'Link successfully restored from trash');

  // Cleanup
  await db.delete('links', created.id);
}
