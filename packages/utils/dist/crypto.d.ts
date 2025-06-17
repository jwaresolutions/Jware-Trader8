/**
 * Cryptographic utilities for API key encryption and security
 */
/**
 * Encrypt a string using AES encryption
 */
export declare function encrypt(plaintext: string, key: string): string;
/**
 * Decrypt a string using AES decryption
 */
export declare function decrypt(ciphertext: string, key: string): string;
/**
 * Generate a secure random key for encryption
 */
export declare function generateEncryptionKey(length?: number): string;
/**
 * Hash a string using SHA-256
 */
export declare function hash(input: string): string;
/**
 * Generate HMAC signature for API authentication
 */
export declare function generateHMAC(message: string, secret: string, algorithm?: 'SHA256' | 'SHA512'): string;
/**
 * Generate HMAC signature in Base64 format
 */
export declare function generateHMACBase64(message: string, secret: string, algorithm?: 'SHA256' | 'SHA512'): string;
/**
 * Mask sensitive data for logging (shows only first and last few characters)
 */
export declare function maskSensitiveData(data: string, visibleChars?: number): string;
/**
 * Generate a secure random string
 */
export declare function generateRandomString(length?: number): string;
/**
 * Generate a UUID v4
 */
export declare function generateUUID(): string;
/**
 * Verify if data was encrypted with a specific key
 */
export declare function verifyEncryption(ciphertext: string, key: string, expectedPlaintext: string): boolean;
/**
 * Create a key derivation from password and salt
 */
export declare function deriveKey(password: string, salt: string, iterations?: number): string;
/**
 * Generate a cryptographically secure salt
 */
export declare function generateSalt(length?: number): string;
/**
 * Secure comparison of two strings (timing attack resistant)
 */
export declare function secureCompare(a: string, b: string): boolean;
/**
 * Generate API signature for request authentication
 */
export declare function generateAPISignature(method: string, path: string, timestamp: number, body: string, secretKey: string): string;
/**
 * Validate API signature
 */
export declare function validateAPISignature(method: string, path: string, timestamp: number, body: string, secretKey: string, providedSignature: string): boolean;
/**
 * Encrypt API credentials for storage
 */
export interface EncryptedCredentials {
    apiKey: string;
    secretKey: string;
    salt: string;
}
export declare function encryptCredentials(apiKey: string, secretKey: string, masterPassword: string): EncryptedCredentials;
/**
 * Decrypt API credentials from storage
 */
export declare function decryptCredentials(encryptedCredentials: EncryptedCredentials, masterPassword: string): {
    apiKey: string;
    secretKey: string;
};
//# sourceMappingURL=crypto.d.ts.map