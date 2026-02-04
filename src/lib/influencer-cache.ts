import { db } from '@/storage/database';
import { influencerCache } from '@/storage/database/shared/schema';
import { eq, and, gte, lt, inArray, desc } from 'drizzle-orm';
import type { InfluencerProfile } from '@/types/influencer';

/**
 * 缓存配置
 */
const CACHE_CONFIG = {
  // 默认 TTL（24小时）
  DEFAULT_TTL: 24 * 60 * 60 * 1000,
  // 搜索结果 TTL（6小时）
  SEARCH_TTL: 6 * 60 * 60 * 1000,
  // 热门视频 TTL（2小时）
  POPULAR_TTL: 2 * 60 * 60 * 1000,
  // 手动采集 TTL（48小时）
  MANUAL_TTL: 48 * 60 * 60 * 1000,
  // 数据质量阈值
  QUALITY_THRESHOLD: 60,
} as const;

/**
 * 缓存结果接口
 */
export interface CacheResult {
  hit: boolean;
  data?: InfluencerProfile;
  fromDb: boolean;
  quality: number;
  age: number; // 缓存年龄（毫秒）
}

/**
 * 缓存统计接口
 */
export interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  hitRate: number; // 命中率（0-100）
  averageQuality: number;
  oldestCacheAge: number; // 最旧缓存年龄（小时）
  newestCacheAge: number; // 最新缓存年龄（小时）
}

/**
 * 达人缓存服务
 */
class InfluencerCacheService {
  /**
   * 获取缓存
   * @param channelId 频道ID
   * @param forceRefresh 是否强制刷新
   */
  async get(channelId: string, forceRefresh: boolean = false): Promise<CacheResult> {
    try {
      console.log(`[InfluencerCache] 获取缓存: ${channelId}, forceRefresh: ${forceRefresh}`);

      // 如果强制刷新，直接返回未命中
      if (forceRefresh) {
        return {
          hit: false,
          fromDb: false,
          quality: 0,
          age: 0,
        };
      }

      // 查询数据库缓存
      const result = await db
        .select()
        .from(influencerCache)
        .where(and(
          eq(influencerCache.channelId, channelId),
          eq(influencerCache.isValid, true),
          gte(influencerCache.expiresAt, new Date())
        ))
        .limit(1);

      if (result.length === 0) {
        console.log(`[InfluencerCache] 未找到有效缓存: ${channelId}`);
        return {
          hit: false,
          fromDb: false,
          quality: 0,
          age: 0,
        };
      }

      const cacheEntry = result[0];
      const age = Date.now() - new Date(cacheEntry.cachedAt).getTime();

      // 检查数据质量
      if ((cacheEntry.dataQuality || 0) < CACHE_CONFIG.QUALITY_THRESHOLD) {
        console.log(`[InfluencerCache] 缓存数据质量不足: ${channelId}, quality: ${cacheEntry.dataQuality || 0}`);
        return {
          hit: false,
          fromDb: false,
          quality: cacheEntry.dataQuality || 0,
          age,
        };
      }

      // 更新命中次数
      await db
        .update(influencerCache)
        .set({
          hitCount: (cacheEntry.hitCount || 0) + 1,
          lastValidatedAt: new Date(),
        })
        .where(eq(influencerCache.id, cacheEntry.id));

      console.log(`[InfluencerCache] 缓存命中: ${channelId}, quality: ${cacheEntry.dataQuality || 0}, age: ${age}ms`);
      return {
        hit: true,
        data: cacheEntry.cachedData as InfluencerProfile,
        fromDb: true,
        quality: cacheEntry.dataQuality || 0,
        age,
      };
    } catch (error) {
      console.error('[InfluencerCache] 获取缓存失败:', error);
      return {
        hit: false,
        fromDb: false,
        quality: 0,
        age: 0,
      };
    }
  }

