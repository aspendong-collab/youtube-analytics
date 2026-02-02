import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export async function GET(request: NextRequest) {
  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 检查 videos 表中的数据
    const videosCount = await client.unsafe('SELECT COUNT(*) as count FROM videos');
    const activeVideosCount = await client.unsafe('SELECT COUNT(*) as count FROM videos WHERE is_active = true');
    const videosWithPublishDate = await client.unsafe('SELECT COUNT(*) as count FROM videos WHERE publish_date IS NOT NULL');
    const videosWithStats = await client.unsafe('SELECT COUNT(DISTINCT video_id) as count FROM video_stats');
    const statsCount = await client.unsafe('SELECT COUNT(*) as count FROM video_stats');

    // 获取几个视频样本
    const sampleVideos = await client.unsafe(`
      SELECT 
        id,
        video_id,
        title,
        channel_id,
        channel_title,
        publish_date,
        total_views,
        cooperation_cost,
        is_active,
        created_at
      FROM videos 
      LIMIT 3
    `);

    // 获取这些视频的统计记录
    const sampleStats = await client.unsafe(`
      SELECT 
        vs.id,
        vs.video_id,
        v.video_id as video_external_id,
        v.title as video_title,
        vs.stat_date,
        vs.view_count,
        vs.like_count,
        vs.comment_count,
        vs.created_at
      FROM video_stats vs
      LEFT JOIN videos v ON v.id = vs.video_id
      ORDER BY vs.stat_date DESC
      LIMIT 5
    `);

    // 检查每个频道的视频数量
    const channelVideos = await client.unsafe(`
      SELECT 
        channel_id,
        channel_title,
        COUNT(*) as video_count,
        COUNT(CASE WHEN publish_date IS NOT NULL THEN 1 END) as has_publish_date,
        SUM(total_views) as total_views
      FROM videos 
      WHERE is_active = true
      GROUP BY channel_id, channel_title
      ORDER BY video_count DESC
      LIMIT 5
    `);

    return NextResponse.json({
      summary: {
        totalVideos: Number(videosCount[0].count),
        activeVideos: Number(activeVideosCount[0].count),
        videosWithPublishDate: Number(videosWithPublishDate[0].count),
        videosWithStats: Number(videosWithStats[0].count),
        totalStatsRecords: Number(statsCount[0].count),
      },
      sampleVideos: sampleVideos.map((v: any) => ({
        id: v.id,
        videoId: v.video_id,
        title: v.title,
        channelId: v.channel_id,
        channelTitle: v.channel_title,
        publishDate: v.publish_date,
        totalViews: v.total_views,
        cost: v.cooperation_cost,
        isActive: v.is_active,
        createdAt: v.created_at,
      })),
      sampleStats: sampleStats.map((s: any) => ({
        id: s.id,
        videoId: s.video_id,
        videoExternalId: s.video_external_id,
        videoTitle: s.video_title,
        statDate: s.stat_date,
        viewCount: s.view_count,
        likeCount: s.like_count,
        commentCount: s.comment_count,
        createdAt: s.created_at,
      })),
      channelStats: channelVideos.map((c: any) => ({
        channelId: c.channel_id,
        channelTitle: c.channel_title,
        videoCount: Number(c.video_count),
        hasPublishDate: Number(c.has_publish_date),
        totalViews: Number(c.total_views),
      })),
    });

  } catch (error) {
    console.error('[API /api/debug/data] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch debug data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
