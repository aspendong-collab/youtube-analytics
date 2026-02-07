/**
 * YouTube API 服务
 */

import { youtubeApiKeyManager } from './key-manager';
import { logger } from '@/core/logger';
import { cache, youtubeKeys } from '@/core/cache';
import { YOUTUBE_CONSTANTS } from '@/shared/constants';
import { get, sleep } from '@/shared/utils/http';

interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: any;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails?: {
    duration: string;
  };
}

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: any;
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
  brandingSettings?: {
    channel: {
      country?: string;
    };
  };
  snippet2?: {
    defaultLanguage?: string;
  };
}

export class YouTubeService {
  private static instance: YouTubeService;
  private baseUrl = YOUTUBE_CONSTANTS.API_BASE_URL;

  private constructor() {}

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  /**
   * 执行 API 请求
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    // 获取可用的 API Key
    const apiKey = youtubeApiKeyManager.getNextKey();
    if (!apiKey) {
      throw new Error('No available YouTube API key');
    }

    const url = new URL(`${this.baseUrl}${endpoint}`, 'https://youtube.com');
    url.searchParams.append('key', apiKey);

    // 添加查询参数
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    logger.info('YouTube API request', { endpoint, params });

    try {
      const response = await get<T>(url.toString());
      
      // 记录配额使用（假设每个请求消耗 1 个单位）
      youtubeApiKeyManager.recordUsage(apiKey, 1);

      return response;
    } catch (error: any) {
      if (error.status === 403) {
        // 配额不足，标记该 key 为不可用
        youtubeApiKeyManager.recordUsage(apiKey, 999999);
        logger.error('YouTube API quota exceeded', error);
      }
      throw error;
    }
  }

  /**
   * 搜索视频
   */
  async searchVideos(params: {
    query: string;
    maxResults?: number;
    regionCode?: string;
    relevanceLanguage?: string;
    publishedAfter?: string;
    publishedBefore?: string;
  }): Promise<{
    videos: YouTubeVideo[];
    pageInfo: {
      totalResults: number;
      resultsPerPage: number;
      nextPageToken?: string;
      prevPageToken?: string;
    };
  }> {
    const cacheKey = youtubeKeys.search(params.query, params.regionCode);
    
    // 尝试从缓存获取
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Search results from cache', { query: params.query });
      return cached;
    }

    const response = await this.request<any>('/search', {
      part: 'snippet',
      q: params.query,
      type: 'video',
      maxResults: params.maxResults || YOUTUBE_CONSTANTS.MAX_RESULTS,
      regionCode: params.regionCode || YOUTUBE_CONSTANTS.DEFAULT_REGION,
      relevanceLanguage: params.relevanceLanguage || YOUTUBE_CONSTANTS.DEFAULT_LANGUAGE,
      publishedAfter: params.publishedAfter,
      publishedBefore: params.publishedBefore,
      order: 'relevance',
    });

    const result = {
      videos: response.items || [],
      pageInfo: response.pageInfo,
    };

    // 缓存结果（30分钟）
    cache.set(cacheKey, result, { ttl: 1800 });

    return result;
  }

  /**
   * 获取视频详情
   */
  async getVideos(videoIds: string[]): Promise<YouTubeVideo[]> {
    if (videoIds.length === 0) {
      return [];
    }

    // 检查缓存
    const cached: YouTubeVideo[] = [];
    const toFetch: string[] = [];

    for (const videoId of videoIds) {
      const cacheKey = youtubeKeys.video(videoId);
      const cachedVideo = cache.get<YouTubeVideo>(cacheKey);
      if (cachedVideo) {
        cached.push(cachedVideo);
      } else {
        toFetch.push(videoId);
      }
    }

    // 获取未缓存的视频
    let fetched: YouTubeVideo[] = [];
    if (toFetch.length > 0) {
      const response = await this.request<any>('/videos', {
        part: 'snippet,statistics,contentDetails',
        id: toFetch.join(','),
      });

      fetched = response.items || [];

      // 缓存结果（2小时）
      fetched.forEach(video => {
        const cacheKey = youtubeKeys.video(video.id);
        cache.set(cacheKey, video, { ttl: 7200 });
      });
    }

    // 合并结果
    const result = [...cached, ...fetched];

    // 按原始顺序返回
    const resultMap = new Map(result.map(v => [v.id, v]));
    return videoIds.map(id => resultMap.get(id)).filter(Boolean) as YouTubeVideo[];
  }

  /**
   * 获取频道详情
   */
  async getChannels(channelIds: string[]): Promise<YouTubeChannel[]> {
    if (channelIds.length === 0) {
      return [];
    }

    // 检查缓存
    const cached: YouTubeChannel[] = [];
    const toFetch: string[] = [];

    for (const channelId of channelIds) {
      const cacheKey = youtubeKeys.channel(channelId);
      const cachedChannel = cache.get<YouTubeChannel>(cacheKey);
      if (cachedChannel) {
        cached.push(cachedChannel);
      } else {
        toFetch.push(channelId);
      }
    }

    // 获取未缓存的频道
    let fetched: YouTubeChannel[] = [];
    if (toFetch.length > 0) {
      const response = await this.request<any>('/channels', {
        part: 'snippet,statistics,brandingSettings',
        id: toFetch.join(','),
      });

      fetched = response.items || [];

      // 缓存结果（4小时）
      fetched.forEach(channel => {
        const cacheKey = youtubeKeys.channel(channel.id);
        cache.set(cacheKey, channel, { ttl: 14400 });
      });
    }

    // 合并结果
    const result = [...cached, ...fetched];

    // 按原始顺序返回
    const resultMap = new Map(result.map(c => [c.id, c]));
    return channelIds.map(id => resultMap.get(id)).filter(Boolean) as YouTubeChannel[];
  }

  /**
   * 分页搜索（支持获取超过 50 个结果）
   */
  async searchVideosPaginated(
    query: string,
    options: {
      maxResults?: number;
      regionCode?: string;
      delayBetweenRequests?: number;
    } = {}
  ): Promise<YouTubeVideo[]> {
    const {
      maxResults = YOUTUBE_CONSTANTS.MAX_VIDEOS,
      regionCode = YOUTUBE_CONSTANTS.DEFAULT_REGION,
      delayBetweenRequests = 1000,
    } = options;

    const results: YouTubeVideo[] = [];
    let nextPageToken: string | undefined = '';
    const maxResultsPerPage = 50;

    while (results.length < maxResults && nextPageToken !== undefined) {
      const response = await this.searchVideos({
        query,
        maxResults: Math.min(maxResultsPerPage, maxResults - results.length),
        regionCode,
      });

      results.push(...response.videos);

      if (results.length >= maxResults) {
        break;
      }

      nextPageToken = response.pageInfo.nextPageToken;

      if (nextPageToken) {
        await sleep(delayBetweenRequests);
      }
    }

    return results.slice(0, maxResults);
  }

  /**
   * 解析 ISO 8601 持续时间
   */
  parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    let seconds = 0;
    if (match[1]) seconds += parseInt(match[1]) * 3600;
    if (match[2]) seconds += parseInt(match[2]) * 60;
    if (match[3]) seconds += parseInt(match[3]);

    return seconds;
  }

  /**
   * 提取视频 ID
   */
  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * 提取频道 ID
   */
  extractChannelId(url: string): string | null {
    const patterns = [
      /\/channel\/(UC[a-zA-Z0-9_-]{22})/,
      /\/c\/([^/?]+)/,
      /\/user\/([^/?]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }
}

// 导出单例实例
export const youtubeService = YouTubeService.getInstance();
