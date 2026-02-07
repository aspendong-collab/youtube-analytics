import { index } from "drizzle-orm/pg-core";

/**
 * 公共索引字段
 */
export const commonIndexes = {
  createdAtIdx: index("created_at_idx"),
  updatedAtIdx: index("updated_at_idx"),
  deletedAtIdx: index("deleted_at_idx"),
};
