import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { format, parseISO } from 'date-fns';
import { CLIContext, BacktestOptions, BacktestDisplayResult } from '../types/cli-types';
import { CLIErrorHandler } from '../utils/error-handler';
import { BacktestProgressBar } from '../utils/progress-indicator';
import { StrategyEngine } from '@jware-trader8/strategies';
import { BacktestEngine } from '@jware-trader8/backtesting';
import { PolygonDataProvider } from '@jware-trader8/providers';
import { ConfigStore } from '@jware-trader8/database';
import { StrategyConfig, OHLCV, BacktestResult } from '@jware-trader8/types';

export class BacktestCommands {
  private context: CLIContext;
  private configStore: ConfigStore;
  private strategyEngine: StrategyEngine;
  private backtestEngine: BacktestEngine;

  constructor(context: CLIContext) {
    this.context = context;
    this.configStore = new ConfigStore();
    this.strategyEngine = new StrategyEngine();
    this.backtestEngine = new BacktestEngine(this.strategyEngine);
  }

  registerCommands(program: Command): void {
    program
      .command('backtest')
      .description('Run strategy backtesting against historical data')
      .argument('<strategy-file>', 'Path to strategy YAML file')
      .requiredOption('--symbol <symbol>', 'Symbol to test (e.g., BTCUSD, AAPL, SPY)')
      .requiredOption('--start <date>', 'Start date (YYYY-MM-DD)')
      .requiredOption('--end <date>', 'End date (YYYY-MM-DD)')
      .option('--timeframe <frame>', 'Timeframe: 1m, 5m, 15m, 1h, 1d', '1h')
      .option('--initial-capital <amount>', 'Initial capital', '10000')
      .option('--commission <rate>', 'Commission per trade (0.001 = 0.1%)', '0.001')
      .option('--output <format>', 'Output format: table, json, csv', 'table')
      .option('--save-results', 'Save results to database', false)
      .action(async (strategyFile: string, options: BacktestOptions) => {
        try {
          await this.handleBacktest(strategyFile, options);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });
  }

  async handleBacktest(strategyFile: string, options: BacktestOptions): Promise<void> {
    // Validate inputs
    CLIErrorHandler.validateStrategyFile(strategyFile);
    CLIErrorHandler.validateSymbol(options.symbol);
    CLIErrorHandler.validateDateRange(options.start, options.end);
    CLIErrorHandler.validateTimeframe(options.timeframe || '1h');
    CLIErrorHandler.validateOutputFormat(options.output || 'table');

    const initialCapital = CLIErrorHandler.validateNumericOption(
      options.initialCapital?.toString() || '10000',
      'initial-capital',
      100,
      10000000
    );

    const commission = CLIErrorHandler.validateNumericOption(
      options.commission?.toString() || '0.001',
      'commission',
      0,
      0.1
    );

    console.log(chalk.blue.bold('\n🔄 Starting Backtest\n'));

    this.context.progressIndicator.start('Loading strategy configuration...');

    try {
      // Load and validate strategy
      const strategyConfig = await this.loadStrategyFile(strategyFile);
      
      // Override symbol
      strategyConfig.symbol = options.symbol.toUpperCase();

      this.context.progressIndicator.update('Validating strategy...');
      const strategy = this.strategyEngine.loadStrategy(strategyConfig);
      const validation = this.strategyEngine.validateStrategy(strategyConfig);

      if (!validation.isValid) {
        this.context.progressIndicator.fail('Strategy validation failed');
        console.error(chalk.red.bold('Strategy Validation Errors:'));
        validation.errors.forEach((error: string) => {
          console.error(chalk.red('• ' + error));
        });
        process.exit(1);
      }

      this.context.progressIndicator.update('Initializing data provider...');

      // Initialize data provider
      const dataProvider = await this.initializeDataProvider();

      this.context.progressIndicator.update('Fetching historical data...');

      // Fetch historical data
      const startDate = parseISO(options.start);
      const endDate = parseISO(options.end);
      
      const historicalData = await dataProvider.getHistoricalData(
        options.symbol,
        options.timeframe || '1h',
        startDate,
        endDate
      );

      if (!historicalData || historicalData.length === 0) {
        throw CLIErrorHandler.createError(
          `No historical data found for ${options.symbol} in the specified date range`,
          'NO_DATA_FOUND',
          'Try a different symbol or date range, or check your Polygon API key'
        );
      }

      this.context.progressIndicator.succeed('Historical data loaded');

      // Display backtest setup
      console.log(chalk.blue.bold('📊 Backtest Configuration'));
      console.log(`Strategy: ${chalk.cyan(strategyConfig.name)}`);
      console.log(`Symbol: ${chalk.cyan(options.symbol)}`);
      console.log(`Period: ${chalk.cyan(options.start)} to ${chalk.cyan(options.end)}`);
      console.log(`Timeframe: ${chalk.cyan(options.timeframe || '1h')}`);
      console.log(`Data Points: ${chalk.cyan(historicalData.length.toLocaleString())}`);
      console.log(`Initial Capital: ${chalk.cyan('$' + initialCapital.toLocaleString())}`);
      console.log(`Commission: ${chalk.cyan((commission * 100).toFixed(2) + '%')}`);
      console.log('');

      // Run backtest with progress indication
      const progressBar = new BacktestProgressBar(historicalData.length);
      
      const backtestConfig = {
        initialCapital,
        commission,
        maxPositions: 10,
        onProgress: (processed: number) => progressBar.update(processed)
      };

      const result = await this.backtestEngine.runBacktest(strategy, historicalData, backtestConfig);
      progressBar.complete();

      // Display results
      await this.displayResults(result, options, strategyConfig);

      // Save results if requested
      if (options.saveResults) {
        await this.saveResults(result, strategyConfig, options);
        console.log(chalk.green('\n✅ Results saved to database'));
      }

    } catch (error) {
      this.context.progressIndicator.fail('Backtest failed');
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
      if ((error as any).code === 'ENOENT') {
        throw CLIErrorHandler.createError(
          `Strategy file not found: ${filePath}`,
          'STRATEGY_FILE_NOT_FOUND',
          'Check the file path and ensure the strategy file exists'
        );
      }
      throw error;
    }
  }

  private async initializeDataProvider(): Promise<PolygonDataProvider> {
    try {
      // Get API keys from config store
      const apiKeys = await this.configStore.getApiKey('polygon');
      
      const config = {
        apiKey: apiKeys.apiKey
      };

      const provider = new PolygonDataProvider(config);
      return provider;
    } catch (error) {
      if ((error as any).message?.includes('API key not found')) {
        throw CLIErrorHandler.createError(
          'Polygon API keys not configured',
          'MISSING_API_KEYS',
          'Run "jtrader config set-keys --provider polygon" to set up your API keys'
        );
      }
      throw error;
    }
  }

  private async displayResults(
    result: BacktestResult,
    options: BacktestOptions,
    strategyConfig: StrategyConfig
  ): Promise<void> {
    console.log(chalk.blue.bold('\n📈 Backtest Results\n'));

    const outputFormat = options.output || 'table';

    if (outputFormat === 'json') {
      console.log(this.context.outputFormatter.formatJSON(result));
      return;
    }

    if (outputFormat === 'csv') {
      if (result.trades && result.trades.length > 0) {
        console.log(this.context.outputFormatter.formatCSV(result.trades));
      } else {
        console.log(chalk.yellow('No trades to export'));
      }
      return;
    }

    // Table format (default)
    if (result.summary) {
      console.log(chalk.bold('📊 Performance Summary'));
      console.log(this.context.outputFormatter.formatPerformanceSummary(result.summary));
      console.log('');
    }

    if (result.trades && result.trades.length > 0) {
      console.log(chalk.bold('📋 Trade History'));
      console.log(this.context.outputFormatter.formatTrades(result.trades.slice(0, 20))); // Show first 20 trades
      
      if (result.trades.length > 20) {
        console.log(chalk.dim(`\n... and ${result.trades.length - 20} more trades`));
        console.log(chalk.dim('Use --output csv to export all trades'));
      }
      console.log('');
    } else {
      console.log(chalk.yellow('📋 No trades executed during backtest period'));
    }

    // Display equity curve (ASCII chart)
    if (result.equityCurve && result.equityCurve.length > 0) {
      console.log(chalk.bold('📈 Equity Curve'));
      this.displayEquityCurveASCII(result.equityCurve);
    }

    // Strategy performance insights
    this.displayPerformanceInsights(result);
  }

  private displayEquityCurveASCII(equityCurve: any[]): void {
    const maxWidth = 60;
    const height = 10;
    
    if (equityCurve.length < 2) {
      console.log(chalk.dim('Not enough data points for equity curve'));
      return;
    }

    const values = equityCurve.map(point => point.totalValue);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    if (range === 0) {
      console.log(chalk.dim('No value change during backtest period'));
      return;
    }

    // Create ASCII chart
    const chart: string[] = [];
    for (let i = 0; i < height; i++) {
      chart[i] = ' '.repeat(maxWidth);
    }

    // Plot points
    for (let i = 0; i < Math.min(equityCurve.length, maxWidth); i++) {
      const value = values[Math.floor((i / maxWidth) * values.length)];
      const normalizedValue = (value - minValue) / range;
      const y = Math.floor((1 - normalizedValue) * (height - 1));
      
      const row = chart[y].split('');
      row[i] = value >= equityCurve[0].totalValue ? '█' : '▄';
      chart[y] = row.join('');
    }

    // Display chart
    console.log(`${chalk.green('$' + maxValue.toFixed(0).padStart(8))} ┤${chart[0]}`);
    for (let i = 1; i < height - 1; i++) {
      console.log(`${' '.repeat(8)} │${chart[i]}`);
    }
    console.log(`${chalk.red('$' + minValue.toFixed(0).padStart(8))} ┤${chart[height - 1]}`);
    console.log(`${' '.repeat(9)}└${'─'.repeat(maxWidth)}`);
    console.log(`${' '.repeat(10)}${format(parseISO(equityCurve[0].timestamp), 'MMM yyyy').padEnd(Math.floor(maxWidth / 2))}${format(parseISO(equityCurve[equityCurve.length - 1].timestamp), 'MMM yyyy')}`);
    console.log('');
  }

  private displayPerformanceInsights(result: BacktestResult): void {
    if (!result.summary || !result.trades) return;

    console.log(chalk.bold('💡 Performance Insights'));
    
    const insights: string[] = [];

    // Win rate analysis
    if (result.summary.winRate > 60) {
      insights.push(chalk.green('✓ High win rate indicates good signal quality'));
    } else if (result.summary.winRate < 40) {
      insights.push(chalk.yellow('⚠ Low win rate - consider refining entry conditions'));
    }

    // Sharpe ratio analysis
    if (result.summary.sharpeRatio > 1.5) {
      insights.push(chalk.green('✓ Excellent risk-adjusted returns'));
    } else if (result.summary.sharpeRatio < 0.5) {
      insights.push(chalk.yellow('⚠ Poor risk-adjusted returns - consider risk management'));
    }

    // Drawdown analysis
    if (result.summary.maxDrawdown > 20) {
      insights.push(chalk.red('⚠ High maximum drawdown - consider position sizing or stop losses'));
    } else if (result.summary.maxDrawdown < 5) {
      insights.push(chalk.green('✓ Low drawdown indicates good risk control'));
    }

    // Trade frequency analysis
    const totalDays = (new Date(result.endDate) - new Date(result.startDate)) / (1000 * 60 * 60 * 24);
    const tradesPerWeek = (result.trades.length / totalDays) * 7;
    
    if (tradesPerWeek > 10) {
      insights.push(chalk.yellow('⚠ High trade frequency - watch for overtrading'));
    } else if (tradesPerWeek < 0.5) {
      insights.push(chalk.yellow('⚠ Low trade frequency - strategy may be too conservative'));
    }

    if (insights.length > 0) {
      insights.forEach(insight => console.log(insight));
    } else {
      console.log(chalk.dim('Strategy performance is within normal ranges'));
    }
    console.log('');
  }

  private async saveResults(
    result: BacktestResult,
    strategyConfig: StrategyConfig,
    options: BacktestOptions
  ): Promise<void> {
    // TODO: Implement database storage
    // This would save the backtest results to the database for future reference
    console.log(chalk.dim('Saving results to database... (implementation pending)'));
  }
}