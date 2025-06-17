/**
 * Test file for configuration interfaces
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import {
  ApiKeyPair,
  AlpacaConfig,
  PolygonConfig,
  DatabaseConfig,
  LoggingConfig,
  TradingConfig,
  BacktestConfig,
  CacheConfig,
  AppConfig,
  IConfigStore,
  ConfigValidationResult,
  ConfigHistoryEntry,
  EnvironmentVariables
} from '../src/config';

describe('Configuration Types', () => {
  test('should validate ApiKeyPair interface', () => {
    const apiKeyPair: ApiKeyPair = {
      apiKey: 'test-api-key',
      secretKey: 'test-secret-key'
    };

    expect(apiKeyPair.apiKey).toBe('test-api-key');
    expect(apiKeyPair.secretKey).toBe('test-secret-key');
    expect(typeof apiKeyPair.apiKey).toBe('string');
    expect(typeof apiKeyPair.secretKey).toBe('string');
  });

  test('should validate AlpacaConfig interface', () => {
    const alpacaConfig: AlpacaConfig = {
      apiKey: 'alpaca-api-key',
      secretKey: 'alpaca-secret-key',
      baseUrl: 'https://paper-api.alpaca.markets',
      paperTrading: true,
      apiVersion: 'v2'
    };

    expect(alpacaConfig.apiKey).toBe('alpaca-api-key');
    expect(alpacaConfig.secretKey).toBe('alpaca-secret-key');
    expect(alpacaConfig.baseUrl).toContain('alpaca.markets');
    expect(alpacaConfig.paperTrading).toBe(true);
    expect(alpacaConfig.apiVersion).toBe('v2');
  });

  test('should validate PolygonConfig interface', () => {
    const polygonConfig: PolygonConfig = {
      apiKey: 'polygon-api-key',
      baseUrl: 'https://api.polygon.io',
      apiVersion: 'v2',
      rateLimit: {
        requestsPerMinute: 5,
        requestsPerDay: 1000
      }
    };

    expect(polygonConfig.apiKey).toBe('polygon-api-key');
    expect(polygonConfig.baseUrl).toContain('polygon.io');
    expect(polygonConfig.rateLimit?.requestsPerMinute).toBe(5);
    expect(polygonConfig.rateLimit?.requestsPerDay).toBe(1000);
  });

  test('should validate DatabaseConfig interface', () => {
    const dbConfig: DatabaseConfig = {
      path: './data/jware-trader8.db',
      encryptionKey: 'encryption-key-123',
      enableWAL: true,
      timeout: 30000,
      maxConnections: 10
    };

    expect(dbConfig.path).toBe('./data/jware-trader8.db');
    expect(dbConfig.encryptionKey).toBe('encryption-key-123');
    expect(dbConfig.enableWAL).toBe(true);
    expect(dbConfig.timeout).toBe(30000);
    expect(dbConfig.maxConnections).toBe(10);
  });

  test('should validate LoggingConfig interface', () => {
    const loggingConfig: LoggingConfig = {
      level: 'info',
      filePath: './logs/app.log',
      maxFileSize: 50,
      maxFiles: 5,
      console: true,
      format: 'json'
    };

    expect(loggingConfig.level).toMatch(/^(debug|info|warn|error)$/);
    expect(loggingConfig.filePath).toBe('./logs/app.log');
    expect(loggingConfig.maxFileSize).toBe(50);
    expect(loggingConfig.maxFiles).toBe(5);
    expect(loggingConfig.console).toBe(true);
    expect(loggingConfig.format).toMatch(/^(json|text)$/);
  });

  test('should validate TradingConfig interface', () => {
    const tradingConfig: TradingConfig = {
      defaultPositionSize: 0.1,
      maxPositions: 5,
      commission: 0.001,
      slippage: 0.0005,
      minTimeBetweenTrades: 60,
      paperTrading: true,
      riskManagement: {
        maxDrawdown: 0.20,
        dailyLossLimit: 1000,
        stopOnLossLimit: true
      }
    };

    expect(tradingConfig.defaultPositionSize).toBe(0.1);
    expect(tradingConfig.maxPositions).toBe(5);
    expect(tradingConfig.commission).toBe(0.001);
    expect(tradingConfig.slippage).toBe(0.0005);
    expect(tradingConfig.minTimeBetweenTrades).toBe(60);
    expect(tradingConfig.paperTrading).toBe(true);
    expect(tradingConfig.riskManagement.maxDrawdown).toBe(0.20);
    expect(tradingConfig.riskManagement.dailyLossLimit).toBe(1000);
    expect(tradingConfig.riskManagement.stopOnLossLimit).toBe(true);
  });

  test('should validate BacktestConfig interface', () => {
    const backtestConfig: BacktestConfig = {
      initialCapital: 10000,
      positionSizing: 'PERCENTAGE',
      positionSize: 0.1,
      commission: 0.001,
      slippage: 0.0005,
      includeExtendedHours: false,
      benchmark: 'SPY'
    };

    expect(backtestConfig.initialCapital).toBe(10000);
    expect(backtestConfig.positionSizing).toMatch(/^(FIXED|PERCENTAGE|KELLY|RISK_BASED)$/);
    expect(backtestConfig.positionSize).toBe(0.1);
    expect(backtestConfig.commission).toBe(0.001);
    expect(backtestConfig.slippage).toBe(0.0005);
    expect(backtestConfig.includeExtendedHours).toBe(false);
    expect(backtestConfig.benchmark).toBe('SPY');
  });

  test('should validate CacheConfig interface', () => {
    const cacheConfig: CacheConfig = {
      directory: './data/cache',
      defaultTTL: 3600,
      maxSize: 1024,
      compression: true,
      cleanupInterval: 60
    };

    expect(cacheConfig.directory).toBe('./data/cache');
    expect(cacheConfig.defaultTTL).toBe(3600);
    expect(cacheConfig.maxSize).toBe(1024);
    expect(cacheConfig.compression).toBe(true);
    expect(cacheConfig.cleanupInterval).toBe(60);
  });

  test('should validate complete AppConfig interface', () => {
    const appConfig: AppConfig = {
      environment: 'development',
      port: 3000,
      host: 'localhost',
      trading: {
        defaultPositionSize: 0.1,
        maxPositions: 3,
        commission: 0.001,
        slippage: 0.0005,
        minTimeBetweenTrades: 60,
        paperTrading: true,
        riskManagement: {
          maxDrawdown: 0.20,
          dailyLossLimit: 1000,
          stopOnLossLimit: true
        }
      },
      database: {
        path: './data/app.db',
        encryptionKey: 'test-key'
      },
      logging: {
        level: 'info',
        console: true
      },
      cache: {
        directory: './cache',
        defaultTTL: 3600,
        maxSize: 512,
        compression: true,
        cleanupInterval: 60
      },
      providers: {
        alpaca: {
          apiKey: 'alpaca-key',
          secretKey: 'alpaca-secret',
          baseUrl: 'https://paper-api.alpaca.markets'
        },
        polygon: {
          apiKey: 'polygon-key'
        }
      },
      features: {
        realTimeData: true,
        paperTrading: true,
        backtesting: true,
        api: false
      }
    };

    expect(appConfig.environment).toMatch(/^(development|staging|production)$/);
    expect(appConfig.port).toBe(3000);
    expect(appConfig.host).toBe('localhost');
    expect(appConfig.trading).toBeDefined();
    expect(appConfig.database).toBeDefined();
    expect(appConfig.logging).toBeDefined();
    expect(appConfig.cache).toBeDefined();
    expect(appConfig.providers.alpaca).toBeDefined();
    expect(appConfig.providers.polygon).toBeDefined();
    expect(appConfig.features?.realTimeData).toBe(true);
    expect(appConfig.features?.paperTrading).toBe(true);
    expect(appConfig.features?.backtesting).toBe(true);
    expect(appConfig.features?.api).toBe(false);
  });

  test('should validate ConfigValidationResult interface', () => {
    const validationResult: ConfigValidationResult = {
      isValid: false,
      errors: [
        {
          key: 'trading.defaultPositionSize',
          message: 'Position size must be between 0 and 1',
          code: 'INVALID_RANGE'
        }
      ],
      warnings: [
        {
          key: 'logging.level',
          message: 'Debug level may impact performance',
          code: 'PERFORMANCE_WARNING'
        }
      ]
    };

    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toHaveLength(1);
    expect(validationResult.warnings).toHaveLength(1);
    expect(validationResult.errors[0].key).toBe('trading.defaultPositionSize');
    expect(validationResult.errors[0].code).toBe('INVALID_RANGE');
    expect(validationResult.warnings[0].code).toBe('PERFORMANCE_WARNING');
  });

  test('should validate ConfigHistoryEntry interface', () => {
    const historyEntry: ConfigHistoryEntry = {
      key: 'trading.commission',
      value: 0.001,
      timestamp: new Date('2023-01-01T12:00:00Z'),
      changedBy: 'admin'
    };

    expect(historyEntry.key).toBe('trading.commission');
    expect(historyEntry.value).toBe(0.001);
    expect(historyEntry.timestamp).toBeInstanceOf(Date);
    expect(historyEntry.changedBy).toBe('admin');
  });

  test('should validate EnvironmentVariables interface', () => {
    const envVars: EnvironmentVariables = {
      NODE_ENV: 'development',
      DB_ENCRYPTION_KEY: 'env-encryption-key',
      ALPACA_API_KEY: 'env-alpaca-key',
      ALPACA_SECRET_KEY: 'env-alpaca-secret',
      POLYGON_API_KEY: 'env-polygon-key',
      LOG_LEVEL: 'debug',
      PORT: '3000'
    };

    expect(envVars.NODE_ENV).toBe('development');
    expect(envVars.DB_ENCRYPTION_KEY).toBe('env-encryption-key');
    expect(envVars.ALPACA_API_KEY).toBe('env-alpaca-key');
    expect(envVars.ALPACA_SECRET_KEY).toBe('env-alpaca-secret');
    expect(envVars.POLYGON_API_KEY).toBe('env-polygon-key');
    expect(envVars.LOG_LEVEL).toBe('debug');
    expect(envVars.PORT).toBe('3000');
  });

  test('should validate minimal required configurations', () => {
    const minimalTradingConfig: TradingConfig = {
      defaultPositionSize: 0.05,
      maxPositions: 1,
      commission: 0,
      slippage: 0,
      minTimeBetweenTrades: 0,
      paperTrading: true,
      riskManagement: {
        maxDrawdown: 1.0,
        dailyLossLimit: 0,
        stopOnLossLimit: false
      }
    };

    const minimalDbConfig: DatabaseConfig = {
      path: ':memory:',
      encryptionKey: 'test'
    };

    expect(minimalTradingConfig.defaultPositionSize).toBeGreaterThan(0);
    expect(minimalTradingConfig.maxPositions).toBeGreaterThan(0);
    expect(minimalDbConfig.path).toBe(':memory:');
    expect(minimalDbConfig.encryptionKey).toBeTruthy();
  });

  test('should validate configuration boundaries', () => {
    const config: TradingConfig = {
      defaultPositionSize: 0.5, // 50% max reasonable
      maxPositions: 10,
      commission: 0.01, // 1% max reasonable
      slippage: 0.005, // 0.5% max reasonable
      minTimeBetweenTrades: 1,
      paperTrading: false,
      riskManagement: {
        maxDrawdown: 0.5, // 50% max reasonable
        dailyLossLimit: 10000,
        stopOnLossLimit: true
      }
    };

    expect(config.defaultPositionSize).toBeLessThanOrEqual(1.0);
    expect(config.commission).toBeLessThanOrEqual(0.1);
    expect(config.slippage).toBeLessThanOrEqual(0.1);
    expect(config.riskManagement.maxDrawdown).toBeLessThanOrEqual(1.0);
  });

  test('should validate logging levels', () => {
    const logLevels: LoggingConfig['level'][] = ['debug', 'info', 'warn', 'error'];
    
    logLevels.forEach(level => {
      const config: LoggingConfig = {
        level,
        console: true
      };
      expect(config.level).toMatch(/^(debug|info|warn|error)$/);
    });
  });

  test('should validate position sizing strategies', () => {
    const strategies: BacktestConfig['positionSizing'][] = ['FIXED', 'PERCENTAGE', 'KELLY', 'RISK_BASED'];
    
    strategies.forEach(strategy => {
      const config: BacktestConfig = {
        initialCapital: 10000,
        positionSizing: strategy,
        positionSize: 0.1,
        commission: 0.001,
        slippage: 0.0005,
        includeExtendedHours: false
      };
      expect(config.positionSizing).toMatch(/^(FIXED|PERCENTAGE|KELLY|RISK_BASED)$/);
    });
  });
});