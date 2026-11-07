/**
 * ManageLinks - Backup & Cryptography Test Suite
 * Developer: Devraj Chauhan
 */

import { BackupManager } from '../assets/js/backup.js';
import { Encryption } from '../utils/encryption.js';

export async function runBackupTests(assert) {
  console.log('Running Backup & Cryptography tests...');

  // 1. Web Crypto Encryption & Decryption
  const samplePayload = {
    app: 'ManageLinks',
    testMessage: 'Confidential Bookmarks Payload',
    recordsCount: 42
  };
  const password = 'StrongMasterPassword123!';

  const encryptedEnvelope = await Encryption.encrypt(samplePayload, password);
  assert(encryptedEnvelope.encrypted === true, 'Envelope marked as encrypted');
  assert(encryptedEnvelope.cipher === 'AES-GCM', 'Cipher is AES-GCM');
  assert(encryptedEnvelope.salt && encryptedEnvelope.iv && encryptedEnvelope.data, 'Salt, IV, and data present');

  // Decrypt with correct password
  const decrypted = await Encryption.decrypt(encryptedEnvelope, password);
  assert(decrypted.testMessage === samplePayload.testMessage, 'Decrypted payload matches original plaintext');

  // Decrypt with incorrect password
  let failedAsExpected = false;
  try {
    await Encryption.decrypt(encryptedEnvelope, 'WrongPassword!');
  } catch (err) {
    failedAsExpected = true;
  }
  assert(failedAsExpected, 'Decryption with wrong password correctly throws error');

  // 2. Backup Preview Analysis
  const preview = await BackupManager.getBackupPreview('complete');
  assert(preview.type === 'complete', 'Complete preview generated');
  assert(typeof preview.totalRecords === 'number', 'Total records is a valid number');
  assert(preview.estimatedSize.length > 0, 'Estimated file size formatted string exists');

  // 3. PIN Hashing & Verification
  const pin = '4829';
  const { salt, hash } = await Encryption.hashPin(pin);
  const verifyValid = await Encryption.verifyPin(pin, salt, hash);
  const verifyInvalid = await Encryption.verifyPin('0000', salt, hash);
  assert(verifyValid === true, 'Valid PIN passes verification');
  assert(verifyInvalid === false, 'Invalid PIN fails verification');
}
