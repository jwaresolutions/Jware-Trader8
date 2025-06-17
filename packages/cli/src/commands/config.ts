import { Command } from 'commander';
import chalk from 'chalk';
import { CLIContext, ConfigSetKeysOptions } from '../types/cli-types';
import { CLIErrorHandler } from '../utils/error-handler';
import { ConfigStore } from '@jware-trader8/database';

export class ConfigCommands {
  private context: CLIContext;
  private configStore: ConfigStore;

  constructor(context: CLIContext) {
    this.context = context;
    this.configStore = new ConfigStore();
  }

  registerCommands(program: Command): void {
    const configCmd = program
      .command('config')
      .description('Manage configuration settings and API keys');

    configCmd
      .command('set-keys')
      .description('Set API keys for trading providers')
      .option('--provider <name>', 'Provider name: alpaca, polygon', 'alpaca')
      .option('--interactive', 'Use interactive setup wizard', true)
      .action(async (options: ConfigSetKeysOptions) => {
        try {
          await this.handleSetKeys(options);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });

    configCmd
      .command('list')
      .description('List all configuration settings')
      .action(async () => {
        try {
          await this.handleListConfig();
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });

    configCmd
      .command('get')
      .description('Get configuration value')
      .argument('<key>', 'Configuration key')
      .action(async (key: string) => {
        try {
          await this.handleGetConfig(key);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });

    configCmd
      .command('set')
      .description('Set configuration value')
      .argument('<key>', 'Configuration key')
      .argument('<value>', 'Configuration value')
      .action(async (key: string, value: string) => {
        try {
          await this.handleSetConfig(key, value);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });

    configCmd
      .command('reset')
      .description('Reset configuration to defaults')
      .option('--confirm', 'Skip confirmation prompt')
      .action(async (options: { confirm?: boolean }) => {
        try {
          await this.handleResetConfig(options);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });

    configCmd
      .command('test-keys')
      .description('Test API key connectivity')
      .option('--provider <name>', 'Provider to test: alpaca, polygon, all', 'all')
      .action(async (options: { provider: string }) => {
        try {
          await this.handleTestKeys(options);
        } catch (error) {
          CLIErrorHandler.handle(error);
        }
      });
  }

  async handleSetKeys(options: ConfigSetKeysOptions): Promise<void> {
    const provider = options.provider || 'alpaca';
    
    if (!['alpaca', 'polygon'].includes(provider)) {
      throw CLIErrorHandler.createError(
        `Invalid provider: ${provider}`,
        'INVALID_PROVIDER',
        'Use "alpaca" or "polygon"'
      );
    }

    console.log(chalk.blue.bold(`\n🔐 Setting up ${provider.toUpperCase()} API Keys\n`));

    if (provider === 'alpaca') {
      console.log(chalk.dim('Alpaca provides both trading and market data services.'));
      console.log(chalk.dim('Get your API keys from: https://app.alpaca.markets/paper/dashboard/overview'));
    } else if (provider === 'polygon') {
      console.log(chalk.dim('Polygon provides market data services.'));
      console.log(chalk.dim('Get your API key from: https://polygon.io/dashboard'));
    }

    console.log(chalk.yellow('\n⚠ Important Security Notes:'));
    console.log(chalk.dim('• Your API keys will be encrypted and stored locally'));
    console.log(chalk.dim('• Never share your API keys with anyone'));
    console.log(chalk.dim('• Use paper trading keys for testing'));
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
        console.log(chalk.blue('\n🔍 Testing API key connectivity...'));
        await this.testProviderConnection(provider);
      }

      console.log(chalk.green.bold('\n✅ API keys configured successfully!'));
      console.log(chalk.dim(`Provider: ${provider.toUpperCase()}`));
      console.log(chalk.dim('Keys are encrypted and stored securely.'));

      // Show next steps
      console.log(chalk.blue.bold('\n📋 Next Steps:'));
      if (provider === 'alpaca') {
        console.log(chalk.dim('• Test trading: ') + chalk.cyan('jtrader trade start <strategy> --dry-run'));
        console.log(chalk.dim('• Check status: ') + chalk.cyan('jtrader status'));
      }
      console.log(chalk.dim('• Run backtest: ') + chalk.cyan('jtrader backtest <strategy> --symbol <SYMBOL> --start <DATE> --end <DATE>'));

    } catch (error) {
      this.context.progressIndicator.fail('Failed to store API keys');
      throw error;
    }
  }

  async handleListConfig(): Promise<void> {
    this.context.progressIndicator.start('Loading configuration...');

    try {
      const configs = await this.configStore.listConfigs();
      
      this.context.progressIndicator.succeed('Configuration loaded');

      console.log(chalk.blue.bold('\n⚙️ Configuration Settings\n'));

      if (!configs || Object.keys(configs).length === 0) {
        console.log(chalk.yellow('No configuration settings found.'));
        console.log(chalk.dim('Run "jtrader config set-keys" to get started.'));
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
      console.log(chalk.blue.bold('\n🔐 API Key Status\n'));
      await this.showApiKeyStatus();

    } catch (error) {
      this.context.progressIndicator.fail('Failed to load configuration');
      throw error;
    }
  }

  async handleGetConfig(key: string): Promise<void> {
    try {
      const value = await this.configStore.getConfig(key);
      
      if (value === null || value === undefined) {
        console.log(chalk.yellow(`Configuration key "${key}" not found.`));
        return;
      }

      // Mask sensitive data
      if (key.includes('key') || key.includes('secret') || key.includes('password')) {
        console.log(chalk.dim(`${key}: ****** (encrypted)`));
      } else {
        console.log(`${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
      }
    } catch (error) {
      throw CLIErrorHandler.createError(
        `Failed to get configuration: ${(error as Error).message}`,
        'CONFIG_GET_FAILED',
        'Check that the configuration key exists'
      );
    }
  }

  async handleSetConfig(key: string, value: string): Promise<void> {
    try {
      // Try to parse value as JSON, fallback to string
      let parsedValue: any = value;
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Value is not JSON, keep as string
      }

      await this.configStore.setConfig(key, parsedValue);
      
      console.log(chalk.green(`✓ Configuration updated: ${key} = ${value}`));
    } catch (error) {
      throw CLIErrorHandler.createError(
        `Failed to set configuration: ${(error as Error).message}`,
        'CONFIG_SET_FAILED',
        'Check the key and value format'
      );
    }
  }

  async handleResetConfig(options: { confirm?: boolean }): Promise<void> {
    if (!options.confirm) {
      console.log(chalk.red.bold('⚠ Warning: This will reset ALL configuration settings!'));
      console.log(chalk.dim('This includes API keys, preferences, and custom settings.'));
      
      const confirmed = await this.context.promptHandler.promptForConfirmation(
        'Are you sure you want to reset all configuration?'
      );
      
      if (!confirmed) {
        console.log(chalk.green('Configuration reset cancelled.'));
        return;
      }
    }

    this.context.progressIndicator.start('Resetting configuration...');

    try {
      await this.configStore.reset();
      
      this.context.progressIndicator.succeed('Configuration reset successfully');
      
      console.log(chalk.green('✅ All configuration settings have been reset.'));
      console.log(chalk.dim('Run "jtrader config set-keys" to set up API keys again.'));
    } catch (error) {
      this.context.progressIndicator.fail('Failed to reset configuration');
      throw error;
    }
  }

  async handleTestKeys(options: { provider: string }): Promise<void> {
    const provider = options.provider.toLowerCase();
    
    if (provider !== 'all' && !['alpaca', 'polygon'].includes(provider)) {
      throw CLIErrorHandler.createError(
        `Invalid provider: ${provider}`,
        'INVALID_PROVIDER',
        'Use "alpaca", "polygon", or "all"'
      );
    }

    console.log(chalk.blue.bold('\n🔍 Testing API Key Connectivity\n'));

    const providersToTest = provider === 'all' ? ['alpaca', 'polygon'] : [provider];

    for (const providerName of providersToTest) {
      await this.testProviderConnection(providerName);
    }
  }

  private async testProviderConnection(provider: string): Promise<void> {
    this.context.progressIndicator.start(`Testing ${provider.toUpperCase()} connection...`);

    try {
      if (provider === 'alpaca') {
        // Test Alpaca connection
        const { AlpacaTradingProvider } = await import('@jware-trader8/providers');
        const apiKeys = await this.configStore.getApiKey('alpaca');
        
        const alpacaProvider = new AlpacaTradingProvider({
          apiKey: apiKeys.apiKey,
          secretKey: apiKeys.secretKey,
          baseUrl: 'https://paper-api.alpaca.markets' // Use paper for testing
        });

        const result = await alpacaProvider.connect();
        
        if (result.success) {
          this.context.progressIndicator.succeed(`${provider.toUpperCase()} connection successful`);
          console.log(chalk.green(`✓ Account ID: ${result.accountInfo?.id || 'N/A'}`));
          console.log(chalk.green(`✓ Account Status: ${result.accountInfo?.status || 'N/A'}`));
        } else {
          this.context.progressIndicator.fail(`${provider.toUpperCase()} connection failed`);
          console.log(chalk.red(`✗ Error: ${result.error}`));
        }
      } else if (provider === 'polygon') {
        // Test Polygon connection
        const { PolygonDataProvider } = await import('@jware-trader8/providers');
        const apiKeys = await this.configStore.getApiKey('polygon');
        
        const polygonProvider = new PolygonDataProvider({
          apiKey: apiKeys.apiKey
        });

        // Test with a simple quote request
        const quote = await polygonProvider.getRealTimeQuote('BTCUSD');
        
        if (quote) {
          this.context.progressIndicator.succeed(`${provider.toUpperCase()} connection successful`);
          console.log(chalk.green(`✓ Test quote received for BTCUSD`));
        } else {
          this.context.progressIndicator.fail(`${provider.toUpperCase()} connection failed`);
        }
      }
    } catch (error) {
      this.context.progressIndicator.fail(`${provider.toUpperCase()} connection failed`);
      
      if ((error as any).message?.includes('API key not found')) {
        console.log(chalk.red(`✗ No API keys configured for ${provider.toUpperCase()}`));
        console.log(chalk.dim(`Run "jtrader config set-keys --provider ${provider}" to set up keys`));
      } else {
        console.log(chalk.red(`✗ Error: ${(error as Error).message}`));
      }
    }
  }

  private async showApiKeyStatus(): Promise<void> {
    const providers = ['alpaca', 'polygon'];
    const statusData = [];

    for (const provider of providers) {
      try {
        await this.configStore.getApiKey(provider);
        statusData.push({
          Provider: provider.toUpperCase(),
          Status: chalk.green('✓ Configured'),
          Action: 'jtrader config test-keys --provider ' + provider
        });
      } catch {
        statusData.push({
          Provider: provider.toUpperCase(),
          Status: chalk.red('✗ Not configured'),
          Action: 'jtrader config set-keys --provider ' + provider
        });
      }
    }

    console.log(this.context.outputFormatter.formatTable(statusData, ['Provider', 'Status', 'Action']));
  }
}