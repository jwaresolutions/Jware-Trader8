# Jware-Trader8 Modular Pseudocode

## Module 1: Core Trading Interfaces (`packages/core/`)

### File: [`interfaces/trading.ts`](packages/core/interfaces/trading.ts)
```typescript
// PSEUDOCODE: Core trading provider interface
INTERFACE ITradingProvider {
  ASYNC METHOD connect(): Promise<ConnectionResult>
    VALIDATE configuration exists
    ESTABLISH connection to broker API
    VERIFY authentication
    RETURN connection status and account info
  
  ASYNC METHOD getAccount(): Promise<Account>
    FETCH current account information
    RETURN account balance, buying power, positions
  
  ASYNC METHOD placeBuyOrder(symbol, quantity, orderType, price?): Promise<Order>
    VALIDATE symbol format and availability
    VALIDATE quantity against account balance
    VALIDATE price if limit order
    SUBMIT order to broker
    RETURN order confirmation with ID
  
  ASYNC METHOD placeSellOrder(symbol, quantity, orderType, price?): Promise<Order>
    VALIDATE position exists for symbol
    VALIDATE quantity doesn't exceed position size
    SUBMIT sell order to broker
    RETURN order confirmation with ID
  
  ASYNC METHOD getOrderStatus(orderId): Promise<OrderStatus>
    FETCH order details from broker
    RETURN current status (pending, filled, cancelled, etc.)
  
  ASYNC METHOD cancelOrder(orderId): Promise<CancelResult>
    ATTEMPT to cancel pending order
    RETURN cancellation status
}

// PSEUDOCODE: Market data provider interface
INTERFACE IDataProvider {
  ASYNC METHOD getHistoricalData(symbol, timeframe, startDate, endDate): Promise<OHLCV[]>
    VALIDATE date range (not future dates)
    VALIDATE symbol format
    FETCH historical price data from provider
    NORMALIZE data format to standard OHLCV
    RETURN sorted array by timestamp
  
  ASYNC METHOD getRealTimeQuote(symbol): Promise<Quote>
    ESTABLISH real-time connection if needed
    FETCH current bid/ask/last price
    RETURN quote with timestamp
  
  ASYNC METHOD getSymbolInfo(symbol): Promise<SymbolInfo>
    FETCH symbol metadata (name, type, exchange, etc.)
    RETURN symbol information
}
```

### File: [`interfaces/strategy.ts`](packages/core/interfaces/strategy.ts)
```typescript
// PSEUDOCODE: Strategy execution interface
INTERFACE IStrategyEngine {
  METHOD loadStrategy(strategyConfig): Strategy
    PARSE YAML/JSON strategy configuration
    VALIDATE strategy schema
    INITIALIZE indicators with parameters
    COMPILE signal conditions
    RETURN strategy instance
  
  ASYNC METHOD executeStrategy(strategy, marketData): Promise<TradeSignal[]>
    UPDATE indicators with new market data
    EVALUATE buy/sell conditions
    APPLY risk management rules
    GENERATE trade signals if conditions met
    RETURN list of signals (BUY/SELL/HOLD)
  
  METHOD validateStrategy(strategyConfig): ValidationResult
    CHECK required fields exist
    VALIDATE indicator parameters
    VERIFY signal condition syntax
    CHECK risk management rules
    RETURN validation errors or success
}

// PSEUDOCODE: Strategy configuration structure
TYPE StrategyConfig = {
  name: string
  parameters: Map<string, any>
  indicators: IndicatorConfig[]
  signals: {
    buy: SignalCondition[]
    sell: SignalCondition[]
  }
  riskManagement: RiskConfig
}
```

## Module 2: Provider Implementations (`packages/providers/`)

