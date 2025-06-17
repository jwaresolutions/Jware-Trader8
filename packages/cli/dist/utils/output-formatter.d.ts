import { OutputFormatter } from '../types/cli-types';
export declare class CLIOutputFormatter implements OutputFormatter {
    formatTable(data: any[], headers: string[]): string;
    formatJSON(data: any): string;
    formatCSV(data: any[]): string;
    formatPerformanceSummary(summary: any): string;
    formatAccountInfo(account: any): string;
    formatPositions(positions: any[]): string;
    formatTrades(trades: any[]): string;
    formatStrategyInfo(strategy: any): string;
    success(message: string): string;
    error(message: string): string;
    warning(message: string): string;
    info(message: string): string;
    header(message: string): string;
    dim(message: string): string;
}
//# sourceMappingURL=output-formatter.d.ts.map