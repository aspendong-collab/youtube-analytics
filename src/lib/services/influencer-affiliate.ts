/**
 * Influencer Affiliate 服务
 * 用于查找适合 affiliate 合作的 YouTube 博主
 */

import { google } from 'googleapis';
import { AffiliateDetector, type AffiliateDetection } from './affiliate-detection';
import { DataMiningEngine, type YouTubeVideo } from './keyword-expansion/data-mining';
import { youtubeApiQuotaService } from './youtube-api-quota';
import { youtubeApiKeyPool } from './youtube-api-key-pool';
import type { SupportedLanguage } from './keyword-expansion/types';

export interface FindOptions {
  maxVideos?: number;
  maxResults?: number;
  minAffiliateScore?: number;
  includeComments?: boolean;
}

export interface ChannelAffiliateInfo {
  channelId: string;
  channelTitle: string;
  thumbnail?: string;
  subscriberCount?: number;
  totalVideos?: number;
  totalViews?: number;
  videos: AffiliateVideoInfo[];
  affiliateScore: number;
  affiliateEvidence: AffiliateLink[];
  contactInfo?: {
    email?: string;
    socialLinks?: string[];
  };
  recommendationScore: number;
  tags?: string[];
  language: SupportedLanguage;
  affiliateStatus?: 'potential' | 'verified' | 'rejected';
  cooperationStatus?: 'available' | 'contacted' | 'collaborating' | 'blacklist';
}

export interface AffiliateVideoInfo {
  videoId: string;
  title: string;
  thumbnail?: string;
  publishedAt?: string;
  viewCount?: number;
  likeCount?: number;
  affiliateScore: number;
  affiliateEvidence: AffiliateDetection;
  contactInfo?: {
    email?: string;
    socialLinks?: string[];
  };
}

export interface AffiliateLink {
  type: 'ref' | 'utm' | 'short' | 'keyword' | 'disclosure';
  value: string;
  fullUrl?: string;
  position: 'description' | 'comment';
  videoId?: string;
}

/**
 * Influencer Affiliate 服务
 */
export class InfluencerAffiliateService {
  private affiliateDetector: AffiliateDetector;
  private dataMiningEngine: DataMiningEngine;

  // 语言映射
  private static readonly LANGUAGE_CODES: Record<string, string> = {
    'en': 'en',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'ja': 'ja',
    'ko': 'ko',
    'zh-TW': 'zh-Hant',
    'zh-CN': 'zh-Hans'
  };

  // 地区映射
  private static readonly REGION_CODES: Record<string, string> = {
    'en': 'US',
    'fr': 'FR',
    'de': 'DE',
    'it': 'IT',
    'ja': 'JP',
    'ko': 'KR',
    'zh-TW': 'TW',
    'zh-CN': 'CN'
  };

  constructor(language: SupportedLanguage = 'en') {
    // 不在这里初始化 youtube，而是在每次调用时动态获取 API Key
    this.affiliateDetector = new AffiliateDetector();
    this.dataMiningEngine = new DataMiningEngine(language);
  }

  /**
   * 创建 YouTube API 客户端（使用 Key 池）
   */
  private createYoutubeClient(): any {
    const apiKey = youtubeApiKeyPool.getNextKey();

    if (!apiKey) {
      throw new Error('所有 YouTube API Key 都已用完，请等待明天配额重置或添加更多 Key');
    }

    return google.youtube({
      version: 'v3',
      auth: apiKey,
    });
  }

