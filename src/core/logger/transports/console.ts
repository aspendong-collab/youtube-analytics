/**
 * 日志传输器 - 控制台传输器
 */

import { LogEntry } from './types';
import { formatLogConsole } from './formatters';

export class ConsoleTransport {
  /**
   * 传输日志到控制台
   */
  transport(entry: LogEntry): void {
    const formatted = formatLogConsole(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
      case 'fatal':
        console.error(formatted);
        if (entry.error) {
          console.error(entry.error);
        }
        break;
    }
  }
}

// 导出单例实例
export const consoleTransport = new ConsoleTransport();
