/**
 * API v1 - 达人评分路由
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiErrors, withDefaultMiddleware } from '../../../lib/middleware';

// 这个功能已在 [id]/route.ts 中实现，这里作为独立路由的示例
// 实际使用中可以合并到 [id]/route.ts 中

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 从主路由导入并调用
  const { influencersService } = await import('@/services/influencers');
  
  const updated = await influencersService.recalculateScore(params.id);

  if (!updated) {
    return apiErrors.notFound('Influencer not found');
  }

  return apiSuccess(updated, 'Score recalculated successfully');
}

export const POST = withDefaultMiddleware(handler);
