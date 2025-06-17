/**
 * Mathematical utility functions for financial calculations
 */

/**
 * Calculate percentage change between two values
 * @param oldValue - Original value
 * @param newValue - New value
 * @returns Percentage change
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    if (newValue === 0) return 0;
    return newValue > 0 ? Infinity : -Infinity;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Round a number to specified decimal places
 * @param value - Number to round
 * @param decimalPlaces - Number of decimal places
 * @returns Rounded number
 */
export function roundToDecimalPlaces(value: number, decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate Sharpe ratio for a series of returns
 * @param returns - Array of return values
 * @param riskFreeRate - Risk-free rate (default: 0)
 * @returns Sharpe ratio
 */
export function calculateSharpeRatio(returns: number[], riskFreeRate: number = 0): number {
  if (returns.length === 0) {
    throw new Error('Returns array cannot be empty');
  }

  const excessReturns = returns.map(r => r - riskFreeRate);
  const meanExcessReturn = calculateMean(excessReturns);
  const stdDeviation = calculateStandardDeviation(excessReturns);
  
  if (stdDeviation === 0) {
    return meanExcessReturn > 0 ? Infinity : meanExcessReturn < 0 ? -Infinity : 0;
  }
  
  return meanExcessReturn / stdDeviation;
}

/**
 * Calculate maximum drawdown from equity curve
 * @param equityCurve - Array of portfolio values over time
 * @returns Maximum drawdown as percentage (0-1)
 */
export function calculateMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length === 0) {
    throw new Error('Equity curve cannot be empty');
  }

  if (equityCurve.length === 1) {
    return 0;
  }

  let maxDrawdown = 0;
  let peak = equityCurve[0];

  for (let i = 1; i < equityCurve.length; i++) {
    const currentValue = equityCurve[i];
    
    if (currentValue > peak) {
      peak = currentValue;
    } else {
      const drawdown = peak === 0 ? 0 : (peak - currentValue) / Math.abs(peak);
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  return maxDrawdown;
}

/**
 * Calculate volatility (standard deviation) of returns
 * @param returns - Array of return values
 * @returns Volatility (standard deviation)
 */
export function calculateVolatility(returns: number[]): number {
  return calculateStandardDeviation(returns);
}

/**
 * Calculate arithmetic mean of an array of numbers
 * @param values - Array of numbers
 * @returns Mean value
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Values array cannot be empty');
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 * @param values - Array of numbers
 * @returns Standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) {
    throw new Error('Values array cannot be empty');
  }

  if (values.length === 1) {
    return 0;
  }

  const mean = calculateMean(values);
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = calculateMean(squaredDifferences);
  
  return Math.sqrt(variance);
}

/**
 * Clamp a value between minimum and maximum bounds
 * @param value - Value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Check if a value is a valid finite number
 * @param value - Value to check
 * @returns True if valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && isFinite(value);
}

/**
 * Convert a value to a safe number, replacing invalid values with default
 * @param value - Value to convert
 * @param defaultValue - Default value for invalid inputs (default: 0)
 * @returns Safe number
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  return isValidNumber(value) ? value : defaultValue;
}

/**
 * Calculate compound return from a series of returns
 * @param returns - Array of return values (as decimals, e.g., 0.10 for 10%)
 * @returns Compound return
 */
export function calculateCompoundReturn(returns: number[]): number {
  if (returns.length === 0) {
    throw new Error('Returns array cannot be empty');
  }

  return returns.reduce((compound, returnValue) => compound * (1 + returnValue), 1) - 1;
}

/**
 * Calculate annualized return from total return and time period
 * @param totalReturn - Total return as decimal (e.g., 0.20 for 20%)
 * @param periods - Number of periods
 * @param periodsPerYear - Number of periods per year (default: 252 for daily trading days)
 * @returns Annualized return
 */
export function calculateAnnualizedReturn(
  totalReturn: number, 
  periods: number, 
  periodsPerYear: number = 252
): number {
  if (periods <= 0) {
    throw new Error('Periods must be greater than 0');
  }

  const years = periods / periodsPerYear;
  return Math.pow(1 + totalReturn, 1 / years) - 1;
}

/**
 * Calculate win rate from an array of P&L values
 * @param pnlValues - Array of profit/loss values
 * @returns Win rate as percentage (0-1)
 */
export function calculateWinRate(pnlValues: number[]): number {
  if (pnlValues.length === 0) {
    return 0;
  }

  const winningTrades = pnlValues.filter(pnl => pnl > 0).length;
  return winningTrades / pnlValues.length;
}

/**
 * Calculate profit factor from P&L values
 * @param pnlValues - Array of profit/loss values
 * @returns Profit factor (gross profit / gross loss)
 */
export function calculateProfitFactor(pnlValues: number[]): number {
  const profits = pnlValues.filter(pnl => pnl > 0);
  const losses = pnlValues.filter(pnl => pnl < 0);

  const grossProfit = profits.reduce((sum, profit) => sum + profit, 0);
  const grossLoss = Math.abs(losses.reduce((sum, loss) => sum + loss, 0));

  if (grossLoss === 0) {
    return grossProfit > 0 ? Infinity : 1;
  }

  return grossProfit / grossLoss;
}

/**
 * Calculate Kelly criterion optimal bet size
 * @param winRate - Win rate (0-1)
 * @param avgWin - Average winning amount
 * @param avgLoss - Average losing amount (positive value)
 * @returns Optimal bet size as fraction of capital (0-1)
 */
export function calculateKellyCriterion(winRate: number, avgWin: number, avgLoss: number): number {
  if (avgLoss <= 0) {
    throw new Error('Average loss must be positive');
  }

  const lossRate = 1 - winRate;
  const kellyCriterion = (winRate / avgLoss) - (lossRate / avgWin);
  
  // Clamp to reasonable bounds (0-25% max)
  return clamp(kellyCriterion, 0, 0.25);
}

/**
 * Generate a unique identifier
 * @param prefix - Optional prefix for the ID
 * @returns Unique string identifier
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const id = `${timestamp}_${random}`;
  return prefix ? `${prefix}_${id}` : id;
}