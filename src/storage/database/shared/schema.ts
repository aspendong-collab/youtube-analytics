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
  date,
  time,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Import campaigns and campaignParticipations from campaigns-schema
export { campaigns, campaignParticipations } from "./campaigns-schema";

// Import communication tables
export { 
  communicationThreads, 
  communicationMessages, 
  communicationTemplates 
} from "../../core/database/schema/domain/communications";

// Import negotiation tables
export { 
  negotiations, 
  negotiationProposals, 
  negotiationHistory 
} from "../../core/database/schema/domain/negotiations";

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

// ==================== 竞品监控相关表 ====================

// Competitors 表 - 存储竞品信息
export const competitors = pgTable(
  "competitors",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 100 }).notNull(), // 竞品名称，如 "PDFelement"
    slug: varchar("slug", { length: 50 }).notNull().unique(), // URL友好的标识符
    category: varchar("category", { length: 50 }).notNull(), // 分类，如 "PDF软件"
    description: text("description"), // 描述
    company: varchar("company", { length: 100 }), // 公司名称
    website: varchar("website", { length: 255 }), // 官网地址
    logo: text("logo"), // Logo URL
    // 监控配置
    isActive: boolean("is_active").default(true).notNull(), // 是否启用监控
    keywords: jsonb("keywords").$type<string[]>(), // 监控关键词列表
    priority: integer("priority").default(0), // 优先级（0-10），数字越大优先级越高
    // 元数据
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    slugIdx: unique("competitors_slug_idx").on(table.slug),
    categoryIdx: index("competitors_category_idx").on(table.category),
    isActiveIdx: index("competitors_is_active_idx").on(table.isActive),
    priorityIdx: index("competitors_priority_idx").on(table.priority),
  })
);

// Competitor Videos 表 - 竞品监控视频关联表（存储视频与竞品的关系）
export const competitorVideos = pgTable(
  "competitor_videos",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    competitorId: varchar("competitor_id", { length: 36 }).notNull(), // 关联到 competitors.id
    videoId: varchar("video_id", { length: 20 }).notNull(), // YouTube视频ID
    relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }).default('0'), // 相关性评分（0-1）
    mentionType: varchar("mention_type", { length: 20 }).default('unknown'), // 提及类型：title, description, tag, all
    // 统计数据（快照）
    viewsAtDetection: integer("views_at_detection").default(0), // 检测时的播放量
    viewsCurrent: integer("views_current").default(0), // 当前播放量
    viewsGrowth: integer("views_growth").default(0), // 播放量增长
    growthRate: decimal("growth_rate", { precision: 5, scale: 2 }).default('0'), // 增长率
    firstDetectedAt: timestamp("first_detected_at", { withTimezone: true }), // 首次检测时间
    lastDetectedAt: timestamp("last_detected_at", { withTimezone: true }), // 最后检测时间
    // 元数据
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    competitorIdIdx: index("competitor_videos_competitor_id_idx").on(table.competitorId),
    videoIdIdx: index("competitor_videos_video_id_idx").on(table.videoId),
    firstDetectedIdx: index("competitor_videos_first_detected_idx").on(table.firstDetectedAt),
    uniqueCompetitorVideo: unique("competitor_videos_unique_idx").on(table.competitorId, table.videoId),
  })
);

// Competitor Monitoring Tasks 表 - 监控任务执行记录
export const competitorTasks = pgTable(
  "competitor_tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    taskType: varchar("task_type", { length: 50 }).notNull(), // 任务类型：daily_scan, keyword_search, etc.
    status: varchar("status", { length: 20 }).notNull().default('pending'), // 状态：pending, running, completed, failed
    // 执行信息
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    duration: integer("duration"), // 执行时长（秒）
    // 统计信息
    competitorsScanned: integer("competitors_scanned").default(0), // 扫描的竞品数
    videosFound: integer("videos_found").default(0), // 发现的视频数
    videosAdded: integer("videos_added").default(0), // 新增的视频数
    apiCalls: integer("api_calls").default(0), // API调用次数
    apiQuotaUsed: integer("api_quota_used").default(0), // 使用的API配额
    // 错误信息
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details").$type<any>(),
    // 元数据
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    taskTypeIdx: index("competitor_tasks_task_type_idx").on(table.taskType),
    statusIdx: index("competitor_tasks_status_idx").on(table.status),
    startedAtIdx: index("competitor_tasks_started_at_idx").on(table.startedAt),
    createdAtIdx: index("competitor_tasks_created_at_idx").on(table.createdAt),
  })
);

