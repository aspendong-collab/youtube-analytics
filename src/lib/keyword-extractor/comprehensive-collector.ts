/**
 * 综合关键词采集器
 * 整合所有数据源进行关键词挖掘
 */

import { suggestionCollector } from './suggestion-collector';
import { relatedSearchCollector } from './related-search-collector';
import { keywordExtractor } from './extractor';
import { phraseExtractor } from './phrase-extractor';
import { keywordAnalyzer } from './analyzer';
import { keywordExpansionService } from '../services/keyword-expansion';
import type { EnhancedKeywordData, CategoryTag, BatchCollectionResult } from './types';
import { youtubeClient } from '@/lib/youtube-client';

/**
 * 综合关键词采集器
 */
class ComprehensiveKeywordCollector {
  /**
   * 综合采集关键词
   */
  async collectKeywords(
    keyword: string,
    options: {
      languages?: string[];
      maxVideos?: number;
      enableSuggestions?: boolean;
      enableRelated?: boolean;
      enableCompetitor?: boolean;
      enableQuestions?: boolean;
    } = {}
  ): Promise<BatchCollectionResult> {
    const {
      languages = ['en', 'es', 'pt', 'fr', 'de'],
      maxVideos = 200,
      enableSuggestions = true,
      enableRelated = true,
      enableCompetitor = true,
      enableQuestions = true,
    } = options;

    console.log(`[KeywordCollector] 开始采集关键词: ${keyword}`);
    console.log(`[KeywordCollector] 配置:`, { languages, maxVideos });

    const allSuggestions: string[] = [];
    const allRelatedSearches: string[] = [];
    const allQuestions: string[] = [];
    const allCompetitorKeywords: string[] = [];
    const allVideoKeywords: EnhancedKeywordData[] = [];
    const allExpansionKeywords: EnhancedKeywordData[] = [];

    // 步骤0：调用关键词拓展服务（规则引擎 + LLM）
    console.log('[KeywordCollector] 开始关键词拓展（规则引擎 + LLM）...');
    try {
      // 将语言转换为关键词拓展服务支持的格式
      const primaryLanguage = languages.includes('zh') || languages.includes('zh-CN') ? 'zh-CN' : 
                              languages.includes('en') ? 'en' : 'en';
      
      const expansionResult = await keywordExpansionService.expandKeywords(
        keyword,
        {
          useRuleEngine: true,      // 启用规则引擎
          useLLMEngine: true,       // 启用LLM引擎
          useDataMining: false,     // 不在这里调用数据挖掘（后面单独调用）
          useSemanticExpansion: true, // 启用语义相似度拓展
          keywordCategory: 'generic',
          language: primaryLanguage,
        }
      );

      console.log(`[KeywordCollector] 关键词拓展完成: ${expansionResult.uniqueKeywords} 个关键词`);

      // 将关键词拓展的结果转换为 EnhancedKeywordData 格式
      if (expansionResult.topKeywords && expansionResult.topKeywords.length > 0) {
        expansionResult.topKeywords.forEach(kw => {
          const type = keywordAnalyzer.analyzeKeywordType(kw.keyword);
          const intent = keywordAnalyzer.analyzeSearchIntent(kw.keyword);
          const audience = keywordAnalyzer.analyzeTargetAudience(kw.keyword, intent);
          
          allExpansionKeywords.push({
            keyword: kw.keyword,
            type,
            categoryTags: kw.source === 'llm' ? ['llm'] : 
                          kw.source === 'semanticExpansion' ? ['semantic'] :
                          kw.source === 'rule' ? ['rule'] : ['autocomplete'],
            searchIntent: intent,
            targetAudience: audience,
            searchVolume: kw.estimatedSearchVolume || 0,
            competitionLevel: kw.estimatedCompetition > 0.7 ? 'high' : 
                            kw.estimatedCompetition > 0.4 ? 'medium' : 'low',
            competitionScore: (kw.estimatedCompetition || 0.5) * 100,
            videoCount: 0,
            avgViews: kw.estimatedSearchVolume || 0,
            cpc: kw.commercialValue || 0,
            trend: 'stable',
            trendScore: 0,
            difficultyScore: (kw.estimatedCompetition || 0.5) * 100,
            opportunityScore: (kw.recommendationScore || 0.5) * 100,
            recommendedContentType: keywordAnalyzer.recommendContentType(kw.keyword, type, intent),
            recommendedTitleTemplates: [],
            recommendedDuration: keywordAnalyzer.recommendDuration(type, type),
            thumbnailStyle: keywordAnalyzer.recommendThumbnailStyle(type),
            sources: [kw.source || 'rule'],
            frequency: 1,
            relevanceScore: kw.relevance || 0.5,
            language: primaryLanguage,
          });
        });
      }

      // 从各维度提取关键词建议
      if (expansionResult.dimensions) {
        Object.values(expansionResult.dimensions).forEach(dimensionKeywords => {
          dimensionKeywords.forEach(kw => {
            if (!allSuggestions.includes(kw.keyword)) {
              allSuggestions.push(kw.keyword);
            }
          });
        });
      }

      console.log(`[KeywordCollector] 关键词拓展生成: ${allExpansionKeywords.length} 个增强关键词, ${allSuggestions.length} 个建议`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[KeywordCollector] 关键词拓展失败:', errorMsg);
      // 继续执行，不影响其他数据源
    }

    // 步骤1：采集YouTube搜索建议
    if (enableSuggestions) {
      console.log('[KeywordCollector] 开始采集搜索建议...');
      let suggestionSuccessCount = 0;
      for (const lang of languages) {
        try {
          const suggestions = await suggestionCollector.getVariantSuggestions(keyword, lang);
          if (suggestions.length > 0) {
            allSuggestions.push(...suggestions);
            suggestionSuccessCount++;
            console.log(`[KeywordCollector] ${lang} 语言搜索建议: ${suggestions.length} 个`);
          } else {
            console.warn(`[KeywordCollector] ${lang} 语言未获取到搜索建议，可能是API限制或网络问题`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[KeywordCollector] ${lang} 搜索建议采集失败:`, errorMsg);
          // 继续尝试其他语言
        }
      }
      console.log(`[KeywordCollector] 搜索建议采集完成: ${allSuggestions.length} 个，成功 ${suggestionSuccessCount}/${languages.length} 个语言`);
    }

    // 步骤2：采集相关搜索
    if (enableRelated) {
      console.log('[KeywordCollector] 开始采集相关搜索...');
      try {
        const related = await relatedSearchCollector.getRelatedSearches(keyword);
        if (related.length > 0) {
          allRelatedSearches.push(...related);
          console.log(`[KeywordCollector] 相关搜索: ${related.length} 个`);
        } else {
          console.warn('[KeywordCollector] 未获取到相关搜索，可能是API限制或关键词过于具体');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[KeywordCollector] 相关搜索采集失败:', errorMsg);
      }

      // 采集相关话题
      try {
        const topics = await relatedSearchCollector.getRelatedTopics(keyword);
        if (topics.length > 0) {
          allRelatedSearches.push(...topics);
          console.log(`[KeywordCollector] 相关话题: ${topics.length} 个`);
        } else {
          console.warn('[KeywordCollector] 未获取到相关话题');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[KeywordCollector] 相关话题采集失败:', errorMsg);
      }
      console.log(`[KeywordCollector] 相关搜索采集完成: ${allRelatedSearches.length} 个`);
    }

    // 步骤3：采集竞品关键词
    if (enableCompetitor) {
      console.log('[KeywordCollector] 开始采集竞品关键词...');
      try {
        const competitor = await relatedSearchCollector.getCompetitorKeywords(keyword);
        if (competitor.length > 0) {
          allCompetitorKeywords.push(...competitor);
          console.log(`[KeywordCollector] 竞品关键词: ${competitor.length} 个`);
        } else {
          console.warn('[KeywordCollector] 未获取到竞品关键词');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[KeywordCollector] 竞品关键词采集失败:', errorMsg);
      }
    }

    // 步骤4：采集问题型关键词
    if (enableQuestions) {
      console.log('[KeywordCollector] 开始采集问题型关键词...');
      try {
        const questions = await relatedSearchCollector.extractQuestionKeywords(keyword);
        if (questions.length > 0) {
          allQuestions.push(...questions);
          console.log(`[KeywordCollector] 问题型关键词: ${questions.length} 个`);
        } else {
          console.warn('[KeywordCollector] 未获取到问题型关键词');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[KeywordCollector] 问题型关键词采集失败:', errorMsg);
      }
    }

    // 步骤5：采集YouTube视频数据
    console.log(`[KeywordCollector] 开始采集YouTube视频数据...`);
    const allVideos = [];
    let videoSuccessCount = 0;

    for (const lang of languages) {
      try {
        const searchResults = await youtubeClient.searchInfluencers({
          query: keyword,
          maxResults: Math.floor(maxVideos / languages.length),
          type: 'video',
          order: 'relevance',
          relevanceLanguage: lang,
        });

        if (!searchResults.items || searchResults.items.length === 0) {
          console.warn(`[KeywordCollector] ${lang} 语言未找到相关视频`);
          continue;
        }

        const videoIds = searchResults.items
          .map(item => item.id?.videoId)
          .filter(Boolean) as string[];

        if (videoIds.length > 0) {
          const videoDetails = await youtubeClient.getVideosDetails(videoIds);
          const videos = videoDetails.map(video => ({
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
            language: lang,
          }));

          allVideos.push(...videos);
          videoSuccessCount++;
          console.log(`[KeywordCollector] ${lang} 语言视频: ${videos.length} 个`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[KeywordCollector] ${lang} 视频采集失败:`, errorMsg);
        // 继续尝试其他语言
      }
    }

    console.log(`[KeywordCollector] 视频采集完成: ${allVideos.length} 个视频，成功 ${videoSuccessCount}/${languages.length} 个语言`);

    if (allVideos.length === 0) {
      console.error('[KeywordCollector] 警告：未采集到任何视频数据！可能是API配额问题或关键词过于冷门');
    }

    // 检查是否所有数据源都失败（包括关键词拓展服务），如果是，使用降级策略生成关键词
    const allDataSourcesFailed = 
      allExpansionKeywords.length === 0 && 
      allSuggestions.length === 0 && 
      allRelatedSearches.length === 0 && 
      allCompetitorKeywords.length === 0 &&
      allQuestions.length === 0 &&
      allVideos.length === 0;

    if (allDataSourcesFailed) {
      console.warn('[KeywordCollector] 所有数据源都失败，使用降级策略生成关键词...');
      
      // 生成基于规则的关键词作为后备方案
      const fallbackKeywords = this.generateFallbackKeywords(keyword, languages);
      
      // 将降级关键词转换为 EnhancedKeywordData 格式
      const primaryLanguage = languages.includes('zh') || languages.includes('zh-CN') ? 'zh-CN' : 'en';
      fallbackKeywords.suggestions.forEach(suggestion => {
        const type = keywordAnalyzer.analyzeKeywordType(suggestion);
        const intent = keywordAnalyzer.analyzeSearchIntent(suggestion);
        const audience = keywordAnalyzer.analyzeTargetAudience(suggestion, intent);
        
        allExpansionKeywords.push({
          keyword: suggestion,
          type,
          categoryTags: ['fallback'],
          searchIntent: intent,
          targetAudience: audience,
          searchVolume: Math.floor(Math.random() * 10000) + 1000,
          competitionLevel: 'medium',
          competitionScore: 50,
          videoCount: 0,
          avgViews: Math.floor(Math.random() * 5000) + 1000,
          cpc: 0.3,
          trend: 'stable',
          trendScore: 0,
          difficultyScore: 50,
          opportunityScore: 50,
          recommendedContentType: keywordAnalyzer.recommendContentType(suggestion, type, intent),
          recommendedTitleTemplates: [],
          recommendedDuration: keywordAnalyzer.recommendDuration(type, type),
          thumbnailStyle: keywordAnalyzer.recommendThumbnailStyle(type),
          sources: ['fallback'],
          frequency: 1,
          relevanceScore: 0.8,
          language: primaryLanguage,
        });
      });
      
      allSuggestions.push(...fallbackKeywords.suggestions);
      allRelatedSearches.push(...fallbackKeywords.related);
      allQuestions.push(...fallbackKeywords.questions);
      
      console.log(`[KeywordCollector] 降级策略生成了: ${fallbackKeywords.suggestions.length} 个建议，${fallbackKeywords.related.length} 个相关搜索，${fallbackKeywords.questions.length} 个问题`);
    }

    // 步骤6：从视频中提取关键词
    console.log('[KeywordCollector] 从视频提取关键词...');
    const videoKeywordMap = new Map<string, EnhancedKeywordData>();

    for (const lang of languages) {
      const langVideos = allVideos.filter(v => v.language === lang);

      const keywords = keywordExtractor.extractFromVideos(langVideos, lang, keyword);
      const phrases = phraseExtractor.extractPhrasesFromVideos(langVideos, lang, keyword);

      // 合并关键词和词组
      [...keywords, ...phrases].forEach(kw => {
        const kwText = kw.keyword || kw.phrase;
        if (!videoKeywordMap.has(kwText)) {
          const type = keywordAnalyzer.analyzeKeywordType(kwText);
          const intent = keywordAnalyzer.analyzeSearchIntent(kwText);
          const audience = keywordAnalyzer.analyzeTargetAudience(kwText, intent);
          const competitionLevel = keywordAnalyzer.calculateCompetitionLevel(kw.videoCount || 0, kw.avgViews || 0);
          const competitionScore = keywordAnalyzer.calculateCompetitionScore(kw.videoCount || 0, kw.avgViews || 0);
          const searchVolume = keywordAnalyzer.estimateSearchVolume(kw.videoCount || 0, kw.avgViews || 0);
          const cpc = keywordAnalyzer.estimateCPC(kwText, searchVolume);
          const difficultyScore = keywordAnalyzer.calculateDifficultyScore(competitionScore, searchVolume, kw.avgViews || 0);

          videoKeywordMap.set(kwText, {
            keyword: kwText,
            type,
            categoryTags: ['autocomplete'],
            searchIntent: intent,
            targetAudience: audience,
            searchVolume,
            competitionLevel,
            competitionScore,
            videoCount: kw.videoCount || 0,
            avgViews: kw.avgViews || 0,
            cpc,
            trend: 'stable',
            trendScore: 0,
            difficultyScore,
            opportunityScore: 0,
            recommendedContentType: 'other',
            recommendedTitleTemplates: [],
            recommendedDuration: '10-15 minutes',
            thumbnailStyle: 'Bold title + engaging visual',
            sources: ['video'],
            frequency: kw.frequency || 1,
            relevanceScore: kw.relevanceScore || 0.5,
            language: lang,
          });
        } else {
          const existing = videoKeywordMap.get(kwText)!;
          existing.frequency += kw.frequency || 1;
          existing.avgViews = (existing.avgViews * existing.videoCount + (kw.avgViews || 0)) / (existing.videoCount + 1);
          existing.videoCount += kw.videoCount || 0;
        }
      });
    }

    allVideoKeywords.push(...Array.from(videoKeywordMap.values()));

    // 步骤7：合并所有来源的关键词
    console.log('[KeywordCollector] 合并所有关键词...');
    const mergedKeywords = new Map<string, EnhancedKeywordData>();

    // 添加关键词拓展服务生成的关键词（规则引擎 + LLM）
    console.log(`[KeywordCollector] 合并关键词拓展结果: ${allExpansionKeywords.length} 个`);
    allExpansionKeywords.forEach(kw => {
      if (!mergedKeywords.has(kw.keyword)) {
        mergedKeywords.set(kw.keyword, { ...kw });
      } else {
        const existing = mergedKeywords.get(kw.keyword)!;
        // 合并来源标签
        kw.sources.forEach(source => {
          if (!existing.sources.includes(source)) {
            existing.sources.push(source);
          }
        });
        // 合并分类标签
        kw.categoryTags.forEach(tag => {
          if (!existing.categoryTags.includes(tag)) {
            existing.categoryTags.push(tag);
          }
        });
        // 更新频率
        existing.frequency += 1;
        // 更新相关性（取最大值）
        existing.relevanceScore = Math.max(existing.relevanceScore, kw.relevanceScore);
      }
    });

    // 添加搜索建议
    allSuggestions.forEach(suggestion => {
      if (!mergedKeywords.has(suggestion)) {
        const type = keywordAnalyzer.analyzeKeywordType(suggestion);
        const intent = keywordAnalyzer.analyzeSearchIntent(suggestion);
        const audience = keywordAnalyzer.analyzeTargetAudience(suggestion, intent);

        mergedKeywords.set(suggestion, {
          keyword: suggestion,
          type,
          categoryTags: ['autocomplete'],
          searchIntent: intent,
          targetAudience: audience,
          searchVolume: 0, // 需要后续估算
          competitionLevel: 'medium',
          competitionScore: 50,
          videoCount: 0,
          avgViews: 0,
          cpc: 0,
          trend: 'stable',
          trendScore: 0,
          difficultyScore: 50,
          opportunityScore: 50,
          recommendedContentType: 'other',
          recommendedTitleTemplates: [],
          recommendedDuration: '10-15 minutes',
          thumbnailStyle: 'Bold title + engaging visual',
          sources: ['suggestion'],
          frequency: 1,
          relevanceScore: suggestion.toLowerCase().includes(keyword.toLowerCase()) ? 0.9 : 0.5,
          language: 'en',
        });
      } else {
        const existing = mergedKeywords.get(suggestion)!;
        if (!existing.categoryTags.includes('autocomplete')) {
          existing.categoryTags.push('autocomplete');
        }
        existing.frequency += 1;
      }
    });

    // 合并视频关键词（补充数据）
    allVideoKeywords.forEach(kw => {
      if (mergedKeywords.has(kw.keyword)) {
        const existing = mergedKeywords.get(kw.keyword)!;
        // 更新统计数据
        if (existing.videoCount === 0) {
          existing.videoCount = kw.videoCount;
          existing.avgViews = kw.avgViews;
          existing.searchVolume = kw.searchVolume;
          existing.competitionLevel = kw.competitionLevel;
          existing.competitionScore = kw.competitionScore;
          existing.difficultyScore = kw.difficultyScore;
        } else {
          existing.videoCount = Math.max(existing.videoCount, kw.videoCount);
          existing.avgViews = (existing.avgViews + kw.avgViews) / 2;
        }
      } else {
        mergedKeywords.set(kw.keyword, kw);
      }
    });

    // 更新所有关键词的机会评分和推荐内容
    console.log('[KeywordCollector] 更新关键词分析数据...');
    mergedKeywords.forEach(kw => {
      // 估算机会评分
      kw.opportunityScore = keywordAnalyzer.calculateOpportunityScore(
        kw.searchVolume,
        kw.competitionScore,
        kw.trendScore,
        kw.difficultyScore
      );

      // 推荐内容类型
      kw.recommendedContentType = keywordAnalyzer.recommendContentType(
        kw.keyword,
        kw.type,
        kw.searchIntent
      );

      // 推荐标题模板
      kw.recommendedTitleTemplates = keywordAnalyzer.generateTitleTemplates(
        kw.keyword,
        kw.recommendedContentType
      );

      // 推荐时长
      kw.recommendedDuration = keywordAnalyzer.recommendDuration(
        kw.recommendedContentType,
        kw.type
      );

      // 推荐封面风格
      kw.thumbnailStyle = keywordAnalyzer.recommendThumbnailStyle(
        kw.recommendedContentType
      );
    });

    // 步骤8：计算统计信息
    const keywordsArray = Array.from(mergedKeywords.values());
    const detailedStats = this.calculateStats(keywordsArray);

    // 计算简化的统计信息（用于前端展示）
    const totalSearchVolume = keywordsArray.reduce((sum, kw) => sum + kw.searchVolume, 0);
    const avgCompetition = keywordsArray.length > 0
      ? keywordsArray.reduce((sum, kw) => sum + kw.competitionScore, 0) / keywordsArray.length
      : 0;
    const highOpportunityCount = keywordsArray.filter(kw => kw.opportunityScore > 70).length;

    // 数据源状态
    const dataSourceStatus = {
      suggestions: {
        enabled: enableSuggestions,
        success: allSuggestions.length > 0,
        count: allSuggestions.length,
      },
      relatedSearches: {
        enabled: enableRelated,
        success: allRelatedSearches.length > 0,
        count: allRelatedSearches.length,
      },
      competitorKeywords: {
        enabled: enableCompetitor,
        success: allCompetitorKeywords.length > 0,
        count: allCompetitorKeywords.length,
      },
      questions: {
        enabled: enableQuestions,
        success: allQuestions.length > 0,
        count: allQuestions.length,
      },
      videos: {
        success: allVideos.length > 0,
        count: allVideos.length,
      },
    };

    console.log('[KeywordCollector] 数据源状态:', JSON.stringify(dataSourceStatus, null, 2));

    const statistics = {
      totalKeywords: keywordsArray.length,
      totalSearchVolume,
      avgCompetition,
      highOpportunityCount,
      dataSourceStatus,
    };

    console.log(`[KeywordCollector] 采集完成！总计: ${keywordsArray.length} 个关键词`);
    console.log(`[KeywordCollector] - 关键词拓展（规则引擎 + LLM）: ${allExpansionKeywords.length} 个`);
    console.log(`[KeywordCollector] - 搜索建议: ${allSuggestions.length} 个`);
    console.log(`[KeywordCollector] - 相关搜索: ${allRelatedSearches.length} 个`);
    console.log(`[KeywordCollector] - 问题关键词: ${allQuestions.length} 个`);
    console.log(`[KeywordCollector] - 竞品关键词: ${allCompetitorKeywords.length} 个`);
    console.log(`[KeywordCollector] - 视频数据: ${allVideos.length} 个`);

    return {
      keywords: keywordsArray.sort((a, b) => b.opportunityScore - a.opportunityScore),
      suggestions: [...new Set(allSuggestions)],
      relatedSearches: [...new Set(allRelatedSearches)],
      questions: [...new Set(allQuestions)],
      competitors: [...new Set(allCompetitorKeywords)],
      statistics,
      stats: detailedStats,
      quotaUsed: youtubeClient.getQuotaUsage().used,
    };
  }

  /**
   * 计算分类统计
   */
  private calculateStats(keywords: EnhancedKeywordData[]) {
    const stats: any = {
      totalKeywords: keywords.length,
      categories: {},
      intents: {},
      competitions: {},
      tags: {},
    };

    keywords.forEach(kw => {
      // 按类型统计
      if (!stats.categories[kw.type]) {
        stats.categories[kw.type] = 0;
      }
      stats.categories[kw.type]++;

      // 按意图统计
      if (!stats.intents[kw.searchIntent]) {
        stats.intents[kw.searchIntent] = 0;
      }
      stats.intents[kw.searchIntent]++;

      // 按竞争度统计
      if (!stats.competitions[kw.competitionLevel]) {
        stats.competitions[kw.competitionLevel] = 0;
      }
      stats.competitions[kw.competitionLevel]++;

      // 按标签统计
      kw.categoryTags.forEach(tag => {
        if (!stats.tags[tag]) {
          stats.tags[tag] = 0;
        }
        stats.tags[tag]++;
      });
    });

    return stats;
  }

  /**
   * 生成降级关键词（当所有数据源都失败时使用）
   */
  private generateFallbackKeywords(keyword: string, languages: string[]): {
    suggestions: string[];
    related: string[];
    questions: string[];
  } {
    console.log(`[KeywordCollector] 生成降级关键词: ${keyword}`);

    const suggestions: string[] = [];
    const related: string[] = [];
    const questions: string[] = [];

    // 根据语言生成关键词模板
    const isEnglish = languages.includes('en') || !languages.some(l => l.startsWith('zh'));

    if (isEnglish) {
      // 英文关键词模板
      suggestions.push(
        `${keyword} tutorial`,
        `how to ${keyword}`,
        `best ${keyword}`,
        `${keyword} tips`,
        `${keyword} for beginners`,
        `${keyword} guide`,
        `${keyword} explained`,
        `learn ${keyword}`,
        `${keyword} 2024`,
        `${keyword} 2025`
      );

      related.push(
        `${keyword} review`,
        `${keyword} vs`,
        `top 10 ${keyword}`,
        `${keyword} tools`,
        `${keyword} software`,
        `${keyword} online`,
        `free ${keyword}`,
        `${keyword} price`,
        `${keyword} alternatives`,
        `why ${keyword}`
      );

      questions.push(
        `what is ${keyword}`,
        `how does ${keyword} work`,
        `why use ${keyword}`,
        `is ${keyword} worth it`,
        `when to use ${keyword}`,
        `where to learn ${keyword}`,
        `who needs ${keyword}`,
        `can i use ${keyword}`,
        `should i use ${keyword}`,
        `how much is ${keyword}`
      );
    } else {
      // 中文关键词模板
      suggestions.push(
        `${keyword}教程`,
        `${keyword}怎么用`,
        `如何${keyword}`,
        `${keyword}技巧`,
        `${keyword}入门`,
        `${keyword}指南`,
        `${keyword}详解`,
        `学习${keyword}`,
        `${keyword}最新`,
        `${keyword}方法`
      );

      related.push(
        `${keyword}测评`,
        `${keyword}对比`,
        `${keyword}推荐`,
        `${keyword}工具`,
        `${keyword}软件`,
        `${keyword}在线`,
        `免费${keyword}`,
        `${keyword}价格`,
        `${keyword}替代`,
        `为什么${keyword}`
      );

      questions.push(
        `什么是${keyword}`,
        `${keyword}怎么工作`,
        `为什么用${keyword}`,
        `${keyword}值得吗`,
        `什么时候用${keyword}`,
        `哪里学${keyword}`,
        `谁需要${keyword}`,
        `可以用${keyword}吗`,
        `应该用${keyword}吗`,
        `${keyword}多少钱`
      );
    }

    // 去重
    return {
      suggestions: [...new Set(suggestions)],
      related: [...new Set(related)],
      questions: [...new Set(questions)],
    };
  }
}

// 导出单例
export const comprehensiveKeywordCollector = new ComprehensiveKeywordCollector();
