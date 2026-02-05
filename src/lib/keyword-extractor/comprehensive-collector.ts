/**
 * 综合关键词采集器
 * 整合所有数据源进行关键词挖掘
 */

import { suggestionCollector } from './suggestion-collector';
import { relatedSearchCollector } from './related-search-collector';
import { keywordExtractor } from './extractor';
import { phraseExtractor } from './phrase-extractor';
import { keywordAnalyzer } from './analyzer';
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

    // 步骤1：采集YouTube搜索建议
    if (enableSuggestions) {
      console.log('[KeywordCollector] 采集搜索建议...');
      for (const lang of languages) {
        try {
          const suggestions = await suggestionCollector.getVariantSuggestions(keyword, lang);
          allSuggestions.push(...suggestions);
          console.log(`[KeywordCollector] ${lang} 语言搜索建议: ${suggestions.length} 个`);
        } catch (error) {
          console.error(`[KeywordCollector] ${lang} 搜索建议采集失败:`, error);
        }
      }
    }

    // 步骤2：采集相关搜索
    if (enableRelated) {
      console.log('[KeywordCollector] 采集相关搜索...');
      try {
        const related = await relatedSearchCollector.getRelatedSearches(keyword);
        allRelatedSearches.push(...related);
        console.log(`[KeywordCollector] 相关搜索: ${related.length} 个`);
      } catch (error) {
        console.error('[KeywordCollector] 相关搜索采集失败:', error);
      }

      // 采集相关话题
      try {
        const topics = await relatedSearchCollector.getRelatedTopics(keyword);
        allRelatedSearches.push(...topics);
        console.log(`[KeywordCollector] 相关话题: ${topics.length} 个`);
      } catch (error) {
        console.error('[KeywordCollector] 相关话题采集失败:', error);
      }
    }

    // 步骤3：采集竞品关键词
    if (enableCompetitor) {
      console.log('[KeywordCollector] 采集竞品关键词...');
      try {
        const competitor = await relatedSearchCollector.getCompetitorKeywords(keyword);
        allCompetitorKeywords.push(...competitor);
        console.log(`[KeywordCollector] 竞品关键词: ${competitor.length} 个`);
      } catch (error) {
        console.error('[KeywordCollector] 竞品关键词采集失败:', error);
      }
    }

    // 步骤4：采集问题型关键词
    if (enableQuestions) {
      console.log('[KeywordCollector] 采集问题型关键词...');
      try {
        const questions = await relatedSearchCollector.extractQuestionKeywords(keyword);
        allQuestions.push(...questions);
        console.log(`[KeywordCollector] 问题型关键词: ${questions.length} 个`);
      } catch (error) {
        console.error('[KeywordCollector] 问题型关键词采集失败:', error);
      }
    }

    // 步骤5：采集YouTube视频数据
    console.log(`[KeywordCollector] 采集YouTube视频数据...`);
    const allVideos = [];

    for (const lang of languages) {
      try {
        const searchResults = await youtubeClient.searchInfluencers({
          query: keyword,
          maxResults: maxVideos / languages.length,
          type: 'video',
          order: 'relevance',
          relevanceLanguage: lang,
        });

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
          console.log(`[KeywordCollector] ${lang} 语言视频: ${videos.length} 个`);
        }
      } catch (error) {
        console.error(`[KeywordCollector] ${lang} 视频采集失败:`, error);
      }
    }

    console.log(`[KeywordCollector] 总计采集视频: ${allVideos.length} 个`);

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

    // 添加搜索建议
    allSuggestions.forEach(suggestion => {
      if (!mergedKeywords.has(suggestion)) {
        const type = keywordAnalyzer.analyzeKeywordType(suggestion);
        const intent = keywordAnalyzer.analyzeSearchIntent(suggestion);

        mergedKeywords.set(suggestion, {
          keyword: suggestion,
          type,
          categoryTags: ['autocomplete'],
          searchIntent: intent,
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

    const statistics = {
      totalKeywords: keywordsArray.length,
      totalSearchVolume,
      avgCompetition,
      highOpportunityCount,
    };

    console.log(`[KeywordCollector] 采集完成！总计: ${keywordsArray.length} 个关键词`);

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
}

// 导出单例
export const comprehensiveKeywordCollector = new ComprehensiveKeywordCollector();
