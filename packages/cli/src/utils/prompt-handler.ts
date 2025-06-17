import inquirer from 'inquirer';
import chalk from 'chalk';
import { PromptHandler } from '../types/cli-types';

export class CLIPromptHandler implements PromptHandler {
  async promptForApiKeys(provider: string): Promise<{ apiKey: string; secretKey: string }> {
    console.log(chalk.blue(`\nSetting up API keys for ${provider.toUpperCase()}`));
    console.log(chalk.dim('Your keys will be encrypted and stored securely.'));

    const questions = [
      {
        type: 'password',
        name: 'apiKey',
        message: `Enter your ${provider.toUpperCase()} API key:`,
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'API key is required';
          }
          if (input.length < 10) {
            return 'API key seems too short. Please check and try again.';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'secretKey',
        message: `Enter your ${provider.toUpperCase()} secret key:`,
        mask: '*',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Secret key is required';
          }
          if (input.length < 10) {
            return 'Secret key seems too short. Please check and try again.';
          }
          return true;
        }
      }
    ];

    const answers = await inquirer.prompt(questions);
    return {
      apiKey: answers.apiKey.trim(),
      secretKey: answers.secretKey.trim()
    };
  }

  async promptForConfirmation(message: string): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: message,
        default: false
      }
    ]);
    return answer.confirmed;
  }

  async promptForChoice(message: string, choices: string[]): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: message,
        choices: choices
      }
    ]);
    return answer.choice;
  }

  async promptForInput(message: string, defaultValue?: string): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: message,
        default: defaultValue,
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Input is required';
          }
          return true;
        }
      }
    ]);
    return answer.input.trim();
  }

  async promptForProvider(): Promise<'alpaca' | 'polygon'> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select trading provider:',
        choices: [
          { name: 'Alpaca Trading (Stocks & Crypto)', value: 'alpaca' },
          { name: 'Polygon (Market Data Only)', value: 'polygon' }
        ]
      }
    ]);
    return answer.provider;
  }

  async promptForEnvironment(): Promise<'paper' | 'live'> {
    console.log(chalk.yellow('\nIMPORTANT: Make sure you understand the difference between paper and live trading!'));
    console.log(chalk.dim('Paper trading uses virtual money for testing.'));
    console.log(chalk.dim('Live trading uses real money and can result in financial loss.'));

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'environment',
        message: 'Select trading environment:',
        choices: [
          { name: 'Paper Trading (Recommended for testing)', value: 'paper' },
          { name: 'Live Trading (Real money)', value: 'live' }
        ],
        default: 'paper'
      }
    ]);

    if (answer.environment === 'live') {
      const confirmation = await this.promptForConfirmation(
        chalk.red('Are you absolutely sure you want to enable LIVE trading with real money?')
      );
      if (!confirmation) {
        console.log(chalk.green('Switching to paper trading for safety.'));
        return 'paper';
      }
    }

    return answer.environment;
  }

  async promptForStrategyParameters(parameters: any): Promise<any> {
    console.log(chalk.blue('\nConfigure strategy parameters:'));
    
    const questions = Object.entries(parameters).map(([key, defaultValue]) => ({
      type: 'input',
      name: key,
      message: `${key}:`,
      default: String(defaultValue),
      validate: (input: string) => {
        // Try to parse as number if default was number
        if (typeof defaultValue === 'number') {
          const num = parseFloat(input);
          if (isNaN(num)) {
            return `${key} must be a valid number`;
          }
        }
        return true;
      },
      filter: (input: string) => {
        // Convert back to original type
        if (typeof defaultValue === 'number') {
          return parseFloat(input);
        }
        if (typeof defaultValue === 'boolean') {
          return input.toLowerCase() === 'true';
        }
        return input;
      }
    }));

    return await inquirer.prompt(questions);
  }

  async promptForSymbol(defaultSymbol?: string): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'symbol',
        message: 'Enter trading symbol (e.g., BTCUSD, AAPL, SPY):',
        default: defaultSymbol || 'BTCUSD',
        validate: (input: string) => {
          if (!input || input.trim().length === 0) {
            return 'Symbol is required';
          }
          if (!/^[A-Z0-9]+$/.test(input.trim().toUpperCase())) {
            return 'Symbol should only contain letters and numbers (e.g., BTCUSD, AAPL)';
          }
          return true;
        },
        filter: (input: string) => input.trim().toUpperCase()
      }
    ]);
    return answer.symbol;
  }

  async promptForDateRange(): Promise<{ startDate: string; endDate: string }> {
    console.log(chalk.blue('\nSelect date range for backtesting:'));
    
    const questions = [
      {
        type: 'input',
        name: 'startDate',
        message: 'Start date (YYYY-MM-DD):',
        default: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
        validate: (input: string) => {
          const date = new Date(input);
          if (isNaN(date.getTime())) {
            return 'Please enter a valid date in YYYY-MM-DD format';
          }
          if (date > new Date()) {
            return 'Start date cannot be in the future';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'endDate',
        message: 'End date (YYYY-MM-DD):',
        default: new Date().toISOString().split('T')[0], // Today
        validate: (input: string, answers: any) => {
          const date = new Date(input);
          if (isNaN(date.getTime())) {
            return 'Please enter a valid date in YYYY-MM-DD format';
          }
          if (date > new Date()) {
            return 'End date cannot be in the future';
          }
          if (answers.startDate && date <= new Date(answers.startDate)) {
            return 'End date must be after start date';
          }
          return true;
        }
      }
    ];

    const answers = await inquirer.prompt(questions);
    return {
      startDate: answers.startDate,
      endDate: answers.endDate
    };
  }

  async promptForTimeframe(): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'timeframe',
        message: 'Select timeframe:',
        choices: [
          { name: '1 minute', value: '1m' },
          { name: '5 minutes', value: '5m' },
          { name: '15 minutes', value: '15m' },
          { name: '1 hour', value: '1h' },
          { name: '1 day', value: '1d' }
        ],
        default: '1h'
      }
    ]);
    return answer.timeframe;
  }

  displayWelcome(): void {
    console.log(chalk.blue.bold('\n🚀 Welcome to Jware-Trader8!'));
    console.log(chalk.dim('Automated cryptocurrency and stock trading platform\n'));
  }

  displaySuccess(message: string): void {
    console.log(chalk.green('✓ ' + message));
  }

  displayError(message: string): void {
    console.log(chalk.red('✗ ' + message));
  }

  displayWarning(message: string): void {
    console.log(chalk.yellow('⚠ ' + message));
  }

  displayInfo(message: string): void {
    console.log(chalk.blue('ℹ ' + message));
  }
}