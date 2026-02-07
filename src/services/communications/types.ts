/**
 * 沟通服务相关类型定义
 */

/**
 * 沟通消息
 */
export interface CommunicationMessage {
  id: string;
  threadId: string;
  userId: string;
  senderId: string;
  senderType: 'user' | 'influencer' | 'system';
  recipientId: string;
  recipientType: 'user' | 'influencer';
  content: string;
  attachments?: Array<{
    type: 'image' | 'video' | 'document' | 'link';
    url: string;
    name?: string;
    size?: number;
  }>;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 沟通线程
 */
export interface CommunicationThread {
  id: string;
  userId: string;
  campaignId?: string;
  influencerId: string;
  subject?: string;
  status: 'active' | 'archived' | 'closed';
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  unreadCount: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
  closedAt?: Date;
}

/**
 * 沟通模板
 */
export interface CommunicationTemplate {
  id: string;
  userId: string;
  name: string;
  type: 'outreach' | 'follow_up' | 'negotiation' | 'closing' | 'custom';
  subject?: string;
  content: string;
  variables?: Array<{
    name: string;
    description: string;
    type: 'text' | 'number' | 'date';
  }>;
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 自动回复规则
 */
export interface AutoReplyRule {
  id: string;
  userId: string;
  name: string;
  trigger: {
    keywords?: string[];
    conditions?: Array<{
      field: string;
      operator: 'contains' | 'equals' | 'starts_with' | 'ends_with';
      value: string;
    }>;
  };
  action: {
    type: 'reply' | 'forward' | 'assign' | 'tag';
    templateId?: string;
    replyContent?: string;
    assignTo?: string;
    tags?: string[];
  };
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
