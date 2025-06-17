/**
 * Portfolio management for backtesting
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { IPortfolio, PortfolioConfig, PortfolioSnapshot, Position, Trade } from '@jware-trader8/types';
/**
 * Portfolio implementation for backtesting
 */
export declare class Portfolio implements IPortfolio {
    private config;
    private cash;
    private positions;
    private tradeHistory;
    private logger;
    private realizedPnL;
    constructor(config: PortfolioConfig);
    /**
     * Get current cash balance
     */
    getCash(): number;
    /**
     * Get current positions
     */
    getPositions(): Map<string, Position>;
    /**
     * Get portfolio configuration
     */
    getConfig(): PortfolioConfig;
    /**
     * Get total portfolio value
     */
    getTotalValue(currentPrices: Map<string, number>): number;
    /**
     * Check if can buy given symbol/quantity
     */
    canBuy(symbol: string, price: number, quantity: number): boolean;
    /**
     * Check if has position in symbol
     */
    hasPosition(symbol: string): boolean;
    /**
     * Open a new position
     */
    openPosition(symbol: string, price: number, quantity: number, timestamp: Date): Trade;
    /**
     * Close an existing position
     */
    closePosition(symbol: string, price: number, timestamp: Date): Trade;
    /**
     * Apply risk management rules
     */
    applyRiskManagement(currentPrices: Map<string, number>, timestamp: Date): Trade[];
    /**
     * Get portfolio snapshot
     */
    getSnapshot(currentPrices: Map<string, number>, timestamp: Date): PortfolioSnapshot;
    /**
     * Calculate commission for order value
     */
    private calculateCommission;
    /**
     * Get trade history
     */
    getTradeHistory(): Trade[];
    /**
     * Get realized P&L
     */
    getRealizedPnL(): number;
    /**
     * Get unrealized P&L for current prices
     */
    getUnrealizedPnL(currentPrices: Map<string, number>): number;
}
//# sourceMappingURL=portfolio.d.ts.map