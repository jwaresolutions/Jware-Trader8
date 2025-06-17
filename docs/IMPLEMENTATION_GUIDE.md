# Jware-Trader8 Implementation Guide with TDD Anchors

## Test-Driven Development Approach

### TDD Cycle for Each Module
1. **Red**: Write failing test that defines desired behavior
2. **Green**: Write minimal code to make test pass
3. **Refactor**: Improve code while keeping tests green
4. **Repeat**: Continue for each feature increment

## Module Implementation Order & TDD Anchors

### Phase 1: Foundation Types & Utilities

#### 1.1 Core Types Package (`packages/types/`)

**Test Anchor**: Type validation and interface compliance
```typescript
// packages/types/tests/trading.test.ts
describe('Trading Types', () => {
  test('should validate Account interface structure', () => {
    const account: Account = {
      id: 'test-account',
      balance: 10000,
      buyingPower: 8000,
      positions: []
    }
    
    expect(account).toBeDefined()
    expect(typeof account.balance).toBe('number')
    expect(Array.isArray(account.positions)).toBe(true)
  })
  
  test('should validate Order interface with all required fields', () => {
    const order: Order = {
      id: 'order-123',
      symbol: 'BTCUSD',
      side: 'BUY',
      quantity: 0.1,
      price: 50000,
      status: 'PENDING',
      timestamp: new Date()
    }
    
    expect(order.side).toMatch(/^(BUY|SELL)$/)
    expect(order.status).toMatch(/^(PENDING|FILLED|CANCELLED|REJECTED)$/)
  })
})
```

**Implementation Steps**:
1. Define basic trading interfaces (`Account`, `Order`, `Position`)
2. Define data provider interfaces (`OHLCV`, `Quote`, `MarketData`)
3. Define strategy interfaces (`StrategyConfig`, `TradeSignal`)
4. Add comprehensive JSDoc documentation

#### 1.2 Utilities Package (`packages/utils/`)

**Test Anchor**: Utility function correctness and edge cases
```typescript
// packages/utils/tests/math.test.ts
describe('Math Utilities', () => {
  test('should calculate percentage change correctly', () => {
    expect(calculatePercentageChange(100, 110)).toBe(10)
    expect(calculatePercentageChange(100, 90)).toBe(-10)
    expect(calculatePercentageChange(0, 10)).toBe(Infinity)
  })
  
  test('should handle precision in financial calculations', () => {
    const result = roundToDecimalPlaces(0.123456789, 4)
    expect(result).toBe(0.1235)
    expect(typeof result).toBe('number')
  })
})

// packages/utils/tests/logger.test.ts
describe('Logger', () => {
  test('should log trade events with structured format', () => {
    const mockWrite = jest.fn()
    const logger = new Logger({ write: mockWrite })
    
    logger.logTrade({
      action: 'BUY',
      symbol: 'BTCUSD',
      price: 50000,
      quantity: 0.1
    })
    
    expect(mockWrite).toHaveBeenCalledWith(
      expect.stringContaining('TRADE')
    )
  })
})
```

**Implementation Steps**:
1. Math utilities (percentage calculations, rounding, statistics)
2. Logger with structured output for trading events
3. Validation utilities (schema validation, input sanitization)
4. Time utilities (market hours, timezone handling)
5. Cryptographic utilities (API key encryption)

### Phase 2: Core Trading Engine

#### 2.1 Core Interfaces (`packages/core/`)

