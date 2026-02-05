import { ExpansionResult, YouTubeVideo } from './types';
import { google } from 'googleapis';

/**
 * 搜索量估算模型
 * 基于YouTube API数据自建估算模型，不依赖外部付费API
 */
export class SearchVolumeEstimator {
  private youtube: any;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }
  /**
   * 估算关键词搜索量
   * 算法：基于相关视频的观看数、评论数、点赞数等多维度指标
   */
  async estimateSearchVolume(keyword: string): Promise<{
    estimatedSearchVolume: number;
    estimatedCompetition: number;
    confidence: number;
  }> {
    try {
      // 搜索相关视频
      const searchResponse = await this.youtube.search.list({
        q: keyword,
        part: ['snippet'],
        maxResults: 20,
        type: ['video'],
        order: 'relevance',
      });

      let videoIds: string[] = [];
      if (searchResponse.data.items) {
        videoIds = searchResponse.data.items
          .map((item: any) => item.id?.videoId)
          .filter(Boolean);
      }

      if (videoIds.length === 0) {
        return {
          estimatedSearchVolume: 0,
          estimatedCompetition: 0,
          confidence: 0.3,
        };
      }

      // 获取视频统计数据
      const videosResponse = await this.youtube.videos.list({
        id: videoIds,
        part: ['statistics', 'snippet'],
      });

      const stats = {
        totalViews: 0,
        avgViews: 0,
        totalLikes: 0,
        totalComments: 0,
        videoCount: 0,
        maxViews: 0,
      };

      if (videosResponse.data.items) {
        stats.videoCount = videosResponse.data.items.length;

        for (const video of videosResponse.data.items) {
          const videoStats = video.statistics;
          const viewCount = parseInt(videoStats?.viewCount || '0');
          const likeCount = parseInt(videoStats?.likeCount || '0');
          const commentCount = parseInt(videoStats?.commentCount || '0');

          stats.totalViews += viewCount;
          stats.totalLikes += likeCount;
          stats.totalComments += commentCount;
          stats.maxViews = Math.max(stats.maxViews, viewCount);
        }

        stats.avgViews = stats.totalViews / stats.videoCount;
      }

      // 计算搜索量（基于多维度指标）
      const searchVolume = this.calculateSearchVolume(stats);

      // 计算竞争度（基于视频数量和平均观看数）
      const competition = this.calculateCompetition(stats);

      // 计算置信度（基于数据量和一致性）
      const confidence = this.calculateConfidence(stats, keyword);

      return {
        estimatedSearchVolume: searchVolume,
        estimatedCompetition: competition,
        confidence,
      };
    } catch (error) {
      console.error('搜索量估算失败:', error);
      return {
        estimatedSearchVolume: 0,
        estimatedCompetition: 0,
        confidence: 0,
      };
    }
  }

  /**
   * 基于视频统计数据计算搜索量
   */
  private calculateSearchVolume(stats: {
    totalViews: number;
    avgViews: number;
    totalLikes: number;
    totalComments: number;
    videoCount: number;
    maxViews: number;
  }): number {
    if (stats.videoCount === 0) return 0;

    // 权重配置
    const weights = {
      avgViews: 0.4,
      maxViews: 0.2,
      totalLikes: 0.2,
      totalComments: 0.1,
      videoCount: 0.1,
    };

    // 归一化处理（假设最大观看数为10M）
    const normalizedAvgViews = Math.min(stats.avgViews / 10000000, 1);
    const normalizedMaxViews = Math.min(stats.maxViews / 10000000, 1);
    const normalizedLikes = Math.min(stats.totalLikes / 1000000, 1);
    const normalizedComments = Math.min(stats.totalComments / 100000, 1);
    const normalizedCount = Math.min(stats.videoCount / 20, 1);

    // 计算综合得分
    const score =
      normalizedAvgViews * weights.avgViews +
      normalizedMaxViews * weights.maxViews +
      normalizedLikes * weights.totalLikes +
      normalizedComments * weights.totalComments +
      normalizedCount * weights.videoCount;

    // 映射到搜索量（0-10000）
    return Math.floor(score * 10000);
  }

  /**
   * 计算竞争度
   */
  private calculateCompetition(stats: {
    totalViews: number;
    avgViews: number;
    videoCount: number;
    maxViews: number;
  }): number {
    if (stats.videoCount === 0) return 0;

    // 视频数量影响竞争度（视频越多，竞争越大）
    const countScore = Math.min(stats.videoCount / 20, 1) * 0.4;

    // 平均观看数影响竞争度（平均观看数高，说明关键词热度大）
    const avgViewsScore = Math.min(stats.avgViews / 1000000, 1) * 0.3;

    // 最高观看数影响竞争度（有爆款视频，说明竞争激烈）
    const maxViewsScore = Math.min(stats.maxViews / 5000000, 1) * 0.3;

    return Math.min(countScore + avgViewsScore + maxViewsScore, 1);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(stats: any, keyword: string): number {
    let confidence = 0.5; // 基础置信度

    // 数据量越大，置信度越高
    if (stats.videoCount >= 15) confidence += 0.2;
    else if (stats.videoCount >= 10) confidence += 0.1;
    else if (stats.videoCount < 5) confidence -= 0.2;

    // 平均观看数分布的均匀性
    if (stats.avgViews > 0 && stats.maxViews > 0) {
      const variance = stats.maxViews / stats.avgViews;
      if (variance < 10) confidence += 0.1; // 分布均匀
      else confidence -= 0.1; // 分布不均
    }

    // 关键词长度
    if (keyword.length >= 4 && keyword.length <= 10) confidence += 0.1;
    else if (keyword.length < 3 || keyword.length > 15) confidence -= 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 批量估算搜索量
   */
  async estimateBatch(keywords: ExpansionResult[]): Promise<ExpansionResult[]> {
    const results: ExpansionResult[] = [];

    // 限制并发请求，避免API配额耗尽
    const batchSize = 5;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(kw => this.enhanceKeywordWithEstimates(kw))
      );
      results.push(...batchResults);

      // 避免API限流
      if (i + batchSize < keywords.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  /**
   * 为单个关键词添加估算数据
   */
  private async enhanceKeywordWithEstimates(
    keyword: ExpansionResult
  ): Promise<ExpansionResult> {
    const estimates = await this.estimateSearchVolume(keyword.keyword);

    return {
      ...keyword,
      estimatedSearchVolume: estimates.estimatedSearchVolume,
      estimatedCompetition: estimates.estimatedCompetition,
      recommendationScore: this.calculateRecommendationScore(
        keyword.relevance,
        estimates.estimatedSearchVolume,
        estimates.estimatedCompetition,
        estimates.confidence
      ),
    };
  }

  /**
   * 计算推荐指数
   */
  private calculateRecommendationScore(
    relevance: number,
    searchVolume: number,
    competition: number,
    confidence: number
  ): number {
    // 推荐指数 = 相关性 * 0.3 + 搜索量 * 0.3 + (1-竞争) * 0.2 + 置信度 * 0.2
    const normalizedVolume = searchVolume / 10000;

    return (
      relevance * 0.3 +
      normalizedVolume * 0.3 +
      (1 - competition) * 0.2 +
      confidence * 0.2
    );
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const searchVolumeEstimator = new SearchVolumeEstimator();
