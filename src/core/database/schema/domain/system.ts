import { pgTable, varchar, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { timestamps } from "../common";

/**
 * 系统配置表
 */
export const systemConfigs = pgTable("system_configs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  type: varchar("type", { length: 20, enum: ["string", "number", "boolean", "json", "array"] }).notNull(),
  category: varchar("category", { length: 50 }),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(false),
  isEncrypted: boolean("is_encrypted").notNull().default(false),
  ...timestamps,
});

/**
 * 任务队列表
 */
export const jobQueue = pgTable("job_queue", {
  id: varchar("id", { length: 36 }).primaryKey(),
  queue: varchar("queue", { length: 50 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20, enum: ["pending", "processing", "completed", "failed", "cancelled"] }).notNull().default("pending"),
  priority: integer("priority").notNull().default(0),
  payload: jsonb("payload").$type<Record<string, any>>().notNull(),
  result: jsonb("result").$type<Record<string, any>>(),
  error: text("error"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  runAt: timestamp("run_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failedAt: timestamp("failed_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),
  ...timestamps,
});

/**
 * 审计日志表
 */
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references("users.id", { onDelete: "set null" }),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  changes: jsonb("changes").$type<Record<string, any>>(),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ...timestamps,
});

/**
 * 通知表
 */
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  link: varchar("link", { length: 500 }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  readAt: timestamp("read_at", { withTimezone: true }),
  ...timestamps,
});
