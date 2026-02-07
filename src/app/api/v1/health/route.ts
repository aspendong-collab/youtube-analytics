/**
 * API v1 - 健康检查路由
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { apiSuccess } from '../lib/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 检查数据库连接
    const result = await db.execute(db.raw('SELECT 1 as health_check'));
    
    return apiSuccess({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
