/**
 * Strategy Execution Engine
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import { IStrategyEngine, IIndicator, IndicatorConfig, StrategyExecutionStats } from '@jware-trader8/core';
import {
  StrategyConfig,
  CompiledStrategy,
  TradeSignal,
  ValidationResult,
  ValidationError,
  OHLCV,
  StrategyContext,
  CompiledCondition
} from '@jware-trader8/types';
import { Logger } from '@jware-trader8/utils';

// Import indicators
import { SimpleMovingAverage } from '../indicators/simple-moving-average';
import { ExponentialMovingAverage } from '../indicators/exponential-moving-average';
import { RelativeStrengthIndex } from '../indicators/relative-strength-index';

/**
 * Strategy execution engine implementation
 */
export class StrategyEngine implements IStrategyEngine {
  private indicatorLibrary: Map<string, new (...args: any[]) => IIndicator>;
  private logger: Logger;
  private executionStats: Map<string, StrategyExecutionStats>;

  constructor() {
    this.indicatorLibrary = new Map();
    this.logger = new Logger({
      level: 'info',
      console: true,
      format: 'text'
    });
    this.executionStats = new Map();
    
    // Register built-in indicators
    this.registerBuiltInIndicators();
  }

  /**
   * Load and compile a strategy from configuration
   */
  loadStrategy(strategyConfig: StrategyConfig): CompiledStrategy {
    this.logger.info('Loading strategy', { name: strategyConfig.name });

    // Validate strategy first
    const validation = this.validateStrategy(strategyConfig);
    if (!validation.isValid) {
      throw new Error(`Strategy validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Process parameters and resolve templating
    const processedConfig = this.processParameterTemplating(strategyConfig);

    // Initialize indicators
    const indicators = new Map<string, IIndicator>();
    for (const indicatorConfig of processedConfig.indicators) {
      const indicator = this.createIndicator(indicatorConfig);
      indicators.set(indicatorConfig.name, indicator);
    }

    // Compile signal conditions
    const buyConditions = processedConfig.signals.buy.map(condition => 
      this.compileCondition(condition, indicators)
    );
    const sellConditions = processedConfig.signals.sell.map(condition => 
      this.compileCondition(condition, indicators)
    );

    const compiledStrategy: CompiledStrategy = {
      config: processedConfig,
      indicators,
      buyConditions,
      sellConditions,
      metadata: {
        compiledAt: new Date(),
        compilerVersion: '1.0.0'
      }
    };

    // Initialize execution stats
    const strategyId = this.generateStrategyId(processedConfig);
    this.executionStats.set(strategyId, {
      strategyId,
      totalExecutions: 0,
      totalSignals: 0,
      buySignals: 0,
      sellSignals: 0,
      averageExecutionTime: 0,
      lastExecution: new Date(),
      errorCount: 0,
      successRate: 1.0
    });

    // Add ID to strategy for tracking
    (compiledStrategy as any).id = strategyId;

    this.logger.info('Strategy compiled successfully', { 
      name: strategyConfig.name,
      indicators: indicators.size,
      buyConditions: buyConditions.length,
      sellConditions: sellConditions.length
    });

    return compiledStrategy;
  }

  /**
   * Execute strategy against market data and generate signals
   */
  async executeStrategy(strategy: CompiledStrategy, marketData: OHLCV): Promise<TradeSignal[]> {
    const startTime = Date.now();
    const strategyId = (strategy as any).id;
    const stats = this.executionStats.get(strategyId);

    try {
      // Update all indicators with new market data
      for (const [name, indicator] of strategy.indicators) {
        indicator.update(marketData);
      }

      // Create strategy context
      const context: StrategyContext = {
        currentData: marketData,
        historicalData: [marketData], // Simplified - would normally maintain history
        indicators: this.getCurrentIndicatorValues(strategy.indicators),
        config: strategy.config,
        timestamp: marketData.timestamp
      };

      const signals: TradeSignal[] = [];

      // Evaluate buy conditions
      for (const condition of strategy.buyConditions) {
        if (this.evaluateCondition(condition, context)) {
          const signal: TradeSignal = {
            type: 'BUY',
            symbol: strategy.config.parameters.symbol,
            price: marketData.close,
            timestamp: marketData.timestamp,
            quantity: strategy.config.parameters.positionSize,
            reason: condition.original.description,
            strategyName: strategy.config.name,
            metadata: {
              conditionId: condition.original.id,
              priority: condition.original.priority
            }
          };
          signals.push(signal);
        }
      }

      // Evaluate sell conditions
      for (const condition of strategy.sellConditions) {
        if (this.evaluateCondition(condition, context)) {
          const signal: TradeSignal = {
            type: 'SELL',
            symbol: strategy.config.parameters.symbol,
            price: marketData.close,
            timestamp: marketData.timestamp,
            reason: condition.original.description,
            strategyName: strategy.config.name,
            metadata: {
              conditionId: condition.original.id,
              priority: condition.original.priority
            }
          };
          signals.push(signal);
        }
      }

      // Sort signals by priority
      signals.sort((a, b) => {
        const priorityA = a.metadata?.priority || 999;
        const priorityB = b.metadata?.priority || 999;
        return priorityA - priorityB;
      });

      // Update execution stats
      if (stats) {
        stats.totalExecutions++;
        stats.totalSignals += signals.length;
        stats.buySignals += signals.filter(s => s.type === 'BUY').length;
        stats.sellSignals += signals.filter(s => s.type === 'SELL').length;
        stats.lastExecution = new Date();
        
        const executionTime = Date.now() - startTime;
        stats.averageExecutionTime = (stats.averageExecutionTime * (stats.totalExecutions - 1) + executionTime) / stats.totalExecutions;
      }

      return signals;

    } catch (error) {
      if (stats) {
        stats.errorCount++;
        stats.successRate = (stats.totalExecutions - stats.errorCount) / stats.totalExecutions;
      }
      
      this.logger.error('Strategy execution failed', { 
        strategy: strategy.config.name, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      throw error;
    }
  }

  /**
   * Validate strategy configuration
   */
  validateStrategy(strategyConfig: StrategyConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate metadata
    if (!strategyConfig.name || strategyConfig.name.trim().length === 0) {
      errors.push({
        code: 'MISSING_NAME',
        message: 'Strategy name is required',
        field: 'name',
        severity: 'ERROR'
      });
    }

    // Validate parameters
    if (!strategyConfig.parameters) {
      errors.push({
        code: 'MISSING_PARAMETERS',
        message: 'Strategy parameters are required',
        field: 'parameters',
        severity: 'ERROR'
      });
    } else {
      if (!strategyConfig.parameters.symbol) {
        errors.push({
          code: 'MISSING_SYMBOL',
          message: 'Trading symbol is required',
          field: 'parameters.symbol',
          severity: 'ERROR'
        });
      }

      if (strategyConfig.parameters.positionSize <= 0 || strategyConfig.parameters.positionSize > 1) {
        errors.push({
          code: 'INVALID_POSITION_SIZE',
          message: 'Position size must be between 0 and 1',
          field: 'parameters.positionSize',
          severity: 'ERROR'
        });
      }
    }

    // Validate indicators
    if (!strategyConfig.indicators || strategyConfig.indicators.length === 0) {
      errors.push({
        code: 'NO_INDICATORS',
        message: 'At least one indicator is required',
        field: 'indicators',
        severity: 'ERROR'
      });
    } else {
      const indicatorNames = new Set<string>();
      
      for (const indicator of strategyConfig.indicators) {
        if (indicatorNames.has(indicator.name)) {
          errors.push({
            code: 'DUPLICATE_INDICATOR',
            message: `Duplicate indicator name: ${indicator.name}`,
            field: 'indicators',
            severity: 'ERROR'
          });
        }
        indicatorNames.add(indicator.name);

        if (!this.indicatorLibrary.has(indicator.type)) {
          errors.push({
            code: 'UNSUPPORTED_INDICATOR',
            message: `Unsupported indicator type: ${indicator.type}`,
            field: 'indicators',
            severity: 'ERROR'
          });
        }
      }
    }

    // Validate signals
    if (!strategyConfig.signals || !strategyConfig.signals.buy || !strategyConfig.signals.sell) {
      errors.push({
        code: 'MISSING_SIGNALS',
        message: 'Buy and sell signals are required',
        field: 'signals',
        severity: 'ERROR'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Get list of available indicators
   */
  getAvailableIndicators(): string[] {
    return Array.from(this.indicatorLibrary.keys());
  }

  /**
   * Register a new indicator
   */
  registerIndicator(name: string, indicatorClass: new (...args: any[]) => IIndicator): void {
    this.indicatorLibrary.set(name, indicatorClass);
    this.logger.info('Indicator registered', { name });
  }

  /**
   * Unregister an indicator
   */
  unregisterIndicator(name: string): void {
    this.indicatorLibrary.delete(name);
    this.logger.info('Indicator unregistered', { name });
  }

  /**
   * Get strategy execution statistics
   */
  getExecutionStats(strategyId: string): StrategyExecutionStats {
    const stats = this.executionStats.get(strategyId);
    if (!stats) {
      throw new Error(`No execution stats found for strategy: ${strategyId}`);
    }
    return { ...stats };
  }

  /**
   * Private helper methods
   */

  private registerBuiltInIndicators(): void {
    this.registerIndicator('SMA', SimpleMovingAverage);
    this.registerIndicator('EMA', ExponentialMovingAverage);
    this.registerIndicator('RSI', RelativeStrengthIndex);
  }

  private processParameterTemplating(config: StrategyConfig): StrategyConfig {
    // Simple parameter templating - replace {{ parameters.key }} with actual values
    const processedConfig = JSON.parse(JSON.stringify(config));
    
    for (const indicator of processedConfig.indicators) {
      for (const [key, value] of Object.entries(indicator.parameters)) {
        if (typeof value === 'string' && value.includes('{{')) {
          const templateMatch = value.match(/\{\{\s*parameters\.(\w+)\s*\}\}/);
          if (templateMatch) {
            const paramName = templateMatch[1];
            if (config.parameters[paramName] !== undefined) {
              indicator.parameters[key] = config.parameters[paramName];
            }
          }
        }
      }
    }
    
    return processedConfig;
  }

  private createIndicator(config: IndicatorConfig): IIndicator {
    const IndicatorClass = this.indicatorLibrary.get(config.type);
    if (!IndicatorClass) {
      throw new Error(`Unknown indicator type: ${config.type}`);
    }

    // Extract period from parameters for indicators that need it
    const period = config.parameters.period as number || config.period;
    return new IndicatorClass(period);
  }

  private compileCondition(condition: any, indicators: Map<string, IIndicator>): CompiledCondition {
    // Simplified condition compilation - in a real implementation, this would parse the expression
    return {
      original: condition,
      evaluate: (context: StrategyContext) => {
        // Simplified evaluation - just check for basic crossover patterns
        if (condition.condition.includes('sma_fast > sma_slow AND sma_fast[-1] <= sma_slow[-1]')) {
          // Check for bullish crossover
          const fastSMA = indicators.get('sma_fast');
          const slowSMA = indicators.get('sma_slow');
          
          if (fastSMA && slowSMA && fastSMA.isReady() && slowSMA.isReady()) {
            const currentFast = fastSMA.getValue(0);
            const currentSlow = slowSMA.getValue(0);
            const prevFast = fastSMA.getValue(1);
            const prevSlow = slowSMA.getValue(1);
            
            return currentFast !== null && currentSlow !== null && 
                   prevFast !== null && prevSlow !== null &&
                   currentFast > currentSlow && prevFast <= prevSlow;
          }
        }
        
        // For other conditions, return false for now
        return false;
      },
      requiredIndicators: this.extractRequiredIndicators(condition.condition)
    };
  }

  private extractRequiredIndicators(condition: string): string[] {
    // Simple regex to find indicator names - in reality would need proper parsing
    const matches = condition.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    return matches.filter(match => 
      !['AND', 'OR', 'NOT', 'close', 'open', 'high', 'low', 'volume'].includes(match)
    );
  }

  private evaluateCondition(condition: CompiledCondition, context: StrategyContext): boolean {
    try {
      return condition.evaluate(context);
    } catch (error) {
      this.logger.error('Condition evaluation failed', { 
        condition: condition.original.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  private getCurrentIndicatorValues(indicators: Map<string, IIndicator>): Map<string, number | null> {
    const values = new Map<string, number | null>();
    for (const [name, indicator] of indicators) {
      values.set(name, indicator.getValue());
    }
    return values;
  }

  private generateStrategyId(config: StrategyConfig): string {
    return `${config.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
  }
}