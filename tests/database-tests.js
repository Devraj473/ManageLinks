/**
 * ManageLinks - IndexedDB Database Abstraction Test Suite
 * Developer: Devraj Chauhan
 */

import { db, generateId } from '../assets/js/database.js';

export async function runDatabaseTests(assert) {
  console.log('Running Database tests...');

  // 1. Open Database
  const connection = await db.open();
  assert(connection !== null, 'Database connection established');
  assert(connection.objectStoreNames.contains('links'), 'links object store exists');
  assert(connection.objectStoreNames.contains('categories'), 'categories object store exists');
  assert(connection.objectStoreNames.contains('folders'), 'folders object store exists');
  assert(connection.objectStoreNames.contains('collections'), 'collections object store exists');
  assert(connection.objectStoreNames.contains('deletedItems'), 'deletedItems store exists');
  assert(connection.objectStoreNames.contains('backupHistory'), 'backupHistory store exists');

  // 2. Put & Get
  const testId = generateId();
  await db.put('settings', { key: 'test_key_' + testId, value: 'test_value' });
  const retrieved = await db.get('settings', 'test_key_' + testId);
  assert(retrieved && retrieved.value === 'test_value', 'Put and get in store works');

  // 3. Count & Delete
  await db.delete('settings', 'test_key_' + testId);
  const deletedCheck = await db.get('settings', 'test_key_' + testId);
  assert(deletedCheck === null, 'Item deleted successfully');

  // 4. Bulk Operations
  const bulkItems = [
    { key: 'bulk_1_' + testId, value: 1 },
    { key: 'bulk_2_' + testId, value: 2 }
  ];
  await db.putBulk('settings', bulkItems);
  const item1 = await db.get('settings', 'bulk_1_' + testId);
  const item2 = await db.get('settings', 'bulk_2_' + testId);
  assert(item1 && item2, 'putBulk works atomically');

  // Cleanup
  await db.delete('settings', 'bulk_1_' + testId);
  await db.delete('settings', 'bulk_2_' + testId);
}
