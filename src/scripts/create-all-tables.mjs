import postgres from "postgres";

const DATABASE_URL = process.env.PGDATABASE_URL || process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function createAllTables() {
  console.log('Creating all database tables...');
  
  const sql = postgres(DATABASE_URL);
  
  try {
    // ==================== YouTube API Quota Tables ====================
    console.log('\n📊 Creating YouTube API quota tables...');
    
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

    // Create indexes for quota tables
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
    console.log('✓ Created quota table indexes');

    // ==================== Keyword Expansions Tables ====================
    console.log('\n🔑 Creating keyword expansions tables...');
    
    // Create keyword_expansions table
    await sql`
      CREATE TABLE IF NOT EXISTS keyword_expansions (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        input_keyword VARCHAR(500) NOT NULL,
        input_category VARCHAR(20) NOT NULL,
        expansion_result JSONB,
        total_keywords INTEGER DEFAULT 0,
        unique_keywords INTEGER DEFAULT 0,
        use_rule_engine BOOLEAN DEFAULT true,
        use_llm_engine BOOLEAN DEFAULT true,
        use_data_mining BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      );
    `;
    console.log('✓ Created keyword_expansions table');

    // Create expanded_keywords table
    await sql`
      CREATE TABLE IF NOT EXISTS expanded_keywords (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        expansion_id VARCHAR(36) NOT NULL,
        keyword VARCHAR(500) NOT NULL,
        dimension VARCHAR(20) NOT NULL,
        source VARCHAR(20) NOT NULL,
        relevance DECIMAL(3, 2) DEFAULT '0.00',
        estimated_search_volume INTEGER DEFAULT 0,
        estimated_competition DECIMAL(3, 2) DEFAULT '0.00',
        commercial_value DECIMAL(3, 2) DEFAULT '0.00',
        recommendation_score DECIMAL(3, 2) DEFAULT '0.00',
        type VARCHAR(20) DEFAULT 'broad',
        intent VARCHAR(20) DEFAULT 'info',
        related_keywords JSONB,
        source_video_ids JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✓ Created expanded_keywords table');

    // Create indexes for keyword expansions tables
    await sql`
      CREATE INDEX IF NOT EXISTS keyword_expansions_input_keyword_idx 
      ON keyword_expansions(input_keyword);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS keyword_expansions_created_at_idx 
      ON keyword_expansions(created_at);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS expanded_keywords_expansion_id_idx 
      ON expanded_keywords(expansion_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS expanded_keywords_keyword_idx 
      ON expanded_keywords(keyword);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS expanded_keywords_dimension_idx 
      ON expanded_keywords(dimension);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS expanded_keywords_source_idx 
      ON expanded_keywords(source);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS expanded_keywords_recommendation_score_idx 
      ON expanded_keywords(recommendation_score);
    `;
    console.log('✓ Created keyword expansions table indexes');

    console.log('\n✅ All tables created successfully!');
    console.log('\n📋 Tables created:');
    console.log('  - youtube_api_quota');
    console.log('  - api_call_logs');
    console.log('  - keyword_expansions');
    console.log('  - expanded_keywords');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    await sql.end();
    process.exit(1);
  }
}

createAllTables().then(() => process.exit(0));
