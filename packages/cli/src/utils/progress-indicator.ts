import ora, { Ora } from 'ora';
import chalk from 'chalk';
import { ProgressIndicator } from '../types/cli-types';

export class CLIProgressIndicator implements ProgressIndicator {
  private spinner: Ora | null = null;

  start(message: string): void {
    this.spinner = ora({
      text: message,
      spinner: 'dots',
      color: 'blue'
    }).start();
  }

  update(message: string): void {
    if (this.spinner) {
      this.spinner.text = message;
    }
  }

  succeed(message: string): void {
    if (this.spinner) {
      this.spinner.succeed(chalk.green(message));
      this.spinner = null;
    } else {
      console.log(chalk.green('✓ ' + message));
    }
  }

  fail(message: string): void {
    if (this.spinner) {
      this.spinner.fail(chalk.red(message));
      this.spinner = null;
    } else {
      console.log(chalk.red('✗ ' + message));
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  warn(message: string): void {
    if (this.spinner) {
      this.spinner.warn(chalk.yellow(message));
    } else {
      console.log(chalk.yellow('⚠ ' + message));
    }
  }

  info(message: string): void {
    if (this.spinner) {
      this.spinner.info(chalk.blue(message));
    } else {
      console.log(chalk.blue('ℹ ' + message));
    }
  }

  // Progress bar for backtesting
  createBacktestProgress(total: number): BacktestProgressBar {
    return new BacktestProgressBar(total);
  }
}

export class BacktestProgressBar {
  private total: number;
  private processed: number = 0;
  private startTime: Date;
  private lastUpdate: Date;

  constructor(total: number) {
    this.total = total;
    this.startTime = new Date();
    this.lastUpdate = new Date();
    this.showProgress();
  }

  update(processed: number): void {
    this.processed = processed;
    const now = new Date();
    
    // Update every 100ms to avoid too frequent updates
    if (now.getTime() - this.lastUpdate.getTime() > 100) {
      this.showProgress();
      this.lastUpdate = now;
    }
  }

  complete(): void {
    this.processed = this.total;
    this.showProgress();
    const duration = (new Date().getTime() - this.startTime.getTime()) / 1000;
    console.log(chalk.green(`\n✓ Backtest completed in ${duration.toFixed(2)}s`));
  }

  private showProgress(): void {
    const percentage = Math.min((this.processed / this.total) * 100, 100);
    const barLength = 40;
    const filledLength = Math.round((percentage / 100) * barLength);
    
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    const progressText = `Progress: [${chalk.blue(bar)}] ${percentage.toFixed(1)}% (${this.processed}/${this.total})`;
    
    // Calculate ETA
    const elapsed = (new Date().getTime() - this.startTime.getTime()) / 1000;
    const rate = this.processed / elapsed;
    const remaining = this.total - this.processed;
    const eta = remaining > 0 && rate > 0 ? remaining / rate : 0;
    
    const etaText = eta > 0 ? ` ETA: ${eta.toFixed(0)}s` : '';
    
    // Clear line and write progress
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(progressText + etaText);
  }
}

export class DataDownloadProgress {
  private spinner: Ora;
  private totalBytes: number = 0;
  private downloadedBytes: number = 0;

  constructor(message: string) {
    this.spinner = ora({
      text: message,
      spinner: 'dots'
    }).start();
  }

  setTotal(bytes: number): void {
    this.totalBytes = bytes;
  }

  update(downloaded: number): void {
    this.downloadedBytes = downloaded;
    if (this.totalBytes > 0) {
      const percentage = (downloaded / this.totalBytes) * 100;
      const mb = downloaded / (1024 * 1024);
      const totalMb = this.totalBytes / (1024 * 1024);
      this.spinner.text = `Downloading data: ${mb.toFixed(1)}MB / ${totalMb.toFixed(1)}MB (${percentage.toFixed(1)}%)`;
    } else {
      const mb = downloaded / (1024 * 1024);
      this.spinner.text = `Downloading data: ${mb.toFixed(1)}MB`;
    }
  }

  complete(): void {
    const mb = this.downloadedBytes / (1024 * 1024);
    this.spinner.succeed(`Downloaded ${mb.toFixed(1)}MB of market data`);
  }

  fail(error: string): void {
    this.spinner.fail(`Download failed: ${error}`);
  }
}