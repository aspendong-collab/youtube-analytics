import { db } from '@/storage/database/db';
import { eq } from 'drizzle-orm';
import { keywordExpansions, expandedKeywords } from '@/storage/database/shared/schema';
import {
  type ExpansionConfig,
  type ExpansionResponse,
  type ExpansionResult,
  KeywordDimension,
  type QuotaInfo,
} from './types';
import { ruleEngine } from './rules';
import { llmEngine } from './llm-engine';
import { dataMiningEngine } from './data-mining';
import { searchVolumeEstimator } from './search-estimator';
import { youtubeApiQuotaService } from '../youtube-api-quota';
import { nanoid } from 'nanoid';

/**
 * 关键词智能拓展服务
 * 整合规则引擎、LLM引擎、数据挖掘引擎
 */
export class KeywordExpansionService {
  /**
   * 智能拓展关键词
   */
  async expandKeywords(
    inputKeyword: string,
    config: ExpansionConfig
  ): Promise<ExpansionResponse> {
    const expansionId = nanoid();
    const allResults: Map<string, ExpansionResult> = new Map();
    const dimensions: Record<KeywordDimension, ExpansionResult[]> = {} as any;

    // 1. 规则引擎拓展
    if (config.useRuleEngine) {
      console.log('启用规则引擎...');
      const ruleResults = ruleEngine.applyAllRules(inputKeyword);

      for (const [dimension, results] of Object.entries(ruleResults)) {
        dimensions[dimension as KeywordDimension] = results;
        results.forEach(result => {
          const key = `${result.dimension}-${result.keyword}`;
          if (!allResults.has(key)) {
            allResults.set(key, result);
          }
        });
      }
    }

    // 2. LLM引擎拓展
    if (config.useLLMEngine) {
      console.log('启用LLM引擎...');
      try {
        const llmResults = await llmEngine.generateAllDimensions(inputKeyword);

        for (const [dimension, results] of Object.entries(llmResults)) {
          if (!dimensions[dimension as KeywordDimension]) {
            dimensions[dimension as KeywordDimension] = [];
          }

          results.forEach(result => {
            const key = `${result.dimension}-${result.keyword}`;
            if (!allResults.has(key)) {
              allResults.set(key, result);
              dimensions[dimension as KeywordDimension].push(result);
            }
          });
        }
      } catch (error) {
        console.error('LLM引擎失败:', error);
      }
    }

    // 3. 数据挖掘引擎
    if (config.useDataMining) {
      console.log('启用数据挖掘引擎...');
      try {
        // 从标签中提取
        const tagKeywords = await dataMiningEngine.extractFromTags(inputKeyword);
        tagKeywords.forEach(result => {
          const key = `${result.dimension}-${result.keyword}`;
          if (!allResults.has(key)) {
            allResults.set(key, result);
            if (!dimensions[result.dimension]) {
              dimensions[result.dimension] = [];
            }
            dimensions[result.dimension].push(result);
          }
        });

        // 从评论中提取
        const commentKeywords = await dataMiningEngine.extractFromComments(inputKeyword);
        commentKeywords.forEach(result => {
          const key = `${result.dimension}-${result.keyword}`;
          if (!allResults.has(key)) {
            allResults.set(key, result);
            if (!dimensions[result.dimension]) {
              dimensions[result.dimension] = [];
            }
            dimensions[result.dimension].push(result);
          }
        });
      } catch (error) {
        console.error('数据挖掘引擎失败:', error);
      }
    }

    // 转换为数组
    const allResultsArray = Array.from(allResults.values());

    // 4. 估算搜索量和竞争度（仅在启用数据挖掘时调用API）
    console.log('估算搜索量和竞争度...');
    const enhancedResults = config.useDataMining
      ? await searchVolumeEstimator.estimateBatch(allResultsArray)
      : allResultsArray.map(kw => ({
          ...kw,
          estimatedSearchVolume: Math.floor(Math.random() * 5000),
          estimatedCompetition: 0.5,
          commercialValue: kw.relevance * 0.4,
          recommendationScore: kw.relevance * 0.6,
        }));

    // 更新维度数据
    for (const dimension of Object.keys(dimensions)) {
      dimensions[dimension as KeywordDimension] = dimensions[dimension as KeywordDimension].map(kw => {
        const enhanced = enhancedResults.find(e => e.keyword === kw.keyword);
        return enhanced || kw;
      });
    }

    // 5. 保存到数据库
    await this.saveToDatabase(expansionId, inputKeyword, config, enhancedResults);

    // 6. 生成响应
    const topKeywords = enhancedResults
      .sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0))
      .slice(0, 20);

    // 7. 获取配额信息
    let quota: QuotaInfo | undefined;
    if (config.useDataMining) {
      try {
        quota = await youtubeApiQuotaService.getTodayQuota('search');
      } catch (error) {
        console.error('获取配额信息失败:', error);
      }
    }

    return {
      expansionId,
      inputKeyword,
      totalKeywords: enhancedResults.length,
      uniqueKeywords: enhancedResults.length,
      dimensions,
      topKeywords,
      quota, // 返回配额信息
    };
  }

  /**
   * 保存拓展结果到数据库
   */
  private async saveToDatabase(
    expansionId: string,
    inputKeyword: string,
    config: ExpansionConfig,
    results: ExpansionResult[]
  ): Promise<void> {
    try {
      // 保存拓展记录
      await db.insert(keywordExpansions).values({
        id: expansionId,
        inputKeyword,
        inputCategory: config.keywordCategory,
        expansionResult: {
          scenarios: results.filter(r => r.dimension === 'scenario').map(r => r.keyword),
          carriers: results.filter(r => r.dimension === 'carrier').map(r => r.keyword),
          states: results.filter(r => r.dimension === 'state').map(r => r.keyword),
          goals: results.filter(r => r.dimension === 'goal').map(r => r.keyword),
          methods: results.filter(r => r.dimension === 'method').map(r => r.keyword),
        },
        totalKeywords: results.length,
        uniqueKeywords: results.length,
        useRuleEngine: config.useRuleEngine,
        useLLMEngine: config.useLLMEngine,
        useDataMining: config.useDataMining,
        createdAt: new Date(),
      });

      // 保存关键词详情
      const keywordRows = results.map(result => ({
        id: nanoid(),
        expansionId,
        keyword: result.keyword,
        dimension: result.dimension,
        source: result.source,
        relevance: result.relevance,
        estimatedSearchVolume: result.estimatedSearchVolume || 0,
        estimatedCompetition: result.estimatedCompetition || 0,
        commercialValue: result.commercialValue || 0,
        recommendationScore: result.recommendationScore || 0,
        type: result.type || 'broad',
        intent: result.intent || 'info',
        relatedKeywords: result.relatedKeywords || [],
        sourceVideoIds: result.sourceVideoIds || [],
        createdAt: new Date(),
      }));

      await db.insert(expandedKeywords).values(keywordRows as any);
    } catch (error: any) {
      // 捕获数据库错误，但不影响主要功能
      if (error.code === '42P01') {
        console.error('数据库表不存在，跳过保存。请调用 /api/db/init 初始化数据库表');
      } else {
        console.error('保存到数据库失败:', error);
      }
      // 不再抛出错误，让主流程继续执行
    }
  }

  /**
   * 获取历史拓展记录
   */
  async getHistory(limit: number = 10): Promise<any[]> {
    try {
      const history = await db
        .select({
          id: keywordExpansions.id,
          inputKeyword: keywordExpansions.inputKeyword,
          inputCategory: keywordExpansions.inputKeyword,
          totalKeywords: keywordExpansions.totalKeywords,
          uniqueKeywords: keywordExpansions.uniqueKeywords,
          createdAt: keywordExpansions.createdAt,
        })
        .from(keywordExpansions)
        .orderBy(keywordExpansions.createdAt)
        .limit(limit);

      return history;
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 获取拓展详情
   */
  async getExpansionDetails(expansionId: string): Promise<any> {
    try {
      const expansion = await db
        .select()
        .from(keywordExpansions)
        .where(eq(keywordExpansions.id, expansionId))
        .limit(1);

      if (expansion.length === 0) {
        return null;
      }

      const keywords = await db
        .select()
        .from(expandedKeywords)
        .where(eq(expandedKeywords.expansionId, expansionId));

      return {
        ...expansion[0],
        keywords,
      };
    } catch (error) {
      console.error('获取拓展详情失败:', error);
      return null;
    }
  }
}

export const keywordExpansionService = new KeywordExpansionService();
