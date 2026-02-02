import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// 设置为动态路由
export const dynamic = 'force-dynamic';

// 数据库连接
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  console.log('[API /api/channels/[channelId]] 收到博主详情请求:', params.channelId);

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    const channelId = params.channelId;

    // 获取博主基本信息
    const channelResult = await client.unsafe(`
      SELECT 
        channel_id,
        channel_title,
        COUNT(*) as video_count,
        COALESCE(SUM(total_views), 0) as total_views,
        AVG(total_views) as avg_views
      FROM videos 
      WHERE channel_id = $1 AND is_active = true
      GROUP BY channel_id, channel_title
    `, [channelId]);

    if (!channelResult || channelResult.length === 0) {
      return NextResponse.json(
        { error: '博主不存在' },
        { status: 404 }
      );
    }

    const channelInfo = channelResult[0];

    // 获取该博主的所有视频及最新统计
    const videosResult = await client.unsafe(`
      SELECT 
        v.id,
        v.video_id,
        v.title,
        v.channel_id,
        v.channel_title,
        v.owner,
        v.publish_date,
        v.cooperation_cost,
        v.total_views,
        (
          SELECT json_build_object(
            'view_count', vs.view_count,
            'like_count', vs.like_count,
            'comment_count', vs.comment_count,
            'stat_date', vs.stat_date
          )
          FROM video_stats vs
          WHERE vs.video_id = v.video_id
          ORDER BY vs.stat_date DESC
          LIMIT 1
        ) as latest_stats
      FROM videos v
      WHERE v.channel_id = $1 AND v.is_active = true
      ORDER BY v.publish_date DESC
    `, [channelId]);

    const videos = videosResult.map((v: any) => ({
      ...v,
      latest_stats: v.latest_stats || null,
    }));

    // 计算核心指标
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalCost = 0;
    let validEngagementCount = 0;
    let totalEngagement = 0;

    videos.forEach((v: any) => {
      const stats = v.latest_stats;
      const views = stats?.view_count || 0;
      const likes = stats?.like_count || 0;
      const comments = stats?.comment_count || 0;
      const cost = parseFloat(String(v.cooperation_cost || 0));

      totalViews += views;
      totalLikes += likes;
      totalComments += comments;
      totalCost += cost;

      if (views > 0) {
        const engagement = ((likes + comments) / views) * 100;
        totalEngagement += engagement;
        validEngagementCount++;
      }
    });

    const avgViews = channelInfo.avg_views || 0;
    const avgEngagement = validEngagementCount > 0 ? totalEngagement / validEngagementCount : 0;
    const avgCPV = totalViews > 0 ? totalCost / totalViews : 0;

    // 获取播放量趋势数据（按日期）
    const trendResult = await client.unsafe(`
      SELECT 
        DATE(stat_date) as date,
        SUM(view_count) as views
      FROM video_stats
      WHERE video_id IN (
        SELECT id FROM videos WHERE channel_id = $1 AND is_active = true
      )
      AND stat_date >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(stat_date)
      ORDER BY date ASC
    `, [channelId]);

    const trendData = trendResult.map((t: any) => ({
      date: t.date.toISOString().split('T')[0],
      views: Number(t.views),
    }));

    // 获取互动率趋势数据
    const engagementTrendResult = await client.unsafe(`
      SELECT 
        DATE(stat_date) as date,
        SUM(view_count) as total_views,
        SUM(like_count) as total_likes,
        SUM(comment_count) as total_comments
      FROM video_stats
      WHERE video_id IN (
        SELECT id FROM videos WHERE channel_id = $1 AND is_active = true
      )
      AND stat_date >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(stat_date)
      ORDER BY date ASC
    `, [channelId]);

    const engagementTrendData = engagementTrendResult.map((t: any) => {
      const views = Number(t.total_views);
      const engagement = views > 0 
        ? ((Number(t.total_likes) + Number(t.total_comments)) / views) * 100 
        : 0;
      return {
        date: t.date.toISOString().split('T')[0],
        engagement: Number(engagement.toFixed(2)),
      };
    });

    // 获取发布时间热力图数据
    const heatmapResult = await client.unsafe(`
      SELECT 
        EXTRACT(DOW FROM publish_date) as day,
        EXTRACT(HOUR FROM publish_date) as hour,
        COUNT(*) as count
      FROM videos
      WHERE channel_id = $1 AND is_active = true AND publish_date IS NOT NULL
      GROUP BY EXTRACT(DOW FROM publish_date), EXTRACT(HOUR FROM publish_date)
      ORDER BY day, hour
    `, [channelId]);

    const heatmapData = heatmapResult.map((h: any) => ({
      day: Number(h.day),
      hour: Number(h.hour),
      value: Number(h.count),
    }));

    // 获取 TOP 10 视频（按播放量）
    const topVideos = videos
      .filter((v: any) => v.latest_stats?.view_count > 0)
      .sort((a: any, b: any) => (b.latest_stats?.view_count || 0) - (a.latest_stats?.view_count || 0))
      .slice(0, 10)
      .map((v: any) => ({
        id: v.id,
        videoId: v.video_id,
        title: v.title,
        views: v.latest_stats?.view_count || 0,
        likes: v.latest_stats?.like_count || 0,
        comments: v.latest_stats?.comment_count || 0,
        engagement: v.latest_stats?.view_count > 0 
          ? (((v.latest_stats?.like_count || 0) + (v.latest_stats?.comment_count || 0)) / v.latest_stats.view_count) * 100
          : 0,
        publishDate: v.publish_date,
        cost: parseFloat(String(v.cooperation_cost || 0)),
      }));

    const response = {
      channel: {
        id: channelInfo.channel_id,
        name: channelInfo.channel_title,
        videoCount: Number(channelInfo.video_count),
        totalViews: Number(channelInfo.total_views),
        avgViews: Number(avgViews),
        avgEngagement: Number(avgEngagement.toFixed(2)),
        totalCost: Number(totalCost),
        avgCPV: Number(avgCPV.toFixed(4)),
      },
      videos: videos,
      trends: {
        views: trendData,
        engagement: engagementTrendData,
      },
      heatmap: heatmapData,
      topVideos: topVideos,
    };

    console.log('[API /api/channels/[channelId]] 博主详情数据获取成功');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /api/channels/[channelId]] 获取博主详情失败:', error);
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
