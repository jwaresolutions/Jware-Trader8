/**
 * Tests for Technical Indicators
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import { SimpleMovingAverage } from '../src/indicators/simple-moving-average';
import { ExponentialMovingAverage } from '../src/indicators/exponential-moving-average';
import { RelativeStrengthIndex } from '../src/indicators/relative-strength-index';
import { OHLCV } from '@jware-trader8/types';

describe('Technical Indicators', () => {
  const createOHLCV = (close: number, timestamp: Date = new Date()): OHLCV => ({
    timestamp,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000
  });

  describe('SimpleMovingAverage', () => {
    test('should calculate SMA correctly with known data', () => {
      const sma = new SimpleMovingAverage(3);
      const prices = [10, 20, 30, 40, 50];
      const expectedResults = [null, null, 20, 30, 40];

      prices.forEach((price, index) => {
        sma.update(createOHLCV(price));
        expect(sma.getValue()).toBe(expectedResults[index]);
      });
    });

    test('should handle insufficient data gracefully', () => {
      const sma = new SimpleMovingAverage(5);
      sma.update(createOHLCV(100));

      expect(sma.getValue()).toBeNull();
      expect(sma.isReady()).toBe(false);
    });

    test('should be ready when enough data is provided', () => {
      const sma = new SimpleMovingAverage(3);
      
      expect(sma.isReady()).toBe(false);
      
      sma.update(createOHLCV(10));
      expect(sma.isReady()).toBe(false);
      
      sma.update(createOHLCV(20));
      expect(sma.isReady()).toBe(false);
      
      sma.update(createOHLCV(30));
      expect(sma.isReady()).toBe(true);
      expect(sma.getValue()).toBe(20);
    });

    test('should provide historical values', () => {
      const sma = new SimpleMovingAverage(2);
      const prices = [10, 20, 30, 40];
      
      prices.forEach(price => sma.update(createOHLCV(price)));
      
      expect(sma.getValue(0)).toBe(35); // Current: (30+40)/2
      expect(sma.getValue(1)).toBe(25); // Previous: (20+30)/2
      expect(sma.getValue(2)).toBe(15); // Two periods ago: (10+20)/2
    });

    test('should reset correctly', () => {
      const sma = new SimpleMovingAverage(2);
      sma.update(createOHLCV(10));
      sma.update(createOHLCV(20));
      
      expect(sma.isReady()).toBe(true);
      expect(sma.getValue()).toBe(15);
      
      sma.reset();
      
      expect(sma.isReady()).toBe(false);
      expect(sma.getValue()).toBeNull();
    });
  });

  describe('ExponentialMovingAverage', () => {
    test('should calculate EMA correctly with known data', () => {
      const ema = new ExponentialMovingAverage(3);
      
      // EMA calculation: EMA = (Price * (2/(N+1))) + (Previous EMA * (1 - (2/(N+1))))
      // For period 3: smoothing factor = 2/(3+1) = 0.5
      ema.update(createOHLCV(10)); // First value becomes initial EMA
      expect(ema.getValue()).toBe(10);
      
      ema.update(createOHLCV(20)); // EMA = (20 * 0.5) + (10 * 0.5) = 15
      expect(ema.getValue()).toBe(15);
      
      ema.update(createOHLCV(30)); // EMA = (30 * 0.5) + (15 * 0.5) = 22.5
      expect(ema.getValue()).toBe(22.5);
    });

    test('should handle single data point', () => {
      const ema = new ExponentialMovingAverage(5);
      ema.update(createOHLCV(100));
      
      expect(ema.getValue()).toBe(100);
      expect(ema.isReady()).toBe(true);
    });
  });

  describe('RelativeStrengthIndex', () => {
    test('should calculate RSI with textbook example', () => {
      const rsi = new RelativeStrengthIndex(14);
      
      // Use a simplified example for testing
      const testPrices = [
        44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89, 46.03,
        46.28, 46.23, 46.08, 46.03, 46.83, 47.69, 46.49, 46.26, 47.09
      ];
      
      testPrices.forEach((price, index) => {
        rsi.update(createOHLCV(price));
        
        // RSI should be null until we have enough data (14 periods + 1 for change calculation)
        if (index < 14) {
          expect(rsi.getValue()).toBeNull();
          expect(rsi.isReady()).toBe(false);
        }
      });
      
      // After 15 data points, RSI should be calculated
      expect(rsi.isReady()).toBe(true);
      expect(rsi.getValue()).toBeGreaterThan(0);
      expect(rsi.getValue()).toBeLessThan(100);
    });

    test('should handle extreme values correctly', () => {
      const rsi = new RelativeStrengthIndex(14);
      
      // Feed 15 increasing prices (should result in high RSI)
      for (let i = 1; i <= 15; i++) {
        rsi.update(createOHLCV(i * 10));
      }
      
      expect(rsi.getValue()).toBeGreaterThan(90); // Should be very high
    });

    test('should return null for insufficient data', () => {
      const rsi = new RelativeStrengthIndex(14);
      
      for (let i = 0; i < 10; i++) {
        rsi.update(createOHLCV(100 + i));
        expect(rsi.getValue()).toBeNull();
      }
    });
  });

  describe('Indicator Base Functionality', () => {
    test('should maintain correct history length', () => {
      const sma = new SimpleMovingAverage(3);
      const prices = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      prices.forEach(price => sma.update(createOHLCV(price)));
      
      const history = sma.getHistory();
      expect(history.length).toBeLessThanOrEqual(100); // Default max history length
    });

    test('should have correct indicator configuration', () => {
      const sma = new SimpleMovingAverage(10);
      const config = sma.getConfig();
      
      expect(config.name).toBe('SMA');
      expect(config.type).toBe('SMA');
      expect(config.parameters.period).toBe(10);
    });
  });
});