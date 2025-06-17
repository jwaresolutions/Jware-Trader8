import chalk from 'chalk';
import { CLIError } from '../types/cli-types';

export class CLIErrorHandler {
  static handle(error: any): never {
    if (error instanceof CLIError) {
      console.error(chalk.red.bold('Error: ') + error.message);
      if (error.suggestion) {
        console.error(chalk.yellow('Suggestion: ') + error.suggestion);
      }
      process.exit(error.exitCode);
    }

    if (error.code === 'ENOENT') {
      console.error(chalk.red.bold('File Not Found: ') + error.path);
      console.error(chalk.yellow('Suggestion: Check if the file path is correct and the file exists.'));
      process.exit(1);
    }

    if (error.code === 'EACCES') {
      console.error(chalk.red.bold('Permission Denied: ') + error.path);
      console.error(chalk.yellow('Suggestion: Check file permissions or run with appropriate privileges.'));
      process.exit(1);
    }

    if (error.message?.includes('YAML') || error.message?.includes('parsing')) {
      console.error(chalk.red.bold('Configuration Error: ') + 'Invalid YAML format');
      console.error(chalk.yellow('Suggestion: Check your strategy file for syntax errors.'));
      if (error.mark) {
        console.error(chalk.dim(`At line ${error.mark.line}, column ${error.mark.column}`));
      }
      process.exit(1);
    }

    if (error.message?.includes('network') || error.message?.includes('timeout')) {
      console.error(chalk.red.bold('Network Error: ') + 'Unable to connect to trading provider');
      console.error(chalk.yellow('Suggestion: Check your internet connection and API key configuration.'));
      process.exit(1);
    }

    if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
      console.error(chalk.red.bold('Authentication Error: ') + 'Invalid API credentials');
      console.error(chalk.yellow('Suggestion: Run "jtrader config set-keys" to update your API keys.'));
      process.exit(1);
    }

    if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
      console.error(chalk.red.bold('Rate Limit Error: ') + 'Too many API requests');
      console.error(chalk.yellow('Suggestion: Wait a moment and try again, or upgrade your API plan.'));
      process.exit(1);
    }

    // Generic error handling
    console.error(chalk.red.bold('Unexpected Error: ') + error.message);
    if (error.stack && process.env.NODE_ENV === 'development') {
      console.error(chalk.dim(error.stack));
    }
    console.error(chalk.yellow('Suggestion: If this persists, please report this issue.'));
    process.exit(1);
  }

  static createError(message: string, code: string, suggestion?: string, exitCode: number = 1): CLIError {
    return new CLIError(message, code, suggestion, exitCode);
  }

  static validateStrategyFile(filePath: string): void {
    if (!filePath) {
      throw this.createError(
        'Strategy file path is required',
        'MISSING_STRATEGY_FILE',
        'Provide a path to your strategy YAML file'
      );
    }

    if (!filePath.endsWith('.yaml') && !filePath.endsWith('.yml')) {
      throw this.createError(
        'Strategy file must be a YAML file',
        'INVALID_FILE_TYPE',
        'Use a .yaml or .yml file extension'
      );
    }
  }

  static validateSymbol(symbol: string): void {
    if (!symbol || symbol.trim().length === 0) {
      throw this.createError(
        'Trading symbol is required',
        'MISSING_SYMBOL',
        'Provide a symbol like BTCUSD, AAPL, or SPY'
      );
    }

    if (!/^[A-Z0-9]+$/.test(symbol.toUpperCase())) {
      throw this.createError(
        'Invalid symbol format',
        'INVALID_SYMBOL',
        'Symbol should only contain letters and numbers (e.g., BTCUSD, AAPL)'
      );
    }
  }

  static validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
      throw this.createError(
        'Invalid start date format',
        'INVALID_START_DATE',
        'Use YYYY-MM-DD format (e.g., 2024-01-01)'
      );
    }

    if (isNaN(end.getTime())) {
      throw this.createError(
        'Invalid end date format',
        'INVALID_END_DATE',
        'Use YYYY-MM-DD format (e.g., 2024-12-31)'
      );
    }

    if (start >= end) {
      throw this.createError(
        'Start date must be before end date',
        'INVALID_DATE_RANGE',
        'Check your date range and try again'
      );
    }

    if (end > new Date()) {
      throw this.createError(
        'End date cannot be in the future',
        'FUTURE_END_DATE',
        'Use a date up to today'
      );
    }

    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 365 * 2) {
      console.warn(chalk.yellow('Warning: Backtesting over 2 years of data may be slow and memory intensive.'));
    }
  }

  static validateNumericOption(value: string, name: string, min?: number, max?: number): number {
    const num = parseFloat(value);
    
    if (isNaN(num)) {
      throw this.createError(
        `${name} must be a valid number`,
        'INVALID_NUMERIC_VALUE',
        `Provide a numeric value for ${name}`
      );
    }

    if (min !== undefined && num < min) {
      throw this.createError(
        `${name} must be at least ${min}`,
        'VALUE_TOO_LOW',
        `Use a value >= ${min} for ${name}`
      );
    }

    if (max !== undefined && num > max) {
      throw this.createError(
        `${name} must be at most ${max}`,
        'VALUE_TOO_HIGH',
        `Use a value <= ${max} for ${name}`
      );
    }

    return num;
  }

  static validateTimeframe(timeframe: string): void {
    const validTimeframes = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w'];
    
    if (!validTimeframes.includes(timeframe)) {
      throw this.createError(
        `Invalid timeframe: ${timeframe}`,
        'INVALID_TIMEFRAME',
        `Use one of: ${validTimeframes.join(', ')}`
      );
    }
  }

  static validateOutputFormat(format: string): void {
    const validFormats = ['table', 'json', 'csv'];
    
    if (!validFormats.includes(format)) {
      throw this.createError(
        `Invalid output format: ${format}`,
        'INVALID_OUTPUT_FORMAT',
        `Use one of: ${validFormats.join(', ')}`
      );
    }
  }

  static setupGlobalErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      console.error(chalk.red.bold('Uncaught Exception:'));
      CLIErrorHandler.handle(error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(chalk.red.bold('Unhandled Promise Rejection:'));
      CLIErrorHandler.handle(reason);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\nGracefully shutting down...'));
      console.log(chalk.dim('Press Ctrl+C again to force exit.'));
      
      // Give cleanup processes a chance to run
      setTimeout(() => {
        console.log(chalk.green('✓ Shutdown complete'));
        process.exit(0);
      }, 1000);
    });

    // Handle termination signals
    process.on('SIGTERM', () => {
      console.log(chalk.yellow('Received termination signal, shutting down...'));
      process.exit(0);
    });
  }
}

export function createCLIError(message: string, code: string, suggestion?: string, exitCode: number = 1): CLIError {
  return CLIErrorHandler.createError(message, code, suggestion, exitCode);
}

export function handleCLIError(error: any): never {
  return CLIErrorHandler.handle(error);
}