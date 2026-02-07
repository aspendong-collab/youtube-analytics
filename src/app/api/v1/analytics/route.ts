/**
 * API v1 - 分析路由
 */

import { NextRequest } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { influencers, campaigns, campaignParticipations } from '@/storage/database/shared/schema';
import { apiSuccess, withDefaultMiddleware } from '../lib/middleware';

/**
 * GET /api/v1/analytics - 获取系统概览统计
 */
async function getOverview(request: NextRequest) {
  try {
    // 获取总统计
    const [influencerCount, campaignCount, participationCount] = await Promise.all([
      db.select({ count: db.raw(`COUNT(*)::int`) }).from(influencers),
      db.select({ count: db.raw(`COUNT(*)::int`) }).from(campaigns),
      db.select({ count: db.raw(`COUNT(*)::int`) }).from(campaignParticipations),
    ]);

    // 获取活跃活动数
    const activeCampaigns = await db
      .select({ count: db.raw(`COUNT(*)::int`) })
      .from(campaigns)
      .where(db.raw(`status = 'active'`));

    // 计算平均响应率
    const invitedCount = parseInt(influencerCount[0]?.count || '0');
    const acceptedCount = parseInt(participationCount[0]?.count || '0');
    const averageResponseRate = invitedCount > 0 ? acceptedCount / invitedCount : 0;

    const overview = {
      totalInfluencers: parseInt(influencerCount[0]?.count || '0'),
      totalCampaigns: parseInt(campaignCount[0]?.count || '0'),
      activeCampaigns: parseInt(activeCampaigns[0]?.count || '0'),
      totalInvitations: invitedCount,
      totalParticipations: acceptedCount,
      averageResponseRate: averageResponseRate,
    };

    return apiSuccess(overview, 'Overview retrieved successfully');
  } catch (error) {
    console.error('Error fetching overview:', error);
    return apiSuccess({
      totalInfluencers: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalInvitations: 0,
      totalParticipations: 0,
      averageResponseRate: 0,
    }, 'Error fetching overview');
  }
}

export const GET = withDefaultMiddleware(getOverview);
