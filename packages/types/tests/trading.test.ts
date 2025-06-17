/**
 * Test file for trading interfaces
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import {
  Account,
  Order,
  Position,
  Trade,
  OrderSide,
  OrderType,
  OrderStatus,
  PositionSide,
  ConnectionResult,
  CancelResult
} from '../src/trading';

describe('Trading Types', () => {
  test('should validate Account interface structure', () => {
    const account: Account = {
      id: 'test-account',
      balance: 10000,
      buyingPower: 8000,
      positions: []
    };
    
    expect(account).toBeDefined();
    expect(typeof account.balance).toBe('number');
    expect(Array.isArray(account.positions)).toBe(true);
    expect(account.id).toBe('test-account');
    expect(account.balance).toBe(10000);
    expect(account.buyingPower).toBe(8000);
  });
  
  test('should validate Order interface with all required fields', () => {
    const order: Order = {
      id: 'order-123',
      symbol: 'BTCUSD',
      side: 'BUY',
      quantity: 0.1,
      price: 50000,
      type: 'LIMIT',
      status: 'PENDING',
      timestamp: new Date()
    };
    
    expect(order.side).toMatch(/^(BUY|SELL)$/);
    expect(order.status).toMatch(/^(PENDING|FILLED|PARTIALLY_FILLED|CANCELLED|REJECTED)$/);
    expect(order.type).toMatch(/^(MARKET|LIMIT|STOP|STOP_LIMIT)$/);
    expect(typeof order.quantity).toBe('number');
    expect(typeof order.price).toBe('number');
    expect(order.timestamp).toBeInstanceOf(Date);
  });

  test('should validate Position interface structure', () => {
    const position: Position = {
      symbol: 'BTCUSD',
      quantity: 0.5,
      averagePrice: 50000,
      side: 'LONG',
      entryTime: new Date()
    };

    expect(position.symbol).toBe('BTCUSD');
    expect(typeof position.quantity).toBe('number');
    expect(typeof position.averagePrice).toBe('number');
    expect(position.side).toMatch(/^(LONG|SHORT)$/);
    expect(position.entryTime).toBeInstanceOf(Date);
  });

  test('should validate Trade interface with complete trade cycle', () => {
    const trade: Trade = {
      id: 'trade-456',
      symbol: 'ETHUSD',
      side: 'BUY',
      quantity: 1.0,
      entryPrice: 3000,
      exitPrice: 3200,
      entryTime: new Date('2023-01-01'),
      exitTime: new Date('2023-01-02'),
      pnl: 200,
      commission: 5,
      status: 'CLOSED'
    };

    expect(trade.id).toBe('trade-456');
    expect(trade.pnl).toBe(200);
    expect(trade.commission).toBe(5);
    expect(trade.status).toMatch(/^(OPEN|CLOSED)$/);
    expect(trade.exitPrice).toBeGreaterThan(trade.entryPrice);
  });

  test('should validate ConnectionResult interface', () => {
    const successResult: ConnectionResult = {
      success: true,
      accountInfo: {
        id: 'acc-123',
        balance: 5000,
        buyingPower: 4000,
        positions: []
      }
    };

    const errorResult: ConnectionResult = {
      success: false,
      error: 'Invalid credentials'
    };

    expect(successResult.success).toBe(true);
    expect(successResult.accountInfo).toBeDefined();
    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBe('Invalid credentials');
  });

  test('should validate CancelResult interface', () => {
    const cancelResult: CancelResult = {
      success: true,
      orderId: 'order-789'
    };

    expect(cancelResult.success).toBe(true);
    expect(cancelResult.orderId).toBe('order-789');
  });

  test('should validate order side enum values', () => {
    const buySide: OrderSide = 'BUY';
    const sellSide: OrderSide = 'SELL';

    expect(buySide).toBe('BUY');
    expect(sellSide).toBe('SELL');
  });

  test('should validate order type enum values', () => {
    const marketOrder: OrderType = 'MARKET';
    const limitOrder: OrderType = 'LIMIT';
    const stopOrder: OrderType = 'STOP';
    const stopLimitOrder: OrderType = 'STOP_LIMIT';

    expect(marketOrder).toBe('MARKET');
    expect(limitOrder).toBe('LIMIT');
    expect(stopOrder).toBe('STOP');
    expect(stopLimitOrder).toBe('STOP_LIMIT');
  });

  test('should validate order status enum values', () => {
    const pendingStatus: OrderStatus = 'PENDING';
    const filledStatus: OrderStatus = 'FILLED';
    const partiallyFilledStatus: OrderStatus = 'PARTIALLY_FILLED';
    const cancelledStatus: OrderStatus = 'CANCELLED';
    const rejectedStatus: OrderStatus = 'REJECTED';

    expect(pendingStatus).toBe('PENDING');
    expect(filledStatus).toBe('FILLED');
    expect(partiallyFilledStatus).toBe('PARTIALLY_FILLED');
    expect(cancelledStatus).toBe('CANCELLED');
    expect(rejectedStatus).toBe('REJECTED');
  });

  test('should validate position side enum values', () => {
    const longPosition: PositionSide = 'LONG';
    const shortPosition: PositionSide = 'SHORT';

    expect(longPosition).toBe('LONG');
    expect(shortPosition).toBe('SHORT');
  });

  test('should handle optional fields in Account interface', () => {
    const accountWithOptionals: Account = {
      id: 'test-account-2',
      balance: 15000,
      buyingPower: 12000,
      positions: [],
      currency: 'USD',
      accountType: 'MARGIN',
      updatedAt: new Date()
    };

    expect(accountWithOptionals.currency).toBe('USD');
    expect(accountWithOptionals.accountType).toBe('MARGIN');
    expect(accountWithOptionals.updatedAt).toBeInstanceOf(Date);
  });

  test('should handle optional fields in Order interface', () => {
    const orderWithOptionals: Order = {
      id: 'order-with-opts',
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 100,
      type: 'LIMIT',
      price: 150,
      status: 'FILLED',
      timestamp: new Date(),
      filledQuantity: 100,
      averagePrice: 149.95,
      commission: 1.00,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      clientOrderId: 'client-123'
    };

    expect(orderWithOptionals.filledQuantity).toBe(100);
    expect(orderWithOptionals.averagePrice).toBe(149.95);
    expect(orderWithOptionals.commission).toBe(1.00);
    expect(orderWithOptionals.expiresAt).toBeInstanceOf(Date);
    expect(orderWithOptionals.clientOrderId).toBe('client-123');
  });
});