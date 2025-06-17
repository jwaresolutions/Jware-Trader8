/**
 * Structured logging utilities for trading events
 */
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
export declare class Logger {
    private winston;
    constructor(config?: LoggerConfig);
    /**
     * Log a trade event with structured data
     */
    logTrade(tradeData: TradeLogEntry): void;
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
    }): void;
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
    }): void;
    /**
     * Log system events
     */
    logSystem(event: string, data?: Record<string, any>): void;
    /**
     * Log error events
     */
    logError(error: Error | string, context?: Record<string, any>): void;
    /**
     * Log debug information
     */
    debug(message: string, data?: Record<string, any>): void;
    /**
     * Log informational messages
     */
    info(message: string, data?: Record<string, any>): void;
    /**
     * Log warning messages
     */
    warn(message: string, data?: Record<string, any>): void;
    /**
     * Log error messages
     */
    error(message: string, data?: Record<string, any>): void;
    /**
     * Create a child logger with additional context
     */
    child(context: Record<string, any>): Logger;
    /**
     * Set log level
     */
    setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;
    /**
     * Get current log level
     */
    getLevel(): string;
    /**
     * Close the logger and flush any pending writes
     */
    close(): Promise<void>;
}
/**
 * Default logger instance
 */
export declare const defaultLogger: Logger;
/**
 * Create a logger with specified configuration
 */
export declare function createLogger(config: LoggerConfig): Logger;
/**
 * Log a trade event using the default logger
 */
export declare function logTrade(tradeData: TradeLogEntry): void;
/**
 * Log an error using the default logger
 */
export declare function logError(error: Error | string, context?: Record<string, any>): void;
/**
 * Log system event using the default logger
 */
export declare function logSystem(event: string, data?: Record<string, any>): void;
//# sourceMappingURL=logger.d.ts.map