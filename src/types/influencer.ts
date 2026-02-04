// 达人相关类型定义

export interface InfluencerProfile {
  // 基础身份信息
  channelId: string;
  channelTitle: string;
  channelThumbnail: string;
  channelBanner: string;
  customUrl: string;

  // 订阅与统计数据
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  hiddenSubscriberCount: boolean;

  // 频道描述信息
  description: string;
  keywords: string[];

  // 创建与更新时间
  createdAt: string;
  discoveredAt: string;
  lastUpdated: string;

  // 语言和地区
  defaultLanguage: string;
  country: string;

  // 品牌设置
  brandingSettings: {
    channel: {
      title: string;
      description: string;
      keywords: string[];
      trackingAnalyticsAccountId: string;
      moderateComments: boolean;
      showRelatedChannels: boolean;
      showBrowseView: boolean;
      featuredChannelsTitle: string;
      featuredChannelsUrls: string[];
      unsubscribedTrailer: string;
      profileColor: string;
    };
  };
  uploadsPlaylistId: string;

  // 最近视频数据
  recentVideos: InfluencerVideo[];

  // 计算统计数据
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgDuration: string;
  avgDurationSeconds: number;

  // 互动数据
  engagementRate: number;
  likeRate: number;
  commentRate: number;

  // 增长趋势
  viewsTrend: number;
  likesTrend: number;
  commentsTrend: number;

  // 发布规律
  publishFrequency: number;
  publishConsistency: number;
  bestPublishDays: number[];
  bestPublishHours: number[];
  avgPublishInterval: number;

  // 内容特征
  contentCategories: {
    categoryId: string;
    categoryName: string;
    count: number;
    percentage: number;
  }[];
  contentKeywords: {
    keyword: string;
    count: number;
    relevance: number;
  }[];
  avgTitleLength: number;
  avgDescriptionLength: number;

  // 视频质量指标
  avgThumbnailQuality: string;
  hasCaptions: boolean;
  avgCaptionLanguages: number;

  // 推断数据
  inferredCountry: {
    country: string;
    countryName: string;
    confidence: number;
    evidence: string[];
    possibleCountries: string[];
    sources: {
      fromDescription: boolean;
      fromLanguage: boolean;
      fromTimezone: boolean;
      fromKeywords: boolean;
    };
  };
  inferredLanguage: {
    language: string;
    languageName: string;
    confidence: number;
    evidence: string;
    source: string;
  };
  inferredEmail: {
    email: string | null;
    confidence: number;
    possibleEmails: {
      email: string;
      confidence: number;
      source: string;
    }[];
    suggestions: string[];
    sources: {
      fromDescription: boolean;
      fromBranding: boolean;
      fromSocialMedia: boolean;
    };
  };
  inferredSocialMedia: {
    twitter: string | null;
    instagram: string | null;
    tiktok: string | null;
    website: string | null;
    otherLinks: string[];
  };

  // 合作价值评估
  estimatedCost: {
    tier1: number;
    tier2: number;
    tier3: number;
    recommended: number;
  };
  estimatedReach: {
    views: number;
    engagement: number;
    conversions: number;
  };

  // 评分和分层（支持多种评分系统）
  score: {
    total: number;
    breakdown?: {
      audienceSize: number;
      audienceQuality: number;
      contentQuality: number;
      consistency: number;
      growthRate: number;
      trending: number;
      potential: number;
      relevance: number;
      costEfficiency: number;
      partnershipHistory: number;
    };
    details?: {
      contentRelevance: number;
      audienceMatch: number;
      activity: number;
      fanQuality: number;
      collaborationValue: number;
    };
    tier?: 'tier1' | 'tier2' | 'tier3' | 'tier4';
    category?: '精准博主' | '次优博主' | '潜在博主' | '不推荐';
    reason?: string;
    recommendation?: string;
    recommendations?: string[];
  };

  // 状态管理
  status: 'new' | 'contacted' | 'interested' | 'negotiating' | 'partnered' | 'rejected' | 'inactive';
  priority: 'high' | 'medium' | 'low';

  // 标签和分类
  tags: string[];
  categories: string[];

  // 联系信息
  contactInfo: {
    email: string | null;
    verifiedEmail: boolean;
    businessEmail: string | null;
    socialMedia: {
      twitter: string | null;
      instagram: string | null;
      facebook: string | null;
      tiktok: string | null;
      website: string | null;
    };
  };

  // 元数据
  metadata: {
    dataSource: string;
    discoveryKeyword: string;
    region: string;
    lastCrawledAt: string;
    crawlCount: number;
    dataQuality: number;
    flags: string[];
  };

  // 内部管理
  notes: string;
  assignedTo: string | null;
  assignedAt: string | null;

  // 合同和预算
  budgetInfo: {
    estimatedBudget: number;
    actualBudget: number | null;
    currency: string;
  };
  contractInfo: {
    status: string;
    startDate: string | null;
    endDate: string | null;
    contentType: string | null;
    deliverables: string[];
  };
}

export interface InfluencerVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  categoryId: string;
  categoryTitle: string;
  defaultLanguage: string;
  defaultAudioLanguage: string;

  // 视频统计
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;

  // 视频时长
  duration: string;
  durationSeconds: number;
  durationFormatted: string;

  // 视频主题
  tags: string[];
  topicIds: string[];
  topicCategories: string[];
}

export interface SearchRequest {
  keyword: string;
  maxResults?: number;
  regionCode?: string;
}

export interface FilterCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'in' | 'nin' | 'contains';
  value: any;
}

export interface ScreeningRules {
  must: FilterCondition[];
  should: FilterCondition[];
  exclude: FilterCondition[];
}

export interface RecommendationRequest {
  product: {
    keywords: string[];
    targetAudience: string;
    category: string;
    budget: number;
    minSubscribers?: number;
    maxSubscribers?: number;
    minEngagement?: number;
  };
  targetCount: number;
  filters?: {
    country?: string[];
    language?: string[];
    tier?: ('tier1' | 'tier2' | 'tier3' | 'tier4')[];
  };
}

export interface ScoreResult {
  total: number;
  breakdown: {
    audienceSize: number;
    audienceQuality: number;
    contentQuality: number;
    consistency: number;
    growthRate: number;
    trending: number;
    potential: number;
    relevance: number;
    costEfficiency: number;
    partnershipHistory: number;
  };
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  recommendations: string[];
}

export interface InferenceResult {
  country: {
    country: string;
    countryName: string;
    confidence: number;
    evidence: string[];
    possibleCountries: string[];
    sources: {
      fromDescription: boolean;
      fromLanguage: boolean;
      fromTimezone: boolean;
      fromKeywords: boolean;
    };
  };
  language: {
    language: string;
    languageName: string;
    confidence: number;
    evidence: string;
    source: string;
  };
  email: {
    email: string | null;
    confidence: number;
    possibleEmails: {
      email: string;
      confidence: number;
      source: string;
    }[];
    suggestions: string[];
    sources: {
      fromDescription: boolean;
      fromBranding: boolean;
      fromSocialMedia: boolean;
    };
  };
  socialMedia: {
    twitter: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    website: string | null;
    otherLinks: string[];
  };
}

export interface QuotaUsage {
  used: number;
  remaining: number;
  percentage: number;
  resetAt?: string;
}
