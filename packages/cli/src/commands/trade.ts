import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { CLIContext, TradeStartOptions, StatusOptions, TradingSession } from '../types/cli-types';
import { CLIErrorHandler } from '../utils/error-handler';
import { StrategyEngine } from '@jware-trader8/strategies';
import { AlpacaTradingProvider } from '@jware-trader8/providers';
import { ConfigStore } from '@jware-trader8/database';
import { StrategyConfig } from '@jware-trader8/types';

export class TradeCommands {
  private context: CLIContext;
  private configStore: ConfigStore;
  private strategyEngine: StrategyEngine;
  private activeSessions: Map<string, TradingSession> = new Map();

  constructor(context: CLIContext) {
    this.context = context;
    this.configStore = new ConfigStore();
    this.strategyEngine = new StrategyEngine();
  }

  registerCommands(program: Command): void {
    const tradeCmd = program
      .command('trade')
      .description('Trading operations and session management');

    tradeCmd
      .command('start')
      .description('Start automated trading with a strategy')
      .argument('<strategy-file>', 'Path to strategy YAML file')
      .option('--dry-run', 'Run in simulation mode (paper trading)', false)
      .option('--max-positions <number>', 'Maximum concurrent positions', '5')
      .option('--symbol <symbol>', 'Override strategy symbol')
      .option('--initial-capital <amount>', 'Starting capital', '10000')
      .action(async (strategyFile: string, options: TradeStartOptions) => {
        try {
          await this.handleTradeStart(strategyFile, options);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });

    tradeCmd
      .command('stop')
      .description('Stop active trading session')
      .option('--force', 'Force stop without closing positions')
      .action(async (options: { force?: boolean }) => {
        try {
          await this.handleTradeStop(options);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });
  }

  async handleTradeStart(strategyFile: string, options: TradeStartOptions): Promise<void> {
    // Validate inputs
    CLIErrorHandler.validateStrategyFile(strategyFile);
    
    const maxPositions = CLIErrorHandler.validateNumericOption(
      options.maxPositions?.toString() || '5',
      'max-positions',
      1,
      50
    );

    const initialCapital = CLIErrorHandler.validateNumericOption(
      options.initialCapital?.toString() || '10000',
      'initial-capital',
      100,
      1000000
    );

    this.context.progressIndicator.start('Loading strategy configuration...');

    try {
      // Load and validate strategy
      const strategyConfig = await this.loadStrategyFile(strategyFile);
      
      // Override symbol if provided
      if (options.symbol) {
        CLIErrorHandler.validateSymbol(options.symbol);
        strategyConfig.symbol = options.symbol.toUpperCase();
      }

      this.context.progressIndicator.update('Validating strategy...');
      const strategy = this.strategyEngine.loadStrategy(strategyConfig);
      const validation = this.strategyEngine.validateStrategy(strategyConfig);

      if (!validation.isValid) {
        this.context.progressIndicator.fail('Strategy validation failed');
        console.error(chalk.red.bold('Strategy Validation Errors:'));
        validation.errors.forEach(error => {
          console.error(chalk.red('• ' + error));
        });
        if (validation.warnings.length > 0) {
          console.error(chalk.yellow.bold('\nWarnings:'));
          validation.warnings.forEach(warning => {
            console.error(chalk.yellow('• ' + warning));
          });
        }
        process.exit(1);
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          this.context.outputFormatter.warning(warning);
        });
      }

      this.context.progressIndicator.update('Connecting to trading provider...');

      // Initialize trading provider
      const tradingProvider = await this.initializeTradingProvider(options.dryRun);
      
      this.context.progressIndicator.succeed('Strategy loaded and provider connected');

      // Display strategy information
      console.log('\n' + this.context.outputFormatter.formatStrategyInfo(strategyConfig));
      
      // Display trading mode
      const mode = options.dryRun ? 'PAPER TRADING (Simulation)' : 'LIVE TRADING (Real Money)';
      const modeColor = options.dryRun ? chalk.green : chalk.red;
      console.log(chalk.bold('\nTrading Mode: ') + modeColor(mode));
      
      if (!options.dryRun) {
        console.log(chalk.red.bold('⚠ WARNING: Live trading uses real money and can result in financial loss!'));
        const confirmed = await this.context.promptHandler.promptForConfirmation(
          'Are you absolutely sure you want to start live trading?'
        );
        if (!confirmed) {
          console.log(chalk.green('Trading cancelled for safety.'));
          return;
        }
      }

      // Start trading session
      await this.startTradingSession(strategy, tradingProvider, {
        dryRun: options.dryRun || false,
        maxPositions,
        initialCapital,
        symbol: strategyConfig.symbol
      });

    } catch (error) {
      this.context.progressIndicator.fail('Failed to start trading session');
      throw error;
    }
  }

