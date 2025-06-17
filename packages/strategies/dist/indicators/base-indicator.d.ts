/**
 * Base Technical Indicator Class
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { IIndicator, IndicatorConfig } from '@jware-trader8/core';
import { OHLCV } from '@jware-trader8/types';
/**
 * Abstract base class for all technical indicators
 */
export declare abstract class BaseIndicator implements IIndicator {
    protected values: (number | null)[];
    protected period: number;
    protected maxHistory: number;
    protected config: IndicatorConfig;
    constructor(period: number, name: string, type: string, source?: 'open' | 'high' | 'low' | 'close' | 'volume');
    /**
     * Get indicator name
     */
    get name(): string;
    /**
     * Update indicator with new market data
     */
    update(data: OHLCV): void;
    /**
     * Get current indicator value (0 = current, 1 = previous, etc.)
     */
    getValue(index?: number): number | null;
    /**
     * Check if indicator has enough data to produce valid values
     */
    abstract isReady(): boolean;
    /**
     * Reset indicator state
     */
    reset(): void;
    /**
     * Get indicator configuration
     */
    getConfig(): IndicatorConfig;
    /**
     * Get all historical values
     */
    getHistory(): (number | null)[];
    /**
     * Abstract method to calculate indicator value
     */
    protected abstract calculate(newValue: number): number | null;
    /**
     * Extract the source value from OHLCV data
     */
    protected getSourceValue(data: OHLCV): number;
    /**
     * Get the count of non-null values
     */
    protected getValidValueCount(): number;
}
//# sourceMappingURL=base-indicator.d.ts.map