  /**
   * 查找适合 affiliate 合作的博主
   */
  async findAffiliateInfluencers(
    keyword: string,
    language: SupportedLanguage,
    options: FindOptions = {}
  ): Promise<ChannelAffiliateInfo[]> {
    console.log(`[AffiliateService] 开始查找 affiliate 博主: ${keyword}, 语种: ${language}`);

    const maxVideos = options.maxVideos || 50;
    const includeComments = options.includeComments !== false;

    // 1. 搜索相关视频
    const videos = await this.searchVideos(keyword, language, maxVideos);
    console.log(`[AffiliateService] 搜索到 ${videos.length} 个视频`);

    // 2. 按频道分组
    const channelMap = new Map<string, ChannelAffiliateInfo>();

    // 3. 分析每个视频
    for (const video of videos) {
      console.log(`[AffiliateService] 分析视频: ${video.title}`);

      // 分析视频描述
      const videoAffiliateInfo = this.affiliateDetector.detectAffiliate(
        video.description || '',
        'description'
      );

      // 获取评论并分析（如果启用）
      let commentAffiliateInfo: AffiliateDetection | null = null;
      if (includeComments) {
        const comments = await this.fetchVideoComments(video.id, 5);
        if (comments.length > 0) {
          const commentTexts = comments.map(c => c.textDisplay).join('\n');
          commentAffiliateInfo = this.affiliateDetector.detectAffiliate(commentTexts, 'comment');
        }
      }

      // 提取视频联系信息
      const videoContactInfo = this.affiliateDetector['extractContactInfo'](
        video.description || ''
      );

      // 聚合到频道
      const channelId = video.channelId;
      if (!channelMap.has(channelId)) {
        channelMap.set(channelId, {
          channelId,
          channelTitle: video.channelTitle,
          thumbnail: video.channelThumbnail,
          subscriberCount: video.subscriberCount,
          totalVideos: 0,
          totalViews: 0,
          videos: [],
          affiliateScore: 0,
          affiliateEvidence: [],
          contactInfo: videoContactInfo,
          recommendationScore: 0,
          language,
          affiliateStatus: 'potential',
          cooperationStatus: 'available'
        });
      }

      const channel = channelMap.get(channelId)!;

      // 添加视频信息
      const affiliateVideoInfo: AffiliateVideoInfo = {
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        publishedAt: video.publishedAt,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        affiliateScore: videoAffiliateInfo.score,
        affiliateEvidence: videoAffiliateInfo,
        contactInfo: videoContactInfo
      };

      channel.videos.push(affiliateVideoInfo);

      // 聚合证据
      channel.affiliateEvidence.push(
        ...videoAffiliateInfo.evidence.refLinks.map(l => ({ ...l, videoId: video.id })),
        ...videoAffiliateInfo.evidence.utmLinks.map(l => ({ ...l, videoId: video.id })),
        ...videoAffiliateInfo.evidence.shortLinks.map(l => ({ ...l, videoId: video.id })),
        ...videoAffiliateInfo.evidence.keywords.map(l => ({ ...l, videoId: video.id })),
        ...videoAffiliateInfo.evidence.disclosures.map(l => ({ ...l, videoId: video.id }))
      );

      if (commentAffiliateInfo) {
        channel.affiliateEvidence.push(
          ...commentAffiliateInfo.evidence.refLinks.map(l => ({ ...l, videoId: video.id })),
          ...commentAffiliateInfo.evidence.utmLinks.map(l => ({ ...l, videoId: video.id })),
          ...commentAffiliateInfo.evidence.shortLinks.map(l => ({ ...l, videoId: video.id })),
          ...commentAffiliateInfo.evidence.keywords.map(l => ({ ...l, videoId: video.id })),
          ...commentAffiliateInfo.evidence.disclosures.map(l => ({ ...l, videoId: video.id }))
        );
      }
    }

    console.log(`[AffiliateService] 分析了 ${channelMap.size} 个频道`);

    // 4. 计算每个频道的综合 Affiliate Score
    const results: ChannelAffiliateInfo[] = [];
    for (const channel of channelMap.values()) {
      channel.affiliateScore = this.calculateChannelAffiliateScore(channel);
      channel.recommendationScore = this.calculateRecommendationScore(channel);
      channel.tags = this.inferCategory(keyword, channel);

      // 计算总观看数
      channel.totalViews = channel.videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);

      // 只返回有 affiliate 标识的博主（根据最小分数阈值）
      const minScore = options.minAffiliateScore || 0;
      if (channel.affiliateScore > minScore) {
        results.push(channel);
      }
    }

    console.log(`[AffiliateService] 找到 ${results.length} 个符合条件的 affiliate 博主`);

    // 5. 按 Affiliate Score 排序
    results.sort((a, b) => b.affiliateScore - a.affiliateScore);

