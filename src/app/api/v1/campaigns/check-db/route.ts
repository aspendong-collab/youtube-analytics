// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const dbInstance = (await import('@/lib/db')).dbInstance;
    
    // 检查 campaigns 表是否存在
    const result = await dbInstance.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'campaign_%'
      ORDER BY table_name
    `);
    
    return NextResponse.json({
      success: true,
      tables: result.rows,
      connectionString: process.env.PGDATABASE_URL ? 'Set' : 'Not set',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      connectionString: process.env.PGDATABASE_URL ? 'Set' : 'Not set',
    }, { status: 500 });
  }
}
