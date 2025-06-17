/**
 * Test file for market data interfaces
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import {
  OHLCV,
  Quote,
  SymbolInfo,
  MarketHours,
  MarketDataRequest,
  MarketDataResponse,
  MarketDataSubscription,
  MarketDataEvent,
  Timeframe
} from '../src/data';

describe('Data Types', () => {
  test('should validate OHLCV interface structure', () => {
    const ohlcv: OHLCV = {
      timestamp: new Date('2023-01-01T12:00:00Z'),
      open: 50000,
      high: 52000,
      low: 49000,
      close: 51000,
      volume: 1000
    };

    expect(ohlcv.timestamp).toBeInstanceOf(Date);
    expect(typeof ohlcv.open).toBe('number');
    expect(typeof ohlcv.high).toBe('number');
    expect(typeof ohlcv.low).toBe('number');
    expect(typeof ohlcv.close).toBe('number');
    expect(typeof ohlcv.volume).toBe('number');
    expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.open);
    expect(ohlcv.high).toBeGreaterThanOrEqual(ohlcv.close);
    expect(ohlcv.low).toBeLessThanOrEqual(ohlcv.open);
    expect(ohlcv.low).toBeLessThanOrEqual(ohlcv.close);
  });

  test('should validate OHLCV with optional fields', () => {
    const ohlcvWithOptionals: OHLCV = {
      timestamp: new Date(),
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: 50000,
      vwap: 101.5,
      tradeCount: 250
    };

    expect(ohlcvWithOptionals.vwap).toBe(101.5);
    expect(ohlcvWithOptionals.tradeCount).toBe(250);
  });

  test('should validate Quote interface structure', () => {
    const quote: Quote = {
      symbol: 'BTCUSD',
      bid: 49900,
      ask: 50100,
      last: 50000,
      timestamp: new Date()
    };

    expect(quote.symbol).toBe('BTCUSD');
    expect(typeof quote.bid).toBe('number');
    expect(typeof quote.ask).toBe('number');
    expect(typeof quote.last).toBe('number');
    expect(quote.timestamp).toBeInstanceOf(Date);
    expect(quote.ask).toBeGreaterThan(quote.bid);
  });

  test('should validate Quote with optional fields', () => {
    const quoteWithOptionals: Quote = {
      symbol: 'ETHUSD',
      bid: 2990,
      ask: 3010,
      last: 3000,
      bidSize: 5.5,
      askSize: 8.2,
      lastSize: 1.0,
      timestamp: new Date(),
      spread: 20
    };

    expect(quoteWithOptionals.bidSize).toBe(5.5);
    expect(quoteWithOptionals.askSize).toBe(8.2);
    expect(quoteWithOptionals.lastSize).toBe(1.0);
    expect(quoteWithOptionals.spread).toBe(20);
  });

  test('should validate SymbolInfo interface', () => {
    const symbolInfo: SymbolInfo = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      tickSize: 0.01,
      minQuantity: 1,
      tradeable: true
    };

    expect(symbolInfo.symbol).toBe('AAPL');
    expect(symbolInfo.name).toBe('Apple Inc.');
    expect(symbolInfo.type).toMatch(/^(STOCK|CRYPTO|FOREX|COMMODITY|INDEX)$/);
    expect(symbolInfo.tradeable).toBe(true);
    expect(symbolInfo.tickSize).toBeGreaterThan(0);
    expect(symbolInfo.minQuantity).toBeGreaterThan(0);
  });

  test('should validate MarketHours interface', () => {
    const marketHours: MarketHours = {
      open: '09:30',
      close: '16:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
      timezone: 'America/New_York'
    };

    expect(marketHours.open).toBe('09:30');
    expect(marketHours.close).toBe('16:00');
    expect(Array.isArray(marketHours.daysOfWeek)).toBe(true);
    expect(marketHours.daysOfWeek).toHaveLength(5);
    expect(marketHours.timezone).toBe('America/New_York');
  });

  test('should validate MarketDataRequest interface', () => {
    const request: MarketDataRequest = {
      symbol: 'BTCUSD',
      timeframe: '1h',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-31')
    };

    expect(request.symbol).toBe('BTCUSD');
    expect(request.timeframe).toMatch(/^(1m|5m|15m|1h|4h|1d|1w|1M)$/);
    expect(request.startDate).toBeInstanceOf(Date);
    expect(request.endDate).toBeInstanceOf(Date);
    expect(request.endDate.getTime()).toBeGreaterThan(request.startDate.getTime());
  });

  test('should validate MarketDataRequest with optional fields', () => {
    const requestWithOptionals: MarketDataRequest = {
      symbol: 'ETHUSD',
      timeframe: '5m',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-07'),
      limit: 1000,
      includeExtendedHours: true
    };

    expect(requestWithOptionals.limit).toBe(1000);
    expect(requestWithOptionals.includeExtendedHours).toBe(true);
  });

  test('should validate MarketDataResponse interface', () => {
    const response: MarketDataResponse = {
      symbol: 'BTCUSD',
      timeframe: '1d',
      data: [
        {
          timestamp: new Date('2023-01-01'),
          open: 50000,
          high: 52000,
          low: 49000,
          close: 51000,
          volume: 1000
        }
      ],
      metadata: {
        count: 1,
        source: 'polygon',
        requestTime: new Date()
      }
    };

    expect(response.symbol).toBe('BTCUSD');
    expect(response.timeframe).toBe('1d');
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data).toHaveLength(1);
    expect(response.metadata.count).toBe(1);
    expect(response.metadata.source).toBe('polygon');
    expect(response.metadata.requestTime).toBeInstanceOf(Date);
  });

  test('should validate MarketDataSubscription interface', () => {
    const subscription: MarketDataSubscription = {
      id: 'sub-123',
      symbols: ['BTCUSD', 'ETHUSD'],
      dataTypes: ['quotes', 'trades'],
      status: 'ACTIVE',
      timestamp: new Date()
    };

    expect(subscription.id).toBe('sub-123');
    expect(Array.isArray(subscription.symbols)).toBe(true);
    expect(subscription.symbols).toContain('BTCUSD');
    expect(subscription.symbols).toContain('ETHUSD');
    expect(Array.isArray(subscription.dataTypes)).toBe(true);
    expect(subscription.status).toMatch(/^(ACTIVE|INACTIVE|ERROR)$/);
    expect(subscription.timestamp).toBeInstanceOf(Date);
  });

  test('should validate MarketDataEvent interface', () => {
    const quoteEvent: MarketDataEvent = {
      type: 'QUOTE',
      symbol: 'BTCUSD',
      data: {
        symbol: 'BTCUSD',
        bid: 49900,
        ask: 50100,
        last: 50000,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    expect(quoteEvent.type).toBe('QUOTE');
    expect(quoteEvent.symbol).toBe('BTCUSD');
    expect(quoteEvent.data).toBeDefined();
    expect(quoteEvent.timestamp).toBeInstanceOf(Date);
  });

  test('should validate Timeframe enum values', () => {
    const validTimeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];
    
    validTimeframes.forEach(timeframe => {
      expect(timeframe).toMatch(/^(1m|5m|15m|1h|4h|1d|1w|1M)$/);
    });
  });

  test('should validate symbol types', () => {
    const stockSymbol: SymbolInfo = {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'STOCK',
      exchange: 'NASDAQ',
      currency: 'USD',
      tickSize: 0.01,
      minQuantity: 1,
      tradeable: true
    };

    const cryptoSymbol: SymbolInfo = {
      symbol: 'BTCUSD',
      name: 'Bitcoin',
      type: 'CRYPTO',
      exchange: 'COINBASE',
      currency: 'USD',
      tickSize: 0.01,
      minQuantity: 0.001,
      tradeable: true
    };

    expect(stockSymbol.type).toBe('STOCK');
    expect(cryptoSymbol.type).toBe('CRYPTO');
    expect(cryptoSymbol.minQuantity).toBeLessThan(stockSymbol.minQuantity);
  });

  test('should validate market data event types', () => {
    const eventTypes = ['QUOTE', 'TRADE', 'BAR'];
    
    eventTypes.forEach(type => {
      expect(type).toMatch(/^(QUOTE|TRADE|BAR)$/);
    });
  });
});