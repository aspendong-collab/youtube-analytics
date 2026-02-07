import { pgTable, varchar, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { timestamps } from "../common";

/**
 * 谈判表
 */
export const negotiations = pgTable("negotiations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references("users.id", { onDelete: "cascade" }),
  influencerId: varchar("influencer_id", { length: 36 }).notNull().references("influencers.id", { onDelete: "cascade" }),
  campaignId: varchar("campaign_id", { length: 36 }).references("campaigns.id", { onDelete: "set null" }),
  threadId: varchar("thread_id", { length: 36 }).references("communication_threads.id", { onDelete: "set null" }),
  status: varchar("status", { length: 20, enum: ["draft", "proposed", "countered", "accepted", "rejected", "expired", "cancelled"] }).notNull().default("draft"),
  type: varchar("type", { length: 20, enum: ["compensation", "deliverables", "timeline", "terms", "custom"] }).notNull(),
  terms: jsonb("terms").$type<Record<string, any>>().notNull(),
  proposedBy: varchar("proposed_by", { length: 20, enum: ["user", "influencer"] }).notNull(),
  proposedAt: timestamp("proposed_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  respondedBy: varchar("responded_by", { length: 20, enum: ["user", "influencer"] }),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
});

/**
 * 谈判提案表
 */
export const negotiationProposals = pgTable("negotiation_proposals", {
  id: varchar("id", { length: 36 }).primaryKey(),
  negotiationId: varchar("negotiation_id", { length: 36 }).notNull().references("negotiations.id", { onDelete: "cascade" }),
  version: integer("version").notNull(),
  proposedBy: varchar("proposed_by", { length: 20, enum: ["user", "influencer"] }).notNull(),
  terms: jsonb("terms").$type<Record<string, any>>().notNull(),
  notes: text("notes"),
  status: varchar("status", { length: 20, enum: ["pending", "accepted", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

/**
 * 谈判历史记录表
 */
export const negotiationHistory = pgTable("negotiation_history", {
  id: varchar("id", { length: 36 }).primaryKey(),
  negotiationId: varchar("negotiation_id", { length: 36 }).notNull().references("negotiations.id", { onDelete: "cascade" }),
  action: varchar("action", { length: 20 }).notNull(),
  actor: varchar("actor", { length: 20, enum: ["user", "influencer", "system"] }).notNull(),
  actorId: varchar("actor_id", { length: 36 }).notNull(),
  details: jsonb("details").$type<Record<string, any>>().notNull(),
  ...timestamps,
});
