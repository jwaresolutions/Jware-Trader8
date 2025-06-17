import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { CLIPromptHandler } from '../../src/utils/prompt-handler';

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

describe('CLIPromptHandler', () => {
  let promptHandler: CLIPromptHandler;
  let mockInquirer: any;

  beforeEach(() => {
    promptHandler = new CLIPromptHandler();
    mockInquirer = require('inquirer');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('promptForApiKeys', () => {
    it('should prompt for API key and secret key', async () => {
      mockInquirer.prompt.mockResolvedValue({
        apiKey: 'test-api-key',
        secretKey: 'test-secret-key'
      });

      const result = await promptHandler.promptForApiKeys('alpaca');

      expect(result).toEqual({
        apiKey: 'test-api-key',
        secretKey: 'test-secret-key'
      });

      expect(mockInquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'password',
            name: 'apiKey',
            message: 'Enter your ALPACA API key:'
          }),
          expect.objectContaining({
            type: 'password',
            name: 'secretKey',
            message: 'Enter your ALPACA secret key:'
          })
        ])
      );
    });

    it('should validate API key length', async () => {
      const questions = [
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter your ALPACA API key:',
          validate: expect.any(Function)
        }
      ];

      mockInquirer.prompt.mockImplementation((prompts) => {
        // Test the validation function
        const apiKeyPrompt = prompts.find((p: any) => p.name === 'apiKey');
        
        // Test empty input
        expect(apiKeyPrompt.validate('')).toBe('API key is required');
        
        // Test short input
        expect(apiKeyPrompt.validate('short')).toBe('API key seems too short. Please check and try again.');
        
        // Test valid input
        expect(apiKeyPrompt.validate('valid-api-key-123')).toBe(true);

        return Promise.resolve({
          apiKey: 'valid-api-key-123',
          secretKey: 'valid-secret-key-456'
        });
      });

      await promptHandler.promptForApiKeys('alpaca');
    });

    it('should trim whitespace from inputs', async () => {
      mockInquirer.prompt.mockResolvedValue({
        apiKey: '  test-api-key  ',
        secretKey: '  test-secret-key  '
      });

      const result = await promptHandler.promptForApiKeys('polygon');

      expect(result).toEqual({
        apiKey: 'test-api-key',
        secretKey: 'test-secret-key'
      });
    });
  });

  describe('promptForConfirmation', () => {
    it('should prompt for yes/no confirmation', async () => {
      mockInquirer.prompt.mockResolvedValue({ confirmed: true });

      const result = await promptHandler.promptForConfirmation('Are you sure?');

      expect(result).toBe(true);
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'confirm',
          name: 'confirmed',
          message: 'Are you sure?',
          default: false
        })
      ]);
    });

    it('should default to false', async () => {
      mockInquirer.prompt.mockResolvedValue({ confirmed: false });

      const result = await promptHandler.promptForConfirmation('Delete everything?');

      expect(result).toBe(false);
    });
  });

  describe('promptForChoice', () => {
    it('should prompt for selection from choices', async () => {
      const choices = ['Option A', 'Option B', 'Option C'];
      mockInquirer.prompt.mockResolvedValue({ choice: 'Option B' });

      const result = await promptHandler.promptForChoice('Select an option:', choices);

      expect(result).toBe('Option B');
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'choice',
          message: 'Select an option:',
          choices: choices
        })
      ]);
    });
  });

  describe('promptForInput', () => {
    it('should prompt for text input', async () => {
      mockInquirer.prompt.mockResolvedValue({ input: 'user input' });

      const result = await promptHandler.promptForInput('Enter something:');

      expect(result).toBe('user input');
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'input',
          name: 'input',
          message: 'Enter something:'
        })
      ]);
    });

    it('should use default value when provided', async () => {
      mockInquirer.prompt.mockResolvedValue({ input: 'default value' });

      const result = await promptHandler.promptForInput('Enter something:', 'default value');

      expect(result).toBe('default value');
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          default: 'default value'
        })
      ]);
    });

    it('should validate input is not empty', async () => {
      mockInquirer.prompt.mockImplementation((prompts) => {
        const inputPrompt = prompts[0];
        
        // Test validation
        expect(inputPrompt.validate('')).toBe('Input is required');
        expect(inputPrompt.validate('   ')).toBe('Input is required');
        expect(inputPrompt.validate('valid input')).toBe(true);

        return Promise.resolve({ input: 'valid input' });
      });

      await promptHandler.promptForInput('Enter something:');
    });

    it('should trim whitespace from input', async () => {
      mockInquirer.prompt.mockResolvedValue({ input: '  trimmed input  ' });

      const result = await promptHandler.promptForInput('Enter something:');

      expect(result).toBe('trimmed input');
    });
  });

  describe('promptForProvider', () => {
    it('should prompt for provider selection', async () => {
      mockInquirer.prompt.mockResolvedValue({ provider: 'alpaca' });

      const result = await promptHandler.promptForProvider();

      expect(result).toBe('alpaca');
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'provider',
          message: 'Select trading provider:',
          choices: expect.arrayContaining([
            expect.objectContaining({ value: 'alpaca' }),
            expect.objectContaining({ value: 'polygon' })
          ])
        })
      ]);
    });
  });

  describe('promptForEnvironment', () => {
    it('should prompt for trading environment', async () => {
      mockInquirer.prompt.mockResolvedValue({ environment: 'paper' });

      const result = await promptHandler.promptForEnvironment();

      expect(result).toBe('paper');
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'environment',
          message: 'Select trading environment:',
          choices: expect.arrayContaining([
            expect.objectContaining({ value: 'paper' }),
            expect.objectContaining({ value: 'live' })
          ]),
          default: 'paper'
        })
      ]);
    });

    it('should require confirmation for live trading', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ environment: 'live' })
        .mockResolvedValueOnce({ confirmed: false });

      const result = await promptHandler.promptForEnvironment();

      expect(result).toBe('paper');
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(2);
    });

    it('should allow live trading when confirmed', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ environment: 'live' })
        .mockResolvedValueOnce({ confirmed: true });

      const result = await promptHandler.promptForEnvironment();

      expect(result).toBe('live');
    });
  });

  describe('promptForStrategyParameters', () => {
    it('should prompt for all strategy parameters', async () => {
      const parameters = {
        period: 20,
        threshold: 0.05,
        enabled: true,
        name: 'test'
      };

      mockInquirer.prompt.mockResolvedValue({
        period: '25',
        threshold: '0.10',
        enabled: 'false',
        name: 'updated'
      });

      const result = await promptHandler.promptForStrategyParameters(parameters);

      expect(result).toEqual({
        period: 25,
        threshold: 0.10,
        enabled: false,
        name: 'updated'
      });

      expect(mockInquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'period',
            default: '20'
          }),
          expect.objectContaining({
            name: 'threshold',
            default: '0.05'
          }),
          expect.objectContaining({
            name: 'enabled',
            default: 'true'
          }),
          expect.objectContaining({
            name: 'name',
            default: 'test'
          })
        ])
      );
    });

    it('should validate numeric parameters', async () => {
      const parameters = { period: 20 };

      mockInquirer.prompt.mockImplementation((prompts) => {
        const periodPrompt = prompts.find((p: any) => p.name === 'period');
        
        // Test validation
        expect(periodPrompt.validate('not a number')).toBe('period must be a valid number');
        expect(periodPrompt.validate('25')).toBe(true);

        return Promise.resolve({ period: '25' });
      });

      await promptHandler.promptForStrategyParameters(parameters);
    });
  });

  describe('promptForSymbol', () => {
    it('should prompt for trading symbol', async () => {
      mockInquirer.prompt.mockResolvedValue({ symbol: 'AAPL' });

      const result = await promptHandler.promptForSymbol();

      expect(result).toBe('AAPL');
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          message: expect.stringContaining('trading symbol'),
          default: 'BTCUSD'
        })
      ]);
    });

    it('should use provided default symbol', async () => {
      mockInquirer.prompt.mockResolvedValue({ symbol: 'SPY' });

      const result = await promptHandler.promptForSymbol('SPY');

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          default: 'SPY'
        })
      ]);
    });

    it('should validate symbol format', async () => {
      mockInquirer.prompt.mockImplementation((prompts) => {
        const symbolPrompt = prompts[0];
        
        // Test validation
        expect(symbolPrompt.validate('')).toBe('Symbol is required');
        expect(symbolPrompt.validate('invalid-symbol!')).toBe('Symbol should only contain letters and numbers (e.g., BTCUSD, AAPL)');
        expect(symbolPrompt.validate('BTCUSD')).toBe(true);

        return Promise.resolve({ symbol: 'BTCUSD' });
      });

      await promptHandler.promptForSymbol();
    });

    it('should convert symbol to uppercase', async () => {
      mockInquirer.prompt.mockImplementation((prompts) => {
        const symbolPrompt = prompts[0];
        
        // Test filter function
        expect(symbolPrompt.filter('btcusd')).toBe('BTCUSD');
        expect(symbolPrompt.filter('  aapl  ')).toBe('AAPL');

        return Promise.resolve({ symbol: 'AAPL' });
      });

      await promptHandler.promptForSymbol();
    });
  });

  describe('promptForDateRange', () => {
    it('should prompt for start and end dates', async () => {
      mockInquirer.prompt.mockResolvedValue({
        startDate: '2024-01-01',
        endDate: '2024-06-01'
      });

      const result = await promptHandler.promptForDateRange();

      expect(result).toEqual({
        startDate: '2024-01-01',
        endDate: '2024-06-01'
      });
    });

    it('should validate date formats', async () => {
      mockInquirer.prompt.mockImplementation((prompts) => {
        const startPrompt = prompts.find((p: any) => p.name === 'startDate');
        const endPrompt = prompts.find((p: any) => p.name === 'endDate');
        
        // Test start date validation
        expect(startPrompt.validate('invalid-date')).toBe('Please enter a valid date in YYYY-MM-DD format');
        expect(startPrompt.validate('2024-01-01')).toBe(true);
        
        // Test future date validation
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        expect(startPrompt.validate(futureDate.toISOString().split('T')[0]))
          .toBe('Start date cannot be in the future');

        return Promise.resolve({
          startDate: '2024-01-01',
          endDate: '2024-06-01'
        });
      });

      await promptHandler.promptForDateRange();
    });

    it('should validate end date is after start date', async () => {
      mockInquirer.prompt.mockImplementation((prompts) => {
        const endPrompt = prompts.find((p: any) => p.name === 'endDate');
        
        // Test end date validation with answers context
        const answers = { startDate: '2024-06-01' };
        expect(endPrompt.validate('2024-01-01', answers))
          .toBe('End date must be after start date');
        expect(endPrompt.validate('2024-12-01', answers)).toBe(true);

        return Promise.resolve({
          startDate: '2024-01-01',
          endDate: '2024-06-01'
        });
      });

      await promptHandler.promptForDateRange();
    });
  });

  describe('promptForTimeframe', () => {
    it('should prompt for timeframe selection', async () => {
      mockInquirer.prompt.mockResolvedValue({ timeframe: '4h' });

      const result = await promptHandler.promptForTimeframe();

      expect(result).toBe('4h');
      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          choices: expect.arrayContaining([
            expect.objectContaining({ value: '1m' }),
            expect.objectContaining({ value: '5m' }),
            expect.objectContaining({ value: '15m' }),
            expect.objectContaining({ value: '1h' }),
            expect.objectContaining({ value: '1d' })
          ]),
          default: '1h'
        })
      ]);
    });
  });

  describe('Display methods', () => {
    it('should have display methods that log to console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      promptHandler.displayWelcome();
      promptHandler.displaySuccess('Success message');
      promptHandler.displayError('Error message');
      promptHandler.displayWarning('Warning message');
      promptHandler.displayInfo('Info message');

      expect(consoleSpy).toHaveBeenCalledTimes(5);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Welcome'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ'));

      consoleSpy.mockRestore();
    });
  });
});