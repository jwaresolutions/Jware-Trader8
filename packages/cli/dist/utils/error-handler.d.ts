import { CLIError } from '../types/cli-types';
export declare class CLIErrorHandler {
    static handle(error: any): never;
    static createError(message: string, code: string, suggestion?: string, exitCode?: number): CLIError;
    static validateStrategyFile(filePath: string): void;
    static validateSymbol(symbol: string): void;
    static validateDateRange(startDate: string, endDate: string): void;
    static validateNumericOption(value: string, name: string, min?: number, max?: number): number;
    static validateTimeframe(timeframe: string): void;
    static validateOutputFormat(format: string): void;
    static setupGlobalErrorHandling(): void;
}
export declare function createCLIError(message: string, code: string, suggestion?: string, exitCode?: number): CLIError;
export declare function handleCLIError(error: any): never;
//# sourceMappingURL=error-handler.d.ts.map