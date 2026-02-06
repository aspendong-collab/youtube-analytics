/**
 * Affiliate 拓展 API 路由
 * POST /api/influencers/affiliate - 查找适合 affiliate 合作的博主
 */

import { NextRequest, NextResponse } from 'next/server';
import { InfluencerAffiliateService } from '@/lib/services/influencer-affiliate';
import { SemanticExpansionService } from '@/lib/services/keyword-expansion/semantic-expansion';
import { HeaderUtils } from '@/lib/utils/header-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keyword,
      language,
      expansionMode,
      maxVideos,
      maxResults,
      minAffiliateScore,
      includeComments
    } = body;

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

    // 根据拓展模式生成关键词列表
    let keywords: string[] = [keyword];

    if (expansionMode === 'semantic' || expansionMode === 'hybrid') {
      console.log(`[API] 使用 ${expansionMode} 模式进行关键词拓展`);

      // 使用语义相似度服务生成相关关键词
      const semanticService = new SemanticExpansionService(language || 'en');

      const semanticResults = await semanticService.expand(keyword, {
        maxResults: expansionMode === 'semantic' ? 15 : 8,
        minSearchVolume: 1000,
        excludeOriginal: true,
        includeSynonyms: true,
        includeAntonyms: false,
        includeRelated: true
      });

      if (semanticResults.length > 0) {
        // 添加原始关键词和语义相关关键词
        keywords = [keyword, ...semanticResults.map(r => r.keyword)];

        console.log(`[API] 生成了 ${semanticResults.length} 个语义相关关键词：${semanticResults.map(r => r.keyword).join(', ')}`);
      }
    } else if (expansionMode === 'multi-dimensional') {
      // 多维度模式：使用原始关键词
      console.log(`[API] 使用多维度模式进行关键词拓展`);
    } else {
      // 默认模式：使用原始关键词
      console.log(`[API] 使用默认模式（仅原始关键词）`);
    }

    // 查找 affiliate 博主（使用多个关键词）
    console.log(`[API] 开始查找 affiliate 博主，关键词列表: ${keywords.join(', ')}`);

    // 对每个关键词进行搜索，然后合并结果
    const allInfluencers = new Map<string, any>();

    for (const kw of keywords) {
      const results = await service.findAffiliateInfluencers(
        kw,
        language || 'en',
        options
      );

      // 合并结果，避免重复
      for (const influencer of results) {
        if (!allInfluencers.has(influencer.channelId)) {
          allInfluencers.set(influencer.channelId, influencer);
        } else {
          // 如果已存在，合并视频列表
          const existing = allInfluencers.get(influencer.channelId);
          existing.videos = [...existing.videos, ...influencer.videos];
          // 重新计算分数
          existing.affiliateScore = Math.max(existing.affiliateScore, influencer.affiliateScore);
        }
      }

      // 如果已经找到足够多的结果，可以提前退出
      if (allInfluencers.size >= options.maxResults) {
        break;
      }
    }

    const influencers = Array.from(allInfluencers.values())
      .sort((a, b) => b.affiliateScore - a.affiliateScore)
      .slice(0, options.maxResults);

    console.log(`[API] 找到 ${influencers.length} 个 affiliate 博主`);

    // 返回结果
    return NextResponse.json({
      success: true,
      data: influencers,
      meta: {
        keyword,
        language: language || 'en',
        expansionMode: expansionMode || 'default',
        keywordsUsed: keywords,
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
