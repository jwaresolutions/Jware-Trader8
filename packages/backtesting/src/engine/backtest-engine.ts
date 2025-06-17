/**
 * Backtesting execution engine
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import { 
  IBacktestEngine, 
  BacktestExecutionConfig, 
  BacktestResult, 
  PerformanceMetrics,
  EquityCurvePoint,
  OHLCV,
  Trade,
  PortfolioSnapshot
} from '@jware-trader8/types';
import { Portfolio } from '../models/portfolio';
import { Logger, calculateSharpeRatio, calculateMaxDrawdown, calculateWinRate, calculateProfitFactor } from '@jware-trader8/utils';
import Decimal from 'decimal.js';

/**
 * Backtesting engine implementation
 */
export class BacktestEngine implements IBacktestEngine {
  private logger: Logger;

  constructor() {
    this.logger = new Logger({
      level: 'info',
      console: true,
      format: 'text'
    });
  }

  /**
   * Run backtest with strategy and historical data
   */
  async runBacktest(
    strategy: any,
    historicalData: OHLCV[],
    config: BacktestExecutionConfig
  ): Promise<BacktestResult> {
    const startTime = Date.now();
    
    this.logger.info('Starting backtest', {
      strategy: strategy.config?.name || 'Unknown',
      dataPoints: historicalData.length,
      startDate: config.startDate,
      endDate: config.endDate,
      initialCapital: config.portfolio.initialCash
    });

    try {
      // Initialize portfolio
      const portfolio = new Portfolio(config.portfolio);
      const trades: Trade[] = [];
      const equityCurve: EquityCurvePoint[] = [];
      
      // Track running metrics
      let peak = config.portfolio.initialCash;
      
      // Process each data point
      for (let i = 0; i < historicalData.length; i++) {
        const dataPoint = historicalData[i];
        
        // Skip data outside the configured range
        if (dataPoint.timestamp < config.startDate || dataPoint.timestamp > config.endDate) {
          continue;
        }

        try {
          // Create current prices map for portfolio valuation
          const symbol = strategy.config?.parameters?.symbol || 'UNKNOWN';
          const currentPrices = new Map([[symbol, dataPoint.close]]);
          
          // Apply risk management first
          if (config.portfolio.riskManagement) {
            const riskTrades = portfolio.applyRiskManagement(currentPrices, dataPoint.timestamp);
            trades.push(...riskTrades);
          }

          // Execute strategy if we have a strategy engine
          if (strategy && typeof strategy.executeStrategy === 'function') {
            const signals = await strategy.executeStrategy(strategy, dataPoint);
            
            // Process signals
            for (const signal of signals) {
              if (signal.type === 'BUY') {
                const quantity = this.calculatePositionSize(
                  signal.price, 
                  portfolio.getTotalValue(currentPrices),
                  config.portfolio
                );
                
                if (portfolio.canBuy(signal.symbol, signal.price, quantity)) {
                  const trade = portfolio.openPosition(
                    signal.symbol, 
                    signal.price, 
                    quantity, 
                    dataPoint.timestamp
                  );
                  trade.entryReason = signal.reason;
                  trade.strategyName = signal.strategyName;
                  trades.push(trade);
                }
              } else if (signal.type === 'SELL') {
                if (portfolio.hasPosition(signal.symbol)) {
                  const trade = portfolio.closePosition(
                    signal.symbol, 
                    signal.price, 
                    dataPoint.timestamp
                  );
                  trade.exitReason = signal.reason;
                  
                  // Update the existing trade record
                  const existingTrade = trades.find(t => t.id === trade.id);
                  if (existingTrade) {
                    Object.assign(existingTrade, trade);
                  }
                }
              }
            }
          }

          // Record equity curve point
          const totalValue = portfolio.getTotalValue(currentPrices);
          const snapshot = portfolio.getSnapshot(currentPrices, dataPoint.timestamp);
          
          // Update peak for drawdown calculation
          if (totalValue > peak) {
            peak = totalValue;
          }
          
          const drawdown = peak > 0 ? (peak - totalValue) / peak : 0;

          const equityPoint: EquityCurvePoint = {
            timestamp: dataPoint.timestamp,
            totalValue,
            cash: snapshot.cash,
            positionsValue: totalValue - snapshot.cash,
            unrealizedPnL: snapshot.unrealizedPnL,
            realizedPnL: snapshot.realizedPnL,
            drawdown
          };
          
          equityCurve.push(equityPoint);

        } catch (error) {
          this.logger.error('Error processing data point', {
            timestamp: dataPoint.timestamp,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue processing other points
        }
      }

      // Close any remaining open positions at final price
      const finalDataPoint = historicalData[historicalData.length - 1];
      const symbol = strategy.config?.parameters?.symbol || 'UNKNOWN';
      const finalPrices = new Map([[symbol, finalDataPoint.close]]);
      
      for (const [symbol] of portfolio.getPositions()) {
        if (portfolio.hasPosition(symbol)) {
          const trade = portfolio.closePosition(symbol, finalDataPoint.close, finalDataPoint.timestamp);
          trade.exitReason = 'End of backtest';
          
          const existingTrade = trades.find(t => t.id === trade.id);
          if (existingTrade) {
            Object.assign(existingTrade, trade);
          }
        }
      }

      // Get final portfolio snapshot
      const finalSnapshot = portfolio.getSnapshot(finalPrices, finalDataPoint.timestamp);

      // Calculate performance metrics
      const summary = this.calculatePerformanceMetrics(
        trades.filter(t => t.status === 'CLOSED'),
        equityCurve,
        config.portfolio.initialCash
      );

      const executionTime = Date.now() - startTime;

      const result: BacktestResult = {
        summary,
        trades: trades.filter(t => t.status === 'CLOSED'),
        equityCurve,
        finalPortfolio: finalSnapshot,
        config,
        metadata: {
          strategyName: strategy.config?.name || 'Unknown',
          executionTime,
          dataPoints: historicalData.length,
          startDate: config.startDate,
          endDate: config.endDate
        }
      };

      this.logger.info('Backtest completed', {
        strategy: result.metadata.strategyName,
        executionTime,
        totalReturn: summary.totalReturn,
        sharpeRatio: summary.sharpeRatio,
        maxDrawdown: summary.maxDrawdown,
        totalTrades: summary.totalTrades
      });

      return result;

    } catch (error) {
      this.logger.error('Backtest failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Calculate performance metrics from trades and equity curve
   */
  calculatePerformanceMetrics(
    trades: Trade[],
    equityCurve: EquityCurvePoint[],
    initialValue: number
  ): PerformanceMetrics {
    if (equityCurve.length === 0) {
      return this.getEmptyMetrics();
    }

    const finalValue = equityCurve[equityCurve.length - 1].totalValue;
    const totalReturn = (finalValue - initialValue) / initialValue;
    
    // Calculate returns for Sharpe ratio
    const returns = this.calculateReturns(equityCurve);
    const sharpeRatio = returns.length > 1 ? calculateSharpeRatio(returns) : 0;
    
    // Calculate drawdown
    const equityValues = equityCurve.map(point => point.totalValue);
    const maxDrawdown = calculateMaxDrawdown(equityValues);
    
    // Calculate time period for annualized return
    const startDate = equityCurve[0].timestamp;
    const endDate = equityCurve[equityCurve.length - 1].timestamp;
    const daysElapsed = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const yearsElapsed = daysElapsed / 365.25;
    
    const annualizedReturn = yearsElapsed > 0 ? 
      Math.pow(1 + totalReturn, 1 / yearsElapsed) - 1 : totalReturn;

    // Trade-based metrics
    const pnlValues = trades.map(t => t.pnl || 0);
    const winRate = calculateWinRate(pnlValues);
    const profitFactor = calculateProfitFactor(pnlValues);
    
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
    
    const averageWin = winningTrades.length > 0 ? 
      winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? 
      Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length) : 0;

    const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
    const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;
    const averageTradeReturn = pnlValues.length > 0 ? 
      pnlValues.reduce((sum, pnl) => sum + pnl, 0) / pnlValues.length : 0;

    // Calculate volatility (annualized)
    const dailyReturns = this.calculateDailyReturns(equityCurve);
    const volatility = dailyReturns.length > 1 ? 
      this.calculateStandardDeviation(dailyReturns) * Math.sqrt(252) : 0;

    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      profitFactor,
      averageTradeReturn,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      bestTrade,
      worstTrade,
      averageWin,
      averageLoss,
      volatility
    };
  }

  /**
   * Private helper methods
   */

  private calculatePositionSize(
    price: number, 
    portfolioValue: number, 
    portfolioConfig: any
  ): number {
    // Simple fixed percentage position sizing
    const positionValue = portfolioValue * (portfolioConfig.maxPositionSize || 0.25);
    return positionValue / price;
  }

  private calculateReturns(equityCurve: EquityCurvePoint[]): number[] {
    const returns: number[] = [];
    
    for (let i = 1; i < equityCurve.length; i++) {
      const prevValue = equityCurve[i - 1].totalValue;
      const currentValue = equityCurve[i].totalValue;
      
      if (prevValue > 0) {
        const returnValue = (currentValue - prevValue) / prevValue;
        returns.push(returnValue);
      }
    }
    
    return returns;
  }

  private calculateDailyReturns(equityCurve: EquityCurvePoint[]): number[] {
    const dailyReturns: number[] = [];
    let lastDayValue: number | null = null;
    let lastDay: string | null = null;
    
    for (const point of equityCurve) {
      const day = point.timestamp.toISOString().split('T')[0];
      
      if (lastDay && day !== lastDay && lastDayValue !== null) {
        const returnValue = (point.totalValue - lastDayValue) / lastDayValue;
        dailyReturns.push(returnValue);
      }
      
      lastDay = day;
      lastDayValue = point.totalValue;
    }
    
    return dailyReturns;
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / (values.length - 1);
    
    return Math.sqrt(variance);
  }

  private getEmptyMetrics(): PerformanceMetrics {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 1,
      averageTradeReturn: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      bestTrade: 0,
      worstTrade: 0,
      averageWin: 0,
      averageLoss: 0,
      volatility: 0
    };
  }
}