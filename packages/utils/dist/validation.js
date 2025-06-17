"use strict";
/**
 * Input validation and sanitization utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineValidationResults = exports.validateApiKey = exports.sanitizeNumber = exports.sanitizeString = exports.validateStrategyConfig = exports.validateDateRange = exports.validateOrderType = exports.validateOrderSide = exports.validatePercentage = exports.validatePrice = exports.validateQuantity = exports.validateSymbol = void 0;
/**
 * Validate trading symbol format
 */
function validateSymbol(symbol) {
    const errors = [];
    if (!symbol || typeof symbol !== 'string') {
        errors.push({
            field: 'symbol',
            message: 'Symbol must be a non-empty string',
            code: 'INVALID_TYPE',
            value: symbol
        });
        return { isValid: false, errors };
    }
    const trimmedSymbol = symbol.trim().toUpperCase();
    if (trimmedSymbol.length < 2 || trimmedSymbol.length > 12) {
        errors.push({
            field: 'symbol',
            message: 'Symbol must be between 2 and 12 characters',
            code: 'INVALID_LENGTH',
            value: symbol
        });
    }
    // Allow alphanumeric characters and common separators
    const symbolPattern = /^[A-Z0-9/.-]+$/;
    if (!symbolPattern.test(trimmedSymbol)) {
        errors.push({
            field: 'symbol',
            message: 'Symbol contains invalid characters',
            code: 'INVALID_FORMAT',
            value: symbol
        });
    }
    return { isValid: errors.length === 0, errors };
}
exports.validateSymbol = validateSymbol;
/**
 * Validate order quantity
 */
function validateQuantity(quantity, minQuantity = 0.001) {
    const errors = [];
    if (typeof quantity !== 'number' || !isFinite(quantity)) {
        errors.push({
            field: 'quantity',
            message: 'Quantity must be a finite number',
            code: 'INVALID_TYPE',
            value: quantity
        });
        return { isValid: false, errors };
    }
    if (quantity <= 0) {
        errors.push({
            field: 'quantity',
            message: 'Quantity must be positive',
            code: 'INVALID_RANGE',
            value: quantity
        });
    }
    if (quantity < minQuantity) {
        errors.push({
            field: 'quantity',
            message: `Quantity must be at least ${minQuantity}`,
            code: 'BELOW_MINIMUM',
            value: quantity
        });
    }
    return { isValid: errors.length === 0, errors };
}
exports.validateQuantity = validateQuantity;
/**
 * Validate price value
 */
function validatePrice(price, allowZero = false) {
    const errors = [];
    if (typeof price !== 'number' || !isFinite(price)) {
        errors.push({
            field: 'price',
            message: 'Price must be a finite number',
            code: 'INVALID_TYPE',
            value: price
        });
        return { isValid: false, errors };
    }
    if (!allowZero && price <= 0) {
        errors.push({
            field: 'price',
            message: 'Price must be positive',
            code: 'INVALID_RANGE',
            value: price
        });
    }
    else if (allowZero && price < 0) {
        errors.push({
            field: 'price',
            message: 'Price cannot be negative',
            code: 'INVALID_RANGE',
            value: price
        });
    }
    return { isValid: errors.length === 0, errors };
}
exports.validatePrice = validatePrice;
/**
 * Validate percentage value (0-1 or 0-100)
 */
function validatePercentage(percentage, asDecimal = true) {
    const errors = [];
    const maxValue = asDecimal ? 1 : 100;
    if (typeof percentage !== 'number' || !isFinite(percentage)) {
        errors.push({
            field: 'percentage',
            message: 'Percentage must be a finite number',
            code: 'INVALID_TYPE',
            value: percentage
        });
        return { isValid: false, errors };
    }
    if (percentage < 0 || percentage > maxValue) {
        errors.push({
            field: 'percentage',
            message: `Percentage must be between 0 and ${maxValue}`,
            code: 'INVALID_RANGE',
            value: percentage
        });
    }
    return { isValid: errors.length === 0, errors };
}
exports.validatePercentage = validatePercentage;
/**
 * Validate order side
 */
function validateOrderSide(side) {
    const errors = [];
    const validSides = ['BUY', 'SELL'];
    if (!validSides.includes(side)) {
        errors.push({
            field: 'side',
            message: `Order side must be one of: ${validSides.join(', ')}`,
            code: 'INVALID_VALUE',
            value: side
        });
    }
    return { isValid: errors.length === 0, errors };
}
exports.validateOrderSide = validateOrderSide;
/**
 * Validate order type
 */
function validateOrderType(type) {
    const errors = [];
    const validTypes = ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'];
    if (!validTypes.includes(type)) {
        errors.push({
            field: 'type',
            message: `Order type must be one of: ${validTypes.join(', ')}`,
            code: 'INVALID_VALUE',
            value: type
        });
    }
    return { isValid: errors.length === 0, errors };
}
exports.validateOrderType = validateOrderType;
/**
 * Validate date range
 */