  /**
   * 批量获取缓存
   * @param channelIds 频道ID数组
   * @param forceRefresh 是否强制刷新
   */
  async getBatch(channelIds: string[], forceRefresh: boolean = false): Promise<Map<string, CacheResult>> {
    const results = new Map<string, CacheResult>();

    if (forceRefresh || channelIds.length === 0) {
      channelIds.forEach(channelId => {
        results.set(channelId, {
          hit: false,
          fromDb: false,
          quality: 0,
          age: 0,
        });
      });
      return results;
    }

    try {
      console.log(`[InfluencerCache] 批量获取缓存: ${channelIds.length} 个频道`);

      // 查询数据库缓存
      const cacheEntries = await db
        .select()
        .from(influencerCache)
        .where(and(
          inArray(influencerCache.channelId, channelIds),
          eq(influencerCache.isValid, true),
          gte(influencerCache.expiresAt, new Date())
        ));

      // 构建结果 Map
      channelIds.forEach(channelId => {
        const cacheEntry = cacheEntries.find(entry => entry.channelId === channelId);
        
        if (!cacheEntry) {
          results.set(channelId, {
            hit: false,
            fromDb: false,
            quality: 0,
            age: 0,
          });
          return;
        }

        const age = Date.now() - new Date(cacheEntry.cachedAt).getTime();

        // 检查数据质量
        if ((cacheEntry.dataQuality || 0) < CACHE_CONFIG.QUALITY_THRESHOLD) {
          results.set(channelId, {
            hit: false,
            fromDb: false,
            quality: cacheEntry.dataQuality || 0,
            age,
          });
          return;
        }

        // 更新命中次数
        db.update(influencerCache)
          .set({
            hitCount: (cacheEntry.hitCount || 0) + 1,
            lastValidatedAt: new Date(),
          })
          .where(eq(influencerCache.id, cacheEntry.id))
          .catch(err => console.error('[InfluencerCache] 更新命中次数失败:', err));

        results.set(channelId, {
          hit: true,
          data: cacheEntry.cachedData as InfluencerProfile,
          fromDb: true,
          quality: cacheEntry.dataQuality || 0,
          age,
        });
      });

      console.log(`[InfluencerCache] 批量获取缓存完成: ${results.size} 个结果，命中 ${Array.from(results.values()).filter(r => r.hit).length} 个`);
      return results;
    } catch (error) {
      console.error('[InfluencerCache] 批量获取缓存失败:', error);
      channelIds.forEach(channelId => {
        results.set(channelId, {
          hit: false,
          fromDb: false,
          quality: 0,
          age: 0,
        });
      });
      return results;
    }
  }

  /**
   * 设置缓存
   * @param channelId 频道ID
   * @param data 达人数据
   * @param options 缓存选项
   */
  async set(
    channelId: string,
    data: InfluencerProfile,
    options: {
      source?: 'search' | 'popular' | 'manual';
      searchKeyword?: string;
      searchRegion?: string;
      searchLanguage?: string;
      ttl?: number;
    } = {}
  ): Promise<boolean> {
    try {
      console.log(`[InfluencerCache] 设置缓存: ${channelId}, source: ${options.source || 'search'}`);

      // 计算 TTL
      let ttl = options.ttl || CACHE_CONFIG.DEFAULT_TTL;
      if (options.source === 'search') ttl = CACHE_CONFIG.SEARCH_TTL;
      else if (options.source === 'popular') ttl = CACHE_CONFIG.POPULAR_TTL;
      else if (options.source === 'manual') ttl = CACHE_CONFIG.MANUAL_TTL;

      // 计算过期时间
      const expiresAt = new Date(Date.now() + ttl);

      // 计算数据质量
      const dataQuality = this.calculateDataQuality(data);

      // 检查是否已存在
      const existing = await db
        .select()
        .from(influencerCache)
        .where(eq(influencerCache.channelId, channelId))
        .limit(1);

      if (existing.length > 0) {
        // 更新现有缓存
        await db
          .update(influencerCache)
          .set({
            cachedData: data as any,
            isValid: true,
            dataQuality,
            expiresAt,
            lastRefreshedAt: new Date(),
            lastValidatedAt: new Date(),
            source: options.source || existing[0].source,
            searchKeyword: options.searchKeyword || existing[0].searchKeyword,
            searchRegion: options.searchRegion || existing[0].searchRegion,
            searchLanguage: options.searchLanguage || existing[0].searchLanguage,
          })
          .where(eq(influencerCache.id, existing[0].id));

        console.log(`[InfluencerCache] 更新缓存成功: ${channelId}, quality: ${dataQuality}`);
      } else {
        // 创建新缓存
        await db
          .insert(influencerCache)
          .values({
            channelId,
            cachedData: data as any,
            source: options.source || 'search',
            searchKeyword: options.searchKeyword,
            searchRegion: options.searchRegion,
            searchLanguage: options.searchLanguage,
            isValid: true,
            dataQuality,
            expiresAt,
            lastValidatedAt: new Date(),
            lastRefreshedAt: new Date(),
          });

        console.log(`[InfluencerCache] 创建缓存成功: ${channelId}, quality: ${dataQuality}`);
      }

      return true;
    } catch (error) {
      console.error('[InfluencerCache] 设置缓存失败:', error);
      return false;
    }
  }