### File: [`alpaca/trading-provider.ts`](packages/providers/alpaca/trading-provider.ts)
```typescript
// PSEUDOCODE: Alpaca trading provider implementation
CLASS AlpacaTradingProvider IMPLEMENTS ITradingProvider {
  PRIVATE alpacaClient: AlpacaAPI
  PRIVATE config: AlpacaConfig
  
  CONSTRUCTOR(config: AlpacaConfig) {
    VALIDATE config has required keys (api_key, secret_key, base_url)
    INITIALIZE alpaca client with credentials
    SET paper trading flag based on base_url
  }
  
  ASYNC METHOD connect(): Promise<ConnectionResult> {
    TRY {
      CALL alpacaClient.getAccount()
      RETURN { success: true, accountInfo: account }
    } CATCH (error) {
      LOG error details
      RETURN { success: false, error: error.message }
    }
  }
  
  ASYNC METHOD getAccount(): Promise<Account> {
    CALL alpacaClient.getAccount()
    TRANSFORM alpaca account format to standard Account format
    RETURN normalized account data
  }
  
  ASYNC METHOD placeBuyOrder(symbol, quantity, orderType, price?): Promise<Order> {
    VALIDATE symbol is tradeable (crypto, stocks)
    CALCULATE order value
    CHECK buying power sufficient
    
    IF orderType === 'MARKET' {
      SUBMIT market buy order
    } ELSE IF orderType === 'LIMIT' {
      REQUIRE price parameter
      SUBMIT limit buy order with price
    }
    
    RETURN order confirmation
  }
  
  ASYNC METHOD placeSellOrder(symbol, quantity, orderType, price?): Promise<Order> {
    GET current position for symbol
    VALIDATE position exists and quantity available
    
    IF orderType === 'MARKET' {
      SUBMIT market sell order
    } ELSE IF orderType === 'LIMIT' {
      REQUIRE price parameter
      SUBMIT limit sell order with price
    }
    
    RETURN order confirmation
  }
}
```

### File: [`polygon/data-provider.ts`](packages/providers/polygon/data-provider.ts)
```typescript
// PSEUDOCODE: Polygon data provider implementation
CLASS PolygonDataProvider IMPLEMENTS IDataProvider {
  PRIVATE polygonClient: PolygonAPI
  PRIVATE config: PolygonConfig
  PRIVATE cache: Map<string, CachedData>
  
  CONSTRUCTOR(config: PolygonConfig) {
    VALIDATE config has api_key
    INITIALIZE polygon client
    INITIALIZE cache with TTL
  }
  
  ASYNC METHOD getHistoricalData(symbol, timeframe, startDate, endDate): Promise<OHLCV[]> {
    GENERATE cache key from parameters
    
    IF cache.has(cacheKey) AND not expired {
      RETURN cached data
    }
    
    CONVERT timeframe to Polygon format ('1/day', '1/minute', etc.)
    CALL polygon aggregates API
    TRANSFORM polygon response to standard OHLCV format
    
    CACHE result with expiration
    RETURN normalized data
  }
  
  ASYNC METHOD getRealTimeQuote(symbol): Promise<Quote> {
    IF crypto symbol {
      CALL polygon crypto real-time API
    } ELSE {
      CALL polygon stocks real-time API
    }
    
    TRANSFORM response to standard Quote format
    RETURN quote data
  }
  
  PRIVATE METHOD normalizeOHLCV(polygonData): OHLCV[] {
    RETURN polygonData.map(bar => ({
      timestamp: new Date(bar.t),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v
    }))
  }
}
```

## Module 3: Strategy Engine (`packages/strategies/`)

