"use strict";
/**
 * Structured logging utilities for trading events
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSystem = exports.logError = exports.logTrade = exports.createLogger = exports.defaultLogger = exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
/**
 * Trading-focused logger with structured output
 */
class Logger {
    winston;
    constructor(config = {}) {
        const { level = 'info', filePath, maxFileSize = 50 * 1024 * 1024, // 50MB
        maxFiles = 5, console = true, format = 'json' } = config;
        const transports = [];
        // Console transport
        if (console) {
            transports.push(new winston_1.default.transports.Console({
                format: format === 'json' ?
                    winston_1.default.format.json() :
                    winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.colorize(), winston_1.default.format.simple())
            }));
        }
        // File transport
        if (filePath) {
            transports.push(new winston_1.default.transports.File({
                filename: filePath,
                maxsize: maxFileSize,
                maxFiles: maxFiles,
                format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
            }));
        }
        this.winston = winston_1.default.createLogger({
            level,
            transports,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json())
        });
    }
    /**
     * Log a trade event with structured data
     */
    logTrade(tradeData) {
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
    logSignal(signalData) {
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
    logPerformance(performanceData) {
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
    logSystem(event, data) {
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
    logError(error, context) {
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
    debug(message, data) {
        this.winston.debug(message, {
            type: 'DEBUG',
            ...data,
            timestamp: new Date()
        });
    }
    /**
     * Log informational messages
     */
    info(message, data) {
        this.winston.info(message, {
            type: 'INFO',
            ...data,
            timestamp: new Date()
        });
    }
    /**
     * Log warning messages
     */
    warn(message, data) {
        this.winston.warn(message, {
            type: 'WARNING',
            ...data,
            timestamp: new Date()
        });
    }
    /**
     * Log error messages
     */
    error(message, data) {
        this.winston.error(message, {
            type: 'ERROR',
            ...data,
            timestamp: new Date()
        });
    }
    /**
     * Create a child logger with additional context
     */
    child(context) {
        const childLogger = new Logger();
        childLogger.winston = this.winston.child(context);
        return childLogger;
    }
    /**
     * Set log level
     */
    setLevel(level) {
        this.winston.level = level;
    }
    /**
     * Get current log level
     */
    getLevel() {
        return this.winston.level;
    }
    /**
     * Close the logger and flush any pending writes
     */
    close() {
        return new Promise((resolve) => {
            this.winston.end(() => {
                resolve();
            });
        });
    }
}
exports.Logger = Logger;
/**
 * Default logger instance
 */
exports.defaultLogger = new Logger({
    level: 'info',
    console: true,
    format: 'text'
});
/**
 * Create a logger with specified configuration
 */
function createLogger(config) {
    return new Logger(config);
}
exports.createLogger = createLogger;
/**
 * Log a trade event using the default logger
 */
function logTrade(tradeData) {
    exports.defaultLogger.logTrade(tradeData);
}
exports.logTrade = logTrade;
/**
 * Log an error using the default logger
 */
function logError(error, context) {
    exports.defaultLogger.logError(error, context);
}
exports.logError = logError;
/**
 * Log system event using the default logger
 */
function logSystem(event, data) {
    exports.defaultLogger.logSystem(event, data);
}
exports.logSystem = logSystem;
