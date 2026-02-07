/**
 * API v1 - 分析 - 趋势数据路由
 */

// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { campaigns, campaignParticipations } from '@/storage/database/shared/schema';
import { apiSuccess, apiErrors, withDefaultMiddleware } from '../../lib/middleware';

async function handler(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';

    // 计算日期范围
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // 获取趋势数据
    const trends = await db
      .select({
        date: db.raw(`DATE(invited_at)`),
        invitations: db.raw(`COUNT(*)`),
        participations: db.raw(`COUNT(CASE WHEN status = 'accepted' THEN 1 END)`),
        completions: db.raw(`COUNT(CASE WHEN status = 'completed' THEN 1 END)`),
      })
      .from(campaignParticipations)
      .where(db.raw(`invited_at >= ?`, [startDate]))
      .groupBy(db.raw(`DATE(invited_at)`))
      .orderBy(db.raw(`DATE(invited_at)`));

    return apiSuccess(trends, 'Trends retrieved successfully');
  } catch (error) {
    console.error('Error fetching trends:', error);
    return apiSuccess([], 'Error fetching trends');
  }
}

export const GET = withDefaultMiddleware(handler);
