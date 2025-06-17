import { Command } from 'commander';
import { CLIContext, ConfigSetKeysOptions } from '../types/cli-types';
export declare class ConfigCommands {
    private context;
    private configStore;
    constructor(context: CLIContext);
    registerCommands(program: Command): void;
    handleSetKeys(options: ConfigSetKeysOptions): Promise<void>;
    handleListConfig(): Promise<void>;
    handleGetConfig(key: string): Promise<void>;
    handleSetConfig(key: string, value: string): Promise<void>;
    handleResetConfig(options: {
        confirm?: boolean;
    }): Promise<void>;
    handleTestKeys(options: {
        provider: string;
    }): Promise<void>;
    private testProviderConnection;
    private showApiKeyStatus;
}
//# sourceMappingURL=config.d.ts.map