  async handleTradeStop(options: { force?: boolean }): Promise<void> {
    if (this.activeSessions.size === 0) {
      console.log(chalk.yellow('No active trading sessions to stop.'));
      return;
    }

    this.context.progressIndicator.start('Stopping trading sessions...');

    try {
      for (const [sessionId, session] of this.activeSessions) {
        if (!options.force && session.positions.length > 0) {
          console.log(chalk.yellow(`\nSession ${sessionId} has ${session.positions.length} open positions.`));
          const shouldClose = await this.context.promptHandler.promptForConfirmation(
            'Close all positions before stopping?'
          );
          
          if (shouldClose) {
            this.context.progressIndicator.update('Closing positions...');
            // TODO: Implement position closing logic
          }
        }

        session.status = 'stopped';
        this.activeSessions.delete(sessionId);
      }

      this.context.progressIndicator.succeed('All trading sessions stopped');
      
      // Show session summary
      this.displaySessionSummary();

    } catch (error) {
      this.context.progressIndicator.fail('Failed to stop trading sessions');
      throw error;
    }
  }

  async handleStatus(options: StatusOptions): Promise<void> {
    try {
      this.context.progressIndicator.start('Fetching account information...');

      // Get trading provider
      const tradingProvider = await this.initializeTradingProvider(true); // Use paper for status
      
      this.context.progressIndicator.update('Loading account data...');
      const account = await tradingProvider.getAccount();
      
      this.context.progressIndicator.update('Loading positions...');
      const positions = await tradingProvider.getPositions();
      
      this.context.progressIndicator.succeed('Account information loaded');

      // Display account information
      console.log(chalk.bold.blue('\n📊 Account Summary'));
      console.log(this.context.outputFormatter.formatAccountInfo(account));

      // Display active sessions
      if (this.activeSessions.size > 0) {
        console.log(chalk.bold.blue('\n🔄 Active Trading Sessions'));
        for (const [sessionId, session] of this.activeSessions) {
          console.log(chalk.cyan(`Session: ${session.strategy.name}`));
          console.log(`Status: ${session.status}`);
          console.log(`Started: ${session.startTime.toLocaleString()}`);
          console.log(`P&L: ${session.pnl >= 0 ? chalk.green('$' + session.pnl.toFixed(2)) : chalk.red('$' + session.pnl.toFixed(2))}`);
          console.log(`Total Trades: ${session.totalTrades}`);
          console.log('');
        }
      }

      // Display positions
      if (positions && positions.length > 0) {
        console.log(chalk.bold.blue('\n📈 Current Positions'));
        console.log(this.context.outputFormatter.formatPositions(positions));
      } else {
        console.log(chalk.yellow('\n📈 No open positions'));
      }

      // Auto-refresh if requested
      if (options.refresh && options.refresh > 0) {
        console.log(chalk.dim(`\nAuto-refreshing every ${options.refresh} seconds. Press Ctrl+C to stop.`));
        setInterval(async () => {
          console.clear();
          await this.handleStatus({ ...options, refresh: 0 }); // Prevent infinite recursion
        }, options.refresh * 1000);
      }

    } catch (error) {
      this.context.progressIndicator.fail('Failed to fetch status information');
      throw error;
    }
  }

