// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { campaignsService } from '@/services/campaigns';

// GET /api/v1/campaigns/[id]/participations - 获取活动的参与列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const status = url.searchParams.get('status');

    const result = await campaignsService.getParticipations(params.id, {
      page,
      pageSize,
      status: status as any,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Campaigns/[id]/participations] GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch participations',
    }, { status: 500 });
  }
}

// POST /api/v1/campaigns/[id]/participations - 邀请达人参与
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { influencerId, invitationMessage } = body;

    const participation = await campaignsService.inviteInfluencer(params.id, {
      influencerId,
      invitationMessage,
    });

    return NextResponse.json({
      success: true,
      data: participation,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Campaigns/[id]/participations] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to invite influencer',
    }, { status: 500 });
  }
}
