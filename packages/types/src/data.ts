/**
 * Market data interfaces and types for Jware-Trader8
 */

import { Trade } from './trading';

/**
 * OHLCV (Open, High, Low, Close, Volume) data structure
 */
export interface OHLCV {
  /** Data timestamp */
  timestamp: Date;
  /** Opening price */
  open: number;
  /** Highest price */
  high: number;
  /** Lowest price */
  low: number;
  /** Closing price */
  close: number;
  /** Trading volume */
  volume: number;
  /** Volume weighted average price */
  vwap?: number;
  /** Number of trades */
  tradeCount?: number;
}

/**
 * Real-time quote data
 */
export interface Quote {
  /** Trading symbol */
  symbol: string;
  /** Bid price */
  bid: number;
  /** Ask price */
  ask: number;
  /** Last trade price */
  last: number;
  /** Bid size */
  bidSize?: number;
  /** Ask size */
  askSize?: number;
  /** Last trade size */
  lastSize?: number;
  /** Quote timestamp */
  timestamp: Date;
  /** Bid-ask spread */
  spread?: number;
}

/**
 * Market data aggregation timeframes
 */
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

/**
 * Symbol information
 */
export interface SymbolInfo {
  /** Trading symbol */
  symbol: string;
  /** Full name of the asset */
  name: string;
  /** Asset type (stock, crypto, forex, etc.) */
  type: 'STOCK' | 'CRYPTO' | 'FOREX' | 'COMMODITY' | 'INDEX';
  /** Exchange where the symbol is traded */
  exchange: string;
  /** Currency denomination */
  currency: string;
  /** Minimum tick size */
  tickSize: number;
  /** Minimum order quantity */
  minQuantity: number;
  /** Maximum order quantity */
  maxQuantity?: number;
  /** Whether the symbol is tradeable */
  tradeable: boolean;
  /** Market hours */
  marketHours?: MarketHours;
  /** Symbol description */
  description?: string;
}

/**
 * Market hours information
 */
export interface MarketHours {
  /** Market open time (UTC) */
  open: string;
  /** Market close time (UTC) */
  close: string;
  /** Days of the week market is open */
  daysOfWeek: number[];
  /** Timezone */
  timezone: string;
  /** Whether the market is currently open */
  isOpen?: boolean;
}

/**
 * Market data request parameters
 */
export interface MarketDataRequest {
  /** Trading symbol */
  symbol: string;
  /** Data timeframe */
  timeframe: Timeframe;
  /** Start date */
  startDate: Date;
  /** End date */
  endDate: Date;
  /** Maximum number of data points */
  limit?: number;
  /** Include extended hours data */
  includeExtendedHours?: boolean;
}

/**
 * Market data response
 */
export interface MarketDataResponse {
  /** Trading symbol */
  symbol: string;
  /** Data timeframe */
  timeframe: Timeframe;
  /** OHLCV data array */
  data: OHLCV[];
  /** Request metadata */
  metadata: {
    /** Total data points */
    count: number;
    /** Data source */
    source: string;
    /** Request timestamp */
    requestTime: Date;
    /** Cache hit indicator */
    cached?: boolean;
  };
}

/**
 * Real-time market data subscription
 */
export interface MarketDataSubscription {
  /** Subscription ID */
  id: string;
  /** Subscribed symbols */
  symbols: string[];
  /** Data types to subscribe to */
  dataTypes: ('quotes' | 'trades' | 'bars')[];
  /** Subscription status */
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  /** Error message if status is ERROR */
  error?: string;
  /** Subscription timestamp */
  timestamp: Date;
}

/**
 * Market data event
 */
export interface MarketDataEvent {
  /** Event type */
  type: 'QUOTE' | 'TRADE' | 'BAR';
  /** Trading symbol */
  symbol: string;
  /** Event data */
  data: Quote | Trade | OHLCV;
  /** Event timestamp */
  timestamp: Date;
}