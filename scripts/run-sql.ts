import postgres from 'postgres';

const DATABASE_URL = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const sql = postgres(DATABASE_URL);

async function main() {
  console.log('开始创建新表...');

  try {
    // 创建 user_favorites 表
    await sql`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id varchar(36) NOT NULL,
        influencer_id varchar(36) NOT NULL,
        channel_id varchar(50) NOT NULL,
        note text,
        tags jsonb,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ user_favorites 表创建成功');

    // 创建 user_influencers 表
    await sql`
      CREATE TABLE IF NOT EXISTS user_influencers (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        user_id varchar(36) NOT NULL,
        influencer_id varchar(36) NOT NULL,
        channel_id varchar(50) NOT NULL,
        list_name varchar(100) DEFAULT 'default',
        status varchar(20) DEFAULT 'added',
        priority varchar(10) DEFAULT 'medium',
        note text,
        tags jsonb,
        last_contacted_at timestamp with time zone,
        cooperation_count integer DEFAULT 0,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ user_influencers 表创建成功');

    // 创建索引
    await sql`CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON user_favorites USING btree (user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_favorites_influencer_id_idx ON user_favorites USING btree (influencer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_favorites_user_influencer_idx ON user_favorites USING btree (user_id, influencer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_favorites_channel_id_idx ON user_favorites USING btree (channel_id)`;
    console.log('✅ user_favorites 索引创建成功');

    await sql`CREATE INDEX IF NOT EXISTS user_influencers_user_id_idx ON user_influencers USING btree (user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_influencers_influencer_id_idx ON user_influencers USING btree (influencer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_influencers_user_list_idx ON user_influencers USING btree (user_id, list_name)`;
    await sql`CREATE INDEX IF NOT EXISTS user_influencers_user_influencer_idx ON user_influencers USING btree (user_id, influencer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_influencers_channel_id_idx ON user_influencers USING btree (channel_id)`;
    await sql`CREATE INDEX IF NOT EXISTS user_influencers_status_idx ON user_influencers USING btree (status)`;
    console.log('✅ user_influencers 索引创建成功');

    console.log('✅ 所有表和索引创建成功！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建表失败:', error);
    process.exit(1);
  }
}

main();
