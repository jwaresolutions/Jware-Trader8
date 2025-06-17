import { CLIContext } from './types/cli-types';
export declare class JTraderCLI {
    private program;
    private context;
    constructor();
    private setupProgram;
    private registerCommands;
    private setupErrorHandling;
    run(argv: string[]): Promise<void>;
    showHelp(): void;
    validateSystem(): Promise<boolean>;
    checkForUpdates(): Promise<void>;
}
export declare function createCLI(): JTraderCLI;
export { CLIContext };
//# sourceMappingURL=cli.d.ts.map