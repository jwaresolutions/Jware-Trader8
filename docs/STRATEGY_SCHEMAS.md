# Strategy Configuration Schemas & Examples

## Strategy YAML Schema

### Base Strategy Structure
```yaml
# Strategy metadata
name: string                    # Required: Strategy display name
description: string            # Required: Brief description
version: string               # Required: Version (semantic versioning)
author: string                # Optional: Strategy author
tags: string[]               # Optional: Tags for categorization

# Strategy parameters (user-configurable)
parameters:
  symbol: string              # Required: Trading symbol (e.g., "BTCUSD", "AAPL")
  timeframe: string          # Required: Data timeframe ("1m", "5m", "1h", "1d")
  position_size: number      # Required: Position size (0.0-1.0 as % of capital)
  [custom_params]: any       # Strategy-specific parameters

# Technical indicators configuration
indicators:
  - name: string             # Required: Unique identifier within strategy
    type: string            # Required: Indicator type (SMA, EMA, RSI, etc.)
    source: string          # Optional: Price source ("close", "high", "low", "volume")
    period: number          # Required for most indicators
    [custom_params]: any    # Indicator-specific parameters

# Trading signals configuration
signals:
  buy:                      # Buy signal conditions
    - condition: string     # Required: Boolean expression
      action: "BUY"        # Required: Action type
      size: number         # Optional: Override position size
      priority: number     # Optional: Signal priority (1-10)
      
  sell:                    # Sell signal conditions
    - condition: string     # Required: Boolean expression
      action: "SELL"       # Required: Action type
      size: number|"ALL"   # Optional: Sell size or "ALL"
      priority: number     # Optional: Signal priority

# Risk management rules
risk_management:
  stop_loss: number         # Optional: Stop loss percentage (0.0-1.0)
  take_profit: number       # Optional: Take profit percentage (0.0-1.0)
  max_positions: number     # Optional: Maximum concurrent positions
  daily_loss_limit: number # Optional: Daily loss limit
  position_timeout: string  # Optional: Max position hold time ("1h", "1d", etc.)

# Optional: Additional constraints
constraints:
  market_hours_only: boolean # Only trade during market hours
  min_volume: number        # Minimum volume requirement
  volatility_filter: number # Skip trading if volatility too high/low
```

## Example Strategies

### 1. Simple Moving Average Crossover
```yaml
# strategies/sma_crossover.yaml
name: "Simple Moving Average Crossover"
description: "Buy when fast SMA crosses above slow SMA, sell on reverse crossover"
version: "1.0.0"
author: "Jware-Trader8"
tags: ["trend-following", "moving-average", "beginner"]

parameters:
  symbol: "BTCUSD"
  timeframe: "1h"
  position_size: 0.10        # 10% of capital per trade
  fast_period: 10
  slow_period: 30

indicators:
  - name: "sma_fast"
    type: "SMA"
    source: "close"
    period: "{{ parameters.fast_period }}"
    
  - name: "sma_slow"
    type: "SMA"
    source: "close"
    period: "{{ parameters.slow_period }}"

signals:
  buy:
    - condition: "sma_fast > sma_slow AND sma_fast[-1] <= sma_slow[-1]"
      action: "BUY"
      size: "{{ parameters.position_size }}"
      priority: 1
      
  sell:
    - condition: "sma_fast < sma_slow AND sma_fast[-1] >= sma_slow[-1]"
      action: "SELL"
      size: "ALL"
      priority: 1

risk_management:
  stop_loss: 0.02           # 2% stop loss
  take_profit: 0.05         # 5% take profit
  max_positions: 1
  daily_loss_limit: 0.05    # 5% daily loss limit

constraints:
  min_volume: 1000000       # Minimum $1M daily volume
```

### 2. RSI Mean Reversion
```yaml
# strategies/rsi_mean_reversion.yaml
name: "RSI Mean Reversion"
description: "Buy oversold conditions (RSI < 30), sell overbought (RSI > 70)"
version: "1.1.0"
author: "Jware-Trader8"
tags: ["mean-reversion", "rsi", "oscillator"]

parameters:
  symbol: "ETHUSD"
  timeframe: "4h"
  position_size: 0.15
  rsi_period: 14
  oversold_level: 30
  overbought_level: 70
  confirmation_period: 2     # Wait N periods for confirmation

indicators:
  - name: "rsi"
    type: "RSI"
    source: "close"
    period: "{{ parameters.rsi_period }}"
    
  - name: "sma_trend"
    type: "SMA"
    source: "close"
    period: 50                # Trend filter

signals:
  buy:
    # RSI oversold + price above trend line + confirmation
    - condition: >
        rsi < {{ parameters.oversold_level }} AND
        rsi[-1] < {{ parameters.oversold_level }} AND
        close > sma_trend AND
        rsi > rsi[-1]
      action: "BUY"
      size: "{{ parameters.position_size }}"
      priority: 1
      
  sell:
    # RSI overbought OR price drops below trend
    - condition: "rsi > {{ parameters.overbought_level }}"
      action: "SELL"
      size: "ALL"
      priority: 1
      
    - condition: "close < sma_trend"
      action: "SELL"
      size: "ALL"
      priority: 2

risk_management:
  stop_loss: 0.03
  take_profit: 0.06
  max_positions: 2
  position_timeout: "72h"    # Close position after 3 days

constraints:
  volatility_filter: 0.02    # Skip if daily volatility > 2%
```

