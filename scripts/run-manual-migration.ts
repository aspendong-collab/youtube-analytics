import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function runManualMigration() {
  const connectionString = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

  console.log('🔗 Connecting to Neon database...');
  const client = postgres(connectionString);

  try {
    console.log('\n🔄 Running manual migration...');

    // 1. 添加 comments 表
    console.log('Creating comments table...');
    try {
      await client`
        CREATE TABLE IF NOT EXISTS "comments" (
          "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "comment_id" varchar(50) NOT NULL UNIQUE,
          "video_id" varchar(20) NOT NULL,
          "author_name" varchar(255),
          "author_channel_id" varchar(50),
          "text_display" text NOT NULL,
          "like_count" integer DEFAULT 0,
          "published_at" timestamp with time zone,
          "updated_at" timestamp with time zone,
          "sentiment" varchar(20),
          "is_high_quality" boolean DEFAULT false,
          "quality_score" numeric(5, 2) DEFAULT '0',
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
        )
      `;
      console.log('✅ Comments table created');
    } catch (e: any) {
      if (e.code === '42P07') {
        console.log('⚠️  Comments table already exists');
      } else {
        throw e;
      }
    }

    // 2. 添加 videos 表的新字段
    console.log('\nAdding new columns to videos table...');

    try {
      await client`ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "duration" integer`;
      console.log('✅ Column duration added');
    } catch (e: any) {
      if (e.code === '42701') {
        console.log('⚠️  Column duration already exists');
      } else {
        console.error(`❌ Failed to add column duration:`, e.message);
      }
    }

    try {
      await client`ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "region" varchar(10)`;
      console.log('✅ Column region added');
    } catch (e: any) {
      if (e.code === '42701') {
        console.log('⚠️  Column region already exists');
      } else {
        console.error(`❌ Failed to add column region:`, e.message);
      }
    }

    try {
      await client`ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "language" varchar(10)`;
      console.log('✅ Column language added');
    } catch (e: any) {
      if (e.code === '42701') {
        console.log('⚠️  Column language already exists');
      } else {
        console.error(`❌ Failed to add column language:`, e.message);
      }
    }

    try {
      await client`ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "best_publish_time" jsonb`;
      console.log('✅ Column best_publish_time added');
    } catch (e: any) {
      if (e.code === '42701') {
        console.log('⚠️  Column best_publish_time already exists');
      } else {
        console.error(`❌ Failed to add column best_publish_time:`, e.message);
      }
    }

    // 3. 创建索引
    console.log('\nCreating indexes...');
    const indexes = [
      { name: 'comments_video_id_idx', table: 'comments', column: 'video_id' },
      { name: 'comments_sentiment_idx', table: 'comments', column: 'sentiment' },
      { name: 'comments_high_quality_idx', table: 'comments', column: 'is_high_quality' },
      { name: 'comments_published_at_idx', table: 'comments', column: 'published_at' }
    ];

    for (const idx of indexes) {
      try {
        await client`CREATE INDEX IF NOT EXISTS ${client(idx.name)} ON ${client(idx.table)} USING btree (${client(idx.column)})`;
        console.log(`✅ Index ${idx.name} created`);
      } catch (e: any) {
        console.error(`⚠️  Failed to create index ${idx.name}:`, e.message);
      }
    }

    console.log('\n✅ Manual migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runManualMigration().catch(console.error);
