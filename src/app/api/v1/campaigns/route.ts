/**
 * API v1 - 营销活动路由
 */

// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { campaignsService } from '@/services/campaigns';
import { apiSuccess, apiErrors, withDefaultMiddleware, parseQueryParams, validatePagination, withPagination } from '../lib/middleware';

/**
 * POST /api/v1/campaigns - 创建营销活动
 */
async function createCampaign(request: NextRequest) {
  const body = await request.json();

  const campaign = await campaignsService.create(body);

  return apiSuccess(campaign, 'Campaign created successfully', 201);
}

/**
 * GET /api/v1/campaigns - 获取营销活动列表
 */
async function getCampaigns(request: NextRequest) {
  const params = parseQueryParams(request);
  const { page, pageSize } = validatePagination(params);

  const filters = {
    userId: params.userId as string,
    status: params.status as any,
    type: params.type as any,
    minBudget: params.minBudget as number,
    maxBudget: params.maxBudget as number,
    sortBy: params.sortBy as any,
    sortOrder: params.sortOrder as any,
  };

  const result = await campaignsService.list({
    ...filters,
    page,
    pageSize,
  });

  return apiSuccess(
    withPagination(result.data, page, pageSize, result.pagination.total),
    'Campaigns retrieved successfully'
  );
}

export const POST = withDefaultMiddleware(createCampaign);
export const GET = withDefaultMiddleware(getCampaigns);
