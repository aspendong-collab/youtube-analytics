import { pgTable, varchar, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { timestamps } from "../common";

/**
 * YouTube 视频表
 */
export const youtubeVideos = pgTable("youtube_videos", {
  id: varchar("id", { length: 36 }).primaryKey(),
  videoId: varchar("video_id", { length: 20 }).notNull().unique(),
  channelId: varchar("channel_id", { length: 30 }).notNull(),
  channelTitle: varchar("channel_title", { length: 200 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  duration: integer("duration"),
  tags: jsonb("tags").$type<string[]>(),
  categoryId: varchar("category_id", { length: 10 }),
  language: varchar("language", { length: 10 }),
  embeddable: boolean("embeddable").notNull().default(true),
  metrics: jsonb("metrics").$type<Record<string, any>>(),
  ...timestamps,
});

/**
 * YouTube 频道表
 */
export const youtubeChannels = pgTable("youtube_channels", {
  id: varchar("id", { length: 36 }).primaryKey(),
  channelId: varchar("channel_id", { length: 30 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  customUrl: varchar("custom_url", { length: 50 }),
  country: varchar("country", { length: 5 }),
  language: varchar("language", { length: 10 }),
  subscriberCount: integer("subscriber_count").notNull().default(0),
  videoCount: integer("video_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  metrics: jsonb("metrics").$type<Record<string, any>>(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  ...timestamps,
});

/**
 * YouTube 搜索历史表
 */
export const youtubeSearchHistory = pgTable("youtube_search_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  query: text("query").notNull(),
  type: varchar("type", { length: 20, enum: ["video", "channel", "affiliate"] }).notNull(),
  filters: jsonb("filters").$type<Record<string, any>>(),
  resultCount: integer("result_count").notNull().default(0),
  apiKeyId: varchar("api_key_id", { length: 36 }).references("api_keys.id"),
  durationMs: integer("duration_ms"),
  ...timestamps,
});

/**
 * YouTube API 配额使用记录
 */
export const youtubeApiQuota = pgTable("youtube_api_quota", {
  id: varchar("id", { length: 36 }).primaryKey(),
  apiKeyId: varchar("api_key_id", { length: 36 }).notNull().references("api_keys.id"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  unitsUsed: integer("units_used").notNull().default(0),
  operation: varchar("operation", { length: 50 }).notNull(),
  endpoint: varchar("endpoint", { length: 100 }).notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ...timestamps,
});
