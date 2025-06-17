/**
 * Mock trading provider implementation for testing
 */

import {
  Account,
  Order,
  Position,
  ConnectionResult,
  CancelResult,
  OrderSide,
  OrderType,
  OrderStatus
} from '@jware-trader8/types';
import { ITradingProvider, TradingProviderConfig } from '../interfaces/trading';
import { generateUUID } from '@jware-trader8/utils';

/**
 * Mock trading provider for testing and development
 */
export class MockTradingProvider implements ITradingProvider {
  private isConnected = false;
  private mockAccount: Account;
  private mockOrders: Map<string, Order> = new Map();
  private mockPositions: Map<string, Position> = new Map();
  private config: TradingProviderConfig;

  constructor(config: TradingProviderConfig) {
    this.config = config;
    this.mockAccount = {
      id: 'mock-account-123',
      balance: 10000,
      buyingPower: 8000,
      positions: [],
      currency: 'USD',
      accountType: 'MARGIN',
      updatedAt: new Date()
    };
  }

  async connect(): Promise<ConnectionResult> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));

    if (this.config.apiConfig.apiKey === 'invalid') {
      return {
        success: false,
        error: 'Invalid API credentials'
      };
    }

    this.isConnected = true;
    return {
      success: true,
      accountInfo: this.mockAccount
    };
  }

  async getAccount(): Promise<Account> {
    if (!this.isConnected) {
      throw new Error('Not connected to trading provider');
    }

    // Update positions in account
    this.mockAccount.positions = Array.from(this.mockPositions.values());
    return { ...this.mockAccount };
  }

  async placeBuyOrder(
    symbol: string,
    quantity: number,
    orderType: OrderType,
    price?: number
  ): Promise<Order> {
    if (!this.isConnected) {
      throw new Error('Not connected to trading provider');
    }

    // Calculate order value for buying power check
    const orderPrice = price || this.getMockPrice(symbol);
    const orderValue = orderPrice * quantity;

    if (orderValue > this.mockAccount.buyingPower) {
      throw new Error('Insufficient buying power');
    }

    const order: Order = {
      id: generateUUID(),
      symbol,
      side: 'BUY',
      quantity,
      type: orderType,
      price: price,
      status: orderType === 'MARKET' ? 'FILLED' : 'PENDING',
      timestamp: new Date()
    };

    // For market orders, simulate immediate execution
    if (orderType === 'MARKET') {
      order.filledQuantity = quantity;
      order.averagePrice = orderPrice;
      order.commission = orderValue * 0.001; // 0.1% commission

      // Update buying power
      this.mockAccount.buyingPower -= orderValue + order.commission;

      // Create or update position
      this.updatePosition(symbol, quantity, orderPrice);
    }

    this.mockOrders.set(order.id, order);
    return order;
  }

  async placeSellOrder(
    symbol: string,
    quantity: number,
    orderType: OrderType,
    price?: number
  ): Promise<Order> {
    if (!this.isConnected) {
      throw new Error('Not connected to trading provider');
    }

    // Check if we have enough position to sell
    const position = this.mockPositions.get(symbol);
    if (!position || position.quantity < quantity) {
      throw new Error('Insufficient position to sell');
    }

    const orderPrice = price || this.getMockPrice(symbol);

    const order: Order = {
      id: generateUUID(),
      symbol,
      side: 'SELL',
      quantity,
      type: orderType,
      price: price,
      status: orderType === 'MARKET' ? 'FILLED' : 'PENDING',
      timestamp: new Date()
    };

    // For market orders, simulate immediate execution
    if (orderType === 'MARKET') {
      order.filledQuantity = quantity;
      order.averagePrice = orderPrice;
      order.commission = orderPrice * quantity * 0.001; // 0.1% commission

      // Update buying power
      this.mockAccount.buyingPower += orderPrice * quantity - order.commission;

      // Update position
      this.updatePosition(symbol, -quantity, orderPrice);
    }

    this.mockOrders.set(order.id, order);
    return order;
  }

  async getOrderStatus(orderId: string): Promise<Order> {
    const order = this.mockOrders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Simulate random order fills for pending orders
    if (order.status === 'PENDING' && Math.random() > 0.7) {
      order.status = 'FILLED';
      order.filledQuantity = order.quantity;
      order.averagePrice = order.price || this.getMockPrice(order.symbol);
      order.commission = (order.averagePrice * order.quantity) * 0.001;

      // Update account for filled orders
      if (order.side === 'BUY') {
        this.mockAccount.buyingPower -= (order.averagePrice * order.quantity) + order.commission;
        this.updatePosition(order.symbol, order.quantity, order.averagePrice);
      } else {
        this.mockAccount.buyingPower += (order.averagePrice * order.quantity) - order.commission;
        this.updatePosition(order.symbol, -order.quantity, order.averagePrice);
      }
    }

    return { ...order };
  }

  async cancelOrder(orderId: string): Promise<CancelResult> {
    const order = this.mockOrders.get(orderId);
    if (!order) {
      return {
        success: false,
        orderId,
        error: 'Order not found'
      };
    }

    if (order.status === 'FILLED') {
      return {
        success: false,
        orderId,
        error: 'Cannot cancel filled order'
      };
    }

    order.status = 'CANCELLED';
    this.mockOrders.set(orderId, order);

    return {
      success: true,
      orderId
    };
  }

  async getPositions(): Promise<Position[]> {
    return Array.from(this.mockPositions.values()).filter(p => p.quantity > 0);
  }

  async getOrders(filter?: {
    status?: string;
    symbol?: string;
    limit?: number;
  }): Promise<Order[]> {
    let orders = Array.from(this.mockOrders.values());

    if (filter?.status) {
      orders = orders.filter(o => o.status === filter.status);
    }

    if (filter?.symbol) {
      orders = orders.filter(o => o.symbol === filter.symbol);
    }

    if (filter?.limit) {
      orders = orders.slice(0, filter.limit);
    }

    return orders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async closePosition(symbol: string, quantity?: number): Promise<Order> {
    const position = this.mockPositions.get(symbol);
    if (!position) {
      throw new Error(`No position found for ${symbol}`);
    }

    const sellQuantity = quantity || position.quantity;
    return this.placeSellOrder(symbol, sellQuantity, 'MARKET');
  }

  async getBuyingPower(): Promise<number> {
    return this.mockAccount.buyingPower;
  }

  async isMarketOpen(symbol?: string): Promise<boolean> {
    // Mock market hours - always open for crypto, business hours for stocks
    if (symbol?.includes('USD') && (symbol.includes('BTC') || symbol.includes('ETH'))) {
      return true; // Crypto markets are always open
    }

    // Mock stock market hours (9:30 AM - 4:00 PM ET)
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Market hours (simplified)
    return hour >= 9 && hour < 16;
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.mockOrders.clear();
    this.mockPositions.clear();
  }

  /**
   * Get mock price for symbol (for testing)
   */
  private getMockPrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'BTCUSD': 50000,
      'ETHUSD': 3000,
      'AAPL': 150,
      'GOOGL': 2800,
      'TSLA': 250,
      'SPY': 400,
      'QQQ': 350
    };

    const basePrice = basePrices[symbol] || 100;
    // Add some random variation (±2%)
    const variation = (Math.random() - 0.5) * 0.04;
    return Math.round((basePrice * (1 + variation)) * 100) / 100;
  }

  /**
   * Update position for symbol
   */
  private updatePosition(symbol: string, quantity: number, price: number): void {
    const existingPosition = this.mockPositions.get(symbol);

    if (existingPosition) {
      const newQuantity = existingPosition.quantity + quantity;
      
      if (newQuantity <= 0) {
        // Close position
        this.mockPositions.delete(symbol);
      } else {
        // Update position with average price
        const totalCost = (existingPosition.averagePrice * existingPosition.quantity) + (price * quantity);
        const newAveragePrice = totalCost / newQuantity;

        existingPosition.quantity = newQuantity;
        existingPosition.averagePrice = newAveragePrice;
        existingPosition.currentPrice = price;
        existingPosition.updatedAt = new Date();
        
        this.mockPositions.set(symbol, existingPosition);
      }
    } else if (quantity > 0) {
      // Create new position
      const newPosition: Position = {
        symbol,
        quantity,
        averagePrice: price,
        currentPrice: price,
        side: 'LONG',
        entryTime: new Date(),
        updatedAt: new Date()
      };
      
      this.mockPositions.set(symbol, newPosition);
    }
  }

  /**
   * Simulate market price movements (for testing)
   */
  simulateMarketMovement(): void {
    for (const position of this.mockPositions.values()) {
      const currentPrice = this.getMockPrice(position.symbol);
      position.currentPrice = currentPrice;
      position.unrealizedPnL = (currentPrice - position.averagePrice) * position.quantity;
      position.updatedAt = new Date();
    }
  }

  /**
   * Set mock account balance (for testing)
   */
  setMockBalance(balance: number, buyingPower?: number): void {
    this.mockAccount.balance = balance;
    this.mockAccount.buyingPower = buyingPower || balance * 0.8;
  }

  /**
   * Add mock position (for testing)
   */
  addMockPosition(symbol: string, quantity: number, averagePrice: number): void {
    const position: Position = {
      symbol,
      quantity,
      averagePrice,
      currentPrice: averagePrice,
      side: 'LONG',
      entryTime: new Date(),
      updatedAt: new Date()
    };
    
    this.mockPositions.set(symbol, position);
  }
}