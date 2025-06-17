/**
 * Portfolio management for backtesting
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import { 
  IPortfolio, 
  PortfolioConfig, 
  PortfolioSnapshot, 
  Position, 
  Trade, 
  TradeExecutionContext 
} from '@jware-trader8/types';
import { Logger, generateId } from '@jware-trader8/utils';
import Decimal from 'decimal.js';

/**
 * Portfolio implementation for backtesting
 */
export class Portfolio implements IPortfolio {
  private config: PortfolioConfig;
  private cash: Decimal;
  private positions: Map<string, Position>;
  private tradeHistory: Trade[];
  private logger: Logger;
  private realizedPnL: Decimal;

  constructor(config: PortfolioConfig) {
    this.config = config;
    this.cash = new Decimal(config.initialCash);
    this.positions = new Map();
    this.tradeHistory = [];
    this.logger = new Logger({
      level: 'info',
      console: true,
      format: 'text'
    });
    this.realizedPnL = new Decimal(0);

    this.logger.info('Portfolio initialized', {
      initialCash: config.initialCash,
      commissionRate: config.commissionRate,
      maxPositionSize: config.maxPositionSize
    });
  }

  /**
   * Get current cash balance
   */
  getCash(): number {
    return this.cash.toNumber();
  }

  /**
   * Get current positions
   */
  getPositions(): Map<string, Position> {
    return new Map(this.positions);
  }

  /**
   * Get portfolio configuration
   */
  getConfig(): PortfolioConfig {
    return { ...this.config };
  }

  /**
   * Get total portfolio value
   */
  getTotalValue(currentPrices: Map<string, number>): number {
    let positionsValue = new Decimal(0);

    for (const [symbol, position] of this.positions) {
      const currentPrice = currentPrices.get(symbol);
      if (currentPrice !== undefined) {
        const positionValue = new Decimal(position.quantity).mul(currentPrice);
        positionsValue = positionsValue.add(positionValue);
      }
    }

    return this.cash.add(positionsValue).toNumber();
  }

