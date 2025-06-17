/**
 * Core trading provider interface
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import {
  Account,
  Order,
  Position,
  ConnectionResult,
  CancelResult,
  OrderSide,
  OrderType
} from '@jware-trader8/types';

/**
 * Core trading provider interface for broker integration
 */
export interface ITradingProvider {
  /**
   * Connect to the trading provider and verify authentication
   */
  connect(): Promise<ConnectionResult>;

  /**
   * Get current account information
   */
  getAccount(): Promise<Account>;

  /**
   * Place a buy order
   */
  placeBuyOrder(
    symbol: string,
    quantity: number,
    orderType: OrderType,
    price?: number
  ): Promise<Order>;

  /**
   * Place a sell order
   */
  placeSellOrder(
    symbol: string,
    quantity: number,
    orderType: OrderType,
    price?: number
  ): Promise<Order>;

  /**
   * Get current order status
   */
  getOrderStatus(orderId: string): Promise<Order>;

  /**
   * Cancel a pending order
   */
  cancelOrder(orderId: string): Promise<CancelResult>;

  /**
   * Get all current positions
   */
  getPositions(): Promise<Position[]>;

  /**
   * Get orders (with optional filtering)
   */
  getOrders(filter?: {
    status?: string;
    symbol?: string;
    limit?: number;
  }): Promise<Order[]>;

  /**
   * Close a position
   */
  closePosition(symbol: string, quantity?: number): Promise<Order>;

  /**
   * Get buying power available
   */
  getBuyingPower(): Promise<number>;

  /**
   * Check if market is open
   */
  isMarketOpen(symbol?: string): Promise<boolean>;

  /**
   * Disconnect from the provider
   */
  disconnect(): Promise<void>;
}

/**
 * Configuration interface for trading providers
 */
export interface TradingProviderConfig {
  /** Provider name */
  name: string;
  /** API configuration */
  apiConfig: Record<string, any>;
  /** Paper trading mode */
  paperTrading?: boolean;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Rate limiting settings */
  rateLimit?: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
}

/**
 * Trading provider factory interface
 */
export interface ITradingProviderFactory {
  /**
   * Create a trading provider instance
   */
  create(providerName: string, config: TradingProviderConfig): ITradingProvider;

  /**
   * List available trading providers
   */
  getAvailableProviders(): string[];

  /**
   * Register a new trading provider
   */
  registerProvider(name: string, providerClass: new (config: TradingProviderConfig) => ITradingProvider): void;
}

/**
 * Order validation result
 */
export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Trading session configuration
 */
export interface TradingSessionConfig {
  /** Maximum concurrent positions */
  maxPositions: number;
  /** Default position size */
  defaultPositionSize: number;
  /** Risk management settings */
  riskManagement: {
    maxDrawdown: number;
    dailyLossLimit: number;
    stopOnLossLimit: boolean;
  };
  /** Auto-trading enabled */
  autoTrading: boolean;
}

/**
 * Trading session interface
 */
export interface ITradingSession {
  /** Session ID */
  id: string;
  /** Session status */
  status: 'INACTIVE' | 'ACTIVE' | 'PAUSED' | 'ERROR';
  /** Start the trading session */
  start(): Promise<void>;
  /** Stop the trading session */
  stop(): Promise<void>;
  /** Pause the trading session */
  pause(): Promise<void>;
  /** Resume the trading session */
  resume(): Promise<void>;
  /** Get session statistics */
  getStatistics(): Promise<TradingSessionStatistics>;
}

/**
 * Trading session statistics
 */
export interface TradingSessionStatistics {
  startTime: Date;
  uptime: number; // milliseconds
  totalTrades: number;
  profitableTrades: number;
  totalPnL: number;
  currentDrawdown: number;
  maxDrawdown: number;
  activePositions: number;
  lastTradeTime?: Date;
}

/**
 * Order execution context
 */
export interface OrderExecutionContext {
  symbol: string;
  side: OrderSide;
  quantity: number;
  orderType: OrderType;
  price?: number;
  stopPrice?: number;
  strategyName?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Portfolio summary interface
 */
export interface PortfolioSummary {
  totalValue: number;
  cash: number;
  equity: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalReturn: number;
  activePositions: Position[];
  pendingOrders: Order[];
}

/**
 * Risk check result
 */
export interface RiskCheckResult {
  approved: boolean;
  reasons: string[];
  maxAllowedQuantity?: number;
  suggestedQuantity?: number;
}

/**
 * Trading provider capabilities
 */
export interface TradingProviderCapabilities {
  /** Supported order types */
  orderTypes: OrderType[];
  /** Supported markets */
  markets: string[];
  /** Real-time data available */
  realTimeData: boolean;
  /** Paper trading supported */
  paperTrading: boolean;
  /** Fractional shares supported */
  fractionalShares: boolean;
  /** Extended hours trading */
  extendedHours: boolean;
  /** Minimum order quantities by market */
  minOrderQuantities: Record<string, number>;
  /** Maximum order quantities by market */
  maxOrderQuantities: Record<string, number>;
}