**Test Anchor**: Interface contract compliance
```typescript
// packages/core/tests/trading-provider.test.ts
describe('ITradingProvider Interface', () => {
  let mockProvider: ITradingProvider
  
  beforeEach(() => {
    mockProvider = new MockTradingProvider()
  })
  
  test('should connect and return account info', async () => {
    const result = await mockProvider.connect()
    
    expect(result.success).toBe(true)
    expect(result.accountInfo).toBeDefined()
    expect(result.accountInfo.balance).toBeGreaterThan(0)
  })
  
  test('should place buy order with valid parameters', async () => {
    const order = await mockProvider.placeBuyOrder('BTCUSD', 0.1, 'MARKET')
    
    expect(order.id).toBeDefined()
    expect(order.symbol).toBe('BTCUSD')
    expect(order.side).toBe('BUY')
    expect(order.status).toMatch(/^(PENDING|FILLED)$/)
  })
  
  test('should reject order with insufficient funds', async () => {
    jest.spyOn(mockProvider, 'getAccount').mockResolvedValue({
      balance: 100, // Insufficient for large order
      buyingPower: 100
    } as Account)
    
    await expect(
      mockProvider.placeBuyOrder('BTCUSD', 10, 'MARKET', 50000)
    ).rejects.toThrow('Insufficient buying power')
  })
})
```

**Implementation Steps**:
1. Define `ITradingProvider` interface with all methods
2. Define `IDataProvider` interface for market data
3. Create mock implementations for testing
4. Implement provider factory pattern
5. Add connection management and error handling

#### 2.2 Provider Implementations (`packages/providers/`)

**Test Anchor**: Provider-specific behavior and API integration
```typescript
// packages/providers/tests/alpaca-provider.test.ts
describe('AlpacaTradingProvider', () => {
  let provider: AlpacaTradingProvider
  let mockAlpacaClient: jest.Mocked<AlpacaApi>
  
  beforeEach(() => {
    mockAlpacaClient = createMockAlpacaClient()
    provider = new AlpacaTradingProvider({
      apiKey: 'test-key',
      secretKey: 'test-secret',
      baseUrl: 'https://paper-api.alpaca.markets'
    })
    provider['alpacaClient'] = mockAlpacaClient
  })
  
  test('should handle Alpaca API response format correctly', async () => {
    mockAlpacaClient.getAccount.mockResolvedValue({
      id: 'alpaca-account-123',
      cash: '10000.00',
      buying_power: '40000.00'
    })
    
    const account = await provider.getAccount()
    
    expect(account.balance).toBe(10000)
    expect(account.buyingPower).toBe(40000)
  })
  
  test('should handle API rate limiting gracefully', async () => {
    mockAlpacaClient.getAccount.mockRejectedValueOnce(
      new Error('Rate limit exceeded')
    )
    
    // Should retry after delay
    setTimeout(() => {
      mockAlpacaClient.getAccount.mockResolvedValue({
        cash: '10000.00'
      })
    }, 1000)
    
    const account = await provider.getAccount()
    expect(account).toBeDefined()
  })
})
```

**Implementation Steps**:
1. Implement `AlpacaTradingProvider` with full API integration
2. Implement `PolygonDataProvider` with data fetching and caching
3. Add WebSocket support for real-time data
4. Implement rate limiting and retry logic
5. Add comprehensive error handling

### Phase 3: Strategy Engine

#### 3.1 Technical Indicators (`packages/strategies/indicators/`)

**Test Anchor**: Mathematical accuracy and edge cases
```typescript
// packages/strategies/tests/indicators.test.ts
describe('Technical Indicators', () => {
  describe('SimpleMovingAverage', () => {
    test('should calculate SMA correctly with known data', () => {
      const sma = new SimpleMovingAverage(3)
      const prices = [10, 20, 30, 40, 50]
      const expectedResults = [null, null, 20, 30, 40]
      
      prices.forEach((price, index) => {
        sma.update({ close: price } as OHLCV)
        expect(sma.getValue()).toBe(expectedResults[index])
      })
    })
    
    test('should handle insufficient data gracefully', () => {
      const sma = new SimpleMovingAverage(5)
      sma.update({ close: 100 } as OHLCV)
      
      expect(sma.getValue()).toBeNull()
      expect(sma.isReady()).toBe(false)
    })
  })
  
  describe('RelativeStrengthIndex', () => {
    test('should calculate RSI with textbook example', () => {
      const rsi = new RelativeStrengthIndex(14)
      // Use known price series with expected RSI values
      const testData = [
        { price: 44.34, expectedRSI: null },
        { price: 44.09, expectedRSI: null },
        // ... 14 data points with expected RSI values
        { price: 46.23, expectedRSI: 70.53 }
      ]
      
      testData.forEach(({ price, expectedRSI }) => {
        rsi.update({ close: price } as OHLCV)
        if (expectedRSI !== null) {
          expect(rsi.getValue()).toBeCloseTo(expectedRSI, 2)
        }
      })
    })
  })
})
```

