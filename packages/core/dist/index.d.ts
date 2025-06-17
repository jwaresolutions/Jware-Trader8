/**
 * Jware-Trader8 Core Package
 *
 * Core trading engine interfaces and implementations.
 */
export * from './interfaces/trading';
export * from './interfaces/data';
export * from './interfaces/strategy';
export * from './mocks/mock-trading-provider';
export type { ITradingProvider, TradingProviderConfig, ITradingProviderFactory, OrderValidationResult, TradingSessionConfig, ITradingSession, PortfolioSummary, RiskCheckResult, TradingProviderCapabilities } from './interfaces/trading';
export type { IDataProvider, DataProviderConfig, IDataProviderFactory, DataProviderCapabilities, IMarketDataCache, IRealTimeDataHandler, IDataNormalizer, IDataValidator, IMarketDataAggregator, IMultiDataProvider, DataFeedStatus } from './interfaces/data';
export type { IStrategyEngine, IIndicator, IConditionEvaluator, IStrategyPerformanceAnalyzer, IStrategyOptimizer, IStrategyRunner, IStrategyPortfolioManager, StrategyExecutionStats, StrategyPerformanceReport, PerformanceMetrics, OptimizationParams, OptimizationResult, StrategyRunnerStatus, PortfolioPerformance, RiskMetrics } from './interfaces/strategy';
export type { MockTradingProvider } from './mocks/mock-trading-provider';
//# sourceMappingURL=index.d.ts.map