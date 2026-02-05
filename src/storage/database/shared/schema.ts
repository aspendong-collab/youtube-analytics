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
  unique,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users 表 - 存储用户信息
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("user"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: unique("users_email_idx").on(table.email),
    statusIdx: index("users_status_idx").on(table.status),
    roleIdx: index("users_role_idx").on(table.role),
  })
);

// Videos 表 - 存储视频基本信息
export const videos = pgTable(
  "videos",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    videoId: varchar("video_id", { length: 20 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    thumbnail: text("thumbnail"),
    channelId: varchar("channel_id", { length: 50 }),
    channelTitle: varchar("channel_title", { length: 200 }),
    tags: jsonb("tags").$type<string[]>(),
    categoryId: varchar("category_id", { length: 10 }),
    owner: varchar("owner", { length: 100 }),
    // 新增字段
    publishDate: timestamp("publish_date", { withTimezone: true }),
    publishStatus: varchar("publish_status", { length: 20 }).default('draft'),
    cooperationCost: decimal("cooperation_cost", { precision: 10, scale: 2 }).default('0'),
    totalViews: integer("total_views").default(0),
    // TODO: 生产环境暂时禁用 userId 字段，待数据库迁移后再启用
    // userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    videoIdIdx: unique("videos_video_id_idx").on(table.videoId),
    publishDateIdx: index("videos_publish_date_idx").on(table.publishDate),
    publishStatusIdx: index("videos_publish_status_idx").on(table.publishStatus),
    statusDateIdx: index("videos_status_date_idx").on(table.publishStatus, table.publishDate),
    // TODO: 生产环境暂时禁用 userIdIdx 索引，待数据库迁移后再启用
    // userIdIdx: index("videos_user_id_idx").on(table.userId),
    createdAtIdx: index("videos_created_at_idx").on(table.createdAt),
  })
);

// Owners 表 - 存储负责人信息
export const owners = pgTable(
  "owners",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }),
    // TODO: 生产环境暂时禁用 userId 字段，待数据库迁移后再启用
    // userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index("owners_email_idx").on(table.email),
    // TODO: 生产环境暂时禁用 userIdIdx 索引，待数据库迁移后再启用
    // userIdIdx: index("owners_user_id_idx").on(table.userId),
  })
);

// Video Stats 表 - 存储每日统计数据
export const videoStats = pgTable(
  "video_stats",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    videoId: varchar("video_id", { length: 20 }).notNull(),
    statDate: timestamp("stat_date", { withTimezone: true }).notNull(),
    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    videoIdDateIdx: index("video_stats_video_id_date_idx").on(
      table.videoId,
      table.statDate
    ),
  })
);

// Comments 表 - 存储视频评论
export const comments = pgTable(
  "comments",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    commentId: varchar("comment_id", { length: 50 }).notNull(),
    videoId: varchar("video_id", { length: 20 }).notNull(),
    authorName: varchar("author_name", { length: 255 }),
    authorChannelId: varchar("author_channel_id", { length: 50 }),
    textDisplay: text("text_display").notNull(),
    likeCount: integer("like_count").default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    sentiment: varchar("sentiment", { length: 20 }), // 情感: positive, neutral, negative
    isHighQuality: boolean("is_high_quality").default(false), // 是否为高质量评论
    qualityScore: decimal("quality_score", { precision: 5, scale: 2 }).default('0'), // 质量评分
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    commentIdIdx: unique("comments_comment_id_idx").on(table.commentId),
    videoIdIdx: index("comments_video_id_idx").on(table.videoId),
    sentimentIdx: index("comments_sentiment_idx").on(table.sentiment),
    highQualityIdx: index("comments_high_quality_idx").on(table.isHighQuality),
    publishedAtIdx: index("comments_published_at_idx").on(table.publishedAt),
  })
);

