import type { InfluencerProfile } from '@/types/influencer';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

/**
 * 评分维度
 */
export type ScoreDimension = 
  | 'contentRelevance'  // 内容相关性 30%
  | 'audienceMatch'     // 受众匹配度 25%
  | 'activity'          // 活跃度 20%
  | 'fanQuality'        // 粉丝质量 15%
  | 'collaborationValue'; // 合作价值 10%

/**
 * 评分详情
 */
export interface ScoreDetails {
  contentRelevance: number;    // 内容相关性 (0-100)
  audienceMatch: number;       // 受众匹配度 (0-100)
  activity: number;            // 活跃度 (0-100)
  fanQuality: number;          // 粉丝质量 (0-100)
  collaborationValue: number;  // 合作价值 (0-100)
}

/**
 * 综合评分结果
 */
export interface ScoreResult {
  total: number;               // 总分 (0-100)
  details: ScoreDetails;       // 各维度分数
  category: '精准博主' | '次优博主' | '潜在博主' | '不推荐';
  reason: string;              // 推荐理由
  recommendation: string;      // 建议
}

/**
 * 评分配置
 */
export interface ScoreConfig {
  // 权重配置（总和应为 100）
  weights: {
    contentRelevance: number;
    audienceMatch: number;
    activity: number;
    fanQuality: number;
    collaborationValue: number;
  };

  // 目标受众配置
  targetAudience: {
    languages: string[];       // 目标语言（如 ['zh', 'en']）
    countries?: string[];      // 目标国家/地区（如 ['US', 'CN', 'JP']）
    minSubscribers?: number;   // 最小粉丝数
    maxSubscribers?: number;   // 最大粉丝数
  };

  // 关键词列表（用于计算内容相关性）
  keywords: string[];

  // 活跃度阈值
  activityThresholds: {
    recentVideosMin: number;   // 最近 30 天最少视频数
    publishIntervalMax: number; // 最大发布间隔（天）
    minEngagementRate: number; // 最小互动率
  };
}

/**
 * 达人评分器
 */
class InfluencerScorer {
  // 默认权重配置
  private readonly defaultWeights = {
    contentRelevance: 30,
    audienceMatch: 25,
    activity: 20,
    fanQuality: 15,
    collaborationValue: 10,
  };

  /**
   * 计算内容相关性 (30%)
   * 基于关键词在视频标题、描述、标签中的出现频率
   */
  private calculateContentRelevance(
    profile: InfluencerProfile,
    keywords: string[]
  ): number {
    let relevanceScore = 0;
    let totalKeywords = keywords.length;

    if (totalKeywords === 0) return 0;

    // 检查标题
    profile.recentVideos.forEach(video => {
      const title = video.title.toLowerCase();
      const description = video.description.toLowerCase();
      const tags = (video.tags || []).join(' ').toLowerCase();

      keywords.forEach(keyword => {
        const kw = keyword.toLowerCase();
        let matches = 0;

        // 标题匹配（权重最高）
        if (title.includes(kw)) {
          matches += 3;
        }

        // 描述匹配
        if (description.includes(kw)) {
          matches += 1;
        }

        // 标签匹配
        if (tags.includes(kw)) {
          matches += 2;
        }

        relevanceScore += Math.min(matches, 5); // 每个关键词最多贡献 5 分
      });
    });

    // 归一化到 0-100
    const maxScore = totalKeywords * 5 * profile.recentVideos.length;
    return maxScore > 0 ? Math.round((relevanceScore / maxScore) * 100) : 0;
  }

