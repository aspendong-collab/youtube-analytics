import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 扩展 Influencers 表，添加 AI 推荐相关字段
export const aiInfluencers = pgTable(
  "ai_influencers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    channelId: varchar("channel_id", { length: 50 }).notNull().unique(),
    channelTitle: varchar("channel_title", { length: 200 }).notNull(),
    channelThumbnail: text("channel_thumbnail"),
    channelBanner: text("channel_banner"),
    customUrl: varchar("custom_url", { length: 255 }),

    // 订阅与统计数据
    subscriberCount: integer("subscriber_count").default(0),
    viewCount: integer("view_count").default(0),
    videoCount: integer("video_count").default(0),
    hiddenSubscriberCount: boolean("hidden_subscriber_count").default(false),

    // 频道描述信息
    description: text("description"),
    keywords: jsonb("keywords").$type<string[]>(),

    // 创建与更新时间
    createdAt: timestamp("created_at", { withTimezone: true }),
    discoveredAt: timestamp("discovered_at", { withTimezone: true }),
    lastUpdated: timestamp("last_updated", { withTimezone: true }),

    // 语言和地区
    defaultLanguage: varchar("default_language", { length: 10 }),
    country: varchar("country", { length: 5 }),

    // 品牌设置
    brandingSettings: jsonb("branding_settings"),
    uploadsPlaylistId: varchar("uploads_playlist_id", { length: 255 }),

    // 计算统计数据
    avgViews: integer("avg_views").default(0),
    avgLikes: integer("avg_likes").default(0),
    avgComments: integer("avg_comments").default(0),
    avgDuration: varchar("avg_duration", { length: 20 }),
    avgDurationSeconds: integer("avg_duration_seconds").default(0),

    // 互动数据
    engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default('0'),
    likeRate: decimal("like_rate", { precision: 5, scale: 2 }).default('0'),
    commentRate: decimal("comment_rate", { precision: 5, scale: 2 }).default('0'),

    // 增长趋势
    viewsTrend: decimal("views_trend", { precision: 5, scale: 2 }).default('0'),
    likesTrend: decimal("likes_trend", { precision: 5, scale: 2 }).default('0'),
    commentsTrend: decimal("comments_trend", { precision: 5, scale: 2 }).default('0'),

    // 发布规律
    publishFrequency: decimal("publish_frequency", { precision: 5, scale: 2 }).default('0'),
    publishConsistency: decimal("publish_consistency", { precision: 3, scale: 2 }).default('0'),
    bestPublishDays: jsonb("best_publish_days").$type<number[]>(),
    bestPublishHours: jsonb("best_publish_hours").$type<number[]>(),
    avgPublishInterval: decimal("avg_publish_interval", { precision: 5, scale: 2 }).default('0'),

    // 内容特征
    contentCategories: jsonb("content_categories"),
    contentKeywords: jsonb("content_keywords"),
    avgTitleLength: integer("avg_title_length").default(0),
    avgDescriptionLength: integer("avg_description_length").default(0),

    // 视频质量指标
    avgThumbnailQuality: varchar("avg_thumbnail_quality", { length: 20 }),
    hasCaptions: boolean("has_captions").default(false),
    avgCaptionLanguages: integer("avg_caption_languages").default(0),

    // 推断数据
    inferredCountry: jsonb("inferred_country"),
    inferredLanguage: jsonb("inferred_language"),
    inferredEmail: jsonb("inferred_email"),
    inferredSocialMedia: jsonb("inferred_social_media"),

    // 合作价值评估
    estimatedCost: jsonb("estimated_cost"),
    estimatedReach: jsonb("estimated_reach"),

    // 评分和分层
    totalScore: integer("total_score").default(0),
    scoreTier: varchar("score_tier", { length: 10 }),
    scoreBreakdown: jsonb("score_breakdown"),
    scoreRecommendations: jsonb("score_recommendations").$type<string[]>(),

    // 状态管理
    status: varchar("status", { length: 20 }).default('new'),
    priority: varchar("priority", { length: 10 }).default('medium'),

    // 标签和分类
    tags: jsonb("tags").$type<string[]>(),
    categories: jsonb("categories").$type<string[]>(),

    // 联系信息
    contactInfo: jsonb("contact_info"),

    // 元数据
    metadata: jsonb("metadata"),

    // 内部管理
    notes: text("notes"),
    assignedTo: varchar("assigned_to", { length: 255 }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),

    // 合同和预算
    budgetInfo: jsonb("budget_info"),
    contractInfo: jsonb("contract_info"),

    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => ({
    channelIdIdx: index("ai_influencers_channel_id_idx").on(table.channelId),
    statusIdx: index("ai_influencers_status_idx").on(table.status),
    scoreTierIdx: index("ai_influencers_score_tier_idx").on(table.scoreTier),
    subscriberCountIdx: index("ai_influencers_subscriber_count_idx").on(table.subscriberCount),
    engagementRateIdx: index("ai_influencers_engagement_rate_idx").on(table.engagementRate),
    discoveredAtIdx: index("ai_influencers_discovered_at_idx").on(table.discoveredAt),
    totalScoreIdx: index("ai_influencers_total_score_idx").on(table.totalScore),
  })
);

