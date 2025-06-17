/**
 * Configuration storage with encryption
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { IConfigStore, DatabaseConfig, ApiKeyPair, ConfigHistoryEntry } from '@jware-trader8/types';
/**
 * Configuration store implementation with SQLite backend
 */
export declare class ConfigStore implements IConfigStore {
    private db;
    private config;
    private encryptionKey;
    private logger;
    private isInitialized;
    private statements;
    constructor(config: DatabaseConfig);
    /**
     * Initialize the database schema
     */
    initialize(): Promise<void>;
    /**
     * Set API key for a provider
     */
    setApiKey(provider: string, apiKey: string, secretKey: string): Promise<void>;
    /**
     * Get API key for a provider
     */
    getApiKey(provider: string): Promise<ApiKeyPair>;
    /**
     * Set configuration value
     */
    setConfig(key: string, value: any): Promise<void>;
    /**
     * Get configuration value
     */
    getConfig(key: string): Promise<any>;
    /**
     * List all configuration keys
     */
    listConfigs(): Promise<string[]>;
    /**
     * Delete configuration value
     */
    deleteConfig(key: string): Promise<void>;
    /**
     * Get configuration history
     */
    getConfigHistory(key: string): Promise<ConfigHistoryEntry[]>;
    /**
     * Close database connection
     */
    close(): Promise<void>;
    /**
     * Test methods for debugging (should be private in production)
     */
    getRawApiKey(provider: string): any;
    corruptConfigValue(key: string, corruptValue: string): void;
    /**
     * Private helper methods
     */
    private setupTables;
    private prepareStatements;
    private ensureInitialized;
}
//# sourceMappingURL=config-store.d.ts.map