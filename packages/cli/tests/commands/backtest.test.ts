import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { BacktestCommands } from '../../src/commands/backtest';
import { CLIContext } from '../../src/types/cli-types';
import { CLIOutputFormatter } from '../../src/utils/output-formatter';
import { CLIProgressIndicator } from '../../src/utils/progress-indicator';
import { CLIPromptHandler } from '../../src/utils/prompt-handler';

// Mock dependencies
jest.mock('@jware-trader8/strategies');
jest.mock('@jware-trader8/backtesting');
jest.mock('@jware-trader8/providers');
jest.mock('@jware-trader8/database');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));
jest.mock('date-fns', () => ({
  parseISO: jest.fn((date: string) => new Date(date)),
  format: jest.fn((date: Date, fmt: string) => date.toISOString())
}));

describe('BacktestCommands', () => {
  let backtestCommands: BacktestCommands;
  let mockContext: CLIContext;
  let mockOutputFormatter: jest.Mocked<CLIOutputFormatter>;
  let mockProgressIndicator: jest.Mocked<CLIProgressIndicator>;
  let mockPromptHandler: jest.Mocked<CLIPromptHandler>;

  beforeEach(() => {
    // Create mocked context
    mockOutputFormatter = {
      formatTable: jest.fn().mockReturnValue('mock table'),
      formatJSON: jest.fn().mockReturnValue('mock json'),
      formatCSV: jest.fn().mockReturnValue('mock csv'),
      formatPerformanceSummary: jest.fn().mockReturnValue('mock performance'),
      formatTrades: jest.fn().mockReturnValue('mock trades'),
      success: jest.fn().mockReturnValue('success message'),
      error: jest.fn().mockReturnValue('error message'),
      warning: jest.fn().mockReturnValue('warning message'),
      info: jest.fn().mockReturnValue('info message')
    } as any;

    mockProgressIndicator = {
      start: jest.fn(),
      update: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn(),
      stop: jest.fn()
    } as any;

    mockPromptHandler = {
      promptForApiKeys: jest.fn(),
      promptForConfirmation: jest.fn(),
      promptForChoice: jest.fn(),
      promptForInput: jest.fn(),
      displayWelcome: jest.fn(),
      displaySuccess: jest.fn(),
      displayError: jest.fn(),
      displayWarning: jest.fn(),
      displayInfo: jest.fn()
    } as any;

    mockContext = {
      config: {
        provider: 'polygon',
        environment: 'test',
        logLevel: 'info',
        maxPositions: 5,
        initialCapital: 10000,
        commission: 0.001
      },
      outputFormatter: mockOutputFormatter,
      progressIndicator: mockProgressIndicator,
      promptHandler: mockPromptHandler
    };

    backtestCommands = new BacktestCommands(mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should validate strategy file path', async () => {
      const strategyFile = '';
      const options = {
        symbol: 'BTCUSD',
        start: '2024-01-01',
        end: '2024-06-01'
      };

      await expect(backtestCommands.handleBacktest(strategyFile, options))
        .rejects.toThrow('Strategy file path is required');
    });

    it('should validate strategy file extension', async () => {
      const strategyFile = 'strategy.txt';
      const options = {
        symbol: 'BTCUSD',
        start: '2024-01-01',
        end: '2024-06-01'
      };

      await expect(backtestCommands.handleBacktest(strategyFile, options))
        .rejects.toThrow('Strategy file must be a YAML file');
    });

    it('should validate symbol format', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        symbol: 'invalid-symbol!',
        start: '2024-01-01',
        end: '2024-06-01'
      };

      await expect(backtestCommands.handleBacktest(strategyFile, options))
        .rejects.toThrow('Invalid symbol format');
    });

    it('should validate date range', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        symbol: 'BTCUSD',
        start: '2024-06-01',
        end: '2024-01-01' // End before start
      };

      await expect(backtestCommands.handleBacktest(strategyFile, options))
        .rejects.toThrow('Start date must be before end date');
    });

    it('should validate timeframe', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        symbol: 'BTCUSD',
        start: '2024-01-01',
        end: '2024-06-01',
        timeframe: 'invalid'
      };

      await expect(backtestCommands.handleBacktest(strategyFile, options))
        .rejects.toThrow('Invalid timeframe: invalid');
    });

    it('should validate output format', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        symbol: 'BTCUSD',
        start: '2024-01-01',
        end: '2024-06-01',
        output: 'invalid' as any
      };

      await expect(backtestCommands.handleBacktest(strategyFile, options))
        .rejects.toThrow('Invalid output format: invalid');
    });

    it('should validate initial capital range', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        symbol: 'BTCUSD',
        start: '2024-01-01',
        end: '2024-06-01',
        initialCapital: '50' as any // Too low
      };

      await expect(backtestCommands.handleBacktest(strategyFile, options))
        .rejects.toThrow('initial-capital must be at least 100');
    });

    it('should validate commission range', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        symbol: 'BTCUSD',
        start: '2024-01-01',
        end: '2024-06-01',
        commission: '0.5' as any // Too high (50%)
      };

      await expect(backtestCommands.handleBacktest(strategyFile, options))
        .rejects.toThrow('commission must be at most 0.1');
    });
  });

  describe('Strategy Loading', () => {
    it('should load valid YAML strategy file', async () => {
      const fs = require('fs');
      const validStrategy = `
name: "Test Strategy"
indicators:
  - name: "sma"
    type: "SMA"
    parameters:
      period: 20
signals:
  buy:
    - condition: "sma > sma[1]"
`;

      fs.promises.readFile.mockResolvedValue(validStrategy);

      const loadStrategy = (backtestCommands as any).loadStrategyFile.bind(backtestCommands);
      const result = await loadStrategy('test-strategy.yaml');

      expect(result.name).toBe('Test Strategy');
      expect(result.indicators).toHaveLength(1);
      expect(result.signals.buy).toHaveLength(1);
    });

    it('should handle file not found error', async () => {
      const fs = require('fs');
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      
      fs.promises.readFile.mockRejectedValue(error);

      const loadStrategy = (backtestCommands as any).loadStrategyFile.bind(backtestCommands);

      await expect(loadStrategy('nonexistent.yaml'))
        .rejects.toThrow('Strategy file not found');
    });

    it('should validate strategy has required fields', async () => {
      const fs = require('fs');
      const invalidStrategy = `
indicators:
  - name: "sma"
    type: "SMA"
`;

      fs.promises.readFile.mockResolvedValue(invalidStrategy);

      const loadStrategy = (backtestCommands as any).loadStrategyFile.bind(backtestCommands);

      await expect(loadStrategy('invalid-strategy.yaml'))
        .rejects.toThrow('Strategy must have a name');
    });
  });

  describe('Progress Indication', () => {
    it('should show progress during backtest execution', async () => {
      const fs = require('fs');
      const validStrategy = `
name: "Test Strategy"
indicators:
  - name: "sma"
    type: "SMA"
    parameters:
      period: 20
signals:
  buy:
    - condition: "sma > sma[1]"
`;

      fs.promises.readFile.mockResolvedValue(validStrategy);

      const strategyFile = 'strategy.yaml';
      const options = {
        symbol: 'BTCUSD',
        start: '2024-01-01',
        end: '2024-06-01'
      };

      // This will throw due to mocked dependencies, but we can verify progress indication
      try {
        await backtestCommands.handleBacktest(strategyFile, options);
      } catch (error) {
        // Expected due to mocked dependencies
      }

      expect(mockProgressIndicator.start).toHaveBeenCalledWith('Loading strategy configuration...');
      expect(mockProgressIndicator.update).toHaveBeenCalledWith('Validating strategy...');
      expect(mockProgressIndicator.update).toHaveBeenCalledWith('Initializing data provider...');
    });
  });

  describe('Output Formatting', () => {
    const mockBacktestResult = {
      summary: {
        totalReturn: 15.5,
        sharpeRatio: 1.2,
        maxDrawdown: -8.3,
        winRate: 65.5,
        totalTrades: 42,
        profitableTrades: 28
      },
      trades: [
        {
          symbol: 'BTCUSD',
          side: 'BUY',
          entryTime: '2024-01-01T10:00:00Z',
          exitTime: '2024-01-01T12:00:00Z',
          entryPrice: 50000,
          exitPrice: 51000,
          quantity: 0.1,
          pnl: 100,
          entryReason: 'SMA crossover'
        }
      ],
      equityCurve: [
        { timestamp: '2024-01-01T10:00:00Z', totalValue: 10000 },
        { timestamp: '2024-01-01T12:00:00Z', totalValue: 10100 }
      ]
    };

    it('should format results as table by default', () => {
      const displayResults = (backtestCommands as any).displayResults.bind(backtestCommands);
      
      displayResults(mockBacktestResult, { output: 'table' }, { name: 'Test Strategy' });

      expect(mockOutputFormatter.formatPerformanceSummary).toHaveBeenCalledWith(mockBacktestResult.summary);
      expect(mockOutputFormatter.formatTrades).toHaveBeenCalled();
    });

    it('should format results as JSON when requested', () => {
      const displayResults = (backtestCommands as any).displayResults.bind(backtestCommands);
      
      displayResults(mockBacktestResult, { output: 'json' }, { name: 'Test Strategy' });

      expect(mockOutputFormatter.formatJSON).toHaveBeenCalledWith(mockBacktestResult);
    });

    it('should format results as CSV when requested', () => {
      const displayResults = (backtestCommands as any).displayResults.bind(backtestCommands);
      
      displayResults(mockBacktestResult, { output: 'csv' }, { name: 'Test Strategy' });

      expect(mockOutputFormatter.formatCSV).toHaveBeenCalledWith(mockBacktestResult.trades);
    });

    it('should handle empty trades list', () => {
      const resultWithNoTrades = { ...mockBacktestResult, trades: [] };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const displayResults = (backtestCommands as any).displayResults.bind(backtestCommands);
      displayResults(resultWithNoTrades, { output: 'csv' }, { name: 'Test Strategy' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No trades to export'));
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Insights', () => {
    it('should provide insights for high win rate', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockResult = {
        summary: {
          winRate: 70,
          sharpeRatio: 1.8,
          maxDrawdown: 5,
          totalTrades: 50
        },
        trades: new Array(50).fill({}),
        endDate: '2024-06-01',
        startDate: '2024-01-01'
      };

      const displayInsights = (backtestCommands as any).displayPerformanceInsights.bind(backtestCommands);
      displayInsights(mockResult);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('High win rate'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Excellent risk-adjusted returns'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Low drawdown'));
      
      consoleSpy.mockRestore();
    });

    it('should provide warnings for poor performance', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const mockResult = {
        summary: {
          winRate: 30,
          sharpeRatio: 0.3,
          maxDrawdown: 25,
          totalTrades: 10
        },
        trades: new Array(10).fill({}),
        endDate: '2024-06-01',
        startDate: '2024-01-01'
      };

      const displayInsights = (backtestCommands as any).displayPerformanceInsights.bind(backtestCommands);
      displayInsights(mockResult);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Low win rate'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Poor risk-adjusted returns'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('High maximum drawdown'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('ASCII Equity Curve', () => {
    it('should display equity curve for sufficient data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const equityCurve = [
        { totalValue: 10000, timestamp: '2024-01-01' },
        { totalValue: 10500, timestamp: '2024-03-01' },
        { totalValue: 11000, timestamp: '2024-06-01' }
      ];

      const displayEquityCurve = (backtestCommands as any).displayEquityCurveASCII.bind(backtestCommands);
      displayEquityCurve(equityCurve);

      // Should display the ASCII chart
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle insufficient data points', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const equityCurve = [{ totalValue: 10000, timestamp: '2024-01-01' }];

      const displayEquityCurve = (backtestCommands as any).displayEquityCurveASCII.bind(backtestCommands);
      displayEquityCurve(equityCurve);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Not enough data points'));
      
      consoleSpy.mockRestore();
    });

    it('should handle no value change', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const equityCurve = [
        { totalValue: 10000, timestamp: '2024-01-01' },
        { totalValue: 10000, timestamp: '2024-06-01' }
      ];

      const displayEquityCurve = (backtestCommands as any).displayEquityCurveASCII.bind(backtestCommands);
      displayEquityCurve(equityCurve);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No value change'));
      
      consoleSpy.mockRestore();
    });
  });
});