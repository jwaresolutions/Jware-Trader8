/**
 * Time utilities for market hours and timezone handling
 */
export interface MarketSession {
    name: string;
    open: string;
    close: string;
    timezone: string;
    daysOfWeek: number[];
}
export interface MarketHoursInfo {
    isOpen: boolean;
    nextOpen?: Date;
    nextClose?: Date;
    currentSession?: string;
    timeToOpen?: number;
    timeToClose?: number;
}
/**
 * Standard market sessions
 */
export declare const MARKET_SESSIONS: Record<string, MarketSession>;
/**
 * US market holidays (static list - in production would come from API)
 */
export declare const US_MARKET_HOLIDAYS_2024: string[];
/**
 * Check if a market is currently open
 */
export declare function isMarketOpen(marketSession: MarketSession, currentTime?: Date): boolean;
/**
 * Get comprehensive market hours information
 */
export declare function getMarketHoursInfo(marketSession: MarketSession, currentTime?: Date): MarketHoursInfo;
/**
 * Get the next market open time
 */
export declare function getNextMarketOpen(marketSession: MarketSession, currentTime?: Date): Date | null;
/**
 * Check if a date is a US market holiday
 */
export declare function isUSMarketHoliday(date: Date): boolean;
/**
 * Convert time between timezones
 */
export declare function convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date;
/**
 * Format time for display
 */
export declare function formatTime(date: Date, timezone?: string, format?: 'short' | 'long'): string;
/**
 * Get time until market open/close in human readable format
 */
export declare function formatTimeUntil(milliseconds: number): string;
/**
 * Check if current time is within extended trading hours
 */
export declare function isExtendedHours(marketSession: MarketSession, currentTime?: Date): boolean;
/**
 * Get market session for a trading symbol
 */
export declare function getMarketSessionForSymbol(symbol: string): MarketSession;
/**
 * Calculate time elapsed since market open
 */
export declare function getTimeFromMarketOpen(marketSession: MarketSession, currentTime?: Date): number | null;
/**
 * Sleep for specified milliseconds (useful for rate limiting)
 */
export declare function sleep(milliseconds: number): Promise<void>;
/**
 * Create a timeout promise that rejects after specified time
 */
export declare function timeout<T>(promise: Promise<T>, milliseconds: number): Promise<T>;
//# sourceMappingURL=time.d.ts.map