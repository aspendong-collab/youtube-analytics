import { pgTable, varchar, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { timestamps } from "../common";

/**
 * 关键词表
 */
export const keywords = pgTable("keywords", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  category: varchar("category", { length: 50 }),
  searchVolume: integer("search_volume"),
  competition: varchar("competition", { length: 20, enum: ["low", "medium", "high"] }),
  difficulty: integer("difficulty"),
  intent: varchar("intent", { length: 20, enum: ["informational", "commercial", "transactional", "navigational"] }),
  status: varchar("status", { length: 20, enum: ["active", "archived", "deleted"] }).notNull().default("active"),
  metrics: jsonb("metrics").$type<Record<string, any>>(),
  ...timestamps,
});

/**
 * 关键词变体表
 */
export const keywordVariants = pgTable("keyword_variants", {
  id: varchar("id", { length: 36 }).primaryKey(),
  keywordId: varchar("keyword_id", { length: 36 }).notNull().references("keywords.id", { onDelete: "cascade" }),
  variant: text("variant").notNull(),
  type: varchar("type", { length: 20, enum: ["synonym", "antonym", "related", "long_tail"] }).notNull(),
  similarity: integer("similarity"), // 0-100
  source: varchar("source", { length: 50 }), // manual, ai, api
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ...timestamps,
});

/**
 * 关键词分析历史表
 */
export const keywordAnalysisHistory = pgTable("keyword_analysis_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  analysisType: varchar("analysis_type", { length: 50 }).notNull(),
  result: jsonb("result").$type<Record<string, any>>().notNull(),
  modelUsed: varchar("model_used", { length: 50 }),
  tokensUsed: integer("tokens_used"),
  durationMs: integer("duration_ms"),
  ...timestamps,
});