// ==================== 竞品监控 Schemas ====================

// Competitor schemas
export const insertCompetitorSchema = createInsertSchema(competitors).pick({
  name: true,
  slug: true,
  category: true,
  description: true,
  company: true,
  website: true,
  logo: true,
  isActive: true,
  keywords: true,
  priority: true,
});

export const updateCompetitorSchema = createInsertSchema(competitors)
  .pick({
    name: true,
    category: true,
    description: true,
    company: true,
    website: true,
    logo: true,
    isActive: true,
    keywords: true,
    priority: true,
  })
  .partial();

// Competitor Video schemas
export const insertCompetitorVideoSchema = createInsertSchema(competitorVideos).pick({
  competitorId: true,
  videoId: true,
  relevanceScore: true,
  mentionType: true,
  viewsAtDetection: true,
  viewsCurrent: true,
  viewsGrowth: true,
  growthRate: true,
  firstDetectedAt: true,
  lastDetectedAt: true,
});

export const updateCompetitorVideoSchema = createInsertSchema(competitorVideos)
  .pick({
    relevanceScore: true,
    mentionType: true,
    viewsCurrent: true,
    viewsGrowth: true,
    growthRate: true,
    lastDetectedAt: true,
  })
  .partial();

// Competitor Task schemas
export const insertCompetitorTaskSchema = createInsertSchema(competitorTasks).pick({
  taskType: true,
  status: true,
  startedAt: true,
  completedAt: true,
  duration: true,
  competitorsScanned: true,
  videosFound: true,
  videosAdded: true,
  apiCalls: true,
  apiQuotaUsed: true,
  errorMessage: true,
  errorDetails: true,
});

export const updateCompetitorTaskSchema = createInsertSchema(competitorTasks)
  .pick({
    status: true,
    startedAt: true,
    completedAt: true,
    duration: true,
    competitorsScanned: true,
    videosFound: true,
    videosAdded: true,
    apiCalls: true,
    apiQuotaUsed: true,
    errorMessage: true,
    errorDetails: true,
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

// Competitor types
export type Competitor = typeof competitors.$inferSelect;
export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type UpdateCompetitor = z.infer<typeof updateCompetitorSchema>;

export type CompetitorVideo = typeof competitorVideos.$inferSelect;
export type InsertCompetitorVideo = z.infer<typeof insertCompetitorVideoSchema>;
export type UpdateCompetitorVideo = z.infer<typeof updateCompetitorVideoSchema>;

export type CompetitorTask = typeof competitorTasks.$inferSelect;
export type InsertCompetitorTask = z.infer<typeof insertCompetitorTaskSchema>;
export type UpdateCompetitorTask = z.infer<typeof updateCompetitorTaskSchema>;

export type CompetitorTaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type MentionType = 'title' | 'description' | 'tag' | 'all' | 'unknown';

// ==================== 关键词智能拓展相关表 ====================

// Keyword Expansions 表 - 存储关键词拓展记录
export const keywordExpansions = pgTable(
  "keyword_expansions",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    inputKeyword: varchar("input_keyword", { length: 500 }).notNull(), // 输入的关键词
    inputCategory: varchar("input_category", { length: 20 }).notNull(), // 关键词类型：brand/generic/longtail
    // 拓展结果（JSON格式存储）
    expansionResult: jsonb("expansion_result").$type<{
      scenarios: string[];
      carriers: string[];
      states: string[];
      goals: string[];
      methods: string[];
    }>(),
    // 统计信息
    totalKeywords: integer("total_keywords").default(0),
    uniqueKeywords: integer("unique_keywords").default(0),
    // 拓展配置
    useRuleEngine: boolean("use_rule_engine").default(true),
    useLLMEngine: boolean("use_llm_engine").default(true),
    useDataMining: boolean("use_data_mining").default(true),
    // 元数据
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    inputKeywordIdx: index("keyword_expansions_input_keyword_idx").on(table.inputKeyword),
    createdAtIdx: index("keyword_expansions_created_at_idx").on(table.createdAt),
  })
);

