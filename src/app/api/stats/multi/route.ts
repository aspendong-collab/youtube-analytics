import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// 设置为动态路由，避免构建时预加载
export const dynamic = 'force-dynamic';

// 从环境变量获取数据库连接字符串
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const DATABASE_URL = process.env.PGDATABASE_URL || NEON_DATABASE_URL;

export async function GET(request: NextRequest) {
  console.log('[API /api/stats/multi] 收到统计请求');

  const client = postgres(DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 计算时间范围
    const now = new Date();
    
    // 今日
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 本周（周一到今天）
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    weekStart.setHours(0, 0, 0, 0);

    // 获取今日指标
    const [todayViewsResult] = await client.unsafe(
      `SELECT COALESCE(SUM(view_count), 0) as sum FROM video_stats WHERE stat_date >= $1 AND stat_date <= $2`,
      [todayStart, todayEnd]
    );
    const todayViews = Number(todayViewsResult.sum) || 0;

    const [todayPublishedResult] = await client.unsafe(
      `SELECT COUNT(*) as count FROM videos WHERE publish_status = 'published' AND is_active = true AND publish_date >= $1 AND publish_date <= $2`,
      [todayStart, todayEnd]
    );
    const todayPublishedVideos = Number(todayPublishedResult.count) || 0;

    const [todayCostResult] = await client.unsafe(
      `SELECT COALESCE(SUM(CAST(cooperation_cost AS NUMERIC)), 0) as sum FROM videos WHERE is_active = true AND publish_date >= $1 AND publish_date <= $2`,
      [todayStart, todayEnd]
    );
    const todayCost = Number(todayCostResult.sum) || 0;

    const todayCPV = todayViews > 0 ? (todayCost / (todayViews / 1000)) : 0;

    // 获取本周指标
    const [weekViewsResult] = await client.unsafe(
      `SELECT COALESCE(SUM(view_count), 0) as sum FROM video_stats WHERE stat_date >= $1`,
      [weekStart]
    );
    const weekViews = Number(weekViewsResult.sum) || 0;

    const [weekPublishedResult] = await client.unsafe(
      `SELECT COUNT(*) as count FROM videos WHERE publish_status = 'published' AND is_active = true AND publish_date >= $1`,
      [weekStart]
    );
    const weekPublishedVideos = Number(weekPublishedResult.count) || 0;

    const [weekCostResult] = await client.unsafe(
      `SELECT COALESCE(SUM(CAST(cooperation_cost AS NUMERIC)), 0) as sum FROM videos WHERE is_active = true AND publish_date >= $1`,
      [weekStart]
    );
    const weekCost = Number(weekCostResult.sum) || 0;

    const weekCPV = weekViews > 0 ? (weekCost / (weekViews / 1000)) : 0;

    // 获取累计指标
    const [totalViewsResult] = await client.unsafe(
      `SELECT COALESCE(SUM(view_count), 0) as sum FROM video_stats`
    );
    const totalViews = Number(totalViewsResult.sum) || 0;

    const [totalPublishedResult] = await client.unsafe(
      `SELECT COUNT(*) as count FROM videos WHERE publish_status = 'published' AND is_active = true`
    );
    const totalPublishedVideos = Number(totalPublishedResult.count) || 0;

    const [totalCostResult] = await client.unsafe(
      `SELECT COALESCE(SUM(CAST(cooperation_cost AS NUMERIC)), 0) as sum FROM videos WHERE is_active = true`
    );
    const totalCost = Number(totalCostResult.sum) || 0;

    const totalCPV = totalViews > 0 ? (totalCost / (totalViews / 1000)) : 0;

    // 获取其他指标
    const [totalVideosResult] = await client.unsafe(`SELECT COUNT(*) as count FROM videos`);
    const totalVideos = Number(totalVideosResult.count) || 0;

    const [totalChannelsResult] = await client.unsafe(
      `SELECT COUNT(DISTINCT channel_id) as count FROM videos WHERE is_active = true AND channel_id IS NOT NULL`
    );
    const totalChannels = Number(totalChannelsResult.count) || 0;

    const [totalOwnersResult] = await client.unsafe(
      `SELECT COUNT(DISTINCT owner) as count FROM videos WHERE is_active = true AND owner IS NOT NULL`
    );
    const totalOwners = Number(totalOwnersResult.count) || 0;

    const response = {
      today: {
        views: todayViews,
        publishedVideos: todayPublishedVideos,
        cooperationCost: todayCost,
        averageCPV: todayCPV,
      },
      thisWeek: {
        views: weekViews,
        publishedVideos: weekPublishedVideos,
        cooperationCost: weekCost,
        averageCPV: weekCPV,
      },
      total: {
        views: totalViews,
        publishedVideos: totalPublishedVideos,
        cooperationCost: totalCost,
        averageCPV: totalCPV,
      },
      other: {
        totalVideos,
        totalChannels,
        totalOwners,
      },
    };

    console.log('[API /api/stats/multi] 统计数据计算完成');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /api/stats/multi] 获取统计数据失败:', error);
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
