import { NextRequest, NextResponse } from 'next/server';
import { youtubeClient } from '@/lib/youtube-client';
import { keywordExtractor } from '@/lib/keyword-extractor/extractor';
import { getRegionCode, detectLanguage } from '@/lib/keyword-extractor/languages';

/**
 * POST /api/discovery/keywords/expand
 * 拓展 YouTube 关键词
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[API /api/discovery/keywords/expand] 收到请求');

    const body = await request.json();
    const { 
      keyword, 
      languages = ['en'],
      options = {} 
    } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing required field: keyword' },
        { status: 400 }
      );
    }

    console.log('[API] 请求参数:', { keyword, languages, options });

    // 检查配额
    const quotaUsage = youtubeClient.getQuotaUsage();
    if (quotaUsage.remaining < 100) {
      return NextResponse.json(
        { error: 'Insufficient quota. Please try again tomorrow.' },
        { status: 429 }
      );
    }

    console.log('[API] 开始采集视频数据...');

    // 并行采集不同语言的视频
    const results = await Promise.all(
      languages.map(async (lang: string) => {
        return await collectByLanguage(keyword, lang, options);
      })
    );

    console.log('[API] 采集完成，开始提取关键词...');

    // 提取并合并关键词
    const allKeywords = new Map<string, any>();

    results.forEach(result => {
      result.keywords.forEach((kw: any) => {
        const key = `${kw.language}:${kw.keyword}`;
        if (!allKeywords.has(key)) {
          allKeywords.set(key, {
            ...kw,
            languages: [],
          });
        }
        
        const existing = allKeywords.get(key);
        if (!existing.languages.includes(kw.language)) {
          existing.languages.push(kw.language);
        }
      });
    });

    // 转换为数组并排序
    const sortedKeywords = Array.from(allKeywords.values())
      .sort((a, b) => {
        const scoreA = a.frequency * 0.6 + (a.avgViews / 1000000) * 0.4;
        const scoreB = b.frequency * 0.6 + (b.avgViews / 1000000) * 0.4;
        return scoreB - scoreA;
      });

    // 计算汇总统计
    const summary = {
      totalKeywords: sortedKeywords.length,
      totalVideos: results.reduce((sum, r) => sum + r.totalVideos, 0),
      avgViews: sortedKeywords.reduce((sum, kw) => sum + kw.avgViews, 0) / sortedKeywords.length,
      avgEngagementRate: sortedKeywords.reduce((sum, kw) => sum + kw.avgEngagementRate, 0) / sortedKeywords.length,
      languages: languages.length,
      topKeyword: sortedKeywords[0]?.keyword || '',
    };

    console.log(`[API] 提取完成，发现 ${sortedKeywords.length} 个关键词`);

    return NextResponse.json({
      success: true,
      data: {
        keyword,
        languages,
        keywords: sortedKeywords,
        summary,
        quotaUsage: youtubeClient.getQuotaUsage(),
      },
    });
  } catch (error) {
    console.error('[API] 拓展关键词错误:', error);

    let errorMessage = 'Failed to expand keywords';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (errorMessage.includes('Quota exceeded')) {
        statusCode = 429;
        errorMessage = 'API配额已用完，请明天再试';
      } else if (errorMessage.includes('API key')) {
        statusCode = 500;
        errorMessage = 'YouTube API密钥无效或已过期';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode,
      },
      { status: statusCode }
    );
  }
}

/**
 * 按语言采集视频数据
 */
async function collectByLanguage(
  keyword: string,
  language: string,
  options: any
) {
  const maxResults = options.maxResults || 50;
  const regionCode = getRegionCode(language);

  console.log(`[collectByLanguage] 采集 ${language} 语言的视频...`);

  // 搜索视频
  const searchResults = await youtubeClient.searchInfluencers({
    query: keyword,
    maxResults,
    type: 'video',
    order: 'relevance',
    relevanceLanguage: language,
    regionCode,
  });

  console.log(`[collectByLanguage] 搜索到 ${searchResults.items.length} 个视频`);

  // 获取视频详情
  const videoIds = searchResults.items
    .map(item => item.id?.videoId)
    .filter(Boolean) as string[];

  let videos: any[] = [];
  if (videoIds.length > 0) {
    const videoDetails = await youtubeClient.getVideosDetails(videoIds);
    videos = videoDetails.map(video => ({
      videoId: video.id,
      title: video.snippet?.title || '',
      description: video.snippet?.description || '',
      tags: video.snippet?.tags || [],
      channelId: video.snippet?.channelId || '',
      channelTitle: video.snippet?.channelTitle || '',
      viewCount: parseInt(video.statistics?.viewCount || '0'),
      likeCount: parseInt(video.statistics?.likeCount || '0'),
      commentCount: parseInt(video.statistics?.commentCount || '0'),
      publishedAt: video.snippet?.publishedAt || '',
      language: language,
    }));
  }

  console.log(`[collectByLanguage] 获取到 ${videos.length} 个视频详情`);

  // 提取关键词（传递原始关键词用于相关性计算）
  const keywords = keywordExtractor.extractFromVideos(videos, language, keyword);

  return {
    language,
    totalVideos: videos.length,
    keywords,
  };
}
