/**
 * Cryptographic utilities for API key encryption and security
 */

import * as CryptoJS from 'crypto-js';

/**
 * Encrypt a string using AES encryption
 */
export function encrypt(plaintext: string, key: string): string {
  if (!plaintext || !key) {
    throw new Error('Plaintext and key are required for encryption');
  }
  
  try {
    const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
    return encrypted;
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt a string using AES decryption
 */
export function decrypt(ciphertext: string, key: string): string {
  if (!ciphertext || !key) {
    throw new Error('Ciphertext and key are required for decryption');
  }
  
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Failed to decrypt - invalid key or corrupted data');
    }
    
    return plaintext;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a secure random key for encryption
 */
export function generateEncryptionKey(length: number = 32): string {
  const randomBytes = CryptoJS.lib.WordArray.random(length);
  return randomBytes.toString(CryptoJS.enc.Hex);
}

/**
 * Hash a string using SHA-256
 */
export function hash(input: string): string {
  if (!input) {
    throw new Error('Input is required for hashing');
  }
  
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}

/**
 * Generate HMAC signature for API authentication
 */
export function generateHMAC(message: string, secret: string, algorithm: 'SHA256' | 'SHA512' = 'SHA256'): string {
  if (!message || !secret) {
    throw new Error('Message and secret are required for HMAC generation');
  }
  
  try {
    let hmac: CryptoJS.lib.WordArray;
    
    switch (algorithm) {
      case 'SHA256':
        hmac = CryptoJS.HmacSHA256(message, secret);
        break;
      case 'SHA512':
        hmac = CryptoJS.HmacSHA512(message, secret);
        break;
      default:
        throw new Error(`Unsupported HMAC algorithm: ${algorithm}`);
    }
    
    return hmac.toString(CryptoJS.enc.Hex);
  } catch (error) {
    throw new Error(`HMAC generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate HMAC signature in Base64 format
 */
export function generateHMACBase64(message: string, secret: string, algorithm: 'SHA256' | 'SHA512' = 'SHA256'): string {
  if (!message || !secret) {
    throw new Error('Message and secret are required for HMAC generation');
  }
  
  try {
    let hmac: CryptoJS.lib.WordArray;
    
    switch (algorithm) {
      case 'SHA256':
        hmac = CryptoJS.HmacSHA256(message, secret);
        break;
      case 'SHA512':
        hmac = CryptoJS.HmacSHA512(message, secret);
        break;
      default:
        throw new Error(`Unsupported HMAC algorithm: ${algorithm}`);
    }
    
    return hmac.toString(CryptoJS.enc.Base64);
  } catch (error) {
    throw new Error(`HMAC generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Mask sensitive data for logging (shows only first and last few characters)
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || typeof data !== 'string') {
    return '***';
  }
  
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(data.length - (visibleChars * 2));
  
  return `${start}${masked}${end}`;
}

/**
 * Generate a secure random string
 */
export function generateRandomString(length: number = 16): string {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }
  
  const randomBytes = CryptoJS.lib.WordArray.random(Math.ceil(length / 2));
  const randomString = randomBytes.toString(CryptoJS.enc.Hex);
  
  return randomString.substring(0, length);
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  // Generate 16 random bytes
  const randomBytes = CryptoJS.lib.WordArray.random(16);
  const hex = randomBytes.toString(CryptoJS.enc.Hex);
  
  // Format as UUID v4
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    '4' + hex.substring(13, 16), // Version 4
    ((parseInt(hex.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + hex.substring(17, 20), // Variant bits
    hex.substring(20, 32)
  ].join('-');
}

/**
 * Verify if data was encrypted with a specific key
 */
export function verifyEncryption(ciphertext: string, key: string, expectedPlaintext: string): boolean {
  try {
    const decrypted = decrypt(ciphertext, key);
    return decrypted === expectedPlaintext;
  } catch {
    return false;
  }
}

/**
 * Create a key derivation from password and salt
 */
export function deriveKey(password: string, salt: string, iterations: number = 10000): string {
  if (!password || !salt) {
    throw new Error('Password and salt are required for key derivation');
  }
  
  if (iterations < 1000) {
    throw new Error('Iterations must be at least 1000 for security');
  }
  
  try {
    const derived = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32, // 256 bits
      iterations: iterations,
      hasher: CryptoJS.algo.SHA256
    });
    
    return derived.toString(CryptoJS.enc.Hex);
  } catch (error) {
    throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a cryptographically secure salt
 */
export function generateSalt(length: number = 32): string {
  return generateRandomString(length);
}

/**
 * Secure comparison of two strings (timing attack resistant)
 */
export function secureCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Generate API signature for request authentication
 */
export function generateAPISignature(
  method: string,
  path: string,
  timestamp: number,
  body: string,
  secretKey: string
): string {
  const message = `${method.toUpperCase()}${path}${timestamp}${body}`;
  return generateHMACBase64(message, secretKey, 'SHA256');
}

/**
 * Validate API signature
 */
export function validateAPISignature(
  method: string,
  path: string,
  timestamp: number,
  body: string,
  secretKey: string,
  providedSignature: string
): boolean {
  const expectedSignature = generateAPISignature(method, path, timestamp, body, secretKey);
  return secureCompare(expectedSignature, providedSignature);
}

/**
 * Encrypt API credentials for storage
 */
export interface EncryptedCredentials {
  apiKey: string;
  secretKey: string;
  salt: string;
}

export function encryptCredentials(
  apiKey: string,
  secretKey: string,
  masterPassword: string
): EncryptedCredentials {
  const salt = generateSalt();
  const derivedKey = deriveKey(masterPassword, salt);
  
  return {
    apiKey: encrypt(apiKey, derivedKey),
    secretKey: encrypt(secretKey, derivedKey),
    salt: salt
  };
}

/**
 * Decrypt API credentials from storage
 */
export function decryptCredentials(
  encryptedCredentials: EncryptedCredentials,
  masterPassword: string
): { apiKey: string; secretKey: string } {
  const derivedKey = deriveKey(masterPassword, encryptedCredentials.salt);
  
  return {
    apiKey: decrypt(encryptedCredentials.apiKey, derivedKey),
    secretKey: decrypt(encryptedCredentials.secretKey, derivedKey)
  };
}