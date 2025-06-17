import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { ConfigCommands } from '../../src/commands/config';
import { CLIContext } from '../../src/types/cli-types';
import { CLIOutputFormatter } from '../../src/utils/output-formatter';
import { CLIProgressIndicator } from '../../src/utils/progress-indicator';
import { CLIPromptHandler } from '../../src/utils/prompt-handler';

// Mock dependencies
jest.mock('@jware-trader8/database');

describe('ConfigCommands', () => {
  let configCommands: ConfigCommands;
  let mockContext: CLIContext;
  let mockOutputFormatter: jest.Mocked<CLIOutputFormatter>;
  let mockProgressIndicator: jest.Mocked<CLIProgressIndicator>;
  let mockPromptHandler: jest.Mocked<CLIPromptHandler>;
  let mockConfigStore: any;

  beforeEach(() => {
    // Create mocked context
    mockOutputFormatter = {
      formatTable: jest.fn().mockReturnValue('mock table'),
      formatJSON: jest.fn().mockReturnValue('mock json'),
      formatCSV: jest.fn().mockReturnValue('mock csv'),
      success: jest.fn().mockReturnValue('success message'),
      error: jest.fn().mockReturnValue('error message'),
      warning: jest.fn().mockReturnValue('warning message'),
      info: jest.fn().mockReturnValue('info message')
    } as any;

    mockProgressIndicator = {
      start: jest.fn(),
      update: jest.fn(),
      succeed: jest.fn(),
      fail: jest.fn(),
      stop: jest.fn()
    } as any;

    mockPromptHandler = {
      promptForApiKeys: jest.fn(),
      promptForConfirmation: jest.fn(),
      promptForChoice: jest.fn(),
      promptForInput: jest.fn(),
      displayWelcome: jest.fn(),
      displaySuccess: jest.fn(),
      displayError: jest.fn(),
      displayWarning: jest.fn(),
      displayInfo: jest.fn()
    } as any;

    mockContext = {
      config: {
        provider: 'alpaca',
        environment: 'paper',
        logLevel: 'info',
        maxPositions: 5,
        initialCapital: 10000,
        commission: 0.001
      },
      outputFormatter: mockOutputFormatter,
      progressIndicator: mockProgressIndicator,
      promptHandler: mockPromptHandler
    };

    // Mock ConfigStore
    mockConfigStore = {
      setApiKey: jest.fn(),
      getApiKey: jest.fn(),
      setConfig: jest.fn(),
      getConfig: jest.fn(),
      listConfigs: jest.fn(),
      reset: jest.fn()
    };

    configCommands = new ConfigCommands(mockContext);
    (configCommands as any).configStore = mockConfigStore;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSetKeys', () => {
    it('should validate provider name', async () => {
      const options = { provider: 'invalid' };

      await expect(configCommands.handleSetKeys(options as any))
        .rejects.toThrow('Invalid provider: invalid');
    });

    it('should accept valid provider names', async () => {
      const validProviders = ['alpaca', 'polygon'];

      for (const provider of validProviders) {
        mockPromptHandler.promptForApiKeys.mockResolvedValue({
          apiKey: 'test-api-key',
          secretKey: 'test-secret-key'
        });
        mockConfigStore.setApiKey.mockResolvedValue(undefined);

        const options = { provider };

        // This will complete successfully with mocked dependencies
        await configCommands.handleSetKeys(options as any);

        expect(mockPromptHandler.promptForApiKeys).toHaveBeenCalledWith(provider);
        expect(mockConfigStore.setApiKey).toHaveBeenCalledWith(
          provider,
          'test-api-key',
          'test-secret-key'
        );

        jest.clearAllMocks();
      }
    });

    it('should display provider-specific instructions', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      mockPromptHandler.promptForApiKeys.mockResolvedValue({
        apiKey: 'test-api-key',
        secretKey: 'test-secret-key'
      });
      mockConfigStore.setApiKey.mockResolvedValue(undefined);

      await configCommands.handleSetKeys({ provider: 'alpaca' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Alpaca'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('app.alpaca.markets'));

      consoleSpy.mockRestore();
    });

    it('should show progress during key storage', async () => {
      mockPromptHandler.promptForApiKeys.mockResolvedValue({
        apiKey: 'test-api-key',
        secretKey: 'test-secret-key'
      });
      mockConfigStore.setApiKey.mockResolvedValue(undefined);

      await configCommands.handleSetKeys({ provider: 'alpaca' });

      expect(mockProgressIndicator.start).toHaveBeenCalledWith('Preparing secure key storage...');
      expect(mockProgressIndicator.update).toHaveBeenCalledWith('Encrypting and storing keys...');
      expect(mockProgressIndicator.succeed).toHaveBeenCalledWith('API keys stored successfully');
    });

    it('should handle storage errors', async () => {
      mockPromptHandler.promptForApiKeys.mockResolvedValue({
        apiKey: 'test-api-key',
        secretKey: 'test-secret-key'
      });
      mockConfigStore.setApiKey.mockRejectedValue(new Error('Storage failed'));

      await expect(configCommands.handleSetKeys({ provider: 'alpaca' }))
        .rejects.toThrow('Storage failed');

      expect(mockProgressIndicator.fail).toHaveBeenCalledWith('Failed to store API keys');
    });
  });

  describe('handleListConfig', () => {
    it('should display empty config message when no configs exist', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockConfigStore.listConfigs.mockResolvedValue({});

      await configCommands.handleListConfig();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No configuration settings found'));
      consoleSpy.mockRestore();
    });

    it('should format and display configuration data', async () => {
      const mockConfigs = {
        'trading.provider': 'alpaca',
        'trading.environment': 'paper',
        'api.alpaca.key': 'encrypted-key-data'
      };

      mockConfigStore.listConfigs.mockResolvedValue(mockConfigs);

      await configCommands.handleListConfig();

      expect(mockOutputFormatter.formatTable).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'trading.provider',
            Value: 'alpaca',
            Type: 'string'
          }),
          expect.objectContaining({
            Key: 'api.alpaca.key',
            Value: '****** (encrypted)',
            Type: 'string'
          })
        ]),
        ['Key', 'Value', 'Type']
      );
    });

    it('should mask sensitive configuration values', async () => {
      const mockConfigs = {
        'normal.setting': 'visible-value',
        'secret.key': 'should-be-masked',
        'api.secret': 'should-be-masked',
        'password': 'should-be-masked'
      };

      mockConfigStore.listConfigs.mockResolvedValue(mockConfigs);

      await configCommands.handleListConfig();

      const formatTableCall = mockOutputFormatter.formatTable.mock.calls[0][0];
      
      // Find the sensitive entries
      const secretKeyEntry = formatTableCall.find((item: any) => item.Key === 'secret.key');
      const apiSecretEntry = formatTableCall.find((item: any) => item.Key === 'api.secret');
      const passwordEntry = formatTableCall.find((item: any) => item.Key === 'password');
      const normalEntry = formatTableCall.find((item: any) => item.Key === 'normal.setting');

      expect(secretKeyEntry.Value).toBe('****** (encrypted)');
      expect(apiSecretEntry.Value).toBe('****** (encrypted)');
      expect(passwordEntry.Value).toBe('****** (encrypted)');
      expect(normalEntry.Value).toBe('visible-value');
    });

    it('should show progress during config loading', async () => {
      mockConfigStore.listConfigs.mockResolvedValue({});

      await configCommands.handleListConfig();

      expect(mockProgressIndicator.start).toHaveBeenCalledWith('Loading configuration...');
      expect(mockProgressIndicator.succeed).toHaveBeenCalledWith('Configuration loaded');
    });
  });

  describe('handleGetConfig', () => {
    it('should retrieve and display configuration value', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockConfigStore.getConfig.mockResolvedValue('test-value');

      await configCommands.handleGetConfig('test.key');

      expect(mockConfigStore.getConfig).toHaveBeenCalledWith('test.key');
      expect(consoleSpy).toHaveBeenCalledWith('test.key: test-value');

      consoleSpy.mockRestore();
    });

    it('should handle non-existent configuration keys', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockConfigStore.getConfig.mockResolvedValue(null);

      await configCommands.handleGetConfig('nonexistent.key');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));

      consoleSpy.mockRestore();
    });

    it('should mask sensitive configuration values', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockConfigStore.getConfig.mockResolvedValue('sensitive-value');

      await configCommands.handleGetConfig('api.key');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('****** (encrypted)'));

      consoleSpy.mockRestore();
    });

    it('should format object values as JSON', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const objectValue = { setting1: 'value1', setting2: 'value2' };
      mockConfigStore.getConfig.mockResolvedValue(objectValue);

      await configCommands.handleGetConfig('complex.setting');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(JSON.stringify(objectValue, null, 2)));

      consoleSpy.mockRestore();
    });
  });

  describe('handleSetConfig', () => {
    it('should set string configuration values', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockConfigStore.setConfig.mockResolvedValue(undefined);

      await configCommands.handleSetConfig('test.key', 'test-value');

      expect(mockConfigStore.setConfig).toHaveBeenCalledWith('test.key', 'test-value');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration updated'));

      consoleSpy.mockRestore();
    });

    it('should parse JSON values when possible', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockConfigStore.setConfig.mockResolvedValue(undefined);

      await configCommands.handleSetConfig('test.key', '{"number": 42, "boolean": true}');

      expect(mockConfigStore.setConfig).toHaveBeenCalledWith('test.key', { number: 42, boolean: true });

      consoleSpy.mockRestore();
    });

    it('should handle storage errors', async () => {
      mockConfigStore.setConfig.mockRejectedValue(new Error('Storage failed'));

      await expect(configCommands.handleSetConfig('test.key', 'test-value'))
        .rejects.toThrow('Failed to set configuration');
    });
  });

  describe('handleResetConfig', () => {
    it('should prompt for confirmation when confirm option is not provided', async () => {
      mockPromptHandler.promptForConfirmation.mockResolvedValue(false);

      await configCommands.handleResetConfig({});

      expect(mockPromptHandler.promptForConfirmation).toHaveBeenCalledWith(
        'Are you sure you want to reset all configuration?'
      );
      expect(mockConfigStore.reset).not.toHaveBeenCalled();
    });

    it('should skip confirmation when confirm option is provided', async () => {
      mockConfigStore.reset.mockResolvedValue(undefined);

      await configCommands.handleResetConfig({ confirm: true });

      expect(mockPromptHandler.promptForConfirmation).not.toHaveBeenCalled();
      expect(mockConfigStore.reset).toHaveBeenCalled();
    });

    it('should reset configuration when confirmed', async () => {
      mockPromptHandler.promptForConfirmation.mockResolvedValue(true);
      mockConfigStore.reset.mockResolvedValue(undefined);

      await configCommands.handleResetConfig({});

      expect(mockConfigStore.reset).toHaveBeenCalled();
      expect(mockProgressIndicator.succeed).toHaveBeenCalledWith('Configuration reset successfully');
    });

    it('should handle reset errors', async () => {
      mockPromptHandler.promptForConfirmation.mockResolvedValue(true);
      mockConfigStore.reset.mockRejectedValue(new Error('Reset failed'));

      await expect(configCommands.handleResetConfig({}))
        .rejects.toThrow('Reset failed');

      expect(mockProgressIndicator.fail).toHaveBeenCalledWith('Failed to reset configuration');
    });
  });

  describe('handleTestKeys', () => {
    it('should validate provider option', async () => {
      await expect(configCommands.handleTestKeys({ provider: 'invalid' }))
        .rejects.toThrow('Invalid provider: invalid');
    });

    it('should test all providers when "all" is specified', async () => {
      const testConnection = jest.spyOn(configCommands as any, 'testProviderConnection')
        .mockResolvedValue(undefined);

      await configCommands.handleTestKeys({ provider: 'all' });

      expect(testConnection).toHaveBeenCalledWith('alpaca');
      expect(testConnection).toHaveBeenCalledWith('polygon');

      testConnection.mockRestore();
    });

    it('should test specific provider when specified', async () => {
      const testConnection = jest.spyOn(configCommands as any, 'testProviderConnection')
        .mockResolvedValue(undefined);

      await configCommands.handleTestKeys({ provider: 'alpaca' });

      expect(testConnection).toHaveBeenCalledWith('alpaca');
      expect(testConnection).toHaveBeenCalledTimes(1);

      testConnection.mockRestore();
    });
  });

  describe('API Key Status Display', () => {
    it('should show configured status for existing keys', async () => {
      mockConfigStore.getApiKey.mockResolvedValue({ apiKey: 'test', secretKey: 'test' });

      const showApiKeyStatus = (configCommands as any).showApiKeyStatus.bind(configCommands);
      await showApiKeyStatus();

      expect(mockOutputFormatter.formatTable).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            Provider: 'ALPACA',
            Status: expect.stringContaining('Configured')
          }),
          expect.objectContaining({
            Provider: 'POLYGON',
            Status: expect.stringContaining('Configured')
          })
        ]),
        ['Provider', 'Status', 'Action']
      );
    });

    it('should show not configured status for missing keys', async () => {
      mockConfigStore.getApiKey.mockRejectedValue(new Error('API key not found'));

      const showApiKeyStatus = (configCommands as any).showApiKeyStatus.bind(configCommands);
      await showApiKeyStatus();

      expect(mockOutputFormatter.formatTable).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            Provider: 'ALPACA',
            Status: expect.stringContaining('Not configured')
          }),
          expect.objectContaining({
            Provider: 'POLYGON',
            Status: expect.stringContaining('Not configured')
          })
        ]),
        ['Provider', 'Status', 'Action']
      );
    });
  });
});