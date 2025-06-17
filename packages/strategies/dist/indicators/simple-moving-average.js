"use strict";
/**
 * Simple Moving Average (SMA) Indicator
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleMovingAverage = void 0;
const base_indicator_1 = require("./base-indicator");
/**
 * Simple Moving Average implementation
 * Calculates the arithmetic mean of prices over a specified period
 */
class SimpleMovingAverage extends base_indicator_1.BaseIndicator {
    prices = [];
    constructor(period) {
        super(period, 'SMA', 'SMA');
    }
    /**
     * Calculate SMA value
     */
    calculate(newPrice) {
        this.prices.push(newPrice);
        // Remove oldest price if we exceed the period
        if (this.prices.length > this.period) {
            this.prices.shift();
        }
        // Return null if we don't have enough data
        if (this.prices.length < this.period) {
            return null;
        }
        // Calculate arithmetic mean
        const sum = this.prices.reduce((acc, price) => acc + price, 0);
        return sum / this.period;
    }
    /**
     * Check if SMA is ready (has enough data points)
     */
    isReady() {
        return this.prices.length >= this.period && this.getValue() !== null;
    }
    /**
     * Reset SMA state
     */
    reset() {
        super.reset();
        this.prices = [];
    }
    /**
     * Get current period setting
     */
    getPeriod() {
        return this.period;
    }
    /**
     * Get current price buffer
     */
    getPrices() {
        return [...this.prices];
    }
}
exports.SimpleMovingAverage = SimpleMovingAverage;
