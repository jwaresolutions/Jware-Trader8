"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataDownloadProgress = exports.BacktestProgressBar = exports.CLIProgressIndicator = void 0;
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
class CLIProgressIndicator {
    spinner = null;
    start(message) {
        this.spinner = (0, ora_1.default)({
            text: message,
            spinner: 'dots',
            color: 'blue'
        }).start();
    }
    update(message) {
        if (this.spinner) {
            this.spinner.text = message;
        }
    }
    succeed(message) {
        if (this.spinner) {
            this.spinner.succeed(chalk_1.default.green(message));
            this.spinner = null;
        }
        else {
            console.log(chalk_1.default.green('✓ ' + message));
        }
    }
    fail(message) {
        if (this.spinner) {
            this.spinner.fail(chalk_1.default.red(message));
            this.spinner = null;
        }
        else {
            console.log(chalk_1.default.red('✗ ' + message));
        }
    }
    stop() {
        if (this.spinner) {
            this.spinner.stop();
            this.spinner = null;
        }
    }
    warn(message) {
        if (this.spinner) {
            this.spinner.warn(chalk_1.default.yellow(message));
        }
        else {
            console.log(chalk_1.default.yellow('⚠ ' + message));
        }
    }
    info(message) {
        if (this.spinner) {
            this.spinner.info(chalk_1.default.blue(message));
        }
        else {
            console.log(chalk_1.default.blue('ℹ ' + message));
        }
    }
    // Progress bar for backtesting
    createBacktestProgress(total) {
        return new BacktestProgressBar(total);
    }
}
exports.CLIProgressIndicator = CLIProgressIndicator;
class BacktestProgressBar {
    total;
    processed = 0;
    startTime;
    lastUpdate;
    constructor(total) {
        this.total = total;
        this.startTime = new Date();
        this.lastUpdate = new Date();
        this.showProgress();
    }
    update(processed) {
        this.processed = processed;
        const now = new Date();
        // Update every 100ms to avoid too frequent updates
        if (now.getTime() - this.lastUpdate.getTime() > 100) {
            this.showProgress();
            this.lastUpdate = now;
        }
    }
    complete() {
        this.processed = this.total;
        this.showProgress();
        const duration = (new Date().getTime() - this.startTime.getTime()) / 1000;
        console.log(chalk_1.default.green(`\n✓ Backtest completed in ${duration.toFixed(2)}s`));
    }
    showProgress() {
        const percentage = Math.min((this.processed / this.total) * 100, 100);
        const barLength = 40;
        const filledLength = Math.round((percentage / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        const progressText = `Progress: [${chalk_1.default.blue(bar)}] ${percentage.toFixed(1)}% (${this.processed}/${this.total})`;
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
exports.BacktestProgressBar = BacktestProgressBar;
class DataDownloadProgress {
    spinner;
    totalBytes = 0;
    downloadedBytes = 0;
    constructor(message) {
        this.spinner = (0, ora_1.default)({
            text: message,
            spinner: 'dots'
        }).start();
    }
    setTotal(bytes) {
        this.totalBytes = bytes;
    }
    update(downloaded) {
        this.downloadedBytes = downloaded;
        if (this.totalBytes > 0) {
            const percentage = (downloaded / this.totalBytes) * 100;
            const mb = downloaded / (1024 * 1024);
            const totalMb = this.totalBytes / (1024 * 1024);
            this.spinner.text = `Downloading data: ${mb.toFixed(1)}MB / ${totalMb.toFixed(1)}MB (${percentage.toFixed(1)}%)`;
        }
        else {
            const mb = downloaded / (1024 * 1024);
            this.spinner.text = `Downloading data: ${mb.toFixed(1)}MB`;
        }
    }
    complete() {
        const mb = this.downloadedBytes / (1024 * 1024);
        this.spinner.succeed(`Downloaded ${mb.toFixed(1)}MB of market data`);
    }
    fail(error) {
        this.spinner.fail(`Download failed: ${error}`);
    }
}
exports.DataDownloadProgress = DataDownloadProgress;
//# sourceMappingURL=progress-indicator.js.map