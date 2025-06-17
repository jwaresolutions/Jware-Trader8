"use strict";
/**
 * Portfolio management for backtesting
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Portfolio = void 0;
const utils_1 = require("@jware-trader8/utils");
const decimal_js_1 = __importDefault(require("decimal.js"));
/**
 * Portfolio implementation for backtesting
 */
class Portfolio {
    config;
    cash;
    positions;
    tradeHistory;
    logger;
    realizedPnL;
    constructor(config) {
        this.config = config;
        this.cash = new decimal_js_1.default(config.initialCash);
        this.positions = new Map();
        this.tradeHistory = [];
        this.logger = new utils_1.Logger({
            level: 'info',
            console: true,
            format: 'text'
        });
        this.realizedPnL = new decimal_js_1.default(0);
        this.logger.info('Portfolio initialized', {
            initialCash: config.initialCash,
            commissionRate: config.commissionRate,
            maxPositionSize: config.maxPositionSize
        });
    }
    /**
     * Get current cash balance
     */
    getCash() {
        return this.cash.toNumber();
    }
    /**
     * Get current positions
     */
    getPositions() {
        return new Map(this.positions);
    }
    /**
     * Get portfolio configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get total portfolio value
     */
    getTotalValue(currentPrices) {
        let positionsValue = new decimal_js_1.default(0);
        for (const [symbol, position] of this.positions) {
            const currentPrice = currentPrices.get(symbol);
            if (currentPrice !== undefined) {
                const positionValue = new decimal_js_1.default(position.quantity).mul(currentPrice);
                positionsValue = positionsValue.add(positionValue);
            }
        }
        return this.cash.add(positionsValue).toNumber();
    }
    /**
     * Check if can buy given symbol/quantity
     */
    canBuy(symbol, price, quantity) {
        const orderValue = new decimal_js_1.default(price).mul(quantity);
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
    hasPosition(symbol) {
        return this.positions.has(symbol);
    }
    /**
     * Open a new position
     */
    openPosition(symbol, price, quantity, timestamp) {
        if (!this.canBuy(symbol, price, quantity)) {
            throw new Error(`Cannot buy ${quantity} ${symbol} at ${price}: insufficient funds or position limits`);
        }
        const orderValue = new decimal_js_1.default(price).mul(quantity);
        const commission = this.calculateCommission(orderValue);
        const totalCost = orderValue.add(commission);
        // Deduct cash
        this.cash = this.cash.sub(totalCost);
        // Create or update position
        if (this.positions.has(symbol)) {
            const existingPosition = this.positions.get(symbol);
            const existingValue = new decimal_js_1.default(existingPosition.quantity).mul(existingPosition.averagePrice);
            const newValue = orderValue;
            const totalQuantity = new decimal_js_1.default(existingPosition.quantity).add(quantity);
            const averagePrice = existingValue.add(newValue).div(totalQuantity);
            existingPosition.quantity = totalQuantity.toNumber();
            existingPosition.averagePrice = averagePrice.toNumber();
            existingPosition.updatedAt = timestamp;
        }
        else {
            const position = {
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
        const trade = {
            id: (0, utils_1.generateId)(),
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
    closePosition(symbol, price, timestamp) {
        const position = this.positions.get(symbol);
        if (!position) {
            throw new Error(`No position found for symbol ${symbol}`);
        }
        const orderValue = new decimal_js_1.default(position.quantity).mul(price);
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
        const entryValue = new decimal_js_1.default(openTrade.quantity).mul(openTrade.entryPrice);
        const exitValue = new decimal_js_1.default(position.quantity).mul(price);
        const totalCommissions = new decimal_js_1.default(openTrade.commission).add(commission);
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
    applyRiskManagement(currentPrices, timestamp) {
        const riskTrades = [];
        if (!this.config.riskManagement) {
            return riskTrades;
        }
        const { stopLossPercent, takeProfitPercent } = this.config.riskManagement;
        for (const [symbol, position] of this.positions) {
            const currentPrice = currentPrices.get(symbol);
            if (!currentPrice)
                continue;
            const entryPrice = new decimal_js_1.default(position.averagePrice);
            const currentPriceDecimal = new decimal_js_1.default(currentPrice);
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
                }
                catch (error) {
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
    getSnapshot(currentPrices, timestamp) {
        const positions = Array.from(this.positions.values());
        const totalValue = this.getTotalValue(currentPrices);
        let unrealizedPnL = new decimal_js_1.default(0);
        for (const [symbol, position] of this.positions) {
            const currentPrice = currentPrices.get(symbol);
            if (currentPrice) {
                const positionPnL = new decimal_js_1.default(currentPrice)
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
    calculateCommission(orderValue) {
        return orderValue.mul(this.config.commissionRate);
    }
    /**
     * Get trade history
     */
    getTradeHistory() {
        return [...this.tradeHistory];
    }
    /**
     * Get realized P&L
     */
    getRealizedPnL() {
        return this.realizedPnL.toNumber();
    }
    /**
     * Get unrealized P&L for current prices
     */
    getUnrealizedPnL(currentPrices) {
        let unrealizedPnL = new decimal_js_1.default(0);
        for (const [symbol, position] of this.positions) {
            const currentPrice = currentPrices.get(symbol);
            if (currentPrice) {
                const positionPnL = new decimal_js_1.default(currentPrice)
                    .sub(position.averagePrice)
                    .mul(position.quantity);
                unrealizedPnL = unrealizedPnL.add(positionPnL);
            }
        }
        return unrealizedPnL.toNumber();
    }
}
exports.Portfolio = Portfolio;