**Implementation Steps**:
1. Implement base indicator class with common functionality
2. Implement SMA, EMA, RSI, MACD, Bollinger Bands
3. Add indicator factory for dynamic creation
4. Implement indicator chaining and composition
5. Add performance optimizations for large datasets

#### 3.2 Strategy Parser & Validator (`packages/strategies/parser/`)

**Test Anchor**: YAML parsing and validation accuracy
```typescript
// packages/strategies/tests/parser.test.ts
describe('Strategy Parser', () => {
  test('should parse valid strategy YAML correctly', () => {
    const yamlContent = `
      name: "Test Strategy"
      parameters:
        symbol: "BTCUSD"
        position_size: 0.1
      indicators:
        - name: "sma_fast"
          type: "SMA"
          period: 10
      signals:
        buy:
          - condition: "close > sma_fast"
            action: "BUY"
    `
    
    const strategy = parseStrategy(yamlContent)
    
    expect(strategy.name).toBe("Test Strategy")
    expect(strategy.parameters.symbol).toBe("BTCUSD")
    expect(strategy.indicators).toHaveLength(1)
    expect(strategy.signals.buy).toHaveLength(1)
  })
  
  test('should validate strategy schema and reject invalid configs', () => {
    const invalidYaml = `
      name: ""  # Invalid: empty name
      parameters:
        position_size: 1.5  # Invalid: > 1.0
      # Missing required fields
    `
    
    expect(() => parseStrategy(invalidYaml)).toThrow()
  })
})
```

**Implementation Steps**:
1. YAML parser with schema validation
2. Parameter templating system (`{{ parameters.value }}`)
3. Strategy compilation and optimization
4. Condition syntax validation
5. Runtime strategy validation

#### 3.3 Strategy Execution Engine

**Test Anchor**: Signal generation accuracy
```typescript
// packages/strategies/tests/execution.test.ts
describe('Strategy Execution', () => {
  test('should generate buy signal on SMA crossover', async () => {
    const strategyConfig = createTestStrategy({
      indicators: [
        { name: 'sma_fast', type: 'SMA', period: 5 },
        { name: 'sma_slow', type: 'SMA', period: 10 }
      ],
      signals: {
        buy: [{
          condition: 'sma_fast > sma_slow AND sma_fast[-1] <= sma_slow[-1]',
          action: 'BUY'
        }]
      }
    })
    
    const engine = new StrategyEngine()
    const strategy = engine.loadStrategy(strategyConfig)
    
    // Feed data that creates crossover
    const marketData = createCrossoverData()
    const signals = await engine.executeStrategy(strategy, marketData)
    
    expect(signals).toHaveLength(1)
    expect(signals[0].type).toBe('BUY')
    expect(signals[0].reason).toContain('crossover')
  })
})
```

### Phase 4: Backtesting Engine

#### 4.1 Portfolio Management (`packages/backtesting/models/`)

