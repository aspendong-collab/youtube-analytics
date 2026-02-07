/**
 * API v1 - 分析路由
 */

import { NextRequest } from 'next/server';
import { analyticsService } from '@/services/analytics';
import { apiSuccess, withDefaultMiddleware } from '../lib/middleware';

/**
 * GET /api/v1/analytics/overview - 获取系统概览统计
 */
async function getOverview(request: NextRequest) {
  const overview = await analyticsService.getSystemOverview();

  return apiSuccess(overview, 'Overview retrieved successfully');
}

/**
 * GET /api/v1/analytics/influencers - 获取达人统计
 */
async function getInfluencerStats(request: NextRequest) {
  const stats = await analyticsService.getInfluencerStats();

  return apiSuccess(stats, 'Influencer stats retrieved successfully');
}

/**
 * GET /api/v1/analytics/campaigns - 获取活动统计
 */
async function getCampaignStats(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || undefined;

  const stats = await analyticsService.getCampaignStats(userId);

  return apiSuccess(stats, 'Campaign stats retrieved successfully');
}

/**
 * GET /api/v1/analytics/trends - 获取趋势数据
 */
async function getTrends(request: NextRequest) {
  const url = new URL(request.url);
  const metric = (url.searchParams.get('metric') as any) || 'views';
  const period = (url.searchParams.get('period') as any) || '30d';

  const trends = await analyticsService.getTrendData(metric, period);

  return apiSuccess(trends, 'Trends retrieved successfully');
}

export const GET = withDefaultMiddleware(getOverview);