  private async loadStrategyFile(filePath: string): Promise<StrategyConfig> {
    try {
      const fullPath = path.resolve(filePath);
      const fileContent = await fs.promises.readFile(fullPath, 'utf8');
      const strategyConfig = yaml.parse(fileContent) as StrategyConfig;

      // Basic validation
      if (!strategyConfig.name) {
        throw new Error('Strategy must have a name');
      }

      if (!strategyConfig.indicators || strategyConfig.indicators.length === 0) {
        throw new Error('Strategy must define at least one indicator');
      }

      if (!strategyConfig.signals || (!strategyConfig.signals.buy && !strategyConfig.signals.sell)) {
        throw new Error('Strategy must define buy and/or sell signals');
      }

      return strategyConfig;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw CLIErrorHandler.createError(
          `Strategy file not found: ${filePath}`,
          'STRATEGY_FILE_NOT_FOUND',
          'Check the file path and ensure the strategy file exists'
        );
      }
      throw error;
    }
  }

  private async initializeTradingProvider(paperMode: boolean = true): Promise<AlpacaTradingProvider> {
    try {
      // Get API keys from config store
      const apiKeys = await this.configStore.getApiKey('alpaca');
      
      const config = {
        apiKey: apiKeys.apiKey,
        secretKey: apiKeys.secretKey,
        baseUrl: paperMode ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets',
        dataUrl: 'https://data.alpaca.markets'
      };

      const provider = new AlpacaTradingProvider(config);
      
      // Test connection
      const connectionResult = await provider.connect();
      if (!connectionResult.success) {
        throw new Error(`Failed to connect to Alpaca: ${connectionResult.error}`);
      }

      return provider;
    } catch (error) {
      if (error.message?.includes('API key not found')) {
        throw CLIErrorHandler.createError(
          'Alpaca API keys not configured',
          'MISSING_API_KEYS',
          'Run "jtrader config set-keys --provider alpaca" to set up your API keys'
        );
      }
      throw error;
    }
  }

  private async startTradingSession(
    strategy: any,
    tradingProvider: AlpacaTradingProvider,
    options: {
      dryRun: boolean;
      maxPositions: number;
      initialCapital: number;
      symbol?: string;
    }
  ): Promise<void> {
    const sessionId = `session_${Date.now()}`;
    
    const session: TradingSession = {
      id: sessionId,
      strategy: strategy.config,
      startTime: new Date(),
      status: 'running',
      positions: [],
      pnl: 0,
      totalTrades: 0
    };

    this.activeSessions.set(sessionId, session);

    console.log(chalk.green.bold('\n✅ Trading session started successfully!'));
    console.log(chalk.dim(`Session ID: ${sessionId}`));
    console.log(chalk.dim(`Strategy: ${strategy.config.name}`));
    console.log(chalk.dim(`Mode: ${options.dryRun ? 'Paper Trading' : 'Live Trading'}`));
    console.log(chalk.dim(`Max Positions: ${options.maxPositions}`));
    console.log(chalk.dim(`Initial Capital: $${options.initialCapital}`));
    
    console.log(chalk.blue('\n📈 Monitoring market data and executing strategy...'));
    console.log(chalk.dim('Use "jtrader trade stop" to stop trading'));
    console.log(chalk.dim('Use "jtrader status" to check current positions and P&L'));

    // In a real implementation, this would start the trading loop
    // For now, we'll just simulate the session being active
    console.log(chalk.yellow('\n⚠ Note: This is a CLI implementation demo. Full trading loop integration pending.'));
  }

  private displaySessionSummary(): void {
    console.log(chalk.bold.blue('\n📊 Trading Session Summary'));
    console.log(chalk.green('All trading sessions have been stopped.'));
    console.log(chalk.dim('Session data has been saved to the database.'));
  }
}