import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoUrl = searchParams.get('url');

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

  // 获取 YouTube API Key
  // 优先从 Cookie 中读取配置，如果没有则使用环境变量
  let apiKey = process.env.YOUTUBE_API_KEY;

  try {
    const cookieStore = await cookies();
    const settings = cookieStore.get('app_settings');
    if (settings) {
      const settingsData = JSON.parse(settings.value);
      if (settingsData.apiKeys?.youtubeApiKey) {
        apiKey = settingsData.apiKeys.youtubeApiKey;
      }
    }
  } catch (error) {
    console.error('从 Cookie 读取配置失败:', error);
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        error: '未配置 YouTube API Key',
        hint: '请在"设置管理 > 数据采集"中配置 YouTube API Key，或在环境变量中设置 YOUTUBE_API_KEY',
      },
      { status: 500 }
    );
  }

  try {
    // 调用 YouTube Data API v3
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: '获取视频信息失败',
          details: errorData.error?.message || response.statusText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: '未找到该视频' },
        { status: 404 }
      );
    }

    const video = data.items[0];
    const snippet = video.snippet;

    return NextResponse.json({
      videoId: video.id,
      title: snippet.title,
      description: snippet.description,
      publishedAt: snippet.publishedAt,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      thumbnails: snippet.thumbnails,
      tags: snippet.tags || [],
      categoryId: snippet.categoryId,
    });
  } catch (error) {
    console.error('获取视频信息时出错:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
