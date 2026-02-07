/**
 * API v1 健康检查
 */

import { NextRequest } from 'next/server';
import { apiSuccess, withDefaultMiddleware } from '../lib/middleware';

async function handler(request: NextRequest) {
  return apiSuccess({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'v1',
  }, 'API is running');
}

export const GET = withDefaultMiddleware(handler);
export const HEAD = withDefaultMiddleware(handler);