  /**
   * 批量设置缓存
   * @param profiles 达人数据数组
   * @param options 缓存选项
   */
  async setBatch(
    profiles: InfluencerProfile[],
    options: {
      source?: 'search' | 'popular' | 'manual';
      searchKeyword?: string;
      searchRegion?: string;
      searchLanguage?: string;
      ttl?: number;
    } = {}
  ): Promise<number> {
    let successCount = 0;

    for (const profile of profiles) {
      const success = await this.set(profile.channelId, profile, options);
      if (success) successCount++;
    }

    console.log(`[InfluencerCache] 批量设置缓存完成: ${successCount}/${profiles.length} 成功`);
    return successCount;
  }

  /**
   * 删除缓存
   * @param channelId 频道ID
   */
  async delete(channelId: string): Promise<boolean> {
    try {
      console.log(`[InfluencerCache] 删除缓存: ${channelId}`);

      const result = await db
        .delete(influencerCache)
        .where(eq(influencerCache.channelId, channelId))
        .returning();

      console.log(`[InfluencerCache] 删除缓存完成: ${result.length} 条记录`);
      return result.length > 0;
    } catch (error) {
      console.error('[InfluencerCache] 删除缓存失败:', error);
      return false;
    }
  }

  /**
   * 批量删除缓存
   * @param channelIds 频道ID数组
   */
  async deleteBatch(channelIds: string[]): Promise<number> {
    try {
      console.log(`[InfluencerCache] 批量删除缓存: ${channelIds.length} 个频道`);

      const result = await db
        .delete(influencerCache)
        .where(inArray(influencerCache.channelId, channelIds))
        .returning();

      console.log(`[InfluencerCache] 批量删除缓存完成: ${result.length} 条记录`);
      return result.length;
    } catch (error) {
      console.error('[InfluencerCache] 批量删除缓存失败:', error);
      return 0;
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpired(): Promise<number> {
    try {
      console.log('[InfluencerCache] 清理过期缓存...');

      const result = await db
        .delete(influencerCache)
        .where(lt(influencerCache.expiresAt, new Date()))
        .returning();

      console.log(`[InfluencerCache] 清理过期缓存完成: ${result.length} 条记录`);
      return result.length;
    } catch (error) {
      console.error('[InfluencerCache] 清理过期缓存失败:', error);
      return 0;
    }
  }

  /**
   * 获取缓存统计
   */
  async getStats(): Promise<CacheStats> {
    try {
      console.log('[InfluencerCache] 获取缓存统计...');

      const allEntries = await db.select().from(influencerCache);
      const validEntries = allEntries.filter(entry => entry.isValid);
      const expiredEntries = allEntries.filter(entry => !entry.isValid || new Date(entry.expiresAt) < new Date());

      const totalHits = allEntries.reduce((sum, entry) => sum + (entry.hitCount || 0), 0);
      const totalRequests = totalHits + (allEntries.length * 2); // 估算总请求次数
      const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

      const averageQuality = validEntries.length > 0
        ? validEntries.reduce((sum, entry) => sum + (entry.dataQuality || 0), 0) / validEntries.length
        : 0;

      const now = Date.now();
      const cacheAges = validEntries.map(entry => now - new Date(entry.cachedAt).getTime());
      const oldestCacheAge = cacheAges.length > 0 ? Math.max(...cacheAges) / (1000 * 60 * 60) : 0;
      const newestCacheAge = cacheAges.length > 0 ? Math.min(...cacheAges) / (1000 * 60 * 60) : 0;

      return {
        totalEntries: allEntries.length,
        validEntries: validEntries.length,
        expiredEntries: expiredEntries.length,
        hitRate,
        averageQuality,
        oldestCacheAge,
        newestCacheAge,
      };
    } catch (error) {
      console.error('[InfluencerCache] 获取缓存统计失败:', error);
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        hitRate: 0,
        averageQuality: 0,
        oldestCacheAge: 0,
        newestCacheAge: 0,
      };
    }
  }

  /**
   * 计算数据质量
   * @param data 达人数据
   */
  private calculateDataQuality(data: InfluencerProfile): number {
    let score = 0;

    // 1. 基础信息完整性（40分）
    if (data.channelTitle) score += 10;
    if (data.channelThumbnail) score += 10;
    if (data.description && data.description.length > 50) score += 10;
    if (data.subscriberCount > 0) score += 10;

    // 2. 统计数据完整性（30分）
    if (data.viewCount > 0) score += 10;
    if (data.avgViews > 0) score += 10;
    if (data.engagementRate > 0) score += 10;

    // 3. 视频数据完整性（20分）
    if (data.recentVideos && data.recentVideos.length > 0) {
      score += 10;
      if (data.recentVideos.length >= 5) score += 10;
    }

    // 4. 推断数据（10分）
    if (data.inferredEmail || data.contactInfo?.email) score += 5;
    if (data.inferredCountry) score += 3;
    if (data.inferredLanguage) score += 2;

    return Math.min(score, 100);
  }
}

// 导出单例
export const influencerCacheService = new InfluencerCacheService();
