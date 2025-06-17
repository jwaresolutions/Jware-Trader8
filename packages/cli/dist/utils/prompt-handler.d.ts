import { PromptHandler } from '../types/cli-types';
export declare class CLIPromptHandler implements PromptHandler {
    promptForApiKeys(provider: string): Promise<{
        apiKey: string;
        secretKey: string;
    }>;
    promptForConfirmation(message: string): Promise<boolean>;
    promptForChoice(message: string, choices: string[]): Promise<string>;
    promptForInput(message: string, defaultValue?: string): Promise<string>;
    promptForProvider(): Promise<'alpaca' | 'polygon'>;
    promptForEnvironment(): Promise<'paper' | 'live'>;
    promptForStrategyParameters(parameters: any): Promise<any>;
    promptForSymbol(defaultSymbol?: string): Promise<string>;
    promptForDateRange(): Promise<{
        startDate: string;
        endDate: string;
    }>;
    promptForTimeframe(): Promise<string>;
    displayWelcome(): void;
    displaySuccess(message: string): void;
    displayError(message: string): void;
    displayWarning(message: string): void;
    displayInfo(message: string): void;
}
//# sourceMappingURL=prompt-handler.d.ts.map