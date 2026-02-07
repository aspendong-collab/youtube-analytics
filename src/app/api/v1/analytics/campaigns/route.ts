/**
 * API v1 - 分析 - 活动统计路由
 */

import { NextRequest } from 'next/server';
import { analyticsService } from '@/services/analytics';
import { apiSuccess, withDefaultMiddleware } from '../../../lib/middleware';

async function handler(request: NextRequest) {
  const stats = await analyticsService.getCampaignStats();

  return apiSuccess(stats, 'Campaign stats retrieved successfully');
}

export const GET = withDefaultMiddleware(handler);
