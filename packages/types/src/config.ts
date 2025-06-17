/**
 * Configuration interfaces and types for Jware-Trader8
 */

/**
 * API key pair for provider authentication
 */
export interface ApiKeyPair {
  /** API key */
  apiKey: string;
  /** Secret key */
  secretKey: string;
}

/**
 * Alpaca trading provider configuration
 */
export interface AlpacaConfig {
  /** Alpaca API key */
  apiKey: string;
  /** Alpaca secret key */
  secretKey: string;
  /** Base URL (paper or live trading) */
  baseUrl: string;
  /** Paper trading flag */
  paperTrading?: boolean;
  /** API version */
  apiVersion?: string;
}

/**
 * Polygon data provider configuration
 */
export interface PolygonConfig {
  /** Polygon API key */
  apiKey: string;
  /** Base URL */
  baseUrl?: string;
  /** API version */
  apiVersion?: string;
  /** Rate limit settings */
  rateLimit?: {
    /** Requests per minute */
    requestsPerMinute: number;
    /** Requests per day */
    requestsPerDay: number;
  };
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /** Database file path */
  path: string;
  /** Encryption key for sensitive data */
  encryptionKey: string;
  /** Enable WAL mode */
  enableWAL?: boolean;
  /** Connection timeout */
  timeout?: number;
  /** Maximum connections */
  maxConnections?: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Log file path */
  filePath?: string;
  /** Maximum log file size in MB */
  maxFileSize?: number;
  /** Number of log files to keep */
  maxFiles?: number;
  /** Enable console logging */
  console?: boolean;
  /** Log format */
  format?: 'json' | 'text';
}

/**
 * Trading configuration
 */
export interface TradingConfig {
  /** Default position size as percentage of capital */
  defaultPositionSize: number;
  /** Maximum number of concurrent positions */
  maxPositions: number;
  /** Default commission rate */
  commission: number;
  /** Default slippage rate */
  slippage: number;
  /** Minimum time between trades in minutes */
  minTimeBetweenTrades: number;
  /** Enable paper trading mode */
  paperTrading: boolean;
  /** Risk management settings */
  riskManagement: {
    /** Maximum drawdown percentage */
    maxDrawdown: number;
    /** Daily loss limit */
    dailyLossLimit: number;
    /** Stop trading on loss limit */
    stopOnLossLimit: boolean;
  };
}

/**
 * Backtesting configuration
 */
export interface BacktestConfig {
  /** Initial capital */
  initialCapital: number;
  /** Position size strategy */
  positionSizing: 'FIXED' | 'PERCENTAGE' | 'KELLY' | 'RISK_BASED';
  /** Position size value */
  positionSize: number;
  /** Commission per trade */
  commission: number;
  /** Slippage percentage */
  slippage: number;
  /** Include extended hours */
  includeExtendedHours: boolean;
  /** Benchmark symbol for comparison */
  benchmark?: string;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache directory path */
  directory: string;
  /** Default TTL in seconds */
  defaultTTL: number;
  /** Maximum cache size in MB */
  maxSize: number;
  /** Enable cache compression */
  compression: boolean;
  /** Cache cleanup interval in minutes */
  cleanupInterval: number;
}

/**
 * Application configuration
 */
export interface AppConfig {
  /** Application environment */
  environment: 'development' | 'staging' | 'production';
  /** Server port */
  port?: number;
  /** Server host */
  host?: string;
  /** Trading configuration */
  trading: TradingConfig;
  /** Database configuration */
  database: DatabaseConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Cache configuration */
  cache: CacheConfig;
  /** Provider configurations */
  providers: {
    /** Alpaca configuration */
    alpaca?: AlpacaConfig;
    /** Polygon configuration */
    polygon?: PolygonConfig;
  };
  /** Feature flags */
  features?: {
    /** Enable real-time data */
    realTimeData?: boolean;
    /** Enable paper trading */
    paperTrading?: boolean;
    /** Enable strategy backtesting */
    backtesting?: boolean;
    /** Enable API endpoints */
    api?: boolean;
  };
}

