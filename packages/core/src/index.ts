/**
 * Jware-Trader8 Core Package
 * 
 * Core trading engine interfaces and implementations.
 */

// Export trading interfaces
export * from './interfaces/trading';

// Export data interfaces
export * from './interfaces/data';

// Export strategy interfaces
export * from './interfaces/strategy';

// Export mock implementations
export * from './mocks/mock-trading-provider';

// Re-export commonly used interfaces
export type {
  ITradingProvider,
  TradingProviderConfig,
  ITradingProviderFactory,
  OrderValidationResult,
  TradingSessionConfig,
  ITradingSession,
  PortfolioSummary,
  RiskCheckResult,
  TradingProviderCapabilities
} from './interfaces/trading';

export type {
  IDataProvider,
  DataProviderConfig,
  IDataProviderFactory,
  DataProviderCapabilities,
  IMarketDataCache,
  IRealTimeDataHandler,
  IDataNormalizer,
  IDataValidator,
  IMarketDataAggregator,
  IMultiDataProvider,
  DataFeedStatus
} from './interfaces/data';

export type {
  IStrategyEngine,
  IIndicator,
  IConditionEvaluator,
  IStrategyPerformanceAnalyzer,
  IStrategyOptimizer,
  IStrategyRunner,
  IStrategyPortfolioManager,
  StrategyExecutionStats,
  StrategyPerformanceReport,
  PerformanceMetrics,
  OptimizationParams,
  OptimizationResult,
  StrategyRunnerStatus,
  PortfolioPerformance,
  RiskMetrics
} from './interfaces/strategy';

export type {
  MockTradingProvider
} from './mocks/mock-trading-provider';