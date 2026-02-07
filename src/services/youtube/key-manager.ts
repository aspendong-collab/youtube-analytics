/**
 * YouTube API Key 管理器
 * 支持轮询和智能调度，解决每日 10000 配额限制
 */

import { cache, youtubeKeys } from '@/core/cache';
import { config } from '@/core/config';
import { logger } from '@/core/logger';
import { YOUTUBE_CONSTANTS } from '@/shared/constants';

interface ApiKeyInfo {
  key: string;
  quotaUsed: number;
  quotaLimit: number;
  lastUsedAt: Date;
  isAvailable: boolean;
  usageRate: number; // 0-1
}

export class YouTubeApiKeyManager {
  private static instance: YouTubeApiKeyManager;
  private keys: ApiKeyInfo[] = [];
  private currentIndex: number = 0;

  private constructor() {
    this.initializeKeys();
  }

  static getInstance(): YouTubeApiKeyManager {
    if (!YouTubeApiKeyManager.instance) {
      YouTubeApiKeyManager.instance = new YouTubeApiKeyManager();
    }
    return YouTubeApiKeyManager.instance;
  }

  /**
   * 初始化 API Keys
   */
  private initializeKeys(): void {
    const apiKeys = config.get('youtube.apiKeys') as string[] || [];
    const quotaLimit = config.get('youtube.apiQuotaLimit') as number || YOUTUBE_CONSTANTS.QUOTA_LIMIT;

    this.keys = apiKeys.map(key => ({
      key,
      quotaUsed: 0,
      quotaLimit,
      lastUsedAt: new Date(0),
      isAvailable: true,
      usageRate: 0,
    }));

    logger.info('YouTube API Keys initialized', { count: this.keys.length });
  }

  /**
   * 获取下一个可用的 API Key
   */
  getNextKey(): string | null {
    if (this.keys.length === 0) {
      logger.error('No YouTube API keys available');
      return null;
    }

    // 尝试找到可用的 key
    for (let attempts = 0; attempts < this.keys.length; attempts++) {
      const keyInfo = this.keys[this.currentIndex];
      
      if (keyInfo.isAvailable && keyInfo.quotaUsed < keyInfo.quotaLimit) {
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return keyInfo.key;
      }
      
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }

    logger.error('All YouTube API keys quota exhausted');
    return null;
  }

  /**
   * 记录 API 使用
   */
  recordUsage(key: string, units: number): void {
    const keyInfo = this.keys.find(k => k.key === key);
    if (!keyInfo) {
      logger.warn('API key not found', { key });
      return;
    }

    keyInfo.quotaUsed += units;
    keyInfo.lastUsedAt = new Date();
    keyInfo.usageRate = keyInfo.quotaUsed / keyInfo.quotaLimit;

    // 检查是否超过配额
    if (keyInfo.quotaUsed >= keyInfo.quotaLimit) {
      keyInfo.isAvailable = false;
      logger.warn('API key quota exhausted', { key, quotaUsed: keyInfo.quotaUsed });
    }

    // 更新缓存
    this.updateCache();
  }

  /**
   * 获取所有 API Keys 状态
   */
  getAllKeysStatus(): ApiKeyInfo[] {
    return [...this.keys];
  }

  /**
   * 重置已过期的配额
   */
  resetExpiredQuota(): number {
    const resetHour = config.get('youtube.quotaResetHour') as number || YOUTUBE_CONSTANTS.QUOTA_RESET_HOUR;
    const now = new Date();
    const currentHour = now.getUTCHours();

    let resetCount = 0;

    if (currentHour === resetHour) {
      this.keys.forEach(keyInfo => {
        if (!keyInfo.isAvailable && keyInfo.quotaUsed >= keyInfo.quotaLimit) {
          keyInfo.quotaUsed = 0;
          keyInfo.isAvailable = true;
          keyInfo.usageRate = 0;
          resetCount++;
          logger.info('API key quota reset', { key: keyInfo.key });
        }
      });

      this.updateCache();
    }

    return resetCount;
  }

  /**
   * 强制重置所有配额
   */
  forceResetAll(): void {
    this.keys.forEach(keyInfo => {
      keyInfo.quotaUsed = 0;
      keyInfo.isAvailable = true;
      keyInfo.usageRate = 0;
    });

    logger.info('All API key quotas force reset');
    this.updateCache();
  }

  /**
   * 添加新的 API Key
   */
  addKey(key: string, quotaLimit?: number): void {
    const limit = quotaLimit || (config.get('youtube.apiQuotaLimit') as number || YOUTUBE_CONSTANTS.QUOTA_LIMIT);
    
    this.keys.push({
      key,
      quotaUsed: 0,
      quotaLimit: limit,
      lastUsedAt: new Date(0),
      isAvailable: true,
      usageRate: 0,
    });

    logger.info('API key added', { key, quotaLimit: limit });
    this.updateCache();
  }

  /**
   * 移除 API Key
   */
  removeKey(key: string): boolean {
    const index = this.keys.findIndex(k => k.key === key);
    if (index === -1) {
      return false;
    }

    this.keys.splice(index, 1);
    logger.info('API key removed', { key });
    this.updateCache();
    return true;
  }

  /**
   * 获取配额使用统计
   */
  getQuotaStats(): {
    totalQuota: number;
    totalUsed: number;
    totalRemaining: number;
    availableKeys: number;
    keys: Array<{
      key: string;
      used: number;
      limit: number;
      remaining: number;
      isAvailable: boolean;
    }>;
  } {
    const totalQuota = this.keys.reduce((sum, k) => sum + k.quotaLimit, 0);
    const totalUsed = this.keys.reduce((sum, k) => sum + k.quotaUsed, 0);
    const availableKeys = this.keys.filter(k => k.isAvailable).length;

    return {
      totalQuota,
      totalUsed,
      totalRemaining: totalQuota - totalUsed,
      availableKeys,
      keys: this.keys.map(k => ({
        key: this.maskKey(k.key),
        used: k.quotaUsed,
        limit: k.quotaLimit,
        remaining: k.quotaLimit - k.quotaUsed,
        isAvailable: k.isAvailable,
      })),
    };
  }

  /**
   * 更新缓存
   */
  private updateCache(): void {
    const cacheKey = youtubeKeys.quota('status', 'all');
    cache.set(cacheKey, this.getQuotaStats(), { ttl: 300 });
  }

  /**
   * 遮盖 API Key
   */
  private maskKey(key: string): string {
    if (key.length <= 8) return '***';
    return key.substring(0, 4) + '***' + key.substring(key.length - 4);
  }
}

// 导出单例实例
export const youtubeApiKeyManager = YouTubeApiKeyManager.getInstance();
