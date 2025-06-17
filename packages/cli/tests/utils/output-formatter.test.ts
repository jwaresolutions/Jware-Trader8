import { describe, it, expect } from '@jest/globals';
import { CLIOutputFormatter } from '../../src/utils/output-formatter';

describe('CLIOutputFormatter', () => {
  let formatter: CLIOutputFormatter;

  beforeEach(() => {
    formatter = new CLIOutputFormatter();
  });

  describe('formatTable', () => {
    it('should format data into a table', () => {
      const data = [
        { Name: 'John', Age: 30, City: 'New York' },
        { Name: 'Jane', Age: 25, City: 'Los Angeles' }
      ];
      const headers = ['Name', 'Age', 'City'];

      const result = formatter.formatTable(data, headers);

      expect(result).toContain('John');
      expect(result).toContain('Jane');
      expect(result).toContain('30');
      expect(result).toContain('25');
      expect(result).toContain('New York');
      expect(result).toContain('Los Angeles');
    });

    it('should handle empty data', () => {
      const result = formatter.formatTable([], ['Name', 'Age']);
      expect(result).toContain('No data to display');
    });

    it('should format numbers with appropriate precision', () => {
      const data = [
        { Price: 123.456789, Percentage: 0.1234 }
      ];
      const headers = ['Price', 'Percentage'];

      const result = formatter.formatTable(data, headers);
      expect(result).toContain('123.4568');
    });

    it('should color P&L values appropriately', () => {
      const data = [
        { Symbol: 'BTCUSD', PnL: 100.50 },
        { Symbol: 'ETHUSD', PnL: -50.25 }
      ];
      const headers = ['Symbol', 'PnL'];

      const result = formatter.formatTable(data, headers);
      // Should contain colored output (we can't easily test colors, but verify data is present)
      expect(result).toContain('100.50');
      expect(result).toContain('-50.25');
      expect(result).toContain('BTCUSD');
      expect(result).toContain('ETHUSD');
    });

    it('should format boolean values with symbols', () => {
      const data = [
        { Active: true, Verified: false }
      ];
      const headers = ['Active', 'Verified'];

      const result = formatter.formatTable(data, headers);
      expect(result).toContain('✓');
      expect(result).toContain('✗');
    });

    it('should format dates consistently', () => {
      const data = [
        { Timestamp: new Date('2024-01-01T12:00:00Z') }
      ];
      const headers = ['Timestamp'];

      const result = formatter.formatTable(data, headers);
      expect(result).toContain('2024');
    });

    it('should handle null and undefined values', () => {
      const data = [
        { Name: 'John', Age: null, City: undefined }
      ];
      const headers = ['Name', 'Age', 'City'];

      const result = formatter.formatTable(data, headers);
      expect(result).toContain('John');
      expect(result).toContain('-'); // Default for null/undefined
    });
  });

  describe('formatJSON', () => {
    it('should format objects as pretty JSON', () => {
      const data = { name: 'test', value: 42, nested: { key: 'value' } };
      
      const result = formatter.formatJSON(data);
      
      expect(result).toBe(JSON.stringify(data, null, 2));
      expect(result).toContain('  '); // Should have indentation
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, { key: 'value' }];
      
      const result = formatter.formatJSON(data);
      
      expect(result).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('formatCSV', () => {
    it('should format array of objects as CSV', () => {
      const data = [
        { Name: 'John', Age: 30, City: 'New York' },
        { Name: 'Jane', Age: 25, City: 'Los Angeles' }
      ];

      const result = formatter.formatCSV(data);
      
      const lines = result.split('\n');
      expect(lines[0]).toBe('Name,Age,City');
      expect(lines[1]).toBe('John,30,New York');
      expect(lines[2]).toBe('Jane,25,Los Angeles');
    });

    it('should handle empty data', () => {
      const result = formatter.formatCSV([]);
      expect(result).toBe('');
    });

    it('should escape commas and quotes in CSV', () => {
      const data = [
        { Name: 'John, Jr.', Description: 'He said "Hello"' }
      ];

      const result = formatter.formatCSV(data);
      
      expect(result).toContain('"John, Jr."');
      expect(result).toContain('"He said ""Hello"""');
    });

    it('should handle null and undefined values', () => {
      const data = [
        { Name: 'John', Age: null, City: undefined }
      ];

      const result = formatter.formatCSV(data);
      
      const lines = result.split('\n');
      expect(lines[1]).toBe('John,,');
    });
  });

  describe('formatPerformanceSummary', () => {
    it('should format performance metrics into a table', () => {
      const summary = {
        totalReturn: 15.5,
        sharpeRatio: 1.2,
        maxDrawdown: -8.3,
        winRate: 65.5,
        totalTrades: 42
      };

      const result = formatter.formatPerformanceSummary(summary);
      
      expect(result).toContain('Total Return');
      expect(result).toContain('15.50%');
      expect(result).toContain('Sharpe Ratio');
      expect(result).toContain('1.20');
      expect(result).toContain('Max Drawdown');
      expect(result).toContain('-8.30%');
      expect(result).toContain('Win Rate');
      expect(result).toContain('65.50%');
    });

    it('should color positive and negative values appropriately', () => {
      const summary = {
        totalReturn: 15.5,
        maxDrawdown: -8.3
      };

      const result = formatter.formatPerformanceSummary(summary);
      
      // Should contain the values (we can't easily test colors)
      expect(result).toContain('15.50%');
      expect(result).toContain('-8.30%');
    });
  });

  describe('formatAccountInfo', () => {
    it('should format account information', () => {
      const account = {
        totalValue: 25000.50,
        cash: 10000.25,
        buyingPower: 20000.75,
        dayTradeCount: 2,
        patternDayTrader: false
      };

      const result = formatter.formatAccountInfo(account);
      
      expect(result).toContain('Account Value');
      expect(result).toContain('$25,000.50');
      expect(result).toContain('Cash Balance');
      expect(result).toContain('$10,000.25');
      expect(result).toContain('Buying Power');
      expect(result).toContain('$20,000.75');
      expect(result).toContain('Day Trade Count');
      expect(result).toContain('2');
      expect(result).toContain('Pattern Day Trader');
      expect(result).toContain('No');
    });

    it('should handle missing account fields with defaults', () => {
      const account = {};

      const result = formatter.formatAccountInfo(account);
      
      expect(result).toContain('$0.00');
    });

    it('should show pattern day trader warning when applicable', () => {
      const account = {
        patternDayTrader: true
      };

      const result = formatter.formatAccountInfo(account);
      
      expect(result).toContain('Yes');
    });
  });

  describe('formatPositions', () => {
    it('should format positions data', () => {
      const positions = [
        {
          symbol: 'BTCUSD',
          quantity: 0.1,
          entryPrice: 50000,
          currentPrice: 51000,
          pnl: 100,
          pnlPercent: 2.0
        },
        {
          symbol: 'ETHUSD',
          quantity: 1.0,
          entryPrice: 3000,
          currentPrice: 2950,
          pnl: -50,
          pnlPercent: -1.67
        }
      ];

      const result = formatter.formatPositions(positions);
      
      expect(result).toContain('BTCUSD');
      expect(result).toContain('ETHUSD');
      expect(result).toContain('0.1');
      expect(result).toContain('1.0');
      expect(result).toContain('50000');
      expect(result).toContain('51000');
      expect(result).toContain('100');
      expect(result).toContain('-50');
    });

    it('should handle empty positions', () => {
      const result = formatter.formatPositions([]);
      expect(result).toContain('No open positions');
    });

    it('should handle null/undefined positions', () => {
      const result = formatter.formatPositions(null as any);
      expect(result).toContain('No open positions');
    });
  });

  describe('formatTrades', () => {
    it('should format trade history', () => {
      const trades = [
        {
          symbol: 'BTCUSD',
          side: 'BUY',
          entryTime: new Date('2024-01-01T10:00:00Z'),
          exitTime: new Date('2024-01-01T12:00:00Z'),
          entryPrice: 50000,
          exitPrice: 51000,
          quantity: 0.1,
          pnl: 100,
          entryReason: 'SMA crossover'
        },
        {
          symbol: 'ETHUSD',
          side: 'BUY',
          entryTime: new Date('2024-01-01T14:00:00Z'),
          exitTime: null,
          entryPrice: 3000,
          exitPrice: null,
          quantity: 1.0,
          pnl: 0,
          exitReason: null
        }
      ];

      const result = formatter.formatTrades(trades);
      
      expect(result).toContain('BTCUSD');
      expect(result).toContain('ETHUSD');
      expect(result).toContain('BUY');
      expect(result).toContain('50000');
      expect(result).toContain('51000');
      expect(result).toContain('100');
      expect(result).toContain('SMA crossover');
      expect(result).toContain('-'); // For null values
    });

    it('should handle empty trades', () => {
      const result = formatter.formatTrades([]);
      expect(result).toContain('No trades to display');
    });
  });

  describe('formatStrategyInfo', () => {
    it('should format strategy configuration', () => {
      const strategy = {
        name: 'Test Strategy',
        description: 'A test strategy',
        parameters: {
          period: 20,
          threshold: 0.05
        },
        indicators: [
          {
            name: 'sma',
            type: 'SMA',
            parameters: { period: 20 }
          },
          {
            name: 'rsi',
            type: 'RSI',
            parameters: { period: 14 }
          }
        ]
      };

      const result = formatter.formatStrategyInfo(strategy);
      
      expect(result).toContain('Test Strategy');
      expect(result).toContain('A test strategy');
      expect(result).toContain('Parameters:');
      expect(result).toContain('period: 20');
      expect(result).toContain('threshold: 0.05');
      expect(result).toContain('Indicators:');
      expect(result).toContain('sma: SMA');
      expect(result).toContain('rsi: RSI');
    });

    it('should handle strategy without description', () => {
      const strategy = {
        name: 'Test Strategy',
        parameters: {},
        indicators: []
      };

      const result = formatter.formatStrategyInfo(strategy);
      
      expect(result).toContain('No description');
    });
  });

  describe('Message formatting methods', () => {
    it('should format success messages', () => {
      const result = formatter.success('Operation completed');
      expect(result).toContain('✓');
      expect(result).toContain('Operation completed');
    });

    it('should format error messages', () => {
      const result = formatter.error('Something went wrong');
      expect(result).toContain('✗');
      expect(result).toContain('Something went wrong');
    });

    it('should format warning messages', () => {
      const result = formatter.warning('Be careful');
      expect(result).toContain('⚠');
      expect(result).toContain('Be careful');
    });

    it('should format info messages', () => {
      const result = formatter.info('Information');
      expect(result).toContain('ℹ');
      expect(result).toContain('Information');
    });

    it('should format header messages', () => {
      const result = formatter.header('Main Title');
      expect(result).toContain('Main Title');
    });

    it('should format dim messages', () => {
      const result = formatter.dim('Subtle text');
      expect(result).toContain('Subtle text');
    });
  });
});