  /**
   * 计算受众匹配度 (25%)
   * 基于语言、地理位置、粉丝规模
   */
  private calculateAudienceMatch(
    profile: InfluencerProfile,
    config: ScoreConfig['targetAudience']
  ): number {
    let matchScore = 0;
    let totalCriteria = 0;

    // 语言匹配
    if (config.languages && config.languages.length > 0) {
      totalCriteria++;
      const channelLanguage = (profile.defaultLanguage || '').toLowerCase();
      
      // 检查频道语言是否匹配目标语言
      if (config.languages.some(lang => channelLanguage.includes(lang.toLowerCase()))) {
        matchScore += 1;
      }
    }

    // 国家/地区匹配
    if (config.countries && config.countries.length > 0) {
      totalCriteria++;
      const channelCountry = (profile.country || '').toLowerCase();
      
      if (config.countries.some(country => channelCountry === country.toLowerCase())) {
        matchScore += 1;
      }
    }

    // 粉丝规模匹配
    if (config.minSubscribers !== undefined || config.maxSubscribers !== undefined) {
      totalCriteria++;
      const subscriberCount = profile.subscriberCount || 0;
      
      if (
        (config.minSubscribers === undefined || subscriberCount >= config.minSubscribers) &&
        (config.maxSubscribers === undefined || subscriberCount <= config.maxSubscribers)
      ) {
        matchScore += 1;
      }
    }

    // 归一化到 0-100
    return totalCriteria > 0 ? Math.round((matchScore / totalCriteria) * 100) : 50;
  }

  /**
   * 计算活跃度 (20%)
   * 基于发布频率、近期视频数、互动率
   */
  private calculateActivity(
    profile: InfluencerProfile,
    thresholds: ScoreConfig['activityThresholds']
  ): number {
    let activityScore = 0;

    const videos = profile.recentVideos || [];
    if (videos.length === 0) return 0;

    // 1. 检查最近 30 天的视频数量
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentVideoCount = videos.filter(
      video => new Date(video.publishedAt) >= thirtyDaysAgo
    ).length;

    if (recentVideoCount >= thresholds.recentVideosMin) {
      activityScore += 30;
    } else if (recentVideoCount > 0) {
      activityScore += 15;
    }

    // 2. 检查发布间隔
    if (videos.length > 1) {
      const sortedVideos = [...videos].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      let maxInterval = 0;
      for (let i = 0; i < sortedVideos.length - 1; i++) {
        const interval =
          (new Date(sortedVideos[i].publishedAt).getTime() -
            new Date(sortedVideos[i + 1].publishedAt).getTime()) /
          (24 * 60 * 60 * 1000); // 转换为天
        if (interval > maxInterval) {
          maxInterval = interval;
        }
      }

      if (maxInterval <= thresholds.publishIntervalMax) {
        activityScore += 30;
      } else if (maxInterval <= thresholds.publishIntervalMax * 2) {
        activityScore += 15;
      }
    }

    // 3. 计算平均互动率
    const avgEngagementRate = profile.engagementRate || 0;
    if (avgEngagementRate >= thresholds.minEngagementRate) {
      activityScore += 40;
    } else if (avgEngagementRate >= thresholds.minEngagementRate * 0.5) {
      activityScore += 20;
    }

    return activityScore;
  }

  /**
   * 计算粉丝质量 (15%)
   * 基于互动率、观看转化率、订阅增长
   */
  private calculateFanQuality(profile: InfluencerProfile): number {
    let qualityScore = 0;

    // 1. 互动率
    const engagementRate = profile.engagementRate || 0;
    if (engagementRate >= 10) {
      qualityScore += 40;
    } else if (engagementRate >= 5) {
      qualityScore += 30;
    } else if (engagementRate >= 3) {
      qualityScore += 20;
    } else if (engagementRate >= 1) {
      qualityScore += 10;
    }

    // 2. 观看转化率（平均观看量 / 粉丝数）
    const subscriberCount = profile.subscriberCount || 0;
    const avgViews = profile.avgViews || 0;

    if (subscriberCount > 0) {
      const viewConversionRate = (avgViews / subscriberCount) * 100;
      
      if (viewConversionRate >= 10) {
        qualityScore += 30;
      } else if (viewConversionRate >= 5) {
        qualityScore += 20;
      } else if (viewConversionRate >= 2) {
        qualityScore += 10;
      }
    }

    // 3. 视频质量（基于点赞比）
    const videos = profile.recentVideos || [];
    if (videos.length > 0) {
      const avgLikeRatio =
        videos.reduce((sum, video) => {
          const views = video.viewCount || 0;
          const likes = video.likeCount || 0;
          return sum + (views > 0 ? likes / views : 0);
        }, 0) / videos.length;

      if (avgLikeRatio >= 0.05) {
        qualityScore += 30;
      } else if (avgLikeRatio >= 0.03) {
        qualityScore += 20;
      } else if (avgLikeRatio >= 0.01) {
        qualityScore += 10;
      }
    }

    return qualityScore;
  }

