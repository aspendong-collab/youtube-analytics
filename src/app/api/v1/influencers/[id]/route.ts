/**
 * API v1 - 达人详情路由
 */

// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { influencersService } from '@/services/influencers';
import { apiSuccess, apiErrors, withDefaultMiddleware } from '../../lib/middleware';

/**
 * GET /api/v1/influencers/[id] - 获取达人详情
 */
async function getInfluencerById(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const influencer = await influencersService.getById(params.id);

  if (!influencer) {
    return apiErrors.notFound('Influencer not found');
  }

  return apiSuccess(influencer, 'Influencer retrieved successfully');
}

/**
 * PATCH /api/v1/influencers/[id] - 更新达人
 */
async function updateInfluencer(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const updated = await influencersService.updateCooperationStatus(
    params.id,
    body.status
  );

  if (!updated) {
    return apiErrors.notFound('Influencer not found');
  }

  return apiSuccess(updated, 'Influencer updated successfully');
}

/**
 * DELETE /api/v1/influencers/[id] - 删除达人
 */
async function deleteInfluencer(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const deleted = await influencersService.delete(params.id);

  if (!deleted) {
    return apiErrors.notFound('Influencer not found');
  }

  return apiSuccess({ id: params.id }, 'Influencer deleted successfully');
}

/**
 * POST /api/v1/influencers/[id]/recalculate-score - 重新计算评分
 */
async function recalculateScore(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const updated = await influencersService.recalculateScore(params.id);

  if (!updated) {
    return apiErrors.notFound('Influencer not found');
  }

  return apiSuccess(updated, 'Score recalculated successfully');
}

export const GET = withDefaultMiddleware(getInfluencerById);
export const PATCH = withDefaultMiddleware(updateInfluencer);
export const DELETE = withDefaultMiddleware(deleteInfluencer);
