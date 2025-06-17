/**
 * ConfigStore tests
 * Following TDD approach with encryption and security validation
 */

import { ConfigStore } from '../src/stores/config-store';
import { DatabaseConfig } from '@jware-trader8/types';
import * as fs from 'fs';
import * as path from 'path';

describe('ConfigStore', () => {
  let configStore: ConfigStore;
  let testDbPath: string;
  let config: DatabaseConfig;

  beforeEach(async () => {
    // Create temporary database for testing
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    config = {
      path: testDbPath,
      encryptionKey: 'test-encryption-key-32-bytes-long',
      enableWAL: true,
      timeout: 5000
    };
    
    configStore = new ConfigStore(config);
    await configStore.initialize();
  });

  afterEach(async () => {
    await configStore.close();
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Initialization', () => {
    test('should create database tables on initialization', async () => {
      // Tables should be created automatically in beforeEach
      expect(configStore).toBeDefined();
    });

    test('should enable WAL mode when configured', async () => {
      const walConfig = { ...config, enableWAL: true };
      const walStore = new ConfigStore(walConfig);
      await walStore.initialize();
      
      // Should not throw any errors
      expect(walStore).toBeDefined();
      await walStore.close();
    });

    test('should handle missing encryption key', () => {
      const invalidConfig = { ...config, encryptionKey: '' };
      expect(() => new ConfigStore(invalidConfig)).toThrow('Encryption key is required');
    });
  });

  describe('API Key Management', () => {
    test('should store and retrieve API keys with encryption', async () => {
      const apiKey = 'test-api-key-123';
      const secretKey = 'test-secret-key-456';
      
      await configStore.setApiKey('alpaca', apiKey, secretKey);
      const retrieved = await configStore.getApiKey('alpaca');
      
      expect(retrieved.apiKey).toBe(apiKey);
      expect(retrieved.secretKey).toBe(secretKey);
    });

    test('should encrypt API keys in database', async () => {
      const apiKey = 'test-api-key-123';
      const secretKey = 'test-secret-key-456';
      
      await configStore.setApiKey('alpaca', apiKey, secretKey);
      
      // Direct database check to ensure encryption
      const rawData = configStore.getRawApiKey('alpaca');
      expect(rawData.api_key).not.toBe(apiKey);
      expect(rawData.secret_key).not.toBe(secretKey);
      expect(rawData.api_key).toContain(':'); // Should have IV separator
      expect(rawData.secret_key).toContain(':'); // Should have IV separator
    });

    test('should update existing API keys', async () => {
      await configStore.setApiKey('alpaca', 'old-key', 'old-secret');
      await configStore.setApiKey('alpaca', 'new-key', 'new-secret');
      
      const retrieved = await configStore.getApiKey('alpaca');
      expect(retrieved.apiKey).toBe('new-key');
      expect(retrieved.secretKey).toBe('new-secret');
    });

    test('should throw error for non-existent API key', async () => {
      await expect(configStore.getApiKey('nonexistent')).rejects.toThrow(
        'API key not found for provider nonexistent'
      );
    });

    test('should handle multiple providers', async () => {
      await configStore.setApiKey('alpaca', 'alpaca-key', 'alpaca-secret');
      await configStore.setApiKey('polygon', 'polygon-key', 'polygon-secret');
      
      const alpaca = await configStore.getApiKey('alpaca');
      const polygon = await configStore.getApiKey('polygon');
      
      expect(alpaca.apiKey).toBe('alpaca-key');
      expect(polygon.apiKey).toBe('polygon-key');
    });
  });

  describe('Configuration Management', () => {
    test('should store and retrieve configuration values', async () => {
      const config = { 
        tradingMode: 'paper',
        maxPositions: 5,
        riskLevel: 'moderate'
      };
      
      await configStore.setConfig('trading', config);
      const retrieved = await configStore.getConfig('trading');
      
      expect(retrieved).toEqual(config);
    });

    test('should handle different data types', async () => {
      await configStore.setConfig('stringValue', 'test');
      await configStore.setConfig('numberValue', 42);
      await configStore.setConfig('booleanValue', true);
      await configStore.setConfig('arrayValue', [1, 2, 3]);
      await configStore.setConfig('objectValue', { key: 'value' });
      
      expect(await configStore.getConfig('stringValue')).toBe('test');
      expect(await configStore.getConfig('numberValue')).toBe(42);
      expect(await configStore.getConfig('booleanValue')).toBe(true);
      expect(await configStore.getConfig('arrayValue')).toEqual([1, 2, 3]);
      expect(await configStore.getConfig('objectValue')).toEqual({ key: 'value' });
    });

    test('should return null for non-existent config', async () => {
      const result = await configStore.getConfig('nonexistent');
      expect(result).toBeNull();
    });

    test('should update existing configuration', async () => {
      await configStore.setConfig('test', { old: 'value' });
      await configStore.setConfig('test', { new: 'value' });
      
      const result = await configStore.getConfig('test');
      expect(result).toEqual({ new: 'value' });
    });

    test('should list all configuration keys', async () => {
      await configStore.setConfig('config1', 'value1');
      await configStore.setConfig('config2', 'value2');
      await configStore.setConfig('config3', 'value3');
      
      const keys = await configStore.listConfigs();
      expect(keys).toContain('config1');
      expect(keys).toContain('config2');
      expect(keys).toContain('config3');
      expect(keys.length).toBe(3);
    });

    test('should delete configuration', async () => {
      await configStore.setConfig('toDelete', 'value');
      expect(await configStore.getConfig('toDelete')).toBe('value');
      
      await configStore.deleteConfig('toDelete');
      expect(await configStore.getConfig('toDelete')).toBeNull();
    });
  });

  describe('Configuration History', () => {
    test('should track configuration changes', async () => {
      await configStore.setConfig('tracked', 'value1');
      await configStore.setConfig('tracked', 'value2');
      await configStore.setConfig('tracked', 'value3');
      
      const history = await configStore.getConfigHistory('tracked');
      expect(history.length).toBe(3);
      expect(history[0].value).toBe('value3'); // Most recent first
      expect(history[1].value).toBe('value2');
      expect(history[2].value).toBe('value1');
    });

    test('should include timestamps in history', async () => {
      const before = new Date();
      await configStore.setConfig('timestamped', 'value');
      const after = new Date();
      
      const history = await configStore.getConfigHistory('timestamped');
      expect(history.length).toBe(1);
      expect(history[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(history[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    test('should return empty history for non-existent config', async () => {
      const history = await configStore.getConfigHistory('nonexistent');
      expect(history).toEqual([]);
    });
  });

  describe('Security Features', () => {
    test('should use different encryption for each value', async () => {
      await configStore.setApiKey('provider1', 'same-key', 'same-secret');
      await configStore.setApiKey('provider2', 'same-key', 'same-secret');
      
      const raw1 = configStore.getRawApiKey('provider1');
      const raw2 = configStore.getRawApiKey('provider2');
      
      // Same plaintext should produce different ciphertext due to different IVs
      expect(raw1.api_key).not.toBe(raw2.api_key);
      expect(raw1.secret_key).not.toBe(raw2.secret_key);
    });

    test('should handle encryption/decryption errors gracefully', async () => {
      // Corrupt the encryption key after storing data
      await configStore.setApiKey('test', 'key', 'secret');
      
      // Create new store with different key
      const corruptStore = new ConfigStore({
        ...config,
        encryptionKey: 'different-key-32-bytes-long!!!'
      });
      await corruptStore.initialize();
      
      await expect(corruptStore.getApiKey('test')).rejects.toThrow();
      await corruptStore.close();
    });

    test('should validate encryption key length', () => {
      const shortKeyConfig = { ...config, encryptionKey: 'short' };
      expect(() => new ConfigStore(shortKeyConfig)).toThrow('Encryption key must be at least 32 characters');
    });
  });

  describe('Performance and Concurrency', () => {
    test('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => 
        configStore.setConfig(`concurrent${i}`, `value${i}`)
      );
      
      await Promise.all(operations);
      
      for (let i = 0; i < 10; i++) {
        const value = await configStore.getConfig(`concurrent${i}`);
        expect(value).toBe(`value${i}`);
      }
    });

    test('should handle large configuration values', async () => {
      const largeValue = {
        data: 'x'.repeat(10000),
        array: Array.from({ length: 1000 }, (_, i) => i),
        nested: {
          deep: {
            structure: {
              with: 'many levels'
            }
          }
        }
      };
      
      await configStore.setConfig('large', largeValue);
      const retrieved = await configStore.getConfig('large');
      expect(retrieved).toEqual(largeValue);
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      await configStore.close();
      
      await expect(configStore.setConfig('test', 'value')).rejects.toThrow();
    });

    test('should handle invalid JSON in database', async () => {
      // This would be a rare corruption scenario
      // The implementation should handle it gracefully
      await configStore.setConfig('test', 'valid');
      
      // Manually corrupt the JSON in database
      configStore.corruptConfigValue('test', 'invalid-json{');
      
      await expect(configStore.getConfig('test')).rejects.toThrow();
    });
  });
});