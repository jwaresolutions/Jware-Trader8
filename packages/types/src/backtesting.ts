/**
 * Backtesting-specific interfaces and types for Jware-Trader8
 */

import { Trade, Position } from './trading';
import { OHLCV } from './data';

/**
 * Portfolio configuration for backtesting
 */
export interface PortfolioConfig {
  /** Initial cash amount */
  initialCash: number;
  /** Commission rate (percentage) */
  commissionRate: number;
  /** Slippage rate (percentage) */
  slippageRate?: number;
  /** Maximum position size as percentage of portfolio */
  maxPositionSize?: number;
  /** Risk management settings */
  riskManagement?: RiskManagementConfig;
}

/**
 * Risk management configuration
 */
export interface RiskManagementConfig {
  /** Stop loss percentage */
  stopLossPercent?: number;
  /** Take profit percentage */
  takeProfitPercent?: number;
  /** Maximum drawdown percentage */
  maxDrawdownPercent?: number;
  /** Position sizing method */
  positionSizing?: 'FIXED' | 'PERCENT' | 'VOLATILITY';
}

/**
 * Backtesting execution configuration
 */
export interface BacktestExecutionConfig {
  /** Portfolio configuration */
  portfolio: PortfolioConfig;
  /** Start date for backtesting */
  startDate: Date;
  /** End date for backtesting */
  endDate: Date;
  /** Benchmark symbol for comparison */
  benchmark?: string;
  /** Whether to include transaction costs */
  includeCosts: boolean;
}

/**
 * Portfolio state snapshot
 */
export interface PortfolioSnapshot {
  /** Snapshot timestamp */
  timestamp: Date;
  /** Cash balance */
  cash: number;
  /** Current positions */
  positions: Position[];
  /** Total portfolio value */
  totalValue: number;
  /** Unrealized P&L */
  unrealizedPnL: number;
  /** Realized P&L */
  realizedPnL: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Total return percentage */
  totalReturn: number;
  /** Annualized return percentage */
  annualizedReturn: number;
  /** Sharpe ratio */
  sharpeRatio: number;
  /** Maximum drawdown percentage */
  maxDrawdown: number;
  /** Win rate percentage */
  winRate: number;
  /** Profit factor */
  profitFactor: number;
  /** Average trade return */
  averageTradeReturn: number;
  /** Total number of trades */
  totalTrades: number;
  /** Number of winning trades */
  winningTrades: number;
  /** Number of losing trades */
  losingTrades: number;
  /** Best trade return */
  bestTrade: number;
  /** Worst trade return */
  worstTrade: number;
  /** Average winning trade */
  averageWin: number;
  /** Average losing trade */
  averageLoss: number;
  /** Volatility (annual) */
  volatility: number;
}

/**
 * Equity curve data point
 */
export interface EquityCurvePoint {
  /** Timestamp */
  timestamp: Date;
  /** Total portfolio value */
  totalValue: number;
  /** Cash balance */
  cash: number;
  /** Positions value */
  positionsValue: number;
  /** Unrealized P&L */
  unrealizedPnL: number;
  /** Realized P&L */
  realizedPnL: number;
  /** Drawdown from peak */
  drawdown: number;
}

/**
 * Backtest result
 */
export interface BacktestResult {
  /** Summary performance metrics */
  summary: PerformanceMetrics;
  /** All trades executed */
  trades: Trade[];
  /** Equity curve data */
  equityCurve: EquityCurvePoint[];
  /** Final portfolio state */
  finalPortfolio: PortfolioSnapshot;
  /** Backtest configuration used */
  config: BacktestExecutionConfig;
  /** Metadata */
  metadata: {
    /** Strategy name */
    strategyName: string;
    /** Execution time in milliseconds */
    executionTime: number;
    /** Data points processed */
    dataPoints: number;
    /** Start date */
    startDate: Date;
    /** End date */
    endDate: Date;
  };
}

/**
 * Trade execution context
 */
export interface TradeExecutionContext {
  /** Current market data */
  marketData: OHLCV;
  /** Available cash */
  availableCash: number;
  /** Current positions */
  positions: Map<string, Position>;
  /** Portfolio total value */
  portfolioValue: number;
}

/**
 * Portfolio interface for backtesting
 */
export interface IPortfolio {
  /** Get current cash balance */
  getCash(): number;
  
  /** Get current positions */
  getPositions(): Map<string, Position>;
  
  /** Get total portfolio value */
  getTotalValue(currentPrices: Map<string, number>): number;
  
  /** Check if can buy given symbol/quantity */
  canBuy(symbol: string, price: number, quantity: number): boolean;
  
  /** Check if has position in symbol */
  hasPosition(symbol: string): boolean;
  
  /** Open a new position */
  openPosition(symbol: string, price: number, quantity: number, timestamp: Date): Trade;
  
  /** Close an existing position */
  closePosition(symbol: string, price: number, timestamp: Date): Trade;
  
  /** Apply risk management rules */
  applyRiskManagement(currentPrices: Map<string, number>, timestamp: Date): Trade[];
  
  /** Get portfolio snapshot */
  getSnapshot(currentPrices: Map<string, number>, timestamp: Date): PortfolioSnapshot;
}

/**
 * Backtesting engine interface
 */
export interface IBacktestEngine {
  /** Run backtest with strategy and historical data */
  runBacktest(
    strategy: any,
    historicalData: OHLCV[],
    config: BacktestExecutionConfig
  ): Promise<BacktestResult>;
  
  /** Calculate performance metrics from trades and equity curve */
  calculatePerformanceMetrics(
    trades: Trade[],
    equityCurve: EquityCurvePoint[],
    initialValue: number
  ): PerformanceMetrics;
}