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
exports.createCLI = exports.JTraderCLI = void 0;
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const error_handler_1 = require("./utils/error-handler");
const output_formatter_1 = require("./utils/output-formatter");
const progress_indicator_1 = require("./utils/progress-indicator");
const prompt_handler_1 = require("./utils/prompt-handler");
const trade_1 = require("./commands/trade");
const backtest_1 = require("./commands/backtest");
const config_1 = require("./commands/config");
class JTraderCLI {
    program;
    context;
    constructor() {
        this.program = new commander_1.Command();
        this.context = {
            config: {
                provider: 'alpaca',
                environment: 'paper',
                logLevel: 'info',
                maxPositions: 5,
                initialCapital: 10000,
                commission: 0.001
            },
            outputFormatter: new output_formatter_1.CLIOutputFormatter(),
            progressIndicator: new progress_indicator_1.CLIProgressIndicator(),
            promptHandler: new prompt_handler_1.CLIPromptHandler()
        };
        this.setupProgram();
        this.registerCommands();
        this.setupErrorHandling();
    }
    setupProgram() {
        this.program
            .name('jtrader')
            .description('Jware-Trader8 - Automated cryptocurrency and stock trading platform')
            .version('1.0.0')
            .helpOption('-h, --help', 'Display help for command')
            .addHelpText('before', chalk_1.default.blue.bold('\n🚀 Jware-Trader8 CLI\n'))
            .addHelpText('after', `
${chalk_1.default.blue.bold('Examples:')}
  ${chalk_1.default.dim('# Set up API keys')}
  ${chalk_1.default.green('jtrader config set-keys --provider alpaca')}
  
  ${chalk_1.default.dim('# Run a backtest')}
  ${chalk_1.default.green('jtrader backtest strategies/sma-crossover.yaml --symbol BTCUSD --start 2024-01-01 --end 2024-06-01')}
  
  ${chalk_1.default.dim('# Start trading (paper mode)')}
  ${chalk_1.default.green('jtrader trade start strategies/sma-crossover.yaml --dry-run')}
  
  ${chalk_1.default.dim('# Check trading status')}
  ${chalk_1.default.green('jtrader status')}

${chalk_1.default.blue.bold('Getting Started:')}
  1. Set up your API keys: ${chalk_1.default.cyan('jtrader config set-keys')}
  2. Test with a backtest: ${chalk_1.default.cyan('jtrader backtest <strategy> --symbol <SYMBOL> --start <DATE> --end <DATE>')}
  3. Start paper trading: ${chalk_1.default.cyan('jtrader trade start <strategy> --dry-run')}

${chalk_1.default.blue.bold('Documentation:')}
  Strategy files: ${chalk_1.default.cyan('strategies/examples/')}
  More help: ${chalk_1.default.cyan('https://github.com/jware-trader8/docs')}
`);
    }
    registerCommands() {
        // Register trade commands
        const tradeCommands = new trade_1.TradeCommands(this.context);
        tradeCommands.registerCommands(this.program);
        // Register backtest commands
        const backtestCommands = new backtest_1.BacktestCommands(this.context);
        backtestCommands.registerCommands(this.program);
        // Register config commands
        const configCommands = new config_1.ConfigCommands(this.context);
        configCommands.registerCommands(this.program);
        // Add status command as a top-level command
        this.program
            .command('status')
            .description('Show current trading status and account information')
            .option('-d, --detailed', 'Show detailed position information')
            .option('-r, --refresh <seconds>', 'Auto-refresh interval in seconds')
            .action(async (options) => {
            try {
                const tradeCommands = new trade_1.TradeCommands(this.context);
                await tradeCommands.handleStatus(options);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
    }
    setupErrorHandling() {
        error_handler_1.CLIErrorHandler.setupGlobalErrorHandling();
    }
    async run(argv) {
        try {
            // Parse command line arguments
            await this.program.parseAsync(argv);
        }
        catch (error) {
            error_handler_1.CLIErrorHandler.handle(error);
        }
    }
    // Method to handle when no command is provided
    showHelp() {
        this.program.help();
    }
    // Method to validate system requirements before running commands
    async validateSystem() {
        const issues = [];
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 16) {
            issues.push(`Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 16 or higher.`);
        }
        // Check if required directories exist
        const requiredDirs = ['strategies', 'strategies/examples'];
        for (const dir of requiredDirs) {
            try {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                await fs.promises.access(dir);
            }
            catch {
                issues.push(`Required directory '${dir}' not found. Please ensure you're running from the project root.`);
            }
        }
        if (issues.length > 0) {
            console.error(chalk_1.default.red.bold('System Validation Failed:'));
            issues.forEach(issue => {
                console.error(chalk_1.default.red('• ' + issue));
            });
            console.error(chalk_1.default.yellow('\nPlease fix these issues before continuing.'));
            return false;
        }
        return true;
    }
    // Method to check for updates or important notices
    async checkForUpdates() {
        // This could be expanded to check for CLI updates
        // For now, just show a welcome message on first run
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs')));
            const configPath = '.jtrader-config';
            try {
                await fs.promises.access(configPath);
            }
            catch {
                // First run - show welcome message
                this.context.promptHandler.displayWelcome();
                console.log(chalk_1.default.blue('This appears to be your first time using Jware-Trader8!'));
                console.log(chalk_1.default.dim('Get started by setting up your API keys: ') + chalk_1.default.cyan('jtrader config set-keys'));
                console.log(chalk_1.default.dim('Or explore example strategies: ') + chalk_1.default.cyan('ls strategies/examples/'));
                console.log('');
                // Create config marker file
                await fs.promises.writeFile(configPath, JSON.stringify({
                    firstRun: new Date().toISOString(),
                    version: '1.0.0'
                }));
            }
        }
        catch (error) {
            // Silently fail - this is not critical
        }
    }
}
exports.JTraderCLI = JTraderCLI;
// Factory function to create and configure CLI
function createCLI() {
    return new JTraderCLI();
}
exports.createCLI = createCLI;
//# sourceMappingURL=cli.js.map