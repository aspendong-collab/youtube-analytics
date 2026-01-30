import { NextRequest, NextResponse } from 'next/server';
import { videoManager } from '@/storage/database';

// 设置为动态路由，避免构建时预加载
export const dynamic = 'force-dynamic';

/**
 * Cron Job: 更新所有活跃视频的统计数据
 * 计划每天早上 9:00 执行
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Cron Job 请求（Vercel Cron Jobs 会发送特定的 header）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // 如果配置了 CRON_SECRET，则进行验证
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '平台未配置 YouTube API Key' },
        { status: 500 }
      );
    }

    // 获取所有活跃视频
    const videos = await videoManager.getActiveVideosForUpdate();

    if (videos.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要更新的视频',
        updated: 0,
      });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors: Array<{ videoId: string; error: string }> = [];

    // 批量获取视频统计数据
    const videoIds = videos.map((v) => v.videoId).join(',');

    try {
      const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
      );

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({}));
        throw new Error(errorData.error?.message || '获取统计数据失败');
      }

      const statsData = await statsResponse.json();

      if (!statsData.items || statsData.items.length === 0) {
        throw new Error('没有返回统计数据');
      }

      // 保存每个视频的统计数据
      for (const item of statsData.items) {
        try {
          const statistics = item.statistics;

          await videoManager.createVideoStats({
            videoId: item.id,
            statDate: new Date(),
            viewCount: parseInt(statistics.viewCount) || 0,
            likeCount: parseInt(statistics.likeCount) || 0,
            commentCount: parseInt(statistics.commentCount) || 0,
          });

          successCount++;
        } catch (error) {
          failedCount++;
          errors.push({
            videoId: item.id,
            error: error instanceof Error ? error.message : '保存统计失败',
          });
        }
      }
    } catch (error) {
      // 如果批量失败，尝试逐个更新
      console.error('批量更新失败，尝试逐个更新:', error);

      for (const video of videos) {
        try {
          const statsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${video.videoId}&key=${apiKey}`
          );

          if (!statsResponse.ok) {
            throw new Error('获取统计数据失败');
          }

          const statsData = await statsResponse.json();

          if (!statsData.items || statsData.items.length === 0) {
            failedCount++;
            errors.push({
              videoId: video.videoId,
              error: '没有返回统计数据',
            });
            continue;
          }

          const statistics = statsData.items[0].statistics;

          await videoManager.createVideoStats({
            videoId: video.videoId,
            statDate: new Date(),
            viewCount: parseInt(statistics.viewCount) || 0,
            likeCount: parseInt(statistics.likeCount) || 0,
            commentCount: parseInt(statistics.commentCount) || 0,
          });

          successCount++;
        } catch (error) {
          failedCount++;
          errors.push({
            videoId: video.videoId,
            error: error instanceof Error ? error.message : '未知错误',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `更新完成: 成功 ${successCount} 个, 失败 ${failedCount} 个`,
      updated: successCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('定时任务执行失败:', error);
    return NextResponse.json(
      {
        error: '定时任务执行失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 手动触发更新（用于测试）
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