### File: [`engine/strategy-engine.ts`](packages/strategies/engine/strategy-engine.ts)
```typescript
// PSEUDOCODE: Strategy execution engine
CLASS StrategyEngine IMPLEMENTS IStrategyEngine {
  PRIVATE indicatorLibrary: Map<string, IndicatorClass>
  PRIVATE conditionEvaluator: ConditionEvaluator
  
  CONSTRUCTOR() {
    REGISTER built-in indicators (SMA, EMA, RSI, etc.)
    INITIALIZE condition evaluator
  }
  
  METHOD loadStrategy(strategyConfig): Strategy {
    VALIDATE strategy schema
    
    // Initialize indicators
    LET indicators = new Map()
    FOR EACH indicatorConfig IN strategyConfig.indicators {
      LET indicatorClass = indicatorLibrary.get(indicatorConfig.type)
      LET indicator = new indicatorClass(indicatorConfig.parameters)
      indicators.set(indicatorConfig.name, indicator)
    }
    
    RETURN new Strategy({
      config: strategyConfig,
      indicators: indicators,
      evaluator: conditionEvaluator
    })
  }
  
  ASYNC METHOD executeStrategy(strategy, marketData): Promise<TradeSignal[]> {
    LET signals = []
    
    // Update all indicators with new data
    FOR EACH indicator IN strategy.indicators {
      indicator.update(marketData)
    }
    
    // Evaluate buy conditions
    FOR EACH buyCondition IN strategy.config.signals.buy {
      IF conditionEvaluator.evaluate(buyCondition, strategy.indicators) {
        signals.push({
          type: 'BUY',
          symbol: marketData.symbol,
          price: marketData.close,
          timestamp: marketData.timestamp,
          reason: buyCondition.description
        })
      }
    }
    
    // Evaluate sell conditions
    FOR EACH sellCondition IN strategy.config.signals.sell {
      IF conditionEvaluator.evaluate(sellCondition, strategy.indicators) {
        signals.push({
          type: 'SELL',
          symbol: marketData.symbol,
          price: marketData.close,
          timestamp: marketData.timestamp,
          reason: sellCondition.description
        })
      }
    }
    
    RETURN signals
  }
}
```

### File: [`indicators/technical-indicators.ts`](packages/strategies/indicators/technical-indicators.ts)
```typescript
// PSEUDOCODE: Technical indicator implementations
ABSTRACT CLASS BaseIndicator {
  PROTECTED values: number[]
  PROTECTED period: number
  
  CONSTRUCTOR(period: number) {
    SET this.period = period
    INITIALIZE values array
  }
  
  ABSTRACT METHOD calculate(newValue: number): number
  
  METHOD update(marketData: OHLCV): void {
    LET newValue = CALCULATE indicator value
    values.push(newValue)
    
    IF values.length > maxHistoryLength {
      values.shift() // Remove oldest value
    }
  }
  
  METHOD getValue(index = 0): number {
    RETURN values[values.length - 1 - index]
  }
}

CLASS SimpleMovingAverage EXTENDS BaseIndicator {
  PRIVATE prices: number[]
  
  CONSTRUCTOR(period: number) {
    SUPER(period)
    INITIALIZE prices array
  }
  
  METHOD calculate(newPrice: number): number {
    prices.push(newPrice)
    
    IF prices.length > period {
      prices.shift()
    }
    
    IF prices.length < period {
      RETURN null // Not enough data
    }
    
    LET sum = prices.reduce((a, b) => a + b, 0)
    RETURN sum / period
  }
}

CLASS RelativeStrengthIndex EXTENDS BaseIndicator {
  PRIVATE gains: number[]
  PRIVATE losses: number[]
  PRIVATE lastPrice: number
  
  METHOD calculate(newPrice: number): number {
    IF lastPrice !== null {
      LET change = newPrice - lastPrice
      LET gain = change > 0 ? change : 0
      LET loss = change < 0 ? Math.abs(change) : 0
      
      gains.push(gain)
      losses.push(loss)
      
      IF gains.length > period {
        gains.shift()
        losses.shift()
      }
      
      IF gains.length === period {
        LET avgGain = gains.reduce((a, b) => a + b) / period
        LET avgLoss = losses.reduce((a, b) => a + b) / period
        
        IF avgLoss === 0 {
          RETURN 100
        }
        
        LET rs = avgGain / avgLoss
        RETURN 100 - (100 / (1 + rs))
      }
    }
    
    SET lastPrice = newPrice
    RETURN null
  }
}
```

