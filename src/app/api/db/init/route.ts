import { NextResponse, NextRequest } from 'next/server';
import postgres from "postgres";

const DATABASE_URL = process.env.PGDATABASE_URL || process.env.DATABASE_URL;

/**
 * POST /api/db/init
 * 初始化数据库表
 * 注意：这个端点应该只在部署后执行一次，或者用于手动创建表
 * 生产环境应该限制访问权限
 */
export async function POST(request: NextRequest) {
  try {
    // 安全检查：只允许管理员或特定的密钥访问
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.DB_INIT_SECRET || 'youtube-analytics-init-key';
    
    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    console.log('Starting database table initialization...');
    
    const sql = postgres(DATABASE_URL);
    const results = {
      created: [] as string[],
      errors: [] as string[],
      skipped: [] as string[]
    };

    try {
      // ==================== YouTube API Quota Tables ====================
      console.log('Creating YouTube API quota tables...');
      
      try {
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
        results.created.push('youtube_api_quota');
      } catch (e: any) {
        if (e.code === '42P07') {
          results.skipped.push('youtube_api_quota (already exists)');
        } else {
          results.errors.push(`youtube_api_quota: ${e.message}`);
        }
      }

      try {
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
        results.created.push('api_call_logs');
      } catch (e: any) {
        if (e.code === '42P07') {
          results.skipped.push('api_call_logs (already exists)');
        } else {
          results.errors.push(`api_call_logs: ${e.message}`);
        }
      }

      // Create indexes
      const indexes = [
        'CREATE UNIQUE INDEX IF NOT EXISTS youtube_api_quota_date_api_type_idx ON youtube_api_quota(date, api_type)',
        'CREATE INDEX IF NOT EXISTS youtube_api_quota_date_idx ON youtube_api_quota(date)',
        'CREATE INDEX IF NOT EXISTS api_call_logs_api_type_idx ON api_call_logs(api_type)',
        'CREATE INDEX IF NOT EXISTS api_call_logs_success_idx ON api_call_logs(success)',
        'CREATE INDEX IF NOT EXISTS api_call_logs_created_at_idx ON api_call_logs(created_at)'
      ];

      for (const indexSql of indexes) {
        try {
          await sql.unsafe(indexSql);
        } catch (e: any) {
          // Ignore duplicate index errors
          if (e.code !== '42P07') {
            results.errors.push(`Index creation error: ${e.message}`);
          }
        }
      }

      // ==================== Keyword Expansions Tables ====================
      console.log('Creating keyword expansions tables...');
      
      try {
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
        results.created.push('keyword_expansions');
      } catch (e: any) {
        if (e.code === '42P07') {
          results.skipped.push('keyword_expansions (already exists)');
        } else {
          results.errors.push(`keyword_expansions: ${e.message}`);
        }
      }

      try {
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
        results.created.push('expanded_keywords');
      } catch (e: any) {
        if (e.code === '42P07') {
          results.skipped.push('expanded_keywords (already exists)');
        } else {
          results.errors.push(`expanded_keywords: ${e.message}`);
        }
      }

      // Create indexes for keyword expansions tables
      const keywordIndexes = [
        'CREATE INDEX IF NOT EXISTS keyword_expansions_input_keyword_idx ON keyword_expansions(input_keyword)',
        'CREATE INDEX IF NOT EXISTS keyword_expansions_created_at_idx ON keyword_expansions(created_at)',
        'CREATE INDEX IF NOT EXISTS expanded_keywords_expansion_id_idx ON expanded_keywords(expansion_id)',
        'CREATE INDEX IF NOT EXISTS expanded_keywords_keyword_idx ON expanded_keywords(keyword)',
        'CREATE INDEX IF NOT EXISTS expanded_keywords_dimension_idx ON expanded_keywords(dimension)',
        'CREATE INDEX IF NOT EXISTS expanded_keywords_source_idx ON expanded_keywords(source)',
        'CREATE INDEX IF NOT EXISTS expanded_keywords_recommendation_score_idx ON expanded_keywords(recommendation_score)'
      ];

      for (const indexSql of keywordIndexes) {
        try {
          await sql.unsafe(indexSql);
        } catch (e: any) {
          if (e.code !== '42P07') {
            results.errors.push(`Index creation error: ${e.message}`);
          }
        }
      }

      await sql.end();

      console.log('Database initialization completed:', results);

      return NextResponse.json({
        success: true,
        message: 'Database tables initialized successfully',
        results
      });

    } catch (error: any) {
      console.error('Database initialization error:', error);
      await sql.end();
      
      return NextResponse.json(
        {
          success: false,
          error: 'Database initialization failed',
          details: error.message,
          results
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/db/init
 * 检查数据库表状态
 */
export async function GET() {
  try {
    if (!DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const sql = postgres(DATABASE_URL);
    
    try {
      // Check if tables exist
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name IN ('youtube_api_quota', 'api_call_logs', 'keyword_expansions', 'expanded_keywords')
        ORDER BY table_name;
      `;

      await sql.end();

      const existingTables = tables.map(t => t.table_name);
      const requiredTables = ['youtube_api_quota', 'api_call_logs', 'keyword_expansions', 'expanded_keywords'];
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));

      return NextResponse.json({
        success: true,
        data: {
          existingTables,
          missingTables,
          allTablesExist: missingTables.length === 0
        }
      });
    } catch (error: any) {
      await sql.end();
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to check database tables',
          details: error.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}