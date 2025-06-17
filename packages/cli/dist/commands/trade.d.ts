import { Command } from 'commander';
import { CLIContext, TradeStartOptions, StatusOptions } from '../types/cli-types';
export declare class TradeCommands {
    private context;
    private configStore;
    private strategyEngine;
    private activeSessions;
    constructor(context: CLIContext);
    registerCommands(program: Command): void;
    handleTradeStart(strategyFile: string, options: TradeStartOptions): Promise<void>;
    handleTradeStop(options: {
        force?: boolean;
    }): Promise<void>;
    handleStatus(options: StatusOptions): Promise<void>;
    private loadStrategyFile;
    private initializeTradingProvider;
    private startTradingSession;
    private displaySessionSummary;
}
//# sourceMappingURL=trade.d.ts.map