**Test Anchor**: Portfolio math accuracy
```typescript
// packages/backtesting/tests/portfolio.test.ts
describe('Portfolio Management', () => {
  test('should track cash and positions correctly', () => {
    const portfolio = new Portfolio(10000) // $10,000 initial cash
    
    expect(portfolio.cash).toBe(10000)
    expect(portfolio.getTotalValue()).toBe(10000)
    
    // Buy $1000 of BTCUSD at $50,000
    const trade = portfolio.openPosition('BTCUSD', 50000, 0.02)
    
    expect(portfolio.cash).toBe(9000) // $10,000 - $1,000
    expect(portfolio.getPosition('BTCUSD').quantity).toBe(0.02)
    expect(trade.entryPrice).toBe(50000)
  })
  
  test('should calculate P&L correctly on position close', () => {
    const portfolio = new Portfolio(10000)
    portfolio.openPosition('BTCUSD', 50000, 0.02) // Buy at $50,000
    
    const closeTrade = portfolio.closePosition('BTCUSD', 55000) // Sell at $55,000
    
    expect(closeTrade.pnl).toBe(100) // 0.02 * ($55,000 - $50,000) = $100
    expect(portfolio.cash).toBe(10100) // $9,000 + $1,100 sale
  })
})
```

**Implementation Steps**:
1. Portfolio model with position tracking
2. P&L calculation with commissions and slippage
3. Risk management integration
4. Performance metrics calculation
5. Trade history management

#### 4.2 Backtest Execution Engine

**Test Anchor**: Backtesting accuracy and performance
```typescript
// packages/backtesting/tests/engine.test.ts
describe('Backtest Engine', () => {
  test('should execute strategy over historical data', async () => {
    const strategy = createTestStrategy()
    const historicalData = createTestPriceData(1000) // 1000 data points
    const config = { initialCapital: 10000, positionSize: 0.1 }
    
    const result = await backtestEngine.runBacktest(strategy, historicalData, config)
    
    expect(result.summary.totalTrades).toBeGreaterThan(0)
    expect(result.trades).toBeDefined()
    expect(result.equityCurve).toHaveLength(1000)
    expect(result.summary.totalReturn).toBeDefined()
  })
  
  test('should handle drawdown and risk management', async () => {
    const strategy = createHighRiskStrategy()
    const volatileData = createVolatilePriceData()
    
    const result = await backtestEngine.runBacktest(strategy, volatileData, {
      initialCapital: 10000,
      maxDrawdown: 0.10 // 10% max drawdown
    })
    
    expect(result.summary.maxDrawdown).toBeLessThanOrEqual(0.10)
  })
})
```

### Phase 5: Database & Configuration

#### 5.1 Configuration Storage (`packages/database/stores/`)

**Test Anchor**: Data persistence and encryption
```typescript
// packages/database/tests/config-store.test.ts
describe('Configuration Store', () => {
  test('should encrypt and store API keys securely', async () => {
    const store = new ConfigStore(':memory:', 'test-encryption-key')
    
    await store.setApiKey('alpaca', 'test-api-key', 'test-secret')
    const retrieved = await store.getApiKey('alpaca')
    
    expect(retrieved.apiKey).toBe('test-api-key')
    expect(retrieved.secretKey).toBe('test-secret')
    
    // Verify encryption by checking raw database
    const rawData = await store.getRawApiKey('alpaca')
    expect(rawData.api_key).not.toBe('test-api-key') // Should be encrypted
  })
  
  test('should handle configuration versioning', async () => {
    const store = new ConfigStore(':memory:', 'test-key')
    
    await store.setConfig('trading.position_size', 0.1)
    await store.setConfig('trading.position_size', 0.2) // Update
    
    const current = await store.getConfig('trading.position_size')
    const history = await store.getConfigHistory('trading.position_size')
    
    expect(current).toBe(0.2)
    expect(history).toHaveLength(2)
  })
})
```

### Phase 6: CLI Interface

#### 6.1 CLI Commands (`packages/cli/commands/`)