  /**
   * 计算合作价值 (10%)
   * 基于平均观看量、粉丝规模、商业潜力
   */
  private calculateCollaborationValue(profile: InfluencerProfile): number {
    let valueScore = 0;

    // 1. 平均观看量
    const avgViews = profile.avgViews || 0;
    if (avgViews >= 1000000) {
      valueScore += 40;
    } else if (avgViews >= 100000) {
      valueScore += 30;
    } else if (avgViews >= 10000) {
      valueScore += 20;
    } else if (avgViews >= 1000) {
      valueScore += 10;
    }

    // 2. 粉丝规模
    const subscriberCount = profile.subscriberCount || 0;
    if (subscriberCount >= 1000000) {
      valueScore += 30;
    } else if (subscriberCount >= 100000) {
      valueScore += 25;
    } else if (subscriberCount >= 10000) {
      valueScore += 20;
    } else if (subscriberCount >= 1000) {
      valueScore += 15;
    }

    // 3. 商业潜力（基于频道描述中的关键词）
    const description = (profile.description || '').toLowerCase();
    const businessKeywords = ['合作', '商务', '推广', '广告', '赞助', 'business', 'collaboration', 'sponsor'];
    
    if (businessKeywords.some(kw => description.includes(kw))) {
      valueScore += 30;
    } else if (profile.inferredEmail?.email || profile.contactInfo?.email || profile.contactInfo?.businessEmail) {
      // 有邮箱也可能意味着愿意合作
      valueScore += 15;
    }

    return valueScore;
  }

  /**
   * 分类达人
   */
  private classifyInfluencer(
    scoreDetails: ScoreDetails
  ): Pick<ScoreResult, 'category' | 'reason' | 'recommendation'> {
    const total = this.calculateTotalScore(scoreDetails);
    const { contentRelevance, audienceMatch, activity, fanQuality, collaborationValue } = scoreDetails;

    // 精准博主
    if (total >= 80 && contentRelevance >= 80) {
      return {
        category: '精准博主',
        reason: `内容高度相关（${contentRelevance}%），受众匹配度好（${audienceMatch}%），活跃度高（${activity}%）`,
        recommendation: '优先合作',
      };
    }

    // 次优博主
    if (total >= 60 && contentRelevance >= 60) {
      return {
        category: '次优博主',
        reason: `内容相关性较好（${contentRelevance}%），部分指标优秀，可考虑合作`,
        recommendation: '可考虑合作',
      };
    }

    // 潜在博主
    if (total >= 40 && contentRelevance >= 40) {
      return {
        category: '潜在博主',
        reason: `有一定匹配度，需要进一步观察和培养关系`,
        recommendation: '保持关注',
      };
    }

    // 不推荐
    return {
      category: '不推荐',
      reason: `匹配度较低（${contentRelevance}%），不建议当前合作`,
      recommendation: '暂不考虑',
    };
  }

  /**
   * 计算总分
   */
  private calculateTotalScore(scoreDetails: ScoreDetails, weights = this.defaultWeights): number {
    const total =
      (scoreDetails.contentRelevance * weights.contentRelevance +
        scoreDetails.audienceMatch * weights.audienceMatch +
        scoreDetails.activity * weights.activity +
        scoreDetails.fanQuality * weights.fanQuality +
        scoreDetails.collaborationValue * weights.collaborationValue) / 100;

    return Math.round(total);
  }