## Module 4: Backtesting Engine (`packages/backtesting/`)

### File: [`engine/backtest-engine.ts`](packages/backtesting/engine/backtest-engine.ts)
```typescript
// PSEUDOCODE: Backtesting execution engine
CLASS BacktestEngine IMPLEMENTS IBacktestEngine {
  PRIVATE strategyEngine: IStrategyEngine
  PRIVATE portfolio: Portfolio
  
  CONSTRUCTOR(strategyEngine: IStrategyEngine) {
    SET this.strategyEngine = strategyEngine
  }
  
  ASYNC METHOD runBacktest(strategy, historicalData, config): Promise<BacktestResult> {
    // Initialize portfolio
    LET portfolio = new Portfolio(config.initialCapital)
    LET trades = []
    LET equityCurve = []
    
    // Process each data point
    FOR EACH dataPoint IN historicalData {
      // Execute strategy
      LET signals = AWAIT strategyEngine.executeStrategy(strategy, dataPoint)
      
      FOR EACH signal IN signals {
        IF signal.type === 'BUY' AND portfolio.canBuy(signal.symbol, signal.price, config.positionSize) {
          LET trade = portfolio.openPosition(signal.symbol, signal.price, config.positionSize)
          trade.entryReason = signal.reason
          trades.push(trade)
        }
        
        IF signal.type === 'SELL' AND portfolio.hasPosition(signal.symbol) {
          LET trade = portfolio.closePosition(signal.symbol, signal.price)
          trade.exitReason = signal.reason
          CALCULATE trade P&L
          UPDATE trade record
        }
      }
      
      // Apply risk management
      APPLY stop loss and take profit rules
      
      // Record equity curve point
      equityCurve.push({
        timestamp: dataPoint.timestamp,
        totalValue: portfolio.getTotalValue(dataPoint.close),
        cash: portfolio.cash,
        positions: portfolio.getPositions()
      })
    }
    
    RETURN {
      summary: CALCULATE performance metrics,
      trades: trades,
      equityCurve: equityCurve,
      finalPortfolio: portfolio
    }
  }
  
  PRIVATE METHOD calculatePerformanceMetrics(trades, equityCurve): PerformanceMetrics {
    LET totalReturn = CALCULATE total return percentage
    LET winRate = CALCULATE win rate from trades
    LET sharpeRatio = CALCULATE Sharpe ratio from equity curve
    LET maxDrawdown = CALCULATE maximum drawdown
    
    RETURN {
      totalReturn,
      winRate,
      sharpeRatio,
      maxDrawdown,
      totalTrades: trades.length,
      profitableTrades: trades.filter(t => t.pnl > 0).length
    }
  }
}
```