// 达人近期视频表
export const aiInfluencerVideos = pgTable(
  "ai_influencer_videos",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    influencerId: varchar("influencer_id", { length: 36 }).notNull(),
    videoId: varchar("video_id", { length: 20 }).notNull().unique(),
    title: varchar("title", { length: 500 }),
    description: text("description"),
    thumbnail: text("thumbnail"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    categoryId: varchar("category_id", { length: 20 }),
    categoryTitle: varchar("category_title", { length: 100 }),
    defaultLanguage: varchar("default_language", { length: 10 }),
    defaultAudioLanguage: varchar("default_audio_language", { length: 10 }),

    // 视频统计
    viewCount: integer("view_count").default(0),
    likeCount: integer("like_count").default(0),
    commentCount: integer("comment_count").default(0),
    favoriteCount: integer("favorite_count").default(0),

    // 视频时长
    duration: varchar("duration", { length: 20 }),
    durationSeconds: integer("duration_seconds").default(0),
    durationFormatted: varchar("duration_formatted", { length: 20 }),

    // 视频主题
    tags: jsonb("tags").$type<string[]>(),
    topicIds: jsonb("topic_ids").$type<string[]>(),
    topicCategories: jsonb("topic_categories").$type<string[]>(),

    // 创建时间
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    influencerIdIdx: index("ai_influencer_videos_influencer_id_idx").on(table.influencerId),
    videoIdIdx: index("ai_influencer_videos_video_id_idx").on(table.videoId),
    publishedAtIdx: index("ai_influencer_videos_published_at_idx").on(table.publishedAt),
  })
);

// API配额使用记录
export const aiQuotaUsage = pgTable(
  "ai_quota_usage",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    date: timestamp("date", { withTimezone: true }).unique().notNull(),
    unitsUsed: integer("units_used").notNull(),
    quotaLimit: integer("quota_limit").notNull(),
    resetAt: timestamp("reset_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  }
);

// 用户收藏达人表
export const userFavorites = pgTable(
  "user_favorites",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    influencerId: varchar("influencer_id", { length: 36 }).notNull(),
    channelId: varchar("channel_id", { length: 50 }).notNull(),
    note: text("note"), // 用户备注
    tags: jsonb("tags").$type<string[]>(), // 用户自定义标签
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_favorites_user_id_idx").on(table.userId),
    influencerIdIdx: index("user_favorites_influencer_id_idx").on(table.influencerId),
    userIdInfluencerIdIdx: index("user_favorites_user_influencer_idx").on(table.userId, table.influencerId),
    channelIdIdx: index("user_favorites_channel_id_idx").on(table.channelId),
  })
);

