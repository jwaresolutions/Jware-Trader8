/**
 * Test file for math utilities
 * Following TDD approach from IMPLEMENTATION_GUIDE.md
 */

import {
  calculatePercentageChange,
  roundToDecimalPlaces,
  calculateSharpeRatio,
  calculateMaxDrawdown,
  calculateVolatility,
  calculateMean,
  calculateStandardDeviation,
  clamp,
  isValidNumber,
  safeNumber
} from '../src/math';

describe('Math Utilities', () => {
  test('should calculate percentage change correctly', () => {
    expect(calculatePercentageChange(100, 110)).toBe(10);
    expect(calculatePercentageChange(100, 90)).toBe(-10);
    expect(calculatePercentageChange(0, 10)).toBe(Infinity);
    expect(calculatePercentageChange(10, 0)).toBe(-100);
    expect(calculatePercentageChange(50, 75)).toBe(50);
    expect(calculatePercentageChange(200, 100)).toBe(-50);
  });
  
  test('should handle precision in financial calculations', () => {
    const result = roundToDecimalPlaces(0.123456789, 4);
    expect(result).toBe(0.1235);
    expect(typeof result).toBe('number');
    
    expect(roundToDecimalPlaces(1.999, 2)).toBe(2.00);
    expect(roundToDecimalPlaces(123.456, 1)).toBe(123.5);
    expect(roundToDecimalPlaces(10, 0)).toBe(10);
  });

  test('should calculate Sharpe ratio correctly', () => {
    const returns = [0.10, 0.15, -0.05, 0.08, 0.12];
    const riskFreeRate = 0.02;
    const sharpeRatio = calculateSharpeRatio(returns, riskFreeRate);
    
    expect(sharpeRatio).toBeGreaterThan(0);
    expect(typeof sharpeRatio).toBe('number');
    expect(isFinite(sharpeRatio)).toBe(true);
  });

  test('should calculate maximum drawdown correctly', () => {
    const equityCurve = [10000, 11000, 10500, 9500, 9000, 9500, 10200];
    const maxDrawdown = calculateMaxDrawdown(equityCurve);
    
    expect(maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(maxDrawdown).toBeLessThanOrEqual(1);
    expect(typeof maxDrawdown).toBe('number');
  });

  test('should calculate volatility correctly', () => {
    const returns = [0.02, -0.01, 0.03, -0.02, 0.01];
    const volatility = calculateVolatility(returns);
    
    expect(volatility).toBeGreaterThanOrEqual(0);
    expect(typeof volatility).toBe('number');
    expect(isFinite(volatility)).toBe(true);
  });

  test('should calculate mean correctly', () => {
    expect(calculateMean([1, 2, 3, 4, 5])).toBe(3);
    expect(calculateMean([10, 20, 30])).toBe(20);
    expect(calculateMean([0])).toBe(0);
    expect(calculateMean([-1, 1])).toBe(0);
  });

  test('should calculate standard deviation correctly', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const stdDev = calculateStandardDeviation(values);
    
    expect(stdDev).toBeGreaterThan(0);
    expect(typeof stdDev).toBe('number');
    expect(isFinite(stdDev)).toBe(true);
  });

  test('should clamp values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(7.5, 0, 10)).toBe(7.5);
  });

  test('should validate numbers correctly', () => {
    expect(isValidNumber(42)).toBe(true);
    expect(isValidNumber(0)).toBe(true);
    expect(isValidNumber(-10)).toBe(true);
    expect(isValidNumber(3.14)).toBe(true);
    
    expect(isValidNumber(NaN)).toBe(false);
    expect(isValidNumber(Infinity)).toBe(false);
    expect(isValidNumber(-Infinity)).toBe(false);
    expect(isValidNumber(null as any)).toBe(false);
    expect(isValidNumber(undefined as any)).toBe(false);
    expect(isValidNumber('42' as any)).toBe(false);
  });

  test('should convert to safe numbers', () => {
    expect(safeNumber(42)).toBe(42);
    expect(safeNumber(3.14)).toBe(3.14);
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber(Infinity)).toBe(0);
    expect(safeNumber(-Infinity)).toBe(0);
    expect(safeNumber(null as any)).toBe(0);
    expect(safeNumber(undefined as any)).toBe(0);
    
    expect(safeNumber(NaN, 100)).toBe(100);
    expect(safeNumber(Infinity, -1)).toBe(-1);
  });

  test('should handle edge cases in percentage calculation', () => {
    expect(calculatePercentageChange(0, 0)).toBe(0);
    expect(calculatePercentageChange(-100, -50)).toBe(50);
    expect(calculatePercentageChange(100, 100)).toBe(0);
  });

  test('should handle edge cases in rounding', () => {
    expect(roundToDecimalPlaces(0, 5)).toBe(0);
    expect(roundToDecimalPlaces(-1.555, 2)).toBe(-1.56);
    expect(roundToDecimalPlaces(999.999, 0)).toBe(1000);
  });

  test('should handle empty arrays in statistical functions', () => {
    expect(() => calculateMean([])).toThrow();
    expect(() => calculateStandardDeviation([])).toThrow();
    expect(() => calculateVolatility([])).toThrow();
    expect(() => calculateMaxDrawdown([])).toThrow();
  });

  test('should handle single value arrays', () => {
    expect(calculateMean([5])).toBe(5);
    expect(calculateStandardDeviation([5])).toBe(0);
    expect(calculateMaxDrawdown([10000])).toBe(0);
  });

  test('should handle negative values in drawdown calculation', () => {
    const negativeEquityCurve = [-1000, -500, -2000, -1500];
    const drawdown = calculateMaxDrawdown(negativeEquityCurve);
    expect(drawdown).toBeGreaterThanOrEqual(0);
  });

  test('should calculate compound return correctly', () => {
    // This test assumes we'll implement compound return calculation
    const returns = [0.10, 0.05, -0.02];
    // Compound return = (1 + 0.10) * (1 + 0.05) * (1 - 0.02) - 1
    const expected = (1.10 * 1.05 * 0.98) - 1;
    
    // We'll implement this function
    // expect(calculateCompoundReturn(returns)).toBeCloseTo(expected, 4);
  });
});