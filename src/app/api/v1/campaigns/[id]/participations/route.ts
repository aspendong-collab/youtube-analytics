/**
 * API v1 - 营销活动参与路由
 */

// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { campaignsService } from '@/services/campaigns';
import { apiSuccess, apiErrors, withDefaultMiddleware } from '../../../lib/middleware';

/**
 * GET /api/v1/campaigns/[id]/participations - 获取活动的参与列表
 */
async function getParticipations(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') as any;

  const participations = await campaignsService.getParticipations(params.id, status);

  return apiSuccess(participations, 'Participations retrieved successfully');
}

/**
 * POST /api/v1/campaigns/[id]/participations - 邀请达人参与活动
 */
async function inviteInfluencer(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const participation = await campaignsService.inviteInfluencer(
    params.id,
    body.influencerId,
    body.userId,
    body.compensation
  );

  return apiSuccess(participation, 'Invitation sent successfully', 201);
}

/**
 * POST /api/v1/campaigns/[id]/batch-invite - 批量邀请达人
 */
async function batchInvite(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const result = await campaignsService.batchInviteInfluencers(
    params.id,
    body.influencerIds,
    body.userId,
    body.compensation
  );

  return apiSuccess(result, `${result.success} invitations sent successfully`);
}

/**
 * GET /api/v1/campaigns/[id]/stats - 获取活动统计
 */
async function getCampaignStats(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const stats = await campaignsService.getCampaignStats(params.id);

  return apiSuccess(stats, 'Stats retrieved successfully');
}

export const GET = withDefaultMiddleware(getParticipations);
export const POST = withDefaultMiddleware(inviteInfluencer);
