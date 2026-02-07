/**
 * API v1 - 营销活动详情路由
 */

// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { campaignsService } from '@/services/campaigns';
import { apiSuccess, apiErrors, withDefaultMiddleware } from '../../lib/middleware';

/**
 * GET /api/v1/campaigns/[id] - 获取营销活动详情
 */
async function getCampaignById(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const campaign = await campaignsService.getById(params.id);

  if (!campaign) {
    return apiErrors.notFound('Campaign not found');
  }

  return apiSuccess(campaign, 'Campaign retrieved successfully');
}

/**
 * PATCH /api/v1/campaigns/[id] - 更新营销活动
 */
async function updateCampaign(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const updated = await campaignsService.update(params.id, body);

  if (!updated) {
    return apiErrors.notFound('Campaign not found');
  }

  return apiSuccess(updated, 'Campaign updated successfully');
}

/**
 * DELETE /api/v1/campaigns/[id] - 删除营销活动
 */
async function deleteCampaign(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deleted = await campaignsService.delete(params.id);

  if (!deleted) {
    return apiErrors.notFound('Campaign not found');
  }

  return apiSuccess({ id: params.id }, 'Campaign deleted successfully');
}

export const GET = withDefaultMiddleware(getCampaignById);
export const PATCH = withDefaultMiddleware(updateCampaign);
export const DELETE = withDefaultMiddleware(deleteCampaign);
