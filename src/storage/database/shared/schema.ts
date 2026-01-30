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
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

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
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    videoIdIdx: index("videos_video_id_idx").on(table.videoId),
    createdAtIdx: index("videos_created_at_idx").on(table.createdAt),
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

// 使用 createSchemaFactory 配置 date coercion
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Videos schemas
export const insertVideoSchema = createCoercedInsertSchema(videos).pick({
  videoId: true,
  title: true,
  description: true,
  thumbnail: true,
  channelId: true,
  channelTitle: true,
  tags: true,
  categoryId: true,
  owner: true,
});

export const updateVideoSchema = createCoercedInsertSchema(videos)
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

// Video Stats schemas
export const insertVideoStatsSchema = createCoercedInsertSchema(videoStats).pick({
  videoId: true,
  statDate: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
});

// TypeScript types
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type UpdateVideo = z.infer<typeof updateVideoSchema>;

export type VideoStats = typeof videoStats.$inferSelect;
export type InsertVideoStats = z.infer<typeof insertVideoStatsSchema>;