  /**
   * Check if can buy given symbol/quantity
   */
  canBuy(symbol: string, price: number, quantity: number): boolean {
    const orderValue = new Decimal(price).mul(quantity);
    const commission = this.calculateCommission(orderValue);
    const totalCost = orderValue.add(commission);

    // Check if sufficient cash
    if (totalCost.gt(this.cash)) {
      return false;
    }

    // Check position sizing limits
    if (this.config.maxPositionSize) {
      const currentValue = this.getTotalValue(new Map([[symbol, price]]));
      const positionPercent = orderValue.div(currentValue);
      
      if (positionPercent.gt(this.config.maxPositionSize)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if has position in symbol
   */
  hasPosition(symbol: string): boolean {
    return this.positions.has(symbol);
  }

  /**
   * Open a new position
   */
  openPosition(symbol: string, price: number, quantity: number, timestamp: Date): Trade {
    if (!this.canBuy(symbol, price, quantity)) {
      throw new Error(`Cannot buy ${quantity} ${symbol} at ${price}: insufficient funds or position limits`);
    }

    const orderValue = new Decimal(price).mul(quantity);
    const commission = this.calculateCommission(orderValue);
    const totalCost = orderValue.add(commission);

    // Deduct cash
    this.cash = this.cash.sub(totalCost);

    // Create or update position
    if (this.positions.has(symbol)) {
      const existingPosition = this.positions.get(symbol)!;
      const existingValue = new Decimal(existingPosition.quantity).mul(existingPosition.averagePrice);
      const newValue = orderValue;
      const totalQuantity = new Decimal(existingPosition.quantity).add(quantity);
      const averagePrice = existingValue.add(newValue).div(totalQuantity);

      existingPosition.quantity = totalQuantity.toNumber();
      existingPosition.averagePrice = averagePrice.toNumber();
      existingPosition.updatedAt = timestamp;
    } else {
      const position: Position = {
        symbol,
        quantity,
        averagePrice: price,
        side: 'LONG',
        entryTime: timestamp,
        updatedAt: timestamp
      };
      this.positions.set(symbol, position);
    }

    // Create trade record
    const trade: Trade = {
      id: generateId(),
      symbol,
      side: 'BUY',
      quantity,
      entryPrice: price,
      entryTime: timestamp,
      commission: commission.toNumber(),
      status: 'OPEN'
    };

    this.tradeHistory.push(trade);

    this.logger.info('Position opened', {
      symbol,
      quantity,
      price,
      commission: commission.toNumber(),
      tradeId: trade.id
    });

    return trade;
  }

  /**
   * Close an existing position
   */
  closePosition(symbol: string, price: number, timestamp: Date): Trade {
    const position = this.positions.get(symbol);
    if (!position) {
      throw new Error(`No position found for symbol ${symbol}`);
    }

    const orderValue = new Decimal(position.quantity).mul(price);
    const commission = this.calculateCommission(orderValue);
    const proceeds = orderValue.sub(commission);

    // Add cash from sale
    this.cash = this.cash.add(proceeds);

    // Find corresponding buy trade
    const openTrade = this.tradeHistory
      .filter(t => t.symbol === symbol && t.status === 'OPEN')
      .pop();

    if (!openTrade) {
      throw new Error(`No open trade found for symbol ${symbol}`);
    }

    // Calculate P&L
    const entryValue = new Decimal(openTrade.quantity).mul(openTrade.entryPrice);
    const exitValue = new Decimal(position.quantity).mul(price);
    const totalCommissions = new Decimal(openTrade.commission).add(commission);
    const pnl = exitValue.sub(entryValue).sub(totalCommissions);

    // Update trade record
    openTrade.exitPrice = price;
    openTrade.exitTime = timestamp;
    openTrade.pnl = pnl.toNumber();
    openTrade.status = 'CLOSED';
    openTrade.commission = totalCommissions.toNumber();

    // Update realized P&L
    this.realizedPnL = this.realizedPnL.add(pnl);

    // Remove position
    this.positions.delete(symbol);

    this.logger.info('Position closed', {
      symbol,
      quantity: position.quantity,
      entryPrice: openTrade.entryPrice,
      exitPrice: price,
      pnl: pnl.toNumber(),
      tradeId: openTrade.id
    });

    return openTrade;
  }

  /**
   * Apply risk management rules
   */
  applyRiskManagement(currentPrices: Map<string, number>, timestamp: Date): Trade[] {
    const riskTrades: Trade[] = [];

    if (!this.config.riskManagement) {
      return riskTrades;
    }

    const { stopLossPercent, takeProfitPercent } = this.config.riskManagement;

    for (const [symbol, position] of this.positions) {
      const currentPrice = currentPrices.get(symbol);
      if (!currentPrice) continue;

      const entryPrice = new Decimal(position.averagePrice);
      const currentPriceDecimal = new Decimal(currentPrice);
      const priceChange = currentPriceDecimal.sub(entryPrice).div(entryPrice);

      let shouldClose = false;
      let reason = '';

      // Check stop loss
      if (stopLossPercent && priceChange.lte(-stopLossPercent)) {
        shouldClose = true;
        reason = 'Stop Loss';
      }

      // Check take profit
      if (takeProfitPercent && priceChange.gte(takeProfitPercent)) {
        shouldClose = true;
        reason = 'Take Profit';
      }

      if (shouldClose) {
        try {
          const trade = this.closePosition(symbol, currentPrice, timestamp);
          trade.exitReason = reason;
          riskTrades.push(trade);

          this.logger.info('Risk management triggered', {
            symbol,
            reason,
            entryPrice: position.averagePrice,
            exitPrice: currentPrice,
            changePercent: priceChange.mul(100).toFixed(2)
          });
        } catch (error) {
          this.logger.error('Failed to apply risk management', {
            symbol,
            reason,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return riskTrades;
  }

  /**
   * Get portfolio snapshot
   */
  getSnapshot(currentPrices: Map<string, number>, timestamp: Date): PortfolioSnapshot {
    const positions = Array.from(this.positions.values());
    const totalValue = this.getTotalValue(currentPrices);
    
    let unrealizedPnL = new Decimal(0);
    for (const [symbol, position] of this.positions) {
      const currentPrice = currentPrices.get(symbol);
      if (currentPrice) {
        const positionPnL = new Decimal(currentPrice)
          .sub(position.averagePrice)
          .mul(position.quantity);
        unrealizedPnL = unrealizedPnL.add(positionPnL);
      }
    }

    return {
      timestamp,
      cash: this.cash.toNumber(),
      positions,
      totalValue,
      unrealizedPnL: unrealizedPnL.toNumber(),
      realizedPnL: this.realizedPnL.toNumber()
    };
  }

  /**
   * Calculate commission for order value
   */
  private calculateCommission(orderValue: Decimal): Decimal {
    return orderValue.mul(this.config.commissionRate);
  }

  /**
   * Get trade history
   */
  getTradeHistory(): Trade[] {
    return [...this.tradeHistory];
  }

  /**
   * Get realized P&L
   */
  getRealizedPnL(): number {
    return this.realizedPnL.toNumber();
  }

  /**
   * Get unrealized P&L for current prices
   */
  getUnrealizedPnL(currentPrices: Map<string, number>): number {
    let unrealizedPnL = new Decimal(0);
    
    for (const [symbol, position] of this.positions) {
      const currentPrice = currentPrices.get(symbol);
      if (currentPrice) {
        const positionPnL = new Decimal(currentPrice)
          .sub(position.averagePrice)
          .mul(position.quantity);
        unrealizedPnL = unrealizedPnL.add(positionPnL);
      }
    }

    return unrealizedPnL.toNumber();
  }
}