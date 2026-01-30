import { NextRequest, NextResponse } from 'next/server';

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
      { error: '无法从 URL 中提取视频 ID，请输入正确的 YouTube 视频链接' },
      { status: 400 }
    );
  }

  // 直接使用环境变量中的 API Key
  const apiKey = process.env.YOUTUBE_API_KEY;

  console.log('[API /api/video-info] 检查 API Key 配置:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
  });

  if (!apiKey) {
    return NextResponse.json(
      {
        error: '平台未配置 YouTube API Key',
        hint: '请联系管理员在环境变量中配置 YOUTUBE_API_KEY',
      },
      { status: 500 }
    );
  }

  try {
    // 调用 YouTube Data API v3
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
    console.log('[API /api/video-info] 调用 YouTube API:', {
      videoId,
      apiUrl: apiUrl.replace(/key=[^&]+/, 'key=***'),
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[API /api/video-info] YouTube API 响应:', {
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API /api/video-info] YouTube API 错误:', errorData);

      // 根据状态码返回更友好的错误信息
      let errorMessage = '获取视频信息失败';
      let hint = '';

      if (response.status === 401) {
        errorMessage = 'API Key 无效或已过期';
        hint = '请联系管理员检查 YouTube API Key 配置';
      } else if (response.status === 403) {
        errorMessage = 'API Key 权限不足或配额已用尽';
        hint = '请联系管理员检查 YouTube API 配额或申请增加配额';
      } else if (response.status === 404) {
        errorMessage = '无法找到该视频';
        hint = '请检查视频链接是否正确，或者视频是否已被删除';
      }

      return NextResponse.json(
        {
          error: errorMessage,
          hint,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('[API /api/video-info] 未找到视频，响应数据:', data);
      return NextResponse.json(
        {
          error: '未找到该视频',
          hint: '请检查视频链接是否正确，或者视频是否已被删除',
        },
        { status: 404 }
      );
    }

    const video = data.items[0];
    const snippet = video.snippet;

    console.log('[API /api/video-info] 成功获取视频信息:', {
      videoId: video.id,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
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
    console.error('[API /api/video-info] 服务器错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        hint: '请稍后重试，如果问题持续存在请联系管理员',
      },
      { status: 500 }
    );
  }
}
