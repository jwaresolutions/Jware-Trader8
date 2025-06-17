/**
 * Configuration storage with encryption
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import Database from 'better-sqlite3';
import { 
  IConfigStore, 
  DatabaseConfig, 
  ApiKeyPair, 
  ConfigHistoryEntry 
} from '@jware-trader8/types';
import { encrypt, decrypt, Logger } from '@jware-trader8/utils';
import { format } from 'date-fns';

/**
 * Configuration store implementation with SQLite backend
 */
export class ConfigStore implements IConfigStore {
  private db: Database.Database;
  private config: DatabaseConfig;
  private encryptionKey: string;
  private logger: Logger;
  private isInitialized: boolean = false;

  // Prepared statements for performance
  private statements: {
    setApiKey?: Database.Statement;
    getApiKey?: Database.Statement;
    setConfig?: Database.Statement;
    getConfig?: Database.Statement;
    listConfigs?: Database.Statement;
    deleteConfig?: Database.Statement;
    getConfigHistory?: Database.Statement;
    insertConfigHistory?: Database.Statement;
  } = {};

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.encryptionKey = config.encryptionKey;
    this.logger = new Logger('ConfigStore');

    // Validate encryption key
    if (!this.encryptionKey) {
      throw new Error('Encryption key is required');
    }
    if (this.encryptionKey.length < 32) {
      throw new Error('Encryption key must be at least 32 characters');
    }

    // Initialize database connection
    this.db = new Database(config.path, {
      timeout: config.timeout || 5000,
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
    });

    this.logger.info('ConfigStore initialized', {
      dbPath: config.path,
      enableWAL: config.enableWAL
    });
  }

  /**
   * Initialize the database schema
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Enable WAL mode if configured
      if (this.config.enableWAL) {
        this.db.pragma('journal_mode = WAL');
      }

      // Set other pragmas for performance and reliability
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');

      // Create tables
      this.setupTables();

      // Prepare statements
      this.prepareStatements();

      this.isInitialized = true;
      this.logger.info('Database schema initialized');
    } catch (error) {
      this.logger.error('Failed to initialize database', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Set API key for a provider
   */
  async setApiKey(provider: string, apiKey: string, secretKey: string): Promise<void> {
    this.ensureInitialized();

    try {
      const encryptedApiKey = encrypt(apiKey, this.encryptionKey);
      const encryptedSecretKey = encrypt(secretKey, this.encryptionKey);

      this.statements.setApiKey!.run({
        provider,
        api_key: encryptedApiKey,
        secret_key: encryptedSecretKey,
        updated_at: new Date().toISOString()
      });

      this.logger.info('API key set for provider', { provider });
    } catch (error) {
      this.logger.error('Failed to set API key', {
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get API key for a provider
   */
  async getApiKey(provider: string): Promise<ApiKeyPair> {
    this.ensureInitialized();

    try {
      const row = this.statements.getApiKey!.get({ provider }) as any;

      if (!row) {
        throw new Error(`API key not found for provider ${provider}`);
      }

      const apiKey = decrypt(row.api_key, this.encryptionKey);
      const secretKey = decrypt(row.secret_key, this.encryptionKey);

      return { apiKey, secretKey };
    } catch (error) {
      this.logger.error('Failed to get API key', {
        provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Set configuration value
   */
  async setConfig(key: string, value: any): Promise<void> {
    this.ensureInitialized();

    try {
      const serializedValue = JSON.stringify(value);
      const timestamp = new Date().toISOString();

      this.statements.setConfig!.run({
        key,
        value: serializedValue,
        updated_at: timestamp
      });

      // Add to history
      this.statements.insertConfigHistory!.run({
        key,
        value: serializedValue,
        timestamp
      });

      this.logger.info('Configuration set', { key });
    } catch (error) {
      this.logger.error('Failed to set configuration', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get configuration value
   */
  async getConfig(key: string): Promise<any> {
    this.ensureInitialized();

    try {
      const row = this.statements.getConfig!.get({ key }) as any;

      if (!row) {
        return null;
      }

      return JSON.parse(row.value);
    } catch (error) {
      this.logger.error('Failed to get configuration', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * List all configuration keys
   */
  async listConfigs(): Promise<string[]> {
    this.ensureInitialized();

    try {
      const rows = this.statements.listConfigs!.all() as any[];
      return rows.map(row => row.key);
    } catch (error) {
      this.logger.error('Failed to list configurations', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete configuration value
   */
  async deleteConfig(key: string): Promise<void> {
    this.ensureInitialized();

    try {
      this.statements.deleteConfig!.run({ key });
      this.logger.info('Configuration deleted', { key });
    } catch (error) {
      this.logger.error('Failed to delete configuration', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get configuration history
   */
  async getConfigHistory(key: string): Promise<ConfigHistoryEntry[]> {
    this.ensureInitialized();

    try {
      const rows = this.statements.getConfigHistory!.all({ key }) as any[];
      
      return rows.map(row => ({
        key: row.key,
        value: JSON.parse(row.value),
        timestamp: new Date(row.timestamp)
      }));
    } catch (error) {
      this.logger.error('Failed to get configuration history', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.logger.info('Database connection closed');
    }
  }

  /**
   * Test methods for debugging (should be private in production)
   */
  getRawApiKey(provider: string): any {
    const row = this.db.prepare('SELECT * FROM api_keys WHERE provider = ?').get(provider);
    return row;
  }

  corruptConfigValue(key: string, corruptValue: string): void {
    this.db.prepare('UPDATE config SET value = ? WHERE key = ?').run(corruptValue, key);
  }

  /**
   * Private helper methods
   */

  private setupTables(): void {
    // API Keys table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        provider TEXT PRIMARY KEY,
        api_key TEXT NOT NULL,
        secret_key TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Configuration table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Configuration history table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        FOREIGN KEY (key) REFERENCES config(key)
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_config_history_key_timestamp 
      ON config_history(key, timestamp DESC)
    `);

    this.logger.info('Database tables created');
  }

  private prepareStatements(): void {
    this.statements.setApiKey = this.db.prepare(`
      INSERT OR REPLACE INTO api_keys (provider, api_key, secret_key, updated_at)
      VALUES (@provider, @api_key, @secret_key, @updated_at)
    `);

    this.statements.getApiKey = this.db.prepare(`
      SELECT api_key, secret_key FROM api_keys WHERE provider = @provider
    `);

    this.statements.setConfig = this.db.prepare(`
      INSERT OR REPLACE INTO config (key, value, updated_at)
      VALUES (@key, @value, @updated_at)
    `);

    this.statements.getConfig = this.db.prepare(`
      SELECT value FROM config WHERE key = @key
    `);

    this.statements.listConfigs = this.db.prepare(`
      SELECT key FROM config ORDER BY key
    `);

    this.statements.deleteConfig = this.db.prepare(`
      DELETE FROM config WHERE key = @key
    `);

    this.statements.getConfigHistory = this.db.prepare(`
      SELECT key, value, timestamp FROM config_history 
      WHERE key = @key 
      ORDER BY timestamp DESC
    `);

    this.statements.insertConfigHistory = this.db.prepare(`
      INSERT INTO config_history (key, value, timestamp)
      VALUES (@key, @value, @timestamp)
    `);

    this.logger.info('Database statements prepared');
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('ConfigStore not initialized. Call initialize() first.');
    }
  }
}