function validateDateRange(startDate, endDate) {
    const errors = [];
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        errors.push({
            field: 'startDate',
            message: 'Start date must be a valid Date object',
            code: 'INVALID_TYPE',
            value: startDate
        });
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        errors.push({
            field: 'endDate',
            message: 'End date must be a valid Date object',
            code: 'INVALID_TYPE',
            value: endDate
        });
    }
    if (errors.length === 0 && startDate >= endDate) {
        errors.push({
            field: 'dateRange',
            message: 'Start date must be before end date',
            code: 'INVALID_RANGE',
            value: { startDate, endDate }
        });
    }
    if (errors.length === 0 && endDate > new Date()) {
        errors.push({
            field: 'endDate',
            message: 'End date cannot be in the future',
            code: 'INVALID_RANGE',
            value: endDate
        });
    }
    return { isValid: errors.length === 0, errors };
}
exports.validateDateRange = validateDateRange;
/**
 * Validate strategy configuration
 */
function validateStrategyConfig(config) {
    const errors = [];
    if (!config || typeof config !== 'object') {
        errors.push({
            field: 'config',
            message: 'Strategy configuration must be an object',
            code: 'INVALID_TYPE',
            value: config
        });
        return { isValid: false, errors };
    }
    // Validate required fields
    if (!config.name || typeof config.name !== 'string') {
        errors.push({
            field: 'name',
            message: 'Strategy name is required and must be a string',
            code: 'REQUIRED_FIELD',
            value: config.name
        });
    }
    if (!config.parameters || typeof config.parameters !== 'object') {
        errors.push({
            field: 'parameters',
            message: 'Strategy parameters are required and must be an object',
            code: 'REQUIRED_FIELD',
            value: config.parameters
        });
    }
    else {
        // Validate symbol in parameters
        if (config.parameters.symbol) {
            const symbolValidation = validateSymbol(config.parameters.symbol);
            errors.push(...symbolValidation.errors.map(error => ({
                ...error,
                field: `parameters.${error.field}`
            })));
        }
        // Validate position size
        if (config.parameters.positionSize !== undefined) {
            const positionSizeValidation = validatePercentage(config.parameters.positionSize, true);
            errors.push(...positionSizeValidation.errors.map(error => ({
                ...error,
                field: `parameters.${error.field}`
            })));
        }
    }
    if (!Array.isArray(config.indicators)) {
        errors.push({
            field: 'indicators',
            message: 'Indicators must be an array',
            code: 'INVALID_TYPE',
            value: config.indicators
        });
    }
    if (!config.signals || typeof config.signals !== 'object') {
        errors.push({
            field: 'signals',
            message: 'Signals configuration is required and must be an object',
            code: 'REQUIRED_FIELD',
            value: config.signals
        });
    }
    else {
        if (!Array.isArray(config.signals.buy)) {
            errors.push({
                field: 'signals.buy',
                message: 'Buy signals must be an array',
                code: 'INVALID_TYPE',
                value: config.signals.buy
            });
        }
        if (!Array.isArray(config.signals.sell)) {
            errors.push({
                field: 'signals.sell',
                message: 'Sell signals must be an array',
                code: 'INVALID_TYPE',
                value: config.signals.sell
            });
        }
    }
    return { isValid: errors.length === 0, errors };
}
exports.validateStrategyConfig = validateStrategyConfig;
/**
 * Sanitize string input by trimming and removing potentially harmful characters
 */
function sanitizeString(input) {
    if (typeof input !== 'string') {
        return '';
    }
    return input
        .trim()
        .replace(/[<>'"&]/g, '') // Remove potentially harmful characters
        .substring(0, 1000); // Limit length
}
exports.sanitizeString = sanitizeString;
/**
 * Sanitize number input with bounds checking
 */
function sanitizeNumber(input, min = -Infinity, max = Infinity, defaultValue = 0) {
    const num = Number(input);
    if (!isFinite(num)) {
        return defaultValue;
    }
    return Math.min(Math.max(num, min), max);
}
exports.sanitizeNumber = sanitizeNumber;
/**
 * Validate API key format
 */
function validateApiKey(apiKey) {
    const errors = [];
    if (!apiKey || typeof apiKey !== 'string') {
        errors.push({
            field: 'apiKey',
            message: 'API key must be a non-empty string',
            code: 'INVALID_TYPE',
            value: apiKey
        });
        return { isValid: false, errors };
    }
    const trimmedKey = apiKey.trim();
    if (trimmedKey.length < 10) {
        errors.push({
            field: 'apiKey',
            message: 'API key appears to be too short',
            code: 'INVALID_LENGTH',
            value: apiKey
        });
    }
    if (trimmedKey.length > 200) {
        errors.push({
            field: 'apiKey',
            message: 'API key appears to be too long',
            code: 'INVALID_LENGTH',
            value: apiKey
        });
    }
    return { isValid: errors.length === 0, errors };
}
exports.validateApiKey = validateApiKey;
/**
 * Create a combined validation result from multiple results
 */
function combineValidationResults(...results) {
    const allErrors = results.flatMap(result => result.errors);
    return {
        isValid: allErrors.length === 0,
        errors: allErrors
    };
}
exports.combineValidationResults = combineValidationResults;
