/**
 * 日志级别定义
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export type LogLevelName = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * 日志上下文
 */
export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  module?: string;
  action?: string;
  [key: string]: any;
}

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevelName;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
  meta?: Record<string, any>;
}

/**
 * 日志选项
 */
export interface LoggerOptions {
  level?: LogLevelName;
  enableConsole?: boolean;
  enableFile?: boolean;
  enableDatabase?: boolean;
  context?: LogContext;
}
