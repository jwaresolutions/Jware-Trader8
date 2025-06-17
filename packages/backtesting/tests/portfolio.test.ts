/**
 * Portfolio class tests
 * Following TDD approach with mathematical accuracy validation
 */

import { Portfolio } from '../src/models/portfolio';
import { PortfolioConfig, Position } from '@jware-trader8/types';

describe('Portfolio', () => {
  let portfolio: Portfolio;
  let config: PortfolioConfig;

  beforeEach(() => {
    config = {
      initialCash: 10000,
      commissionRate: 0.001, // 0.1%
      slippageRate: 0.0005,  // 0.05%
      maxPositionSize: 0.25,  // 25% max position
      riskManagement: {
        stopLossPercent: 0.05,   // 5% stop loss
        takeProfitPercent: 0.10, // 10% take profit
        maxDrawdownPercent: 0.20 // 20% max drawdown
      }
    };
    portfolio = new Portfolio(config);
  });

  describe('Initialization', () => {
    test('should initialize with correct cash balance', () => {
      expect(portfolio.getCash()).toBe(10000);
    });

    test('should initialize with empty positions', () => {
      expect(portfolio.getPositions().size).toBe(0);
    });

    test('should initialize with correct configuration', () => {
      expect(portfolio.getConfig()).toEqual(config);
    });
  });

  describe('Position Management', () => {
    test('should correctly check if can buy with sufficient funds', () => {
      const canBuy = portfolio.canBuy('BTCUSD', 50000, 0.1);
      expect(canBuy).toBe(true);
    });

    test('should reject buy with insufficient funds', () => {
      const canBuy = portfolio.canBuy('BTCUSD', 50000, 1.0); // Requires $50k + commission
      expect(canBuy).toBe(false);
    });

    test('should reject buy exceeding max position size', () => {
      const canBuy = portfolio.canBuy('BTCUSD', 50000, 0.06); // Would be 30% of portfolio
      expect(canBuy).toBe(false);
    });

    test('should open position correctly with commission calculation', () => {
      const timestamp = new Date('2023-01-01T10:00:00Z');
      const trade = portfolio.openPosition('BTCUSD', 50000, 0.1, timestamp);

      expect(trade.symbol).toBe('BTCUSD');
      expect(trade.side).toBe('BUY');
      expect(trade.quantity).toBe(0.1);
      expect(trade.entryPrice).toBe(50000);
      expect(trade.commission).toBe(5); // 0.1% of $5000
      expect(trade.status).toBe('OPEN');

      // Check cash deduction: $5000 + $5 commission = $5005
      expect(portfolio.getCash()).toBe(4995);

      // Check position created
      expect(portfolio.hasPosition('BTCUSD')).toBe(true);
      const position = portfolio.getPositions().get('BTCUSD');
      expect(position).toBeDefined();
      expect(position!.quantity).toBe(0.1);
      expect(position!.averagePrice).toBe(50000);
    });

    test('should handle multiple buys in same symbol (averaging)', () => {
      const timestamp1 = new Date('2023-01-01T10:00:00Z');
      const timestamp2 = new Date('2023-01-01T11:00:00Z');

      // First buy: 0.1 BTC at $50,000
      portfolio.openPosition('BTCUSD', 50000, 0.1, timestamp1);
      
      // Second buy: 0.1 BTC at $51,000
      portfolio.openPosition('BTCUSD', 51000, 0.1, timestamp2);

      const position = portfolio.getPositions().get('BTCUSD');
      expect(position!.quantity).toBe(0.2);
      expect(position!.averagePrice).toBe(50500); // Weighted average
    });

    test('should close position correctly with P&L calculation', () => {
      const entryTime = new Date('2023-01-01T10:00:00Z');
      const exitTime = new Date('2023-01-01T15:00:00Z');

      // Open position
      const openTrade = portfolio.openPosition('BTCUSD', 50000, 0.1, entryTime);
      
      // Close position at profit
      const closeTrade = portfolio.closePosition('BTCUSD', 52000, exitTime);

      expect(closeTrade.id).toBe(openTrade.id);
      expect(closeTrade.exitPrice).toBe(52000);
      expect(closeTrade.exitTime).toEqual(exitTime);
      expect(closeTrade.status).toBe('CLOSED');

      // P&L calculation: (52000 - 50000) * 0.1 - commission_buy - commission_sell
      // = 200 - 5 - 5.2 = 189.8
      expect(closeTrade.pnl).toBeCloseTo(189.8, 2);

      // Cash should be: initial - buy_cost + sell_proceeds - commissions
      // = 10000 - 5005 + 5200 - 5.2 = 10189.8
      expect(portfolio.getCash()).toBeCloseTo(10189.8, 2);

      // Position should be removed
      expect(portfolio.hasPosition('BTCUSD')).toBe(false);
    });

    test('should handle closing position at loss', () => {
      const entryTime = new Date('2023-01-01T10:00:00Z');
      const exitTime = new Date('2023-01-01T15:00:00Z');

      portfolio.openPosition('BTCUSD', 50000, 0.1, entryTime);
      const closeTrade = portfolio.closePosition('BTCUSD', 48000, exitTime);

      // P&L: (48000 - 50000) * 0.1 - 5 - 4.8 = -200 - 9.8 = -209.8
      expect(closeTrade.pnl).toBeCloseTo(-209.8, 2);
    });

    test('should throw error when closing non-existent position', () => {
      expect(() => {
        portfolio.closePosition('ETHUSD', 3000, new Date());
      }).toThrow('No position found for symbol ETHUSD');
    });
  });

  describe('Portfolio Valuation', () => {
    test('should calculate total value correctly with positions', () => {
      const timestamp = new Date('2023-01-01T10:00:00Z');
      
      // Open positions
      portfolio.openPosition('BTCUSD', 50000, 0.1, timestamp);
      portfolio.openPosition('ETHUSD', 3000, 1, timestamp);

      const currentPrices = new Map([
        ['BTCUSD', 52000],
        ['ETHUSD', 3100]
      ]);

      const totalValue = portfolio.getTotalValue(currentPrices);
      
      // Cash: 10000 - (5000 + 5) - (3000 + 3) = 1992
      // Positions: (0.1 * 52000) + (1 * 3100) = 5200 + 3100 = 8300
      // Total: 1992 + 8300 = 10292
      expect(totalValue).toBeCloseTo(10292, 2);
    });

    test('should return cash value when no positions', () => {
      const currentPrices = new Map();
      expect(portfolio.getTotalValue(currentPrices)).toBe(10000);
    });
  });

  describe('Risk Management', () => {
    test('should apply stop loss when price drops', () => {
      const entryTime = new Date('2023-01-01T10:00:00Z');
      const riskTime = new Date('2023-01-01T15:00:00Z');

      portfolio.openPosition('BTCUSD', 50000, 0.1, entryTime);

      const currentPrices = new Map([
        ['BTCUSD', 47000] // 6% drop, should trigger 5% stop loss
      ]);

      const riskTrades = portfolio.applyRiskManagement(currentPrices, riskTime);
      
      expect(riskTrades).toHaveLength(1);
      expect(riskTrades[0].symbol).toBe('BTCUSD');
      expect(riskTrades[0].exitReason).toBe('Stop Loss');
      expect(portfolio.hasPosition('BTCUSD')).toBe(false);
    });

    test('should apply take profit when price rises', () => {
      const entryTime = new Date('2023-01-01T10:00:00Z');
      const riskTime = new Date('2023-01-01T15:00:00Z');

      portfolio.openPosition('BTCUSD', 50000, 0.1, entryTime);

      const currentPrices = new Map([
        ['BTCUSD', 55500] // 11% gain, should trigger 10% take profit
      ]);

      const riskTrades = portfolio.applyRiskManagement(currentPrices, riskTime);
      
      expect(riskTrades).toHaveLength(1);
      expect(riskTrades[0].exitReason).toBe('Take Profit');
    });

    test('should not trigger risk management within thresholds', () => {
      const entryTime = new Date('2023-01-01T10:00:00Z');
      const riskTime = new Date('2023-01-01T15:00:00Z');

      portfolio.openPosition('BTCUSD', 50000, 0.1, entryTime);

      const currentPrices = new Map([
        ['BTCUSD', 52000] // 4% gain, within thresholds
      ]);

      const riskTrades = portfolio.applyRiskManagement(currentPrices, riskTime);
      expect(riskTrades).toHaveLength(0);
      expect(portfolio.hasPosition('BTCUSD')).toBe(true);
    });
  });

  describe('Portfolio Snapshots', () => {
    test('should create correct snapshot', () => {
      const timestamp = new Date('2023-01-01T10:00:00Z');
      
      portfolio.openPosition('BTCUSD', 50000, 0.1, timestamp);

      const currentPrices = new Map([['BTCUSD', 52000]]);
      const snapshot = portfolio.getSnapshot(currentPrices, timestamp);

      expect(snapshot.timestamp).toEqual(timestamp);
      expect(snapshot.cash).toBe(4995); // After commission
      expect(snapshot.positions).toHaveLength(1);
      expect(snapshot.totalValue).toBeCloseTo(10195, 2); // 4995 + (0.1 * 52000)
      expect(snapshot.unrealizedPnL).toBeCloseTo(200, 2); // (52000 - 50000) * 0.1
    });
  });

  describe('Mathematical Accuracy', () => {
    test('should maintain precision in commission calculations', () => {
      // Test with small amounts to check precision
      portfolio = new Portfolio({
        ...config,
        initialCash: 100,
        commissionRate: 0.001
      });

      const trade = portfolio.openPosition('TEST', 10, 1, new Date());
      expect(trade.commission).toBe(0.01); // 0.1% of $10
    });

    test('should handle fractional quantities correctly', () => {
      const trade = portfolio.openPosition('BTCUSD', 50000, 0.001, new Date());
      expect(trade.quantity).toBe(0.001);
      expect(portfolio.getCash()).toBeCloseTo(9949.95, 2); // 10000 - 50 - 0.05
    });

    test('should maintain cash conservation (money in = money out)', () => {
      const initialCash = portfolio.getCash();
      
      // Open and immediately close position
      portfolio.openPosition('BTCUSD', 50000, 0.1, new Date());
      const finalTrade = portfolio.closePosition('BTCUSD', 50000, new Date());
      
      // Should only lose commissions (buy + sell)
      const expectedCash = initialCash - (5 + 5); // Two 0.1% commissions
      expect(portfolio.getCash()).toBeCloseTo(expectedCash, 2);
      expect(finalTrade.pnl).toBeCloseTo(-10, 2); // Only commission costs
    });
  });
});