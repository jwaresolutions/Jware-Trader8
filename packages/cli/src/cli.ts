import { Command } from 'commander';
import chalk from 'chalk';
import { CLIErrorHandler } from './utils/error-handler';
import { CLIOutputFormatter } from './utils/output-formatter';
import { CLIProgressIndicator } from './utils/progress-indicator';
import { CLIPromptHandler } from './utils/prompt-handler';
import { TradeCommands } from './commands/trade';
import { BacktestCommands } from './commands/backtest';
import { ConfigCommands } from './commands/config';
import { CLIContext } from './types/cli-types';

export class JTraderCLI {
  private program: Command;
  private context: CLIContext;

  constructor() {
    this.program = new Command();
    this.context = {
      config: {
        provider: 'alpaca',
        environment: 'paper',
        logLevel: 'info',
        maxPositions: 5,
        initialCapital: 10000,
        commission: 0.001
      },
      outputFormatter: new CLIOutputFormatter(),
      progressIndicator: new CLIProgressIndicator(),
      promptHandler: new CLIPromptHandler()
    };

    this.setupProgram();
    this.registerCommands();
    this.setupErrorHandling();
  }

  private setupProgram(): void {
    this.program
      .name('jtrader')
      .description('Jware-Trader8 - Automated cryptocurrency and stock trading platform')
      .version('1.0.0')
      .helpOption('-h, --help', 'Display help for command')
      .addHelpText('before', chalk.blue.bold('\n🚀 Jware-Trader8 CLI\n'))
      .addHelpText('after', `
${chalk.blue.bold('Examples:')}
  ${chalk.dim('# Set up API keys')}
  ${chalk.green('jtrader config set-keys --provider alpaca')}
  
  ${chalk.dim('# Run a backtest')}
  ${chalk.green('jtrader backtest strategies/sma-crossover.yaml --symbol BTCUSD --start 2024-01-01 --end 2024-06-01')}
  
  ${chalk.dim('# Start trading (paper mode)')}
  ${chalk.green('jtrader trade start strategies/sma-crossover.yaml --dry-run')}
  
  ${chalk.dim('# Check trading status')}
  ${chalk.green('jtrader status')}

${chalk.blue.bold('Getting Started:')}
  1. Set up your API keys: ${chalk.cyan('jtrader config set-keys')}
  2. Test with a backtest: ${chalk.cyan('jtrader backtest <strategy> --symbol <SYMBOL> --start <DATE> --end <DATE>')}
  3. Start paper trading: ${chalk.cyan('jtrader trade start <strategy> --dry-run')}

${chalk.blue.bold('Documentation:')}
  Strategy files: ${chalk.cyan('strategies/examples/')}
  More help: ${chalk.cyan('https://github.com/jware-trader8/docs')}
`);
  }

  private registerCommands(): void {
    // Register trade commands
    const tradeCommands = new TradeCommands(this.context);
    tradeCommands.registerCommands(this.program);

    // Register backtest commands
    const backtestCommands = new BacktestCommands(this.context);
    backtestCommands.registerCommands(this.program);

    // Register config commands
    const configCommands = new ConfigCommands(this.context);
    configCommands.registerCommands(this.program);

    // Add status command as a top-level command
    this.program
      .command('status')
      .description('Show current trading status and account information')
      .option('-d, --detailed', 'Show detailed position information')
      .option('-r, --refresh <seconds>', 'Auto-refresh interval in seconds')
      .action(async (options) => {
        try {
          const tradeCommands = new TradeCommands(this.context);
          await tradeCommands.handleStatus(options);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });
  }

  private setupErrorHandling(): void {
    CLIErrorHandler.setupGlobalErrorHandling();
  }

  async run(argv: string[]): Promise<void> {
    try {
      // Parse command line arguments
      await this.program.parseAsync(argv);
    } catch (error) {
      CLIErrorHandler.handle(error);
    }
  }

  // Method to handle when no command is provided
  showHelp(): void {
    this.program.help();
  }

  // Method to validate system requirements before running commands
  async validateSystem(): Promise<boolean> {
    const issues: string[] = [];

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
        const fs = await import('fs');
        await fs.promises.access(dir);
      } catch {
        issues.push(`Required directory '${dir}' not found. Please ensure you're running from the project root.`);
      }
    }

    if (issues.length > 0) {
      console.error(chalk.red.bold('System Validation Failed:'));
      issues.forEach(issue => {
        console.error(chalk.red('• ' + issue));
      });
      console.error(chalk.yellow('\nPlease fix these issues before continuing.'));
      return false;
    }

    return true;
  }

  // Method to check for updates or important notices
  async checkForUpdates(): Promise<void> {
    // This could be expanded to check for CLI updates
    // For now, just show a welcome message on first run
    try {
      const fs = await import('fs');
      const configPath = '.jtrader-config';
      
      try {
        await fs.promises.access(configPath);
      } catch {
        // First run - show welcome message
        this.context.promptHandler.displayWelcome();
        console.log(chalk.blue('This appears to be your first time using Jware-Trader8!'));
        console.log(chalk.dim('Get started by setting up your API keys: ') + chalk.cyan('jtrader config set-keys'));
        console.log(chalk.dim('Or explore example strategies: ') + chalk.cyan('ls strategies/examples/'));
        console.log('');
        
        // Create config marker file
        await fs.promises.writeFile(configPath, JSON.stringify({
          firstRun: new Date().toISOString(),
          version: '1.0.0'
        }));
      }
    } catch (error) {
      // Silently fail - this is not critical
    }
  }
}

// Factory function to create and configure CLI
export function createCLI(): JTraderCLI {
  return new JTraderCLI();
}

// Export for testing
export { CLIContext };