/**
 * Base Technical Indicator Class
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import { IIndicator, IndicatorConfig } from '@jware-trader8/core';
import { OHLCV } from '@jware-trader8/types';

/**
 * Abstract base class for all technical indicators
 */
export abstract class BaseIndicator implements IIndicator {
  protected values: (number | null)[] = [];
  protected period: number;
  protected maxHistory: number;
  protected config: IndicatorConfig;

  constructor(period: number, name: string, type: string, source: 'open' | 'high' | 'low' | 'close' | 'volume' = 'close') {
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
  get name(): string {
    return this.config.name;
  }

  /**
   * Update indicator with new market data
   */
  update(data: OHLCV): void {
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
  getValue(index: number = 0): number | null {
    if (index >= this.values.length) {
      return null;
    }
    return this.values[this.values.length - 1 - index];
  }

  /**
   * Check if indicator has enough data to produce valid values
   */
  abstract isReady(): boolean;

  /**
   * Reset indicator state
   */
  reset(): void {
    this.values = [];
  }

  /**
   * Get indicator configuration
   */
  getConfig(): IndicatorConfig {
    return { ...this.config };
  }

  /**
   * Get all historical values
   */
  getHistory(): (number | null)[] {
    return [...this.values];
  }

  /**
   * Abstract method to calculate indicator value
   */
  protected abstract calculate(newValue: number): number | null;

  /**
   * Extract the source value from OHLCV data
   */
  protected getSourceValue(data: OHLCV): number {
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
  protected getValidValueCount(): number {
    return this.values.filter(v => v !== null).length;
  }
}