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
    email: varchar("email", { length: 255 }).notNull().unique(),
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
    emailIdx: index("users_email_idx").on(table.email),
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
    videoId: varchar("video_id", { length: 20 }).notNull().unique(),
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
    // 阶段1新增字段
    duration: integer("duration"), // 视频时长（秒）
    region: varchar("region", { length: 10 }), // 视频所属地区/国家代码
    language: varchar("language", { length: 10 }), // 视频语言代码
    bestPublishTime: jsonb("best_publish_time").$type<{ hour: number; day: number; reason: string }>(), // 最佳发布时间建议
    userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    videoIdIdx: index("videos_video_id_idx").on(table.videoId),
    publishDateIdx: index("videos_publish_date_idx").on(table.publishDate),
    publishStatusIdx: index("videos_publish_status_idx").on(table.publishStatus),
    statusDateIdx: index("videos_status_date_idx").on(table.publishStatus, table.publishDate),
    userIdIdx: index("videos_user_id_idx").on(table.userId),
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
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    emailIdx: index("owners_email_idx").on(table.email),
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
    commentId: varchar("comment_id", { length: 50 }).notNull().unique(),
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
    videoIdIdx: index("comments_video_id_idx").on(table.videoId),
    sentimentIdx: index("comments_sentiment_idx").on(table.sentiment),
    highQualityIdx: index("comments_high_quality_idx").on(table.isHighQuality),
    publishedAtIdx: index("comments_published_at_idx").on(table.publishedAt),
  })
);

// A/B Tests 表 - 存储 A/B 测试实验
export const abTests = pgTable(
  "ab_tests",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 255 }).notNull(), // 测试名称
    type: varchar("type", { length: 50 }).notNull(), // 测试类型: title, description, thumbnail
    videoId: varchar("video_id", { length: 20 }), // 关联的视频ID（可选）
    userId: varchar("user_id", { length: 36 }).references(() => users.id, { onDelete: 'cascade' }), // 创建者
    status: varchar("status", { length: 20 }).notNull().default('draft'), // 状态: draft, running, completed, paused
    startDate: timestamp("start_date", { withTimezone: true }), // 开始时间
    endDate: timestamp("end_date", { withTimezone: true }), // 结束时间
    winnerVariantId: varchar("winner_variant_id", { length: 36 }), // 获胜变体ID
    confidence: decimal("confidence", { precision: 5, scale: 2 }), // 统计显著性
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("ab_tests_user_id_idx").on(table.userId),
    videoIdIdx: index("ab_tests_video_id_idx").on(table.videoId),
    statusIdx: index("ab_tests_status_idx").on(table.status),
    typeIdx: index("ab_tests_type_idx").on(table.type),
  })
);

// A/B Test Variants 表 - 存储每个测试的变体
export const abTestVariants = pgTable(
  "ab_test_variants",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    testId: varchar("test_id", { length: 36 }).notNull().references(() => abTests.id, { onDelete: 'cascade' }),
    variantName: varchar("variant_name", { length: 100 }).notNull(), // 变体名称: A, B, C...
    title: varchar("title", { length: 500 }), // 标题变体
    description: text("description"), // 描述变体
    thumbnail: text("thumbnail"), // 封面变体
    impressions: integer("impressions").default(0), // 展示次数
    clicks: integer("clicks").default(0), // 点击次数
    views: integer("views").default(0), // 完整观看次数
    ctr: decimal("ctr", { precision: 5, scale: 4 }), // 点击率
    conversionRate: decimal("conversion_rate", { precision: 5, scale: 4 }), // 转化率
    avgWatchTime: integer("avg_watch_time").default(0), // 平均观看时长（秒）
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    testIdIdx: index("ab_test_variants_test_id_idx").on(table.testId),
  })
);

// A/B Test Results 表 - 存储详细的测试结果数据
export const abTestResults = pgTable(
  "ab_test_results",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    variantId: varchar("variant_id", { length: 36 }).notNull().references(() => abTestVariants.id, { onDelete: 'cascade' }),
    statDate: timestamp("stat_date", { withTimezone: true }).notNull(), // 统计日期
    impressions: integer("impressions").notNull().default(0), // 当日展示次数
    clicks: integer("clicks").notNull().default(0), // 当日点击次数
    views: integer("views").notNull().default(0), // 当日观看次数
    watchTime: integer("watch_time").notNull().default(0), // 当日总观看时长（秒）
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    variantIdIdx: index("ab_test_results_variant_id_idx").on(table.variantId),
    statDateIdx: index("ab_test_results_stat_date_idx").on(table.statDate),
    variantDateIdx: index("ab_test_results_variant_date_idx").on(table.variantId, table.statDate),
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
export const insertVideoSchema = createInsertSchema(videos).pick({
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
  userId: true,
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

// A/B Tests schemas
export const insertABTestSchema = createInsertSchema(abTests).pick({
  name: true,
  type: true,
  videoId: true,
  userId: true,
  status: true,
  startDate: true,
  endDate: true,
  winnerVariantId: true,
  confidence: true,
});

export const updateABTestSchema = createInsertSchema(abTests)
  .pick({
    name: true,
    type: true,
    videoId: true,
    status: true,
    startDate: true,
    endDate: true,
    winnerVariantId: true,
    confidence: true,
  })
  .partial();

// A/B Test Variants schemas
export const insertABTestVariantSchema = createInsertSchema(abTestVariants).pick({
  testId: true,
  variantName: true,
  title: true,
  description: true,
  thumbnail: true,
  isActive: true,
});

export const updateABTestVariantSchema = createInsertSchema(abTestVariants)
  .pick({
    variantName: true,
    title: true,
    description: true,
    thumbnail: true,
    isActive: true,
  })
  .partial();

// A/B Test Results schemas
export const insertABTestResultSchema = createInsertSchema(abTestResults).pick({
  variantId: true,
  statDate: true,
  impressions: true,
  clicks: true,
  views: true,
  watchTime: true,
});

// TypeScript types
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

export type ABTest = typeof abTests.$inferSelect;
export type InsertABTest = z.infer<typeof insertABTestSchema>;
export type UpdateABTest = z.infer<typeof updateABTestSchema>;

export type ABTestVariant = typeof abTestVariants.$inferSelect;
export type InsertABTestVariant = z.infer<typeof insertABTestVariantSchema>;
export type UpdateABTestVariant = z.infer<typeof updateABTestVariantSchema>;

export type ABTestResult = typeof abTestResults.$inferSelect;
export type InsertABTestResult = z.infer<typeof insertABTestResultSchema>;

// User status types
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'user' | 'admin';

// A/B Test types
export type ABTestType = 'title' | 'description' | 'thumbnail';
export type ABTestStatus = 'draft' | 'running' | 'completed' | 'paused';
export type ABTestVariantName = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type SentimentType = 'positive' | 'neutral' | 'negative';
