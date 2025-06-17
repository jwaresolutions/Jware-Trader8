/**
 * Tests for Alpaca Trading Provider
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import { AlpacaTradingProvider } from '../src/alpaca/alpaca-provider';
import { Account, Order, Position, ConnectionResult } from '@jware-trader8/types';

// Mock the Alpaca API
jest.mock('@alpacahq/alpaca-trade-api');

describe('AlpacaTradingProvider', () => {
  let provider: AlpacaTradingProvider;
  let mockAlpacaClient: any;

  const testConfig = {
    name: 'alpaca',
    apiConfig: {
      apiKey: 'test-api-key',
      secretKey: 'test-secret-key',
      baseUrl: 'https://paper-api.alpaca.markets',
      paperTrading: true
    },
    timeout: 30000,
    rateLimit: {
      requestsPerSecond: 3,
      requestsPerMinute: 200
    }
  };

  beforeEach(() => {
    // Create mock Alpaca client
    mockAlpacaClient = {
      getAccount: jest.fn(),
      createOrder: jest.fn(),
      getOrder: jest.fn(),
      cancelOrder: jest.fn(),
      getPositions: jest.fn(),
      getOrders: jest.fn(),
      closePosition: jest.fn(),
      isMarketOpen: jest.fn()
    };

    provider = new AlpacaTradingProvider(testConfig);
    // Inject mock client
    provider['alpacaClient'] = mockAlpacaClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection Management', () => {
    test('should connect successfully with valid credentials', async () => {
      // Arrange
      const mockAccountData = {
        id: 'test-account-123',
        cash: '10000.00',
        buying_power: '40000.00',
        portfolio_value: '50000.00',
        equity: '50000.00'
      };
      mockAlpacaClient.getAccount.mockResolvedValue(mockAccountData);

      // Act
      const result: ConnectionResult = await provider.connect();

      // Assert
      expect(result.success).toBe(true);
      expect(result.accountInfo).toBeDefined();
      expect(result.accountInfo?.id).toBe('test-account-123');
      expect(result.accountInfo?.balance).toBe(10000);
      expect(result.accountInfo?.buyingPower).toBe(40000);
      expect(mockAlpacaClient.getAccount).toHaveBeenCalledTimes(1);
    });

    test('should handle connection failure gracefully', async () => {
      // Arrange
      const mockError = new Error('Invalid API credentials');
      mockAlpacaClient.getAccount.mockRejectedValue(mockError);

      // Act
      const result: ConnectionResult = await provider.connect();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API credentials');
      expect(result.accountInfo).toBeUndefined();
    });

    test('should handle rate limiting with retry', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded');
      const mockAccountData = {
        id: 'test-account-123',
        cash: '10000.00',
        buying_power: '40000.00'
      };

      mockAlpacaClient.getAccount
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockAccountData);

      // Act
      const result = await provider.connect();

      // Assert
      expect(result.success).toBe(true);
      expect(mockAlpacaClient.getAccount).toHaveBeenCalledTimes(2);
    });
  });

  describe('Account Management', () => {
    test('should get account information correctly', async () => {
      // Arrange
      const mockAccountData = {
        id: 'test-account-123',
        cash: '5000.50',
        buying_power: '20000.00',
        portfolio_value: '25000.00',
        equity: '25000.00',
        long_market_value: '20000.00',
        short_market_value: '0.00'
      };
      mockAlpacaClient.getAccount.mockResolvedValue(mockAccountData);

      // Act
      const account: Account = await provider.getAccount();

      // Assert
      expect(account.id).toBe('test-account-123');
      expect(account.balance).toBe(5000.50);
      expect(account.buyingPower).toBe(20000);
      // Note: equity, longMarketValue, shortMarketValue are not in the base Account interface
      // They would be provider-specific extensions or calculated fields
    });

    test('should get buying power correctly', async () => {
      // Arrange
      const mockAccountData = {
        buying_power: '15000.75'
      };
      mockAlpacaClient.getAccount.mockResolvedValue(mockAccountData);

      // Act
      const buyingPower = await provider.getBuyingPower();

      // Assert
      expect(buyingPower).toBe(15000.75);
    });
  });

  describe('Order Management', () => {
    test('should place buy order with valid parameters', async () => {
      // Arrange
      const mockOrderResponse = {
        id: 'order-123',
        symbol: 'BTCUSD',
        side: 'buy',
        qty: '0.1',
        order_type: 'market',
        status: 'pending_new',
        created_at: '2023-01-01T10:00:00Z'
      };
      mockAlpacaClient.createOrder.mockResolvedValue(mockOrderResponse);

      // Act
      const order: Order = await provider.placeBuyOrder('BTCUSD', 0.1, 'MARKET');

      // Assert
      expect(order.id).toBe('order-123');
      expect(order.symbol).toBe('BTCUSD');
      expect(order.side).toBe('BUY');
      expect(order.quantity).toBe(0.1);
      expect(order.type).toBe('MARKET');
      expect(order.status).toBe('PENDING');
      expect(mockAlpacaClient.createOrder).toHaveBeenCalledWith({
        symbol: 'BTCUSD',
        qty: 0.1,
        side: 'buy',
        type: 'market',
        time_in_force: 'day'
      });
    });

    test('should place limit buy order with price', async () => {
      // Arrange
      const mockOrderResponse = {
        id: 'order-456',
        symbol: 'ETHUSD',
        side: 'buy',
        qty: '1.0',
        order_type: 'limit',
        limit_price: '2000.00',
        status: 'pending_new'
      };
      mockAlpacaClient.createOrder.mockResolvedValue(mockOrderResponse);

      // Act
      const order: Order = await provider.placeBuyOrder('ETHUSD', 1.0, 'LIMIT', 2000);

      // Assert
      expect(order.price).toBe(2000);
      expect(order.type).toBe('LIMIT');
      expect(mockAlpacaClient.createOrder).toHaveBeenCalledWith({
        symbol: 'ETHUSD',
        qty: 1.0,
        side: 'buy',
        type: 'limit',
        limit_price: 2000,
        time_in_force: 'day'
      });
    });

    test('should reject buy order with insufficient funds', async () => {
      // Arrange
      const insufficientFundsError = new Error('Insufficient buying power');
      mockAlpacaClient.createOrder.mockRejectedValue(insufficientFundsError);

      // Act & Assert
      await expect(
        provider.placeBuyOrder('BTCUSD', 10, 'MARKET')
      ).rejects.toThrow('Insufficient buying power');
    });

    test('should place sell order correctly', async () => {
      // Arrange
      const mockOrderResponse = {
        id: 'order-789',
        symbol: 'BTCUSD',
        side: 'sell',
        qty: '0.05',
        order_type: 'market',
        status: 'pending_new'
      };
      mockAlpacaClient.createOrder.mockResolvedValue(mockOrderResponse);

      // Act
      const order: Order = await provider.placeSellOrder('BTCUSD', 0.05, 'MARKET');

      // Assert
      expect(order.id).toBe('order-789');
      expect(order.side).toBe('SELL');
      expect(order.quantity).toBe(0.05);
      expect(mockAlpacaClient.createOrder).toHaveBeenCalledWith({
        symbol: 'BTCUSD',
        qty: 0.05,
        side: 'sell',
        type: 'market',
        time_in_force: 'day'
      });
    });

    test('should get order status correctly', async () => {
      // Arrange
      const mockOrderData = {
        id: 'order-123',
        symbol: 'BTCUSD',
        side: 'buy',
        qty: '0.1',
        status: 'filled',
        filled_at: '2023-01-01T10:05:00Z',
        filled_avg_price: '45000.00'
      };
      mockAlpacaClient.getOrder.mockResolvedValue(mockOrderData);

      // Act
      const order: Order = await provider.getOrderStatus('order-123');

      // Assert
      expect(order.status).toBe('FILLED');
      expect(order.averagePrice).toBe(45000);
      expect(order.filledQuantity).toBeDefined();
    });

    test('should cancel order successfully', async () => {
      // Arrange
      mockAlpacaClient.cancelOrder.mockResolvedValue({ success: true });

      // Act
      const result = await provider.cancelOrder('order-123');

      // Assert
      expect(result.success).toBe(true);
      expect(mockAlpacaClient.cancelOrder).toHaveBeenCalledWith('order-123');
    });
  });

  describe('Position Management', () => {
    test('should get positions correctly', async () => {
      // Arrange
      const mockPositions = [
        {
          symbol: 'BTCUSD',
          qty: '0.5',
          market_value: '22500.00',
          avg_entry_price: '45000.00',
          unrealized_pl: '2500.00',
          side: 'long'
        },
        {
          symbol: 'ETHUSD',
          qty: '2.0',
          market_value: '4000.00',
          avg_entry_price: '2000.00',
          unrealized_pl: '0.00',
          side: 'long'
        }
      ];
      mockAlpacaClient.getPositions.mockResolvedValue(mockPositions);

      // Act
      const positions: Position[] = await provider.getPositions();

      // Assert
      expect(positions).toHaveLength(2);
      expect(positions[0].symbol).toBe('BTCUSD');
      expect(positions[0].quantity).toBe(0.5);
      expect(positions[0].currentPrice).toBeDefined();
      expect(positions[0].averagePrice).toBe(45000);
      expect(positions[0].unrealizedPnL).toBe(2500);
    });

    test('should close position correctly', async () => {
      // Arrange
      const mockCloseOrderResponse = {
        id: 'close-order-123',
        symbol: 'BTCUSD',
        side: 'sell',
        qty: '0.5',
        order_type: 'market',
        status: 'pending_new'
      };
      mockAlpacaClient.closePosition.mockResolvedValue(mockCloseOrderResponse);

      // Act
      const order: Order = await provider.closePosition('BTCUSD');

      // Assert
      expect(order.id).toBe('close-order-123');
      expect(order.side).toBe('SELL');
      expect(mockAlpacaClient.closePosition).toHaveBeenCalledWith('BTCUSD', undefined);
    });

    test('should close partial position with quantity', async () => {
      // Arrange
      const mockPartialCloseResponse = {
        id: 'partial-close-456',
        symbol: 'ETHUSD',
        side: 'sell',
        qty: '1.0',
        order_type: 'market',
        status: 'pending_new'
      };
      mockAlpacaClient.createOrder.mockResolvedValue(mockPartialCloseResponse);

      // Act
      const order: Order = await provider.closePosition('ETHUSD', 1.0);

      // Assert
      expect(order.quantity).toBe(1.0);
      expect(mockAlpacaClient.createOrder).toHaveBeenCalledWith({
        symbol: 'ETHUSD',
        qty: 1.0,
        side: 'sell',
        type: 'market',
        time_in_force: 'day'
      });
    });
  });

  describe('Market Status', () => {
    test('should check if market is open', async () => {
      // Arrange
      mockAlpacaClient.isMarketOpen.mockResolvedValue(true);

      // Act
      const isOpen = await provider.isMarketOpen();

      // Assert
      expect(isOpen).toBe(true);
      expect(mockAlpacaClient.isMarketOpen).toHaveBeenCalledTimes(1);
    });

    test('should check market status for specific symbol', async () => {
      // Arrange
      mockAlpacaClient.isMarketOpen.mockResolvedValue(false);

      // Act
      const isOpen = await provider.isMarketOpen('BTCUSD');

      // Assert
      expect(isOpen).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Arrange
      const apiError = new Error('API Error: Internal Server Error');
      mockAlpacaClient.getAccount.mockRejectedValue(apiError);

      // Act & Assert
      await expect(provider.getAccount()).rejects.toThrow('API Error: Internal Server Error');
    });

    test('should handle network timeouts', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      mockAlpacaClient.getAccount.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(provider.getAccount()).rejects.toThrow('Request timeout');
    });
  });

  describe('Configuration', () => {
    test('should use paper trading URL for paper mode', () => {
      // Act
      const paperProvider = new AlpacaTradingProvider({
        ...testConfig,
        apiConfig: {
          ...testConfig.apiConfig,
          paperTrading: true,
          baseUrl: 'https://paper-api.alpaca.markets'
        }
      });

      // Assert
      expect(paperProvider.getConfig().apiConfig.baseUrl).toBe('https://paper-api.alpaca.markets');
      expect(paperProvider.getConfig().apiConfig.paperTrading).toBe(true);
    });

    test('should use live trading URL for live mode', () => {
      // Act
      const liveProvider = new AlpacaTradingProvider({
        ...testConfig,
        apiConfig: {
          ...testConfig.apiConfig,
          paperTrading: false,
          baseUrl: 'https://api.alpaca.markets'
        }
      });

      // Assert
      expect(liveProvider.getConfig().apiConfig.baseUrl).toBe('https://api.alpaca.markets');
      expect(liveProvider.getConfig().apiConfig.paperTrading).toBe(false);
    });
  });
});