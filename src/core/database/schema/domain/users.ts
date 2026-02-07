import { pgTable, varchar, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { timestamps } from "../common";

/**
 * 用户表
 */
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password"),
  name: varchar("name", { length: 100 }),
  avatar: text("avatar"),
  role: varchar("role", { length: 20, enum: ["admin", "user"] }).notNull().default("user"),
  status: varchar("status", { length: 20, enum: ["active", "inactive", "suspended"] }).notNull().default("active"),
  emailVerified: boolean("email_verified").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  ...timestamps,
});

/**
 * API Key 表
 */
export const apiKeys = pgTable("api_keys", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  key: text("key").notNull().unique(),
  type: varchar("type", { length: 20, enum: ["youtube", "openai", "custom"] }).notNull(),
  status: varchar("status", { length: 20, enum: ["active", "inactive", "revoked"] }).notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  usageCount: integer("usage_count").notNull().default(0),
  rateLimit: integer("rate_limit"),
  ...timestamps,
});

/**
 * 会话表
 */
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 50 }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  ...timestamps,
});
