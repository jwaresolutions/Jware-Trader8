/**
 * Alpaca Trading Provider Implementation
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { ITradingProvider, TradingProviderConfig } from '@jware-trader8/core';
import { Account, Order, Position, ConnectionResult, CancelResult, OrderType } from '@jware-trader8/types';
/**
 * Alpaca-specific configuration
 */
export interface AlpacaConfig {
    apiKey: string;
    secretKey: string;
    baseUrl: string;
    paperTrading: boolean;
}
/**
 * Alpaca Trading Provider
 * Implements ITradingProvider for Alpaca Markets integration
 */
export declare class AlpacaTradingProvider implements ITradingProvider {
    private alpacaClient;
    private config;
    private logger;
    private isConnected;
    constructor(config: TradingProviderConfig);
    /**
     * Connect to Alpaca and verify authentication
     */
    connect(): Promise<ConnectionResult>;
    /**
     * Get current account information
     */
    getAccount(): Promise<Account>;
    /**
     * Place a buy order
     */
    placeBuyOrder(symbol: string, quantity: number, orderType: OrderType, price?: number): Promise<Order>;
    /**
     * Place a sell order
     */
    placeSellOrder(symbol: string, quantity: number, orderType: OrderType, price?: number): Promise<Order>;
    /**
     * Get order status
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
     * Get orders with optional filtering
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
    /**
     * Get provider configuration
     */
    getConfig(): TradingProviderConfig;
    /**
     * Check if provider is connected
     */
    isProviderConnected(): boolean;
    /**
     * Private helper methods
     */
    /**
     * Normalize Alpaca account data to standard Account interface
     */
    private normalizeAccount;
    /**
     * Normalize Alpaca order data to standard Order interface
     */
    private normalizeOrder;
    /**
     * Normalize Alpaca position data to standard Position interface
     */
    private normalizePosition;
    /**
     * Build order parameters for Alpaca API
     */
    private buildOrderParams;
    /**
     * Normalize Alpaca order type to standard OrderType
     */
    private normalizeOrderType;
    /**
     * Normalize Alpaca order status to standard OrderStatus
     */
    private normalizeOrderStatus;
    /**
     * Retry mechanism with exponential backoff for rate limiting
     */
    private retryWithBackoff;
}
//# sourceMappingURL=alpaca-provider.d.ts.map