### File: [`models/portfolio.ts`](packages/backtesting/models/portfolio.ts)
```typescript
// PSEUDOCODE: Portfolio management for backtesting
CLASS Portfolio {
  PUBLIC cash: number
  PRIVATE positions: Map<string, Position>
  PRIVATE tradeHistory: Trade[]
  
  CONSTRUCTOR(initialCash: number) {
    SET this.cash = initialCash
    INITIALIZE positions and tradeHistory
  }
  
  METHOD canBuy(symbol, price, quantity): boolean {
    LET orderValue = price * quantity
    LET commissionCost = CALCULATE commission
    RETURN (orderValue + commissionCost) <= this.cash
  }
  
  METHOD openPosition(symbol, price, quantity): Trade {
    LET orderValue = price * quantity
    LET commission = CALCULATE commission
    
    // Deduct cash
    this.cash -= (orderValue + commission)
    
    // Create or update position
    IF positions.has(symbol) {
      UPDATE existing position (average price, quantity)
    } ELSE {
      positions.set(symbol, new Position(symbol, quantity, price))
    }
    
    // Create trade record
    LET trade = new Trade({
      id: GENERATE unique ID,
      symbol: symbol,
      side: 'BUY',
      entryTime: CURRENT timestamp,
      entryPrice: price,
      quantity: quantity,
      commission: commission
    })
    
    tradeHistory.push(trade)
    RETURN trade
  }
  
  METHOD closePosition(symbol, price): Trade {
    LET position = positions.get(symbol)
    REQUIRE position exists
    
    LET orderValue = price * position.quantity
    LET commission = CALCULATE commission
    
    // Add cash from sale
    this.cash += (orderValue - commission)
    
    // Find corresponding buy trade
    LET buyTrade = FIND open trade for symbol
    buyTrade.exitTime = CURRENT timestamp
    buyTrade.exitPrice = price
    buyTrade.pnl = CALCULATE P&L including commissions
    
    // Remove position
    positions.delete(symbol)
    
    RETURN buyTrade
  }
  
  METHOD getTotalValue(currentPrices: Map<string, number>): number {
    LET positionValue = 0
    
    FOR EACH position IN positions.values() {
      LET currentPrice = currentPrices.get(position.symbol)
      positionValue += position.quantity * currentPrice
    }
    
    RETURN this.cash + positionValue
  }
}
```

## Module 5: Database Layer (`packages/database/`)

### File: [`stores/config-store.ts`](packages/database/stores/config-store.ts)
```typescript
// PSEUDOCODE: Configuration storage with encryption
CLASS ConfigStore IMPLEMENTS IConfigStore {
  PRIVATE db: SQLiteDatabase
  PRIVATE encryptionKey: string
  
  CONSTRUCTOR(dbPath: string, encryptionKey: string) {
    INITIALIZE SQLite database
    CREATE tables if not exist
    SET encryption key
  }
  
  ASYNC METHOD setApiKey(provider, apiKey, secretKey): Promise<void> {
    LET encryptedApiKey = ENCRYPT(apiKey, encryptionKey)
    LET encryptedSecret = ENCRYPT(secretKey, encryptionKey)
    
    UPSERT INTO api_keys (provider, api_key, secret_key, updated_at)
    VALUES (provider, encryptedApiKey, encryptedSecret, NOW())
  }
  
  ASYNC METHOD getApiKey(provider): Promise<ApiKeyPair> {
    LET row = SELECT * FROM api_keys WHERE provider = provider
    
    IF row exists {
      RETURN {
        apiKey: DECRYPT(row.api_key, encryptionKey),
        secretKey: DECRYPT(row.secret_key, encryptionKey)
      }
    }
    
    THROW new Error('API key not found for provider')
  }
  
  ASYNC METHOD setConfig(key, value): Promise<void> {
    LET serialized = JSON.stringify(value)
    UPSERT INTO config (key, value, updated_at)
    VALUES (key, serialized, NOW())
  }
  
  ASYNC METHOD getConfig(key): Promise<any> {
    LET row = SELECT value FROM config WHERE key = key
    
    IF row exists {
      RETURN JSON.parse(row.value)
    }
    
    RETURN null
  }
  
  PRIVATE METHOD setupTables(): void {
    EXECUTE SQL: CREATE TABLE IF NOT EXISTS api_keys (
      provider TEXT PRIMARY KEY,
      api_key TEXT NOT NULL,
      secret_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    
    EXECUTE SQL: CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  }
}
```

