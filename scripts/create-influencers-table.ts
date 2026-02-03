import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/storage/database/shared/schema";
import { sql } from "drizzle-orm";

async function createInfluencersTable() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL 环境变量未设置");
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    console.log("开始创建 influencers 表...");

    // 创建 influencers 表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS influencers (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id VARCHAR(50) NOT NULL UNIQUE,
        channel_title VARCHAR(200) NOT NULL,
        thumbnail TEXT,
        subscriber_count INTEGER DEFAULT 0,
        total_videos INTEGER DEFAULT 0,
        total_views INTEGER DEFAULT 0,
        email VARCHAR(255),
        phone VARCHAR(20),
        wechat VARCHAR(50),
        description TEXT,
        tags JSONB,
        category VARCHAR(50),
        niche VARCHAR(100),
        level VARCHAR(20) DEFAULT 'C',
        price_range VARCHAR(50),
        average_price DECIMAL(10, 2) DEFAULT 0,
        quality_score DECIMAL(5, 2) DEFAULT 0,
        cooperation_score DECIMAL(5, 2) DEFAULT 0,
        engagement_rate DECIMAL(5, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'available',
        is_favorite BOOLEAN DEFAULT false,
        cooperation_count INTEGER DEFAULT 0,
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE,
        last_cooperation_at TIMESTAMP WITH TIME ZONE
      );

      CREATE INDEX IF NOT EXISTS influencers_channel_id_idx ON influencers(channel_id);
      CREATE INDEX IF NOT EXISTS influencers_status_idx ON influencers(status);
      CREATE INDEX IF NOT EXISTS influencers_level_idx ON influencers(level);
      CREATE INDEX IF NOT EXISTS influencers_category_idx ON influencers(category);
      CREATE INDEX IF NOT EXISTS influencers_user_id_idx ON influencers(user_id);
      CREATE INDEX IF NOT EXISTS influencers_is_favorite_idx ON influencers(is_favorite);
      CREATE INDEX IF NOT EXISTS influencers_created_at_idx ON influencers(created_at);
    `);

    console.log("✅ influencers 表创建成功");

    // 创建触发器：自动更新 updated_at 字段
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_influencers_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language plpgsql;

      DROP TRIGGER IF EXISTS update_influencers_updated_at_trigger ON influencers;

      CREATE TRIGGER update_influencers_updated_at_trigger
        BEFORE UPDATE ON influencers
        FOR EACH ROW
        EXECUTE FUNCTION update_influencers_updated_at();
    `);

    console.log("✅ 触发器创建成功");

    console.log("\n所有操作完成！");
  } catch (error) {
    console.error("创建表失败:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createInfluencersTable();
