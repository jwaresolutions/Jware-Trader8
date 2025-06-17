/**
 * Exponential Moving Average (EMA) Indicator
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { BaseIndicator } from './base-indicator';
/**
 * Exponential Moving Average implementation
 * Gives more weight to recent prices with exponential decay
 */
export declare class ExponentialMovingAverage extends BaseIndicator {
    private smoothingFactor;
    private previousEMA;
    private isInitialized;
    constructor(period: number);
    /**
     * Calculate EMA value
     * EMA = (Price * smoothingFactor) + (Previous EMA * (1 - smoothingFactor))
     */
    protected calculate(newPrice: number): number | null;
    /**
     * Check if EMA is ready (initialized with at least one value)
     */
    isReady(): boolean;
    /**
     * Reset EMA state
     */
    reset(): void;
    /**
     * Get smoothing factor
     */
    getSmoothingFactor(): number;
    /**
     * Get previous EMA value
     */
    getPreviousEMA(): number | null;
}
//# sourceMappingURL=exponential-moving-average.d.ts.map