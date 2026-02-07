/**
 * API v1 - 分析 - 趋势数据路由
 */

import { NextRequest } from 'next/server';
import { analyticsService } from '@/services/analytics';
import { apiSuccess, apiErrors, withDefaultMiddleware } from '../../../lib/middleware';

async function handler(request: NextRequest) {
  const url = new URL(request.url);
  const metric = url.searchParams.get('metric') as any;
  const period = url.searchParams.get('period') as any;

  if (!metric) {
    return apiErrors.badRequest('Metric is required');
  }

  const validMetrics = ['influencers', 'videos', 'campaigns', 'views'];
  if (!validMetrics.includes(metric)) {
    return apiErrors.badRequest('Invalid metric. Must be one of: ' + validMetrics.join(', '));
  }

  const validPeriods = ['7d', '30d', '90d'];
  if (period && !validPeriods.includes(period)) {
    return apiErrors.badRequest('Invalid period. Must be one of: ' + validPeriods.join(', '));
  }

  const trends = await analyticsService.getTrendData(metric, period);

  return apiSuccess(trends, 'Trends retrieved successfully');
}

export const GET = withDefaultMiddleware(handler);
