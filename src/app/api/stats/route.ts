import { NextRequest, NextResponse } from 'next/server';
import { and, gte, lte, eq, sql, desc } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { videos, videoStats, owners } from '@/storage/database';
import * as schema from '@/storage/database';

// 设置为动态路由，避免构建时预加载
export const dynamic = 'force-dynamic';

// 硬编码的 Neon 数据库连接
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

let dbClient: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    try {
      const maskedUrl = NEON_DATABASE_URL.replace(/\/\/[^@]+@/, '/***@');
      console.log('[Stats API] Connecting to database:', maskedUrl);

      dbClient = postgres(NEON_DATABASE_URL, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });

      dbInstance = drizzle(dbClient, { schema });
      console.log('[Stats API] Database connection established');
    } catch (error) {
      console.error('[Stats API] Failed to connect to database:', error);
      return null;
    }
  }
  return dbInstance;
}

export async function GET(request: NextRequest) {
  console.log('[API /api/stats] 收到统计请求');

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!client) {
      throw new Error('Database client not available');
    }

    // 计算时间范围
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
    }
    if (endDateStr) {
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
    }

    const days = startDate && endDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0;

    // 使用原生 SQL 查询
    const [totalVideosResult] = await client.unsafe(`SELECT COUNT(*) as count FROM videos`);
    const totalVideos = Number(totalVideosResult.count) || 0;

    const [totalViewsResult] = await client.unsafe(`SELECT COALESCE(SUM(view_count), 0) as sum FROM video_stats`);
    const totalHistoricalViews = Number(totalViewsResult.sum) || 0;

    const [totalPublishedResult] = await client.unsafe(`SELECT COUNT(*) as count FROM videos WHERE publish_status = 'published' AND is_active = true`);
    const totalPublishedVideos = Number(totalPublishedResult.count) || 0;

    const [totalCostResult] = await client.unsafe(`SELECT COALESCE(SUM(CAST(cooperation_cost AS NUMERIC)), 0) as sum FROM videos WHERE is_active = true`);
    const totalCooperationCost = Number(totalCostResult.sum) || 0;

    const overallAverageCPV = totalHistoricalViews > 0
      ? totalCooperationCost / (totalHistoricalViews / 1000)
      : 0;

    const [totalChannelsResult] = await client.unsafe(`SELECT COUNT(DISTINCT channel_id) as count FROM videos WHERE is_active = true AND channel_id IS NOT NULL`);
    const totalChannels = Number(totalChannelsResult.count) || 0;

    const [totalOwnersResult] = await client.unsafe(`SELECT COUNT(DISTINCT owner) as count FROM videos WHERE is_active = true AND owner IS NOT NULL`);
    const totalOwners = Number(totalOwnersResult.count) || 0;

    // 期间指标（如果有时间范围）
    let periodPublishedVideos = 0;
    let periodCooperationCost = 0;
    let periodNewViews = 0;
    let periodTotalViews = 0;
    let periodAverageCPV = 0;

    if (startDate && endDate) {
      // 期间发布视频数
      const [periodPublishedResult] = await client.unsafe(
        `SELECT COUNT(*) as count FROM videos WHERE publish_status = 'published' AND is_active = true AND publish_date >= $1 AND publish_date <= $2`,
        [startDate, endDate]
      );
      periodPublishedVideos = Number(periodPublishedResult.count) || 0;

      // 期间合作费用
      const [periodCostResult] = await client.unsafe(
        `SELECT COALESCE(SUM(CAST(cooperation_cost AS NUMERIC)), 0) as sum FROM videos WHERE is_active = true AND publish_date >= $1 AND publish_date <= $2`,
        [startDate, endDate]
      );
      periodCooperationCost = Number(periodCostResult.sum) || 0;

      // 期间播放量（从 video_stats 计算）
      const [periodViewsResult] = await client.unsafe(
        `SELECT COALESCE(SUM(view_count), 0) as sum FROM video_stats WHERE stat_date >= $1 AND stat_date <= $2`,
        [startDate, endDate]
      );
      periodTotalViews = Number(periodViewsResult.sum) || 0;

      // 计算期间平均 CPV（$/千次播放）
      periodAverageCPV = periodTotalViews > 0
        ? periodCooperationCost / (periodTotalViews / 1000)
        : 0;
    }

    await client.end();

    const response = {
      timeRange: {
        startDate: startDateStr || '',
        endDate: endDateStr || '',
        days,
      },

      // 播放量指标（基于时间范围）
      periodNewViews,
      periodTotalViews,

      // 成本指标（基于时间范围）
      periodCooperationCost,
      periodAverageCPV,

      // 发布量指标（基于时间范围）
      periodPublishedVideos,

      // 全局累计指标（不受时间范围限制）
      totalHistoricalViews,
      totalPublishedVideos,
      totalCooperationCost,
      overallAverageCPV,

      // 原有指标
      totalVideos,
      totalChannels,
      totalOwners,
    };

    console.log('[API /api/stats] 统计数据计算完成');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /api/stats] 获取统计数据失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
