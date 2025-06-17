import { ProgressIndicator } from '../types/cli-types';
export declare class CLIProgressIndicator implements ProgressIndicator {
    private spinner;
    start(message: string): void;
    update(message: string): void;
    succeed(message: string): void;
    fail(message: string): void;
    stop(): void;
    warn(message: string): void;
    info(message: string): void;
    createBacktestProgress(total: number): BacktestProgressBar;
}
export declare class BacktestProgressBar {
    private total;
    private processed;
    private startTime;
    private lastUpdate;
    constructor(total: number);
    update(processed: number): void;
    complete(): void;
    private showProgress;
}
export declare class DataDownloadProgress {
    private spinner;
    private totalBytes;
    private downloadedBytes;
    constructor(message: string);
    setTotal(bytes: number): void;
    update(downloaded: number): void;
    complete(): void;
    fail(error: string): void;
}
//# sourceMappingURL=progress-indicator.d.ts.map