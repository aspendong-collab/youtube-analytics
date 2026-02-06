/**
 * Affiliate 拓展 API 路由
 * POST /api/influencers/affiliate - 查找适合 affiliate 合作的博主
 */

import { NextRequest, NextResponse } from 'next/server';
import { InfluencerAffiliateService } from '@/lib/services/influencer-affiliate';
import { HeaderUtils } from '@/lib/utils/header-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, language, maxVideos, maxResults, minAffiliateScore, includeComments } = body;

    // 验证必填参数
    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Keyword is required',
          code: 'MISSING_KEYWORD'
        },
        { status: 400 }
      );
    }

    // 设置默认值
    const options = {
      maxVideos: maxVideos || 50,
      maxResults: maxResults || 20,
      minAffiliateScore: minAffiliateScore || 0,
      includeComments: includeComments !== false
    };

    // 提取请求头（用于 LLM SDK 调用）
    const headers = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建服务实例
    const service = new InfluencerAffiliateService(language || 'en');

    // 查找 affiliate 博主
    console.log(`[API] 开始查找 affiliate 博主: ${keyword}, 语种: ${language}`);
    const influencers = await service.findAffiliateInfluencers(
      keyword,
      language || 'en',
      options
    );

    console.log(`[API] 找到 ${influencers.length} 个 affiliate 博主`);

    // 返回结果
    return NextResponse.json({
      success: true,
      data: influencers,
      meta: {
        keyword,
        language: language || 'en',
        totalFound: influencers.length,
        searchOptions: options
      }
    });

  } catch (error) {
    console.error('[API] 查找 affiliate 博主失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword');
    const language = searchParams.get('language') || 'en';
    const maxVideos = parseInt(searchParams.get('maxVideos') || '50');
    const maxResults = parseInt(searchParams.get('maxResults') || '20');
    const minAffiliateScore = parseInt(searchParams.get('minAffiliateScore') || '0');
    const includeComments = searchParams.get('includeComments') !== 'false';

    // 验证必填参数
    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Keyword is required',
          code: 'MISSING_KEYWORD'
        },
        { status: 400 }
      );
    }

    // 提取请求头
    const headers = HeaderUtils.extractForwardHeaders(request.headers);

    // 创建服务实例
    const service = new InfluencerAffiliateService(language as any);

    // 查找 affiliate 博主
    const influencers = await service.findAffiliateInfluencers(
      keyword,
      language as any,
      {
        maxVideos,
        maxResults,
        minAffiliateScore,
        includeComments
      }
    );

    // 返回结果
    return NextResponse.json({
      success: true,
      data: influencers,
      meta: {
        keyword,
        language,
        totalFound: influencers.length,
        searchOptions: {
          maxVideos,
          maxResults,
          minAffiliateScore,
          includeComments
        }
      }
    });

  } catch (error) {
    console.error('[API] 查找 affiliate 博主失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