### 3. Multi-Timeframe Breakout
```yaml
# strategies/breakout_strategy.yaml
name: "Multi-Timeframe Breakout"
description: "Trade breakouts from consolidation with volume confirmation"
version: "2.0.0"
author: "Jware-Trader8"
tags: ["breakout", "volume", "multi-timeframe", "advanced"]

parameters:
  symbol: "BTCUSD"
  timeframe: "15m"
  position_size: 0.20
  lookback_periods: 20
  breakout_threshold: 0.015   # 1.5% breakout
  volume_multiplier: 1.5      # Volume must be 1.5x average

indicators:
  - name: "highest_high"
    type: "HIGHEST"
    source: "high"
    period: "{{ parameters.lookback_periods }}"
    
  - name: "lowest_low"
    type: "LOWEST"
    source: "low"
    period: "{{ parameters.lookback_periods }}"
    
  - name: "avg_volume"
    type: "SMA"
    source: "volume"
    period: "{{ parameters.lookback_periods }}"
    
  - name: "atr"
    type: "ATR"
    period: 14

signals:
  buy:
    # Upward breakout with volume confirmation
    - condition: >
        close > highest_high[-1] AND
        (close - highest_high[-1]) / highest_high[-1] > {{ parameters.breakout_threshold }} AND
        volume > avg_volume * {{ parameters.volume_multiplier }}
      action: "BUY"
      size: "{{ parameters.position_size }}"
      priority: 1
      
  sell:
    # Downward breakout
    - condition: >
        close < lowest_low[-1] AND
        (lowest_low[-1] - close) / lowest_low[-1] > {{ parameters.breakout_threshold }} AND
        volume > avg_volume * {{ parameters.volume_multiplier }}
      action: "SELL"
      size: "ALL"
      priority: 1

risk_management:
  stop_loss: 0.025
  take_profit: 0.08
  max_positions: 1
  daily_loss_limit: 0.04

constraints:
  market_hours_only: false    # Crypto trades 24/7
  min_volume: 5000000        # $5M minimum volume
```

### 4. Grid Trading Strategy
```yaml
# strategies/grid_trading.yaml
name: "Grid Trading Strategy"
description: "Place buy/sell orders at regular price intervals"
version: "1.0.0"
author: "Jware-Trader8"
tags: ["grid", "range-bound", "automated"]

parameters:
  symbol: "BTCUSD"
  timeframe: "1h"
  position_size: 0.05        # Small positions for grid
  grid_levels: 10            # Number of grid levels
  grid_spacing: 0.01         # 1% spacing between levels
  base_price_source: "sma"   # Use SMA as grid center

indicators:
  - name: "grid_center"
    type: "SMA"
    source: "close"
    period: 50
    
  - name: "volatility"
    type: "ATR"
    period: 14

signals:
  buy:
    # Buy when price hits lower grid levels
    - condition: >
        close <= grid_center * (1 - {{ parameters.grid_spacing }}) AND
        close >= grid_center * (1 - {{ parameters.grid_spacing }} * 2)
      action: "BUY"
      size: "{{ parameters.position_size }}"
      priority: 1
      
    - condition: >
        close <= grid_center * (1 - {{ parameters.grid_spacing }} * 2) AND
        close >= grid_center * (1 - {{ parameters.grid_spacing }} * 3)
      action: "BUY"
      size: "{{ parameters.position_size }}"
      priority: 2
      
  sell:
    # Sell when price hits upper grid levels
    - condition: >
        close >= grid_center * (1 + {{ parameters.grid_spacing }}) AND
        close <= grid_center * (1 + {{ parameters.grid_spacing }} * 2)
      action: "SELL"
      size: "{{ parameters.position_size }}"
      priority: 1

risk_management:
  stop_loss: 0.05            # Wider stops for grid trading
  take_profit: 0.10
  max_positions: 5           # Allow multiple grid positions
  
constraints:
  volatility_filter: 0.015   # Only trade in low volatility
```

## Condition Expression Language

