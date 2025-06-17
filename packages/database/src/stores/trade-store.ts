/**
 * Trade history storage
 * Based on pseudocode from PSEUDOCODE_MODULES.md
 */

import Database from 'better-sqlite3';
import { 
  ITradeStore, 
  DatabaseConfig, 
  TradeFilter, 
  PerformanceData, 
  TradeStats 
} from '@jware-trader8/types';
import { Trade } from '@jware-trader8/types';
import { Logger } from '@jware-trader8/utils';
import { format } from 'date-fns';

/**
 * Trade store implementation with SQLite backend
 */
export class TradeStore implements ITradeStore {
  private db: Database.Database;
  private config: DatabaseConfig;
  private logger: Logger;
  private isInitialized: boolean = false;

  // Prepared statements for performance
  private statements: {
    saveTrade?: Database.Statement;
    getTradeById?: Database.Statement;
    getTrades?: Database.Statement;
    getTradesBySymbol?: Database.Statement;
    getTradesByStrategy?: Database.Statement;
    getTradesByDateRange?: Database.Statement;
    deleteOldTrades?: Database.Statement;
    getTradeStats?: Database.Statement;
    getPerformanceData?: Database.Statement;
    getDailyPnl?: Database.Statement;
  } = {};

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.logger = new Logger('TradeStore');

    // Initialize database connection
    this.db = new Database(config.path, {
      timeout: config.timeout || 5000,
      verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
    });

