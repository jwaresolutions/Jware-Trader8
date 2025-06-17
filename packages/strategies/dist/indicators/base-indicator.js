"use strict";
/**
 * Base Technical Indicator Class
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseIndicator = void 0;
/**
 * Abstract base class for all technical indicators
 */
class BaseIndicator {
    values = [];
    period;
    maxHistory;
    config;
    constructor(period, name, type, source = 'close') {
        this.period = period;
        this.maxHistory = 1000; // Default max history length
        this.config = {
            name,
            type,
            parameters: { period },
            source
        };
    }
    /**
     * Get indicator name
     */
    get name() {
        return this.config.name;
    }
    /**
     * Update indicator with new market data
     */
    update(data) {
        const sourceValue = this.getSourceValue(data);
        const newValue = this.calculate(sourceValue);
        this.values.push(newValue);
        // Limit history to prevent memory issues
        if (this.values.length > this.maxHistory) {
            this.values.shift();
        }
    }
    /**
     * Get current indicator value (0 = current, 1 = previous, etc.)
     */
    getValue(index = 0) {
        if (index >= this.values.length) {
            return null;
        }
        return this.values[this.values.length - 1 - index];
    }
    /**
     * Reset indicator state
     */
    reset() {
        this.values = [];
    }
    /**
     * Get indicator configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get all historical values
     */
    getHistory() {
        return [...this.values];
    }
    /**
     * Extract the source value from OHLCV data
     */
    getSourceValue(data) {
        switch (this.config.source) {
            case 'open':
                return data.open;
            case 'high':
                return data.high;
            case 'low':
                return data.low;
            case 'close':
                return data.close;
            case 'volume':
                return data.volume;
            default:
                return data.close;
        }
    }
    /**
     * Get the count of non-null values
     */
    getValidValueCount() {
        return this.values.filter(v => v !== null).length;
    }
}
exports.BaseIndicator = BaseIndicator;
