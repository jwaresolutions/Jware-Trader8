"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIOutputFormatter = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
class CLIOutputFormatter {
    formatTable(data, headers) {
        if (!data || data.length === 0) {
            return chalk_1.default.yellow('No data to display');
        }
        const table = new cli_table3_1.default({
            head: headers.map(h => chalk_1.default.cyan(h)),
            style: {
                head: [],
                border: ['grey'],
                'padding-left': 1,
                'padding-right': 1
            }
        });
        data.forEach(row => {
            const tableRow = headers.map(header => {
                const value = row[header];
                // Format different types of values
                if (typeof value === 'number') {
                    if (header.toLowerCase().includes('pnl') || header.toLowerCase().includes('profit')) {
                        return value >= 0 ? chalk_1.default.green(`$${value.toFixed(2)}`) : chalk_1.default.red(`$${value.toFixed(2)}`);
                    }
                    if (header.toLowerCase().includes('percent') || header.toLowerCase().includes('rate')) {
                        return value >= 0 ? chalk_1.default.green(`${value.toFixed(2)}%`) : chalk_1.default.red(`${value.toFixed(2)}%`);
                    }
                    return value.toFixed(4);
                }
                if (value instanceof Date) {
                    return value.toLocaleString();
                }
                if (typeof value === 'boolean') {
                    return value ? chalk_1.default.green('✓') : chalk_1.default.red('✗');
                }
                return String(value || '-');
            });
            table.push(tableRow);
        });
        return table.toString();
    }
    formatJSON(data) {
        return JSON.stringify(data, null, 2);
    }
    formatCSV(data) {
        if (!data || data.length === 0) {
            return '';
        }
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) {
                    return '';
                }
                // Escape commas and quotes in CSV
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            csvRows.push(values.join(','));
        });
        return csvRows.join('\n');
    }
    formatPerformanceSummary(summary) {
        const table = new cli_table3_1.default({
            style: {
                head: [],
                border: ['grey']
            }
        });
        const formatValue = (key, value) => {
            if (key.includes('Return') || key.includes('Drawdown')) {
                const color = value >= 0 ? chalk_1.default.green : chalk_1.default.red;
                return color(`${value.toFixed(2)}%`);
            }
            if (key.includes('Ratio')) {
                return value.toFixed(2);
            }
            if (key.includes('Rate')) {
                return `${value.toFixed(2)}%`;
            }
            return String(value);
        };
        Object.entries(summary).forEach(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            table.push([chalk_1.default.cyan(formattedKey), formatValue(key, value)]);
        });
        return table.toString();
    }
    formatAccountInfo(account) {
        const table = new cli_table3_1.default({
            style: {
                head: [],
                border: ['grey']
            }
        });
        const accountData = [
            ['Account Value', chalk_1.default.green(`$${account.totalValue?.toFixed(2) || '0.00'}`)],
            ['Cash Balance', `$${account.cash?.toFixed(2) || '0.00'}`],
            ['Buying Power', `$${account.buyingPower?.toFixed(2) || '0.00'}`],
            ['Day Trade Count', account.dayTradeCount || '0'],
            ['Pattern Day Trader', account.patternDayTrader ? chalk_1.default.yellow('Yes') : chalk_1.default.green('No')]
        ];
        accountData.forEach(row => {
            table.push(row);
        });
        return table.toString();
    }
    formatPositions(positions) {
        if (!positions || positions.length === 0) {
            return chalk_1.default.yellow('No open positions');
        }
        const headers = ['Symbol', 'Quantity', 'Entry Price', 'Current Price', 'P&L', 'P&L %'];
        return this.formatTable(positions.map(pos => ({
            Symbol: pos.symbol,
            Quantity: pos.quantity,
            'Entry Price': pos.entryPrice,
            'Current Price': pos.currentPrice,
            'P&L': pos.pnl,
            'P&L %': pos.pnlPercent
        })), headers);
    }
    formatTrades(trades) {
        if (!trades || trades.length === 0) {
            return chalk_1.default.yellow('No trades to display');
        }
        const headers = ['Symbol', 'Side', 'Entry Time', 'Exit Time', 'Entry Price', 'Exit Price', 'Quantity', 'P&L', 'Reason'];
        return this.formatTable(trades.map(trade => ({
            Symbol: trade.symbol,
            Side: trade.side,
            'Entry Time': trade.entryTime,
            'Exit Time': trade.exitTime || '-',
            'Entry Price': trade.entryPrice,
            'Exit Price': trade.exitPrice || '-',
            Quantity: trade.quantity,
            'P&L': trade.pnl || 0,
            Reason: trade.entryReason || trade.exitReason || '-'
        })), headers);
    }
    formatStrategyInfo(strategy) {
        const lines = [
            chalk_1.default.bold.blue(`Strategy: ${strategy.name}`),
            chalk_1.default.gray(`Description: ${strategy.description || 'No description'}`),
            '',
            chalk_1.default.bold('Parameters:')
        ];
        if (strategy.parameters) {
            Object.entries(strategy.parameters).forEach(([key, value]) => {
                lines.push(`  ${chalk_1.default.cyan(key)}: ${value}`);
            });
        }
        lines.push('', chalk_1.default.bold('Indicators:'));
        if (strategy.indicators && strategy.indicators.length > 0) {
            strategy.indicators.forEach((indicator) => {
                lines.push(`  ${chalk_1.default.cyan(indicator.name)}: ${indicator.type} (${JSON.stringify(indicator.parameters)})`);
            });
        }
        return lines.join('\n');
    }
    success(message) {
        return chalk_1.default.green('✓ ' + message);
    }
    error(message) {
        return chalk_1.default.red('✗ ' + message);
    }
    warning(message) {
        return chalk_1.default.yellow('⚠ ' + message);
    }
    info(message) {
        return chalk_1.default.blue('ℹ ' + message);
    }
    header(message) {
        return chalk_1.default.bold.blue(message);
    }
    dim(message) {
        return chalk_1.default.dim(message);
    }
}
exports.CLIOutputFormatter = CLIOutputFormatter;
//# sourceMappingURL=output-formatter.js.map