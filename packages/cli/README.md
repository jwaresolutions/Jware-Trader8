# Jware-Trader8 CLI

The command-line interface for the Jware-Trader8 automated trading platform. This package provides a comprehensive CLI tool for managing trading strategies, running backtests, and executing automated trading operations.

## Installation

### Development Installation
```bash
cd packages/cli
npm install
npm run build
npm link
```

### Global Usage
After linking, the CLI is available globally:
```bash
jtrader --help
```

## Commands Overview

### Configuration Commands

#### Set API Keys
Configure API keys for trading providers:
```bash
# Interactive setup for Alpaca
jtrader config set-keys --provider alpaca

# Interactive setup for Polygon
jtrader config set-keys --provider polygon
```

#### Configuration Management
```bash
# List all configuration settings
jtrader config list

# Get specific configuration value
jtrader config get trading.provider

# Set configuration value
jtrader config set trading.provider alpaca

# Reset all configuration to defaults
jtrader config reset

# Test API key connectivity
jtrader config test-keys --provider alpaca
jtrader config test-keys --provider all
```

### Trading Commands

#### Start Trading
Start automated trading with a strategy:
```bash
# Paper trading (recommended for testing)
jtrader trade start strategies/examples/sma-crossover.yaml --dry-run

# Live trading (real money)
jtrader trade start strategies/examples/rsi-mean-reversion.yaml

# With custom parameters
jtrader trade start strategies/examples/momentum-breakout.yaml \
  --dry-run \
  --symbol SPY \
  --max-positions 3 \
  --initial-capital 25000
```

#### Stop Trading
Stop active trading sessions:
```bash
# Safe stop (closes positions)
jtrader trade stop

# Force stop (keeps positions open)
jtrader trade stop --force
```

#### Check Status
View current trading status:
```bash
# Basic status
jtrader status

# Detailed status with positions
jtrader status --detailed

# Auto-refreshing status (every 30 seconds)
jtrader status --refresh 30
```

### Backtesting Commands

#### Run Backtest
Test strategies against historical data:
```bash
# Basic backtest
jtrader backtest strategies/examples/sma-crossover.yaml \
  --symbol BTCUSD \
  --start 2024-01-01 \
  --end 2024-06-01

# Advanced backtest with custom parameters
jtrader backtest strategies/examples/rsi-mean-reversion.yaml \
  --symbol AAPL \
  --start 2023-01-01 \
  --end 2024-01-01 \
  --timeframe 15m \
  --initial-capital 50000 \
  --commission 0.0005 \
  --output json

# Export results to CSV
jtrader backtest strategies/examples/momentum-breakout.yaml \
  --symbol SPY \
  --start 2024-01-01 \
  --end 2024-06-01 \
  --output csv > backtest_results.csv

# Save results to database
jtrader backtest strategies/examples/sma-crossover.yaml \
  --symbol ETHUSD \
  --start 2024-01-01 \
  --end 2024-06-01 \
  --save-results
```

## Strategy Files

The CLI works with YAML strategy files that define trading logic. Example strategies are provided in `strategies/examples/`:

### Available Example Strategies

1. **SMA Crossover** (`sma-crossover.yaml`)
   - Trend-following strategy
   - Uses moving average crossovers
   - Good for trending markets
   - Beginner-friendly

2. **RSI Mean Reversion** (`rsi-mean-reversion.yaml`)
   - Contrarian strategy
   - Uses RSI overbought/oversold levels
   - Works well in ranging markets
   - Intermediate complexity

3. **Momentum Breakout** (`momentum-breakout.yaml`)
   - Momentum-based strategy
   - Uses volume-confirmed breakouts
   - Advanced risk management
   - Requires higher capital

### Creating Custom Strategies

Copy an example strategy and modify it:
```bash
cp strategies/examples/sma-crossover.yaml my-strategy.yaml
# Edit my-strategy.yaml with your parameters
jtrader backtest my-strategy.yaml --symbol BTCUSD --start 2024-01-01 --end 2024-06-01
```

## Output Formats

### Table Format (Default)
Clean, colored terminal output with formatted tables:
```bash
jtrader backtest strategy.yaml --symbol BTCUSD --start 2024-01-01 --end 2024-06-01
```

### JSON Format
Structured data for programmatic use:
```bash
jtrader backtest strategy.yaml --symbol BTCUSD --start 2024-01-01 --end 2024-06-01 --output json
```

### CSV Format
Trade history export for analysis in spreadsheets:
```bash
jtrader backtest strategy.yaml --symbol BTCUSD --start 2024-01-01 --end 2024-06-01 --output csv
```

## Configuration

### Environment Variables
The CLI respects these environment variables:
- `NODE_ENV`: Set to 'development' for debug output
- `JTRADER_LOG_LEVEL`: Set logging level (debug, info, warn, error)

### Configuration Files
Configuration is stored securely in the local database:
- API keys are encrypted at rest
- Settings are environment-specific
- Automatic backup and recovery

