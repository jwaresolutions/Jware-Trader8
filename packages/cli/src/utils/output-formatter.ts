import chalk from 'chalk';
import Table from 'cli-table3';
import { OutputFormatter } from '../types/cli-types';

export class CLIOutputFormatter implements OutputFormatter {
  formatTable(data: any[], headers: string[]): string {
    if (!data || data.length === 0) {
      return chalk.yellow('No data to display');
    }

    const table = new Table({
      head: headers.map(h => chalk.cyan(h)),
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
            return value >= 0 ? chalk.green(`$${value.toFixed(2)}`) : chalk.red(`$${value.toFixed(2)}`);
          }
          if (header.toLowerCase().includes('percent') || header.toLowerCase().includes('rate')) {
            return value >= 0 ? chalk.green(`${value.toFixed(2)}%`) : chalk.red(`${value.toFixed(2)}%`);
          }
          return value.toFixed(4);
        }
        
        if (value instanceof Date) {
          return value.toLocaleString();
        }
        
        if (typeof value === 'boolean') {
          return value ? chalk.green('✓') : chalk.red('✗');
        }
        
        return String(value || '-');
      });
      
      table.push(tableRow);
    });

    return table.toString();
  }

  formatJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  formatCSV(data: any[]): string {
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

  formatPerformanceSummary(summary: any): string {
    const table = new Table({
      style: {
        head: [],
        border: ['grey']
      }
    });

    const formatValue = (key: string, value: any) => {
      if (key.includes('Return') || key.includes('Drawdown')) {
        const color = value >= 0 ? chalk.green : chalk.red;
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
      table.push([chalk.cyan(formattedKey), formatValue(key, value)]);
    });

    return table.toString();
  }

  formatAccountInfo(account: any): string {
    const table = new Table({
      style: {
        head: [],
        border: ['grey']
      }
    });

    const accountData = [
      ['Account Value', chalk.green(`$${account.totalValue?.toFixed(2) || '0.00'}`)],
      ['Cash Balance', `$${account.cash?.toFixed(2) || '0.00'}`],
      ['Buying Power', `$${account.buyingPower?.toFixed(2) || '0.00'}`],
      ['Day Trade Count', account.dayTradeCount || '0'],
      ['Pattern Day Trader', account.patternDayTrader ? chalk.yellow('Yes') : chalk.green('No')]
    ];

    accountData.forEach(row => {
      table.push(row);
    });

    return table.toString();
  }

  formatPositions(positions: any[]): string {
    if (!positions || positions.length === 0) {
      return chalk.yellow('No open positions');
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

  formatTrades(trades: any[]): string {
    if (!trades || trades.length === 0) {
      return chalk.yellow('No trades to display');
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

  formatStrategyInfo(strategy: any): string {
    const lines = [
      chalk.bold.blue(`Strategy: ${strategy.name}`),
      chalk.gray(`Description: ${strategy.description || 'No description'}`),
      '',
      chalk.bold('Parameters:')
    ];

    if (strategy.parameters) {
      Object.entries(strategy.parameters).forEach(([key, value]) => {
        lines.push(`  ${chalk.cyan(key)}: ${value}`);
      });
    }

    lines.push('', chalk.bold('Indicators:'));
    if (strategy.indicators && strategy.indicators.length > 0) {
      strategy.indicators.forEach((indicator: any) => {
        lines.push(`  ${chalk.cyan(indicator.name)}: ${indicator.type} (${JSON.stringify(indicator.parameters)})`);
      });
    }

    return lines.join('\n');
  }

  success(message: string): string {
    return chalk.green('✓ ' + message);
  }

  error(message: string): string {
    return chalk.red('✗ ' + message);
  }

  warning(message: string): string {
    return chalk.yellow('⚠ ' + message);
  }

  info(message: string): string {
    return chalk.blue('ℹ ' + message);
  }

  header(message: string): string {
    return chalk.bold.blue(message);
  }

  dim(message: string): string {
    return chalk.dim(message);
  }
}