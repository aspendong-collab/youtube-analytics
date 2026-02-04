import { youtubeClient } from './youtube-client';
import type { InfluencerProfile, InfluencerVideo, InferenceResult } from '@/types/influencer';

/**
 * 数据采集器 - 负责从YouTube采集达人数据
 */
class InfluencerCollector {
  /**
   * 通过关键词采集达人
   * @param keyword 关键词
   * @param options 选项
   */
  async collectByKeyword(
    keyword: string,
    options: {
      maxResults?: number;
      regionCode?: string;
      includeRecentVideos?: boolean;
      recentVideosCount?: number;
    } = {}
  ): Promise<InfluencerProfile[]> {
    console.log(`[InfluencerCollector] 开始搜索达人: ${keyword}`);
    console.log(`[InfluencerCollector] 搜索参数:`, options);

    try {
      // 步骤1：搜索视频（获取频道）
      console.log(`[InfluencerCollector] 步骤1: 搜索视频...`);
      const searchResults = await youtubeClient.searchInfluencers({
        query: keyword,
        maxResults: options.maxResults || 50,
        type: 'video',
        order: 'relevance',
      });

      console.log(`[InfluencerCollector] 搜索到 ${searchResults.length} 个视频`);

      if (searchResults.length === 0) {
        console.warn(`[InfluencerCollector] 未找到任何视频结果`);
        return [];
      }

      // 步骤2：提取唯一的频道ID
      console.log(`[InfluencerCollector] 步骤2: 提取频道ID...`);
      const channelMap = new Map<string, any[]>();
      searchResults.forEach(item => {
        const channelId = item.snippet?.channelId;
        if (channelId) {
          if (!channelMap.has(channelId)) {
            channelMap.set(channelId, []);
          }
          channelMap.get(channelId)!.push(item);
        }
      });

      const channelIds = Array.from(channelMap.keys());
      console.log(`[InfluencerCollector] 提取到 ${channelIds.length} 个独立频道`);

      // 步骤3：批量获取频道详情和近期视频
      console.log(`[InfluencerCollector] 步骤3: 获取频道详情和视频...`);
      const profilesData = await youtubeClient.getInfluencerProfiles(channelIds, {
        includeRecentVideos: options.includeRecentVideos !== false,
        recentVideosCount: options.recentVideosCount || 10,
      });

      console.log(`[InfluencerCollector] 获取到 ${profilesData.length} 个频道详情`);

      // 步骤4：构建达人档案
      console.log(`[InfluencerCollector] 步骤4: 构建达人档案...`);
      const profiles: InfluencerProfile[] = [];

      for (const profileData of profilesData) {
        const channel = profileData.channel;
        const recentVideos = profileData.recentVideos;

        // 计算统计数据
        const stats = this.calculateStatistics(recentVideos);

        // 推断数据
        const inference = this.runInference(channel, recentVideos);

      const profile: InfluencerProfile = {
        // 基础信息
        channelId: channel.id,
        channelTitle: channel.snippet?.title || '',
        channelThumbnail: channel.snippet?.thumbnails?.medium?.url || '',
        channelBanner: channel.snippet?.thumbnails?.banner?.url || '',
        customUrl: channel.snippet?.customUrl || '',

        // 统计数据
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        viewCount: parseInt(channel.statistics?.viewCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
        hiddenSubscriberCount: channel.statistics?.hiddenSubscriberCount || false,

        // 描述信息
        description: channel.snippet?.description || '',
        keywords: channel.brandingSettings?.channel?.keywords || [],

        // 时间信息
        createdAt: channel.snippet?.publishedAt || '',
        discoveredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),

        // 语言和地区
        defaultLanguage: channel.snippet?.defaultLanguage || '',
        country: channel.snippet?.country || '',

        // 品牌设置
        brandingSettings: channel.brandingSettings || {},
        uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || '',

        // 近期视频
        recentVideos: recentVideos.map(this.mapVideoData),

        // 计算统计数据
        avgViews: stats.avgViews,
        avgLikes: stats.avgLikes,
        avgComments: stats.avgComments,
        avgDuration: stats.avgDuration,
        avgDurationSeconds: stats.avgDurationSeconds,

        // 互动数据
        engagementRate: stats.engagementRate,
        likeRate: stats.likeRate,
        commentRate: stats.commentRate,

        // 增长趋势
        viewsTrend: stats.viewsTrend,
        likesTrend: stats.likesTrend,
        commentsTrend: stats.commentsTrend,

        // 发布规律
        publishFrequency: stats.publishFrequency,
        publishConsistency: stats.publishConsistency,
        bestPublishDays: stats.bestPublishDays,
        bestPublishHours: stats.bestPublishHours,
        avgPublishInterval: stats.avgPublishInterval,

        // 内容特征
        contentCategories: stats.contentCategories,
        contentKeywords: stats.contentKeywords,
        avgTitleLength: stats.avgTitleLength,
        avgDescriptionLength: stats.avgDescriptionLength,

        // 视频质量
        avgThumbnailQuality: stats.avgThumbnailQuality,
        hasCaptions: stats.hasCaptions,
        avgCaptionLanguages: stats.avgCaptionLanguages,

        // 推断数据
        inferredCountry: inference.country,
        inferredLanguage: inference.language,
        inferredEmail: inference.email,
        inferredSocialMedia: inference.socialMedia,

        // 评分（将在后续步骤计算）
        score: {
          total: 0,
          breakdown: {
            audienceSize: 0,
            audienceQuality: 0,
            contentQuality: 0,
            consistency: 0,
            growthRate: 0,
            trending: 0,
            potential: 0,
            relevance: 0,
            costEfficiency: 0,
            partnershipHistory: 0,
          },
          tier: 'tier4',
          recommendations: [],
        },

        // 合作价值
        estimatedCost: stats.estimatedCost,
        estimatedReach: stats.estimatedReach,

        // 状态
        status: 'new',
        priority: 'medium',

        // 标签
        tags: [],
        categories: [],

        // 联系信息
        contactInfo: {
          email: inference.email.email,
          verifiedEmail: false,
          businessEmail: null,
          socialMedia: {
            twitter: inference.socialMedia.twitter || null,
            instagram: inference.socialMedia.instagram || null,
            facebook: inference.socialMedia.facebook || null,
            tiktok: inference.socialMedia.tiktok || null,
            website: inference.socialMedia.website || null,
          },
        },

        // 元数据
        metadata: {
          dataSource: 'search',
          discoveryKeyword: keyword,
          region: options.regionCode || 'global',
          lastCrawledAt: new Date().toISOString(),
          crawlCount: 1,
          dataQuality: this.calculateDataQuality(channel, recentVideos),
          flags: [],
        },

        // 内部管理
        notes: '',
        assignedTo: null,
        assignedAt: null,

        // 合同和预算
        budgetInfo: {
          estimatedBudget: 0,
          actualBudget: null,
          currency: 'USD',
        },
        contractInfo: {
          status: 'none',
          startDate: null,
          endDate: null,
          contentType: null,
          deliverables: [],
        },
      };

      profiles.push(profile);
    }

    console.log(`[InfluencerCollector] 成功采集 ${profiles.length} 个达人档案`);
    return profiles;
    } catch (error) {
      console.error('[InfluencerCollector] 采集达人失败:', error);
      if (error instanceof Error) {
        console.error('[InfluencerCollector] 错误堆栈:', error.stack);
        throw new Error(`Failed to collect influencers: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 从热门视频采集达人
   * @param options 选项
   */
  async collectFromPopular(options: {
    regionCode?: string;
    categoryId?: string;
    maxResults?: number;
  } = {}): Promise<InfluencerProfile[]> {
    console.log(`从热门视频采集达人`);

    const popularVideos = await youtubeClient.getPopularVideos({
      regionCode: options.regionCode || 'US',
      categoryId: options.categoryId,
      maxResults: options.maxResults || 50,
    });

    console.log(`获取到 ${popularVideos.length} 个热门视频`);

    // 提取频道ID
    const channelIds = [...new Set(
      popularVideos.map((v: any) => v.snippet?.channelId).filter(Boolean)
    )];

    console.log(`提取到 ${channelIds.length} 个独立频道`);

    // 获取频道详情
    const profilesData = await youtubeClient.getInfluencerProfiles(channelIds, {
      includeRecentVideos: true,
      recentVideosCount: 10,
    });

    // 构建达人档案（同上）
    const profiles = profilesData.map(profileData => {
      const channel = profileData.channel;
      const recentVideos = profileData.recentVideos;
      const stats = this.calculateStatistics(recentVideos);
      const inference = this.runInference(channel, recentVideos);

      return {
        // ... 同上
        channelId: channel.id,
        channelTitle: channel.snippet?.title || '',
        channelThumbnail: channel.snippet?.thumbnails?.medium?.url || '',
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        viewCount: parseInt(channel.statistics?.viewCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
        description: channel.snippet?.description || '',
        keywords: channel.brandingSettings?.channel?.keywords || [],
        createdAt: channel.snippet?.publishedAt || '',
        discoveredAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        defaultLanguage: channel.snippet?.defaultLanguage || '',
        uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || '',
        recentVideos: recentVideos.map(this.mapVideoData),
        avgViews: stats.avgViews,
        avgLikes: stats.avgLikes,
        avgComments: stats.avgComments,
        engagementRate: stats.engagementRate,
        viewsTrend: stats.viewsTrend,
        // ... 其他字段
        score: { total: 0, breakdown: {}, tier: 'tier4', recommendations: [] },
        status: 'new',
        priority: 'medium',
        tags: [],
        categories: [],
        contactInfo: { email: null, verifiedEmail: false, businessEmail: null, socialMedia: { twitter: null, instagram: null, facebook: null, tiktok: null, website: null } },
        metadata: {
          dataSource: 'popular',
          discoveryKeyword: '',
          region: options.regionCode || 'US',
          lastCrawledAt: new Date().toISOString(),
          crawlCount: 1,
          dataQuality: this.calculateDataQuality(channel, recentVideos),
          flags: [],
        },
      } as unknown as InfluencerProfile;
    });

    return profiles;
  }

  /**
   * 计算统计数据
   */
  private calculateStatistics(videos: any[]) {
    if (videos.length === 0) {
      return {
        avgViews: 0,
        avgLikes: 0,
        avgComments: 0,
        avgDuration: 'PT0S',
        avgDurationSeconds: 0,
        engagementRate: 0,
        likeRate: 0,
        commentRate: 0,
        viewsTrend: 0,
        likesTrend: 0,
        commentsTrend: 0,
        publishFrequency: 0,
        publishConsistency: 0,
        bestPublishDays: [],
        bestPublishHours: [],
        avgPublishInterval: 0,
        contentCategories: [],
        contentKeywords: [],
        avgTitleLength: 0,
        avgDescriptionLength: 0,
        avgThumbnailQuality: 'unknown',
        hasCaptions: false,
        avgCaptionLanguages: 0,
        estimatedCost: { tier1: 0, tier2: 0, tier3: 0, recommended: 0 },
        estimatedReach: { views: 0, engagement: 0, conversions: 0 },
      };
    }

    // 保存 this 引用以避免上下文丢失
    const self = this;

    const views = videos.map((v: any) => parseInt(v.statistics?.viewCount || '0'));
    const likes = videos.map((v: any) => parseInt(v.statistics?.likeCount || '0'));
    const comments = videos.map((v: any) => parseInt(v.statistics?.commentCount || '0'));

    const avgViews = views.reduce((a, b) => a + b, 0) / views.length;
    const avgLikes = likes.reduce((a, b) => a + b, 0) / likes.length;
    const avgComments = comments.reduce((a, b) => a + b, 0) / comments.length;

    const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;

    // 计算趋势
    const viewsTrend = self.calculateTrend(views);
    const likesTrend = self.calculateTrend(likes);
    const commentsTrend = self.calculateTrend(comments);

    // 计算时长
    const durations = videos.map((v: any) => self.parseDuration(v.contentDetails?.duration || 'PT0S'));
    const avgDurationSeconds = durations.reduce((a, b) => a + b, 0) / durations.length;
    const avgDuration = self.formatDuration(avgDurationSeconds);

    // 估算成本
    const subscriberCount = videos[0]?.subscriberCount || 10000;
    const estimatedCost = {
      tier1: Math.round(subscriberCount * 0.005),
      tier2: Math.round(subscriberCount * 0.002),
      tier3: Math.round(subscriberCount * 0.0004),
      recommended: Math.round(subscriberCount * 0.003),
    };

    // 估算触达
    const estimatedReach = {
      views: Math.round(avgViews * 2.5),
      engagement: Math.round(avgViews * (engagementRate / 100)),
      conversions: Math.round(avgViews * (engagementRate / 100) * 0.67),
    };

    return {
      avgViews: Math.round(avgViews),
      avgLikes: Math.round(avgLikes),
      avgComments: Math.round(avgComments),
      avgDuration,
      avgDurationSeconds,
      engagementRate,
      likeRate: avgViews > 0 ? (avgLikes / avgViews) * 100 : 0,
      commentRate: avgViews > 0 ? (avgComments / avgViews) * 100 : 0,
      viewsTrend,
      likesTrend,
      commentsTrend,
      publishFrequency: 0,
      publishConsistency: 0,
      bestPublishDays: [],
      bestPublishHours: [],
      avgPublishInterval: 0,
      contentCategories: [],
      contentKeywords: [],
      avgTitleLength: 0,
      avgDescriptionLength: 0,
      avgThumbnailQuality: 'medium',
      hasCaptions: false,
      avgCaptionLanguages: 0,
      estimatedCost,
      estimatedReach,
    };
  }

  /**
   * 运行推断逻辑
   */
  private runInference(channel: any, videos: any[]): InferenceResult {
    return {
      country: this.inferCountry(channel),
      language: this.inferLanguage(channel, videos),
      email: this.inferEmail(channel),
      socialMedia: this.inferSocialMedia(channel),
    };
  }

  /**
   * 推断国家
   */
  private inferCountry(channel: any) {
    const description = channel.snippet?.description || '';
    const defaultLanguage = channel.snippet?.defaultLanguage || '';

    // 检查国旗emoji
    const flagMap: Record<string, string> = {
      '🇺🇸': 'US', '🇨🇳': 'CN', '🇯🇵': 'JP', '🇰🇷': 'KR',
      '🇬🇧': 'GB', '🇩🇪': 'DE', '🇫🇷': 'FR', '🇮🇹': 'IT',
    };

    for (const [emoji, country] of Object.entries(flagMap)) {
      if (description.includes(emoji)) {
        return {
          country,
          countryName: this.getCountryName(country),
          confidence: 85,
          evidence: [`Found ${emoji} in description`],
          possibleCountries: [country],
          sources: { fromDescription: true, fromLanguage: false, fromTimezone: false, fromKeywords: false },
        };
      }
    }

    // 从语言推断
    if (defaultLanguage) {
      const langToCountry: Record<string, string> = {
        en: 'US',
        ja: 'JP',
        ko: 'KR',
        zh: 'CN',
        es: 'ES',
        fr: 'FR',
        de: 'DE',
      };

      const country = langToCountry[defaultLanguage];
      if (country) {
        return {
          country,
          countryName: this.getCountryName(country),
          confidence: 60,
          evidence: [`Language: ${defaultLanguage}`],
          possibleCountries: [country],
          sources: { fromDescription: false, fromLanguage: true, fromTimezone: false, fromKeywords: false },
        };
      }
    }

    return {
      country: 'Unknown',
      countryName: 'Unknown',
      confidence: 0,
      evidence: [],
      possibleCountries: [],
      sources: { fromDescription: false, fromLanguage: false, fromTimezone: false, fromKeywords: false },
    };
  }

  /**
   * 推断语言
   */
  private inferLanguage(channel: any, videos: any[]) {
    const defaultLanguage = channel.snippet?.defaultLanguage;
    if (defaultLanguage) {
      return {
        language: defaultLanguage,
        languageName: this.getLanguageName(defaultLanguage),
        confidence: 95,
        evidence: 'API defaultLanguage field',
        source: 'api_default_language',
      };
    }

    // 从视频标题检测
    const titles = videos.map((v: any) => v.snippet?.title || '').join(' ');
    if (titles.length > 50) {
      // 简化版：假设是英语
      return {
        language: 'en',
        languageName: 'English',
        confidence: 50,
        evidence: 'Detected from video titles',
        source: 'title_analysis',
      };
    }

    return {
      language: 'Unknown',
      languageName: 'Unknown',
      confidence: 0,
      evidence: '',
      source: 'none',
    };
  }

  /**
   * 推断邮箱
   */
  private inferEmail(channel: any) {
    const description = channel.snippet?.description || '';
    const branding = channel.brandingSettings?.channel;

    // 从描述提取
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = description.match(emailPattern) || [];

    // 过滤无效邮箱
    const validEmails = emails.filter((email: string) => {
      const invalidPatterns = [/example\.com$/i, /test\.com$/i, /demo\.com$/i];
      return !invalidPatterns.some(pattern => pattern.test(email));
    });

    if (validEmails.length > 0) {
      return {
        email: validEmails[0],
        confidence: 70,
        possibleEmails: validEmails.map((e: string) => ({ email: e, confidence: 60, source: 'description' })),
        suggestions: [],
        sources: { fromDescription: true, fromBranding: false, fromSocialMedia: false },
      };
    }

    // 从branding提取
    if (branding?.email) {
      return {
        email: branding.email,
        confidence: 90,
        possibleEmails: [{ email: branding.email, confidence: 90, source: 'branding' }],
        suggestions: [],
        sources: { fromDescription: false, fromBranding: true, fromSocialMedia: false },
      };
    }

    return {
      email: null,
      confidence: 0,
      possibleEmails: [],
      suggestions: ['Check channel about page', 'Look in comments', 'Contact via social media'],
      sources: { fromDescription: false, fromBranding: false, fromSocialMedia: false },
    };
  }

  /**
   * 推断社交媒体
   */
  private inferSocialMedia(channel: any) {
    const description = channel.snippet?.description || '';

    const socialLinks: any = {
      twitter: null,
      instagram: null,
      facebook: null,
      tiktok: null,
      website: null,
      otherLinks: [],
    };

    // 简化版：提取常见社交媒体链接
    const twitterMatch = description.match(/https?:\/\/(?:www\.)?(twitter|x)\.com\/@?(\w+)/i);
    if (twitterMatch) {
      socialLinks.twitter = twitterMatch[0];
    }

    const facebookMatch = description.match(/https?:\/\/(?:www\.)?(facebook|fb)\.com\/([\w.-]+)/i);
    if (facebookMatch) {
      socialLinks.facebook = facebookMatch[0];
    }

    const instagramMatch = description.match(/https?:\/\/(?:www\.)?instagram\.com\/([\w.-]+)/i);
    if (instagramMatch) {
      socialLinks.instagram = instagramMatch[0];
    }

    const websiteMatch = description.match(/https?:\/\/([\w.-]+\.[a-z]{2,})/gi);
    if (websiteMatch) {
      socialLinks.website = websiteMatch[0];
    }

    return socialLinks;
  }

  /**
   * 计算趋势
   */
  private calculateTrend(values: number[]): number {
    if (values.length < 5) return 0;

    const recent = values.slice(0, Math.min(3, values.length));
    const older = values.slice(Math.min(3, values.length));

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (olderAvg === 0) return 0;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
  }

  /**
   * 解析ISO 8601时长
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 格式化时长
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * 映射视频数据
   */
  private mapVideoData(video: any): InfluencerVideo {
    return {
      videoId: video.id,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      thumbnail: video.snippet?.thumbnails?.medium?.url || '',
      publishedAt: video.snippet?.publishedAt || '',
      categoryId: video.snippet?.categoryId || '',
      categoryTitle: '',
      defaultLanguage: video.snippet?.defaultLanguage || '',
      defaultAudioLanguage: video.snippet?.defaultAudioLanguage || '',
      viewCount: parseInt(video.statistics?.viewCount || '0'),
      likeCount: parseInt(video.statistics?.likeCount || '0'),
      commentCount: parseInt(video.statistics?.commentCount || '0'),
      favoriteCount: parseInt(video.statistics?.favoriteCount || '0'),
      duration: video.contentDetails?.duration || '',
      durationSeconds: this.parseDuration(video.contentDetails?.duration || 'PT0S'),
      durationFormatted: this.formatDuration(this.parseDuration(video.contentDetails?.duration || 'PT0S')),
      tags: video.snippet?.tags || [],
      topicIds: video.topicDetails?.topicIds || [],
      topicCategories: video.topicDetails?.topicCategories || [],
    };
  }

  /**
   * 计算数据质量
   */
  private calculateDataQuality(channel: any, videos: any[]): number {
    let quality = 0;

    // 有描述
    if (channel.snippet?.description) quality += 20;

    // 有品牌设置
    if (channel.brandingSettings?.channel?.description) quality += 10;

    // 有足够视频
    if (videos.length >= 5) quality += 30;
    if (videos.length >= 10) quality += 20;

    // 有统计数据
    if (channel.statistics?.subscriberCount) quality += 10;
    if (channel.statistics?.viewCount) quality += 10;

    return quality;
  }

  /**
   * 获取国家名称
   */
  private getCountryName(code: string): string {
    const names: Record<string, string> = {
      US: 'United States',
      CN: 'China',
      JP: 'Japan',
      KR: 'South Korea',
      GB: 'United Kingdom',
      DE: 'Germany',
      FR: 'France',
      IT: 'Italy',
      ES: 'Spain',
      CA: 'Canada',
      AU: 'Australia',
      IN: 'India',
      BR: 'Brazil',
    };
    return names[code] || code;
  }

  /**
   * 获取语言名称
   */
  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      en: 'English',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese',
      ru: 'Russian',
      it: 'Italian',
      ar: 'Arabic',
    };
    return names[code] || code;
  }
}

/**
 * 达人评分模型
 */
export class ScoringModel {
  /**
   * 评分主方法
   */
  scoreInfluencer(
    influencer: any,
    productProfile?: {
      keywords: string[];
      targetAudience: string;
      category: string;
      minSubscribers?: number;
      maxSubscribers?: number;
      requiredEngagement?: number;
      budget?: number;
    }
  ): any {
    const breakdown = {
      audienceSize: this.scoreAudienceSize(influencer),
      audienceQuality: this.scoreAudienceQuality(influencer),
      contentQuality: this.scoreContentQuality(influencer),
      consistency: this.scoreConsistency(influencer),
      growthRate: this.scoreGrowthRate(influencer),
      trending: this.scoreTrending(influencer),
      potential: this.scorePotential(influencer),
      relevance: productProfile ? this.scoreRelevance(influencer, productProfile) : 0,
      costEfficiency: this.scoreCostEfficiency(influencer),
      partnershipHistory: 0,
    };

    const weights = {
      audienceSize: 10,
      audienceQuality: 10,
      contentQuality: 10,
      consistency: 10,
      growthRate: 15,
      trending: 10,
      potential: 5,
      relevance: 15,
      costEfficiency: 10,
      partnershipHistory: 5,
    };

    const total =
      breakdown.audienceSize * weights.audienceSize +
      breakdown.audienceQuality * weights.audienceQuality +
      breakdown.contentQuality * weights.contentQuality +
      breakdown.consistency * weights.consistency +
      breakdown.growthRate * weights.growthRate +
      breakdown.trending * weights.trending +
      breakdown.potential * weights.potential +
      breakdown.relevance * weights.relevance +
      breakdown.costEfficiency * weights.costEfficiency +
      breakdown.partnershipHistory * weights.partnershipHistory;

    const tier = this.determineTier(total);
    const recommendations = this.generateRecommendations(influencer, breakdown, tier);

    return {
      total: Math.round(total),
      breakdown,
      tier,
      recommendations,
    };
  }

  private scoreAudienceSize(influencer: any): number {
    const subs = influencer.subscriberCount || 0;
    if (subs >= 1000000) return 1.0;
    if (subs >= 500000) return 0.9;
    if (subs >= 100000) return 0.8;
    if (subs >= 50000) return 0.7;
    if (subs >= 10000) return 0.6;
    if (subs >= 5000) return 0.5;
    if (subs >= 1000) return 0.3;
    return 0.1;
  }

  private scoreAudienceQuality(influencer: any): number {
    const engagement = influencer.engagementRate || 0;
    if (engagement >= 10) return 1.0;
    if (engagement >= 7) return 0.9;
    if (engagement >= 5) return 0.8;
    if (engagement >= 3) return 0.7;
    if (engagement >= 2) return 0.5;
    if (engagement >= 1) return 0.3;
    return 0.1;
  }

  private scoreContentQuality(influencer: any): number {
    let score = 0.5;
    if (influencer.channelThumbnail) score += 0.2;
    if (influencer.recentVideos?.length >= 10) score += 0.1;
    if (influencer.avgTitleLength >= 30) score += 0.1;
    return Math.min(score, 1.0);
  }

  private scoreConsistency(influencer: any): number {
    if (!influencer.publishConsistency) return 0.5;
    return influencer.publishConsistency;
  }

  private scoreGrowthRate(influencer: any): number {
    const trend = influencer.viewsTrend || 0;
    if (trend >= 50) return 1.0;
    if (trend >= 30) return 0.9;
    if (trend >= 20) return 0.8;
    if (trend >= 10) return 0.7;
    if (trend >= 5) return 0.6;
    if (trend >= 0) return 0.5;
    if (trend >= -10) return 0.3;
    return 0.1;
  }

  private scoreTrending(influencer: any): number {
    const recentVideos = influencer.recentVideos || [];
    if (recentVideos.length < 3) return 0.5;

    const recentViewsData = recentVideos.slice(0, 3).map((v: any) => v.viewCount);
    const olderViews = recentVideos.slice(3, 6).map((v: any) => v.viewCount);

    if (olderViews.length === 0) return 0.5;

    const recentAvg = recentViewsData.reduce((a: number, b: number) => a + b, 0) / recentViewsData.length;
    const olderAvg = olderViews.reduce((a: number, b: number) => a + b, 0) / olderViews.length;

    if (olderAvg === 0) return 0.5;

    const ratio = recentAvg / olderAvg;
    if (ratio >= 1.5) return 1.0;
    if (ratio >= 1.2) return 0.9;
    if (ratio >= 1.0) return 0.7;
    if (ratio >= 0.8) return 0.5;
    return 0.3;
  }

  private scorePotential(influencer: any): number {
    let score = 0.5;
    const subs = influencer.subscriberCount || 0;
    if (subs < 100000) score += 0.2;
    if (subs < 50000) score += 0.1;
    return Math.min(score, 1.0);
  }

  private scoreRelevance(influencer: any, product: any): number {
    let score = 0;
    const keywords = (product.keywords || []).map((k: string) => k.toLowerCase());
    const description = (influencer.description || '').toLowerCase();
    const titles = (influencer.recentVideos || []).map((v: any) => (v.title || '').toLowerCase()).join(' ');

    if (keywords.length === 0) return 0.5;

    const matchedKeywords = keywords.filter((kw: string) => description.includes(kw) || titles.includes(kw));
    score += (matchedKeywords.length / keywords.length) * 0.5;

    return Math.min(score, 1.0);
  }

  private scoreCostEfficiency(influencer: any): number {
    const subs = influencer.subscriberCount || 0;
    const avgViews = influencer.avgViews || 0;
    const engagement = influencer.engagementRate || 0;

    const estimatedCost = Math.round(subs * 0.01 * (engagement / 5));
    const estimatedEngagement = Math.round(avgViews * (engagement / 100));
    const efficiency = estimatedCost > 0 ? estimatedEngagement / estimatedCost : 0;

    if (efficiency >= 10) return 1.0;
    if (efficiency >= 5) return 0.9;
    if (efficiency >= 3) return 0.8;
    if (efficiency >= 1) return 0.6;
    return 0.4;
  }

  private determineTier(total: number): 'tier1' | 'tier2' | 'tier3' | 'tier4' {
    if (total >= 80) return 'tier1';
    if (total >= 60) return 'tier2';
    if (total >= 40) return 'tier3';
    return 'tier4';
  }

  private generateRecommendations(influencer: any, breakdown: any, tier: string): string[] {
    const recommendations: string[] = [];

    if (tier === 'tier1') {
      recommendations.push('头部达人，适合品牌曝光');
      recommendations.push('建议提供定制化合作方案');
      recommendations.push('预算需求较高');
    } else if (tier === 'tier2') {
      recommendations.push('中腰部达人，平衡曝光和转化');
      recommendations.push('建议提供中等预算 + 联盟佣金');
    } else if (tier === 'tier3') {
      recommendations.push('长尾达人，高转化率');
      recommendations.push('建议提供免费产品 + 联盟佣金');
    } else {
      recommendations.push('新兴达人，性价比高');
      recommendations.push('建议提供产品授权 + 小额报酬');
      recommendations.push('适合长期培养');
    }

    if (breakdown.growthRate >= 0.7) {
      recommendations.push('快速增长中，现在合作收益可能更大');
    }

    if (breakdown.consistency >= 0.9) {
      recommendations.push('发布稳定，适合长期合作');
    }

    return recommendations;
  }
}

// 导出单例
export const influencerCollector = new InfluencerCollector();
export const scoringModel = new ScoringModel();
