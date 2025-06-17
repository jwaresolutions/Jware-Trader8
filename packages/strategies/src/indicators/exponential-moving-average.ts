/**
 * Exponential Moving Average (EMA) Indicator
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import { BaseIndicator } from './base-indicator';

/**
 * Exponential Moving Average implementation
 * Gives more weight to recent prices with exponential decay
 */
export class ExponentialMovingAverage extends BaseIndicator {
  private smoothingFactor: number;
  private previousEMA: number | null = null;
  private isInitialized: boolean = false;

  constructor(period: number) {
    super(period, 'EMA', 'EMA');
    // Calculate smoothing factor: 2 / (period + 1)
    this.smoothingFactor = 2 / (period + 1);
  }

  /**
   * Calculate EMA value
   * EMA = (Price * smoothingFactor) + (Previous EMA * (1 - smoothingFactor))
   */
  protected calculate(newPrice: number): number | null {
    if (!this.isInitialized) {
      // First value becomes the initial EMA
      this.previousEMA = newPrice;
      this.isInitialized = true;
      return newPrice;
    }

    // Calculate EMA using the formula
    const ema = (newPrice * this.smoothingFactor) + (this.previousEMA! * (1 - this.smoothingFactor));
    this.previousEMA = ema;
    return ema;
  }

  /**
   * Check if EMA is ready (initialized with at least one value)
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset EMA state
   */
  reset(): void {
    super.reset();
    this.previousEMA = null;
    this.isInitialized = false;
  }

  /**
   * Get smoothing factor
   */
  getSmoothingFactor(): number {
    return this.smoothingFactor;
  }

  /**
   * Get previous EMA value
   */
  getPreviousEMA(): number | null {
    return this.previousEMA;
  }
}