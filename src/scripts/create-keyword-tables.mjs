import postgres from "postgres";

const DATABASE_URL = process.env.PGDATABASE_URL || 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function pushSchema() {
  console.log('Creating tables...');
  
  const sql = postgres(DATABASE_URL);
  
  try {
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
        relevance DECIMAL(5,2) DEFAULT 0,
        estimated_search_volume INTEGER DEFAULT 0,
        estimated_competition DECIMAL(5,2) DEFAULT 0,
        commercial_value DECIMAL(5,2) DEFAULT 0,
        recommendation_score DECIMAL(5,2) DEFAULT 0,
        type VARCHAR(20) DEFAULT 'broad',
        intent VARCHAR(20) DEFAULT 'info',
        related_keywords JSONB,
        source_video_ids JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    console.log('✓ Created expanded_keywords table');

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS keyword_expansions_input_keyword_idx 
      ON keyword_expansions(input_keyword);
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