// Expanded Keywords 表 - 存储拓展后的关键词详情
export const expandedKeywords = pgTable(
  "expanded_keywords",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    expansionId: varchar("expansion_id", { length: 36 }).notNull(), // 关联到keyword_expansions.id
    keyword: varchar("keyword", { length: 500 }).notNull(),
    dimension: varchar("dimension", { length: 20 }).notNull(), // 所属维度：scenario/carrier/state/goal/method
    source: varchar("source", { length: 20 }).notNull(), // 来源：rule/llm/dataMining/commentMining/tagMining
    // 指标
    relevance: decimal("relevance", { precision: 3, scale: 2 }).default('0.00'), // 相关性（0-1）
    estimatedSearchVolume: integer("estimated_search_volume").default(0), // 估算搜索量
    estimatedCompetition: decimal("estimated_competition", { precision: 3, scale: 2 }).default('0.00'), // 估算竞争度（0-1）
    commercialValue: decimal("commercial_value", { precision: 3, scale: 2 }).default('0.00'), // 商业价值（0-1）
    recommendationScore: decimal("recommendation_score", { precision: 3, scale: 2 }).default('0.00'), // 推荐指数（0-1）
    // 分类
    type: varchar("type", { length: 20 }).default('broad'), // broad/long-tail/question/brand
    intent: varchar("intent", { length: 20 }).default('info'), // info/tutorial/review/transaction
    // 元数据
    relatedKeywords: jsonb("related_keywords").$type<string[]>(),
    sourceVideoIds: jsonb("source_video_ids").$type<string[]>(), // 来源视频ID列表
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    expansionIdIdx: index("expanded_keywords_expansion_id_idx").on(table.expansionId),
    keywordIdx: index("expanded_keywords_keyword_idx").on(table.keyword),
    dimensionIdx: index("expanded_keywords_dimension_idx").on(table.dimension),
    sourceIdx: index("expanded_keywords_source_idx").on(table.source),
    recommendationScoreIdx: index("expanded_keywords_recommendation_score_idx").on(table.recommendationScore),
  })
);

// ==================== 关键词拓展 Schemas ====================

// Keyword Expansion schemas
export const insertKeywordExpansionSchema = createInsertSchema(keywordExpansions).pick({
  inputKeyword: true,
  inputCategory: true,
  expansionResult: true,
  totalKeywords: true,
  uniqueKeywords: true,
  useRuleEngine: true,
  useLLMEngine: true,
  useDataMining: true,
});

export const updateKeywordExpansionSchema = createInsertSchema(keywordExpansions)
  .pick({
    expansionResult: true,
    totalKeywords: true,
    uniqueKeywords: true,
  })
  .partial();

// Expanded Keyword schemas
export const insertExpandedKeywordSchema = createInsertSchema(expandedKeywords).pick({
  expansionId: true,
  keyword: true,
  dimension: true,
  source: true,
  relevance: true,
  estimatedSearchVolume: true,
  estimatedCompetition: true,
  commercialValue: true,
  recommendationScore: true,
  type: true,
  intent: true,
  relatedKeywords: true,
  sourceVideoIds: true,
});

export const updateExpandedKeywordSchema = createInsertSchema(expandedKeywords)
  .pick({
    relevance: true,
    estimatedSearchVolume: true,
    estimatedCompetition: true,
    commercialValue: true,
    recommendationScore: true,
    relatedKeywords: true,
  })
  .partial();

// ==================== 关键词拓展 Types ====================

export type KeywordExpansion = typeof keywordExpansions.$inferSelect;
export type InsertKeywordExpansion = z.infer<typeof insertKeywordExpansionSchema>;
export type UpdateKeywordExpansion = z.infer<typeof updateKeywordExpansionSchema>;

export type ExpandedKeyword = typeof expandedKeywords.$inferSelect;
export type InsertExpandedKeyword = z.infer<typeof insertExpandedKeywordSchema>;
export type UpdateExpandedKeyword = z.infer<typeof updateExpandedKeywordSchema>;

