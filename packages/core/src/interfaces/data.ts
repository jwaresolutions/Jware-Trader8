/**
 * Market data provider interface
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import {
  OHLCV,
  Quote,
  SymbolInfo,
  MarketDataRequest,
  MarketDataResponse,
  MarketDataSubscription,
  MarketDataEvent,
  Timeframe
} from '@jware-trader8/types';

/**
 * Market data provider interface for data integration
 */
export interface IDataProvider {
  /**
   * Get historical OHLCV data
   */
  getHistoricalData(
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date,
    options?: {
      limit?: number;
      includeExtendedHours?: boolean;
    }
  ): Promise<OHLCV[]>;

  /**
   * Get real-time quote data
   */
  getRealTimeQuote(symbol: string): Promise<Quote>;

  /**
   * Get symbol information
   */
  getSymbolInfo(symbol: string): Promise<SymbolInfo>;

  /**
   * Search for symbols
   */
  searchSymbols(query: string, limit?: number): Promise<SymbolInfo[]>;

  /**
   * Subscribe to real-time data
   */
  subscribe(
    symbols: string[],
    dataTypes: ('quotes' | 'trades' | 'bars')[],
    callback: (event: MarketDataEvent) => void
  ): Promise<MarketDataSubscription>;

  /**
   * Unsubscribe from real-time data
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Check if provider is connected
   */
  isConnected(): boolean;

  /**
   * Connect to data provider
   */
  connect(): Promise<void>;

  /**
   * Disconnect from data provider
   */
  disconnect(): Promise<void>;

  /**
   * Get provider capabilities
   */
  getCapabilities(): DataProviderCapabilities;
}

/**
 * Data provider capabilities
 */
export interface DataProviderCapabilities {
  /** Supported timeframes */
  timeframes: Timeframe[];
  /** Supported markets */
  markets: string[];
  /** Real-time data available */
  realTimeData: boolean;
  /** Historical data available */
  historicalData: boolean;
  /** Maximum history period in days */
  maxHistoryDays: number;
  /** Rate limits */
  rateLimit: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  /** Data delay in milliseconds */
  dataDelay: number;
  /** Supports extended hours data */
  extendedHours: boolean;
}

/**
 * Data provider configuration
 */
export interface DataProviderConfig {
  /** Provider name */
  name: string;
  /** API configuration */
  apiConfig: Record<string, any>;
  /** Cache settings */
  cache?: {
    enabled: boolean;
    ttlSeconds: number;
    maxSize: number;
  };
  /** Connection timeout */
  timeout?: number;
}

/**
 * Data provider factory interface
 */
export interface IDataProviderFactory {
  /**
   * Create a data provider instance
   */
  create(providerName: string, config: DataProviderConfig): IDataProvider;

  /**
   * List available data providers
   */
  getAvailableProviders(): string[];

  /**
   * Register a new data provider
   */
  registerProvider(name: string, providerClass: new (config: DataProviderConfig) => IDataProvider): void;
}

/**
 * Market data cache interface
 */
export interface IMarketDataCache {
  /**
   * Get cached data
   */
  get(key: string): Promise<any>;

  /**
   * Set cached data
   */
  set(key: string, data: any, ttlSeconds?: number): Promise<void>;

  /**
   * Check if key exists in cache
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete cached data
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cached data
   */
  clear(): Promise<void>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

/**
 * Real-time data handler interface
 */
export interface IRealTimeDataHandler {
  /**
   * Handle incoming market data event
   */
  handleEvent(event: MarketDataEvent): void;

  /**
   * Start handling real-time data
   */
  start(): Promise<void>;

  /**
   * Stop handling real-time data
   */
  stop(): Promise<void>;

  /**
   * Get handler status
   */
  getStatus(): 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'ERROR';
}

/**
 * Data normalization interface
 */
export interface IDataNormalizer {
  /**
   * Normalize OHLCV data from provider format
   */
  normalizeOHLCV(providerData: any, symbol: string): OHLCV[];

  /**
   * Normalize quote data from provider format
   */
  normalizeQuote(providerData: any, symbol: string): Quote;

  /**
   * Normalize symbol info from provider format
   */
  normalizeSymbolInfo(providerData: any): SymbolInfo;
}

/**
 * Data validation result
 */
export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cleanedData?: any;
}

/**
 * Data validator interface
 */
export interface IDataValidator {
  /**
   * Validate OHLCV data
   */
  validateOHLCV(data: OHLCV[]): DataValidationResult;

  /**
   * Validate quote data
   */
  validateQuote(data: Quote): DataValidationResult;

  /**
   * Validate symbol info
   */
  validateSymbolInfo(data: SymbolInfo): DataValidationResult;
}

/**
 * Market data aggregator interface
 */
export interface IMarketDataAggregator {
  /**
   * Aggregate OHLCV data to different timeframe
   */
  aggregateOHLCV(data: OHLCV[], targetTimeframe: Timeframe): OHLCV[];

  /**
   * Calculate volume weighted average price
   */
  calculateVWAP(data: OHLCV[]): number;

  /**
   * Resample data to specific intervals
   */
  resampleData(data: OHLCV[], interval: number): OHLCV[];
}

/**
 * Data feed status
 */
export interface DataFeedStatus {
  provider: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'CONNECTING';
  lastUpdate: Date;
  subscriptions: number;
  errorCount: number;
  latency: number; // milliseconds
}

/**
 * Multiple data provider manager
 */
export interface IMultiDataProvider {
  /**
   * Add a data provider
   */
  addProvider(name: string, provider: IDataProvider, priority: number): void;

  /**
   * Remove a data provider
   */
  removeProvider(name: string): void;

  /**
   * Get data with failover
   */
  getHistoricalDataWithFailover(
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date
  ): Promise<OHLCV[]>;

  /**
   * Get quote with failover
   */
  getQuoteWithFailover(symbol: string): Promise<Quote>;

  /**
   * Get status of all providers
   */
  getProviderStatuses(): DataFeedStatus[];
}