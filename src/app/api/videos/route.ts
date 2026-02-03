import { NextRequest, NextResponse } from 'next/server';
import { videoManager } from '@/storage/database';
import type { InsertVideo } from '@/storage/database';

// 设置为动态路由，避免构建时预加载
export const dynamic = 'force-dynamic';

/**
 * POST /api/videos
 * 添加新视频，自动获取视频信息和统计数据
 */
export async function POST(request: NextRequest) {
  console.log('[API /api/videos] 收到添加视频请求');
  try {
    const body = await request.json();
    const { videoUrl, owner, tags, category } = body;

    console.log('[API /api/videos] 请求参数:', { videoUrl, owner, tags, category });

    if (!videoUrl) {
      return NextResponse.json(
        { error: '视频 URL 不能为空' },
        { status: 400 }
      );
    }

    // 从 URL 中提取视频 ID
    let videoId = '';
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match && match[1]) {
        videoId = match[1];
        break;
      }
    }

    if (!videoId) {
      return NextResponse.json(
        { error: '无法从 URL 中提取视频 ID' },
        { status: 400 }
      );
    }

    // 检查视频是否已存在
    console.log('[API /api/videos] 检查视频是否已存在, videoId:', videoId);
    // 检查视频是否已存在（只检查活跃视频）
    const existingVideo = await videoManager.getVideoByVideoId(videoId);
    if (existingVideo && existingVideo.isActive !== false) {
      console.log('[API /api/videos] 视频已存在:', existingVideo);
      return NextResponse.json(
        {
          error: '视频已存在',
          video: existingVideo,
        },
        { status: 409 }
      );
    } else if (existingVideo && existingVideo.isActive === false) {
      // 如果视频已被软删除，先硬删除它
      console.log('[API /api/videos] 检测到已软删除的视频，正在清理...');
      await videoManager.deleteVideoWithStats(existingVideo.id);
    }

    // 获取 YouTube API Key
    const apiKey = process.env.YOUTUBE_API_KEY;
    console.log('[API /api/videos] 检查 API Key:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      envKeys: Object.keys(process.env).filter(k => k.includes('YOUTUBE')),
    });

    if (!apiKey) {
      console.error('[API /api/videos] 未配置 YouTube API Key，使用用户输入数据');
      // 不返回错误，继续使用用户输入的数据
    }

    // 创建视频记录（优先使用 API 数据，否则使用用户输入的数据）
    console.log('[API /api/videos] 准备创建视频记录');
    const insertData: InsertVideo = {
      videoId,
      title: body.videoTitle || '未命名视频',
      description: body.description || '',
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      owner,
      publishDate: body.publishDate ? new Date(body.publishDate) : undefined,
      publishStatus: body.publishStatus || 'published',
      cooperationCost: body.cooperationCost ? String(body.cooperationCost) : undefined,
    };

    if (apiKey) {
      // 如果有 API Key，尝试获取视频信息（使用新的video-info API）
      try {
        console.log('[API /api/videos] 调用 video-info API 获取详细信息...');
        const videoInfoResponse = await fetch(
          `http://localhost:5000/api/video-info?url=${encodeURIComponent(videoUrl)}`,
          {
            method: 'GET',
          }
        );

        if (videoInfoResponse.ok) {
          const videoInfo = await videoInfoResponse.json();
          console.log('[API /api/videos] video-info API 响应:', {
            title: videoInfo.title,
            duration: videoInfo.duration,
            region: videoInfo.region,
            language: videoInfo.language,
          });

          insertData.title = videoInfo.title;
          insertData.description = videoInfo.description;
          insertData.channelId = videoInfo.channelId;
          insertData.channelTitle = videoInfo.channelTitle;
          insertData.thumbnail = videoInfo.thumbnails?.maxres?.url ||
                                 videoInfo.thumbnails?.high?.url ||
                                 videoInfo.thumbnails?.medium?.url ||
                                 videoInfo.thumbnails?.default?.url ||
                                 `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          insertData.tags = tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : videoInfo.tags;
          insertData.categoryId = category || videoInfo.categoryId;

          // 新增字段
          insertData.duration = videoInfo.duration;
          insertData.region = videoInfo.region;
          insertData.language = videoInfo.language;

          // 从 YouTube API 获取发布时间
          if (videoInfo.publishedAt && !insertData.publishDate) {
            insertData.publishDate = new Date(videoInfo.publishedAt);
          }
        }
      } catch (apiError) {
        console.error('[API /api/videos] 获取视频信息失败，使用用户输入:', apiError);
        // 继续使用用户输入的数据
      }
    } else {
      console.log('[API /api/videos] 未配置 API Key，使用用户输入的数据');
    }

    // 处理 tags
    if (tags && !insertData.tags) {
      insertData.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim());
    }

    // 处理 category
    if (category && !insertData.categoryId) {
      insertData.categoryId = category;
    }

    console.log('[API /api/videos] 调用 videoManager.createVideo');
    const video = await videoManager.createVideo(insertData);
    console.log('[API /api/videos] 视频创建成功:', video.id);

    // 获取视频统计数据（如果有 API Key）
    if (apiKey) {
      try {
        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.items && statsData.items.length > 0) {
            const statistics = statsData.items[0].statistics;

            await videoManager.createVideoStats({
              videoId,
              statDate: new Date(),
              viewCount: parseInt(statistics.viewCount) || 0,
              likeCount: parseInt(statistics.likeCount) || 0,
              commentCount: parseInt(statistics.commentCount) || 0,
            });
          }
        }
      } catch (statsError) {
        console.error('获取视频统计失败:', statsError);
        // 统计数据获取失败不影响视频添加
      }
    } else {
      // 如果没有 API Key，创建初始统计数据为 0
      try {
        await videoManager.createVideoStats({
          videoId,
          statDate: new Date(),
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
        });
      } catch (statsError) {
        console.error('创建初始统计数据失败:', statsError);
      }
    }

    return NextResponse.json({
      success: true,
      video,
      message: '视频添加成功',
    });
  } catch (error) {
    console.error('添加视频失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/videos
 * 获取视频列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const isActive = searchParams.get('isActive') === 'true' ? true :
                     searchParams.get('isActive') === 'false' ? false :
                     undefined;

    // 获取视频列表
    const videos = await videoManager.getVideos({
      limit,
      skip,
      isActive,
    });

    // 批量获取所有视频的最新统计数据（避免 N+1 查询）
    const videoIds = videos.map(v => v.videoId);
    const allLatestStats = await videoManager.getLatestStatsForVideos(videoIds);

    // 组合数据
    const videosWithStats = videos.map(video => ({
      ...video,
      latestStats: allLatestStats[video.videoId] || null,
    }));

    return NextResponse.json({
      videos: videosWithStats,
      total: videosWithStats.length,
    });
  } catch (error) {
    console.error('获取视频列表失败:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