export type KeywordDimension = 'scenario' | 'carrier' | 'state' | 'goal' | 'method';
export type KeywordSource = 'rule' | 'llm' | 'dataMining' | 'commentMining' | 'tagMining';
export type KeywordType = 'broad' | 'long-tail' | 'question' | 'brand';
export type KeywordIntent = 'info' | 'tutorial' | 'review' | 'transaction';

// ==================== YouTube API 配额统计 ====================

// YouTube API Quota 表 - 记录 YouTube API 配额使用情况
export const youtubeApiQuota = pgTable(
  "youtube_api_quota",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    date: date("date").notNull().unique(), // 日期，唯一索引
    apiType: varchar("api_type", { length: 50 }).notNull(), // API类型：search, videos, comments, channels
    quotaUsed: integer("quota_used").notNull().default(0), // 已使用配额
    quotaLimit: integer("quota_limit").notNull().default(10000), // 配额限制（默认10000）
    lastResetAt: timestamp("last_reset_at", { withTimezone: true }), // 最后重置时间
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: time }),
  },
  (table) => ({
    dateApiTypeIdx: unique("youtube_api_quota_date_api_type_idx").on(table.date, table.apiType),
    dateIdx: index("youtube_api_quota_date_idx").on(table.date),
  })
);

// API 调用记录表 - 详细记录每次 API 调用
export const apiCallLogs = pgTable(
  "api_call_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    apiType: varchar("api_type", { length: 50 }).notNull(), // API类型
    operation: varchar("operation", { length: 100 }).notNull(), // 操作名称
    quotaCost: integer("quota_cost").notNull().default(1), // 配额消耗
    success: boolean("success").default(true), // 是否成功
    errorMessage: text("error_message"), // 错误信息
    metadata: jsonb("metadata"), // 额外元数据（请求参数、响应时间等）
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    apiTypeIdx: index("api_call_logs_api_type_idx").on(table.apiType),
    successIdx: index("api_call_logs_success_idx").on(table.success),
    createdAtIdx: index("api_call_logs_created_at_idx").on(table.createdAt),
  })
);

// API 配额类型定义
export type ApiType = 'search' | 'videos' | 'channels' | 'commentThreads' | 'videoCategories';
export type ApiOperation = 'search.list' | 'videos.list' | 'channels.list' | 'commentThreads.list' | 'videoCategories.list';

// ==================== YouTube API 配额统计 Types ====================

export type YoutubeApiQuota = typeof youtubeApiQuota.$inferSelect;
export type InsertYoutubeApiQuota = typeof youtubeApiQuota.$inferInsert;
export type UpdateYoutubeApiQuota = Partial<InsertYoutubeApiQuota>;

export type ApiCallLog = typeof apiCallLogs.$inferSelect;
export type InsertApiCallLog = typeof apiCallLogs.$inferInsert;

// ==================== Affiliate 拓展相关表 ====================

// Affiliate Videos 表 - 记录包含 affiliate 标识的视频
export const affiliateVideos = pgTable(
  "affiliate_videos",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    videoId: varchar("video_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 50 }).notNull(),
    videoTitle: varchar("video_title", { length: 500 }),
    thumbnail: text("thumbnail"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    viewCount: integer("view_count").default(0),
    likeCount: integer("like_count").default(0),

    // Affiliate 检测结果
    affiliateScore: decimal("affiliate_score", { precision: 5, scale: 2 }).default('0'), // 0-100
    affiliateEvidence: jsonb("affiliate_evidence").notNull(), // 完整的检测证据
    descriptionAnalysis: jsonb("description_analysis"), // 视频描述分析结果
    commentAnalysis: jsonb("comment_analysis"), // 评论分析结果

    // 提取的联系信息
    extractedEmail: varchar("extracted_email", { length: 255 }),
    extractedSocialLinks: jsonb("extracted_social_links").$type<string[]>(),

    // 元数据
    searchKeyword: varchar("search_keyword", { length: 200 }), // 搜索关键词
    searchLanguage: varchar("search_language", { length: 20 }), // 搜索语言
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    videoIdIdx: unique("affiliate_videos_video_id_idx").on(table.videoId),
    channelIdIdx: index("affiliate_videos_channel_id_idx").on(table.channelId),
    affiliateScoreIdx: index("affiliate_videos_affiliate_score_idx").on(table.affiliateScore),
    searchKeywordIdx: index("affiliate_videos_search_keyword_idx").on(table.searchKeyword),
    createdAtIdx: index("affiliate_videos_created_at_idx").on(table.createdAt),
  })
);

