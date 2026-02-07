/**
 * 领域类型定义
 */

/**
 * YouTube 视频类型
 */
export interface YouTubeVideo {
  id: string;
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt: Date;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration?: number;
  tags?: string[];
  categoryId?: string;
  language?: string;
  embeddable: boolean;
  metrics?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * YouTube 频道类型
 */
export interface YouTubeChannel {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  customUrl?: string;
  country?: string;
  language?: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt?: Date;
  metrics?: Record<string, any>;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 关键词类型
 */
export interface Keyword {
  id: string;
  userId: string;
  keyword: string;
  category?: string;
  searchVolume?: number;
  competition?: 'low' | 'medium' | 'high';
  difficulty?: number;
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  status: 'active' | 'archived' | 'deleted';
  metrics?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 关键词变体类型
 */
export interface KeywordVariant {
  id: string;
  keywordId: string;
  variant: string;
  type: 'synonym' | 'antonym' | 'related' | 'long_tail';
  similarity?: number;
  source?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 用户类型
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 会话类型
 */
export interface Session {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * API Key 类型
 */
export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  type: 'youtube' | 'openai' | 'custom';
  status: 'active' | 'inactive' | 'revoked';
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  rateLimit?: number;
  createdAt: Date;
  updatedAt?: Date;
}
