/**
 * Relative Strength Index (RSI) Indicator
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { BaseIndicator } from './base-indicator';
/**
 * Relative Strength Index implementation
 * Measures the magnitude of recent price changes to evaluate overbought/oversold conditions
 */
export declare class RelativeStrengthIndex extends BaseIndicator {
    private gains;
    private losses;
    private lastPrice;
    private priceCount;
    constructor(period?: number);
    /**
     * Calculate RSI value
     * RSI = 100 - (100 / (1 + RS))
     * RS = Average Gain / Average Loss
     */
    protected calculate(newPrice: number): number | null;
    /**
     * Check if RSI is ready (has enough price changes)
     */
    isReady(): boolean;
    /**
     * Reset RSI state
     */
    reset(): void;
    /**
     * Get current gains array
     */
    getGains(): number[];
    /**
     * Get current losses array
     */
    getLosses(): number[];
    /**
     * Get average gain
     */
    getAverageGain(): number | null;
    /**
     * Get average loss
     */
    getAverageLoss(): number | null;
    /**
     * Get relative strength (RS) value
     */
    getRelativeStrength(): number | null;
}
//# sourceMappingURL=relative-strength-index.d.ts.map