// Affiliate Links 表 - 记录具体的 affiliate 链接
export const affiliateLinks = pgTable(
  "affiliate_links",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    videoId: varchar("video_id", { length: 20 }).notNull(),
    channelId: varchar("channel_id", { length: 50 }).notNull(),

    // 链接信息
    linkType: varchar("link_type", { length: 20 }).notNull(), // ref, utm, short, keyword, disclosure
    linkValue: text("link_value").notNull(), // 链接值或关键词
    fullUrl: text("full_url"), // 完整 URL（如果有）
    position: varchar("position", { length: 20 }).notNull(), // description, comment

    // 统计信息
    frequency: integer("frequency").default(1), // 出现次数

    // 元数据
    searchKeyword: varchar("search_keyword", { length: 200 }),
    searchLanguage: varchar("search_language", { length: 20 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    videoIdIdx: index("affiliate_links_video_id_idx").on(table.videoId),
    channelIdIdx: index("affiliate_links_channel_id_idx").on(table.channelId),
    linkTypeIdx: index("affiliate_links_link_type_idx").on(table.linkType),
    searchKeywordIdx: index("affiliate_links_search_keyword_idx").on(table.searchKeyword),
  })
);

// Affiliate Influencers 表 - 存储已识别的 affiliate 博主信息
export const affiliateInfluencers = pgTable(
  "affiliate_influencers",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    channelId: varchar("channel_id", { length: 50 }).notNull().unique(),
    channelTitle: varchar("channel_title", { length: 200 }).notNull(),
    thumbnail: text("thumbnail"),
    subscriberCount: integer("subscriber_count").default(0),
    totalVideos: integer("total_videos").default(0),
    totalViews: integer("total_views").default(0),

    // Affiliate 信息
    affiliateScore: decimal("affiliate_score", { precision: 5, scale: 2 }).default('0'), // 0-100
    affiliateStatus: varchar("affiliate_status", { length: 20 }).default('potential'), // potential, verified, rejected
    affiliateVerifiedAt: timestamp("affiliate_verified_at", { withTimezone: true }),
    affiliateEvidence: jsonb("affiliate_evidence").$type<Array<{
      type: string;
      value: string;
      fullUrl?: string;
      position: string;
      videoId?: string;
    }>>(),

    // 联系信息
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    wechat: varchar("wechat", { length: 50 }),
    extractedEmails: jsonb("extracted_emails").$type<string[]>(), // 从视频中提取的邮箱列表
    socialLinks: jsonb("social_links").$type<string[]>(),

    // 博主信息
    description: text("description"),
    tags: jsonb("tags").$type<string[]>(),
    category: varchar("category", { length: 50 }),
    niche: varchar("niche", { length: 100 }),

    // 评分
    recommendationScore: decimal("recommendation_score", { precision: 5, scale: 2 }).default('0'),
    qualityScore: decimal("quality_score", { precision: 5, scale: 2 }).default('0'),
    engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }).default('0'),

    // 合作状态
    cooperationStatus: varchar("cooperation_status", { length: 30 }).default('available'), // available, contacted, negotiating, collaborating, completed, rejected
    lastCooperationDate: timestamp("last_cooperation_date", { withTimezone: true }),
    cooperationCount: integer("cooperation_count").default(0),
    notes: text("notes"), // 合作备注

    // 元数据
    searchKeyword: varchar("search_keyword", { length: 200 }), // 识别时使用的关键词
    searchLanguage: varchar("search_language", { length: 20 }), // 识别时的语言
    isFavorite: boolean("is_favorite").default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    channelIdIdx: unique("affiliate_influencers_channel_id_idx").on(table.channelId),
    affiliateScoreIdx: index("affiliate_influencers_affiliate_score_idx").on(table.affiliateScore),
    affiliateStatusIdx: index("affiliate_influencers_affiliate_status_idx").on(table.affiliateStatus),
    cooperationStatusIdx: index("affiliate_influencers_cooperation_status_idx").on(table.cooperationStatus),
    categoryIdx: index("affiliate_influencers_category_idx").on(table.category),
    searchKeywordIdx: index("affiliate_influencers_search_keyword_idx").on(table.searchKeyword),
    isFavoriteIdx: index("affiliate_influencers_is_favorite_idx").on(table.isFavorite),
    createdAtIdx: index("affiliate_influencers_created_at_idx").on(table.createdAt),
  })
);

