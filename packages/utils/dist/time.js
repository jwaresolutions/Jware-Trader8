"use strict";
/**
 * Time utilities for market hours and timezone handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeout = exports.sleep = exports.getTimeFromMarketOpen = exports.getMarketSessionForSymbol = exports.isExtendedHours = exports.formatTimeUntil = exports.formatTime = exports.convertTimezone = exports.isUSMarketHoliday = exports.getNextMarketOpen = exports.getMarketHoursInfo = exports.isMarketOpen = exports.US_MARKET_HOLIDAYS_2024 = exports.MARKET_SESSIONS = void 0;
/**
 * Standard market sessions
 */
exports.MARKET_SESSIONS = {
    NYSE: {
        name: 'New York Stock Exchange',
        open: '09:30',
        close: '16:00',
        timezone: 'America/New_York',
        daysOfWeek: [1, 2, 3, 4, 5] // Monday to Friday
    },
    NASDAQ: {
        name: 'NASDAQ',
        open: '09:30',
        close: '16:00',
        timezone: 'America/New_York',
        daysOfWeek: [1, 2, 3, 4, 5]
    },
    LSE: {
        name: 'London Stock Exchange',
        open: '08:00',
        close: '16:30',
        timezone: 'Europe/London',
        daysOfWeek: [1, 2, 3, 4, 5]
    },
    TSE: {
        name: 'Tokyo Stock Exchange',
        open: '09:00',
        close: '15:00',
        timezone: 'Asia/Tokyo',
        daysOfWeek: [1, 2, 3, 4, 5]
    },
    CRYPTO: {
        name: 'Cryptocurrency Markets',
        open: '00:00',
        close: '23:59',
        timezone: 'UTC',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6] // 24/7
    }
};
/**
 * US market holidays (static list - in production would come from API)
 */
exports.US_MARKET_HOLIDAYS_2024 = [
    '2024-01-01', // New Year's Day
    '2024-01-15', // Martin Luther King Jr. Day
    '2024-02-19', // Presidents' Day
    '2024-03-29', // Good Friday
    '2024-05-27', // Memorial Day
    '2024-06-19', // Juneteenth
    '2024-07-04', // Independence Day
    '2024-09-02', // Labor Day
    '2024-11-28', // Thanksgiving
    '2024-12-25' // Christmas
];
/**
 * Check if a market is currently open
 */
function isMarketOpen(marketSession, currentTime) {
    const now = currentTime || new Date();
    const marketInfo = getMarketHoursInfo(marketSession, now);
    return marketInfo.isOpen;
}
exports.isMarketOpen = isMarketOpen;
/**
 * Get comprehensive market hours information
 */
function getMarketHoursInfo(marketSession, currentTime) {
    const now = currentTime || new Date();
    // Convert current time to market timezone
    const marketTime = new Date(now.toLocaleString('en-US', { timeZone: marketSession.timezone }));
    const dayOfWeek = marketTime.getDay();
    // Check if today is a trading day
    if (!marketSession.daysOfWeek.includes(dayOfWeek)) {
        const nextOpen = getNextMarketOpen(marketSession, now);
        return {
            isOpen: false,
            nextOpen: nextOpen || undefined,
            timeToOpen: nextOpen ? nextOpen.getTime() - now.getTime() : undefined
        };
    }
    // Check if it's a holiday (simplified - only for US markets)
    if (marketSession.timezone === 'America/New_York' && isUSMarketHoliday(marketTime)) {
        const nextOpen = getNextMarketOpen(marketSession, now);
        return {
            isOpen: false,
            nextOpen: nextOpen || undefined,
            timeToOpen: nextOpen ? nextOpen.getTime() - now.getTime() : undefined
        };
    }
    const [openHour, openMinute] = marketSession.open.split(':').map(Number);
    const [closeHour, closeMinute] = marketSession.close.split(':').map(Number);
    const marketOpen = new Date(marketTime);
    marketOpen.setHours(openHour, openMinute, 0, 0);
    const marketClose = new Date(marketTime);
    marketClose.setHours(closeHour, closeMinute, 0, 0);
    // Handle markets that close after midnight
    if (closeHour < openHour) {
        marketClose.setDate(marketClose.getDate() + 1);
    }
    const isOpen = marketTime >= marketOpen && marketTime <= marketClose;
    if (isOpen) {
        return {
            isOpen: true,
            nextClose: marketClose,
            currentSession: marketSession.name,
            timeToClose: marketClose.getTime() - marketTime.getTime()
        };
    }
    else {
        const nextOpen = marketTime < marketOpen ? marketOpen : getNextMarketOpen(marketSession, now);
        return {
            isOpen: false,
            nextOpen: nextOpen || undefined,
            timeToOpen: nextOpen ? nextOpen.getTime() - now.getTime() : undefined
        };
    }
}
exports.getMarketHoursInfo = getMarketHoursInfo;
/**
 * Get the next market open time
 */
