/**
 * Core trading interfaces and types for Jware-Trader8
 */
/**
 * Order side enumeration
 */
export type OrderSide = 'BUY' | 'SELL';
/**
 * Order type enumeration
 */
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
/**
 * Order status enumeration
 */
export type OrderStatus = 'PENDING' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED';
/**
 * Position side enumeration
 */
export type PositionSide = 'LONG' | 'SHORT';
/**
 * Trading account information
 */
export interface Account {
    /** Unique account identifier */
    id: string;
    /** Total account balance */
    balance: number;
    /** Available buying power */
    buyingPower: number;
    /** Current positions */
    positions: Position[];
    /** Account currency */
    currency?: string;
    /** Account type (CASH, MARGIN) */
    accountType?: string;
    /** Last updated timestamp */
    updatedAt?: Date;
}
/**
 * Trading order representation
 */
export interface Order {
    /** Unique order identifier */
    id: string;
    /** Trading symbol */
    symbol: string;
    /** Order side (BUY/SELL) */
    side: OrderSide;
    /** Order quantity */
    quantity: number;
    /** Order price (for limit orders) */
    price?: number;
    /** Stop price (for stop orders) */
    stopPrice?: number;
    /** Order type */
    type: OrderType;
    /** Current order status */
    status: OrderStatus;
    /** Order creation timestamp */
    timestamp: Date;
    /** Order filled quantity */
    filledQuantity?: number;
    /** Average fill price */
    averagePrice?: number;
    /** Commission paid */
    commission?: number;
    /** Order expiration time */
    expiresAt?: Date;
    /** Client order ID */
    clientOrderId?: string;
}
/**
 * Trading position representation
 */
export interface Position {
    /** Trading symbol */
    symbol: string;
    /** Position quantity (positive for long, negative for short) */
    quantity: number;
    /** Average entry price */
    averagePrice: number;
    /** Current market price */
    currentPrice?: number;
    /** Position side */
    side: PositionSide;
    /** Unrealized P&L */
    unrealizedPnL?: number;
    /** Realized P&L */
    realizedPnL?: number;
    /** Position entry timestamp */
    entryTime: Date;
    /** Last update timestamp */
    updatedAt?: Date;
}
/**
 * Trade execution record
 */
export interface Trade {
    /** Unique trade identifier */
    id: string;
    /** Trading symbol */
    symbol: string;
    /** Trade side */
    side: OrderSide;
    /** Trade quantity */
    quantity: number;
    /** Entry price */
    entryPrice: number;
    /** Exit price */
    exitPrice?: number;
    /** Entry timestamp */
    entryTime: Date;
    /** Exit timestamp */
    exitTime?: Date;
    /** Profit/Loss */
    pnl?: number;
    /** Commission paid */
    commission: number;
    /** Entry reason/signal */
    entryReason?: string;
    /** Exit reason/signal */
    exitReason?: string;
    /** Strategy name that generated the trade */
    strategyName?: string;
    /** Trade status */
    status: 'OPEN' | 'CLOSED';
}
/**
 * Connection result for trading providers
 */
export interface ConnectionResult {
    /** Connection success status */
    success: boolean;
    /** Account information if successful */
    accountInfo?: Account;
    /** Error message if failed */
    error?: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
}
/**
 * Order cancellation result
 */
export interface CancelResult {
    /** Cancellation success status */
    success: boolean;
    /** Order ID that was cancelled */
    orderId: string;
    /** Error message if failed */
    error?: string;
}
//# sourceMappingURL=trading.d.ts.map