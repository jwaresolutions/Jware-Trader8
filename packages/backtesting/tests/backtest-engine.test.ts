/**
 * BacktestEngine tests
 * Following TDD approach with end-to-end workflow validation
 */

import { BacktestEngine } from '../src/engine/backtest-engine';
import { 
  BacktestExecutionConfig, 
  OHLCV, 
  PortfolioConfig,
  TradeSignal 
} from '@jware-trader8/types';

// Mock strategy for testing
class MockStrategy {
  config = {
    name: 'Test SMA Crossover',
    parameters: {
      symbol: 'BTCUSD',
      positionSize: 0.1
    }
  };

  private lastPrice: number = 0;

  async executeStrategy(strategy: any, marketData: OHLCV): Promise<TradeSignal[]> {
    const signals: TradeSignal[] = [];
    const currentPrice = marketData.close;

    // Simple strategy: buy if price increases, sell if decreases
    if (this.lastPrice > 0) {
      if (currentPrice > this.lastPrice * 1.02) { // 2% increase
        signals.push({
          type: 'BUY',
          symbol: 'BTCUSD',
          price: currentPrice,
          timestamp: marketData.timestamp,
          reason: 'Price increase signal',
          strategyName: 'Test SMA Crossover'
        });
      } else if (currentPrice < this.lastPrice * 0.98) { // 2% decrease
        signals.push({
          type: 'SELL',
          symbol: 'BTCUSD',
          price: currentPrice,
          timestamp: marketData.timestamp,
          reason: 'Price decrease signal',
          strategyName: 'Test SMA Crossover'
        });
      }
    }

    this.lastPrice = currentPrice;
    return signals;
  }
}

