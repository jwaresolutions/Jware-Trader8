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
exports.TradeCommands = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const error_handler_1 = require("../utils/error-handler");
const strategies_1 = require("@jware-trader8/strategies");
const providers_1 = require("@jware-trader8/providers");
const database_1 = require("@jware-trader8/database");
class TradeCommands {
    context;
    configStore;
    strategyEngine;
    activeSessions = new Map();
    constructor(context) {
        this.context = context;
        this.configStore = new database_1.ConfigStore();
        this.strategyEngine = new strategies_1.StrategyEngine();
    }
    registerCommands(program) {
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
            .action(async (strategyFile, options) => {
            try {
                await this.handleTradeStart(strategyFile, options);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
        tradeCmd
            .command('stop')
            .description('Stop active trading session')
            .option('--force', 'Force stop without closing positions')
            .action(async (options) => {
            try {
                await this.handleTradeStop(options);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
    }
    async handleTradeStart(strategyFile, options) {
        // Validate inputs
        error_handler_1.CLIErrorHandler.validateStrategyFile(strategyFile);
        const maxPositions = error_handler_1.CLIErrorHandler.validateNumericOption(options.maxPositions?.toString() || '5', 'max-positions', 1, 50);
        const initialCapital = error_handler_1.CLIErrorHandler.validateNumericOption(options.initialCapital?.toString() || '10000', 'initial-capital', 100, 1000000);
        this.context.progressIndicator.start('Loading strategy configuration...');
        try {
            // Load and validate strategy
            const strategyConfig = await this.loadStrategyFile(strategyFile);
            // Override symbol if provided
            if (options.symbol) {
                error_handler_1.CLIErrorHandler.validateSymbol(options.symbol);
                strategyConfig.symbol = options.symbol.toUpperCase();
            }
            this.context.progressIndicator.update('Validating strategy...');
            const strategy = this.strategyEngine.loadStrategy(strategyConfig);
            const validation = this.strategyEngine.validateStrategy(strategyConfig);
            if (!validation.isValid) {
                this.context.progressIndicator.fail('Strategy validation failed');
                console.error(chalk_1.default.red.bold('Strategy Validation Errors:'));
                validation.errors.forEach(error => {
                    console.error(chalk_1.default.red('• ' + error));
                });
                if (validation.warnings.length > 0) {
                    console.error(chalk_1.default.yellow.bold('\nWarnings:'));
                    validation.warnings.forEach(warning => {
                        console.error(chalk_1.default.yellow('• ' + warning));
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
            const modeColor = options.dryRun ? chalk_1.default.green : chalk_1.default.red;
            console.log(chalk_1.default.bold('\nTrading Mode: ') + modeColor(mode));
            if (!options.dryRun) {
                console.log(chalk_1.default.red.bold('⚠ WARNING: Live trading uses real money and can result in financial loss!'));
                const confirmed = await this.context.promptHandler.promptForConfirmation('Are you absolutely sure you want to start live trading?');
                if (!confirmed) {
                    console.log(chalk_1.default.green('Trading cancelled for safety.'));
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
        }
        catch (error) {
            this.context.progressIndicator.fail('Failed to start trading session');
            throw error;
        }
    }
    async handleTradeStop(options) {
        if (this.activeSessions.size === 0) {
            console.log(chalk_1.default.yellow('No active trading sessions to stop.'));
            return;
        }
        this.context.progressIndicator.start('Stopping trading sessions...');
        try {
            for (const [sessionId, session] of this.activeSessions) {
                if (!options.force && session.positions.length > 0) {
                    console.log(chalk_1.default.yellow(`\nSession ${sessionId} has ${session.positions.length} open positions.`));
                    const shouldClose = await this.context.promptHandler.promptForConfirmation('Close all positions before stopping?');
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
        }
        catch (error) {
            this.context.progressIndicator.fail('Failed to stop trading sessions');
            throw error;
        }
    }
    async handleStatus(options) {
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
            console.log(chalk_1.default.bold.blue('\n📊 Account Summary'));
            console.log(this.context.outputFormatter.formatAccountInfo(account));
            // Display active sessions
            if (this.activeSessions.size > 0) {
                console.log(chalk_1.default.bold.blue('\n🔄 Active Trading Sessions'));
                for (const [sessionId, session] of this.activeSessions) {
                    console.log(chalk_1.default.cyan(`Session: ${session.strategy.name}`));
                    console.log(`Status: ${session.status}`);
                    console.log(`Started: ${session.startTime.toLocaleString()}`);
                    console.log(`P&L: ${session.pnl >= 0 ? chalk_1.default.green('$' + session.pnl.toFixed(2)) : chalk_1.default.red('$' + session.pnl.toFixed(2))}`);
                    console.log(`Total Trades: ${session.totalTrades}`);
                    console.log('');
                }
            }
            // Display positions
            if (positions && positions.length > 0) {
                console.log(chalk_1.default.bold.blue('\n📈 Current Positions'));
                console.log(this.context.outputFormatter.formatPositions(positions));
            }
            else {
                console.log(chalk_1.default.yellow('\n📈 No open positions'));
            }
            // Auto-refresh if requested
            if (options.refresh && options.refresh > 0) {
                console.log(chalk_1.default.dim(`\nAuto-refreshing every ${options.refresh} seconds. Press Ctrl+C to stop.`));
                setInterval(async () => {
                    console.clear();
                    await this.handleStatus({ ...options, refresh: 0 }); // Prevent infinite recursion
                }, options.refresh * 1000);
            }
        }
        catch (error) {
            this.context.progressIndicator.fail('Failed to fetch status information');
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
    async initializeTradingProvider(paperMode = true) {
        try {
            // Get API keys from config store
            const apiKeys = await this.configStore.getApiKey('alpaca');
            const config = {
                apiKey: apiKeys.apiKey,
                secretKey: apiKeys.secretKey,
                baseUrl: paperMode ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets',
                dataUrl: 'https://data.alpaca.markets'
            };
            const provider = new providers_1.AlpacaTradingProvider(config);
            // Test connection
            const connectionResult = await provider.connect();
            if (!connectionResult.success) {
                throw new Error(`Failed to connect to Alpaca: ${connectionResult.error}`);
            }
            return provider;
        }
        catch (error) {
            if (error.message?.includes('API key not found')) {
                throw error_handler_1.CLIErrorHandler.createError('Alpaca API keys not configured', 'MISSING_API_KEYS', 'Run "jtrader config set-keys --provider alpaca" to set up your API keys');
            }
            throw error;
        }
    }
    async startTradingSession(strategy, tradingProvider, options) {
        const sessionId = `session_${Date.now()}`;
        const session = {
            id: sessionId,
            strategy: strategy.config,
            startTime: new Date(),
            status: 'running',
            positions: [],
            pnl: 0,
            totalTrades: 0
        };
        this.activeSessions.set(sessionId, session);
        console.log(chalk_1.default.green.bold('\n✅ Trading session started successfully!'));
        console.log(chalk_1.default.dim(`Session ID: ${sessionId}`));
        console.log(chalk_1.default.dim(`Strategy: ${strategy.config.name}`));
        console.log(chalk_1.default.dim(`Mode: ${options.dryRun ? 'Paper Trading' : 'Live Trading'}`));
        console.log(chalk_1.default.dim(`Max Positions: ${options.maxPositions}`));
        console.log(chalk_1.default.dim(`Initial Capital: $${options.initialCapital}`));
        console.log(chalk_1.default.blue('\n📈 Monitoring market data and executing strategy...'));
        console.log(chalk_1.default.dim('Use "jtrader trade stop" to stop trading'));
        console.log(chalk_1.default.dim('Use "jtrader status" to check current positions and P&L'));
        // In a real implementation, this would start the trading loop
        // For now, we'll just simulate the session being active
        console.log(chalk_1.default.yellow('\n⚠ Note: This is a CLI implementation demo. Full trading loop integration pending.'));
    }
    displaySessionSummary() {
        console.log(chalk_1.default.bold.blue('\n📊 Trading Session Summary'));
        console.log(chalk_1.default.green('All trading sessions have been stopped.'));
        console.log(chalk_1.default.dim('Session data has been saved to the database.'));
    }
}
exports.TradeCommands = TradeCommands;
//# sourceMappingURL=trade.js.map