// Influencers 表 - 存储达人信息
export const influencers = pgTable(
  "influencers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    channelId: varchar("channel_id", { length: 50 }).notNull(), // YouTube 频道ID
    channelTitle: varchar("channel_title", { length: 200 }).notNull(),
    thumbnail: text("thumbnail"), // 频道头像
    subscriberCount: integer("subscriber_count").default(0), // 订阅数
    totalVideos: integer("total_videos").default(0), // 总视频数
    totalViews: integer("total_views").default(0), // 总观看数
    // 达人信息
    email: varchar("email", { length: 255 }), // 联系邮箱
    phone: varchar("phone", { length: 20 }), // 联系电话
    wechat: varchar("wechat", { length: 50 }), // 微信号
    description: text("description"), // 达人简介
    // 达人标签
    tags: jsonb("tags").$type<string[]>(), // 标签：科技、美妆、游戏等
    category: varchar("category", { length: 50 }), // 分类
    niche: varchar("niche", { length: 100 }), // 细分领域
    // 达人等级
    level: varchar("level", { length: 20 }).default('C'), // 等级：S, A, B, C, D
    priceRange: varchar("price_range", { length: 50 }), // 价格区间
    averagePrice: decimal("average_price", { precision: 10, scale: 2 }).default('0'), // 平均报价
    // 达人评分
    qualityScore: decimal("quality_score", { precision: 5, scale: 2 }).default('0'), // 内容质量评分（0-100）
    cooperationScore: decimal("cooperation_score", { precision: 5, scale: 2 }).default('0'), // 合作配合度评分（0-100）
    engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default('0'), // 互动率
    // 达人状态
    status: varchar("status", { length: 20 }).default('available'), // 状态：available(可合作), contacted(沟通中), collaborating(合作中), blacklist(黑名单)
    isFavorite: boolean("is_favorite").default(false), // 是否收藏
    cooperationCount: integer("cooperation_count").default(0), // 合作次数
    // 元数据
    // TODO: 生产环境暂时禁用 userId 字段，待数据库迁移后再启用
    // userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: 'cascade' }), // 创建者
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
    lastCooperationAt: timestamp("last_cooperation_at", { withTimezone: true }), // 最后合作时间
  },
  (table) => ({
    channelIdIdx: unique("influencers_channel_id_idx").on(table.channelId),
    statusIdx: index("influencers_status_idx").on(table.status),
    levelIdx: index("influencers_level_idx").on(table.level),
    categoryIdx: index("influencers_category_idx").on(table.category),
    // TODO: 生产环境暂时禁用 userIdIdx 索引，待数据库迁移后再启用
    // userIdIdx: index("influencers_user_id_idx").on(table.userId),
    isFavoriteIdx: index("influencers_is_favorite_idx").on(table.isFavorite),
    createdAtIdx: index("influencers_created_at_idx").on(table.createdAt),
  })
);

// Users schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
});

export const updateUserSchema = createInsertSchema(users)
  .pick({
    name: true,
    role: true,
    status: true,
    isActive: true,
  })
  .partial();

// Videos schemas
export const insertVideoSchema = createInsertSchema(videos)
  .pick({
    videoId: true,
    title: true,
    description: true,
    thumbnail: true,
    channelId: true,
    channelTitle: true,
    tags: true,
    categoryId: true,
    owner: true,
    publishDate: true,
    publishStatus: true,
    cooperationCost: true,
  });

export const updateVideoSchema = createInsertSchema(videos)
  .pick({
    title: true,
    description: true,
    thumbnail: true,
    channelId: true,
    channelTitle: true,
    tags: true,
    categoryId: true,
    owner: true,
    isActive: true,
  })
  .partial();

// Owners schemas
export const insertOwnerSchema = createInsertSchema(owners).pick({
  name: true,
  email: true,
  isActive: true,
});

export const updateOwnerSchema = createInsertSchema(owners)
  .pick({
    name: true,
    email: true,
    isActive: true,
  })
  .partial();

// Video Stats schemas
export const insertVideoStatsSchema = createInsertSchema(videoStats).pick({
  videoId: true,
  statDate: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
});

// Influencer Cache 表 - 存储采集结果缓存
export const influencerCache = pgTable(
  "influencer_cache",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    channelId: varchar("channel_id", { length: 50 }).notNull(), // YouTube 频道ID
    cachedData: jsonb("cached_data").notNull(), // 完整的达人数据（JSON）
    // 缓存元数据
    source: varchar("source", { length: 50 }).notNull(), // 数据来源：search, popular, manual
    searchKeyword: varchar("search_keyword", { length: 200 }), // 搜索关键词
    searchRegion: varchar("search_region", { length: 10 }), // 搜索地区
    searchLanguage: varchar("search_language", { length: 20 }), // 搜索语言
    // 缓存状态
    hitCount: integer("hit_count").default(0), // 命中次数
    isValid: boolean("is_valid").default(true).notNull(), // 是否有效
    dataQuality: integer("data_quality").default(0), // 数据质量评分（0-100）
    // 时间信息
    cachedAt: timestamp("cached_at", { withTimezone: true }).notNull().defaultNow(), // 缓存时间
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 过期时间
    lastValidatedAt: timestamp("last_validated_at", { withTimezone: true }), // 最后验证时间
    lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }), // 最后刷新时间
  },
  (table) => ({
    channelIdIdx: unique("influencer_cache_channel_id_idx").on(table.channelId),
    expiresAtIdx: index("influencer_cache_expires_at_idx").on(table.expiresAt),
    isValidIdx: index("influencer_cache_is_valid_idx").on(table.isValid),
    sourceIdx: index("influencer_cache_source_idx").on(table.source),
    cachedAtIdx: index("influencer_cache_cached_at_idx").on(table.cachedAt),
  })
);

// 用户收藏表（简单的收藏功能）
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