### File: [`stores/trade-store.ts`](packages/database/stores/trade-store.ts)
```typescript
// PSEUDOCODE: Trade history storage
CLASS TradeStore IMPLEMENTS ITradeStore {
  PRIVATE db: SQLiteDatabase
  
  ASYNC METHOD saveTrade(trade): Promise<void> {
    EXECUTE SQL: INSERT INTO trades (
      id, symbol, side, entry_time, entry_price, exit_time, exit_price,
      quantity, pnl, commission, entry_reason, exit_reason, strategy_name
    ) VALUES (
      trade.id, trade.symbol, trade.side, trade.entryTime, trade.entryPrice,
      trade.exitTime, trade.exitPrice, trade.quantity, trade.pnl,
      trade.commission, trade.entryReason, trade.exitReason, trade.strategyName
    )
  }
  
  ASYNC METHOD getTrades(filter?: TradeFilter): Promise<Trade[]> {
    LET whereClause = BUILD where clause from filter
    LET sql = "SELECT * FROM trades" + whereClause + " ORDER BY entry_time DESC"
    
    LET rows = EXECUTE SQL query
    RETURN rows.map(row => CONVERT to Trade object)
  }
  
  ASYNC METHOD getPerformanceData(timeframe): Promise<PerformanceData> {
    LET startDate = CALCULATE start date from timeframe
    
    LET summary = EXECUTE SQL: SELECT 
      COUNT(*) as total_trades,
      SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
      SUM(pnl) as total_pnl,
      AVG(pnl) as avg_pnl,
      MAX(pnl) as best_trade,
      MIN(pnl) as worst_trade
    FROM trades 
    WHERE entry_time >= startDate
    
    LET dailyPnl = EXECUTE SQL: SELECT 
      DATE(entry_time) as date,
      SUM(pnl) as daily_pnl
    FROM trades 
    WHERE entry_time >= startDate
    GROUP BY DATE(entry_time)
    ORDER BY date
    
    RETURN {
      summary: summary,
      dailyPnl: dailyPnl,
      winRate: summary.winning_trades / summary.total_trades
    }
  }
}
```

## Module 6: CLI Interface (`packages/cli/`)

### File: [`commands/trade.ts`](packages/cli/commands/trade.ts)
```typescript
// PSEUDOCODE: Trading CLI commands
CLASS TradeCommands {
  PRIVATE tradingEngine: TradingEngine
  PRIVATE configStore: IConfigStore
  
  METHOD registerCommands(program: Command): void {
    program
      .command('trade')
      .description('Trading operations')
      .addCommand(this.createStartCommand())
      .addCommand(this.createStopCommand())
      .addCommand(this.createStatusCommand())
  }
  
  PRIVATE METHOD createStartCommand(): Command {
    RETURN new Command('start')
      .description('Start automated trading with a strategy')
      .argument('<strategy-file>', 'Path to strategy YAML file')
      .option('--dry-run', 'Run in simulation mode')
      .option('--max-positions <number>', 'Maximum concurrent positions')
      .action(ASYNC (strategyFile, options) => {
        TRY {
          // Load and validate strategy
          LET strategyConfig = LOAD YAML file from strategyFile
          LET strategy = strategyEngine.loadStrategy(strategyConfig)
          LET validation = strategyEngine.validateStrategy(strategyConfig)
          
          IF validation has errors {
            PRINT validation errors
            EXIT with error code
          }
          
          // Initialize trading session
          LET session = new TradingSession({
            strategy: strategy,
            options: options,
            dryRun: options.dryRun
          })
          
          PRINT "Starting trading session with strategy: " + strategy.name
          PRINT "Mode: " + (options.dryRun ? "SIMULATION" : "LIVE")
          
          // Start trading loop
          AWAIT session.start()
          
        } CATCH (error) {
          PRINT "Failed to start trading: " + error.message
          EXIT with error code
        }
      })
  }
  
  PRIVATE METHOD createStatusCommand(): Command {
    RETURN new Command('status')
      .description('Show current trading status')
      .action(ASYNC () => {
        LET account = AWAIT tradingProvider.getAccount()
        LET positions = AWAIT tradingProvider.getPositions()
        LET recentTrades = AWAIT tradeStore.getTrades({limit: 10})
        
        PRINT formatted account information
        PRINT formatted positions table
        PRINT formatted recent trades table
      })
  }
}
```

