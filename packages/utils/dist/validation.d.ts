/**
 * Input validation and sanitization utilities
 */
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
/**
 * Validate trading symbol format
 */
export declare function validateSymbol(symbol: string): ValidationResult;
/**
 * Validate order quantity
 */
export declare function validateQuantity(quantity: number, minQuantity?: number): ValidationResult;
/**
 * Validate price value
 */
export declare function validatePrice(price: number, allowZero?: boolean): ValidationResult;
/**
 * Validate percentage value (0-1 or 0-100)
 */
export declare function validatePercentage(percentage: number, asDecimal?: boolean): ValidationResult;
/**
 * Validate order side
 */
export declare function validateOrderSide(side: string): ValidationResult;
/**
 * Validate order type
 */
export declare function validateOrderType(type: string): ValidationResult;
/**
 * Validate date range
 */
export declare function validateDateRange(startDate: Date, endDate: Date): ValidationResult;
/**
 * Validate strategy configuration
 */
export declare function validateStrategyConfig(config: any): ValidationResult;
/**
 * Sanitize string input by trimming and removing potentially harmful characters
 */
export declare function sanitizeString(input: string): string;
/**
 * Sanitize number input with bounds checking
 */
export declare function sanitizeNumber(input: any, min?: number, max?: number, defaultValue?: number): number;
/**
 * Validate API key format
 */
export declare function validateApiKey(apiKey: string): ValidationResult;
/**
 * Create a combined validation result from multiple results
 */
export declare function combineValidationResults(...results: ValidationResult[]): ValidationResult;
//# sourceMappingURL=validation.d.ts.map