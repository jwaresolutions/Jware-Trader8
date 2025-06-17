/**
 * Strategy Execution Engine
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
import { IStrategyEngine, IIndicator, StrategyExecutionStats } from '@jware-trader8/core';
import { StrategyConfig, CompiledStrategy, TradeSignal, ValidationResult, OHLCV } from '@jware-trader8/types';
/**
 * Strategy execution engine implementation
 */
export declare class StrategyEngine implements IStrategyEngine {
    private indicatorLibrary;
    private logger;
    private executionStats;
    constructor();
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
    /**
     * Private helper methods
     */
    private registerBuiltInIndicators;
    private processParameterTemplating;
    private createIndicator;
    private compileCondition;
    private extractRequiredIndicators;
    private evaluateCondition;
    private getCurrentIndicatorValues;
    private generateStrategyId;
}
//# sourceMappingURL=strategy-engine.d.ts.map