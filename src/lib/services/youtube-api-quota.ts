import { db } from '@/storage/database/db';
import { youtubeApiQuota, apiCallLogs } from '@/storage/database/shared/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import type { ApiType, ApiOperation } from '@/storage/database/shared/schema';

/**
 * YouTube API 配额消耗标准
 * 参考：https://developers.google.com/youtube/v3/determine_quota_cost
 */
export const QUOTA_COSTS: Record<ApiOperation, number> = {
  'search.list': 100,
  'videos.list': 1,
  'channels.list': 1,
  'commentThreads.list': 1,
  'videoCategories.list': 1,
};

/**
 * 默认配额限制（每日10000单位）
 */
const DEFAULT_DAILY_QUOTA = 10000;

/**
 * 配额信息接口
 */
export interface QuotaInfo {
  apiType: ApiType;
  date: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  isExhausted: boolean;
}

/**
 * API 调用记录
 */
export interface ApiCallRecord {
  id: string;
  apiType: ApiType;
  operation: ApiOperation;
  quotaCost: number;
  success: boolean;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
}

/**
 * YouTube API 配额追踪服务
 */
export class YoutubeApiQuotaService {
  /**
   * 获取当日配额信息
   */
  async getTodayQuota(apiType: ApiType): Promise<QuotaInfo> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // 查询或创建当日配额记录
    const quotaRecords = await db
      .select()
      .from(youtubeApiQuota)
      .where(and(
        eq(youtubeApiQuota.date, dateStr),
        eq(youtubeApiQuota.apiType, apiType)
      ));

    let quota = quotaRecords[0];

    // 如果不存在记录，创建新记录
    if (!quota) {
      await db.insert(youtubeApiQuota).values({
        date: dateStr,
        apiType,
        quotaUsed: 0,
        quotaLimit: DEFAULT_DAILY_QUOTA,
        lastResetAt: today,
      });

      quota = {
        id: '',
        date: dateStr,
        apiType,
        quotaUsed: 0,
        quotaLimit: DEFAULT_DAILY_QUOTA,
        lastResetAt: today,
        createdAt: today,
        updatedAt: null,
      };
    }

    const used = quota.quotaUsed;
    const limit = quota.quotaLimit;
    const remaining = limit - used;
    const percentage = (used / limit) * 100;

    return {
      apiType,
      date: dateStr,
      used,
      limit,
      remaining: Math.max(0, remaining),
      percentage,
      isExhausted: remaining <= 0,
    };
  }

  /**
   * 获取所有 API 类型的配额信息
   */
  async getAllQuotas(): Promise<Record<ApiType, QuotaInfo>> {
    const apiTypes: ApiType[] = ['search', 'videos', 'channels', 'commentThreads', 'videoCategories'];
    const quotas: Record<string, QuotaInfo> = {};

    for (const apiType of apiTypes) {
      quotas[apiType] = await this.getTodayQuota(apiType);
    }

    return quotas as Record<ApiType, QuotaInfo>;
  }

  /**
   * 检查是否可以执行 API 调用
   */
  async canMakeCall(apiType: ApiType, operation: ApiOperation): Promise<boolean> {
    const quota = await this.getTodayQuota(apiType);
    const cost = QUOTA_COSTS[operation] || 1;
    return quota.remaining >= cost;
  }

  /**
   * 记录 API 调用
   */
  async recordApiCall(
    apiType: ApiType,
    operation: ApiOperation,
    success: boolean = true,
    errorMessage: string | null = null,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const cost = QUOTA_COSTS[operation] || 1;
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    try {
      // 1. 记录 API 调用日志
      await db.insert(apiCallLogs).values({
        apiType,
        operation,
        quotaCost: cost,
        success,
        errorMessage,
        metadata,
        createdAt: today,
      });

      // 2. 如果调用成功，更新配额使用量
      if (success) {
        await db
          .update(youtubeApiQuota)
          .set({
            quotaUsed: sql`${youtubeApiQuota.quotaUsed} + ${cost}`,
            updatedAt: today,
          })
          .where(and(
            eq(youtubeApiQuota.date, dateStr),
            eq(youtubeApiQuota.apiType, apiType)
          ));
      }
    } catch (error) {
      console.error('Failed to record API call:', error);
    }
  }

  /**
   * 获取今日 API 调用日志
   */
  async getTodayLogs(limit: number = 100): Promise<ApiCallRecord[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await db
      .select()
      .from(apiCallLogs)
      .where(gte(apiCallLogs.createdAt, today))
      .orderBy(desc(apiCallLogs.createdAt))
      .limit(limit);

    return logs.map(log => ({
      id: log.id,
      apiType: log.apiType as ApiType,
      operation: log.operation as ApiOperation,
      quotaCost: log.quotaCost,
      success: log.success,
      errorMessage: log.errorMessage,
      metadata: log.metadata as Record<string, any>,
      createdAt: log.createdAt,
    }));
  }

  /**
   * 获取今日调用统计
   */
  async getTodayStats(): Promise<{
    totalCalls: number;
    successCalls: number;
    failedCalls: number;
    totalQuotaUsed: number;
    byApiType: Record<ApiType, { calls: number; quotaUsed: number }>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await db
      .select()
      .from(apiCallLogs)
      .where(gte(apiCallLogs.createdAt, today));

    const stats = {
      totalCalls: logs.length,
      successCalls: logs.filter(l => l.success).length,
      failedCalls: logs.filter(l => !l.success).length,
      totalQuotaUsed: logs.reduce((sum, l) => sum + (l.success ? l.quotaCost : 0), 0),
      byApiType: {} as Record<ApiType, { calls: number; quotaUsed: number }>,
    };

    const apiTypes: ApiType[] = ['search', 'videos', 'channels', 'commentThreads', 'videoCategories'];
    for (const apiType of apiTypes) {
      const apiLogs = logs.filter(l => l.apiType === apiType);
      stats.byApiType[apiType] = {
        calls: apiLogs.length,
        quotaUsed: apiLogs.reduce((sum, l) => sum + (l.success ? l.quotaCost : 0), 0),
      };
    }

    return stats;
  }

  /**
   * 重置配额（仅用于测试或特殊情况）
   */
  async resetQuota(apiType: ApiType): Promise<void> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    await db
      .update(youtubeApiQuota)
      .set({
        quotaUsed: 0,
        lastResetAt: today,
        updatedAt: today,
      })
      .where(and(
        eq(youtubeApiQuota.date, dateStr),
        eq(youtubeApiQuota.apiType, apiType)
      ));
  }
}

// 导出单例
export const youtubeApiQuotaService = new YoutubeApiQuotaService();
