import { pgTable, varchar, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { timestamps } from "../common";

/**
 * 沟通线程表
 */
export const communicationThreads = pgTable("communication_threads", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  campaignId: varchar("campaign_id", { length: 36 }).references("campaigns.id", { onDelete: "set null" }),
  influencerId: varchar("influencer_id", { length: 36 }).notNull().references("influencers.id", { onDelete: "cascade" }),
  subject: text("subject"),
  status: varchar("status", { length: 20, enum: ["active", "archived", "closed"] }).notNull().default("active"),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  lastMessagePreview: text("last_message_preview"),
  unreadCount: integer("unread_count").notNull().default(0),
  priority: varchar("priority", { length: 20, enum: ["low", "normal", "high", "urgent"] }),
  tags: jsonb("tags").$type<string[]>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  ...timestamps,
});

/**
 * 沟通消息表
 */
export const communicationMessages = pgTable("communication_messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  threadId: varchar("thread_id", { length: 36 }).notNull().references("communication_threads.id", { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  senderId: varchar("sender_id", { length: 36 }).notNull(),
  senderType: varchar("sender_type", { length: 20, enum: ["user", "influencer", "system"] }).notNull(),
  recipientId: varchar("recipient_id", { length: 36 }).notNull(),
  recipientType: varchar("recipient_type", { length: 20, enum: ["user", "influencer"] }).notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments").$type<Array<any>>(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ...timestamps,
});

/**
 * 沟通模板表
 */
export const communicationTemplates = pgTable("communication_templates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  type: varchar("type", { length: 20, enum: ["outreach", "follow_up", "negotiation", "closing", "custom"] }).notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  variables: jsonb("variables").$type<Array<any>>(),
  isPublic: boolean("is_public").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  ...timestamps,
});
