import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// 设置为动态路由
export const dynamic = 'force-dynamic';

// 数据库连接
const NEON_DATABASE_URL = 'postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export async function GET(request: NextRequest) {
  console.log('[API /api/suggestions/competition] 收到竞争分析请求');

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  const client = postgres(NEON_DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // 获取目标视频信息
    const targetVideoResult = await client.unsafe(`
      SELECT 
        v.id,
        v.video_id,
        v.title,
        v.category_id,
        v.channel_id,
        v.channel_title,
        v.cooperation_cost,
        (
          SELECT json_build_object(
            'view_count', vs.view_count,
            'like_count', vs.like_count,
            'comment_count', vs.comment_count,
            'stat_date', vs.stat_date
          )
          FROM video_stats vs
          WHERE vs.video_id = v.id
          ORDER BY vs.stat_date DESC
          LIMIT 1
        ) as latest_stats
      FROM videos v
      WHERE v.id = $1 OR v.video_id = $2
      LIMIT 1
    `, [videoId, videoId]);

    if (!targetVideoResult || targetVideoResult.length === 0) {
      return NextResponse.json(
        { error: '视频不存在' },
        { status: 404 }
      );
    }

    const targetVideo = targetVideoResult[0];
    const categoryId = targetVideo.category_id;
    const channelId = targetVideo.channel_id;

    // 获取同类分类视频
    const categoryVideosResult = await client.unsafe(`
      SELECT 
        v.id,
        v.video_id,
        v.title,
        v.channel_title,
        v.cooperation_cost,
        (
          SELECT json_build_object(
            'view_count', vs.view_count,
            'like_count', vs.like_count,
            'comment_count', vs.comment_count
          )
          FROM video_stats vs
          WHERE vs.video_id = v.id
          ORDER BY vs.stat_date DESC
          LIMIT 1
        ) as latest_stats
      FROM videos v
      WHERE v.category_id = $1 AND v.is_active = true AND v.id != $2
      ORDER BY 
        (
          SELECT view_count 
          FROM video_stats vs 
          WHERE vs.video_id = v.id 
          ORDER BY stat_date DESC 
          LIMIT 1
        ) DESC
      LIMIT 20
    `, [categoryId, targetVideo.id]);

    // 获取同一博主的其他视频
    const channelVideosResult = await client.unsafe(`
      SELECT 
        v.id,
        v.video_id,
        v.title,
        v.cooperation_cost,
        (
          SELECT json_build_object(
            'view_count', vs.view_count,
            'like_count', vs.like_count,
            'comment_count', vs.comment_count
          )
          FROM video_stats vs
          WHERE vs.video_id = v.id
          ORDER BY vs.stat_date DESC
          LIMIT 1
        ) as latest_stats
      FROM videos v
      WHERE v.channel_id = $1 AND v.is_active = true AND v.id != $2
      ORDER BY 
        (
          SELECT view_count 
          FROM video_stats vs 
          WHERE vs.video_id = v.id 
          ORDER BY stat_date DESC 
          LIMIT 1
        ) DESC
      LIMIT 10
    `, [channelId, targetVideo.id]);

    // 计算目标视频指标
    const targetViews = Number(targetVideo.latest_stats?.view_count || 0);
    const targetLikes = Number(targetVideo.latest_stats?.like_count || 0);
    const targetComments = Number(targetVideo.latest_stats?.comment_count || 0);
    const targetEngagement = targetViews > 0 ? ((targetLikes + targetComments) / targetViews) * 100 : 0;

    // 计算同类视频平均值
    const categoryVideos = categoryVideosResult.map((v: any) => ({
      ...v,
      latest_stats: v.latest_stats || null,
    }));

    const categoryAvgViews = categoryVideos.reduce((sum, v) => {
      return sum + (v.latest_stats?.view_count || 0);
    }, 0) / Math.max(categoryVideos.length, 1);

    const categoryAvgEngagement = categoryVideos.reduce((sum, v) => {
      const views = v.latest_stats?.view_count || 0;
      const likes = v.latest_stats?.like_count || 0;
      const comments = v.latest_stats?.comment_count || 0;
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
      return sum + engagement;
    }, 0) / Math.max(categoryVideos.length, 1);

    // 计算博主视频平均值
    const channelVideos = channelVideosResult.map((v: any) => ({
      ...v,
      latest_stats: v.latest_stats || null,
    }));

    const channelAvgViews = channelVideos.reduce((sum, v) => {
      return sum + (v.latest_stats?.view_count || 0);
    }, 0) / Math.max(channelVideos.length, 1);

    const channelAvgEngagement = channelVideos.reduce((sum, v) => {
      const views = v.latest_stats?.view_count || 0;
      const likes = v.latest_stats?.like_count || 0;
      const comments = v.latest_stats?.comment_count || 0;
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
      return sum + engagement;
    }, 0) / Math.max(channelVideos.length, 1);

    // 生成竞争分析建议
    const suggestions = [];

    // 播放量对比
    if (targetViews > categoryAvgViews * 1.5) {
      suggestions.push('您的视频播放量明显高于同类视频平均水平，表现优秀！继续保持');
    } else if (targetViews < categoryAvgViews * 0.5) {
      suggestions.push('您的视频播放量低于同类视频平均水平的50%，建议优化标题和封面以提高点击率');
    }

    // 互动率对比
    if (targetEngagement > categoryAvgEngagement * 1.3) {
      suggestions.push('您的视频互动率显著高于同类视频，内容质量优秀');
    } else if (targetEngagement < categoryAvgEngagement * 0.7) {
      suggestions.push('您的视频互动率低于同类视频，建议增加互动引导，优化内容质量');
    }

    // 与博主历史对比
    if (targetViews > channelAvgViews * 1.2) {
      suggestions.push('该视频表现优于您的历史平均水平，建议总结成功经验并应用到后续视频中');
    } else if (targetViews < channelAvgViews * 0.8) {
      suggestions.push('该视频表现低于您的历史平均水平，建议分析原因（发布时间、主题等）');
    }

    // TOP 竞品视频
    const topCompetitors = categoryVideos
      .filter((v: any) => v.latest_stats?.view_count > 0)
      .slice(0, 5)
      .map((v: any) => ({
        videoId: v.video_id,
        title: v.title,
        channelTitle: v.channel_title,
        views: v.latest_stats?.view_count || 0,
        engagement: v.latest_stats?.view_count > 0
          ? (((v.latest_stats?.like_count || 0) + (v.latest_stats?.comment_count || 0)) / v.latest_stats.view_count) * 100
          : 0,
        cost: v.cooperation_cost || 0,
        cpv: v.cooperation_cost > 0 && v.latest_stats?.view_count > 0
          ? v.cooperation_cost / v.latest_stats.view_count
          : 0,
      }));

    const response = {
      targetVideo: {
        id: targetVideo.video_id,
        title: targetVideo.title,
        views: targetViews,
        engagement: targetEngagement,
        cost: targetVideo.cooperation_cost || 0,
      },
      categoryBenchmark: {
        avgViews: categoryAvgViews,
        avgEngagement: categoryAvgEngagement,
        sampleSize: categoryVideos.length,
        yourRanking: categoryVideos
          .filter((v: any) => v.latest_stats?.view_count > targetViews)
          .length + 1,
      },
      channelBenchmark: {
        avgViews: channelAvgViews,
        avgEngagement: channelAvgEngagement,
        sampleSize: channelVideos.length,
      },
      comparison: {
        viewsAboveCategoryAvg: ((targetViews - categoryAvgViews) / categoryAvgViews * 100).toFixed(1) + '%',
        engagementAboveCategoryAvg: ((targetEngagement - categoryAvgEngagement) / categoryAvgEngagement * 100).toFixed(1) + '%',
        viewsAboveChannelAvg: ((targetViews - channelAvgViews) / channelAvgViews * 100).toFixed(1) + '%',
      },
      suggestions,
      topCompetitors,
    };

    console.log('[API /api/suggestions/competition] 竞争分析完成');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /api/suggestions/competition] 错误:', error);
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
