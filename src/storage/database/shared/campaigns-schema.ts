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

// Campaign Auto Matches 表 - 存储自动化匹配结果
export const campaignAutoMatches = pgTable(
  "campaign_auto_matches",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    campaignId: varchar("campaign_id", { length: 36 }).notNull(),
    influencerId: varchar("influencer_id", { length: 36 }).notNull(),
    estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }).notNull(),
    matchScore: integer("match_score").notNull().default(0), // 0-100
    matchReason: text("match_reason"), // JSON string
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected, completed
    emailSent: boolean("email_sent").default(false),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    campaignIdIdx: index("campaign_auto_matches_campaign_id_idx").on(table.campaignId),
    influencerIdIdx: index("campaign_auto_matches_influencer_id_idx").on(table.influencerId),
    statusIdx: index("campaign_auto_matches_status_idx").on(table.status),
    campaignStatusIdx: index("campaign_auto_matches_campaign_status_idx").on(table.campaignId, table.status),
  })
);

// Campaign Email Queue 表 - 存储邮件队列
export const campaignEmailQueue = pgTable(
  "campaign_email_queue",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    campaignId: varchar("campaign_id", { length: 36 }).notNull(),
    influencerId: varchar("influencer_id", { length: 36 }).notNull(),
    autoMatchId: varchar("auto_match_id", { length: 36 }),
    emailType: varchar("email_type", { length: 20 }).notNull(), // invitation, negotiation, followup, confirmation, rejection
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    recipientName: varchar("recipient_name", { length: 200 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    content: text("content").notNull(),
    htmlContent: text("html_content"),
    provider: varchar("provider", { length: 20 }).notNull().default("elastic"), // elastic, ses, resend, mailjet
    providerMessageId: varchar("provider_message_id", { length: 255 }),
    status: varchar("status", { length: 20 }).notNull().default("queued"), // queued, sending, sent, failed, bounced
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0),
    maxRetries: integer("max_retries").default(3),
    trackingEnabled: boolean("tracking_enabled").default(true),
    trackingPixelUrl: text("tracking_pixel_url"),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    openCount: integer("open_count").default(0),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    clickCount: integer("click_count").default(0),
    bouncedAt: timestamp("bounced_at", { withTimezone: true }),
    bounceType: varchar("bounce_type", { length: 10 }), // hard, soft
    bounceReason: text("bounce_reason"),
    spamComplainedAt: timestamp("spam_complained_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    campaignIdIdx: index("campaign_email_queue_campaign_id_idx").on(table.campaignId),
    influencerIdIdx: index("campaign_email_queue_influencer_id_idx").on(table.influencerId),
    autoMatchIdIdx: index("campaign_email_queue_auto_match_id_idx").on(table.autoMatchId),
    statusIdx: index("campaign_email_queue_status_idx").on(table.status),
    scheduledAtIdx: index("campaign_email_queue_scheduled_at_idx").on(table.scheduledAt),
    recipientEmailIdx: index("campaign_email_queue_recipient_email_idx").on(table.recipientEmail),
    campaignStatusIdx: index("campaign_email_queue_campaign_status_idx").on(table.campaignId, table.status),
  })
);

// Campaign Negotiation Logs 表 - 存储自动化谈判记录
export const campaignNegotiationLogs = pgTable(
  "campaign_negotiation_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    campaignId: varchar("campaign_id", { length: 36 }).notNull(),
    influencerId: varchar("influencer_id", { length: 36 }).notNull(),
    autoMatchId: varchar("auto_match_id", { length: 36 }),
    initialPrice: decimal("initial_price", { precision: 10, scale: 2 }).notNull(),
    ourOffer: decimal("our_offer", { precision: 10, scale: 2 }),
    counterOffer: decimal("counter_offer", { precision: 10, scale: 2 }),
    finalPrice: decimal("final_price", { precision: 10, scale: 2 }),
    negotiationRounds: integer("negotiation_rounds").default(0),
    maxRounds: integer("max_rounds").default(5),
    aiStrategyUsed: varchar("ai_strategy_used", { length: 20 }), // aggressive, moderate, conservative
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, in_progress, accepted, rejected, failed, user_intervention
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    messages: text("messages"), // JSON string: { role, content, timestamp, price }[]
    needsUserApproval: boolean("needs_user_approval").default(false),
    userApproved: boolean("user_approved"),
    userApprovalAt: timestamp("user_approval_at", { withTimezone: true }),
    userNotes: text("user_notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => ({
    campaignIdIdx: index("campaign_negotiation_logs_campaign_id_idx").on(table.campaignId),
    influencerIdIdx: index("campaign_negotiation_logs_influencer_id_idx").on(table.influencerId),
    autoMatchIdIdx: index("campaign_negotiation_logs_auto_match_id_idx").on(table.autoMatchId),
    statusIdx: index("campaign_negotiation_logs_status_idx").on(table.status),
    campaignStatusIdx: index("campaign_negotiation_logs_campaign_status_idx").on(table.campaignId, table.status),
    needsApprovalIdx: index("campaign_negotiation_logs_needs_approval_idx").on(table.needsUserApproval),
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