### File: [`commands/backtest.ts`](packages/cli/commands/backtest.ts)
```typescript
// PSEUDOCODE: Backtesting CLI commands
CLASS BacktestCommands {
  PRIVATE backtestEngine: IBacktestEngine
  PRIVATE dataProvider: IDataProvider
  
  METHOD registerCommands(program: Command): void {
    program
      .command('backtest')
      .description('Run strategy backtesting')
      .argument('<strategy-file>', 'Path to strategy YAML file')
      .option('--symbol <symbol>', 'Symbol to test (e.g., BTCUSD)')
      .option('--start <date>', 'Start date (YYYY-MM-DD)')
      .option('--end <date>', 'End date (YYYY-MM-DD)')
      .option('--timeframe <frame>', 'Timeframe (1m, 5m, 1h, 1d)', '1h')
      .option('--initial-capital <amount>', 'Initial capital', '10000')
      .option('--output <format>', 'Output format (table, json, csv)', 'table')
      .action(ASYNC (strategyFile, options) => {
        TRY {
          // Load strategy
          LET strategyConfig = LOAD YAML file from strategyFile
          LET strategy = strategyEngine.loadStrategy(strategyConfig)
          
          // Get historical data
          LET startDate = PARSE date from options.start
          LET endDate = PARSE date from options.end
          LET historicalData = AWAIT dataProvider.getHistoricalData(
            options.symbol, options.timeframe, startDate, endDate
          )
          
          PRINT "Running backtest..."
          PRINT "Strategy: " + strategy.name
          PRINT "Symbol: " + options.symbol
          PRINT "Period: " + startDate + " to " + endDate
          PRINT "Data points: " + historicalData.length
          
          // Run backtest
          LET config = {
            initialCapital: parseFloat(options.initialCapital),
            positionSize: 0.1, // 10% of capital per trade
            commission: 0.001   // 0.1% commission
          }
          
          LET result = AWAIT backtestEngine.runBacktest(strategy, historicalData, config)
          
          // Display results
          IF options.output === 'table' {
            PRINT formatted performance summary table
            PRINT formatted trades table
          } ELSE IF options.output === 'json' {
            PRINT JSON.stringify(result, null, 2)
          } ELSE IF options.output === 'csv' {
            EXPORT trades to CSV format
          }
          
        } CATCH (error) {
          PRINT "Backtest failed: " + error.message
          EXIT with error code
        }
      })
  }
  
  PRIVATE METHOD formatPerformanceSummary(result): string {
    RETURN table with:
      - Total Return: result.summary.totalReturn + "%"
      - Sharpe Ratio: result.summary.sharpeRatio
      - Max Drawdown: result.summary.maxDrawdown + "%"
      - Win Rate: result.summary.winRate + "%"
      - Total Trades: result.summary.totalTrades
      - Profitable Trades: result.summary.profitableTrades
  }
  
  PRIVATE METHOD formatTradesTable(trades): string {
    RETURN table with columns:
      - Entry Time, Symbol, Side, Entry Price, Exit Time, Exit Price, P&L, Reason
  }
}
```

## Module 7: Configuration Management (`packages/cli/commands/config.ts`)

```typescript
// PSEUDOCODE: Configuration CLI commands
CLASS ConfigCommands {
  PRIVATE configStore: IConfigStore
  
  METHOD registerCommands(program: Command): void {
    LET configCmd = program
      .command('config')
      .description('Manage configuration settings')
    
    configCmd
      .command('set-keys')
      .description('Set API keys for trading providers')
      .option('--provider <name>', 'Provider name (alpaca, polygon)', 'alpaca')
      .action(ASYNC (options) => {
        LET apiKey = PROMPT for API key (hidden input)
        LET secretKey = PROMPT for secret key (hidden input)
        
        AWAIT configStore.setApiKey(options.provider, apiKey, secretKey)
        PRINT "API keys saved for " + options.provider
      })
    
    configCmd
      .command('list')
      .description('List all configuration settings')
      .action(ASYNC () => {
        LET configs = AWAIT configStore.listConfigs()
        PRINT formatted configuration table (mask sensitive data)
      })
    
    configCmd
      .command('set')
      .description('Set configuration value')
      .argument('<key>', 'Configuration key')
      .argument('<value>', 'Configuration value')
      .action(ASYNC (key, value) => {
        LET parsedValue = TRY to parse as JSON, otherwise use as string
        AWAIT configStore.setConfig(key, parsedValue)
        PRINT "Configuration updated: " + key + " = " + value
      })
  }
}
```

