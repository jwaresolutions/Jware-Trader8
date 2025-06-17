/**
 * Strategy execution interface
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { StrategyConfig, TradeSignal, ValidationResult, StrategyContext, CompiledStrategy, OHLCV } from '@jware-trader8/types';
/**
 * Strategy execution engine interface
 */
export interface IStrategyEngine {
    /**
     * Load and compile a strategy from configuration
     */
    loadStrategy(strategyConfig: StrategyConfig): CompiledStrategy;
    /**
     * Execute strategy against market data and generate signals
     */
    executeStrategy(strategy: CompiledStrategy, marketData: OHLCV): Promise<TradeSignal[]>;
    /**
     * Validate strategy configuration
     */
    validateStrategy(strategyConfig: StrategyConfig): ValidationResult;
    /**
     * Get list of available indicators
     */
    getAvailableIndicators(): string[];
    /**
     * Register a new indicator
     */
    registerIndicator(name: string, indicatorClass: new (...args: any[]) => IIndicator): void;
    /**
     * Unregister an indicator
     */
    unregisterIndicator(name: string): void;
    /**
     * Get strategy execution statistics
     */
    getExecutionStats(strategyId: string): StrategyExecutionStats;
}
/**
 * Technical indicator interface
 */
export interface IIndicator {
    /**
     * Indicator name
     */
    readonly name: string;
    /**
     * Update indicator with new market data
     */
    update(data: OHLCV): void;
    /**
     * Get current indicator value
     */
    getValue(index?: number): number | null;
    /**
     * Check if indicator has enough data to produce valid values
     */
    isReady(): boolean;
    /**
     * Reset indicator state
     */
    reset(): void;
    /**
     * Get indicator configuration
     */
    getConfig(): IndicatorConfig;
    /**
     * Get all historical values
     */
    getHistory(): (number | null)[];
}
/**
 * Indicator configuration
 */
export interface IndicatorConfig {
    name: string;
    type: string;
    parameters: Record<string, any>;
    period?: number;
    source?: 'open' | 'high' | 'low' | 'close' | 'volume';
}
/**
 * Condition evaluator interface
 */
export interface IConditionEvaluator {
    /**
     * Evaluate a condition expression
     */
    evaluate(condition: string, context: StrategyContext): boolean;
    /**
     * Parse and validate condition syntax
     */
    parseCondition(condition: string): ParsedCondition;
    /**
     * Get available functions for conditions
     */
    getAvailableFunctions(): string[];
}
/**
 * Parsed condition structure
 */
export interface ParsedCondition {
    expression: string;
    requiredIndicators: string[];
    functions: string[];
    isValid: boolean;
    errors: string[];
}
/**
 * Strategy execution statistics
 */
export interface StrategyExecutionStats {
    strategyId: string;
    totalExecutions: number;
    totalSignals: number;
    buySignals: number;
    sellSignals: number;
    averageExecutionTime: number;
    lastExecution: Date;
    errorCount: number;
    successRate: number;
}
/**
 * Strategy performance analyzer interface
 */
export interface IStrategyPerformanceAnalyzer {
    /**
     * Analyze strategy performance
     */
    analyze(signals: TradeSignal[], marketData: OHLCV[]): StrategyPerformanceReport;
    /**
     * Calculate signal accuracy
     */
    calculateSignalAccuracy(signals: TradeSignal[], actualPrices: number[]): number;
    /**
     * Generate performance metrics
     */
    generateMetrics(trades: any[]): PerformanceMetrics;
}
/**
 * Strategy performance report
 */
export interface StrategyPerformanceReport {
    signalCount: number;
    buySignalCount: number;
    sellSignalCount: number;
    averageSignalStrength: number;
    signalFrequency: number;
    signalAccuracy: number;
    metrics: PerformanceMetrics;
    recommendations: string[];
}
/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    totalTrades: number;
    volatility: number;
}
/**
 * Strategy optimizer interface
 */
