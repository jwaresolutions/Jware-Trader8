/**
 * Providers package exports
 * Trading and data provider implementations
 */

// Alpaca Trading Provider
export { AlpacaTradingProvider } from './alpaca/alpaca-provider';
export type { AlpacaConfig } from './alpaca/alpaca-provider';

// Provider factory (will be implemented)
// export { ProviderFactory } from './factory/provider-factory';

// Polygon Data Provider (will be implemented)
// export { PolygonDataProvider } from './polygon/polygon-data-provider';

// Re-export core interfaces for convenience
export type {
  ITradingProvider,
  TradingProviderConfig,
  IDataProvider,
  DataProviderConfig
} from '@jware-trader8/core';