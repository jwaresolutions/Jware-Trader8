/**
 * Backtesting execution engine
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { IBacktestEngine, BacktestExecutionConfig, BacktestResult, PerformanceMetrics, EquityCurvePoint, OHLCV, Trade } from '@jware-trader8/types';
/**
 * Backtesting engine implementation
 */
export declare class BacktestEngine implements IBacktestEngine {
    private logger;
    constructor();
    /**
     * Run backtest with strategy and historical data
     */
    runBacktest(strategy: any, historicalData: OHLCV[], config: BacktestExecutionConfig): Promise<BacktestResult>;
    /**
     * Calculate performance metrics from trades and equity curve
     */
    calculatePerformanceMetrics(trades: Trade[], equityCurve: EquityCurvePoint[], initialValue: number): PerformanceMetrics;
    /**
     * Private helper methods
     */
    private calculatePositionSize;
    private calculateReturns;
    private calculateDailyReturns;
    private calculateStandardDeviation;
    private getEmptyMetrics;
}
//# sourceMappingURL=backtest-engine.d.ts.map