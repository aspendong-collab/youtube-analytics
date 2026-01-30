import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoUrl = searchParams.get('url');

  console.log('[API /api/video-info] 收到请求，视频URL:', videoUrl);

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

  console.log('[API /api/video-info] 提取到的视频ID:', videoId);

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

    console.log('[API /api/video-info] Cookie 存在:', !!settings);

    if (settings) {
      try {
        const settingsData = JSON.parse(settings.value);
        console.log('[API /api/video-info] Cookie 数据结构:', {
          hasApiKeys: !!settingsData.apiKeys,
          hasYoutubeApiKey: !!settingsData.apiKeys?.youtubeApiKey,
          youtubeApiKeyLength: settingsData.apiKeys?.youtubeApiKey?.length || 0,
        });

        if (settingsData.apiKeys?.youtubeApiKey) {
          apiKey = settingsData.apiKeys.youtubeApiKey;
          console.log('[API /api/video-info] 使用 Cookie 中的 API Key');
        }
      } catch (parseError) {
        console.error('[API /api/video-info] 解析 Cookie 数据失败:', parseError);
      }
    }
  } catch (error) {
    console.error('[API /api/video-info] 从 Cookie 读取配置失败:', error);
  }

  console.log('[API /api/video-info] 最终使用的 API Key 来源:', {
    fromEnv: !!process.env.YOUTUBE_API_KEY,
    fromCookie: apiKey !== process.env.YOUTUBE_API_KEY,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
  });

  if (!apiKey) {
    return NextResponse.json(
      {
        error: '未配置 YouTube API Key',
        hint: '请在"设置管理 > 数据采集"中配置 YouTube API Key，或在环境变量中设置 YOUTUBE_API_KEY',
        debug: {
          hasEnvKey: !!process.env.YOUTUBE_API_KEY,
        }
      },
      { status: 500 }
    );
  }

  try {
    // 调用 YouTube Data API v3
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    console.log('[API /api/video-info] 准备调用 YouTube API:', {
      url: apiUrl.replace(/key=[^&]+/, 'key=***'),
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API /api/video-info] YouTube API 响应状态:', {
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API /api/video-info] YouTube API 错误响应:', errorData);

      return NextResponse.json(
        {
          error: '获取视频信息失败',
          details: errorData.error?.message || response.statusText,
          statusCode: response.status,
          debug: {
            videoId,
            responseStatus: response.status,
            apiError: errorData.error,
          }
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API /api/video-info] YouTube API 响应数据:', {
      hasItems: !!data.items,
      itemsCount: data.items?.length || 0,
    });

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        {
          error: '未找到该视频',
          debug: {
            videoId,
            response: data,
          }
        },
        { status: 404 }
      );
    }

    const video = data.items[0];
    const snippet = video.snippet;

    console.log('[API /api/video-info] 成功获取视频信息:', {
      videoId: video.id,
      title: snippet.title,
      hasDescription: !!snippet.description,
    });

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
    console.error('[API /api/video-info] 获取视频信息时出错:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
        debug: {
          videoId,
          errorMessage: error instanceof Error ? error.message : String(error),
        }
      },
      { status: 500 }
    );
  }
}
