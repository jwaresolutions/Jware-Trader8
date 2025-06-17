/**
 * Trade history storage
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { ITradeStore, DatabaseConfig, TradeFilter, PerformanceData, TradeStats } from '@jware-trader8/types';
import { Trade } from '@jware-trader8/types';
/**
 * Trade store implementation with SQLite backend
 */
export declare class TradeStore implements ITradeStore {
    private db;
    private config;
    private logger;
    private isInitialized;
    private statements;
    constructor(config: DatabaseConfig);
    /**
     * Initialize the database schema
     */
    initialize(): Promise<void>;
    /**
     * Save a trade record
     */
    saveTrade(trade: Trade): Promise<void>;
    /**
     * Get trades with optional filtering
     */
    getTrades(filter?: TradeFilter): Promise<Trade[]>;
    /**
     * Get performance data for timeframe
     */
    getPerformanceData(timeframe: string): Promise<PerformanceData>;
    /**
     * Delete trades older than specified date
     */
    deleteOldTrades(beforeDate: Date): Promise<number>;
    /**
     * Get trade statistics
     */
    getTradeStats(symbol?: string): Promise<TradeStats>;
    /**
     * Close database connection
     */
    close(): Promise<void>;
    /**
     * Private helper methods
     */
    private setupTables;
    private prepareStatements;
    private mapRowToTrade;
    private getStartDateForTimeframe;
    private ensureInitialized;
}
//# sourceMappingURL=trade-store.d.ts.map