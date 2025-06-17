/**
 * Mock trading provider implementation for testing
 */
import { Account, Order, Position, ConnectionResult, CancelResult, OrderType } from '@jware-trader8/types';
import { ITradingProvider, TradingProviderConfig } from '../interfaces/trading';
/**
 * Mock trading provider for testing and development
 */
export declare class MockTradingProvider implements ITradingProvider {
    private isConnected;
    private mockAccount;
    private mockOrders;
    private mockPositions;
    private config;
    constructor(config: TradingProviderConfig);
    connect(): Promise<ConnectionResult>;
    getAccount(): Promise<Account>;
    placeBuyOrder(symbol: string, quantity: number, orderType: OrderType, price?: number): Promise<Order>;
    placeSellOrder(symbol: string, quantity: number, orderType: OrderType, price?: number): Promise<Order>;
    getOrderStatus(orderId: string): Promise<Order>;
    cancelOrder(orderId: string): Promise<CancelResult>;
    getPositions(): Promise<Position[]>;
    getOrders(filter?: {
        status?: string;
        symbol?: string;
        limit?: number;
    }): Promise<Order[]>;
    closePosition(symbol: string, quantity?: number): Promise<Order>;
    getBuyingPower(): Promise<number>;
    isMarketOpen(symbol?: string): Promise<boolean>;
    disconnect(): Promise<void>;
    /**
     * Get mock price for symbol (for testing)
     */
    private getMockPrice;
    /**
     * Update position for symbol
     */
    private updatePosition;
    /**
     * Simulate market price movements (for testing)
     */
    simulateMarketMovement(): void;
    /**
     * Set mock account balance (for testing)
     */
    setMockBalance(balance: number, buyingPower?: number): void;
    /**
     * Add mock position (for testing)
     */
    addMockPosition(symbol: string, quantity: number, averagePrice: number): void;
}
//# sourceMappingURL=mock-trading-provider.d.ts.map