/**
 * 数据库迁移脚本：创建 Affiliate 拓展相关的表
 * 运行方式：pnpm tsx scripts/migrations/add-affiliate-tables.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// 从环境变量获取数据库连接字符串
const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DATABASE_URL = process.env.PGDATABASE_URL || NEON_DATABASE_URL;

function getDb() {
  const client = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client);
}

// 创建 db 实例
let dbInstance: ReturnType<typeof drizzle> | null = null;

const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    if (!dbInstance) {
      dbInstance = getDb();
    }
    return dbInstance[prop as keyof typeof dbInstance];
  },
});

async function runMigration() {
  console.log('开始运行数据库迁移...');

  try {
    // 1. 创建 affiliate_videos 表
    console.log('创建 affiliate_videos 表...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS affiliate_videos (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id VARCHAR(20) NOT NULL,
        channel_id VARCHAR(50) NOT NULL,
        video_title VARCHAR(500),
        thumbnail TEXT,
        published_at TIMESTAMP WITH TIME ZONE,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        affiliate_score DECIMAL(5,2) DEFAULT 0,
        affiliate_evidence JSONB NOT NULL,
        description_analysis JSONB,
        comment_analysis JSONB,
        extracted_email VARCHAR(255),
        extracted_social_links JSONB,
        search_keyword VARCHAR(200),
        search_language VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(video_id)
      )
    `);
    console.log('✓ affiliate_videos 表创建成功');

    // 创建索引
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_videos_channel_id_idx ON affiliate_videos(channel_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_videos_affiliate_score_idx ON affiliate_videos(affiliate_score)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_videos_search_keyword_idx ON affiliate_videos(search_keyword)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_videos_created_at_idx ON affiliate_videos(created_at)`);
    console.log('✓ affiliate_videos 索引创建成功');

    // 2. 创建 affiliate_links 表
    console.log('创建 affiliate_links 表...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS affiliate_links (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        video_id VARCHAR(20) NOT NULL,
        channel_id VARCHAR(50) NOT NULL,
        link_type VARCHAR(20) NOT NULL,
        link_value TEXT NOT NULL,
        full_url TEXT,
        position VARCHAR(20) NOT NULL,
        frequency INTEGER DEFAULT 1,
        search_keyword VARCHAR(200),
        search_language VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✓ affiliate_links 表创建成功');

    // 创建索引
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_links_video_id_idx ON affiliate_links(video_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_links_channel_id_idx ON affiliate_links(channel_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_links_link_type_idx ON affiliate_links(link_type)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_links_search_keyword_idx ON affiliate_links(search_keyword)`);
    console.log('✓ affiliate_links 索引创建成功');

    // 3. 创建 affiliate_influencers 表
    console.log('创建 affiliate_influencers 表...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS affiliate_influencers (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        channel_id VARCHAR(50) NOT NULL UNIQUE,
        channel_title VARCHAR(200) NOT NULL,
        thumbnail TEXT,
        subscriber_count INTEGER DEFAULT 0,
        total_videos INTEGER DEFAULT 0,
        total_views INTEGER DEFAULT 0,
        affiliate_score DECIMAL(5,2) DEFAULT 0,
        affiliate_status VARCHAR(20) DEFAULT 'potential',
        affiliate_verified_at TIMESTAMP WITH TIME ZONE,
        affiliate_evidence JSONB,
        email VARCHAR(255),
        phone VARCHAR(20),
        wechat VARCHAR(50),
        extracted_emails JSONB,
        social_links JSONB,
        description TEXT,
        tags JSONB,
        category VARCHAR(50),
        niche VARCHAR(100),
        recommendation_score DECIMAL(5,2) DEFAULT 0,
        quality_score DECIMAL(5,2) DEFAULT 0,
        engagement_rate DECIMAL(5,2) DEFAULT 0,
        cooperation_status VARCHAR(30) DEFAULT 'available',
        last_cooperation_date TIMESTAMP WITH TIME ZONE,
        cooperation_count INTEGER DEFAULT 0,
        notes TEXT,
        search_keyword VARCHAR(200),
        search_language VARCHAR(20),
        is_favorite BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log('✓ affiliate_influencers 表创建成功');

    // 创建索引
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_influencers_channel_id_idx ON affiliate_influencers(channel_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_influencers_affiliate_score_idx ON affiliate_influencers(affiliate_score)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_influencers_affiliate_status_idx ON affiliate_influencers(affiliate_status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_influencers_cooperation_status_idx ON affiliate_influencers(cooperation_status)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_influencers_category_idx ON affiliate_influencers(category)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_influencers_search_keyword_idx ON affiliate_influencers(search_keyword)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_influencers_is_favorite_idx ON affiliate_influencers(is_favorite)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS affiliate_influencers_created_at_idx ON affiliate_influencers(created_at)`);
    console.log('✓ affiliate_influencers 索引创建成功');

    console.log('\n✅ 数据库迁移完成！');
    console.log('已创建以下表：');
    console.log('  - affiliate_videos');
    console.log('  - affiliate_links');
    console.log('  - affiliate_influencers');

  } catch (error) {
    console.error('❌ 数据库迁移失败：', error);
    throw error;
  }
}

// 运行迁移
runMigration()
  .then(() => {
    console.log('迁移脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('迁移脚本执行失败：', error);
    process.exit(1);
  });
