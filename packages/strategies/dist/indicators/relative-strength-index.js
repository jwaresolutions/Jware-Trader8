"use strict";
/**
 * Relative Strength Index (RSI) Indicator
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelativeStrengthIndex = void 0;
const base_indicator_1 = require("./base-indicator");
/**
 * Relative Strength Index implementation
 * Measures the magnitude of recent price changes to evaluate overbought/oversold conditions
 */
class RelativeStrengthIndex extends base_indicator_1.BaseIndicator {
    gains = [];
    losses = [];
    lastPrice = null;
    priceCount = 0;
    constructor(period = 14) {
        super(period, 'RSI', 'RSI');
    }
    /**
     * Calculate RSI value
     * RSI = 100 - (100 / (1 + RS))
     * RS = Average Gain / Average Loss
     */
    calculate(newPrice) {
        this.priceCount++;
        if (this.lastPrice === null) {
            // First price, no change to calculate
            this.lastPrice = newPrice;
            return null;
        }
        // Calculate price change
        const change = newPrice - this.lastPrice;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? Math.abs(change) : 0;
        this.gains.push(gain);
        this.losses.push(loss);
        // Keep only the required number of periods
        if (this.gains.length > this.period) {
            this.gains.shift();
            this.losses.shift();
        }
        this.lastPrice = newPrice;
        // Need at least 'period' number of changes to calculate RSI
        if (this.gains.length < this.period) {
            return null;
        }
        // Calculate average gain and average loss
        const avgGain = this.gains.reduce((sum, gain) => sum + gain, 0) / this.period;
        const avgLoss = this.losses.reduce((sum, loss) => sum + loss, 0) / this.period;
        // Handle division by zero
        if (avgLoss === 0) {
            return 100; // All gains, no losses
        }
        // Calculate relative strength and RSI
        const relativeStrength = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + relativeStrength));
        return rsi;
    }
    /**
     * Check if RSI is ready (has enough price changes)
     */
    isReady() {
        return this.gains.length >= this.period && this.getValue() !== null;
    }
    /**
     * Reset RSI state
     */
    reset() {
        super.reset();
        this.gains = [];
        this.losses = [];
        this.lastPrice = null;
        this.priceCount = 0;
    }
    /**
     * Get current gains array
     */
    getGains() {
        return [...this.gains];
    }
    /**
     * Get current losses array
     */
    getLosses() {
        return [...this.losses];
    }
    /**
     * Get average gain
     */
    getAverageGain() {
        if (this.gains.length < this.period) {
            return null;
        }
        return this.gains.reduce((sum, gain) => sum + gain, 0) / this.period;
    }
    /**
     * Get average loss
     */
    getAverageLoss() {
        if (this.losses.length < this.period) {
            return null;
        }
        return this.losses.reduce((sum, loss) => sum + loss, 0) / this.period;
    }
    /**
     * Get relative strength (RS) value
     */
    getRelativeStrength() {
        const avgGain = this.getAverageGain();
        const avgLoss = this.getAverageLoss();
        if (avgGain === null || avgLoss === null || avgLoss === 0) {
            return null;
        }
        return avgGain / avgLoss;
    }
}
exports.RelativeStrengthIndex = RelativeStrengthIndex;