describe('BacktestEngine', () => {
  let backtestEngine: BacktestEngine;
  let mockStrategy: MockStrategy;
  let config: BacktestExecutionConfig;
  let historicalData: OHLCV[];

  beforeEach(() => {
    backtestEngine = new BacktestEngine();
    mockStrategy = new MockStrategy();

    const portfolioConfig: PortfolioConfig = {
      initialCash: 10000,
      commissionRate: 0.001,
      maxPositionSize: 0.25,
      riskManagement: {
        stopLossPercent: 0.05,
        takeProfitPercent: 0.10
      }
    };

    config = {
      portfolio: portfolioConfig,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-31'),
      benchmark: 'SPY',
      includeCosts: true
    };

    // Generate sample historical data
    historicalData = generateSampleData();
  });

  describe('Basic Functionality', () => {
    test('should run backtest successfully', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, config);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.trades).toBeInstanceOf(Array);
      expect(result.equityCurve).toBeInstanceOf(Array);
      expect(result.finalPortfolio).toBeDefined();
      expect(result.config).toEqual(config);
      expect(result.metadata).toBeDefined();
    });

    test('should handle empty historical data', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, [], config);

      expect(result.summary.totalTrades).toBe(0);
      expect(result.trades).toHaveLength(0);
      expect(result.equityCurve).toHaveLength(0);
    });

    test('should filter data by date range', async () => {
      const restrictedConfig = {
        ...config,
        startDate: new Date('2023-01-15'),
        endDate: new Date('2023-01-20')
      };

      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, restrictedConfig);

      // Should only process data within the range
      const processedPoints = result.equityCurve.filter(
        point => point.timestamp >= restrictedConfig.startDate && 
                 point.timestamp <= restrictedConfig.endDate
      );

      expect(processedPoints.length).toBeGreaterThan(0);
      expect(result.equityCurve.every(point => 
        point.timestamp >= restrictedConfig.startDate &&
        point.timestamp <= restrictedConfig.endDate
      )).toBe(true);
    });
  });

  describe('Trade Execution', () => {
    test('should execute buy and sell signals', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, config);

      expect(result.trades.length).toBeGreaterThan(0);
      
      const buyTrades = result.trades.filter(t => t.side === 'BUY');
      const sellTrades = result.trades.filter(t => t.side === 'SELL');

      expect(buyTrades.length).toBeGreaterThan(0);
      // May or may not have sell trades depending on strategy logic
    });

    test('should apply commission costs', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, config);

      const tradesWithCommission = result.trades.filter(t => t.commission > 0);
      expect(tradesWithCommission.length).toBeGreaterThan(0);

      // Verify commission calculation
      for (const trade of tradesWithCommission) {
        const expectedCommission = trade.entryPrice * trade.quantity * config.portfolio.commissionRate;
        expect(trade.commission).toBeCloseTo(expectedCommission, 2);
      }
    });

    test('should handle position sizing limits', async () => {
      const smallPortfolioConfig = {
        ...config.portfolio,
        maxPositionSize: 0.05 // 5% max position
      };

      const restrictedConfig = {
        ...config,
        portfolio: smallPortfolioConfig
      };

      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, restrictedConfig);

      // Should have fewer or smaller trades due to position limits
      for (const trade of result.trades) {
        const positionValue = trade.entryPrice * trade.quantity;
        const portfolioValue = 10000; // Initial value
        const positionPercent = positionValue / portfolioValue;
        
        expect(positionPercent).toBeLessThanOrEqual(0.05 + 0.001); // Small tolerance
      }
    });
  });

  describe('Risk Management', () => {
    test('should apply stop loss', async () => {
      // Create data with a significant price drop
      const dropData = generateDataWithDrop();
      
      const result = await backtestEngine.runBacktest(mockStrategy, dropData, config);

      const stopLossTrades = result.trades.filter(t => t.exitReason === 'Stop Loss');
      expect(stopLossTrades.length).toBeGreaterThan(0);

      // Verify stop loss was applied correctly
      for (const trade of stopLossTrades) {
        if (trade.exitPrice && trade.entryPrice) {
          const loss = (trade.exitPrice - trade.entryPrice) / trade.entryPrice;
          expect(loss).toBeLessThanOrEqual(-0.04); // Should trigger 5% stop loss
        }
      }
    });

    test('should apply take profit', async () => {
      // Create data with significant price increase
      const gainData = generateDataWithGain();
      
      const result = await backtestEngine.runBacktest(mockStrategy, gainData, config);

      const takeProfitTrades = result.trades.filter(t => t.exitReason === 'Take Profit');
      expect(takeProfitTrades.length).toBeGreaterThan(0);

      // Verify take profit was applied correctly
      for (const trade of takeProfitTrades) {
        if (trade.exitPrice && trade.entryPrice) {
          const gain = (trade.exitPrice - trade.entryPrice) / trade.entryPrice;
          expect(gain).toBeGreaterThanOrEqual(0.09); // Should trigger 10% take profit
        }
      }
    });
  });

  describe('Performance Metrics', () => {
    test('should calculate performance metrics correctly', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, config);

      const metrics = result.summary;

      expect(typeof metrics.totalReturn).toBe('number');
      expect(typeof metrics.annualizedReturn).toBe('number');
      expect(typeof metrics.sharpeRatio).toBe('number');
      expect(typeof metrics.maxDrawdown).toBe('number');
      expect(typeof metrics.winRate).toBe('number');
      expect(typeof metrics.profitFactor).toBe('number');
      expect(typeof metrics.volatility).toBe('number');

      expect(metrics.totalTrades).toBe(result.trades.length);
      expect(metrics.winningTrades + metrics.losingTrades).toBeLessThanOrEqual(metrics.totalTrades);
      expect(metrics.winRate).toBeGreaterThanOrEqual(0);
      expect(metrics.winRate).toBeLessThanOrEqual(1);
      expect(metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    });

    test('should calculate Sharpe ratio correctly', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, config);

      if (result.equityCurve.length > 1) {
        expect(typeof result.summary.sharpeRatio).toBe('number');
        expect(isFinite(result.summary.sharpeRatio)).toBe(true);
      }
    });

    test('should calculate maximum drawdown correctly', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, config);

      expect(result.summary.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.summary.maxDrawdown).toBeLessThanOrEqual(1);

      // Verify drawdown calculation in equity curve
      let peak = 0;
      for (const point of result.equityCurve) {
        if (point.totalValue > peak) {
          peak = point.totalValue;
        }
        
        const expectedDrawdown = peak > 0 ? (peak - point.totalValue) / peak : 0;
        expect(point.drawdown).toBeCloseTo(expectedDrawdown, 6);
      }
    });
  });

  describe('Equity Curve', () => {
    test('should generate equity curve', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, config);

      expect(result.equityCurve.length).toBeGreaterThan(0);

      for (const point of result.equityCurve) {
        expect(point.timestamp).toBeInstanceOf(Date);
        expect(typeof point.totalValue).toBe('number');
        expect(typeof point.cash).toBe('number');
        expect(typeof point.positionsValue).toBe('number');
        expect(typeof point.unrealizedPnL).toBe('number');
        expect(typeof point.realizedPnL).toBe('number');
        expect(typeof point.drawdown).toBe('number');

        // Values should be consistent
        expect(point.totalValue).toBeCloseTo(point.cash + point.positionsValue, 2);
        expect(point.drawdown).toBeGreaterThanOrEqual(0);
      }
    });

    test('should maintain portfolio value conservation', async () => {
      const result = await backtestEngine.runBacktest(mockStrategy, historicalData, config);

      if (result.equityCurve.length > 0) {
        const initialValue = config.portfolio.initialCash;
        const finalValue = result.equityCurve[result.equityCurve.length - 1].totalValue;

        // Final value should reflect actual P&L minus commissions
        const totalCommissions = result.trades.reduce((sum, trade) => sum + trade.commission, 0);
        const totalPnL = result.trades.filter(t => t.status === 'CLOSED')
          .reduce((sum, trade) => sum + (trade.pnl || 0), 0);

        const expectedFinalValue = initialValue + totalPnL - totalCommissions;
        expect(finalValue).toBeCloseTo(expectedFinalValue, 1); // Allow small tolerance for rounding
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle strategy execution errors gracefully', async () => {
      const errorStrategy = {
        ...mockStrategy,
        executeStrategy: async () => {
          throw new Error('Strategy execution failed');
        }
      };

      // Should not throw, but continue processing
      const result = await backtestEngine.runBacktest(errorStrategy, historicalData, config);
      expect(result).toBeDefined();
    });

    test('should handle invalid data points', async () => {
      const invalidData = [
        ...historicalData,
        {
          timestamp: new Date('2023-01-15'),
          open: NaN,
          high: NaN,
          low: NaN,
          close: NaN,
          volume: 0
        }
      ];

      const result = await backtestEngine.runBacktest(mockStrategy, invalidData, config);
      expect(result).toBeDefined();
    });
  });

  // Helper functions for generating test data
  function generateSampleData(): OHLCV[] {
    const data: OHLCV[] = [];
    let price = 50000;
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      // Random walk with slight upward bias
      const change = (Math.random() - 0.45) * 0.02;
      price *= (1 + change);

      const high = price * (1 + Math.random() * 0.01);
      const low = price * (1 - Math.random() * 0.01);
      const open = price * (1 + (Math.random() - 0.5) * 0.005);

      data.push({
        timestamp: date,
        open,
        high,
        low,
        close: price,
        volume: Math.floor(Math.random() * 1000) + 100
      });
    }

    return data;
  }

  function generateDataWithDrop(): OHLCV[] {
    const data = generateSampleData();
    
    // Add a significant drop in the middle
    const dropIndex = Math.floor(data.length / 2);
    for (let i = dropIndex; i < dropIndex + 3; i++) {
      if (data[i]) {
        data[i].close *= 0.9; // 10% drop
        data[i].low = Math.min(data[i].low, data[i].close);
      }
    }

    return data;
  }

  function generateDataWithGain(): OHLCV[] {
    const data = generateSampleData();
    
    // Add a significant gain in the middle
    const gainIndex = Math.floor(data.length / 2);
    for (let i = gainIndex; i < gainIndex + 3; i++) {
      if (data[i]) {
        data[i].close *= 1.15; // 15% gain
        data[i].high = Math.max(data[i].high, data[i].close);
      }
    }

    return data;
  }
});