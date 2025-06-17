/**
 * Jware-Trader8 Database Package
 * 
 * Database layer for configuration and trade storage.
 */

// Export stores
export { ConfigStore } from './stores/config-store';
export { TradeStore } from './stores/trade-store';

// Export migrations (to be implemented)
// export { DatabaseMigrations } from './migrations/schema';

// Export interfaces
export type { IConfigStore, ITradeStore } from '@jware-trader8/types';