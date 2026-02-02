import { NextRequest, NextResponse } from 'next/server';
import { videoManager } from '@/storage/database';

// 设置为动态路由
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/videos/[id]
 * 删除视频及其所有相关统计数据
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('[API /api/videos/[id]] 收到删除视频请求:', params.id);

  try {
    const videoId = params.id;

    // 验证 ID 是否存在
    const video = await videoManager.getVideoById(videoId);
    if (!video) {
      return NextResponse.json(
        { error: '视频不存在' },
        { status: 404 }
      );
    }

    console.log('[API /api/videos/[id]] 找到视频:', video.title, 'video_id:', video.videoId);

    // 删除视频及其所有统计数据
    const result = await videoManager.deleteVideoWithStats(videoId);

    if (!result.success) {
      return NextResponse.json(
        { error: '删除视频失败' },
        { status: 500 }
      );
    }

    console.log('[API /api/videos/[id]] 删除成功，删除了', result.deletedStats, '条统计数据');

    return NextResponse.json({
      success: true,
      message: `视频 "${video.title}" 已删除`,
      deletedStats: result.deletedStats,
    });
  } catch (error) {
    console.error('[API /api/videos/[id]] 删除视频失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