### Security Features
- **Encrypted Storage**: All API keys encrypted with AES-256-GCM
- **Secure Prompts**: Hidden password input for sensitive data
- **Paper Trading Default**: Always defaults to safe paper trading mode
- **Confirmation Prompts**: Requires confirmation for risky operations

## Error Handling

The CLI provides helpful error messages with suggestions:

```bash
# Missing API keys
Error: Alpaca API keys not configured
Suggestion: Run "jtrader config set-keys --provider alpaca" to set up your API keys

# Invalid strategy file
Error: Strategy file not found: missing-strategy.yaml
Suggestion: Check the file path and ensure the strategy file exists

# Invalid symbol
Error: Invalid symbol format: invalid-symbol!
Suggestion: Symbol should only contain letters and numbers (e.g., BTCUSD, AAPL)
```

## Performance Features

### Progress Indication
- Real-time progress bars for long-running operations
- ETA estimation for backtesting
- Data download progress for large datasets

### Memory Efficiency
- Streaming data processing for large backtests
- Memory usage optimized for datasets with 1M+ data points
- Automatic cleanup of temporary data

### Responsive Interface
- Fast command startup (<2 seconds)
- Quick strategy loading and validation
- Instant help and status commands

## Development

### Project Structure
```
packages/cli/
├── src/
│   ├── index.ts              # Main entry point
│   ├── cli.ts                # CLI application setup
│   ├── commands/             # Command implementations
│   │   ├── trade.ts          # Trading commands
│   │   ├── backtest.ts       # Backtesting commands
│   │   └── config.ts         # Configuration commands
│   ├── utils/                # Utility classes
│   │   ├── output-formatter.ts
│   │   ├── progress-indicator.ts
│   │   ├── prompt-handler.ts
│   │   └── error-handler.ts
│   └── types/                # CLI-specific types
├── tests/                    # Test files
├── strategies/examples/      # Example strategies
└── bin/jtrader              # Executable script
```

### Adding New Commands
1. Create command class in `src/commands/`
2. Implement command registration and handlers
3. Add tests in `tests/commands/`
4. Register in main CLI application

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- trade.test.ts

# Watch mode
npm run test:watch
```

### Building
```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Clean build artifacts
npm run clean
```

## Troubleshooting

### Common Issues

#### Command Not Found
```bash
jtrader: command not found
```
**Solution**: Run `npm link` in the CLI package directory

#### API Connection Errors
```bash
Error: Unable to connect to trading provider
```
**Solution**: 
1. Check API keys with `jtrader config test-keys`
2. Verify internet connection
3. Ensure API keys are for the correct environment (paper vs live)

#### Strategy Validation Errors
```bash
Error: Strategy must have a name
```
**Solution**: Check YAML syntax and ensure all required fields are present

#### Out of Memory During Backtesting
```bash
Error: JavaScript heap out of memory
```
**Solution**: 
1. Use shorter date ranges
2. Use higher timeframes (1h instead of 1m)
3. Increase Node.js memory limit: `node --max-old-space-size=4096`

### Debug Mode
Enable debug output for troubleshooting:
```bash
NODE_ENV=development jtrader backtest strategy.yaml --symbol BTCUSD --start 2024-01-01 --end 2024-06-01
```

## Support

### Documentation
- Strategy schemas: `docs/STRATEGY_SCHEMAS.md`
- Implementation guide: `docs/IMPLEMENTATION_GUIDE.md`
- Project structure: `docs/PROJECT_STRUCTURE.md`

### Getting Help
```bash
# General help
jtrader --help

# Command-specific help
jtrader trade --help
jtrader backtest --help
jtrader config --help
```

### Example Workflows

#### First-Time Setup
```bash
# 1. Set up API keys
jtrader config set-keys --provider alpaca
jtrader config set-keys --provider polygon

# 2. Test connectivity
jtrader config test-keys --provider all

# 3. Run a simple backtest
jtrader backtest strategies/examples/sma-crossover.yaml \
  --symbol BTCUSD \
  --start 2024-01-01 \
  --end 2024-06-01

# 4. Start paper trading
jtrader trade start strategies/examples/sma-crossover.yaml --dry-run

# 5. Monitor status
jtrader status --detailed
```

#### Strategy Development Workflow
```bash
# 1. Copy example strategy
cp strategies/examples/sma-crossover.yaml my-strategy.yaml

# 2. Edit strategy parameters
# (edit my-strategy.yaml)

# 3. Test with backtest
jtrader backtest my-strategy.yaml --symbol AAPL --start 2023-01-01 --end 2024-01-01

# 4. Optimize parameters
# (edit my-strategy.yaml based on results)

# 5. Re-test
jtrader backtest my-strategy.yaml --symbol AAPL --start 2023-01-01 --end 2024-01-01

# 6. Paper trade
jtrader trade start my-strategy.yaml --dry-run

# 7. Monitor performance
jtrader status --refresh 60
```

## License

MIT License - see LICENSE file for details.