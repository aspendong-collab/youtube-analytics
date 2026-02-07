/**
 * 日志器
 */

import { LogLevel, LogLevelName, LogContext, LoggerOptions, LogEntry } from './types';
import { consoleTransport } from './transports/console';
import { fileTransport } from './transports/file';
import { formatError } from './formatters';

export class Logger {
  private name: string;
  private level: LogLevel;
  private enableConsole: boolean;
  private enableFile: boolean;
  private defaultContext: LogContext;

  constructor(name: string, options: LoggerOptions = {}) {
    this.name = name;
    this.level = this.parseLevel(options.level || 'info');
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.defaultContext = {
      module: name,
      ...options.context,
    };
  }

  /**
   * 解析日志级别
   */
  private parseLevel(level: LogLevelName): LogLevel {
    return LogLevel[level.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO;
  }

  /**
   * 检查是否应该记录该级别的日志
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  /**
   * 创建日志条目
   */
  private createEntry(
    level: LogLevelName,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      context: { ...this.defaultContext, ...context },
      timestamp: new Date().toISOString(),
      error,
    };
  }

  /**
   * 传输日志
   */
  private async transport(entry: LogEntry): Promise<void> {
    if (this.enableConsole) {
      consoleTransport.transport(entry);
    }
    
    if (this.enableFile) {
      await fileTransport.transport(entry);
    }
  }

  /**
   * 记录日志
   */
  private async log(
    level: LogLevel,
    levelName: LogLevelName,
    message: string,
    context?: LogContext,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.createEntry(levelName, message, context, error);
    await this.transport(entry);
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, context?: LogContext): Promise<void> {
    return this.log(LogLevel.DEBUG, 'debug', message, context);
  }

  /**
   * INFO 级别日志
   */
  info(message: string, context?: LogContext): Promise<void> {
    return this.log(LogLevel.INFO, 'info', message, context);
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, context?: LogContext): Promise<void> {
    return this.log(LogLevel.WARN, 'warn', message, context);
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, error?: Error, context?: LogContext): Promise<void> {
    return this.log(LogLevel.ERROR, 'error', message, context, error);
  }

  /**
   * FATAL 级别日志
   */
  fatal(message: string, error?: Error, context?: LogContext): Promise<void> {
    return this.log(LogLevel.FATAL, 'fatal', message, context, error);
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevelName): void {
    this.level = this.parseLevel(level);
  }

  /**
   * 启用/禁用控制台日志
   */
  setConsole(enabled: boolean): void {
    this.enableConsole = enabled;
  }

  /**
   * 启用/禁用文件日志
   */
  setFile(enabled: boolean): void {
    this.enableFile = enabled;
  }

  /**
   * 创建子日志器
   */
  child(name: string, context?: LogContext): Logger {
    return new Logger(name, {
      level: LogLevel[this.level].toLowerCase() as LogLevelName,
      enableConsole: this.enableConsole,
      enableFile: this.enableFile,
      context: { ...this.defaultContext, ...context },
    });
  }
}

// 导出日志器工厂函数
export function createLogger(name: string, options?: LoggerOptions): Logger {
  return new Logger(name, options);
}

// 默认日志器
export const logger = createLogger('app');
