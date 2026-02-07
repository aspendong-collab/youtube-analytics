/**
 * 营销活动相关类型定义
 */

/**
 * 营销活动
 */
export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'brand_awareness' | 'product_launch' | 'promotional' | 'affiliate' | 'review' | 'other';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  targetAudience?: {
    ageRange?: string;
    gender?: string;
    locations?: string[];
    interests?: string[];
  };
  requirements?: {
    minSubscribers?: number;
    minViews?: number;
    category?: string[];
    language?: string[];
    niche?: string[];
  };
  deliverables?: Array<{
    type: 'video' | 'stream' | 'post' | 'story' | 'other';
    quantity: number;
    specifications?: string;
  }>;
  compensation?: {
    type: 'fixed' | 'cpv' | 'cpa' | 'cpm' | 'revenue_share' | 'hybrid';
    amount?: number;
    rate?: number;
    currency?: string;
  };
  tags?: string[];
  metrics?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * 活动参与
 */
export interface CampaignParticipation {
  id: string;
  campaignId: string;
  influencerId: string;
  userId: string;
  status: 'invited' | 'accepted' | 'declined' | 'in_progress' | 'completed' | 'cancelled';
  invitedAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  compensation?: {
    amount: number;
    currency: string;
  };
  deliverables?: Array<{
    type: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    content?: string;
    url?: string;
    submittedAt?: Date;
    approvedAt?: Date;
  }>;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 活动搜索参数
 */
export interface CampaignSearchParams {
  userId?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  type?: Campaign['type'];
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  minBudget?: number;
  maxBudget?: number;
  tags?: string[];
  sortBy?: 'createdAt' | 'startDate' | 'budget' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