// 用户达人关系表 - 用户收藏/管理的AI达人
export const userInfluencers = pgTable(
  "user_influencers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    influencerId: varchar("influencer_id", { length: 36 }).notNull(), // 关联 ai_influencers.id
    channelId: varchar("channel_id", { length: 50 }).notNull(), // 冗余字段，方便查询

    // 跟进状态
    status: varchar("status", { length: 30 }).notNull().default('interested'), // interested(感兴趣), contacted(已联系), negotiating(洽谈中), collaborating(合作中), completed(已完成), rejected(已拒绝)
    priority: varchar("priority", { length: 10 }).notNull().default('medium'), // low(低), medium(中), high(高)

    // 跟进记录
    notes: text("notes"), // 跟进备注
    lastContactDate: timestamp("last_contact_date", { withTimezone: true }), // 最后联系时间
    nextFollowUpDate: timestamp("next_follow_up_date", { withTimezone: true }), // 下次跟进时间
    contactCount: integer("contact_count").default(0), // 联系次数

    // 预算和合同信息
    estimatedBudget: decimal("estimated_budget", { precision: 10, scale: 2 }).default('0'), // 预估预算
    actualBudget: decimal("actual_budget", { precision: 10, scale: 2 }).default('0'), // 实际预算
    contractStatus: varchar("contract_status", { length: 20 }).default('none'), // none(无), pending(待签), signed(已签)

    // 合作信息
    cooperationStartDate: timestamp("cooperation_start_date", { withTimezone: true }), // 合作开始时间
    cooperationEndDate: timestamp("cooperation_end_date", { withTimezone: true }), // 合作结束时间
    cooperationCount: integer("cooperation_count").default(0), // 合作次数

    // 标签和分类
    tags: jsonb("tags").$type<string[]>(), // 自定义标签
    category: varchar("category", { length: 50 }), // 分类

    // 收藏
    isFavorite: boolean("is_favorite").default(false),

    // 时间戳
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdInfluencerIdIdx: unique("user_influencers_user_id_influencer_id_idx").on(table.userId, table.influencerId),
    userIdIdx: index("user_influencers_user_id_idx").on(table.userId),
    influencerIdIdx: index("user_influencers_influencer_id_idx").on(table.influencerId),
    statusIdx: index("user_influencers_status_idx").on(table.status),
    channelIdIdx: index("user_influencers_channel_id_idx").on(table.channelId),
    isFavoriteIdx: index("user_influencers_is_favorite_idx").on(table.isFavorite),
  })
);

// Influencers schemas
export const insertInfluencerSchema = createInsertSchema(influencers).pick({
  channelId: true,
  channelTitle: true,
  thumbnail: true,
  subscriberCount: true,
  totalVideos: true,
  totalViews: true,
  email: true,
  phone: true,
  wechat: true,
  description: true,
  tags: true,
  category: true,
  niche: true,
  level: true,
  priceRange: true,
  averagePrice: true,
  qualityScore: true,
  cooperationScore: true,
  engagementRate: true,
  status: true,
  isFavorite: true,
  cooperationCount: true,
});

export const updateInfluencerSchema = createInsertSchema(influencers)
  .pick({
    channelTitle: true,
    thumbnail: true,
    subscriberCount: true,
    totalVideos: true,
    totalViews: true,
    email: true,
    phone: true,
    wechat: true,
    description: true,
    tags: true,
    category: true,
    niche: true,
    level: true,
    priceRange: true,
    averagePrice: true,
    qualityScore: true,
    cooperationScore: true,
    engagementRate: true,
    status: true,
    isFavorite: true,
    cooperationCount: true,
    isActive: true,
  })
  .partial();

// Influencer Cache schemas
export const insertInfluencerCacheSchema = createInsertSchema(influencerCache).pick({
  channelId: true,
  cachedData: true,
  source: true,
  searchKeyword: true,
  searchRegion: true,
  searchLanguage: true,
  isValid: true,
  dataQuality: true,
  expiresAt: true,
  lastValidatedAt: true,
  lastRefreshedAt: true,
});

export const updateInfluencerCacheSchema = createInsertSchema(influencerCache)
  .pick({
    cachedData: true,
    isValid: true,
    dataQuality: true,
    expiresAt: true,
    lastValidatedAt: true,
    lastRefreshedAt: true,
  })
  .partial();

// Comments schemas
export const insertCommentSchema = createInsertSchema(comments).pick({
  commentId: true,
  videoId: true,
  authorName: true,
  authorChannelId: true,
  textDisplay: true,
  likeCount: true,
  publishedAt: true,
  updatedAt: true,
  sentiment: true,
  isHighQuality: true,
  qualityScore: true,
});

// Influencer Cache schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type UpdateVideo = z.infer<typeof updateVideoSchema>;

export type Owner = typeof owners.$inferSelect;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;
export type UpdateOwner = z.infer<typeof updateOwnerSchema>;

export type VideoStats = typeof videoStats.$inferSelect;
export type InsertVideoStats = z.infer<typeof insertVideoStatsSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Influencer = typeof influencers.$inferSelect;
export type InsertInfluencer = z.infer<typeof insertInfluencerSchema>;
export type UpdateInfluencer = z.infer<typeof updateInfluencerSchema>;

// User status types
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'user' | 'admin';

export type SentimentType = 'positive' | 'neutral' | 'negative';

// Influencer types
export type InfluencerStatus = 'available' | 'contacted' | 'collaborating' | 'blacklist';
export type InfluencerLevel = 'S' | 'A' | 'B' | 'C' | 'D';
