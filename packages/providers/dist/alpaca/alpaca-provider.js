"use strict";
/**
 * Alpaca Trading Provider Implementation
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlpacaTradingProvider = void 0;
const utils_1 = require("@jware-trader8/utils");
// Import Alpaca SDK (will be mocked in tests)
const Alpaca = require('@alpacahq/alpaca-trade-api');
/**
 * Alpaca Trading Provider
 * Implements ITradingProvider for Alpaca Markets integration
 */
class AlpacaTradingProvider {
    alpacaClient;
    config;
    logger;
    isConnected = false;
    constructor(config) {
        this.config = config;
        this.logger = new utils_1.Logger({
            level: 'info',
            console: true,
            format: 'text'
        });
        // Initialize Alpaca client
        const alpacaConfig = config.apiConfig;
        this.alpacaClient = new Alpaca({
            key: alpacaConfig.apiKey,
            secret: alpacaConfig.secretKey,
            paper: alpacaConfig.paperTrading,
            usePolygon: false // We'll use Polygon separately
        });
    }
    /**
     * Connect to Alpaca and verify authentication
     */
    async connect() {
        try {
            // Test connection by fetching account info
            const accountData = await this.retryWithBackoff(() => this.alpacaClient.getAccount());
            const account = this.normalizeAccount(accountData);
            this.isConnected = true;
            this.logger.info('Successfully connected to Alpaca', {
                accountId: account.id,
                paperTrading: this.config.apiConfig.paperTrading
            });
            return {
                success: true,
                accountInfo: account
            };
        }
        catch (error) {
            this.isConnected = false;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to connect to Alpaca', { error: errorMessage });
            return {
                success: false,
                error: errorMessage
            };
        }
    }
    /**
     * Get current account information
     */
    async getAccount() {
        try {
            const accountData = await this.retryWithBackoff(() => this.alpacaClient.getAccount());
            return this.normalizeAccount(accountData);
        }
        catch (error) {
            this.logger.error('Failed to get account information', { error });
            throw error;
        }
    }
    /**
     * Place a buy order
     */
    async placeBuyOrder(symbol, quantity, orderType, price) {
        try {
            const orderParams = this.buildOrderParams(symbol, quantity, 'buy', orderType, price);
            const orderData = await this.retryWithBackoff(() => this.alpacaClient.createOrder(orderParams));
            const order = this.normalizeOrder(orderData);
            this.logger.info('Buy order placed', { orderId: order.id, symbol, quantity, orderType });
            return order;
        }
        catch (error) {
            this.logger.error('Failed to place buy order', { symbol, quantity, orderType, error });
            throw error;
        }
    }
    /**
     * Place a sell order
     */
    async placeSellOrder(symbol, quantity, orderType, price) {
        try {
            const orderParams = this.buildOrderParams(symbol, quantity, 'sell', orderType, price);
            const orderData = await this.retryWithBackoff(() => this.alpacaClient.createOrder(orderParams));
            const order = this.normalizeOrder(orderData);
            this.logger.info('Sell order placed', { orderId: order.id, symbol, quantity, orderType });
            return order;
        }
        catch (error) {
            this.logger.error('Failed to place sell order', { symbol, quantity, orderType, error });
            throw error;
        }
    }
    /**
     * Get order status
     */
    async getOrderStatus(orderId) {
        try {
            const orderData = await this.retryWithBackoff(() => this.alpacaClient.getOrder(orderId));
            return this.normalizeOrder(orderData);
        }
        catch (error) {
            this.logger.error('Failed to get order status', { orderId, error });
            throw error;
        }
    }
    /**
     * Cancel a pending order
     */
    async cancelOrder(orderId) {
        try {
            await this.retryWithBackoff(() => this.alpacaClient.cancelOrder(orderId));
            this.logger.info('Order cancelled', { orderId });
            return {
                success: true,
                orderId
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to cancel order', { orderId, error: errorMessage });
            return {
                success: false,
                orderId,
                error: errorMessage
            };
        }
    }
    /**
     * Get all current positions
     */
    async getPositions() {
        try {
            const positionsData = await this.retryWithBackoff(() => this.alpacaClient.getPositions());
            return positionsData.map((pos) => this.normalizePosition(pos));
        }
        catch (error) {
            this.logger.error('Failed to get positions', { error });
            throw error;
        }
    }
    /**
     * Get orders with optional filtering
     */
    async getOrders(filter) {
        try {
            const ordersData = await this.retryWithBackoff(() => this.alpacaClient.getOrders(filter));
            return ordersData.map((order) => this.normalizeOrder(order));
        }
        catch (error) {
            this.logger.error('Failed to get orders', { filter, error });
            throw error;
        }
    }
    /**
     * Close a position
     */
    async closePosition(symbol, quantity) {
        try {
            if (quantity) {
                // Partial close - create sell order
                return this.placeSellOrder(symbol, quantity, 'MARKET');
            }
            else {
                // Full close - use Alpaca's close position endpoint
                const orderData = await this.retryWithBackoff(() => this.alpacaClient.closePosition(symbol));
                const order = this.normalizeOrder(orderData);
                this.logger.info('Position closed', { symbol, orderId: order.id });
                return order;
            }
        }
        catch (error) {
            this.logger.error('Failed to close position', { symbol, quantity, error });
            throw error;
        }
    }
    /**
     * Get buying power available
     */
    async getBuyingPower() {
        try {
            const accountData = await this.retryWithBackoff(() => this.alpacaClient.getAccount());
            return parseFloat(accountData.buying_power);
        }
        catch (error) {
            this.logger.error('Failed to get buying power', { error });
            throw error;
        }
    }
    /**
     * Check if market is open
     */
    async isMarketOpen(symbol) {
        try {
            // Alpaca doesn't have symbol-specific market hours in their basic API
            // For crypto, markets are always open; for stocks, use Alpaca's market hours
            const isOpen = await this.retryWithBackoff(() => this.alpacaClient.isMarketOpen());
            return isOpen;
        }
        catch (error) {
            this.logger.error('Failed to check market status', { symbol, error });
            return false; // Assume closed on error
        }
    }
    /**
     * Disconnect from the provider
     */
    async disconnect() {
        this.isConnected = false;
        this.logger.info('Disconnected from Alpaca');
    }
    /**
     * Get provider configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Check if provider is connected
     */
    isProviderConnected() {
        return this.isConnected;
    }
    /**
     * Private helper methods
     */
    /**
     * Normalize Alpaca account data to standard Account interface
     */
    normalizeAccount(alpacaAccount) {
        return {
            id: alpacaAccount.id,
            balance: parseFloat(alpacaAccount.cash),
            buyingPower: parseFloat(alpacaAccount.buying_power),
            positions: [], // Will be populated separately if needed
            currency: 'USD',
            accountType: alpacaAccount.account_type || 'UNKNOWN',
            updatedAt: new Date()
        };
    }
    /**
     * Normalize Alpaca order data to standard Order interface
     */
    normalizeOrder(alpacaOrder) {
        return {
            id: alpacaOrder.id,
            symbol: alpacaOrder.symbol,
            side: alpacaOrder.side.toUpperCase(),
            quantity: parseFloat(alpacaOrder.qty),
            price: alpacaOrder.limit_price ? parseFloat(alpacaOrder.limit_price) : undefined,
            stopPrice: alpacaOrder.stop_price ? parseFloat(alpacaOrder.stop_price) : undefined,
            type: this.normalizeOrderType(alpacaOrder.order_type),
            status: this.normalizeOrderStatus(alpacaOrder.status),
            timestamp: new Date(alpacaOrder.created_at),
            filledQuantity: alpacaOrder.filled_qty ? parseFloat(alpacaOrder.filled_qty) : undefined,
            averagePrice: alpacaOrder.filled_avg_price ? parseFloat(alpacaOrder.filled_avg_price) : undefined,
            clientOrderId: alpacaOrder.client_order_id
        };
    }
    /**
     * Normalize Alpaca position data to standard Position interface
     */
    normalizePosition(alpacaPosition) {
        const quantity = parseFloat(alpacaPosition.qty);
        return {
            symbol: alpacaPosition.symbol,
            quantity: Math.abs(quantity),
            averagePrice: parseFloat(alpacaPosition.avg_entry_price),
            currentPrice: parseFloat(alpacaPosition.market_value) / Math.abs(quantity),
            side: quantity >= 0 ? 'LONG' : 'SHORT',
            unrealizedPnL: parseFloat(alpacaPosition.unrealized_pl),
            entryTime: new Date(), // Alpaca doesn't provide entry time in position data
            updatedAt: new Date()
        };
    }
    /**
     * Build order parameters for Alpaca API
     */
    buildOrderParams(symbol, quantity, side, orderType, price) {
        const params = {
            symbol,
            qty: quantity,
            side,
            type: orderType.toLowerCase(),
            time_in_force: 'day'
        };
        if (orderType === 'LIMIT' && price) {
            params.limit_price = price;
        }
        if (orderType === 'STOP' && price) {
            params.stop_price = price;
        }
        return params;
    }
    /**
     * Normalize Alpaca order type to standard OrderType
     */
    normalizeOrderType(alpacaOrderType) {
        switch (alpacaOrderType.toLowerCase()) {
            case 'market':
                return 'MARKET';
            case 'limit':
                return 'LIMIT';
            case 'stop':
                return 'STOP';
            case 'stop_limit':
                return 'STOP_LIMIT';
            default:
                return 'MARKET';
        }
    }
    /**
     * Normalize Alpaca order status to standard OrderStatus
     */
    normalizeOrderStatus(alpacaStatus) {
        switch (alpacaStatus.toLowerCase()) {
            case 'pending_new':
            case 'accepted':
            case 'new':
                return 'PENDING';
            case 'filled':
                return 'FILLED';
            case 'partially_filled':
                return 'PARTIALLY_FILLED';
            case 'cancelled':
                return 'CANCELLED';
            case 'rejected':
                return 'REJECTED';
            default:
                return 'PENDING';
        }
    }
    /**
     * Retry mechanism with exponential backoff for rate limiting
     */
    async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');
                // Check if it's a rate limiting error
                if (lastError.message.includes('rate limit') || lastError.message.includes('429')) {
                    if (attempt < maxRetries) {
                        const delay = baseDelay * Math.pow(2, attempt);
                        this.logger.warn(`Rate limited, retrying in ${delay}ms`, { attempt, maxRetries });
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                }
                // For non-rate-limit errors, don't retry
                if (attempt === 0 && !lastError.message.includes('rate limit')) {
                    throw lastError;
                }
                // If we've exhausted retries, throw the last error
                if (attempt === maxRetries) {
                    throw lastError;
                }
            }
        }
        throw lastError;
    }
}
exports.AlpacaTradingProvider = AlpacaTradingProvider;
