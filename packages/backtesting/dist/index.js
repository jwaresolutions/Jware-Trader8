"use strict";
/**
 * Jware-Trader8 Backtesting Package
 *
 * Portfolio management and backtesting engine for trading strategies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacktestEngine = exports.Portfolio = void 0;
// Export models
var portfolio_1 = require("./models/portfolio");
Object.defineProperty(exports, "Portfolio", { enumerable: true, get: function () { return portfolio_1.Portfolio; } });
// Export engine
var backtest_engine_1 = require("./engine/backtest-engine");
Object.defineProperty(exports, "BacktestEngine", { enumerable: true, get: function () { return backtest_engine_1.BacktestEngine; } });
// Export analytics (to be implemented)
// export { PerformanceCalculator } from './analytics/performance-calculator';
