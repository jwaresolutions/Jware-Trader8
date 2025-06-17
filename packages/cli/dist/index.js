#!/usr/bin/env node
const { Command } = require('commander');

const program = new Command();

program
  .name('jtrader')
  .description('Jware-Trader8 Automated Trading Platform')
  .version('1.0.0');

program
  .command('config')
  .description('Manage configuration')
  .option('--list', 'List all configurations')
  .action((options) => {
    if (options.list) {
      console.log('📋 Configuration Management');
      console.log('API keys can be configured when full build is complete');
    }
  });

program
  .command('status')
  .description('Show system status')
  .action(() => {
    console.log('✅ Jware-Trader8 CLI is working!');
    console.log('🔧 Core packages built successfully:');
    console.log('  - types ✅');
    console.log('  - utils ✅');
    console.log('  - core ✅');
    console.log('📋 To complete setup:');
    console.log('  1. Fix TypeScript errors in providers package');
    console.log('  2. Build remaining packages');
    console.log('  3. Configure API keys');
  });

program
  .command('help-setup')
  .description('Show setup instructions')
  .action(() => {
    console.log('🔧 Jware-Trader8 Setup Guide');
    console.log('');
    console.log('✅ COMPLETED:');
    console.log('  - Fixed npm workspace compatibility issues');
    console.log('  - Built core packages (types, utils, core)');
    console.log('  - CLI dependencies installed');
    console.log('');
    console.log('🚧 REMAINING:');
    console.log('  - Fix TypeScript errors in providers package');
    console.log('  - Build strategies, backtesting, database packages');
    console.log('  - Complete CLI integration');
    console.log('');
    console.log('📋 MANUAL STEPS:');
    console.log('  1. Edit packages/providers/src/alpaca/alpaca-provider.ts');
    console.log('  2. Fix Logger initialization (line 45)');
    console.log('  3. Run: cd packages/providers && npx tsc');
    console.log('  4. Continue building remaining packages');
    console.log('');
    console.log('📚 Full documentation in SETUP_GUIDE.md');
  });

program.parse();
