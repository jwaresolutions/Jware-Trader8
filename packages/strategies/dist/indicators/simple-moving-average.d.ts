/**
 * Simple Moving Average (SMA) Indicator
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { BaseIndicator } from './base-indicator';
/**
 * Simple Moving Average implementation
 * Calculates the arithmetic mean of prices over a specified period
 */
export declare class SimpleMovingAverage extends BaseIndicator {
    private prices;
    constructor(period: number);
    /**
     * Calculate SMA value
     */
    protected calculate(newPrice: number): number | null;
    /**
     * Check if SMA is ready (has enough data points)
     */
    isReady(): boolean;
    /**
     * Reset SMA state
     */
    reset(): void;
    /**
     * Get current period setting
     */
    getPeriod(): number;
    /**
     * Get current price buffer
     */
    getPrices(): number[];
}
//# sourceMappingURL=simple-moving-average.d.ts.map