/**
 * Tests for Strategy Engine
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import { StrategyEngine } from '../src/engine/strategy-engine';
import { StrategyConfig, CompiledStrategy, TradeSignal, OHLCV } from '@jware-trader8/types';

describe('StrategyEngine', () => {
  let engine: StrategyEngine;

  const createOHLCV = (close: number, timestamp: Date = new Date()): OHLCV => ({
    timestamp,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1000
  });

  const testStrategy: StrategyConfig = {
    name: "Test SMA Crossover",
    description: "Simple test strategy",
    version: "1.0.0",
    parameters: {
      symbol: "BTCUSD",
      timeframe: "1h",
      positionSize: 0.1,
      fast_period: 5,
      slow_period: 10
    },
    indicators: [
      {
        name: "sma_fast",
        type: "SMA",
        parameters: { period: 5 },
        source: "close"
      },
      {
        name: "sma_slow",
        type: "SMA",
        parameters: { period: 10 },
        source: "close"
      }
    ],
    signals: {
      buy: [
        {
          id: "sma_crossover_buy",
          description: "Buy when fast SMA crosses above slow SMA",
          condition: "sma_fast > sma_slow AND sma_fast[-1] <= sma_slow[-1]",
          action: "BUY",
          priority: 1
        }
      ],
      sell: [
        {
          id: "sma_crossover_sell",
          description: "Sell when fast SMA crosses below slow SMA",
          condition: "sma_fast < sma_slow AND sma_fast[-1] >= sma_slow[-1]",
          action: "SELL",
          priority: 1
        }
      ]
    },
    riskManagement: {
      maxPositionSize: 0.1,
      stopLoss: 0.02,
      takeProfit: 0.05,
      maxPositions: 1
    }
  };

  beforeEach(() => {
    engine = new StrategyEngine();
  });

  describe('Strategy Loading', () => {
    test('should load valid strategy configuration', () => {
      const strategy = engine.loadStrategy(testStrategy);

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe("Test SMA Crossover");
      expect(strategy.indicators.size).toBe(2);
      expect(strategy.indicators.has('sma_fast')).toBe(true);
      expect(strategy.indicators.has('sma_slow')).toBe(true);
    });

    test('should throw error for invalid strategy configuration', () => {
      const invalidStrategy = {
        ...testStrategy,
        indicators: [
          {
            name: "invalid_indicator",
            type: "UNKNOWN_TYPE",
            period: 10
          }
        ]
      };

      expect(() => engine.loadStrategy(invalidStrategy)).toThrow();
    });

    test('should handle parameter templating', () => {
      const strategyWithTemplating: StrategyConfig = {
        ...testStrategy,
        indicators: [
          {
            name: "sma_dynamic",
            type: "SMA",
            parameters: { period: "{{ parameters.fast_period }}" as any },
            source: "close"
          }
        ]
      };

      const strategy = engine.loadStrategy(strategyWithTemplating);
      expect(strategy.indicators.get('sma_dynamic')?.getConfig().parameters.period).toBe(5);
    });
  });

  describe('Strategy Validation', () => {
    test('should validate correct strategy configuration', () => {
      const result = engine.validateStrategy(testStrategy);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject strategy with missing required fields', () => {
      const invalidStrategy = {
        name: "",
        parameters: {
          position_size: 1.5 // Invalid: > 1.0
        }
        // Missing other required fields
      } as any;

      const result = engine.validateStrategy(invalidStrategy);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject strategy with duplicate indicator names', () => {
      const duplicateStrategy: StrategyConfig = {
        ...testStrategy,
        indicators: [
          {
            name: "sma_test",
            type: "SMA",
            parameters: { period: 5 }
          },
          {
            name: "sma_test", // Duplicate name
            type: "SMA",
            parameters: { period: 10 }
          }
        ]
      };

      const result = engine.validateStrategy(duplicateStrategy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining("Duplicate indicator name"));
    });

    test('should validate signal conditions syntax', () => {
      const invalidConditionStrategy: StrategyConfig = {
        ...testStrategy,
        signals: {
          buy: [
            {
              id: "invalid_condition",
              description: "Invalid condition test",
              condition: "invalid syntax here && &&", // Invalid condition
              action: "BUY"
            }
          ],
          sell: []
        }
      };

      const result = engine.validateStrategy(invalidConditionStrategy);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining("Invalid"));
    });
  });

  describe('Strategy Execution', () => {
    test('should generate buy signal on SMA crossover', async () => {
      const strategy = engine.loadStrategy(testStrategy);

      // Create market data that will cause SMA crossover
      // Need enough data to initialize both SMAs, then cause crossover
      const marketDataPoints = [
        // Initial data to warm up indicators (prices declining to set up crossover)
        createOHLCV(100), createOHLCV(99), createOHLCV(98), createOHLCV(97), createOHLCV(96),
        createOHLCV(95), createOHLCV(94), createOHLCV(93), createOHLCV(92), createOHLCV(91),
        createOHLCV(90), // Now both SMAs should be ready, fast < slow
        
        // Trigger crossover with rising prices  
        createOHLCV(95), createOHLCV(100), createOHLCV(105) // This should trigger fast > slow crossover
      ];

      let signals: TradeSignal[] = [];
      
      // Feed data sequentially and check for signals
      for (const marketData of marketDataPoints) {
        const newSignals = await engine.executeStrategy(strategy, marketData);
        signals.push(...newSignals);
      }

      // Should have generated at least one buy signal
      const buySignals = signals.filter(s => s.type === 'BUY');
      expect(buySignals.length).toBeGreaterThan(0);
      
      if (buySignals.length > 0) {
        expect(buySignals[0].symbol).toBe('BTCUSD');
        expect(buySignals[0].reason).toContain('crossover');
      }
    });

    test('should not generate signals when conditions are not met', async () => {
      const strategy = engine.loadStrategy(testStrategy);

      // Create flat market data (no crossover)
      const flatData = createOHLCV(100);
      
      const signals = await engine.executeStrategy(strategy, flatData);

      expect(signals).toHaveLength(0);
    });

    test('should handle multiple signals with different priorities', async () => {
      const multiSignalStrategy: StrategyConfig = {
        ...testStrategy,
        signals: {
          buy: [
            {
              id: "price_above_100",
              description: "Price above 100",
              condition: "close > 100",
              action: "BUY",
              priority: 1
            },
            {
              id: "price_above_95",
              description: "Price above 95",
              condition: "close > 95",
              action: "BUY",
              priority: 2
            }
          ],
          sell: []
        }
      };

      const strategy = engine.loadStrategy(multiSignalStrategy);
      const marketData = createOHLCV(105);

      const signals = await engine.executeStrategy(strategy, marketData);

      expect(signals.length).toBeGreaterThanOrEqual(1);
      // Should prioritize signals properly
      if (signals.length > 1) {
        expect(signals[0].priority).toBeLessThanOrEqual(signals[1].priority);
      }
    });
  });

  describe('Indicator Management', () => {
    test('should list available indicators', () => {
      const indicators = engine.getAvailableIndicators();

      expect(indicators).toContain('SMA');
      expect(indicators).toContain('EMA');
      expect(indicators).toContain('RSI');
    });

    test('should register new indicators', () => {
      class CustomIndicator {
        // Mock indicator implementation
      }

      engine.registerIndicator('CUSTOM', CustomIndicator as any);
      const indicators = engine.getAvailableIndicators();

      expect(indicators).toContain('CUSTOM');
    });

    test('should unregister indicators', () => {
      engine.unregisterIndicator('RSI');
      const indicators = engine.getAvailableIndicators();

      expect(indicators).not.toContain('RSI');
    });
  });

  describe('Execution Statistics', () => {
    test('should track execution statistics', async () => {
      const strategy = engine.loadStrategy(testStrategy);
      const marketData = createOHLCV(100);

      // Execute strategy multiple times
      await engine.executeStrategy(strategy, marketData);
      await engine.executeStrategy(strategy, marketData);

      const stats = engine.getExecutionStats(strategy.id);

      expect(stats.totalExecutions).toBe(2);
      expect(stats.strategyId).toBe(strategy.id);
      expect(stats.lastExecution).toBeDefined();
    });
  });
});