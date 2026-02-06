/**
 * 语义相似度关键词拓展服务
 * 基于大语言模型生成近义词、同义词、反义词等相关词
 * 并通过 YouTube API 验证这些词的热度和相关性
 */

import { google } from 'googleapis';
import { youtubeApiQuotaService } from '../youtube-api-quota';
import { youtubeApiKeyPool } from '../youtube-api-key-pool';
import { ExpansionResult, SupportedLanguage, YOUTUBE_LANGUAGE_CODES, YOUTUBE_REGION_CODES } from './types';

export interface SemanticExpansionOptions {
  maxResults?: number; // 最多返回的关键词数量
  minSearchVolume?: number; // 最小搜索量（观看数）
  excludeOriginal?: boolean; // 是否排除原始关键词
  includeSynonyms?: boolean; // 是否包含同义词
  includeAntonyms?: boolean; // 是否包含反义词
  includeRelated?: boolean; // 是否包含相关词
}

export interface SemanticKeyword {
  keyword: string;
  type: 'synonym' | 'antonym' | 'related' | 'variation';
  reason: string;
  confidence: number;
}

/**
 * 语义相似度关键词拓展服务
 */
export class SemanticExpansionService {
  private language: SupportedLanguage;

  constructor(language: SupportedLanguage = 'en') {
    this.language = language;
  }

  /**
   * 创建 YouTube API 客户端（使用 Key 池）
   */
  private createYoutubeClient(): any {
    const apiKey = youtubeApiKeyPool.getNextKey();

    if (!apiKey) {
      throw new Error('所有 YouTube API Key 都已用完，请等待明天配额重置或添加更多 Key');
    }

    return google.youtube({
      version: 'v3',
      auth: apiKey,
    });
  }

