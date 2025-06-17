# Example Trading Strategies

This directory contains example trading strategies for the Jware-Trader8 platform. These strategies demonstrate different approaches to algorithmic trading and serve as templates for creating your own strategies.

## Available Strategies

### 1. Simple Moving Average Crossover (`sma-crossover.yaml`)
**Type**: Trend Following  
**Complexity**: Beginner  
**Markets**: Crypto, Stocks  

A classic trend-following strategy that buys when a fast-moving average crosses above a slow-moving average and sells on the reverse crossover.

**Key Features**:
- Uses 10-period and 30-period SMAs
- Golden Cross (bullish) and Death Cross (bearish) signals
- 5% stop loss, 10% take profit
- Suitable for trending markets

**Best Timeframes**: 1h, 4h, 1d

### 2. RSI Mean Reversion (`rsi-mean-reversion.yaml`)
**Type**: Mean Reversion  
**Complexity**: Intermediate  
**Markets**: Stocks, ETFs  

A contrarian strategy that buys when the market is oversold and sells when overbought, using RSI as the primary indicator.

**Key Features**:
- RSI(14) with 30/70 oversold/overbought levels
- Trend filter using 50-period SMA
- Volume and volatility filters
- 3% stop loss, 8% take profit with trailing stop

**Best Timeframes**: 15m, 1h, 4h

### 3. Momentum Breakout (`momentum-breakout.yaml`)
**Type**: Momentum  
**Complexity**: Advanced  
**Markets**: Stocks, ETFs, Indices  

A momentum strategy that captures breakouts above resistance levels with volume confirmation.

**Key Features**:
- 20-period channel breakout
- EMA(21) trend confirmation
- Volume surge requirements
- Advanced entry/exit filters
- Partial profit-taking rules

**Best Timeframes**: 30m, 1h, 4h, 1d  
**Minimum Capital**: $20,000

## Usage Examples

### Running a Backtest
```bash
# Basic backtest with SMA crossover
jtrader backtest strategies/examples/sma-crossover.yaml \
  --symbol BTCUSD \
  --start 2024-01-01 \
  --end 2024-06-01 \
  --timeframe 1h

# RSI strategy on stocks
jtrader backtest strategies/examples/rsi-mean-reversion.yaml \
  --symbol AAPL \
  --start 2023-01-01 \
  --end 2024-01-01 \
  --timeframe 15m \
  --output json

# Momentum strategy with custom capital
jtrader backtest strategies/examples/momentum-breakout.yaml \
  --symbol SPY \
  --start 2024-01-01 \
  --end 2024-06-01 \
  --initial-capital 25000 \
  --output csv
```

### Paper Trading
```bash
# Start paper trading with SMA crossover
jtrader trade start strategies/examples/sma-crossover.yaml \
  --dry-run \
  --symbol BTCUSD \
  --max-positions 3

# Monitor trading status
jtrader status --detailed

# Stop trading session
jtrader trade stop
```

## Strategy Parameters

Each strategy includes configurable parameters that can be customized:

### SMA Crossover Parameters
- `fast_period`: Fast SMA period (default: 10)
- `slow_period`: Slow SMA period (default: 30)
- `position_size`: Position size as fraction of capital (default: 0.1)

### RSI Mean Reversion Parameters
- `rsi_period`: RSI calculation period (default: 14)
- `oversold_level`: RSI oversold threshold (default: 30)
- `overbought_level`: RSI overbought threshold (default: 70)
- `position_size`: Position size as fraction of capital (default: 0.15)

### Momentum Breakout Parameters
- `ema_period`: EMA trend filter period (default: 21)
- `volume_multiplier`: Volume surge threshold (default: 1.5)
- `breakout_period`: Channel breakout period (default: 20)
- `position_size`: Position size as fraction of capital (default: 0.12)

## Risk Management

All strategies include comprehensive risk management:

- **Stop Loss**: Automatic loss limitation
- **Take Profit**: Profit target levels
- **Position Sizing**: Capital allocation limits
- **Maximum Daily Trades**: Overtrading prevention
- **Maximum Drawdown**: Portfolio protection
- **Trailing Stops**: Profit protection (where applicable)

## Creating Custom Strategies

To create your own strategy:

1. Copy an existing strategy file as a template
2. Modify the parameters, indicators, and signals
3. Test with backtesting before live trading
4. Start with paper trading to validate performance

### Strategy File Structure
```yaml
name: "Your Strategy Name"
description: "Strategy description"
version: "1.0.0"

parameters:
  # Your configurable parameters

indicators:
  # Technical indicators to calculate

signals:
  buy:
    # Buy signal conditions
  sell:
    # Sell signal conditions

risk_management:
  # Risk management rules

metadata:
  # Strategy metadata
```

## Performance Notes

- **Backtesting**: Past performance doesn't guarantee future results
- **Market Conditions**: Strategies perform differently in trending vs. ranging markets
- **Timeframes**: Higher timeframes generally produce more reliable signals
- **Transaction Costs**: Include realistic commission and slippage in backtests
- **Capital Requirements**: Ensure sufficient capital for proper position sizing

## Support

For questions about strategies or creating custom strategies:
- Check the main documentation: `docs/STRATEGY_SCHEMAS.md`
- Run `jtrader --help` for CLI usage
- Use `jtrader config set-keys` to set up API access

## Disclaimer

These strategies are for educational and testing purposes. Always:
- Test thoroughly with paper trading
- Understand the risks involved
- Never risk more than you can afford to lose
- Consider your risk tolerance and investment goals