import { NextRequest, NextResponse } from 'next/server';

// 设置为动态路由，避免构建时预加载
export const dynamic = 'force-dynamic';

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
    envKeys: Object.keys(process.env).filter(k => k.includes('YOUTUBE')),
  });

  if (!apiKey) {
    return NextResponse.json(
      {
        error: '未配置 YouTube API Key',
        hint: '请检查 Vercel 环境变量中是否已配置 YOUTUBE_API_KEY',
        debug: {
          hasApiKey: false,
          envVarsAvailable: Object.keys(process.env).length,
        },
      },
      { status: 500 }
    );
  }

  try {
    // 调用 YouTube Data API v3 - 获取多个part
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${videoId}&key=${apiKey}`;
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
    const contentDetails = video.contentDetails || {};
    const status = video.status || {};

    // 解析时长 (ISO 8601 format: PT1M30S -> 90 seconds)
    let duration = 0;
    if (contentDetails.duration) {
      const match = contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      if (match) {
        const hours = (parseInt(match[1]) || 0) * 3600;
        const minutes = (parseInt(match[2]) || 0) * 60;
        const seconds = parseInt(match[3]) || 0;
        duration = hours + minutes + seconds;
      }
    }

    // 解析地区和语言（从defaultLanguage或defaultAudioLanguage）
    const region = status.regionRestriction?.allowed?.[0] || status.regionRestriction?.blocked?.[0] || null;
    const language = contentDetails.defaultLanguage || contentDetails.defaultAudioLanguage || null;

    console.log('[API /api/video-info] 成功获取视频信息:', {
      videoId: video.id,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      duration,
      region,
      language,
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
      // 新增字段
      duration,
      region,
      language,
      privacyStatus: status.privacyStatus,
      license: status.license,
      embeddable: status.embeddable,
    });
  } catch (error: any) {
    console.error('[API /api/video-info] 服务器错误:', error);
    console.error('[API /api/video-info] 错误详情:', JSON.stringify(error, null, 2));

    // 检查是否是网络超时错误
    const errorCode = error?.cause?.code || error?.code || '';
    const errorMessage = error?.cause?.message || error?.message || '';

    console.log('[API /api/video-info] 检查错误代码:', { errorCode, errorMessage });

    if (errorCode === 'UND_ERR_CONNECT_TIMEOUT' || errorCode === 'ETIMEDOUT' || errorMessage?.toLowerCase().includes('timeout')) {
      return NextResponse.json(
        {
          error: '无法连接到 YouTube API',
          hint: '可能是网络连接问题。请在生产环境（Vercel）中测试此功能，沙箱环境可能无法访问 Google API',
          canManualInput: true,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: '服务器内部错误',
        hint: '请稍后重试，如果问题持续存在请联系管理员',
      },
      { status: 500 }
    );
  }
}