function getNextMarketOpen(marketSession, currentTime) {
    const now = currentTime || new Date();
    let checkDate = new Date(now);
    // Look ahead up to 14 days to find next open
    for (let i = 0; i < 14; i++) {
        const dayOfWeek = checkDate.getDay();
        if (marketSession.daysOfWeek.includes(dayOfWeek)) {
            const marketTime = new Date(checkDate.toLocaleString('en-US', { timeZone: marketSession.timezone }));
            // Skip holidays
            if (marketSession.timezone === 'America/New_York' && isUSMarketHoliday(marketTime)) {
                checkDate.setDate(checkDate.getDate() + 1);
                continue;
            }
            const [openHour, openMinute] = marketSession.open.split(':').map(Number);
            const marketOpen = new Date(marketTime);
            marketOpen.setHours(openHour, openMinute, 0, 0);
            // If it's today and market hasn't opened yet, or it's a future day
            if (i > 0 || marketOpen > new Date(now.toLocaleString('en-US', { timeZone: marketSession.timezone }))) {
                return marketOpen;
            }
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }
    return null; // Could not find next open within 14 days
}
exports.getNextMarketOpen = getNextMarketOpen;
/**
 * Check if a date is a US market holiday
 */
function isUSMarketHoliday(date) {
    const dateString = date.toISOString().split('T')[0];
    return exports.US_MARKET_HOLIDAYS_2024.includes(dateString);
}
exports.isUSMarketHoliday = isUSMarketHoliday;
/**
 * Convert time between timezones
 */
function convertTimezone(date, fromTimezone, toTimezone) {
    // Get the time in the source timezone
    const sourceTime = new Date(date.toLocaleString('en-US', { timeZone: fromTimezone }));
    // Get the time in the target timezone
    const targetTime = new Date(date.toLocaleString('en-US', { timeZone: toTimezone }));
    // Calculate the offset difference
    const offsetDifference = sourceTime.getTime() - targetTime.getTime();
    // Apply the offset to the original date
    return new Date(date.getTime() + offsetDifference);
}
exports.convertTimezone = convertTimezone;
/**
 * Format time for display
 */
function formatTime(date, timezone, format = 'short') {
    const options = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        ...(format === 'long' ? {
            second: '2-digit',
            timeZoneName: 'short'
        } : {})
    };
    return date.toLocaleString('en-US', options);
}
exports.formatTime = formatTime;
/**
 * Get time until market open/close in human readable format
 */
function formatTimeUntil(milliseconds) {
    if (milliseconds <= 0) {
        return 'Now';
    }
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    }
    else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
}
exports.formatTimeUntil = formatTimeUntil;
/**
 * Check if current time is within extended trading hours
 */
function isExtendedHours(marketSession, currentTime) {
    const now = currentTime || new Date();
    const marketTime = new Date(now.toLocaleString('en-US', { timeZone: marketSession.timezone }));
    // Extended hours typically 4:00 AM - 9:30 AM and 4:00 PM - 8:00 PM ET for US markets
    if (marketSession.timezone === 'America/New_York') {
        const hour = marketTime.getHours();
        const minute = marketTime.getMinutes();
        const timeInMinutes = hour * 60 + minute;
        // Pre-market: 4:00 AM - 9:30 AM
        const preMarketStart = 4 * 60; // 4:00 AM
        const preMarketEnd = 9 * 60 + 30; // 9:30 AM
        // After-hours: 4:00 PM - 8:00 PM
        const afterHoursStart = 16 * 60; // 4:00 PM
        const afterHoursEnd = 20 * 60; // 8:00 PM
        return (timeInMinutes >= preMarketStart && timeInMinutes < preMarketEnd) ||
            (timeInMinutes > afterHoursStart && timeInMinutes <= afterHoursEnd);
    }
    return false;
}
exports.isExtendedHours = isExtendedHours;
/**
 * Get market session for a trading symbol
 */
function getMarketSessionForSymbol(symbol) {
    // Simple logic - in practice this would be more sophisticated
    if (symbol.includes('USD') || symbol.includes('BTC') || symbol.includes('ETH')) {
        return exports.MARKET_SESSIONS.CRYPTO;
    }
    // Default to NYSE for US stocks
    return exports.MARKET_SESSIONS.NYSE;
}
exports.getMarketSessionForSymbol = getMarketSessionForSymbol;
/**
 * Calculate time elapsed since market open
 */
function getTimeFromMarketOpen(marketSession, currentTime) {
    const marketInfo = getMarketHoursInfo(marketSession, currentTime);
    if (!marketInfo.isOpen) {
        return null;
    }
    const now = currentTime || new Date();
    const marketTime = new Date(now.toLocaleString('en-US', { timeZone: marketSession.timezone }));
    const [openHour, openMinute] = marketSession.open.split(':').map(Number);
    const marketOpen = new Date(marketTime);
    marketOpen.setHours(openHour, openMinute, 0, 0);
    return marketTime.getTime() - marketOpen.getTime();
}
exports.getTimeFromMarketOpen = getTimeFromMarketOpen;
/**
 * Sleep for specified milliseconds (useful for rate limiting)
 */
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
exports.sleep = sleep;
/**
 * Create a timeout promise that rejects after specified time
 */
function timeout(promise, milliseconds) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Operation timed out after ${milliseconds}ms`)), milliseconds))
    ]);
}
exports.timeout = timeout;
