"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacktestCommands = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const date_fns_1 = require("date-fns");
const error_handler_1 = require("../utils/error-handler");
const progress_indicator_1 = require("../utils/progress-indicator");
const strategies_1 = require("@jware-trader8/strategies");
const backtesting_1 = require("@jware-trader8/backtesting");
const providers_1 = require("@jware-trader8/providers");
const database_1 = require("@jware-trader8/database");
class BacktestCommands {
    context;
    configStore;
    strategyEngine;
    backtestEngine;
    constructor(context) {
        this.context = context;
        this.configStore = new database_1.ConfigStore();
        this.strategyEngine = new strategies_1.StrategyEngine();
        this.backtestEngine = new backtesting_1.BacktestEngine(this.strategyEngine);
    }
    registerCommands(program) {
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
            .action(async (strategyFile, options) => {
            try {
                await this.handleBacktest(strategyFile, options);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
    }
    async handleBacktest(strategyFile, options) {
        // Validate inputs
        error_handler_1.CLIErrorHandler.validateStrategyFile(strategyFile);
        error_handler_1.CLIErrorHandler.validateSymbol(options.symbol);
        error_handler_1.CLIErrorHandler.validateDateRange(options.start, options.end);
        error_handler_1.CLIErrorHandler.validateTimeframe(options.timeframe || '1h');
        error_handler_1.CLIErrorHandler.validateOutputFormat(options.output || 'table');
        const initialCapital = error_handler_1.CLIErrorHandler.validateNumericOption(options.initialCapital?.toString() || '10000', 'initial-capital', 100, 10000000);
        const commission = error_handler_1.CLIErrorHandler.validateNumericOption(options.commission?.toString() || '0.001', 'commission', 0, 0.1);
        console.log(chalk_1.default.blue.bold('\n🔄 Starting Backtest\n'));
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
                console.error(chalk_1.default.red.bold('Strategy Validation Errors:'));
                validation.errors.forEach((error) => {
                    console.error(chalk_1.default.red('• ' + error));
                });
                process.exit(1);
            }
            this.context.progressIndicator.update('Initializing data provider...');
            // Initialize data provider
            const dataProvider = await this.initializeDataProvider();
            this.context.progressIndicator.update('Fetching historical data...');
            // Fetch historical data
            const startDate = (0, date_fns_1.parseISO)(options.start);
            const endDate = (0, date_fns_1.parseISO)(options.end);
            const historicalData = await dataProvider.getHistoricalData(options.symbol, options.timeframe || '1h', startDate, endDate);
            if (!historicalData || historicalData.length === 0) {
                throw error_handler_1.CLIErrorHandler.createError(`No historical data found for ${options.symbol} in the specified date range`, 'NO_DATA_FOUND', 'Try a different symbol or date range, or check your Polygon API key');
            }
            this.context.progressIndicator.succeed('Historical data loaded');
            // Display backtest setup
            console.log(chalk_1.default.blue.bold('📊 Backtest Configuration'));
            console.log(`Strategy: ${chalk_1.default.cyan(strategyConfig.name)}`);
            console.log(`Symbol: ${chalk_1.default.cyan(options.symbol)}`);
            console.log(`Period: ${chalk_1.default.cyan(options.start)} to ${chalk_1.default.cyan(options.end)}`);
            console.log(`Timeframe: ${chalk_1.default.cyan(options.timeframe || '1h')}`);
            console.log(`Data Points: ${chalk_1.default.cyan(historicalData.length.toLocaleString())}`);
            console.log(`Initial Capital: ${chalk_1.default.cyan('$' + initialCapital.toLocaleString())}`);
            console.log(`Commission: ${chalk_1.default.cyan((commission * 100).toFixed(2) + '%')}`);
            console.log('');
            // Run backtest with progress indication
            const progressBar = new progress_indicator_1.BacktestProgressBar(historicalData.length);
            const backtestConfig = {
                initialCapital,
                commission,
                maxPositions: 10,
                onProgress: (processed) => progressBar.update(processed)
            };
            const result = await this.backtestEngine.runBacktest(strategy, historicalData, backtestConfig);
            progressBar.complete();
            // Display results
            await this.displayResults(result, options, strategyConfig);
            // Save results if requested
            if (options.saveResults) {
                await this.saveResults(result, strategyConfig, options);
                console.log(chalk_1.default.green('\n✅ Results saved to database'));
            }
        }
        catch (error) {
            this.context.progressIndicator.fail('Backtest failed');
            throw error;
        }
    }
    async loadStrategyFile(filePath) {
        try {
            const fullPath = path.resolve(filePath);
            const fileContent = await fs.promises.readFile(fullPath, 'utf8');
            const strategyConfig = yaml.parse(fileContent);
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
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                throw error_handler_1.CLIErrorHandler.createError(`Strategy file not found: ${filePath}`, 'STRATEGY_FILE_NOT_FOUND', 'Check the file path and ensure the strategy file exists');
            }
            throw error;
        }
    }
    async initializeDataProvider() {
        try {
            // Get API keys from config store
            const apiKeys = await this.configStore.getApiKey('polygon');
            const config = {
                apiKey: apiKeys.apiKey
            };
            const provider = new providers_1.PolygonDataProvider(config);
            return provider;
        }
        catch (error) {
            if (error.message?.includes('API key not found')) {
                throw error_handler_1.CLIErrorHandler.createError('Polygon API keys not configured', 'MISSING_API_KEYS', 'Run "jtrader config set-keys --provider polygon" to set up your API keys');
            }
            throw error;
        }
    }
    async displayResults(result, options, strategyConfig) {
        console.log(chalk_1.default.blue.bold('\n📈 Backtest Results\n'));
        const outputFormat = options.output || 'table';
        if (outputFormat === 'json') {
            console.log(this.context.outputFormatter.formatJSON(result));
            return;
        }
        if (outputFormat === 'csv') {
            if (result.trades && result.trades.length > 0) {
                console.log(this.context.outputFormatter.formatCSV(result.trades));
            }
            else {
                console.log(chalk_1.default.yellow('No trades to export'));
            }
            return;
        }
        // Table format (default)
        if (result.summary) {
            console.log(chalk_1.default.bold('📊 Performance Summary'));
            console.log(this.context.outputFormatter.formatPerformanceSummary(result.summary));
            console.log('');
        }
        if (result.trades && result.trades.length > 0) {
            console.log(chalk_1.default.bold('📋 Trade History'));
            console.log(this.context.outputFormatter.formatTrades(result.trades.slice(0, 20))); // Show first 20 trades
            if (result.trades.length > 20) {
                console.log(chalk_1.default.dim(`\n... and ${result.trades.length - 20} more trades`));
                console.log(chalk_1.default.dim('Use --output csv to export all trades'));
            }
            console.log('');
        }
        else {
            console.log(chalk_1.default.yellow('📋 No trades executed during backtest period'));
        }
        // Display equity curve (ASCII chart)
        if (result.equityCurve && result.equityCurve.length > 0) {
            console.log(chalk_1.default.bold('📈 Equity Curve'));
            this.displayEquityCurveASCII(result.equityCurve);
        }
        // Strategy performance insights
        this.displayPerformanceInsights(result);
    }
    displayEquityCurveASCII(equityCurve) {
        const maxWidth = 60;
        const height = 10;
        if (equityCurve.length < 2) {
            console.log(chalk_1.default.dim('Not enough data points for equity curve'));
            return;
        }
        const values = equityCurve.map(point => point.totalValue);
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const range = maxValue - minValue;
        if (range === 0) {
            console.log(chalk_1.default.dim('No value change during backtest period'));
            return;
        }
        // Create ASCII chart
        const chart = [];
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
        console.log(`${chalk_1.default.green('$' + maxValue.toFixed(0).padStart(8))} ┤${chart[0]}`);
        for (let i = 1; i < height - 1; i++) {
            console.log(`${' '.repeat(8)} │${chart[i]}`);
        }
        console.log(`${chalk_1.default.red('$' + minValue.toFixed(0).padStart(8))} ┤${chart[height - 1]}`);
        console.log(`${' '.repeat(9)}└${'─'.repeat(maxWidth)}`);
        console.log(`${' '.repeat(10)}${(0, date_fns_1.format)((0, date_fns_1.parseISO)(equityCurve[0].timestamp), 'MMM yyyy').padEnd(Math.floor(maxWidth / 2))}${(0, date_fns_1.format)((0, date_fns_1.parseISO)(equityCurve[equityCurve.length - 1].timestamp), 'MMM yyyy')}`);
        console.log('');
    }
    displayPerformanceInsights(result) {
        if (!result.summary || !result.trades)
            return;
        console.log(chalk_1.default.bold('💡 Performance Insights'));
        const insights = [];
        // Win rate analysis
        if (result.summary.winRate > 60) {
            insights.push(chalk_1.default.green('✓ High win rate indicates good signal quality'));
        }
        else if (result.summary.winRate < 40) {
            insights.push(chalk_1.default.yellow('⚠ Low win rate - consider refining entry conditions'));
        }
        // Sharpe ratio analysis
        if (result.summary.sharpeRatio > 1.5) {
            insights.push(chalk_1.default.green('✓ Excellent risk-adjusted returns'));
        }
        else if (result.summary.sharpeRatio < 0.5) {
            insights.push(chalk_1.default.yellow('⚠ Poor risk-adjusted returns - consider risk management'));
        }
        // Drawdown analysis
        if (result.summary.maxDrawdown > 20) {
            insights.push(chalk_1.default.red('⚠ High maximum drawdown - consider position sizing or stop losses'));
        }
        else if (result.summary.maxDrawdown < 5) {
            insights.push(chalk_1.default.green('✓ Low drawdown indicates good risk control'));
        }
        // Trade frequency analysis
        const totalDays = (new Date(result.endDate) - new Date(result.startDate)) / (1000 * 60 * 60 * 24);
        const tradesPerWeek = (result.trades.length / totalDays) * 7;
        if (tradesPerWeek > 10) {
            insights.push(chalk_1.default.yellow('⚠ High trade frequency - watch for overtrading'));
        }
        else if (tradesPerWeek < 0.5) {
            insights.push(chalk_1.default.yellow('⚠ Low trade frequency - strategy may be too conservative'));
        }
        if (insights.length > 0) {
            insights.forEach(insight => console.log(insight));
        }
        else {
            console.log(chalk_1.default.dim('Strategy performance is within normal ranges'));
        }
        console.log('');
    }
    async saveResults(result, strategyConfig, options) {
        // TODO: Implement database storage
        // This would save the backtest results to the database for future reference
        console.log(chalk_1.default.dim('Saving results to database... (implementation pending)'));
    }
}
exports.BacktestCommands = BacktestCommands;
//# sourceMappingURL=backtest.js.map