**Test Anchor**: Command execution and user interaction
```typescript
// packages/cli/tests/commands.test.ts
describe('CLI Commands', () => {
  test('should execute backtest command with proper output', async () => {
    const mockConsole = jest.spyOn(console, 'log').mockImplementation()
    const command = new BacktestCommand()
    
    await command.execute([
      'backtest',
      'strategies/examples/sma_crossover.yaml',
      '--symbol', 'BTCUSD',
      '--start', '2023-01-01',
      '--end', '2023-12-31'
    ])
    
    expect(mockConsole).toHaveBeenCalledWith(
      expect.stringContaining('Backtest Results')
    )
    expect(mockConsole).toHaveBeenCalledWith(
      expect.stringContaining('Total Return')
    )
  })
  
  test('should handle configuration commands securely', async () => {
    const mockPrompt = jest.fn().mockResolvedValue('test-api-key')
    const command = new ConfigCommand()
    command.prompt = mockPrompt
    
    await command.execute(['config', 'set-keys', '--provider', 'alpaca'])
    
    expect(mockPrompt).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'password' })
    )
  })
})
```

## Integration Testing Strategy

### End-to-End Workflow Tests
```typescript
// tests/integration/full-workflow.test.ts
describe('Full Trading Workflow', () => {
  test('should execute complete trading cycle', async () => {
    // 1. Configure API keys
    await configStore.setApiKey('alpaca', TEST_API_KEY, TEST_SECRET)
    
    // 2. Load and validate strategy
    const strategy = await loadStrategy('strategies/examples/sma_crossover.yaml')
    expect(strategy).toBeDefined()
    
    // 3. Run backtest
    const backtestResult = await runBacktest(strategy, {
      symbol: 'BTCUSD',
      start: '2023-01-01',
      end: '2023-12-31'
    })
    expect(backtestResult.summary.totalTrades).toBeGreaterThan(0)
    
    // 4. Execute paper trading (if backtest successful)
    if (backtestResult.summary.totalReturn > 0) {
      const tradingSession = await startPaperTrading(strategy)
      expect(tradingSession.isActive).toBe(true)
    }
  })
})
```

### Performance Benchmarks
```typescript
// tests/performance/benchmarks.test.ts
describe('Performance Benchmarks', () => {
  test('should process 1M data points within time limit', async () => {
    const startTime = Date.now()
    const largeDataset = generateTestData(1000000)
    
    const result = await backtestEngine.runBacktest(
      testStrategy,
      largeDataset,
      testConfig
    )
    
    const executionTime = Date.now() - startTime
    expect(executionTime).toBeLessThan(30000) // 30 seconds max
    expect(result.trades.length).toBeGreaterThan(0)
  })
})
```

## Continuous Integration Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          ALPACA_API_KEY: ${{ secrets.ALPACA_TEST_KEY }}
          POLYGON_API_KEY: ${{ secrets.POLYGON_TEST_KEY }}
      
      - name: Run coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run dependency check
        run: npx audit-ci --moderate
```

## Quality Gates & Release Criteria

### Definition of Done for Each Module
1. **Code Complete**: All planned features implemented
2. **Tests Passing**: Unit tests ≥95% coverage, integration tests passing
3. **Documentation**: API docs, user guides, and examples complete
4. **Performance**: Meets specified performance benchmarks
5. **Security**: Security audit passed, no high/critical vulnerabilities
6. **Integration**: Works with other modules without breaking changes

### Release Readiness Checklist
- [ ] All modules pass quality gates
- [ ] End-to-end workflows tested
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation reviewed and updated
- [ ] Example strategies tested
- [ ] CLI commands verified
- [ ] Docker setup tested
- [ ] Migration scripts tested (if applicable)
- [ ] Rollback plan prepared

This implementation guide provides clear TDD anchors for each development phase, ensuring that:
1. **Every feature is tested first** - Tests define behavior before implementation
2. **Quality is built-in** - Comprehensive test coverage at all levels
3. **Progress is measurable** - Clear success criteria for each phase
4. **Integration is validated** - End-to-end testing ensures components work together
5. **Performance is monitored** - Benchmarks ensure scalability requirements are met