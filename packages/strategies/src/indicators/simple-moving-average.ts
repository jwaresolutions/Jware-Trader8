/**
 * Simple Moving Average (SMA) Indicator
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import { BaseIndicator } from './base-indicator';

/**
 * Simple Moving Average implementation
 * Calculates the arithmetic mean of prices over a specified period
 */
export class SimpleMovingAverage extends BaseIndicator {
  private prices: number[] = [];

  constructor(period: number) {
    super(period, 'SMA', 'SMA');
  }

  /**
   * Calculate SMA value
   */
  protected calculate(newPrice: number): number | null {
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
  isReady(): boolean {
    return this.prices.length >= this.period && this.getValue() !== null;
  }

  /**
   * Reset SMA state
   */
  reset(): void {
    super.reset();
    this.prices = [];
  }

  /**
   * Get current period setting
   */
  getPeriod(): number {
    return this.period;
  }

  /**
   * Get current price buffer
   */
  getPrices(): number[] {
    return [...this.prices];
  }
}