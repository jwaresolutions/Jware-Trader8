/**
 * Test file for logger utilities
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import { Logger, createLogger, logTrade, TradeLogEntry } from '../src/logger';

// Mock winston to avoid actual file I/O during tests
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    end: jest.fn((callback: () => void) => callback()),
    child: jest.fn(() => mockLogger),
    level: 'info'
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      json: jest.fn(),
      combine: jest.fn(),
      timestamp: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
      errors: jest.fn(() => ({}))
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn()
    }
  };
});

describe('Logger', () => {
  let mockWrite: jest.Mock;
  let logger: Logger;

  beforeEach(() => {
    mockWrite = jest.fn();
    logger = new Logger({ 
      console: false // Disable console to avoid winston dependency issues in tests
    });
    jest.clearAllMocks();
  });

  test('should log trade events with structured format', () => {
    const tradeData: TradeLogEntry = {
      action: 'BUY',
      symbol: 'BTCUSD',
      price: 50000,
      quantity: 0.1,
      orderId: 'order-123',
      strategyName: 'SMA Crossover',
      reason: 'SMA crossover detected'
    };

    logger.logTrade(tradeData);

    // Verify that winston's info method was called
    expect(require('winston').createLogger().info).toHaveBeenCalledWith(
      'Trade executed',
      expect.objectContaining({
        type: 'TRADE',
        action: 'BUY',
        symbol: 'BTCUSD',
        price: 50000,
        quantity: 0.1
      })
    );
  });

  test('should log signal generation', () => {
    const signalData = {
      type: 'BUY' as const,
      symbol: 'ETHUSD',
      price: 3000,
      strength: 0.85,
      reason: 'RSI oversold',
      strategyName: 'RSI Strategy'
    };

    logger.logSignal(signalData);

    expect(require('winston').createLogger().info).toHaveBeenCalledWith(
      'Signal generated',
      expect.objectContaining({
        type: 'SIGNAL',
        signalType: 'BUY',
        symbol: 'ETHUSD',
        price: 3000,
        strength: 0.85
      })
    );
  });

  test('should log performance updates', () => {
    const performanceData = {
      totalValue: 11000,
      cash: 1000,
      unrealizedPnL: 500,
      realizedPnL: 500,
      totalReturn: 0.10,
      activePositions: 2
    };

    logger.logPerformance(performanceData);

    expect(require('winston').createLogger().info).toHaveBeenCalledWith(
      'Performance update',
      expect.objectContaining({
        type: 'PERFORMANCE',
        totalValue: 11000,
        cash: 1000,
        unrealizedPnL: 500,
        realizedPnL: 500,
        totalReturn: 0.10,
        activePositions: 2
      })
    );
  });

  test('should log system events', () => {
    logger.logSystem('Strategy loaded', { strategyName: 'Test Strategy' });

    expect(require('winston').createLogger().info).toHaveBeenCalledWith(
      'Strategy loaded',
      expect.objectContaining({
        type: 'SYSTEM',
        event: 'Strategy loaded',
        strategyName: 'Test Strategy'
      })
    );
  });

  test('should log error events with Error objects', () => {
    const error = new Error('Test error message');
    error.stack = 'Error stack trace';

    logger.logError(error, { context: 'test' });

    expect(require('winston').createLogger().error).toHaveBeenCalledWith(
      'Error occurred',
      expect.objectContaining({
        type: 'ERROR',
        error: {
          message: 'Test error message',
          stack: 'Error stack trace',
          name: 'Error'
        },
        context: { context: 'test' }
      })
    );
  });

  test('should log error events with string messages', () => {
    logger.logError('String error message');

    expect(require('winston').createLogger().error).toHaveBeenCalledWith(
      'Error occurred',
      expect.objectContaining({
        type: 'ERROR',
        error: { message: 'String error message' }
      })
    );
  });

  test('should log debug messages', () => {
    logger.debug('Debug message', { debugData: 'test' });

    expect(require('winston').createLogger().debug).toHaveBeenCalledWith(
      'Debug message',
      expect.objectContaining({
        type: 'DEBUG',
        debugData: 'test'
      })
    );
  });

  test('should log info messages', () => {
    logger.info('Info message', { infoData: 'test' });

    expect(require('winston').createLogger().info).toHaveBeenCalledWith(
      'Info message',
      expect.objectContaining({
        type: 'INFO',
        infoData: 'test'
      })
    );
  });

  test('should log warning messages', () => {
    logger.warn('Warning message', { warnData: 'test' });

    expect(require('winston').createLogger().warn).toHaveBeenCalledWith(
      'Warning message',
      expect.objectContaining({
        type: 'WARNING',
        warnData: 'test'
      })
    );
  });

  test('should log error messages', () => {
    logger.error('Error message', { errorData: 'test' });

    expect(require('winston').createLogger().error).toHaveBeenCalledWith(
      'Error message',
      expect.objectContaining({
        type: 'ERROR',
        errorData: 'test'
      })
    );
  });

  test('should create child logger with context', () => {
    const context = { userId: 'user123', sessionId: 'session456' };
    const childLogger = logger.child(context);

    expect(childLogger).toBeInstanceOf(Logger);
    expect(require('winston').createLogger().child).toHaveBeenCalledWith(context);
  });

  test('should set and get log level', () => {
    logger.setLevel('debug');
    expect(require('winston').createLogger().level).toBe('debug');

    const level = logger.getLevel();
    expect(level).toBe('debug');
  });

  test('should close logger properly', async () => {
    await logger.close();
    expect(require('winston').createLogger().end).toHaveBeenCalled();
  });

  test('should create logger with custom configuration', () => {
    const config = {
      level: 'debug' as const,
      filePath: './test.log',
      maxFileSize: 1024,
      maxFiles: 3,
      console: false,
      format: 'json' as const
    };

    const customLogger = createLogger(config);
    expect(customLogger).toBeInstanceOf(Logger);
  });

  test('should handle trade log with minimal data', () => {
    const tradeData: TradeLogEntry = {
      action: 'SELL',
      symbol: 'AAPL',
      price: 150,
      quantity: 10
    };

    logger.logTrade(tradeData);

    expect(require('winston').createLogger().info).toHaveBeenCalledWith(
      'Trade executed',
      expect.objectContaining({
        type: 'TRADE',
        action: 'SELL',
        symbol: 'AAPL',
        price: 150,
        quantity: 10
      })
    );
  });

  test('should use default timestamp for trade logs', () => {
    const beforeLog = Date.now();
    
    const tradeData: TradeLogEntry = {
      action: 'BUY',
      symbol: 'MSFT',
      price: 300,
      quantity: 5
    };

    logger.logTrade(tradeData);

    const afterLog = Date.now();
    const logCall = require('winston').createLogger().info.mock.calls[0];
    const loggedTimestamp = new Date(logCall[1].timestamp).getTime();

    expect(loggedTimestamp).toBeGreaterThanOrEqual(beforeLog);
    expect(loggedTimestamp).toBeLessThanOrEqual(afterLog);
  });
});