// 用户关注/添加达人表（用户达人列表）
export const userInfluencers = pgTable(
  "user_influencers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    influencerId: varchar("influencer_id", { length: 36 }).notNull(),
    channelId: varchar("channel_id", { length: 50 }).notNull(),
    listName: varchar("list_name", { length: 100 }).default("default"), // 列表名称，支持多个列表
    status: varchar("status", { length: 20 }).default("added"), // added(已添加), contacted(已联系), collaborating(合作中)
    priority: varchar("priority", { length: 10 }).default("medium"), // high, medium, low
    note: text("note"), // 用户备注
    tags: jsonb("tags").$type<string[]>(), // 用户自定义标签
    lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
    cooperationCount: integer("cooperation_count").default(0), // 合作次数
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("user_influencers_user_id_idx").on(table.userId),
    influencerIdIdx: index("user_influencers_influencer_id_idx").on(table.influencerId),
    userIdListNameIdx: index("user_influencers_user_list_idx").on(table.userId, table.listName),
    userIdInfluencerIdIdx: index("user_influencers_user_influencer_idx").on(table.userId, table.influencerId),
    channelIdIdx: index("user_influencers_channel_id_idx").on(table.channelId),
    statusIdx: index("user_influencers_status_idx").on(table.status),
  })
);

// 达人评分枚举
export const influencerTierEnum = pgEnum("influencer_tier", ["tier1", "tier2", "tier3", "tier4"]);
export const influencerStatusEnum = pgEnum("influencer_status", [
  "new",
  "contacted",
  "interested",
  "negotiating",
  "partnered",
  "rejected",
  "inactive",
]);
export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);

// TypeScript 类型定义
export interface InfluencerProfile {
  id: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
  channelBanner?: string;
  customUrl?: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  hiddenSubscriberCount: boolean;
  description?: string;
  keywords?: string[];
  createdAt?: string;
  discoveredAt: string;
  lastUpdated: string;
  defaultLanguage?: string;
  country?: string;
  brandingSettings?: any;
  uploadsPlaylistId?: string;
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgDuration?: string;
  avgDurationSeconds: number;
  engagementRate: number;
  likeRate: number;
  commentRate: number;
  viewsTrend: number;
  likesTrend: number;
  commentsTrend: number;
  publishFrequency: number;
  publishConsistency: number;
  bestPublishDays?: number[];
  bestPublishHours?: number[];
  avgPublishInterval: number;
  contentCategories?: any[];
  contentKeywords?: any[];
  avgTitleLength: number;
  avgDescriptionLength: number;
  avgThumbnailQuality?: string;
  hasCaptions: boolean;
  avgCaptionLanguages: number;
  inferredCountry?: any;
  inferredLanguage?: any;
  inferredEmail?: any;
  inferredSocialMedia?: any;
  estimatedCost?: any;
  estimatedReach?: any;
  totalScore: number;
  scoreTier?: "tier1" | "tier2" | "tier3" | "tier4";
  scoreBreakdown?: any;
  scoreRecommendations?: string[];
  status?: "new" | "contacted" | "interested" | "negotiating" | "partnered" | "rejected" | "inactive";
  priority?: "high" | "medium" | "low";
  tags?: string[];
  categories?: string[];
  contactInfo?: any;
  metadata?: any;
  notes?: string;
  assignedTo?: string;
  assignedAt?: string;
  budgetInfo?: any;
  contractInfo?: any;
  isActive: boolean;
}

export interface InfluencerVideo {
  id: string;
  influencerId: string;
  videoId: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  publishedAt?: string;
  categoryId?: string;
  categoryTitle?: string;
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  duration?: string;
  durationSeconds: number;
  durationFormatted?: string;
  tags?: string[];
  topicIds?: string[];
  topicCategories?: string[];
  createdAt: string;
}

// Zod schemas for validation
export const insertInfluencerSchema = createInsertSchema(aiInfluencers)
  .pick({
    channelId: true,
    channelTitle: true,
    channelThumbnail: true,
    subscriberCount: true,
    viewCount: true,
    videoCount: true,
    description: true,
    keywords: true,
    defaultLanguage: true,
    country: true,
  });

export const updateInfluencerSchema = createInsertSchema(aiInfluencers)
  .pick({
    status: true,
    priority: true,
    tags: true,
    categories: true,
    notes: true,
    assignedTo: true,
    isActive: true,
  })
  .partial();

export const insertInfluencerVideoSchema = createInsertSchema(aiInfluencerVideos)
  .pick({
    influencerId: true,
    videoId: true,
    title: true,
    description: true,
    thumbnail: true,
    publishedAt: true,
    categoryId: true,
    categoryTitle: true,
    defaultLanguage: true,
    viewCount: true,
    likeCount: true,
    commentCount: true,
    duration: true,
    durationSeconds: true,
    tags: true,
  });
