/**
 * 自动化达人营销系统 - 类型定义
 */

// ========================================
// 自动匹配相关类型
// ========================================

export interface TargetingCriteria {
  categories: string[];          // 分类
  regions: string[];             // 区域
  languages: string[];           // 语种
  minSubscriberCount: number;
  maxSubscriberCount: number;
  minEngagementRate: number;
  maxPrice?: number;             // 单个博主预算上限
  minQualityScore?: number;
  level?: string[];              // 等级过滤
}

export interface AutoMatchRequest {
  campaignId: string;
  criteria: TargetingCriteria;
  targetCount: number;
  budgetPerInfluencer?: number;
}

export interface MatchedInfluencer {
  influencerId: string;
  influencer: InfluencerMatch;
  estimatedPrice: number;
  matchScore: number;            // 0-100
  matchReason: string[];
}

export interface InfluencerMatch {
  id: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string | null;
  subscriberCount: number;
  totalVideos: number;
  totalViews: number;
  email: string | null;
  phone: string | null;
  wechat: string | null;
  category: string | null;
  niche: string | null;
  level: string;
  priceRange: string | null;
  averagePrice: number | null;
  qualityScore: number | null;
  cooperationScore: number | null;
  engagementRate: number | null;
  status: string;
  isFavorite: boolean;
  cooperationCount: number;
}

export interface AutoMatchResult {
  campaignId: string;
  matchedInfluencers: MatchedInfluencer[];
  totalMatched: number;
  estimatedTotalCost: number;
  matchDuration: number;         // 匹配耗时（毫秒）
}

// ========================================
// 邮件相关类型
// ========================================

export type EmailType = 'invitation' | 'negotiation' | 'followup' | 'confirmation' | 'rejection';
export type EmailStatus = 'queued' | 'sending' | 'sent' | 'failed' | 'bounced';
export type EmailProvider = 'elastic' | 'ses' | 'resend' | 'mailjet';

export interface EmailOptions {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text?: string;
  campaignId?: string;
  influencerId?: string;
  emailType?: EmailType;
  trackingEnabled?: boolean;
}

export interface EmailQueueItem {
  id: string;
  campaignId: string;
  influencerId: string;
  autoMatchId: string | null;
  emailType: EmailType;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  content: string;
  htmlContent: string | null;
  provider: EmailProvider;
  providerMessageId: string | null;
  status: EmailStatus;
  scheduledAt: Date;
  sentAt: Date | null;
  failedAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  trackingEnabled: boolean;
  trackingPixelUrl: string | null;
  openedAt: Date | null;
  openCount: number;
  clickedAt: Date | null;
  clickCount: number;
  bouncedAt: Date | null;
  bounceType: 'hard' | 'soft' | null;
  bounceReason: string | null;
  spamComplainedAt: Date | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailStatistics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalSpammed: number;
  totalUnsubscribed: number;
  openRate: string;
  clickRate: string;
  bounceRate: string;
  spamRate: string;
  unsubscribeRate: string;
}

// ========================================
// 谈判相关类型
// ========================================

export type NegotiationStatus = 'pending' | 'in_progress' | 'accepted' | 'rejected' | 'failed' | 'user_intervention';
export type NegotiationStrategy = 'aggressive' | 'moderate' | 'conservative';

export interface NegotiationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  price?: number;
}

export interface NegotiationRequest {
  campaignId: string;
  influencerId: string;
  initialPrice: number;
  strategy: NegotiationStrategy;
  maxRounds: number;
  budgetLimit: number;
  campaignContext?: any;
}

export interface Negotiation {
  id: string;
  campaignId: string;
  influencerId: string;
  autoMatchId: string | null;
  initialPrice: number;
  ourOffer: number | null;
  counterOffer: number | null;
  finalPrice: number | null;
  negotiationRounds: number;
  maxRounds: number;
  aiStrategyUsed: NegotiationStrategy;
  status: NegotiationStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  messages: NegotiationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NegotiationResponse {
  shouldContinue: boolean;
  nextOffer: number | null;
  response: string;
  reason?: string;
  needsUserApproval?: boolean;
}

// ========================================
// 工作流相关类型
// ========================================

export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';
export type WorkflowStep = 'match' | 'send_invitations' | 'wait_response' | 'followup' | 'start_negotiation' | 'negotiate' | 'confirm_deal' | 'ask_user' | 'mark_failed' | 'complete';

export interface WorkflowConfig {
  campaignId: string;
  autoMatching: boolean;
  autoNegotiation: boolean;
  strategy: NegotiationStrategy;
  budgetLimit: number;
  targetInfluencerCount: number;
}

export interface WorkflowProgress {
  totalMatched: number;
  emailsSent: number;
  emailsQueued: number;
  emailsFailed: number;
  negotiationsInProgress: number;
  negotiationsAccepted: number;
  negotiationsRejected: number;
  awaitingUserApproval: number;
  dealsConfirmed: number;
}

export interface WorkflowTimelineItem {
  timestamp: string;
  event: string;
  step: WorkflowStep | null;
  details: any;
}

// ========================================
// 任务队列相关类型
// ========================================

export type JobType = 'email_send' | 'negotiation_check' | 'auto_match' | 'followup_send' | 'stat_update';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  jobType: JobType;
  jobData: Record<string, any>;
  priority: number;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  status: JobStatus;
  result: any | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// 邮件模板相关类型
// ========================================

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
}

export interface InvitationTemplateContext {
  influencerName: string;
  influencerChannel: string;
  influencerCategory: string;
  campaignName: string;
  campaignDescription: string;
  budgetRange: string;
  senderName: string;
  senderEmail: string;
  companyName?: string;
}

export interface NegotiationTemplateContext {
  influencerName: string;
  campaignName: string;
  ourOffer: number;
  previousPrice?: number;
  negotiationRound: number;
  senderName: string;
  strategy?: NegotiationStrategy;
}
