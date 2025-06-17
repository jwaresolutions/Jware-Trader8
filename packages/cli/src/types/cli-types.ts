import { BacktestResult, StrategyConfig } from '@jware-trader8/types';

export interface CLIConfig {
  provider: 'alpaca' | 'polygon';
  environment: 'paper' | 'live' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxPositions: number;
  initialCapital: number;
  commission: number;
}

export interface TradeStartOptions {
  dryRun?: boolean;
  maxPositions?: number;
  symbol?: string;
  initialCapital?: number;
}

export interface BacktestOptions {
  symbol: string;
  start: string;
  end: string;
  timeframe?: string;
  initialCapital?: number;
  commission?: number;
  output?: 'table' | 'json' | 'csv';
  saveResults?: boolean;
}

export interface ConfigSetKeysOptions {
  provider?: 'alpaca' | 'polygon';
  interactive?: boolean;
}

export interface StatusOptions {
  detailed?: boolean;
  refresh?: number;
}

export interface OutputFormatter {
  formatTable(data: any[], headers: string[]): string;
  formatJSON(data: any): string;
  formatCSV(data: any[]): string;
}

export interface ProgressIndicator {
  start(message: string): void;
  update(message: string): void;
  succeed(message: string): void;
  fail(message: string): void;
  stop(): void;
}

export interface PromptHandler {
  promptForApiKeys(provider: string): Promise<{ apiKey: string; secretKey: string }>;
  promptForConfirmation(message: string): Promise<boolean>;
  promptForChoice(message: string, choices: string[]): Promise<string>;
  promptForInput(message: string, defaultValue?: string): Promise<string>;
  displayWelcome(): void;
  displaySuccess(message: string): void;
  displayError(message: string): void;
  displayWarning(message: string): void;
  displayInfo(message: string): void;
}

export interface CLIContext {
  config: CLIConfig;
  outputFormatter: OutputFormatter;
  progressIndicator: ProgressIndicator;
  promptHandler: PromptHandler;
}

export interface TradingSession {
  id: string;
  strategy: StrategyConfig;
  startTime: Date;
  status: 'running' | 'stopped' | 'error';
  positions: any[];
  pnl: number;
  totalTrades: number;
}

export interface BacktestDisplayResult extends BacktestResult {
  formattedSummary: string;
  formattedTrades: string;
  formattedEquityCurve: string;
}

export class CLIError extends Error {
  public code: string;
  public suggestion?: string;
  public exitCode: number;

  constructor(message: string, code: string, suggestion?: string, exitCode: number = 1) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
    this.suggestion = suggestion;
    this.exitCode = exitCode;
  }
}

export interface CommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: CLIError;
}

export interface StrategyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConnectionStatus {
  provider: string;
  connected: boolean;
  accountInfo?: any;
  error?: string;
}

export interface MarketDataStatus {
  provider: string;
  connected: boolean;
  lastUpdate?: Date;
  symbolsTracked: string[];
}

export interface SystemStatus {
  trading: ConnectionStatus;
  marketData: MarketDataStatus;
  database: {
    connected: boolean;
    lastBackup?: Date;
  };
}