// ==================== Affiliate 拓展 Schemas ====================

// Affiliate Video schemas
export const insertAffiliateVideoSchema = createInsertSchema(affiliateVideos).pick({
  videoId: true,
  channelId: true,
  videoTitle: true,
  thumbnail: true,
  publishedAt: true,
  viewCount: true,
  likeCount: true,
  affiliateScore: true,
  affiliateEvidence: true,
  descriptionAnalysis: true,
  commentAnalysis: true,
  extractedEmail: true,
  extractedSocialLinks: true,
  searchKeyword: true,
  searchLanguage: true,
});

export const updateAffiliateVideoSchema = createInsertSchema(affiliateVideos)
  .pick({
    affiliateScore: true,
    affiliateEvidence: true,
    extractedEmail: true,
    extractedSocialLinks: true,
  })
  .partial();

// Affiliate Link schemas
export const insertAffiliateLinkSchema = createInsertSchema(affiliateLinks).pick({
  videoId: true,
  channelId: true,
  linkType: true,
  linkValue: true,
  fullUrl: true,
  position: true,
  frequency: true,
  searchKeyword: true,
  searchLanguage: true,
});

// Affiliate Influencer schemas
export const insertAffiliateInfluencerSchema = createInsertSchema(affiliateInfluencers).pick({
  channelId: true,
  channelTitle: true,
  thumbnail: true,
  subscriberCount: true,
  totalVideos: true,
  totalViews: true,
  affiliateScore: true,
  affiliateStatus: true,
  affiliateEvidence: true,
  email: true,
  phone: true,
  wechat: true,
  extractedEmails: true,
  socialLinks: true,
  description: true,
  tags: true,
  category: true,
  niche: true,
  recommendationScore: true,
  qualityScore: true,
  engagementRate: true,
  cooperationStatus: true,
  searchKeyword: true,
  searchLanguage: true,
  isFavorite: true,
});

export const updateAffiliateInfluencerSchema = createInsertSchema(affiliateInfluencers)
  .pick({
    channelTitle: true,
    thumbnail: true,
    subscriberCount: true,
    totalVideos: true,
    totalViews: true,
    affiliateScore: true,
    affiliateStatus: true,
    affiliateEvidence: true,
    email: true,
    phone: true,
  wechat: true,
    extractedEmails: true,
    socialLinks: true,
    description: true,
    tags: true,
    category: true,
    niche: true,
    recommendationScore: true,
    qualityScore: true,
    engagementRate: true,
    cooperationStatus: true,
    lastCooperationDate: true,
    cooperationCount: true,
    notes: true,
    isFavorite: true,
  })
  .partial();

// ==================== Affiliate 拓展 Types ====================

export type AffiliateVideo = typeof affiliateVideos.$inferSelect;
export type InsertAffiliateVideo = z.infer<typeof insertAffiliateVideoSchema>;
export type UpdateAffiliateVideo = z.infer<typeof updateAffiliateVideoSchema>;

export type AffiliateLink = typeof affiliateLinks.$inferSelect;
export type InsertAffiliateLink = z.infer<typeof insertAffiliateLinkSchema>;

export type AffiliateInfluencer = typeof affiliateInfluencers.$inferSelect;
export type InsertAffiliateInfluencer = z.infer<typeof insertAffiliateInfluencerSchema>;
export type UpdateAffiliateInfluencer = z.infer<typeof updateAffiliateInfluencerSchema>;

export type AffiliateLinkType = 'ref' | 'utm' | 'short' | 'keyword' | 'disclosure';
export type AffiliateStatus = 'potential' | 'verified' | 'rejected';
export type CooperationStatus = 'available' | 'contacted' | 'negotiating' | 'collaborating' | 'completed' | 'rejected';
