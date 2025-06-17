"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigCommands = void 0;
const chalk_1 = __importDefault(require("chalk"));
const error_handler_1 = require("../utils/error-handler");
const database_1 = require("@jware-trader8/database");
class ConfigCommands {
    context;
    configStore;
    constructor(context) {
        this.context = context;
        this.configStore = new database_1.ConfigStore();
    }
    registerCommands(program) {
        const configCmd = program
            .command('config')
            .description('Manage configuration settings and API keys');
        configCmd
            .command('set-keys')
            .description('Set API keys for trading providers')
            .option('--provider <name>', 'Provider name: alpaca, polygon', 'alpaca')
            .option('--interactive', 'Use interactive setup wizard', true)
            .action(async (options) => {
            try {
                await this.handleSetKeys(options);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
        configCmd
            .command('list')
            .description('List all configuration settings')
            .action(async () => {
            try {
                await this.handleListConfig();
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
        configCmd
            .command('get')
            .description('Get configuration value')
            .argument('<key>', 'Configuration key')
            .action(async (key) => {
            try {
                await this.handleGetConfig(key);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
        configCmd
            .command('set')
            .description('Set configuration value')
            .argument('<key>', 'Configuration key')
            .argument('<value>', 'Configuration value')
            .action(async (key, value) => {
            try {
                await this.handleSetConfig(key, value);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
        configCmd
            .command('reset')
            .description('Reset configuration to defaults')
            .option('--confirm', 'Skip confirmation prompt')
            .action(async (options) => {
            try {
                await this.handleResetConfig(options);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
        configCmd
            .command('test-keys')
            .description('Test API key connectivity')
            .option('--provider <name>', 'Provider to test: alpaca, polygon, all', 'all')
            .action(async (options) => {
            try {
                await this.handleTestKeys(options);
            }
            catch (error) {
                error_handler_1.CLIErrorHandler.handle(error);
            }
        });
    }
    async handleSetKeys(options) {
        const provider = options.provider || 'alpaca';
        if (!['alpaca', 'polygon'].includes(provider)) {
            throw error_handler_1.CLIErrorHandler.createError(`Invalid provider: ${provider}`, 'INVALID_PROVIDER', 'Use "alpaca" or "polygon"');
        }
        console.log(chalk_1.default.blue.bold(`\n🔐 Setting up ${provider.toUpperCase()} API Keys\n`));
        if (provider === 'alpaca') {
            console.log(chalk_1.default.dim('Alpaca provides both trading and market data services.'));
            console.log(chalk_1.default.dim('Get your API keys from: https://app.alpaca.markets/paper/dashboard/overview'));
        }
        else if (provider === 'polygon') {
            console.log(chalk_1.default.dim('Polygon provides market data services.'));
            console.log(chalk_1.default.dim('Get your API key from: https://polygon.io/dashboard'));
        }
        console.log(chalk_1.default.yellow('\n⚠ Important Security Notes:'));
        console.log(chalk_1.default.dim('• Your API keys will be encrypted and stored locally'));
        console.log(chalk_1.default.dim('• Never share your API keys with anyone'));
        console.log(chalk_1.default.dim('• Use paper trading keys for testing'));
        console.log('');
        this.context.progressIndicator.start('Preparing secure key storage...');
        try {
            // Get API keys from user
            const apiKeys = await this.context.promptHandler.promptForApiKeys(provider);
            this.context.progressIndicator.update('Encrypting and storing keys...');
            // Store encrypted keys
            await this.configStore.setApiKey(provider, apiKeys.apiKey, apiKeys.secretKey);
            this.context.progressIndicator.succeed('API keys stored successfully');
            // Test the keys if it's Alpaca (Polygon test requires symbol data)
            if (provider === 'alpaca') {
                console.log(chalk_1.default.blue('\n🔍 Testing API key connectivity...'));
                await this.testProviderConnection(provider);
            }
            console.log(chalk_1.default.green.bold('\n✅ API keys configured successfully!'));
            console.log(chalk_1.default.dim(`Provider: ${provider.toUpperCase()}`));
            console.log(chalk_1.default.dim('Keys are encrypted and stored securely.'));
            // Show next steps
            console.log(chalk_1.default.blue.bold('\n📋 Next Steps:'));
            if (provider === 'alpaca') {
                console.log(chalk_1.default.dim('• Test trading: ') + chalk_1.default.cyan('jtrader trade start <strategy> --dry-run'));
                console.log(chalk_1.default.dim('• Check status: ') + chalk_1.default.cyan('jtrader status'));
            }
            console.log(chalk_1.default.dim('• Run backtest: ') + chalk_1.default.cyan('jtrader backtest <strategy> --symbol <SYMBOL> --start <DATE> --end <DATE>'));
        }
        catch (error) {
            this.context.progressIndicator.fail('Failed to store API keys');
            throw error;
        }
    }
    async handleListConfig() {
        this.context.progressIndicator.start('Loading configuration...');
        try {
            const configs = await this.configStore.listConfigs();
            this.context.progressIndicator.succeed('Configuration loaded');
            console.log(chalk_1.default.blue.bold('\n⚙️ Configuration Settings\n'));
            if (!configs || Object.keys(configs).length === 0) {
                console.log(chalk_1.default.yellow('No configuration settings found.'));
                console.log(chalk_1.default.dim('Run "jtrader config set-keys" to get started.'));
                return;
            }
            // Display configuration in a table format
            const configData = Object.entries(configs).map(([key, value]) => {
                // Mask sensitive data
                if (key.includes('key') || key.includes('secret') || key.includes('password')) {
                    return {
                        Key: key,
                        Value: '****** (encrypted)',
                        Type: typeof value
                    };
                }
                return {
                    Key: key,
                    Value: typeof value === 'object' ? JSON.stringify(value) : String(value),
                    Type: typeof value
                };
            });
            console.log(this.context.outputFormatter.formatTable(configData, ['Key', 'Value', 'Type']));
            // Show API key status
            console.log(chalk_1.default.blue.bold('\n🔐 API Key Status\n'));
            await this.showApiKeyStatus();
        }
        catch (error) {
            this.context.progressIndicator.fail('Failed to load configuration');
            throw error;
        }
    }
    async handleGetConfig(key) {
        try {
            const value = await this.configStore.getConfig(key);
            if (value === null || value === undefined) {
                console.log(chalk_1.default.yellow(`Configuration key "${key}" not found.`));
                return;
            }
            // Mask sensitive data
            if (key.includes('key') || key.includes('secret') || key.includes('password')) {
                console.log(chalk_1.default.dim(`${key}: ****** (encrypted)`));
            }
            else {
                console.log(`${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
            }
        }
        catch (error) {
            throw error_handler_1.CLIErrorHandler.createError(`Failed to get configuration: ${error.message}`, 'CONFIG_GET_FAILED', 'Check that the configuration key exists');
        }
    }
    async handleSetConfig(key, value) {
        try {
            // Try to parse value as JSON, fallback to string
            let parsedValue = value;
            try {
                parsedValue = JSON.parse(value);
            }
            catch {
                // Value is not JSON, keep as string
            }
            await this.configStore.setConfig(key, parsedValue);
            console.log(chalk_1.default.green(`✓ Configuration updated: ${key} = ${value}`));
        }
        catch (error) {
            throw error_handler_1.CLIErrorHandler.createError(`Failed to set configuration: ${error.message}`, 'CONFIG_SET_FAILED', 'Check the key and value format');
        }
    }
    async handleResetConfig(options) {
        if (!options.confirm) {
            console.log(chalk_1.default.red.bold('⚠ Warning: This will reset ALL configuration settings!'));
            console.log(chalk_1.default.dim('This includes API keys, preferences, and custom settings.'));
            const confirmed = await this.context.promptHandler.promptForConfirmation('Are you sure you want to reset all configuration?');
            if (!confirmed) {
                console.log(chalk_1.default.green('Configuration reset cancelled.'));
                return;
            }
        }
        this.context.progressIndicator.start('Resetting configuration...');
        try {
            await this.configStore.reset();
            this.context.progressIndicator.succeed('Configuration reset successfully');
            console.log(chalk_1.default.green('✅ All configuration settings have been reset.'));
            console.log(chalk_1.default.dim('Run "jtrader config set-keys" to set up API keys again.'));
        }
        catch (error) {
            this.context.progressIndicator.fail('Failed to reset configuration');
            throw error;
        }
    }
    async handleTestKeys(options) {
        const provider = options.provider.toLowerCase();
        if (provider !== 'all' && !['alpaca', 'polygon'].includes(provider)) {
            throw error_handler_1.CLIErrorHandler.createError(`Invalid provider: ${provider}`, 'INVALID_PROVIDER', 'Use "alpaca", "polygon", or "all"');
        }
        console.log(chalk_1.default.blue.bold('\n🔍 Testing API Key Connectivity\n'));
        const providersToTest = provider === 'all' ? ['alpaca', 'polygon'] : [provider];
        for (const providerName of providersToTest) {
            await this.testProviderConnection(providerName);
        }
    }
    async testProviderConnection(provider) {
        this.context.progressIndicator.start(`Testing ${provider.toUpperCase()} connection...`);
        try {
            if (provider === 'alpaca') {
                // Test Alpaca connection
                const { AlpacaTradingProvider } = await Promise.resolve().then(() => __importStar(require('@jware-trader8/providers')));
                const apiKeys = await this.configStore.getApiKey('alpaca');
                const alpacaProvider = new AlpacaTradingProvider({
                    apiKey: apiKeys.apiKey,
                    secretKey: apiKeys.secretKey,
                    baseUrl: 'https://paper-api.alpaca.markets' // Use paper for testing
                });
                const result = await alpacaProvider.connect();
                if (result.success) {
                    this.context.progressIndicator.succeed(`${provider.toUpperCase()} connection successful`);
                    console.log(chalk_1.default.green(`✓ Account ID: ${result.accountInfo?.id || 'N/A'}`));
                    console.log(chalk_1.default.green(`✓ Account Status: ${result.accountInfo?.status || 'N/A'}`));
                }
                else {
                    this.context.progressIndicator.fail(`${provider.toUpperCase()} connection failed`);
                    console.log(chalk_1.default.red(`✗ Error: ${result.error}`));
                }
            }
            else if (provider === 'polygon') {
                // Test Polygon connection
                const { PolygonDataProvider } = await Promise.resolve().then(() => __importStar(require('@jware-trader8/providers')));
                const apiKeys = await this.configStore.getApiKey('polygon');
                const polygonProvider = new PolygonDataProvider({
                    apiKey: apiKeys.apiKey
                });
                // Test with a simple quote request
                const quote = await polygonProvider.getRealTimeQuote('BTCUSD');
                if (quote) {
                    this.context.progressIndicator.succeed(`${provider.toUpperCase()} connection successful`);
                    console.log(chalk_1.default.green(`✓ Test quote received for BTCUSD`));
                }
                else {
                    this.context.progressIndicator.fail(`${provider.toUpperCase()} connection failed`);
                }
            }
        }
        catch (error) {
            this.context.progressIndicator.fail(`${provider.toUpperCase()} connection failed`);
            if (error.message?.includes('API key not found')) {
                console.log(chalk_1.default.red(`✗ No API keys configured for ${provider.toUpperCase()}`));
                console.log(chalk_1.default.dim(`Run "jtrader config set-keys --provider ${provider}" to set up keys`));
            }
            else {
                console.log(chalk_1.default.red(`✗ Error: ${error.message}`));
            }
        }
    }
    async showApiKeyStatus() {
        const providers = ['alpaca', 'polygon'];
        const statusData = [];
        for (const provider of providers) {
            try {
                await this.configStore.getApiKey(provider);
                statusData.push({
                    Provider: provider.toUpperCase(),
                    Status: chalk_1.default.green('✓ Configured'),
                    Action: 'jtrader config test-keys --provider ' + provider
                });
            }
            catch {
                statusData.push({
                    Provider: provider.toUpperCase(),
                    Status: chalk_1.default.red('✗ Not configured'),
                    Action: 'jtrader config set-keys --provider ' + provider
                });
            }
        }
        console.log(this.context.outputFormatter.formatTable(statusData, ['Provider', 'Status', 'Action']));
    }
}
exports.ConfigCommands = ConfigCommands;
//# sourceMappingURL=config.js.map