  /**
   * 使用 LLM 生成语义相关关键词
   */
  private async generateSemanticKeywords(
    originalKeyword: string,
    options: SemanticExpansionOptions
  ): Promise<SemanticKeyword[]> {
    try {
      console.log(`[语义拓展] 使用 LLM 生成关键词: ${originalKeyword}`);

      // 检查 DeepSeek API Key
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
      if (!deepseekApiKey) {
        console.warn('[语义拓展] 未找到 DEEPSEEK_API_KEY 环境变量，使用模拟数据');
        return this.generateMockKeywords(originalKeyword, options);
      }

      const prompt = `Please generate the following types of words for the keyword "${originalKeyword}" (do NOT include the original word "${originalKeyword}"):

1. Synonyms (5-8 words): words with similar meanings
2. Antonyms (3-5 words): words with opposite meanings (for product comparison scenarios)
3. Related words (8-10 words): highly relevant words users might also search for

Requirements:
- Return ONLY English words, do NOT include the original word
- Each word should be 1-4 words long
- Ensure words have actual search value
- Exclude brand names, proper names, place names

Please return in the following JSON format (do NOT include any other text):
{
  "synonyms": ["word1", "word2", "word3", ...],
  "ants": ["word1", "word2", "word3", ...],
  "related": ["word1", "word2", "word3", ...]
}`;

      // 调用 DeepSeek API
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的关键词分析专家，擅长生成语义相关的关键词。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[语义拓展] DeepSeek API 调用失败:', response.status, errorText);
        return this.generateMockKeywords(originalKeyword, options);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.warn('[语义拓展] DeepSeek API 返回空响应，使用模拟数据');
        return this.generateMockKeywords(originalKeyword, options);
      }

      // 解析 JSON 响应
      const llmResponse = JSON.parse(content);

      // 解析响应
      const keywords: SemanticKeyword[] = [];

      if (llmResponse.synonyms && options.includeSynonyms !== false) {
        llmResponse.synonyms.forEach((kw: string) => {
          keywords.push({
            keyword: kw.trim(),
            type: 'synonym',
            reason: '近义词',
            confidence: 0.85
          });
        });
      }

      if (llmResponse.ants && options.includeAntonyms) {
        llmResponse.ants.forEach((kw: string) => {
          keywords.push({
            keyword: kw.trim(),
            type: 'antonym',
            reason: '反义词',
            confidence: 0.7
          });
        });
      }

      if (llmResponse.related && options.includeRelated !== false) {
        llmResponse.related.forEach((kw: string) => {
          keywords.push({
            keyword: kw.trim(),
            type: 'related',
            reason: '相关词',
            confidence: 0.8
          });
        });
      }

      console.log(`[语义拓展] DeepSeek LLM 生成了 ${keywords.length} 个关键词`);
      return keywords;
    } catch (error) {
      console.error('[语义拓展] LLM 生成关键词失败:', error);
      return this.generateMockKeywords(originalKeyword, options);
    }
  }

  /**
   * 生成模拟关键词（当 LLM API 不可用时使用）
   */
  private generateMockKeywords(
    keyword: string,
    options: SemanticExpansionOptions
  ): SemanticKeyword[] {
    const lowerKeyword = keyword.toLowerCase();
    let response: { synonyms: string[]; ants: string[]; related: string[] };

    // 基于常见关键词的模拟响应
    const commonKeywords: Record<string, any> = {
      'pdf': {
        synonyms: ['document', 'file', 'ebook', 'paper', 'report', 'manual', 'guide'],
        ants: ['hardcopy', 'print', 'physical'],
        related: ['pdf reader', 'pdf editor', 'pdf converter', 'pdf creator', 'pdf viewer', 'document format']
      },
      'video': {
        synonyms: ['clip', 'footage', 'film', 'movie', 'recording', 'content'],
        ants: ['audio', 'text', 'image', 'photo'],
        related: ['video editing', 'video player', 'video converter', 'video recording', 'streaming', 'video format']
      },
      'image': {
        synonyms: ['picture', 'photo', 'graphic', 'visual', 'illustration', 'photograph'],
        ants: ['text', 'audio', 'sound'],
        related: ['image editing', 'image converter', 'photo editor', 'image format', 'graphic design']
      },
      'music': {
        synonyms: ['song', 'audio', 'sound', 'track', 'melody', 'composition'],
        ants: ['silence', 'quiet'],
        related: ['music player', 'music downloader', 'audio editing', 'music streaming', 'music production']
      },
      'converter': {
        synonyms: ['transformer', 'changer', 'modifier', 'adapter'],
        ants: [],
        related: ['file converter', 'format converter', 'video converter', 'audio converter', 'image converter']
      }
    };

    // 如果有预设响应，使用预设
    if (commonKeywords[lowerKeyword]) {
      response = commonKeywords[lowerKeyword];
    } else {
      // 否则生成通用响应
      response = {
        synonyms: [`${keyword} alternative`, `${keyword} solution`, `${keyword} tool`, `${keyword} software`],
        ants: [],
        related: [`best ${keyword}`, `${keyword} tutorial`, `${keyword} review`, `${keyword} comparison`]
      };
    }

    // 过滤掉原始关键词
    if (options.excludeOriginal !== false) {
      const originalLower = lowerKeyword;
      response.synonyms = response.synonyms.filter(kw =>
        !kw.toLowerCase().includes(originalLower)
      );
      response.ants = response.ants.filter(kw =>
        !kw.toLowerCase().includes(originalLower)
      );
      response.related = response.related.filter(kw =>
        !kw.toLowerCase().includes(originalLower)
      );
    }

    // 构建关键词列表
    const keywords: SemanticKeyword[] = [];

    if (response.synonyms && options.includeSynonyms !== false) {
      response.synonyms.forEach((kw: string) => {
        keywords.push({
          keyword: kw.trim(),
          type: 'synonym',
          reason: '近义词',
          confidence: 0.85
        });
      });
    }

    if (response.ants && options.includeAntonyms) {
      response.ants.forEach((kw: string) => {
        keywords.push({
          keyword: kw.trim(),
          type: 'antonym',
          reason: '反义词',
          confidence: 0.7
        });
      });
    }

    if (response.related && options.includeRelated !== false) {
      response.related.forEach((kw: string) => {
        keywords.push({
          keyword: kw.trim(),
          type: 'related',
          reason: '相关词',
          confidence: 0.8
        });
      });
    }

    console.log(`[语义拓展] 模拟生成了 ${keywords.length} 个关键词`);
    return keywords;
  }

  /**
   * 验证关键词的热度（通过 YouTube API 查询相关视频数量）
   */
  private async validateKeywordPopularity(
    keyword: string,
    minSearchVolume: number
  ): Promise<{
    isValid: boolean;
    estimatedVolume: number;
    averageViews: number;
  }> {
    try {
      // 检查配额
      const canCallSearch = await youtubeApiQuotaService.canMakeCall('search', 'search.list');
      if (!canCallSearch) {
        console.warn('[语义拓展] YouTube API search 配额已用完，跳过热度验证');
        return { isValid: true, estimatedVolume: 1000, averageViews: 10000 }; // 默认通过
      }

      const relevanceLanguage = YOUTUBE_LANGUAGE_CODES[this.language] || 'en';
      const regionCode = YOUTUBE_REGION_CODES[this.language] || 'US';

      // 使用 Key 池创建客户端
      const youtube = this.createYoutubeClient();

      // 搜索该关键词的相关视频
      const searchResponse = await Promise.race([
        youtube.search.list({
          q: keyword,
          part: ['snippet'],
          maxResults: 10,
          type: ['video'],
          relevanceLanguage,
          regionCode,
          order: 'relevance'
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('YouTube API search timeout (3s)')), 3000)
        )
      ]);

      // 记录 API 调用
      await youtubeApiQuotaService.recordApiCall('search', 'search.list', true, null, {
        keyword,
        maxResults: 10,
        relevanceLanguage,
        regionCode,
        purpose: 'semanticExpansion'
      });

      if (!searchResponse?.data?.items || searchResponse.data.items.length === 0) {
        return { isValid: false, estimatedVolume: 0, averageViews: 0 };
      }

      // 获取视频 ID 列表
      const videoIds = searchResponse.data.items
        .map((item: any) => item.id?.videoId)
        .filter(Boolean);

      if (videoIds.length === 0) {
        return { isValid: false, estimatedVolume: 0, averageViews: 0 };
      }

      // 获取视频统计数据
      const videosResponse = await youtube.videos.list({
        id: videoIds,
        part: ['statistics']
      });

      // 记录 API 调用
      await youtubeApiQuotaService.recordApiCall('videos', 'videos.list', true, null, {
        videoIds: videoIds.length,
        purpose: 'semanticExpansion'
      });

      if (!videosResponse?.data?.items) {
        return { isValid: false, estimatedVolume: 0, averageViews: 0 };
      }

      // 计算平均观看数
      const totalViews = videosResponse.data.items.reduce((sum: number, video: any) => {
        return sum + (parseInt(video.statistics?.viewCount) || 0);
      }, 0);

      const averageViews = Math.floor(totalViews / videosResponse.data.items.length);

      // 估算搜索量（基于视频数量和平均观看数）
      const estimatedVolume = videosResponse.data.items.length * Math.floor(averageViews / 100);

      // 检查是否达到最小热度阈值
      const isValid = estimatedVolume >= minSearchVolume;

      console.log(`[语义拓展] 关键词 "${keyword}" - 视频数: ${videosResponse.data.items.length}, 平均观看: ${averageViews}, 估算搜索量: ${estimatedVolume}, 有效: ${isValid}`);

      return { isValid, estimatedVolume, averageViews };
    } catch (error) {
      console.error(`[语义拓展] 验证关键词 "${keyword}" 热度失败:`, error instanceof Error ? error.message : String(error));

      // 如果是配额限制错误，默认返回有效
      if ((error as any).code === 429 || (error as any).code === 403) {
        await youtubeApiQuotaService.recordApiCall('search', 'search.list', false, (error as Error).message, {
          keyword,
          errorCode: (error as any).code,
          purpose: 'semanticExpansion'
        });
        return { isValid: true, estimatedVolume: 1000, averageViews: 10000 };
      }

      // 如果是超时错误，返回一个合理的估算值（假设关键词有一定的热度）
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn(`[语义拓展] YouTube API 超时，使用估算值: ${keyword}`);
        return { isValid: true, estimatedVolume: 500, averageViews: 5000 };
      }

      return { isValid: false, estimatedVolume: 0, averageViews: 0 };
    }
  }

  /**
   * 执行语义相似度关键词拓展
   */
  async expand(
    originalKeyword: string,
    options: SemanticExpansionOptions = {}
  ): Promise<ExpansionResult[]> {
    const {
      maxResults = 20,
      minSearchVolume = 1000,
      excludeOriginal = true,
      includeSynonyms = true,
      includeAntonyms = false,
      includeRelated = true
    } = options;

    console.log(`[语义拓展] 开始拓展关键词: ${originalKeyword}`);

    // 1. 使用 LLM 生成语义相关关键词
    const semanticKeywords = await this.generateSemanticKeywords(originalKeyword, {
      excludeOriginal,
      includeSynonyms,
      includeAntonyms,
      includeRelated
    });

    if (semanticKeywords.length === 0) {
      console.warn('[语义拓展] 未生成任何语义相关关键词');
      return [];
    }

    // 2. 验证每个关键词的热度
    const validatedKeywords: Array<{
      semantic: SemanticKeyword;
      validation: ReturnType<typeof this.validateKeywordPopularity extends Promise<infer T> ? T : never>;
    }> = [];

    for (const semantic of semanticKeywords) {
      const validation = await this.validateKeywordPopularity(semantic.keyword, minSearchVolume);

      // 等待验证结果
      const result = await validation;

      if (result.isValid) {
        validatedKeywords.push({
          semantic,
          validation: result
        });
      }
    }

    // 3. 按热度排序
    validatedKeywords.sort((a, b) =>
      (b.validation.estimatedVolume || 0) - (a.validation.estimatedVolume || 0)
    );

    // 4. 转换为 ExpansionResult 格式
    const results: ExpansionResult[] = validatedKeywords.map(({ semantic, validation }) => {
      const result: ExpansionResult = {
        keyword: semantic.keyword,
        dimension: 'semantic' as any, // 语义维度，会在后面映射到标准维度
        source: 'semanticExpansion',
        relevance: semantic.confidence,
        type: this.detectKeywordType(semantic.keyword),
        intent: this.detectKeywordIntent(semantic.keyword),
        estimatedSearchVolume: validation.estimatedVolume,
        estimatedCompetition: this.calculateCompetition(semantic.keyword, validation.averageViews),
        commercialValue: this.calculateCommercialValue(semantic.keyword, semantic.type),
        recommendationScore: 0, // 将在后面计算
        sourceVideoIds: [],
        metadata: {
          semanticType: semantic.type,
          reason: semantic.reason
        }
      };

      return result;
    });

    // 5. 计算推荐分数
    results.forEach(result => {
      result.recommendationScore = this.calculateRecommendationScore(result);
    });

    // 6. 限制返回数量
    const finalResults = results.slice(0, maxResults);

    console.log(`[语义拓展] 拓展完成，共 ${finalResults.length} 个有效关键词`);

    return finalResults;
  }

  /**
   * 检测关键词类型
   */
  private detectKeywordType(keyword: string): 'exact' | 'phrase' | 'broad' {
    const wordCount = keyword.split(/\s+/).length;

    if (wordCount === 1) {
      return 'exact';
    } else if (wordCount <= 3) {
      return 'phrase';
    } else {
      return 'broad';
    }
  }

  /**
   * 检测关键词意图
   */
  private detectKeywordIntent(keyword: string): 'info' | 'commercial' | 'transactional' {
    const lowerKeyword = keyword.toLowerCase();

    const commercialPatterns = [
      'buy', 'purchase', 'cheap', 'best', 'price', 'discount', 'sale', 'deal',
      'review', 'comparison', 'vs', 'top', 'recommend'
    ];

    const transactionalPatterns = [
      'download', 'free', 'online', 'converter', 'tool', 'software', 'app',
      'tutorial', 'how to', 'guide', 'learn'
    ];

    if (commercialPatterns.some(pattern => lowerKeyword.includes(pattern))) {
      return 'commercial';
    } else if (transactionalPatterns.some(pattern => lowerKeyword.includes(pattern))) {
      return 'transactional';
    } else {
      return 'info';
    }
  }

  /**
   * 计算竞争度
   */
  private calculateCompetition(keyword: string, averageViews: number): number {
    // 基于平均观看数计算竞争度
    // 观看数越高，竞争度越高
    const maxViews = 1000000; // 假设 100 万观看数为最高竞争度
    let competition = Math.min(averageViews / maxViews, 1);

    // 调整：长尾词竞争度更低
    const wordCount = keyword.split(/\s+/).length;
    if (wordCount >= 3) {
      competition *= 0.7;
    }

    return Math.round(competition * 100) / 100;
  }

  /**
   * 计算商业价值
   */
  private calculateCommercialValue(keyword: string, semanticType: string): number {
    let value = 0.5; // 基础价值

    // 同义词和近义词价值更高
    if (semanticType === 'synonym') {
      value += 0.2;
    }

    // 相关词中等价值
    if (semanticType === 'related') {
      value += 0.1;
    }

    // 反义词价值较低（主要用于对比场景）
    if (semanticType === 'antonym') {
      value -= 0.1;
    }

    return Math.min(Math.max(value, 0), 1);
  }

  /**
   * 计算推荐分数
   */
  private calculateRecommendationScore(result: ExpansionResult): number {
    // 综合多个因素计算推荐分数
    const relevanceWeight = 0.3;
    const volumeWeight = 0.4;
    const competitionWeight = 0.2;
    const commercialWeight = 0.1;

    // 归一化搜索量（0-1）
    const normalizedVolume = Math.min(result.estimatedSearchVolume / 100000, 1);

    // 计算分数
    const score =
      result.relevance * relevanceWeight +
      normalizedVolume * volumeWeight +
      (1 - result.estimatedCompetition) * competitionWeight +
      result.commercialValue * commercialWeight;

    return Math.round(score * 100) / 100;
  }
}
