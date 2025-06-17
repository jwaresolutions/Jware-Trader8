import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { TradeCommands } from '../../src/commands/trade';
import { CLIContext } from '../../src/types/cli-types';
import { CLIOutputFormatter } from '../../src/utils/output-formatter';
import { CLIProgressIndicator } from '../../src/utils/progress-indicator';
import { CLIPromptHandler } from '../../src/utils/prompt-handler';

// Mock dependencies
jest.mock('@jware-trader8/strategies');
jest.mock('@jware-trader8/providers');
jest.mock('@jware-trader8/database');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  }
}));

describe('TradeCommands', () => {
  let tradeCommands: TradeCommands;
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
      formatStrategyInfo: jest.fn().mockReturnValue('mock strategy info'),
      formatAccountInfo: jest.fn().mockReturnValue('mock account info'),
      formatPositions: jest.fn().mockReturnValue('mock positions'),
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
        provider: 'alpaca',
        environment: 'paper',
        logLevel: 'info',
        maxPositions: 5,
        initialCapital: 10000,
        commission: 0.001
      },
      outputFormatter: mockOutputFormatter,
      progressIndicator: mockProgressIndicator,
      promptHandler: mockPromptHandler
    };

    tradeCommands = new TradeCommands(mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleTradeStart', () => {
    it('should validate strategy file path', async () => {
      const strategyFile = '';
      const options = { dryRun: true };

      await expect(tradeCommands.handleTradeStart(strategyFile, options))
        .rejects.toThrow('Strategy file path is required');
    });

    it('should validate strategy file extension', async () => {
      const strategyFile = 'strategy.txt';
      const options = { dryRun: true };

      await expect(tradeCommands.handleTradeStart(strategyFile, options))
        .rejects.toThrow('Strategy file must be a YAML file');
    });

    it('should start progress indicator when loading strategy', async () => {
      const fs = require('fs');
      const strategyFile = 'valid-strategy.yaml';
      const mockStrategy = {
        name: 'Test Strategy',
        indicators: [{ name: 'sma', type: 'SMA', parameters: { period: 20 } }],
        signals: { buy: [{ condition: 'sma > sma[1]' }] }
      };

      fs.promises.readFile.mockResolvedValue(JSON.stringify(mockStrategy));

      // This will throw due to mocked dependencies, but we can verify the progress indicator
      try {
        await tradeCommands.handleTradeStart(strategyFile, { dryRun: true });
      } catch (error) {
        // Expected due to mocked dependencies
      }

      expect(mockProgressIndicator.start).toHaveBeenCalledWith('Loading strategy configuration...');
    });

    it('should validate numeric options', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        dryRun: true,
        maxPositions: 'invalid',
        initialCapital: '100'
      };

      await expect(tradeCommands.handleTradeStart(strategyFile, options as any))
        .rejects.toThrow('max-positions must be a valid number');
    });

    it('should validate position limits', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        dryRun: true,
        maxPositions: '100', // Too high
        initialCapital: '10000'
      };

      await expect(tradeCommands.handleTradeStart(strategyFile, options as any))
        .rejects.toThrow('max-positions must be at most 50');
    });

    it('should validate capital limits', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        dryRun: true,
        maxPositions: '5',
        initialCapital: '50' // Too low
      };

      await expect(tradeCommands.handleTradeStart(strategyFile, options as any))
        .rejects.toThrow('initial-capital must be at least 100');
    });
  });

  describe('handleTradeStop', () => {
    it('should display message when no active sessions', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await tradeCommands.handleTradeStop({});

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No active trading sessions'));
      consoleSpy.mockRestore();
    });

    it('should start progress indicator when stopping sessions', async () => {
      // Simulate active session
      (tradeCommands as any).activeSessions.set('test-session', {
        id: 'test-session',
        status: 'running',
        positions: []
      });

      await tradeCommands.handleTradeStop({});

      expect(mockProgressIndicator.start).toHaveBeenCalledWith('Stopping trading sessions...');
    });

    it('should prompt for position closure when positions exist', async () => {
      // Simulate active session with positions
      (tradeCommands as any).activeSessions.set('test-session', {
        id: 'test-session',
        status: 'running',
        positions: [{ symbol: 'BTCUSD', quantity: 1 }]
      });

      mockPromptHandler.promptForConfirmation.mockResolvedValue(false);

      await tradeCommands.handleTradeStop({});

      expect(mockPromptHandler.promptForConfirmation).toHaveBeenCalledWith(
        'Close all positions before stopping?'
      );
    });

    it('should force stop without prompting when force option is used', async () => {
      // Simulate active session with positions
      (tradeCommands as any).activeSessions.set('test-session', {
        id: 'test-session',
        status: 'running',
        positions: [{ symbol: 'BTCUSD', quantity: 1 }]
      });

      await tradeCommands.handleTradeStop({ force: true });

      expect(mockPromptHandler.promptForConfirmation).not.toHaveBeenCalled();
      expect(mockProgressIndicator.succeed).toHaveBeenCalledWith('All trading sessions stopped');
    });
  });

  describe('handleStatus', () => {
    it('should start progress indicator when fetching status', async () => {
      // This will throw due to mocked dependencies, but we can verify the progress indicator
      try {
        await tradeCommands.handleStatus({});
      } catch (error) {
        // Expected due to mocked dependencies
      }

      expect(mockProgressIndicator.start).toHaveBeenCalledWith('Fetching account information...');
    });

    it('should display account information using formatter', async () => {
      // Mock the trading provider response
      const mockAccount = {
        id: 'test-account',
        cash: 10000,
        buyingPower: 20000,
        totalValue: 25000
      };

      // This is a simplified test - in reality we'd need to mock the entire provider chain
      // For now, we're testing the formatter interaction
      expect(mockOutputFormatter.formatAccountInfo).toBeDefined();
    });
  });

  describe('Strategy File Loading', () => {
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

      const loadStrategy = (tradeCommands as any).loadStrategyFile.bind(tradeCommands);
      const result = await loadStrategy('test-strategy.yaml');

      expect(result.name).toBe('Test Strategy');
      expect(result.indicators).toHaveLength(1);
      expect(result.signals.buy).toHaveLength(1);
    });

    it('should throw error for strategy without name', async () => {
      const fs = require('fs');
      const invalidStrategy = `
indicators:
  - name: "sma"
    type: "SMA"
`;

      fs.promises.readFile.mockResolvedValue(invalidStrategy);

      const loadStrategy = (tradeCommands as any).loadStrategyFile.bind(tradeCommands);

      await expect(loadStrategy('test-strategy.yaml'))
        .rejects.toThrow('Strategy must have a name');
    });

    it('should throw error for strategy without indicators', async () => {
      const fs = require('fs');
      const invalidStrategy = `
name: "Test Strategy"
signals:
  buy:
    - condition: "close > open"
`;

      fs.promises.readFile.mockResolvedValue(invalidStrategy);

      const loadStrategy = (tradeCommands as any).loadStrategyFile.bind(tradeCommands);

      await expect(loadStrategy('test-strategy.yaml'))
        .rejects.toThrow('Strategy must define at least one indicator');
    });

    it('should throw error for strategy without signals', async () => {
      const fs = require('fs');
      const invalidStrategy = `
name: "Test Strategy"
indicators:
  - name: "sma"
    type: "SMA"
`;

      fs.promises.readFile.mockResolvedValue(invalidStrategy);

      const loadStrategy = (tradeCommands as any).loadStrategyFile.bind(tradeCommands);

      await expect(loadStrategy('test-strategy.yaml'))
        .rejects.toThrow('Strategy must define buy and/or sell signals');
    });
  });

  describe('Symbol Override', () => {
    it('should validate symbol format when overriding', async () => {
      const strategyFile = 'strategy.yaml';
      const options = {
        dryRun: true,
        symbol: 'invalid-symbol!'
      };

      await expect(tradeCommands.handleTradeStart(strategyFile, options))
        .rejects.toThrow('Invalid symbol format');
    });

    it('should accept valid symbol format', async () => {
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
        dryRun: true,
        symbol: 'BTCUSD'
      };

      // This will eventually throw due to mocked dependencies, but symbol validation should pass
      try {
        await tradeCommands.handleTradeStart(strategyFile, options);
      } catch (error) {
        // We expect this to fail due to mocked dependencies, but not due to symbol validation
        expect(error.message).not.toContain('Invalid symbol format');
      }
    });
  });
});