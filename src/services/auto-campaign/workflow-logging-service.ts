/**
 * 工作流日志服务
 * 负责记录和查询工作流执行日志
 */

import { dbInstance as db } from '@/lib/db';
import { workflowLogs } from '@/storage/database/shared/schema';
import { logger } from '@/core/logger';
import { generateId } from '@/shared/utils/string';
import { eq, and, desc, gt, sql } from 'drizzle-orm';
import type { LogLevel } from '@/storage/database/shared/schema';

export interface LogParams {
  campaignId: string;
  stepId: string;
  level: LogLevel;
  message: string;
  details?: Record<string, any> | null;
}

export class WorkflowLoggingService {
  private static instance: WorkflowLoggingService;

  private constructor() {}

  static getInstance(): WorkflowLoggingService {
    if (!WorkflowLoggingService.instance) {
      WorkflowLoggingService.instance = new WorkflowLoggingService();
    }
    return WorkflowLoggingService.instance;
  }

  /**
   * 记录日志
   */
  async log(params: LogParams): Promise<void> {
    const { campaignId, stepId, level, message, details } = params;

    try {
      await db.insert(workflowLogs).values({
        id: generateId(),
        campaignId,
        stepId,
        level,
        message,
        details: details || null,
        timestamp: new Date(),
      });

      // 同时输出到控制台日志
      const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
      logger[logMethod](`[Workflow:${stepId}] ${message}`, {
        campaignId,
        stepId,
        level,
        details,
      });
    } catch (error) {
      logger.error('[WorkflowLogging] Failed to log', error as Error, {
        campaignId,
        stepId,
        level,
        message,
      });
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 记录信息日志
   */
  async info(
    campaignId: string,
    stepId: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({ campaignId, stepId, level: 'info', message, details });
  }

  /**
   * 记录警告日志
   */
  async warn(
    campaignId: string,
    stepId: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({ campaignId, stepId, level: 'warn', message, details });
  }

  /**
   * 记录错误日志
   */
  async error(
    campaignId: string,
    stepId: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({ campaignId, stepId, level: 'error', message, details });
  }

  /**
   * 记录调试日志
   */
  async debug(
    campaignId: string,
    stepId: string,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({ campaignId, stepId, level: 'debug', message, details });
  }

  /**
   * 获取活动的日志
   */
  async getLogs(
    campaignId: string,
    options?: {
      limit?: number;
      level?: LogLevel;
      stepId?: string;
      offset?: number;
    }
  ): Promise<any[]> {
    const { limit = 100, level, stepId, offset = 0 } = options || {};

    try {
      const conditions = [eq(workflowLogs.campaignId, campaignId)];

      if (level) {
        conditions.push(eq(workflowLogs.level, level));
      }

      if (stepId) {
        conditions.push(eq(workflowLogs.stepId, stepId));
      }

      const logs = await db
        .select()
        .from(workflowLogs)
        .where(and(...conditions))
        .orderBy(desc(workflowLogs.timestamp))
        .limit(limit)
        .offset(offset);

      return logs.reverse(); // 返回按时间正序排列
    } catch (error) {
      logger.error('[WorkflowLogging] Failed to get logs', error as Error, { campaignId });
      throw error;
    }
  }

  /**
   * 获取最近的日志
   */
  async getRecentLogs(
    campaignId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const logs = await db
        .select()
        .from(workflowLogs)
        .where(eq(workflowLogs.campaignId, campaignId))
        .orderBy(desc(workflowLogs.timestamp))
        .limit(limit);

      return logs.reverse();
    } catch (error) {
      logger.error('[WorkflowLogging] Failed to get recent logs', error as Error, { campaignId });
      throw error;
    }
  }

  /**
   * 获取错误日志
   */
  async getErrorLogs(
    campaignId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const logs = await db
        .select()
        .from(workflowLogs)
        .where(
          and(
            eq(workflowLogs.campaignId, campaignId),
            eq(workflowLogs.level, 'error')
          )
        )
        .orderBy(desc(workflowLogs.timestamp))
        .limit(limit);

      return logs.reverse();
    } catch (error) {
      logger.error('[WorkflowLogging] Failed to get error logs', error as Error, { campaignId });
      throw error;
    }
  }

  /**
   * 清除活动的日志
   */
  async clearLogs(campaignId: string): Promise<number> {
    try {
      const result = await db
        .delete(workflowLogs)
        .where(eq(workflowLogs.campaignId, campaignId));

      logger.info('[WorkflowLogging] Logs cleared', { campaignId });

      return result.rowCount || 0;
    } catch (error) {
      logger.error('[WorkflowLogging] Failed to clear logs', error as Error, { campaignId });
      throw error;
    }
  }

  /**
   * 获取日志统计
   */
  async getLogStats(campaignId: string): Promise<{
    total: number;
    info: number;
    warn: number;
    error: number;
    debug: number;
  }> {
    try {
      const logs = await db
        .select({
          level: workflowLogs.level,
          count: sql<number>`count(*)`.as('count'),
        })
        .from(workflowLogs)
        .where(eq(workflowLogs.campaignId, campaignId))
        .groupBy(workflowLogs.level);

      const stats = {
        total: 0,
        info: 0,
        warn: 0,
        error: 0,
        debug: 0,
      };

      for (const log of logs) {
        stats.total += log.count;
        stats[log.level as keyof typeof stats] = log.count;
      }

      return stats;
    } catch (error) {
      logger.error('[WorkflowLogging] Failed to get log stats', error as Error, { campaignId });
      return {
        total: 0,
        info: 0,
        warn: 0,
        error: 0,
        debug: 0,
      };
    }
  }

  /**
   * 批量记录日志
   */
  async batchLogs(logParams: LogParams[]): Promise<void> {
    try {
      const values = logParams.map(params => ({
        id: generateId(),
        campaignId: params.campaignId,
        stepId: params.stepId,
        level: params.level,
        message: params.message,
        details: params.details || null,
        timestamp: new Date(),
      }));

      await db.insert(workflowLogs).values(values);

      logger.info('[WorkflowLogging] Batch logs recorded', { count: logParams.length });
    } catch (error) {
      logger.error('[WorkflowLogging] Failed to batch logs', error as Error, {
        count: logParams.length,
      });
    }
  }
}

export const workflowLoggingService = WorkflowLoggingService.getInstance();
