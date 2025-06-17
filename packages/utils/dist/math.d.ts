/**
 * Mathematical utility functions for financial calculations
 */
/**
 * Calculate percentage change between two values
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change
 */
export declare function calculatePercentageChange(oldValue: number, newValue: number): number;
/**
 * Round a number to specified decimal places
 * @param value - Number to round
 * @param decimalPlaces - Number of decimal places
 * @returns Rounded number
 */
export declare function roundToDecimalPlaces(value: number, decimalPlaces: number): number;
/**
 * Calculate Sharpe ratio for a series of returns
 * @param returns - Array of return values
 * @param riskFreeRate - Risk-free rate (default: 0)
 * @returns Sharpe ratio
 */
export declare function calculateSharpeRatio(returns: number[], riskFreeRate?: number): number;
/**
 * Calculate maximum drawdown from equity curve
 * @param equityCurve - Array of portfolio values over time
 * @returns Maximum drawdown as percentage (0-1)
 */
export declare function calculateMaxDrawdown(equityCurve: number[]): number;
/**
 * Calculate volatility (standard deviation) of returns
 * @param returns - Array of return values
 * @returns Volatility (standard deviation)
 */
export declare function calculateVolatility(returns: number[]): number;
/**
 * Calculate arithmetic mean of an array of numbers
 * @param values - Array of numbers
 * @returns Mean value
 */
export declare function calculateMean(values: number[]): number;
/**
 * Calculate standard deviation of an array of numbers
 * @param values - Array of numbers
 * @returns Standard deviation
 */
export declare function calculateStandardDeviation(values: number[]): number;
/**
 * Clamp a value between minimum and maximum bounds
 * @param value - Value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Clamped value
 */
export declare function clamp(value: number, min: number, max: number): number;
/**
 * Check if a value is a valid finite number
 * @param value - Value to check
 * @returns True if valid number
 */
export declare function isValidNumber(value: any): value is number;
/**
 * Convert a value to a safe number, replacing invalid values with default
 * @param value - Value to convert
 * @param defaultValue - Default value for invalid inputs (default: 0)
 * @returns Safe number
 */
export declare function safeNumber(value: any, defaultValue?: number): number;
/**
 * Calculate compound return from a series of returns
 * @param returns - Array of return values (as decimals, e.g., 0.10 for 10%)
 * @returns Compound return
 */
export declare function calculateCompoundReturn(returns: number[]): number;
/**
 * Calculate annualized return from total return and time period
 * @param totalReturn - Total return as decimal (e.g., 0.20 for 20%)
 * @param periods - Number of periods
 * @param periodsPerYear - Number of periods per year (default: 252 for daily trading days)
 * @returns Annualized return
 */
export declare function calculateAnnualizedReturn(totalReturn: number, periods: number, periodsPerYear?: number): number;
/**
 * Calculate win rate from an array of P&L values
 * @param pnlValues - Array of profit/loss values
 * @returns Win rate as percentage (0-1)
 */
export declare function calculateWinRate(pnlValues: number[]): number;
/**
 * Calculate profit factor from P&L values
 * @param pnlValues - Array of profit/loss values
 * @returns Profit factor (gross profit / gross loss)
 */
export declare function calculateProfitFactor(pnlValues: number[]): number;
/**
 * Calculate Kelly criterion optimal bet size
 * @param winRate - Win rate (0-1)
 * @param avgWin - Average winning amount
 * @param avgLoss - Average losing amount (positive value)
 * @returns Optimal bet size as fraction of capital (0-1)
 */
export declare function calculateKellyCriterion(winRate: number, avgWin: number, avgLoss: number): number;
/**
 * Generate a unique identifier
 * @param prefix - Optional prefix for the ID
 * @returns Unique string identifier
 */
export declare function generateId(prefix?: string): string;
//# sourceMappingURL=math.d.ts.map