    this.logger.info('TradeStore initialized', {
      dbPath: config.path,
      enableWAL: config.enableWAL
    });
  }

  /**
   * Initialize the database schema
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Enable WAL mode if configured
      if (this.config.enableWAL) {
        this.db.pragma('journal_mode = WAL');
      }

      // Set other pragmas for performance
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');

      // Create tables
      this.setupTables();

      // Prepare statements
      this.prepareStatements();

      this.isInitialized = true;
      this.logger.info('Trade database schema initialized');
    } catch (error) {
      this.logger.error('Failed to initialize trade database', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Save a trade record
   */
  async saveTrade(trade: Trade): Promise<void> {
    this.ensureInitialized();

    try {
      this.statements.saveTrade!.run({
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        entry_price: trade.entryPrice,
        exit_price: trade.exitPrice || null,
        entry_time: trade.entryTime.toISOString(),
        exit_time: trade.exitTime?.toISOString() || null,
        pnl: trade.pnl || null,
        commission: trade.commission,
        entry_reason: trade.entryReason || null,
        exit_reason: trade.exitReason || null,
        strategy_name: trade.strategyName || null,
        status: trade.status
      });

      this.logger.info('Trade saved', { 
        tradeId: trade.id, 
        symbol: trade.symbol, 
        side: trade.side 
      });
    } catch (error) {
      this.logger.error('Failed to save trade', {
        tradeId: trade.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get trades with optional filtering
   */
  async getTrades(filter?: TradeFilter): Promise<Trade[]> {
    this.ensureInitialized();

    try {
      let query = 'SELECT * FROM trades';
      const conditions: string[] = [];
      const params: any = {};

      // Build WHERE clause
      if (filter) {
        if (filter.symbol) {
          conditions.push('symbol = @symbol');
          params.symbol = filter.symbol;
        }
        if (filter.strategyName) {
          conditions.push('strategy_name = @strategyName');
          params.strategyName = filter.strategyName;
        }
        if (filter.startDate) {
          conditions.push('entry_time >= @startDate');
          params.startDate = filter.startDate.toISOString();
        }
        if (filter.endDate) {
          conditions.push('entry_time <= @endDate');
          params.endDate = filter.endDate.toISOString();
        }
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add ORDER BY
      if (filter?.sortBy) {
        const sortColumn = filter.sortBy === 'entryTime' ? 'entry_time' : 
                          filter.sortBy === 'exitTime' ? 'exit_time' : 'pnl';
        const sortOrder = filter.sortOrder || 'desc';
        query += ` ORDER BY ${sortColumn} ${sortOrder.toUpperCase()}`;
      } else {
        query += ' ORDER BY entry_time DESC';
      }

      // Add LIMIT
      if (filter?.limit) {
        query += ' LIMIT @limit';
        params.limit = filter.limit;
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(params) as any[];

      return rows.map(this.mapRowToTrade);
    } catch (error) {
      this.logger.error('Failed to get trades', {
        filter,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get performance data for timeframe
   */
  async getPerformanceData(timeframe: string): Promise<PerformanceData> {
    this.ensureInitialized();

    try {
      const startDate = this.getStartDateForTimeframe(timeframe);

      // Get summary data
      const summaryQuery = `
        SELECT 
          COUNT(*) as total_trades,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as avg_pnl,
          MAX(pnl) as best_trade,
          MIN(pnl) as worst_trade
        FROM trades 
        WHERE entry_time >= ? AND status = 'CLOSED'
      `;

      const summaryRow = this.db.prepare(summaryQuery).get(startDate.toISOString()) as any;

      // Get daily P&L data
      const dailyQuery = `
        SELECT 
          DATE(entry_time) as date,
          SUM(pnl) as daily_pnl
        FROM trades 
        WHERE entry_time >= ? AND status = 'CLOSED'
        GROUP BY DATE(entry_time)
        ORDER BY date
      `;

      const dailyRows = this.db.prepare(dailyQuery).all(startDate.toISOString()) as any[];

      const summary = {
        totalTrades: summaryRow.total_trades || 0,
        winningTrades: summaryRow.winning_trades || 0,
        totalPnl: summaryRow.total_pnl || 0,
        avgPnl: summaryRow.avg_pnl || 0,
        bestTrade: summaryRow.best_trade || 0,
        worstTrade: summaryRow.worst_trade || 0
      };

      const dailyPnl = dailyRows.map(row => ({
        date: row.date,
        dailyPnl: row.daily_pnl
      }));

      const winRate = summary.totalTrades > 0 ? 
        summary.winningTrades / summary.totalTrades : 0;

      return {
        summary,
        dailyPnl,
        winRate
      };
    } catch (error) {
      this.logger.error('Failed to get performance data', {
        timeframe,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Delete trades older than specified date
   */
  async deleteOldTrades(beforeDate: Date): Promise<number> {
    this.ensureInitialized();

    try {
      const result = this.statements.deleteOldTrades!.run({
        beforeDate: beforeDate.toISOString()
      });

      const deletedCount = result.changes;
      this.logger.info('Old trades deleted', { 
        count: deletedCount, 
        beforeDate: beforeDate.toISOString() 
      });

      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to delete old trades', {
        beforeDate: beforeDate.toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get trade statistics
   */
  async getTradeStats(symbol?: string): Promise<TradeStats> {
    this.ensureInitialized();

    try {
      let query = `
        SELECT 
          COUNT(*) as total_trades,
          SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
          SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END) as losing_trades,
          SUM(pnl) as total_pnl,
          AVG(pnl) as average_return,
          MAX(pnl) as best_trade,
          MIN(pnl) as worst_trade,
          SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as gross_profit,
          SUM(CASE WHEN pnl <= 0 THEN ABS(pnl) ELSE 0 END) as gross_loss
        FROM trades 
        WHERE status = 'CLOSED'
      `;

      const params: any = {};
      if (symbol) {
        query += ' AND symbol = @symbol';
        params.symbol = symbol;
      }

      const row = this.db.prepare(query).get(params) as any;

      const totalTrades = row.total_trades || 0;
      const winningTrades = row.winning_trades || 0;
      const losingTrades = row.losing_trades || 0;
      const grossProfit = row.gross_profit || 0;
      const grossLoss = row.gross_loss || 0;

      const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 
                          grossProfit > 0 ? Infinity : 1;

      return {
        totalTrades,
        winningTrades,
        losingTrades,
        totalPnl: row.total_pnl || 0,
        averageReturn: row.average_return || 0,
        bestTrade: row.best_trade || 0,
        worstTrade: row.worst_trade || 0,
        winRate,
        profitFactor
      };
    } catch (error) {
      this.logger.error('Failed to get trade stats', {
        symbol,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.logger.info('Trade database connection closed');
    }
  }

  /**
   * Private helper methods
   */

  private setupTables(): void {
    // Trades table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        quantity REAL NOT NULL,
        entry_price REAL NOT NULL,
        exit_price REAL,
        entry_time DATETIME NOT NULL,
        exit_time DATETIME,
        pnl REAL,
        commission REAL NOT NULL,
        entry_reason TEXT,
        exit_reason TEXT,
        strategy_name TEXT,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
      CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy_name);
      CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
      CREATE INDEX IF NOT EXISTS idx_trades_symbol_entry_time ON trades(symbol, entry_time);
    `);

    this.logger.info('Trade database tables created');
  }

  private prepareStatements(): void {
    this.statements.saveTrade = this.db.prepare(`
      INSERT OR REPLACE INTO trades (
        id, symbol, side, quantity, entry_price, exit_price, entry_time, exit_time,
        pnl, commission, entry_reason, exit_reason, strategy_name, status
      ) VALUES (
        @id, @symbol, @side, @quantity, @entry_price, @exit_price, @entry_time, @exit_time,
        @pnl, @commission, @entry_reason, @exit_reason, @strategy_name, @status
      )
    `);

    this.statements.deleteOldTrades = this.db.prepare(`
      DELETE FROM trades WHERE entry_time < @beforeDate
    `);

    this.logger.info('Trade database statements prepared');
  }

  private mapRowToTrade(row: any): Trade {
    return {
      id: row.id,
      symbol: row.symbol,
      side: row.side,
      quantity: row.quantity,
      entryPrice: row.entry_price,
      exitPrice: row.exit_price,
      entryTime: new Date(row.entry_time),
      exitTime: row.exit_time ? new Date(row.exit_time) : undefined,
      pnl: row.pnl,
      commission: row.commission,
      entryReason: row.entry_reason,
      exitReason: row.exit_reason,
      strategyName: row.strategy_name,
      status: row.status
    };
  }

  private getStartDateForTimeframe(timeframe: string): Date {
    const now = new Date();
    
    switch (timeframe.toLowerCase()) {
      case '1d':
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '1w':
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1m':
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3m':
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to 1 month
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('TradeStore not initialized. Call initialize() first.');
    }
  }
}