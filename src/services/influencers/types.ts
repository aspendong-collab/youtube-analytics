/**
 * 达人社相关类型定义
 */

/**
 * 达人档案
 */
export interface InfluencerProfile {
  id: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
  description?: string;
  customUrl?: string;
  country?: string;
  language?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  subscriberRanking?: number;
  viewRanking?: number;
  totalScore?: number;
  scoreTier?: string;
  collaborationCount?: number;
  lastCooperationAt?: Date;
  cooperationStatus?: 'available' | 'cooperating' | 'blacklisted';
  tags?: string[];
  category?: string;
  niche?: string[];
  averageViews?: number;
  averageLikes?: number;
  averageComments?: number;
  engagementRate?: number;
  lastSyncedAt?: Date;
  metrics?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 达人收藏
 */
export interface InfluencerFavorite {
  id: string;
  userId: string;
  influencerId: string;
  notes?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 达人合作记录
 */
export interface InfluencerCooperation {
  id: string;
  influencerId: string;
  campaignId?: string;
  userId: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'rejected';
  type: 'video' | 'stream' | 'post' | 'other';
  title: string;
  description?: string;
  budget?: number;
  expectedViews?: number;
  actualViews?: number;
  startDate?: Date;
  endDate?: Date;
  deliverables?: string[];
  metrics?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

/**
 * 达人搜索参数
 */
export interface InfluencerSearchParams {
  query?: string;
  category?: string;
  minSubscribers?: number;
  maxSubscribers?: number;
  minViews?: number;
  maxViews?: number;
  minEngagementRate?: number;
  maxEngagementRate?: number;
  country?: string[];
  language?: string[];
  niche?: string[];
  collaborationStatus?: 'available' | 'cooperating' | 'blacklisted';
  scoreTier?: string[];
  sortBy?: 'relevance' | 'subscriberCount' | 'viewCount' | 'engagementRate' | 'totalScore';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * 达人分析数据
 */
export interface InfluencerAnalytics {
  influencerId: string;
  period: '7d' | '30d' | '90d' | '1y' | 'all';
  subscriberGrowth: {
    start: number;
    end: number;
    growth: number;
    growthRate: number;
  };
  viewGrowth: {
    start: number;
    end: number;
    growth: number;
    growthRate: number;
  };
  engagementMetrics: {
    averageViews: number;
    averageLikes: number;
    averageComments: number;
    engagementRate: number;
  };
  topVideos: Array<{
    videoId: string;
    title: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: Date;
  }>;
  contentFrequency: {
    totalVideos: number;
    averagePerWeek: number;
    lastUploadAt: Date;
  };
  audienceDemographics?: {
    ageGroups: Record<string, number>;
    gender: Record<string, number>;
    countries: Record<string, number>;
  };
  updatedAt: Date;
}
