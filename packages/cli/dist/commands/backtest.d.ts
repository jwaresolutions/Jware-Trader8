import { Command } from 'commander';
import { CLIContext, BacktestOptions } from '../types/cli-types';
export declare class BacktestCommands {
    private context;
    private configStore;
    private strategyEngine;
    private backtestEngine;
    constructor(context: CLIContext);
    registerCommands(program: Command): void;
    handleBacktest(strategyFile: string, options: BacktestOptions): Promise<void>;
    private loadStrategyFile;
    private initializeDataProvider;
    private displayResults;
    private displayEquityCurveASCII;
    private displayPerformanceInsights;
    private saveResults;
}
//# sourceMappingURL=backtest.d.ts.map