/**
 * 日志格式化器
 */

import { LogEntry } from './types';

/**
 * 格式化日志条目为文本
 */
export function formatLogText(entry: LogEntry): string {
  const timestamp = entry.timestamp;
  const level = entry.level.toUpperCase().padEnd(5);
  const module = entry.context?.module || 'app';
  const action = entry.context?.action || '';
  const userId = entry.context?.userId || '';
  
  let parts = [timestamp, level, module];
  if (userId) parts.push(`[user:${userId}]`);
  if (action) parts.push(`[action:${action}]`);
  parts.push(entry.message);
  
  return parts.join(' ');
}

/**
 * 格式化日志条目为 JSON
 */
export function formatLogJson(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * 格式化日志条目为彩色控制台输出
 */
export function formatLogConsole(entry: LogEntry): string {
  const colors = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m', // green
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
    fatal: '\x1b[35m', // magenta
  };
  
  const reset = '\x1b[0m';
  const color = colors[entry.level] || reset;
  
  return `${color}${formatLogText(entry)}${reset}`;
}

/**
 * 格式化错误对象
 */
export function formatError(error: Error): Record<string, any> {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}
