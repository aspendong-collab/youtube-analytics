import { timestamp } from "drizzle-orm/pg-core";

/**
 * 公共时间戳字段
 * 所有表都应该包含这些字段
 */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};
