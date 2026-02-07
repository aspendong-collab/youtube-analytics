/**
 * API v1 - 达人社路由
 */

// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { influencersService } from '@/services/influencers';
import { apiSuccess, apiErrors, withDefaultMiddleware, parseQueryParams, validatePagination, withPagination } from '../lib/middleware';

/**
 * GET /api/v1/influencers - 搜索达人
 */
async function getInfluencers(request: NextRequest) {
  const params = parseQueryParams(request);
  const { page, pageSize } = validatePagination(params);

  const filters = {
    query: params.query as string,
    category: params.category as string,
    minSubscribers: params.minSubscribers as number,
    maxSubscribers: params.maxSubscribers as number,
    minViews: params.minViews as number,
    maxViews: params.maxViews as number,
    minEngagementRate: params.minEngagementRate as number,
    maxEngagementRate: params.maxEngagementRate as number,
    collaborationStatus: params.collaborationStatus as any,
    scoreTier: params.scoreTier as string,
    sortBy: params.sortBy as any,
    sortOrder: params.sortOrder as any,
  };

  const result = await influencersService.search({
    ...filters,
    page,
    pageSize,
  });

  return apiSuccess(
    withPagination(result.data, page, pageSize, result.pagination.total),
    'Influencers retrieved successfully'
  );
}

/**
 * GET /api/v1/influencers/stats - 获取达人统计
 */
async function getInfluencerStats(request: NextRequest) {
  const stats = await influencersService.getStats();
  return apiSuccess(stats, 'Stats retrieved successfully');
}

export const GET = withDefaultMiddleware(getInfluencers);