  /**
   * 生成推荐理由（使用 AI）
   */
  private async generateReason(
    profile: InfluencerProfile,
    scoreDetails: ScoreDetails,
    category: string
  ): Promise<string> {
    try {
      const config = new Config();
      const client = new LLMClient(config);

      const prompt = `请为以下 YouTube 达人生成一个简洁的推荐理由（50 字以内）。

达人信息：
- 频道：${profile.channelTitle}
- 粉丝：${(profile.subscriberCount || 0).toLocaleString()}
- 平均观看：${(profile.avgViews || 0).toLocaleString()}
- 互动率：${(profile.engagementRate || 0).toFixed(1)}%
- 语言：${profile.defaultLanguage || '未知'}
- 分类：${category}

评分详情：
- 内容相关性：${scoreDetails.contentRelevance}%
- 受众匹配度：${scoreDetails.audienceMatch}%
- 活跃度：${scoreDetails.activity}%
- 粉丝质量：${scoreDetails.fanQuality}%
- 合作价值：${scoreDetails.collaborationValue}%

请生成 50 字以内的推荐理由，突出该达人的核心优势。`;

      const response = await client.invoke(
        [{ role: 'user', content: prompt }],
        {
          model: 'doubao-seed-1-6-flash-250615',
          temperature: 0.7,
        }
      );

      return response.content.trim();
    } catch (error) {
      console.error('[InfluencerScorer] AI 生成推荐理由失败:', error);
      // 降级：返回简单的理由
      return `${profile.channelTitle} - ${category}`;
    }
  }

  /**
   * 评分单个达人
   */
  async score(
    profile: InfluencerProfile,
    config: Partial<ScoreConfig> = {},
    useAIReason: boolean = false
  ): Promise<ScoreResult> {
    // 合并配置
    const fullConfig: ScoreConfig = {
      weights: { ...this.defaultWeights, ...config.weights },
      targetAudience: {
        languages: config.targetAudience?.languages || ['zh'],
        countries: config.targetAudience?.countries,
        minSubscribers: config.targetAudience?.minSubscribers,
        maxSubscribers: config.targetAudience?.maxSubscribers,
      },
      keywords: config.keywords || [],
      activityThresholds: {
        recentVideosMin: config.activityThresholds?.recentVideosMin || 2,
        publishIntervalMax: config.activityThresholds?.publishIntervalMax || 14,
        minEngagementRate: config.activityThresholds?.minEngagementRate || 1,
      },
    };

    // 计算各维度分数
    const scoreDetails: ScoreDetails = {
      contentRelevance: this.calculateContentRelevance(profile, fullConfig.keywords),
      audienceMatch: this.calculateAudienceMatch(profile, fullConfig.targetAudience),
      activity: this.calculateActivity(profile, fullConfig.activityThresholds),
      fanQuality: this.calculateFanQuality(profile),
      collaborationValue: this.calculateCollaborationValue(profile),
    };

    // 分类
    const classification = this.classifyInfluencer(scoreDetails);

    // 计算总分
    const total = this.calculateTotalScore(scoreDetails, fullConfig.weights);

    // 生成推荐理由
    let reason = classification.reason;
    if (useAIReason) {
      reason = await this.generateReason(profile, scoreDetails, classification.category);
    }

    return {
      total,
      details: scoreDetails,
      category: classification.category,
      reason,
      recommendation: classification.recommendation,
    };
  }

  /**
   * 批量评分
   */
  async scoreBatch(
    profiles: InfluencerProfile[],
    config: Partial<ScoreConfig> = {},
    useAIReason: boolean = false
  ): Promise<Map<string, ScoreResult>> {
    const results = new Map<string, ScoreResult>();

    // 批量评分（可以使用并行处理）
    const promises = profiles.map(async (profile) => {
      const result = await this.score(profile, config, useAIReason);
      return { channelId: profile.channelId, result };
    });

    const scored = await Promise.all(promises);
    scored.forEach(({ channelId, result }) => {
      results.set(channelId, result);
    });

    return results;
  }
}

// 导出单例
export const influencerScorer = new InfluencerScorer();
