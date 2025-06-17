/**
 * Strategies package exports
 * Strategy execution engine and technical indicators
 */
export { StrategyEngine } from './engine/strategy-engine';
export { BaseIndicator } from './indicators/base-indicator';
export { SimpleMovingAverage } from './indicators/simple-moving-average';
export { ExponentialMovingAverage } from './indicators/exponential-moving-average';
export { RelativeStrengthIndex } from './indicators/relative-strength-index';
export type { IStrategyEngine, IIndicator, IndicatorConfig, StrategyExecutionStats } from '@jware-trader8/core';
export type { StrategyConfig, CompiledStrategy, TradeSignal, ValidationResult, StrategyContext, StrategyParameters, SignalCondition, RiskConfig } from '@jware-trader8/types';
//# sourceMappingURL=index.d.ts.map