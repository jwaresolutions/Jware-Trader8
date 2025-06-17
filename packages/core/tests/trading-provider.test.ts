/**
 * Test file for trading provider interface
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import { MockTradingProvider } from '../src/mocks/mock-trading-provider';
import { ITradingProvider, TradingProviderConfig } from '../src/interfaces/trading';
import { Account, Order } from '@jware-trader8/types';

describe('ITradingProvider Interface Tests', () => {
  let mockProvider: ITradingProvider;
  let config: TradingProviderConfig;

  beforeEach(() => {
    config = {
      name: 'mock-provider',
      apiConfig: {
        apiKey: 'test-api-key',
        secretKey: 'test-secret-key',
        baseUrl: 'https://mock-api.com'
      },
      paperTrading: true,
      timeout: 5000
    };
    mockProvider = new MockTradingProvider(config);
  });

  afterEach(async () => {
    await mockProvider.disconnect();
  });

  test('should connect successfully with valid credentials', async () => {
    const result = await mockProvider.connect();
    
    expect(result.success).toBe(true);
    expect(result.accountInfo).toBeDefined();
    expect(result.accountInfo?.balance).toBeGreaterThan(0);
    expect(result.error).toBeUndefined();
  });

  test('should fail to connect with invalid credentials', async () => {
    const invalidConfig = {
      ...config,
      apiConfig: { ...config.apiConfig, apiKey: 'invalid' }
    };
    const invalidProvider = new MockTradingProvider(invalidConfig);
    
    const result = await invalidProvider.connect();
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.accountInfo).toBeUndefined();
  });

  test('should get account information after connection', async () => {
    await mockProvider.connect();
    const account = await mockProvider.getAccount();
    
    expect(account).toBeDefined();
    expect(account.id).toBeDefined();
    expect(typeof account.balance).toBe('number');
    expect(typeof account.buyingPower).toBe('number');
    expect(Array.isArray(account.positions)).toBe(true);
  });

  test('should throw error when getting account without connection', async () => {
    await expect(mockProvider.getAccount()).rejects.toThrow('Not connected');
  });

  test('should place buy order with sufficient balance', async () => {
    await mockProvider.connect();
    const order = await mockProvider.placeBuyOrder('BTCUSD', 0.1, 'MARKET');
    
    expect(order.id).toBeDefined();
    expect(order.symbol).toBe('BTCUSD');
    expect(order.side).toBe('BUY');
    expect(order.quantity).toBe(0.1);
    expect(order.type).toBe('MARKET');
    expect(order.status).toBe('FILLED'); // Market orders fill immediately in mock
    expect(order.timestamp).toBeInstanceOf(Date);
  });

  test('should place limit buy order', async () => {
    await mockProvider.connect();
    const order = await mockProvider.placeBuyOrder('ETHUSD', 1.0, 'LIMIT', 2800);
    
    expect(order.price).toBe(2800);
    expect(order.type).toBe('LIMIT');
    expect(order.status).toBe('PENDING'); // Limit orders start as pending
  });

  test('should reject buy order with insufficient buying power', async () => {
    await mockProvider.connect();
    
    // Set low balance for this test
    (mockProvider as any).setMockBalance(100, 50);
    
    await expect(
      mockProvider.placeBuyOrder('BTCUSD', 1.0, 'MARKET')
    ).rejects.toThrow('Insufficient buying power');
  });

  test('should place sell order with existing position', async () => {
    await mockProvider.connect();
    
    // First create a position by buying
    await mockProvider.placeBuyOrder('AAPL', 10, 'MARKET');
    
    // Then sell part of it
    const sellOrder = await mockProvider.placeSellOrder('AAPL', 5, 'MARKET');
    
    expect(sellOrder.symbol).toBe('AAPL');
    expect(sellOrder.side).toBe('SELL');
    expect(sellOrder.quantity).toBe(5);
    expect(sellOrder.status).toBe('FILLED');
  });

  test('should reject sell order without sufficient position', async () => {
    await mockProvider.connect();
    
    await expect(
      mockProvider.placeSellOrder('AAPL', 10, 'MARKET')
    ).rejects.toThrow('Insufficient position');
  });

  test('should get order status', async () => {
    await mockProvider.connect();
    const originalOrder = await mockProvider.placeBuyOrder('GOOGL', 1, 'LIMIT', 2700);
    
    const orderStatus = await mockProvider.getOrderStatus(originalOrder.id);
    
    expect(orderStatus.id).toBe(originalOrder.id);
    expect(orderStatus.symbol).toBe('GOOGL');
    expect(['PENDING', 'FILLED', 'CANCELLED']).toContain(orderStatus.status);
  });

  test('should throw error for non-existent order', async () => {
    await mockProvider.connect();
    
    await expect(
      mockProvider.getOrderStatus('non-existent-order')
    ).rejects.toThrow('Order non-existent-order not found');
  });

  test('should cancel pending order successfully', async () => {
    await mockProvider.connect();
    const order = await mockProvider.placeBuyOrder('TSLA', 1, 'LIMIT', 200);
    
    const cancelResult = await mockProvider.cancelOrder(order.id);
    
    expect(cancelResult.success).toBe(true);
    expect(cancelResult.orderId).toBe(order.id);
    expect(cancelResult.error).toBeUndefined();
  });

  test('should fail to cancel non-existent order', async () => {
    await mockProvider.connect();
    
    const cancelResult = await mockProvider.cancelOrder('non-existent');
    
    expect(cancelResult.success).toBe(false);
    expect(cancelResult.error).toBe('Order not found');
  });

  test('should get positions after trades', async () => {
    await mockProvider.connect();
    
    // Place some buy orders
    await mockProvider.placeBuyOrder('AAPL', 10, 'MARKET');
    await mockProvider.placeBuyOrder('GOOGL', 2, 'MARKET');
    
    const positions = await mockProvider.getPositions();
    
    expect(positions.length).toBe(2);
    expect(positions.find(p => p.symbol === 'AAPL')).toBeDefined();
    expect(positions.find(p => p.symbol === 'GOOGL')).toBeDefined();
  });

  test('should get orders with filtering', async () => {
    await mockProvider.connect();
    
    // Place various orders
    await mockProvider.placeBuyOrder('AAPL', 5, 'MARKET');
    await mockProvider.placeBuyOrder('GOOGL', 1, 'LIMIT', 2700);
    await mockProvider.placeBuyOrder('TSLA', 2, 'LIMIT', 200);
    
    // Get all orders
    const allOrders = await mockProvider.getOrders();
    expect(allOrders.length).toBe(3);
    
    // Get only filled orders
    const filledOrders = await mockProvider.getOrders({ status: 'FILLED' });
    expect(filledOrders.length).toBe(1);
    expect(filledOrders[0].symbol).toBe('AAPL');
    
    // Get GOOGL orders
    const googlOrders = await mockProvider.getOrders({ symbol: 'GOOGL' });
    expect(googlOrders.length).toBe(1);
    expect(googlOrders[0].symbol).toBe('GOOGL');
    
    // Get limited orders
    const limitedOrders = await mockProvider.getOrders({ limit: 2 });
    expect(limitedOrders.length).toBe(2);
  });

  test('should close position completely', async () => {
    await mockProvider.connect();
    
    // Create position
    await mockProvider.placeBuyOrder('SPY', 10, 'MARKET');
    
    // Close position
    const closeOrder = await mockProvider.closePosition('SPY');
    
    expect(closeOrder.side).toBe('SELL');
    expect(closeOrder.symbol).toBe('SPY');
    expect(closeOrder.quantity).toBe(10);
  });

  test('should close position partially', async () => {
    await mockProvider.connect();
    
    // Create position
    await mockProvider.placeBuyOrder('QQQ', 20, 'MARKET');
    
    // Close half position
    const closeOrder = await mockProvider.closePosition('QQQ', 10);
    
    expect(closeOrder.quantity).toBe(10);
    
    // Check remaining position
    const positions = await mockProvider.getPositions();
    const qqqPosition = positions.find(p => p.symbol === 'QQQ');
    expect(qqqPosition?.quantity).toBe(10);
  });

  test('should get current buying power', async () => {
    await mockProvider.connect();
    const buyingPower = await mockProvider.getBuyingPower();
    
    expect(typeof buyingPower).toBe('number');
    expect(buyingPower).toBeGreaterThan(0);
  });

  test('should check market open status', async () => {
    await mockProvider.connect();
    
    const isOpen = await mockProvider.isMarketOpen('AAPL');
    expect(typeof isOpen).toBe('boolean');
    
    const isCryptoOpen = await mockProvider.isMarketOpen('BTCUSD');
    expect(isCryptoOpen).toBe(true); // Crypto markets always open in mock
  });

  test('should disconnect successfully', async () => {
    await mockProvider.connect();
    await mockProvider.disconnect();
    
    // Should not be able to get account after disconnect
    await expect(mockProvider.getAccount()).rejects.toThrow('Not connected');
  });

  test('should update buying power after trades', async () => {
    await mockProvider.connect();
    
    const initialBuyingPower = await mockProvider.getBuyingPower();
    
    // Place a buy order
    await mockProvider.placeBuyOrder('AAPL', 10, 'MARKET');
    
    const updatedBuyingPower = await mockProvider.getBuyingPower();
    
    expect(updatedBuyingPower).toBeLessThan(initialBuyingPower);
  });

  test('should handle order execution lifecycle', async () => {
    await mockProvider.connect();
    
    // Place limit order
    const order = await mockProvider.placeBuyOrder('MSFT', 5, 'LIMIT', 300);
    expect(order.status).toBe('PENDING');
    
    // Check status multiple times (mock may randomly fill)
    let finalStatus = order.status;
    for (let i = 0; i < 5; i++) {
      const statusCheck = await mockProvider.getOrderStatus(order.id);
      finalStatus = statusCheck.status;
      if (finalStatus === 'FILLED') break;
    }
    
    expect(['PENDING', 'FILLED']).toContain(finalStatus);
  });
});