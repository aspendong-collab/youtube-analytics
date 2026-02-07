/**
 * API v1 - 分析 - 活动统计路由
 */

// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { campaigns, campaignParticipations } from '@/storage/database/shared/schema';
import { apiSuccess, withDefaultMiddleware } from '../../lib/middleware';

async function handler(request: NextRequest) {
  try {
    const stats = await db
      .select({
        campaignId: campaigns.id,
        campaignName: campaigns.name,
        invitedCount: campaigns.invitedInfluencerCount,
        acceptedCount: campaigns.acceptedInfluencerCount,
        completedCount: campaigns.completedInfluencerCount,
        pendingCount: db.raw(`(${campaigns.invitedInfluencerCount} - ${campaigns.acceptedInfluencerCount} - ${campaigns.completedInfluencerCount})`),
        responseRate: db.raw(`CASE 
          WHEN ${campaigns.invitedInfluencerCount} > 0 
          THEN ROUND((${campaigns.acceptedInfluencerCount}::numeric / ${campaigns.invitedInfluencerCount}) * 100, 2)
          ELSE 0 
        END`),
        completionRate: db.raw(`CASE 
          WHEN ${campaigns.acceptedInfluencerCount} > 0 
          THEN ROUND((${campaigns.completedInfluencerCount}::numeric / ${campaigns.acceptedInfluencerCount}) * 100, 2)
          ELSE 0 
        END`),
      })
      .from(campaigns)
      .orderBy(campaigns.createdAt);

    return apiSuccess(stats, 'Campaign stats retrieved successfully');
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    return apiSuccess([], 'Error fetching campaign stats');
  }
}

export const GET = withDefaultMiddleware(handler);