/**
 * Configuration store interface
 */
export interface IConfigStore {
  /** Set API key for a provider */
  setApiKey(provider: string, apiKey: string, secretKey: string): Promise<void>;
  
  /** Get API key for a provider */
  getApiKey(provider: string): Promise<ApiKeyPair>;
  
  /** Set configuration value */
  setConfig(key: string, value: any): Promise<void>;
  
  /** Get configuration value */
  getConfig(key: string): Promise<any>;
  
  /** List all configuration keys */
  listConfigs(): Promise<string[]>;
  
  /** Delete configuration value */
  deleteConfig(key: string): Promise<void>;
  
  /** Get configuration history */
  getConfigHistory(key: string): Promise<ConfigHistoryEntry[]>;
}

/**
 * Configuration history entry
 */
export interface ConfigHistoryEntry {
  /** Configuration key */
  key: string;
  /** Configuration value */
  value: any;
  /** Timestamp when set */
  timestamp: Date;
  /** User/system that made the change */
  changedBy?: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether configuration is valid */
  isValid: boolean;
  /** Validation errors */
  errors: ConfigValidationError[];
  /** Validation warnings */
  warnings: ConfigValidationWarning[];
}

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  /** Configuration key with error */
  key: string;
  /** Error message */
  message: string;
  /** Error code */
  code: string;
}

/**
 * Configuration validation warning
 */
export interface ConfigValidationWarning {
  /** Configuration key with warning */
  key: string;
  /** Warning message */
  message: string;
  /** Warning code */
  code: string;
}

/**
 * Environment variables interface
 */
export interface EnvironmentVariables {
  /** Node environment */
  NODE_ENV?: string;
  /** Database encryption key */
  DB_ENCRYPTION_KEY?: string;
  /** Alpaca API key */
  ALPACA_API_KEY?: string;
  /** Alpaca secret key */
  ALPACA_SECRET_KEY?: string;
  /** Polygon API key */
  POLYGON_API_KEY?: string;
  /** Log level */
  LOG_LEVEL?: string;
  /** Application port */
  PORT?: string;
}

/**
 * Trade store interface for persistence
 */
export interface ITradeStore {
  /** Save a trade record */
  saveTrade(trade: any): Promise<void>;
  
  /** Get trades with optional filtering */
  getTrades(filter?: TradeFilter): Promise<any[]>;
  
  /** Get performance data for timeframe */
  getPerformanceData(timeframe: string): Promise<PerformanceData>;
  
  /** Delete trades older than specified date */
  deleteOldTrades(beforeDate: Date): Promise<number>;
  
  /** Get trade statistics */
  getTradeStats(symbol?: string): Promise<TradeStats>;
}

/**
 * Trade filter for querying
 */
export interface TradeFilter {
  /** Filter by symbol */
  symbol?: string;
  /** Filter by strategy name */
  strategyName?: string;
  /** Start date filter */
  startDate?: Date;
  /** End date filter */
  endDate?: Date;
  /** Maximum number of results */
  limit?: number;
  /** Sort order */
  sortBy?: 'entryTime' | 'exitTime' | 'pnl';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Performance data aggregation
 */
export interface PerformanceData {
  /** Summary statistics */
  summary: {
    totalTrades: number;
    winningTrades: number;
    totalPnl: number;
    avgPnl: number;
    bestTrade: number;
    worstTrade: number;
  };
  /** Daily P&L data */
  dailyPnl: Array<{
    date: string;
    dailyPnl: number;
  }>;
  /** Win rate percentage */
  winRate: number;
}

/**
 * Trade statistics
 */
export interface TradeStats {
  /** Total number of trades */
  totalTrades: number;
  /** Number of winning trades */
  winningTrades: number;
  /** Number of losing trades */
  losingTrades: number;
  /** Total profit/loss */
  totalPnl: number;
  /** Average trade return */
  averageReturn: number;
  /** Best single trade */
  bestTrade: number;
  /** Worst single trade */
  worstTrade: number;
  /** Win rate percentage */
  winRate: number;
  /** Profit factor */
  profitFactor: number;
}