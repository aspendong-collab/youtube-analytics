import { pgTable, varchar, text, integer, timestamp, jsonb, boolean, decimal } from "drizzle-orm/pg-core";
import { timestamps } from "../common";

/**
 * 营销活动表
 */
export const campaigns = pgTable("campaigns", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 30, enum: ["brand_awareness", "product_launch", "promotional", "affiliate", "review", "other"] }).notNull(),
  status: varchar("status", { length: 20, enum: ["draft", "active", "paused", "completed", "cancelled"] }).notNull().default("draft"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  targetAudience: jsonb("target_audience").$type<Record<string, any>>(),
  requirements: jsonb("requirements").$type<Record<string, any>>(),
  deliverables: jsonb("deliverables").$type<Array<any>>(),
  compensation: jsonb("compensation").$type<Record<string, any>>(),
  tags: jsonb("tags").$type<string[]>(),
  metrics: jsonb("metrics").$type<Record<string, any>>(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
});

/**
 * 活动参与表
 */
export const campaignParticipations = pgTable("campaign_participations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  campaignId: varchar("campaign_id", { length: 36 }).notNull().references("campaigns.id", { onDelete: "cascade" }),
  influencerId: varchar("influencer_id", { length: 36 }).notNull().references("influencers.id", { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  status: varchar("status", { length: 20, enum: ["invited", "accepted", "declined", "in_progress", "completed", "cancelled"] }).notNull().default("invited"),
  invitedAt: timestamp("invited_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  declinedAt: timestamp("declined_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  compensation: jsonb("compensation").$type<Record<string, any>>(),
  deliverables: jsonb("deliverables").$type<Array<any>>(),
  metrics: jsonb("metrics").$type<Record<string, any>>(),
  notes: text("notes"),
  ...timestamps,
});
