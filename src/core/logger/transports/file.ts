/**
 * 日志传输器 - 文件传输器
 */

import { LogEntry } from './types';
import { formatLogText } from '../formatters';
import { promises as fs } from 'fs';
import { join } from 'path';

const LOG_DIR = '/app/work/logs/bypass';

// 检查是否在 Vercel 环境
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;

export class FileTransport {
  private buffers: Map<string, string[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private bufferSize: number = 100;
  private enabled: boolean;

  constructor() {
    // 在 Vercel 环境中禁用文件日志
    this.enabled = !isVercel;
    if (this.enabled) {
      this.startFlushInterval();
    }
  }

  /**
   * 传输日志到文件
   */
  async transport(entry: LogEntry): Promise<void> {
    // 在 Vercel 环境中，只输出到控制台
    if (!this.enabled) {
      return;
    }

    const logType = this.getLogType(entry.level);
    const buffer = this.buffers.get(logType) || [];

    const formatted = formatLogText(entry) + '\n';
    buffer.push(formatted);

    this.buffers.set(logType, buffer);

    // 缓冲区满了就刷新
    if (buffer.length >= this.bufferSize) {
      await this.flush(logType);
    }
  }

  /**
   * 根据日志级别获取日志文件名
   */
  private getLogType(level: string): string {
    if (level === 'error' || level === 'fatal') {
      return 'app';
    }
    return 'dev';
  }

  /**
   * 刷新缓冲区到文件
   */
  async flush(logType?: string): Promise<void> {
    const types = logType ? [logType] : Array.from(this.buffers.keys());
    
    for (const type of types) {
      const buffer = this.buffers.get(type);
      if (!buffer || buffer.length === 0) continue;
      
      const filePath = join(LOG_DIR, `${type}.log`);
      
      try {
        await fs.appendFile(filePath, buffer.join(''));
        this.buffers.set(type, []);
      } catch (error) {
        console.error(`Failed to write log to ${filePath}:`, error);
      }
    }
  }

  /**
   * 启动定时刷新
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // 每 5 秒刷新一次
  }

  /**
   * 停止定时刷新
   */
  async stop(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// 导出单例实例
export const fileTransport = new FileTransport();
