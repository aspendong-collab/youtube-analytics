import { google } from 'googleapis';

// 缓存接口
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// YouTube API客户端 - 优化版（带缓存）
class YouTubeAPIClient {
  private youtube: any;
  private cache: Map<string, CacheEntry<any>>;
  private quotaUsed: number = 0;
  private readonly dailyQuota = 10000;
  private readonly defaultCacheTTL = 30 * 60 * 1000; // 30分钟

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
    this.cache = new Map();
  }

  // ========== 缓存管理 ==========

  private setCache<T>(key: string, data: T, ttl: number = this.defaultCacheTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // ========== 配额管理 ==========

  private checkQuota(required: number): boolean {
    return (this.quotaUsed + required) <= this.dailyQuota;
  }

  private useQuota(units: number): void {
    this.quotaUsed += units;
    console.log(`Quota used: ${this.quotaUsed}/${this.dailyQuota}`);
  }

  public resetQuota(): void {
    this.quotaUsed = 0;
  }

  public getQuotaUsage(): { used: number; remaining: number; percentage: number } {
    return {
      used: this.quotaUsed,
      remaining: this.dailyQuota - this.quotaUsed,
      percentage: (this.quotaUsed / this.dailyQuota) * 100,
    };
  }

  // ========== 批量请求优化 ==========

  /**
   * 批量获取视频详情
   * @param videoIds 视频ID数组（最多50个）
   */
  async getVideosDetails(videoIds: string[]): Promise<any[]> {
    const cacheKey = `videos:${videoIds.join(',')}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    const required = videoIds.length * 3;
    if (!this.checkQuota(required)) {
      throw new Error('Quota exceeded');
    }

    try {
      // 分批处理，每批最多50个
      const batches: string[][] = [];
      for (let i = 0; i < videoIds.length; i += 50) {
        batches.push(videoIds.slice(i, i + 50));
      }

      const results: any[] = [];
      for (const batch of batches) {
        const response = await this.youtube.videos.list({
          part: ['snippet', 'statistics', 'contentDetails', 'topicDetails'],
          id: batch.join(','),
          maxResults: 50,
        });

        this.useQuota(batch.length * 3);
        results.push(...(response.data.items || []));
      }

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Videos details error:', error);
      throw error;
    }
  }

  /**
   * 批量获取频道详情
   * @param channelIds 频道ID数组（最多50个）
   */
  async getChannelsDetails(channelIds: string[]): Promise<any[]> {
    const cacheKey = `channels:${channelIds.join(',')}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    const required = channelIds.length * 3;
    if (!this.checkQuota(required)) {
      throw new Error('Quota exceeded');
    }

    try {
      // 分批处理，每批最多50个
      const batches: string[][] = [];
      for (let i = 0; i < channelIds.length; i += 50) {
        batches.push(channelIds.slice(i, i + 50));
      }

      const results: any[] = [];
      for (const batch of batches) {
        const response = await this.youtube.channels.list({
          part: [
            'snippet',
            'statistics',
            'brandingSettings',
            'contentDetails',
            'topicDetails',
          ],
          id: batch.join(','),
          maxResults: 50,
        });

        this.useQuota(batch.length * 3);
        results.push(...(response.data.items || []));
      }

      this.setCache(cacheKey, results);
      return results;
    } catch (error) {
      console.error('Channels details error:', error);
      throw error;
    }
  }

  /**
   * 获取频道近期视频（优化版：使用缓存）
   * @param channelId 频道ID
   * @param maxResults 最多返回视频数（默认10）
   */
  async getChannelRecentVideos(
    channelId: string,
    maxResults: number = 10
  ): Promise<any[]> {
    const cacheKey = `recent:${channelId}:${maxResults}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    try {
      // 步骤1：获取频道的uploads playlist ID
      const channels = await this.getChannelsDetails([channelId]);
      if (!channels[0]) return [];

      const uploadsPlaylistId = channels[0].contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) return [];

      // 步骤2：获取playlist items（缓存）
      const playlistCacheKey = `playlist:${uploadsPlaylistId}:${maxResults}`;
      let playlistItems = this.getCache<any[]>(playlistCacheKey);

      if (!playlistItems) {
        const response = await this.youtube.playlistItems.list({
          part: ['snippet', 'contentDetails'],
          playlistId: uploadsPlaylistId,
          maxResults: Math.min(maxResults, 50),
        });

        playlistItems = response.data.items || [];
        this.setCache(playlistCacheKey, playlistItems, 10 * 60 * 1000); // 10分钟缓存
      }

      const videoIds = playlistItems
        .map((item: any) => item.contentDetails?.videoId)
        .filter(Boolean);

      // 步骤3：获取视频详情（批量请求，已缓存）
      if (videoIds.length > 0) {
        const videos = await this.getVideosDetails(videoIds);
        this.setCache(cacheKey, videos, 15 * 60 * 1000); // 15分钟缓存
        return videos;
      }

      return [];
    } catch (error) {
      console.error('Recent videos error:', error);
      throw error;
    }
  }

  /**
   * 搜索达人（优化版）
   * @param params 搜索参数
   */
  async searchInfluencers(params: {
    query: string;
    maxResults?: number;
    type?: 'channel' | 'video';
    order?: 'date' | 'relevance' | 'viewCount';
    publishedAfter?: string;
    relevanceLanguage?: string;
    regionCode?: string;
  }): Promise<any[]> {
    const cacheKey = `search:${params.query}:${params.maxResults || 50}:${params.type || 'video'}:${params.relevanceLanguage || 'all'}:${params.regionCode || 'all'}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    const required = 100;
    if (!this.checkQuota(required)) {
      throw new Error('Quota exceeded');
    }

    try {
      const searchParams: any = {
        q: params.query,
        part: ['snippet', 'id'],
        maxResults: params.maxResults || 50,
        type: params.type || 'video',
        order: params.order || 'relevance',
      };

      // 添加可选参数
      if (params.relevanceLanguage) {
        searchParams.relevanceLanguage = params.relevanceLanguage;
      }
      
      if (params.publishedAfter) {
        searchParams.publishedAfter = params.publishedAfter;
      }

      if (params.regionCode) {
        searchParams.regionCode = params.regionCode;
      }

      const response = await this.youtube.search.list(searchParams);

      this.useQuota(required);
      this.setCache(cacheKey, response.data.items || [], 20 * 60 * 1000); // 20分钟缓存
      return response.data.items || [];
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * 获取热门视频
   * @param params 参数
   */
  async getPopularVideos(params: {
    regionCode?: string;
    categoryId?: string;
    maxResults?: number;
  }): Promise<any[]> {
    const cacheKey = `popular:${params.regionCode || 'US'}:${params.categoryId || 'all'}:${params.maxResults || 50}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    const required = 100;
    if (!this.checkQuota(required)) {
      throw new Error('Quota exceeded');
    }

    try {
      const response = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'contentDetails'],
        chart: 'mostPopular',
        regionCode: params.regionCode || 'US',
        videoCategoryId: params.categoryId,
        maxResults: params.maxResults || 50,
      });

      this.useQuota(required);
      this.setCache(cacheKey, response.data.items || [], 30 * 60 * 1000); // 30分钟缓存
      return response.data.items || [];
    } catch (error) {
      console.error('Popular videos error:', error);
      throw error;
    }
  }

  /**
   * 获取视频分类
   * @param regionCode 地区代码
   */
  async getVideoCategories(regionCode: string = 'US'): Promise<any[]> {
    const cacheKey = `categories:${regionCode}`;
    const cached = this.getCache<any[]>(cacheKey);
    if (cached) return cached;

    const required = 1;
    if (!this.checkQuota(required)) {
      throw new Error('Quota exceeded');
    }

    try {
      const response = await this.youtube.videoCategories.list({
        part: ['snippet'],
        regionCode,
      });

      this.useQuota(required);
      this.setCache(cacheKey, response.data.items || [], 60 * 60 * 1000); // 1小时缓存
      return response.data.items || [];
    } catch (error) {
      console.error('Categories error:', error);
      throw error;
    }
  }

  /**
   * 批量获取达人档案（优化版）
   * @param channelIds 频道ID数组
   * @param options 选项
   */
  async getInfluencerProfiles(
    channelIds: string[],
    options: {
      includeRecentVideos?: boolean;
      recentVideosCount?: number;
    } = {}
  ): Promise<any[]> {
    // 去重
    const uniqueChannelIds = [...new Set(channelIds)];

    // 批量获取频道详情
    const channels = await this.getChannelsDetails(uniqueChannelIds);

    // 批量获取近期视频
    let videosMap: Map<string, any[]> = new Map();
    if (options.includeRecentVideos) {
      const videoPromises = uniqueChannelIds.map(channelId =>
        this.getChannelRecentVideos(channelId, options.recentVideosCount || 10)
      );

      const videosResults = await Promise.all(videoPromises);
      uniqueChannelIds.forEach((channelId, index) => {
        videosMap.set(channelId, videosResults[index]);
      });
    }

    // 组装数据
    return channels.map(channel => ({
      channel,
      recentVideos: videosMap.get(channel.id) || [],
    }));
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// 导出单例
export const youtubeClient = new YouTubeAPIClient();