### Supported Operators
```yaml
# Comparison operators
condition: "rsi > 70"                    # Greater than
condition: "rsi < 30"                    # Less than
condition: "rsi >= 70"                   # Greater than or equal
condition: "rsi <= 30"                   # Less than or equal
condition: "rsi == 50"                   # Equal to
condition: "rsi != 50"                   # Not equal to

# Logical operators
condition: "rsi > 70 AND volume > avg_volume"     # AND
condition: "rsi < 30 OR rsi > 70"                 # OR
condition: "NOT (rsi > 30 AND rsi < 70)"          # NOT

# Historical data access
condition: "close > close[-1]"           # Current vs previous
condition: "sma_fast[-1] <= sma_slow[-1]" # Previous values
condition: "close > highest_high[-5:]"   # Max of last 5 values

# Mathematical operations
condition: "(close - open) / open > 0.02"        # Percentage change
condition: "abs(close - sma) / sma < 0.01"       # Absolute difference
condition: "volume > avg(volume[-10:])"          # Average of last 10

# Pattern matching
condition: "crossover(sma_fast, sma_slow)"       # Bullish crossover
condition: "crossunder(sma_fast, sma_slow)"      # Bearish crossover
condition: "rising(rsi, 3)"                      # Rising for 3 periods
condition: "falling(close, 2)"                   # Falling for 2 periods
```

### Built-in Functions
```yaml
# Technical analysis functions
crossover(indicator1, indicator2)       # True when ind1 crosses above ind2
crossunder(indicator1, indicator2)      # True when ind1 crosses below ind2
rising(indicator, periods)              # True if rising for N periods
falling(indicator, periods)             # True if falling for N periods
highest(indicator, periods)             # Highest value in N periods
lowest(indicator, periods)              # Lowest value in N periods

# Mathematical functions
abs(value)                              # Absolute value
max(value1, value2, ...)               # Maximum value
min(value1, value2, ...)               # Minimum value
avg(values[])                          # Average of array
sum(values[])                          # Sum of array
sqrt(value)                            # Square root
pow(base, exponent)                    # Power function

# Time functions
hour()                                 # Current hour (0-23)
dayofweek()                           # Day of week (1=Monday, 7=Sunday)
time_in_range(start, end)             # True if current time in range
```

## Validation Rules

### Strategy Validation Schema
```typescript
interface StrategyValidation {
  metadata: {
    name: { required: true, type: 'string', minLength: 1 }
    description: { required: true, type: 'string', minLength: 10 }
    version: { required: true, type: 'string', pattern: /^\d+\.\d+\.\d+$/ }
  }
  
  parameters: {
    symbol: { required: true, type: 'string', pattern: /^[A-Z0-9]+$/ }
    timeframe: { required: true, type: 'string', enum: ['1m', '5m', '15m', '1h', '4h', '1d'] }
    position_size: { required: true, type: 'number', min: 0.001, max: 1.0 }
  }
  
  indicators: {
    type: 'array',
    minItems: 1,
    items: {
      name: { required: true, type: 'string', pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/ }
      type: { required: true, type: 'string', enum: SUPPORTED_INDICATORS }
      period: { type: 'number', min: 1, max: 200 }
    }
  }
  
  signals: {
    buy: { required: true, type: 'array', minItems: 1 }
    sell: { required: true, type: 'array', minItems: 1 }
  }
}
```

### Runtime Validation
```typescript
// PSEUDOCODE: Strategy validation
METHOD validateStrategy(config: StrategyConfig): ValidationResult {
  LET errors = []
  
  // Validate metadata
  IF NOT config.name OR config.name.length < 1 {
    errors.push("Strategy name is required")
  }
  
  // Validate parameters
  IF NOT config.parameters.symbol OR NOT /^[A-Z0-9]+$/.test(config.parameters.symbol) {
    errors.push("Invalid symbol format")
  }
  
  IF config.parameters.position_size <= 0 OR config.parameters.position_size > 1 {
    errors.push("Position size must be between 0 and 1")
  }
  
  // Validate indicators
  LET indicatorNames = new Set()
  FOR EACH indicator IN config.indicators {
    IF indicatorNames.has(indicator.name) {
      errors.push("Duplicate indicator name: " + indicator.name)
    }
    indicatorNames.add(indicator.name)
    
    IF NOT SUPPORTED_INDICATORS.includes(indicator.type) {
      errors.push("Unsupported indicator type: " + indicator.type)
    }
  }
  
  // Validate signal conditions
  FOR EACH buySignal IN config.signals.buy {
    LET conditionValidation = validateCondition(buySignal.condition, indicatorNames)
    IF NOT conditionValidation.isValid {
      errors.push("Invalid buy condition: " + conditionValidation.error)
    }
  }
  
  RETURN {
    isValid: errors.length === 0,
    errors: errors
  }
}
```

This schema system provides:
1. **Flexible Configuration** - YAML format is human-readable and extensible
2. **Parameter Templating** - Use `{{ parameters.value }}` for dynamic values
3. **Rich Expression Language** - Complex conditions with technical analysis functions
4. **Comprehensive Validation** - Schema validation plus runtime checks
5. **Example Strategies** - Ready-to-use strategies for different market conditions
6. **Extensibility** - Easy to add new indicators, functions, and validation rules