# Jware-Trader8 Setup Guide

## Issue Resolution: npm workspace compatibility

The original setup had `workspace:*` dependencies which are not supported by all npm versions. This has been fixed.

## Fixed Installation Steps

### Option 1: Automated Setup (Recommended)
```bash
npm run setup
```

### Option 2: Manual Setup (If automated fails)
```bash
# Step 1: Install root dependencies
npm install --no-optional

# Step 2: Build packages in dependency order
cd packages/types && npm run build && cd ../..
cd packages/utils && npm run build && cd ../..
cd packages/core && npm run build && cd ../..
cd packages/providers && npm run build && cd ../..
cd packages/strategies && npm run build && cd ../..
cd packages/backtesting && npm run build && cd ../..
cd packages/database && npm run build && cd ../..
cd packages/cli && npm run build && cd ../..
```

### Option 3: Package-by-package (If workspace issues persist)
```bash
# Install and build each package individually
for pkg in types utils core providers strategies backtesting database cli; do
  echo "Building $pkg..."
  cd packages/$pkg
  npm install --no-optional
  npm run build
  cd ../..
done
```

## Quick Start After Setup

1. **Make CLI globally available:**
   ```bash
   npm link packages/cli
   ```

2. **Configure API keys:**
   ```bash
   jtrader config set-keys --provider alpaca
   jtrader config set-keys --provider polygon
   ```

3. **Run your first backtest:**
   ```bash
   jtrader backtest packages/cli/strategies/examples/sma-crossover.yaml \
     --symbol BTCUSD --start 2024-01-01 --end 2024-06-01
   ```

4. **Start paper trading:**
   ```bash
   jtrader trade start packages/cli/strategies/examples/sma-crossover.yaml --dry-run
   ```

## Troubleshooting

### Issue: "workspace:*" protocol errors
**Solution:** This has been fixed by replacing `workspace:*` with standard version numbers.

### Issue: Package not found during build
**Solution:** Build packages in dependency order (types → utils → core → etc.)

### Issue: Permission errors
**Solution:** 
```bash
chmod +x setup-fix.js
node setup-fix.js
```

### Issue: TypeScript compilation errors
**Solution:** Ensure packages are built in the correct order. Types must be built first.

## Verification

After successful setup, verify with:
```bash
# Check if CLI is working
jtrader --help

# Check if packages are built
ls packages/*/dist

# Run a quick test
npm test packages/types
```

## Architecture Notes

The project uses npm workspaces with these packages:
- `@jware-trader8/types` - Core TypeScript definitions
- `@jware-trader8/utils` - Shared utilities
- `@jware-trader8/core` - Trading interfaces
- `@jware-trader8/providers` - Alpaca & Polygon integrations
- `@jware-trader8/strategies` - Strategy engine & indicators
- `@jware-trader8/backtesting` - Portfolio management & analytics
- `@jware-trader8/database` - Configuration & trade storage
- `@jware-trader8/cli` - Command-line interface

Each package can be built and tested independently, but they have dependencies that require building in the correct order.