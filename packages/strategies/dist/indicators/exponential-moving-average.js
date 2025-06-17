"use strict";
/**
 * Exponential Moving Average (EMA) Indicator
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExponentialMovingAverage = void 0;
const base_indicator_1 = require("./base-indicator");
/**
 * Exponential Moving Average implementation
 * Gives more weight to recent prices with exponential decay
 */
class ExponentialMovingAverage extends base_indicator_1.BaseIndicator {
    smoothingFactor;
    previousEMA = null;
    isInitialized = false;
    constructor(period) {
        super(period, 'EMA', 'EMA');
        // Calculate smoothing factor: 2 / (period + 1)
        this.smoothingFactor = 2 / (period + 1);
    }
    /**
     * Calculate EMA value
     * EMA = (Price * smoothingFactor) + (Previous EMA * (1 - smoothingFactor))
     */
    calculate(newPrice) {
        if (!this.isInitialized) {
            // First value becomes the initial EMA
            this.previousEMA = newPrice;
            this.isInitialized = true;
            return newPrice;
        }
        // Calculate EMA using the formula
        const ema = (newPrice * this.smoothingFactor) + (this.previousEMA * (1 - this.smoothingFactor));
        this.previousEMA = ema;
        return ema;
    }
    /**
     * Check if EMA is ready (initialized with at least one value)
     */
    isReady() {
        return this.isInitialized;
    }
    /**
     * Reset EMA state
     */
    reset() {
        super.reset();
        this.previousEMA = null;
        this.isInitialized = false;
    }
    /**
     * Get smoothing factor
     */
    getSmoothingFactor() {
        return this.smoothingFactor;
    }
    /**
     * Get previous EMA value
     */
    getPreviousEMA() {
        return this.previousEMA;
    }
}
exports.ExponentialMovingAverage = ExponentialMovingAverage;
