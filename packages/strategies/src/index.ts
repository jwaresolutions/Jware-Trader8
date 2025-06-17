/**
 * Strategies package exports
 * Strategy execution engine and technical indicators
 */

// Strategy Engine
export { StrategyEngine } from './engine/strategy-engine';

// Technical Indicators
export { BaseIndicator } from './indicators/base-indicator';
export { SimpleMovingAverage } from './indicators/simple-moving-average';
export { ExponentialMovingAverage } from './indicators/exponential-moving-average';
export { RelativeStrengthIndex } from './indicators/relative-strength-index';

// Re-export core interfaces for convenience
export type {
  IStrategyEngine,
  IIndicator,
  IndicatorConfig,
  StrategyExecutionStats
} from '@jware-trader8/core';

export type {
  StrategyConfig,
  CompiledStrategy,
  TradeSignal,
  ValidationResult,
  StrategyContext,
  StrategyParameters,
  SignalCondition,
  RiskConfig
} from '@jware-trader8/types';