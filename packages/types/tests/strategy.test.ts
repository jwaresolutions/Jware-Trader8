/**
 * Test file for strategy interfaces
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import {
  StrategyConfig,
  TradeSignal,
  IndicatorConfig,
  SignalCondition,
  RiskConfig,
  ValidationResult,
  StrategyParameters,
  StrategyContext,
  StrategyMetrics,
  CompiledStrategy,
  SignalType,
  IndicatorParameter
} from '../src/strategy';

import { OHLCV } from '../src/data';

describe('Strategy Types', () => {
  test('should validate IndicatorConfig interface', () => {
    const indicatorConfig: IndicatorConfig = {
      name: 'sma_fast',
      type: 'SMA',
      parameters: {
        period: 10,
        source: 'close'
      },
      period: 10,
      source: 'close'
    };

    expect(indicatorConfig.name).toBe('sma_fast');
    expect(indicatorConfig.type).toBe('SMA');
    expect(indicatorConfig.parameters.period).toBe(10);
    expect(indicatorConfig.source).toBe('close');
  });

  test('should validate SignalCondition interface', () => {
    const signalCondition: SignalCondition = {
      id: 'buy_signal_1',
      description: 'Fast SMA crosses above slow SMA',
      condition: 'sma_fast > sma_slow',
      action: 'BUY',
      priority: 1,
      required: true
    };

    expect(signalCondition.id).toBe('buy_signal_1');
    expect(signalCondition.action).toMatch(/^(BUY|SELL|HOLD)$/);
    expect(signalCondition.priority).toBe(1);
    expect(signalCondition.required).toBe(true);
  });

  test('should validate RiskConfig interface', () => {
    const riskConfig: RiskConfig = {
      maxPositionSize: 0.1, // 10% of capital
      stopLoss: 0.05, // 5% stop loss
      takeProfit: 0.15, // 15% take profit
      maxDrawdown: 0.20, // 20% max drawdown
      maxPositions: 3,
      minTimeBetweenTrades: 60, // 1 hour
      riskPerTrade: 0.02 // 2% risk per trade
    };

    expect(riskConfig.maxPositionSize).toBe(0.1);
    expect(riskConfig.stopLoss).toBe(0.05);
    expect(riskConfig.takeProfit).toBe(0.15);
    expect(riskConfig.maxDrawdown).toBe(0.20);
    expect(riskConfig.maxPositions).toBe(3);
    expect(riskConfig.minTimeBetweenTrades).toBe(60);
    expect(riskConfig.riskPerTrade).toBe(0.02);
  });

  test('should validate StrategyParameters interface', () => {
    const strategyParams: StrategyParameters = {
      symbol: 'BTCUSD',
      positionSize: 0.1,
      timeframe: '1h',
      customParam: 'custom_value',
      numericParam: 42,
      booleanParam: true
    };

    expect(strategyParams.symbol).toBe('BTCUSD');
    expect(strategyParams.positionSize).toBe(0.1);
    expect(strategyParams.timeframe).toBe('1h');
    expect(strategyParams.customParam).toBe('custom_value');
    expect(strategyParams.numericParam).toBe(42);
    expect(strategyParams.booleanParam).toBe(true);
  });

  test('should validate complete StrategyConfig interface', () => {
    const strategyConfig: StrategyConfig = {
      name: 'SMA Crossover Strategy',
      description: 'Simple moving average crossover strategy',
      version: '1.0.0',
      parameters: {
        symbol: 'BTCUSD',
        positionSize: 0.1,
        timeframe: '1h'
      },
      indicators: [
        {
          name: 'sma_fast',
          type: 'SMA',
          parameters: { period: 10 },
          period: 10,
          source: 'close'
        },
        {
          name: 'sma_slow',
          type: 'SMA',
          parameters: { period: 20 },
          period: 20,
          source: 'close'
        }
      ],
      signals: {
        buy: [{
          id: 'buy_crossover',
          description: 'Fast SMA crosses above slow SMA',
          condition: 'sma_fast > sma_slow AND sma_fast[-1] <= sma_slow[-1]',
          action: 'BUY'
        }],
        sell: [{
          id: 'sell_crossover',
          description: 'Fast SMA crosses below slow SMA',
          condition: 'sma_fast < sma_slow AND sma_fast[-1] >= sma_slow[-1]',
          action: 'SELL'
        }]
      },
      riskManagement: {
        maxPositionSize: 0.1,
        stopLoss: 0.05,
        takeProfit: 0.15,
        maxDrawdown: 0.20
      },
      metadata: {
        author: 'Test Author',
        createdAt: new Date('2023-01-01'),
        tags: ['sma', 'crossover', 'trend-following']
      }
    };

    expect(strategyConfig.name).toBe('SMA Crossover Strategy');
    expect(strategyConfig.indicators).toHaveLength(2);
    expect(strategyConfig.signals.buy).toHaveLength(1);
    expect(strategyConfig.signals.sell).toHaveLength(1);
    expect(strategyConfig.metadata?.author).toBe('Test Author');
    expect(Array.isArray(strategyConfig.metadata?.tags)).toBe(true);
  });

  test('should validate TradeSignal interface', () => {
    const tradeSignal: TradeSignal = {
      type: 'BUY',
      symbol: 'ETHUSD',
      price: 3000,
      timestamp: new Date(),
      quantity: 1.0,
      strength: 0.85,
      reason: 'SMA crossover detected',
      strategyName: 'SMA Crossover Strategy',
      metadata: {
        indicator_values: {
          sma_fast: 3010,
          sma_slow: 2990
        }
      }
    };

    expect(tradeSignal.type).toMatch(/^(BUY|SELL|HOLD)$/);
    expect(tradeSignal.symbol).toBe('ETHUSD');
    expect(tradeSignal.price).toBe(3000);
    expect(tradeSignal.timestamp).toBeInstanceOf(Date);
    expect(tradeSignal.quantity).toBe(1.0);
    expect(tradeSignal.strength).toBe(0.85);
    expect(tradeSignal.strength).toBeGreaterThan(0);
    expect(tradeSignal.strength).toBeLessThanOrEqual(1);
  });

  test('should validate ValidationResult interface', () => {
    const validResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const invalidResult: ValidationResult = {
      isValid: false,
      errors: [
        {
          code: 'MISSING_FIELD',
          message: 'Strategy name is required',
          field: 'name',
          severity: 'ERROR'
        }
      ],
      warnings: [
        {
          code: 'DEPRECATED_PARAM',
          message: 'Parameter is deprecated',
          field: 'oldParam'
        }
      ]
    };

    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
    expect(validResult.warnings).toHaveLength(0);

    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toHaveLength(1);
    expect(invalidResult.warnings).toHaveLength(1);
    expect(invalidResult.errors[0].severity).toBe('ERROR');
  });

  test('should validate StrategyContext interface', () => {
    const currentData: OHLCV = {
      timestamp: new Date(),
      open: 50000,
      high: 51000,
      low: 49000,
      close: 50500,
      volume: 1000
    };

    const strategyContext: StrategyContext = {
      currentData,
      historicalData: [currentData],
      indicators: new Map([
        ['sma_fast', 50200],
        ['sma_slow', 49800],
        ['rsi', 65]
      ]),
      config: {
        name: 'Test Strategy',
        parameters: {
          symbol: 'BTCUSD',
          positionSize: 0.1,
          timeframe: '1h'
        },
        indicators: [],
        signals: { buy: [], sell: [] },
        riskManagement: { maxPositionSize: 0.1 }
      },
      timestamp: new Date()
    };

    expect(strategyContext.currentData).toBeDefined();
    expect(Array.isArray(strategyContext.historicalData)).toBe(true);
    expect(strategyContext.indicators).toBeInstanceOf(Map);
    expect(strategyContext.indicators.get('sma_fast')).toBe(50200);
    expect(strategyContext.config.name).toBe('Test Strategy');
    expect(strategyContext.timestamp).toBeInstanceOf(Date);
  });

  test('should validate StrategyMetrics interface', () => {
    const metrics: StrategyMetrics = {
      totalReturn: 0.25, // 25% return
      sharpeRatio: 1.8,
      maxDrawdown: 0.15, // 15% max drawdown
      winRate: 0.65, // 65% win rate
      totalTrades: 100,
      profitableTrades: 65,
      averageReturn: 0.025, // 2.5% average return per trade
      profitFactor: 2.5,
      volatility: 0.18 // 18% volatility
    };

    expect(metrics.totalReturn).toBe(0.25);
    expect(metrics.sharpeRatio).toBe(1.8);
    expect(metrics.maxDrawdown).toBe(0.15);
    expect(metrics.winRate).toBe(0.65);
    expect(metrics.totalTrades).toBe(100);
    expect(metrics.profitableTrades).toBe(65);
    expect(metrics.profitableTrades / metrics.totalTrades).toBe(metrics.winRate);
  });

  test('should validate SignalType enum values', () => {
    const buySignal: SignalType = 'BUY';
    const sellSignal: SignalType = 'SELL';
    const holdSignal: SignalType = 'HOLD';

    expect(buySignal).toBe('BUY');
    expect(sellSignal).toBe('SELL');
    expect(holdSignal).toBe('HOLD');
  });

  test('should validate IndicatorParameter types', () => {
    const stringParam: IndicatorParameter = 'close';
    const numberParam: IndicatorParameter = 14;
    const booleanParam: IndicatorParameter = true;

    expect(typeof stringParam).toBe('string');
    expect(typeof numberParam).toBe('number');
    expect(typeof booleanParam).toBe('boolean');
  });

  test('should validate CompiledStrategy interface', () => {
    const compiledStrategy: CompiledStrategy = {
      config: {
        name: 'Compiled Strategy',
        parameters: {
          symbol: 'BTCUSD',
          positionSize: 0.1,
          timeframe: '1h'
        },
        indicators: [],
        signals: { buy: [], sell: [] },
        riskManagement: { maxPositionSize: 0.1 }
      },
      indicators: new Map(),
      buyConditions: [],
      sellConditions: [],
      metadata: {
        compiledAt: new Date(),
        compilerVersion: '1.0.0'
      }
    };

    expect(compiledStrategy.config).toBeDefined();
    expect(compiledStrategy.indicators).toBeInstanceOf(Map);
    expect(Array.isArray(compiledStrategy.buyConditions)).toBe(true);
    expect(Array.isArray(compiledStrategy.sellConditions)).toBe(true);
    expect(compiledStrategy.metadata.compiledAt).toBeInstanceOf(Date);
    expect(compiledStrategy.metadata.compilerVersion).toBe('1.0.0');
  });
});