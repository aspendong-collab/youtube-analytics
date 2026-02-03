import { db } from '../src/storage/database';
import { sql } from 'drizzle-orm';

async function createABTestTables() {
  console.log('Creating A/B test tables...');

  try {
    // Create ab_tests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ab_tests (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        video_id VARCHAR(50),
        user_id VARCHAR(36) REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        winner_variant_id VARCHAR(36),
        confidence DECIMAL(5, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create ab_test_variants table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ab_test_variants (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id VARCHAR(36) NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
        variant_name VARCHAR(100) NOT NULL,
        title VARCHAR(500),
        description TEXT,
        thumbnail TEXT,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        ctr DECIMAL(5, 4),
        conversion_rate DECIMAL(5, 4),
        avg_watch_time INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create ab_test_results table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ab_test_results (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_id VARCHAR(36) NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,
        stat_date TIMESTAMP WITH TIME ZONE NOT NULL,
        impressions INTEGER NOT NULL DEFAULT 0,
        clicks INTEGER NOT NULL DEFAULT 0,
        views INTEGER NOT NULL DEFAULT 0,
        watch_time INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes for ab_tests
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ab_tests_user_id_idx ON ab_tests(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ab_tests_video_id_idx ON ab_tests(video_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ab_tests_status_idx ON ab_tests(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ab_tests_type_idx ON ab_tests(type)`);

    // Create indexes for ab_test_variants
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ab_test_variants_test_id_idx ON ab_test_variants(test_id)`);

    // Create indexes for ab_test_results
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ab_test_results_variant_id_idx ON ab_test_results(variant_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ab_test_results_stat_date_idx ON ab_test_results(stat_date)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ab_test_results_variant_date_idx ON ab_test_results(variant_id, stat_date)`);

    console.log('✅ A/B test tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating A/B test tables:', error);
    throw error;
  }
}

// Run the migration
createABTestTables()
  .then(() => {
    console.log('Migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
