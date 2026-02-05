import postgres from "postgres";

const DATABASE_URL = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function pushSchema() {
  console.log('Creating YouTube API quota tables...');
  
  const sql = postgres(DATABASE_URL);
  
  try {
    // Create youtube_api_quota table
    await sql`
      CREATE TABLE IF NOT EXISTS youtube_api_quota (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL UNIQUE,
        api_type VARCHAR(50) NOT NULL,
        quota_used INTEGER DEFAULT 0,
        quota_limit INTEGER DEFAULT 10000,
        last_reset_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `;
    console.log('✓ Created youtube_api_quota table');

    // Create api_call_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS api_call_logs (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        api_type VARCHAR(50) NOT NULL,
        operation VARCHAR(100) NOT NULL,
        quota_cost INTEGER DEFAULT 1,
        success BOOLEAN DEFAULT true,
        error_message TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✓ Created api_call_logs table');

    // Create indexes
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS youtube_api_quota_date_api_type_idx 
      ON youtube_api_quota(date, api_type);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS youtube_api_quota_date_idx 
      ON youtube_api_quota(date);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS api_call_logs_api_type_idx 
      ON api_call_logs(api_type);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS api_call_logs_success_idx 
      ON api_call_logs(success);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS api_call_logs_created_at_idx 
      ON api_call_logs(created_at);
    `;
    console.log('✓ Created indexes');

    console.log('\n✅ All tables created successfully!');
    await sql.end();
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    await sql.end();
    process.exit(1);
  }
}

pushSchema().then(() => process.exit(0));