## Testing Pseudocode Structure

### File: [`packages/core/tests/trading-provider.test.ts`](packages/core/tests/trading-provider.test.ts)
```typescript
// PSEUDOCODE: Trading provider tests
DESCRIBE 'ITradingProvider Interface Tests' {
  LET mockProvider: ITradingProvider
  
  BEFORE_EACH {
    mockProvider = CREATE mock implementation
  }
  
  TEST 'should connect successfully with valid credentials' {
    LET config = VALID_TEST_CONFIG
    LET result = AWAIT mockProvider.connect()
    
    EXPECT result.success TO_BE true
    EXPECT result.accountInfo TO_BE_DEFINED
  }
  
  TEST 'should place buy order with sufficient balance' {
    MOCK account balance = 1000
    LET order = AWAIT mockProvider.placeBuyOrder('BTCUSD', 0.1, 'MARKET')
    
    EXPECT order.status TO_BE 'PENDING'
    EXPECT order.symbol TO_BE 'BTCUSD'
    EXPECT order.quantity TO_BE 0.1
  }
  
  TEST 'should reject buy order with insufficient balance' {
    MOCK account balance = 10
    
    EXPECT ASYNC () => {
      AWAIT mockProvider.placeBuyOrder('BTCUSD', 1.0, 'MARKET')
    } TO_THROW 'Insufficient buying power'
  }
}
```

### File: [`packages/strategies/tests/strategy-engine.test.ts`](packages/strategies/tests/strategy-engine.test.ts)
```typescript
// PSEUDOCODE: Strategy engine tests
DESCRIBE 'StrategyEngine Tests' {
  LET engine: StrategyEngine
  LET testStrategy: StrategyConfig
  
  BEFORE_EACH {
    engine = new StrategyEngine()
    testStrategy = LOAD test strategy from YAML
  }
  
  TEST 'should load valid strategy configuration' {
    LET strategy = engine.loadStrategy(testStrategy)
    
    EXPECT strategy TO_BE_DEFINED
    EXPECT strategy.name TO_BE testStrategy.name
    EXPECT strategy.indicators.size TO_BE testStrategy.indicators.length
  }
  
  TEST 'should generate buy signal when conditions are met' {
    LET strategy = engine.loadStrategy(testStrategy)
    LET marketData = CREATE test market data with SMA crossover
    
    LET signals = AWAIT engine.executeStrategy(strategy, marketData)
    
    EXPECT signals.length TO_BE 1
    EXPECT signals[0].type TO_BE 'BUY'
    EXPECT signals[0].reason TO_CONTAIN 'SMA crossover'
  }
  
  TEST 'should validate strategy configuration' {
    LET invalidStrategy = { /* missing required fields */ }
    LET result = engine.validateStrategy(invalidStrategy)
    
    EXPECT result.isValid TO_BE false
    EXPECT result.errors.length TO_BE_GREATER_THAN 0
  }
}
```

This modular pseudocode structure provides:
1. **Clear separation of concerns** - Each module has a specific responsibility
2. **Interface-driven design** - Easy to swap implementations
3. **Testable components** - Each module can be tested independently
4. **Progressive implementation** - Can build and test modules incrementally
5. **TDD-ready structure** - Tests are designed alongside the pseudocode

The pseudocode is detailed enough to guide implementation while remaining flexible for specific technical decisions during coding.