    // 6. 限制返回数量
    const maxResults = options.maxResults || 20;
    return results.slice(0, maxResults);
  }

  /**
   * 搜索 YouTube 视频（支持分页和多轮搜索）
   */
  private async searchVideos(
    keyword: string,
    language: SupportedLanguage,
    maxResults: number
  ): Promise<YouTubeVideo[]> {
    try {
      const relevanceLanguage = InfluencerAffiliateService.LANGUAGE_CODES[language] || 'en';
      const regionCode = InfluencerAffiliateService.REGION_CODES[language] || 'US';

      console.log(`[AffiliateService] 调用 YouTube Search API: keyword="${keyword}", lang=${relevanceLanguage}, region=${regionCode}, maxResults=${maxResults}`);

      // 使用 Key 池创建客户端
      const youtube = this.createYoutubeClient();

      // YouTube API 单次搜索最大返回 50 个结果
      // 如果需要更多结果，需要分页搜索
      let allVideos: YouTubeVideo[] = [];
      let pageToken: string | undefined = undefined;
      const maxSearchResults = Math.min(maxResults, 200); // 最多搜索 200 个视频（4 次 API 调用）

      while (allVideos.length < maxSearchResults) {
        const searchResponse = await Promise.race([
          youtube.search.list({
            q: keyword,
            part: ['snippet'],
            maxResults: 50, // YouTube API 单次最大值
            type: ['video'],
            relevanceLanguage,
            regionCode,
            order: 'relevance',
            pageToken
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('YouTube API search timeout (30s)')), 30000)
          )
        ]);

        // 记录 API 调用（成功后才记录）
        await youtubeApiQuotaService.recordApiCall('search', 'search.list', true, null, {
          keyword,
          maxResults: 50,
          relevanceLanguage,
          regionCode,
          purpose: 'affiliateMining'
        });

        const videoIds: string[] = [];
        const channelIds: string[] = [];

        if (searchResponse.data.items) {
          console.log(`[AffiliateService] YouTube Search API 返回 ${searchResponse.data.items.length} 个结果`);
          for (const item of searchResponse.data.items) {
            if (item.id?.videoId) {
              videoIds.push(item.id.videoId);
            }
            if (item.snippet?.channelId) {
              channelIds.push(item.snippet.channelId);
            }
          }
        } else {
          console.warn('[AffiliateService] YouTube Search API 未返回任何结果');
          break;
        }

        if (videoIds.length === 0) {
          console.log('[AffiliateService] 未找到任何视频 ID');
          break;
        }

        // 获取视频详情
        const youtube2 = this.createYoutubeClient(); // 使用新的客户端
        const videosResponse = await Promise.race([
          youtube2.videos.list({
            id: videoIds,
            part: ['snippet', 'statistics']
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('YouTube API videos timeout (30s)')), 30000)
          )
        ]);

        // 记录 API 调用
        await youtubeApiQuotaService.recordApiCall('videos', 'videos.list', true, null, {
          videoIds: videoIds.length,
          purpose: 'affiliateMining'
        });

        if (videosResponse.data.items) {
          console.log(`[AffiliateService] YouTube Videos API 返回 ${videosResponse.data.items.length} 个视频详情`);
          for (const video of videosResponse.data.items) {
            allVideos.push({
              id: video.id,
              title: video.snippet.title,
              description: video.snippet.description,
              thumbnail: video.snippet.thumbnails?.medium?.url,
              channelId: video.snippet.channelId,
              channelTitle: video.snippet.channelTitle,
              channelThumbnail: undefined,
              publishedAt: video.snippet.publishedAt,
              viewCount: parseInt(video.statistics.viewCount || '0'),
              likeCount: parseInt(video.statistics.likeCount || '0'),
              commentCount: parseInt(video.statistics.commentCount || '0'),
              subscriberCount: undefined
            });
          }
        } else {
          console.warn('[AffiliateService] YouTube Videos API 未返回任何视频详情');
        }

        // 检查是否还有下一页
        if (!searchResponse.data.nextPageToken) {
          console.log('[AffiliateService] 已到达搜索结果末尾');
          break;
        }

        pageToken = searchResponse.data.nextPageToken;

        // 如果已经收集了足够的视频，停止搜索
        if (allVideos.length >= maxSearchResults) {
          console.log(`[AffiliateService] 已收集到足够的视频 (${allVideos.length}/${maxSearchResults})`);
          break;
        }
      }

      console.log(`[AffiliateService] 成功获取 ${allVideos.length} 个视频的完整信息`);
      return allVideos;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[AffiliateService] 搜索视频失败:', errorMessage);

      // 如果是配额问题，记录详细信息
      if (errorMessage.includes('quota')) {
        console.error('[AffiliateService] YouTube API 配额已用完，请稍后重试或升级配额');
      } else if (errorMessage.includes('timeout')) {
        console.error('[AffiliateService] YouTube API 请求超时，网络可能较慢');
      } else if (errorMessage.includes('API key')) {
        console.error('[AffiliateService] YouTube API Key 无效或未配置');
      }

      return [];
    }
  }

  /**
   * 获取视频评论
   */
  private async fetchVideoComments(videoId: string, maxResults: number = 10): Promise<Array<{ textDisplay: string }>> {
    try {
      const youtube = this.createYoutubeClient(); // 使用 Key 池创建客户端

      const commentsResponse = await Promise.race([
        youtube.commentThreads.list({
          videoId,
          part: ['snippet'],
          maxResults,
          order: 'relevance'
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('YouTube API comments timeout (20s)')), 20000)
        )
      ]);

      // 记录 API 调用（成功后才记录）
      await youtubeApiQuotaService.recordApiCall('commentThreads', 'commentThreads.list', true, null, {
        videoId,
        maxResults,
        purpose: 'affiliateMining'
      });

      const comments: Array<{ textDisplay: string }> = [];
      if (commentsResponse.data.items) {
        for (const comment of commentsResponse.data.items) {
          const snippet = comment.snippet?.topLevelComment?.snippet;
          if (snippet?.textDisplay) {
            comments.push({ textDisplay: snippet.textDisplay });
          }
        }
      }

      return comments;
    } catch (error) {
      console.error('[AffiliateService] 获取评论失败:', error);
      return [];
    }
  }

  /**
   * 计算频道的 Affiliate Score
   */
  private calculateChannelAffiliateScore(channel: ChannelAffiliateInfo): number {
    if (channel.videos.length === 0) {
      return 0;
    }

    // 1. 视频级别的平均分（60%）
    const videoScores = channel.videos.map(v => v.affiliateScore);
    const avgVideoScore = videoScores.reduce((sum, score) => sum + score, 0) / videoScores.length;

    // 2. 有 affiliate 标识的视频数量（20%）
    const affiliateVideoCount = channel.videos.filter(v => v.affiliateScore > 0).length;
    const affiliateVideoRatio = affiliateVideoCount / channel.videos.length;

    // 3. 证据总数（20%）
    const evidenceCount = channel.affiliateEvidence.length;

    // 综合计算
    const score = avgVideoScore * 0.6 + affiliateVideoRatio * 100 * 0.2 + Math.min(evidenceCount * 2, 20);

    return Math.min(100, Math.round(score));
  }

  /**
   * 计算推荐分数（0-100）
   * 综合考虑 Affiliate Score、订阅数、互动率等
   */
  private calculateRecommendationScore(channel: ChannelAffiliateInfo): number {
    let score = channel.affiliateScore * 0.5; // 50% 来自 Affiliate Score

    // 订阅数贡献（20%）
    const subscriberScore = Math.min((channel.subscriberCount || 0) / 1000000 * 20, 20);
    score += subscriberScore;

    // 视频数量贡献（15%）
    const videoCountScore = Math.min(channel.videos.length / 10 * 15, 15);
    score += videoCountScore;

    // 视频平均观看数（15%）
    const avgViews = channel.totalViews / channel.videos.length;
    const viewsScore = Math.min(avgViews / 100000 * 15, 15);
    score += viewsScore;

    return Math.min(100, Math.round(score));
  }

  /**
   * 推断分类和标签
   */
  private inferCategory(keyword: string, channel: ChannelAffiliateInfo): string[] {
    const tags: string[] = [];

    // 从关键词提取
    tags.push(keyword.toLowerCase());

    // 从视频标题提取
    const titleWords = new Set<string>();
    for (const video of channel.videos) {
      const words = video.title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          titleWords.add(word);
        }
      });
    }

    // 添加高频词
    const wordCount = new Map<string, number>();
    for (const video of channel.videos) {
      const words = video.title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && word.length < 20) {
          wordCount.set(word, (wordCount.get(word) || 0) + 1);
        }
      });
    }

    const sortedWords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    tags.push(...sortedWords);

    return [...new Set(tags)].slice(0, 5);
  }
}
