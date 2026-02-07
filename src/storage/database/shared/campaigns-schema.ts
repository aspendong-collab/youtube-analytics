import { pgTable, varchar, text, integer, timestamp, jsonb, boolean, decimal, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Campaigns 表 - 存储营销活动
export const campaigns = pgTable(
  "campaigns",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),
    budget: decimal("budget", { precision: 15, scale: 2 }),
    currency: varchar("currency", { length: 10 }).default("USD"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    status: varchar("status", { length: 20 }).notNull().default("planned"), // planned, active, paused, completed, cancelled
    category: varchar("category", { length: 100 }),
    targetAudience: text("target_audience"),
    goals: jsonb("goals").$type<string[]>(),
    requirements: text("requirements"),
    invitedInfluencerCount: integer("invited_influencer_count").default(0),
    acceptedInfluencerCount: integer("accepted_influencer_count").default(0),
    completedInfluencerCount: integer("completed_influencer_count").default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index("campaigns_status_idx").on(table.status),
    createdAtIdx: index("campaigns_created_at_idx").on(table.createdAt),
  })
);

// Campaign Participations 表 - 存储活动参与记录
export const campaignParticipations = pgTable(
  "campaign_participations",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    campaignId: varchar("campaign_id", { length: 36 }).notNull(),
    influencerId: varchar("influencer_id", { length: 36 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected, completed, cancelled
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    campaignIdIdx: index("campaign_participations_campaign_id_idx").on(table.campaignId),
    influencerIdIdx: index("campaign_participations_influencer_id_idx").on(table.influencerId),
    statusIdx: index("campaign_participations_status_idx").on(table.status),
  })
);
