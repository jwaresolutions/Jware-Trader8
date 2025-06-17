"use strict";
/**
 * Cryptographic utilities for API key encryption and security
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptCredentials = exports.encryptCredentials = exports.validateAPISignature = exports.generateAPISignature = exports.secureCompare = exports.generateSalt = exports.deriveKey = exports.verifyEncryption = exports.generateUUID = exports.generateRandomString = exports.maskSensitiveData = exports.generateHMACBase64 = exports.generateHMAC = exports.hash = exports.generateEncryptionKey = exports.decrypt = exports.encrypt = void 0;
const CryptoJS = __importStar(require("crypto-js"));
/**
 * Encrypt a string using AES encryption
 */
function encrypt(plaintext, key) {
    if (!plaintext || !key) {
        throw new Error('Plaintext and key are required for encryption');
    }
    try {
        const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
        return encrypted;
    }
    catch (error) {
        throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
exports.encrypt = encrypt;
/**
 * Decrypt a string using AES decryption
 */
function decrypt(ciphertext, key) {
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
    }
    catch (error) {
        throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
exports.decrypt = decrypt;
/**
 * Generate a secure random key for encryption
 */
function generateEncryptionKey(length = 32) {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    return randomBytes.toString(CryptoJS.enc.Hex);
}
exports.generateEncryptionKey = generateEncryptionKey;
/**
 * Hash a string using SHA-256
 */
function hash(input) {
    if (!input) {
        throw new Error('Input is required for hashing');
    }
    return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}
exports.hash = hash;
/**
 * Generate HMAC signature for API authentication
 */
function generateHMAC(message, secret, algorithm = 'SHA256') {
    if (!message || !secret) {
        throw new Error('Message and secret are required for HMAC generation');
    }
    try {
        let hmac;
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
    }
    catch (error) {
        throw new Error(`HMAC generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
exports.generateHMAC = generateHMAC;
/**
 * Generate HMAC signature in Base64 format
 */
function generateHMACBase64(message, secret, algorithm = 'SHA256') {
    if (!message || !secret) {
        throw new Error('Message and secret are required for HMAC generation');
    }
    try {
        let hmac;
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
    }
    catch (error) {
        throw new Error(`HMAC generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
exports.generateHMACBase64 = generateHMACBase64;
/**
 * Mask sensitive data for logging (shows only first and last few characters)
 */
function maskSensitiveData(data, visibleChars = 4) {
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
exports.maskSensitiveData = maskSensitiveData;
/**
 * Generate a secure random string
 */
function generateRandomString(length = 16) {
    if (length <= 0) {
        throw new Error('Length must be positive');
    }
    const randomBytes = CryptoJS.lib.WordArray.random(Math.ceil(length / 2));
    const randomString = randomBytes.toString(CryptoJS.enc.Hex);
    return randomString.substring(0, length);
}
exports.generateRandomString = generateRandomString;
/**
 * Generate a UUID v4
 */
function generateUUID() {
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
exports.generateUUID = generateUUID;
/**
 * Verify if data was encrypted with a specific key
 */
function verifyEncryption(ciphertext, key, expectedPlaintext) {
    try {
        const decrypted = decrypt(ciphertext, key);
        return decrypted === expectedPlaintext;
    }
    catch {
        return false;
    }
}
exports.verifyEncryption = verifyEncryption;
/**
 * Create a key derivation from password and salt
 */
function deriveKey(password, salt, iterations = 10000) {
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
    }
    catch (error) {
        throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
exports.deriveKey = deriveKey;
/**
 * Generate a cryptographically secure salt
 */
function generateSalt(length = 32) {
    return generateRandomString(length);
}
exports.generateSalt = generateSalt;
/**
 * Secure comparison of two strings (timing attack resistant)
 */
function secureCompare(a, b) {
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
exports.secureCompare = secureCompare;
/**
 * Generate API signature for request authentication
 */
function generateAPISignature(method, path, timestamp, body, secretKey) {
    const message = `${method.toUpperCase()}${path}${timestamp}${body}`;
    return generateHMACBase64(message, secretKey, 'SHA256');
}
exports.generateAPISignature = generateAPISignature;
/**
 * Validate API signature
 */
function validateAPISignature(method, path, timestamp, body, secretKey, providedSignature) {
    const expectedSignature = generateAPISignature(method, path, timestamp, body, secretKey);
    return secureCompare(expectedSignature, providedSignature);
}
exports.validateAPISignature = validateAPISignature;
function encryptCredentials(apiKey, secretKey, masterPassword) {
    const salt = generateSalt();
    const derivedKey = deriveKey(masterPassword, salt);
    return {
        apiKey: encrypt(apiKey, derivedKey),
        secretKey: encrypt(secretKey, derivedKey),
        salt: salt
    };
}
exports.encryptCredentials = encryptCredentials;
/**
 * Decrypt API credentials from storage
 */
function decryptCredentials(encryptedCredentials, masterPassword) {
    const derivedKey = deriveKey(masterPassword, encryptedCredentials.salt);
    return {
        apiKey: decrypt(encryptedCredentials.apiKey, derivedKey),
        secretKey: decrypt(encryptedCredentials.secretKey, derivedKey)
    };
}
exports.decryptCredentials = decryptCredentials;
