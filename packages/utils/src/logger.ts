/**
 * Structured logging utilities for trading events
 */

import winston from 'winston';

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TradeLogEntry {
  action: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  quantity: number;
  orderId?: string;
  strategyName?: string;
  reason?: string;
  timestamp?: Date;
}

export interface LoggerConfig {
  level?: 'debug' | 'info' | 'warn' | 'error';
  filePath?: string;
  maxFileSize?: number;
  maxFiles?: number;
  console?: boolean;
  format?: 'json' | 'text';
}

/**
 * Trading-focused logger with structured output
 */
export class Logger {
  private winston: winston.Logger;

  constructor(config: LoggerConfig = {}) {
    const {
      level = 'info',
      filePath,
      maxFileSize = 50 * 1024 * 1024, // 50MB
      maxFiles = 5,
      console = true,
      format = 'json'
    } = config;

    const transports: winston.transport[] = [];

    // Console transport
    if (console) {
      transports.push(new winston.transports.Console({
        format: format === 'json' ? 
          winston.format.json() : 
          winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple()
          )
      }));
    }

    // File transport
    if (filePath) {
      transports.push(new winston.transports.File({
        filename: filePath,
        maxsize: maxFileSize,
        maxFiles: maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));
    }

    this.winston = winston.createLogger({
      level,
      transports,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    });
  }

  /**
   * Log a trade event with structured data
   */
  logTrade(tradeData: TradeLogEntry): void {
    const logEntry = {
      type: 'TRADE',
      action: tradeData.action,
      symbol: tradeData.symbol,
      price: tradeData.price,
      quantity: tradeData.quantity,
      orderId: tradeData.orderId,
      strategyName: tradeData.strategyName,
      reason: tradeData.reason,
      timestamp: tradeData.timestamp || new Date()
    };

    this.winston.info('Trade executed', logEntry);
  }

  /**
   * Log strategy signal generation
   */
  logSignal(signalData: {
    type: 'BUY' | 'SELL' | 'HOLD';
    symbol: string;
    price: number;
    strength?: number;
    reason: string;
    strategyName: string;
  }): void {
    const logEntry = {
      type: 'SIGNAL',
      signalType: signalData.type,
      symbol: signalData.symbol,
      price: signalData.price,
      strength: signalData.strength,
      reason: signalData.reason,
      strategyName: signalData.strategyName,
      timestamp: new Date()
    };

    this.winston.info('Signal generated', logEntry);
  }

  /**
   * Log portfolio performance update
   */
  logPerformance(performanceData: {
    totalValue: number;
    cash: number;
    unrealizedPnL: number;
    realizedPnL: number;
    totalReturn: number;
    activePositions: number;
  }): void {
    const logEntry = {
      type: 'PERFORMANCE',
      ...performanceData,
      timestamp: new Date()
    };

    this.winston.info('Performance update', logEntry);
  }

  /**
   * Log system events
   */
  logSystem(event: string, data?: Record<string, any>): void {
    const logEntry = {
      type: 'SYSTEM',
      event,
      ...data,
      timestamp: new Date()
    };

    this.winston.info(event, logEntry);
  }

  /**
   * Log error events
   */
  logError(error: Error | string, context?: Record<string, any>): void {
    const logEntry = {
      type: 'ERROR',
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : { message: error },
      context,
      timestamp: new Date()
    };

    this.winston.error('Error occurred', logEntry);
  }

  /**
   * Log debug information
   */
  debug(message: string, data?: Record<string, any>): void {
    this.winston.debug(message, {
      type: 'DEBUG',
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: Record<string, any>): void {
    this.winston.info(message, {
      type: 'INFO',
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: Record<string, any>): void {
    this.winston.warn(message, {
      type: 'WARNING',
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Log error messages
   */
  error(message: string, data?: Record<string, any>): void {
    this.winston.error(message, {
      type: 'ERROR',
      ...data,
      timestamp: new Date()
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger();
    childLogger.winston = this.winston.child(context);
    return childLogger;
  }

  /**
   * Set log level
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.winston.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): string {
    return this.winston.level;
  }

  /**
   * Close the logger and flush any pending writes
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.winston.end(() => {
        resolve();
      });
    });
  }
}

/**
 * Default logger instance
 */
export const defaultLogger = new Logger({
  level: 'info',
  console: true,
  format: 'text'
});

/**
 * Create a logger with specified configuration
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

/**
 * Log a trade event using the default logger
 */
export function logTrade(tradeData: TradeLogEntry): void {
  defaultLogger.logTrade(tradeData);
}

/**
 * Log an error using the default logger
 */
export function logError(error: Error | string, context?: Record<string, any>): void {
  defaultLogger.logError(error, context);
}

/**
 * Log system event using the default logger
 */
export function logSystem(event: string, data?: Record<string, any>): void {
  defaultLogger.logSystem(event, data);
}