export interface IStrategyOptimizer {
    /**
     * Optimize strategy parameters
     */
    optimize(strategy: StrategyConfig, marketData: OHLCV[], optimizationParams: OptimizationParams): Promise<OptimizationResult>;
    /**
     * Run walk-forward analysis
     */
    walkForwardAnalysis(strategy: StrategyConfig, marketData: OHLCV[], params: WalkForwardParams): Promise<WalkForwardResult>;
}
/**
 * Optimization parameters
 */
export interface OptimizationParams {
    parameters: Record<string, ParameterRange>;
    objective: 'sharpe' | 'return' | 'profit_factor' | 'win_rate';
    maxIterations: number;
    validationSplit: number;
}
/**
 * Parameter range for optimization
 */
export interface ParameterRange {
    min: number;
    max: number;
    step: number;
}
/**
 * Optimization result
 */
export interface OptimizationResult {
    bestParameters: Record<string, any>;
    bestScore: number;
    iterations: number;
    validationScore: number;
    overfittingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    optimizedStrategy: StrategyConfig;
}
/**
 * Walk-forward analysis parameters
 */
export interface WalkForwardParams {
    trainingPeriod: number;
    testingPeriod: number;
    stepSize: number;
    reoptimizeFrequency: number;
}
/**
 * Walk-forward analysis result
 */
export interface WalkForwardResult {
    periods: WalkForwardPeriod[];
    overallMetrics: PerformanceMetrics;
    consistency: number;
    robustness: number;
}
/**
 * Walk-forward period result
 */
export interface WalkForwardPeriod {
    startDate: Date;
    endDate: Date;
    parameters: Record<string, any>;
    performance: PerformanceMetrics;
    trades: number;
}
/**
 * Strategy runner interface for live execution
 */
export interface IStrategyRunner {
    /**
     * Start running a strategy
     */
    start(strategy: CompiledStrategy): Promise<void>;
    /**
     * Stop running a strategy
     */
    stop(strategyId: string): Promise<void>;
    /**
     * Pause strategy execution
     */
    pause(strategyId: string): Promise<void>;
    /**
     * Resume strategy execution
     */
    resume(strategyId: string): Promise<void>;
    /**
     * Get running strategy status
     */
    getStatus(strategyId: string): StrategyRunnerStatus;
    /**
     * Get all running strategies
     */
    getRunningStrategies(): StrategyRunnerStatus[];
}
/**
 * Strategy runner status
 */
export interface StrategyRunnerStatus {
    strategyId: string;
    strategyName: string;
    status: 'STOPPED' | 'STARTING' | 'RUNNING' | 'PAUSED' | 'STOPPING' | 'ERROR';
    startTime?: Date;
    lastSignal?: Date;
    totalSignals: number;
    errorCount: number;
    uptime: number;
}
/**
 * Strategy portfolio manager interface
 */
export interface IStrategyPortfolioManager {
    /**
     * Add strategy to portfolio
     */
    addStrategy(strategy: CompiledStrategy, allocation: number): void;
    /**
     * Remove strategy from portfolio
     */
    removeStrategy(strategyId: string): void;
    /**
     * Update strategy allocation
     */
    updateAllocation(strategyId: string, allocation: number): void;
    /**
     * Get portfolio signals
     */
    getPortfolioSignals(marketData: OHLCV): Promise<TradeSignal[]>;
    /**
     * Get portfolio performance
     */
    getPortfolioPerformance(): PortfolioPerformance;
}
/**
 * Portfolio performance
 */
export interface PortfolioPerformance {
    totalValue: number;
    totalReturn: number;
    strategyPerformances: Map<string, PerformanceMetrics>;
    correlation: number;
    diversificationRatio: number;
    riskMetrics: RiskMetrics;
}
/**
 * Risk metrics
 */
export interface RiskMetrics {
    volatility: number;
    maxDrawdown: number;
    valueAtRisk: number;
    expectedShortfall: number;
    beta: number;
    alpha: number;
}
//# sourceMappingURL=strategy.d.ts.map