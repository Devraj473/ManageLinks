/**
 * ManageLinks - Web Crypto Encryption and Hashing Utilities
 * Developer: Devraj Chauhan
 * Uses standard Web Crypto API: PBKDF2 (SHA-256) + AES-GCM (256-bit)
 */

export const Encryption = {
  ITERATIONS: 100000,

  /**
   * Convert ArrayBuffer to Base64
   */
  bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  },

  /**
   * Convert Base64 to Uint8Array
   */
  base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  },

  /**
   * Derive AES-GCM key from password and salt using PBKDF2
   */
  async deriveKey(password, saltBytes) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Encrypt a string or JSON object with a user password
   * Returns a structured envelope ready to save or serialize
   */
  async encrypt(data, password) {
    if (!password) throw new Error('Password is required for encryption');
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);

    // Generate random 16-byte salt and 12-byte IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await this.deriveKey(password, salt);
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plaintext)
    );

    return {
      version: 1,
      encrypted: true,
      cipher: 'AES-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: this.ITERATIONS,
      salt: this.bufferToBase64(salt),
      iv: this.bufferToBase64(iv),
      data: this.bufferToBase64(ciphertext)
    };
  },

  /**
   * Decrypt an encrypted envelope using the user password
   * Returns parsed JSON or raw string
   */
  async decrypt(envelope, password) {
    if (!password) throw new Error('Password is required for decryption');
    if (!envelope || !envelope.encrypted || !envelope.salt || !envelope.iv || !envelope.data) {
      throw new Error('Invalid encrypted backup format');
    }

    try {
      const salt = this.base64ToBuffer(envelope.salt);
      const iv = this.base64ToBuffer(envelope.iv);
      const ciphertext = this.base64ToBuffer(envelope.data);

      const key = await this.deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      const text = dec.decode(decrypted);

      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch (err) {
      throw new Error('Decryption failed. Incorrect password or corrupted file.');
    }
  },

  /**
   * Hash an application PIN with salt for secure storage
   */
  async hashPin(pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    return {
      salt: this.bufferToBase64(salt),
      hash: this.bufferToBase64(hashBuffer)
    };
  },

  /**
   * Verify an entered PIN against stored salt and hash
   */
  async verifyPin(pin, storedSaltBase64, storedHashBase64) {
    try {
      const salt = this.base64ToBuffer(storedSaltBase64);
      const enc = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(pin),
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );

      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt,
          iterations: this.ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );

      const computedHash = this.bufferToBase64(hashBuffer);
      return computedHash === storedHashBase64;
    } catch {
      return false;
    }
  }
};
