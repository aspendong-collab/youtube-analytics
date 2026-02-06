import { ExpansionResult, YouTubeVideo, SupportedLanguage, YOUTUBE_LANGUAGE_CODES, YOUTUBE_REGION_CODES } from './types';
import { google } from 'googleapis';
import { youtubeApiQuotaService } from '../youtube-api-quota';

/**
 * 数据挖掘引擎：从YouTube数据中提取关键词
 */
export class DataMiningEngine {
  private youtube: any;
  private language: SupportedLanguage;

  constructor(language: SupportedLanguage = 'zh-CN') {
    this.language = language;
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
  }

  /**
   * 更新语言设置
   */
  setLanguage(language: SupportedLanguage): void {
    this.language = language;
  }

  // 包装YouTube API调用，添加超时控制
  private async callWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T | null> {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('YouTube API timeout')), timeoutMs);
      });

      return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
      console.error('[数据挖掘] YouTube API调用超时或失败:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }
  /**
   * 基于关键词特征动态计算竞争度
   * 考虑因素：关键词长度、关键词类型、相关性等
   */
  private calculateDynamicCompetition(
    keyword: string,
    originalKeyword: string,
    relevance: number
  ): number {
    let competition = 0.5; // 基础竞争度

    // 1. 基于关键词长度调整：长尾词竞争度更低
    const keywordLength = keyword.split(/\s+/).length;
    if (keywordLength >= 4) {
      competition -= 0.3; // 长尾词降低竞争度
    } else if (keywordLength >= 3) {
      competition -= 0.15; // 中等长度略微降低
    } else if (keywordLength === 1) {
      competition += 0.2; // 单词竞争度高
    }

    // 2. 基于相关性调整：相关性高的关键词竞争度可能更高
    competition += (relevance - 0.5) * 0.3; // 相关性对竞争度的影响范围 -0.15 到 +0.15

    // 3. 基于关键词特征调整
    const lowerKeyword = keyword.toLowerCase();
    
    // 品牌词（包含原始词的）竞争度高
    if (lowerKeyword.includes(originalKeyword.toLowerCase())) {
      competition += 0.1;
    }

    // 包含特定修饰词的关键词
    const highCompetitionPatterns = ['best', 'top', 'best', '推荐', '热门', '最佳'];
    const lowCompetitionPatterns = ['tutorial', 'how to', 'guide', '教程', '方法', '技巧'];

    if (highCompetitionPatterns.some(pattern => lowerKeyword.includes(pattern))) {
      competition += 0.1;
    }
    if (lowCompetitionPatterns.some(pattern => lowerKeyword.includes(pattern))) {
      competition -= 0.1;
    }

    // 4. 限制在 0-1 范围内
    return Math.max(0, Math.min(1, competition));
  }

  // 从视频标签中提取关键词
  async extractFromTags(keyword: string, maxResults: number = 20): Promise<ExpansionResult[]> {
    try {
      console.log(`[数据挖掘-标签] 开始提取关键词: ${keyword}`);
      // 检查配额
      const canCallSearch = await youtubeApiQuotaService.canMakeCall('search', 'search.list');
      if (!canCallSearch) {
        console.warn('YouTube API search 配额已用完，跳过标签挖掘');
        return [];
      }

      // 获取语言特定的参数
      const relevanceLanguage = YOUTUBE_LANGUAGE_CODES[this.language];
      const regionCode = YOUTUBE_REGION_CODES[this.language];

      // 使用YouTube搜索API查找相关视频
      const searchResponse = await this.callWithTimeout(
        this.youtube.search.list({
          q: keyword,
          part: ['snippet'],
          maxResults: maxResults,
          type: ['video'],
          relevanceLanguage,
          regionCode,
        }),
        15000 // 15秒超时
      );

      if (!searchResponse) {
        console.warn('YouTube API search 超时，跳过标签挖掘');
        return [];
      }

      // 记录 API 调用
      await youtubeApiQuotaService.recordApiCall('search', 'search.list', true, null, {
        keyword,
        maxResults,
        relevanceLanguage,
        regionCode,
        purpose: 'tagMining',
      });

      let videoIds: string[] = [];
      if (searchResponse.data.items) {
        videoIds = searchResponse.data.items
          .map((item: any) => item.id?.videoId)
          .filter(Boolean);
      }

      if (videoIds.length === 0) {
        return [];
      }

      // 检查 videos API 配额
      const canCallVideos = await youtubeApiQuotaService.canMakeCall('videos', 'videos.list');
      if (!canCallVideos) {
        console.warn('YouTube API videos 配额已用完，跳过标签提取');
        return [];
      }

      // 获取视频详情（包含标签）
      const videosResponse = await this.callWithTimeout(
        this.youtube.videos.list({
          id: videoIds,
          part: ['snippet', 'statistics'],
          relevanceLanguage,
        }),
        15000 // 15秒超时
      );

      if (!videosResponse) {
        console.warn('YouTube API videos 超时，跳过标签提取');
        return [];
      }

      // 记录 API 调用
      await youtubeApiQuotaService.recordApiCall('videos', 'videos.list', true, null, {
        videoIds: videoIds.length,
        relevanceLanguage,
        purpose: 'tagMining',
      });

      const keywords: ExpansionResult[] = [];
      const allTags: string[] = [];

      if (videosResponse.data.items) {
        for (const video of videosResponse.data.items) {
          const snippet = video.snippet;
          const stats = video.statistics;

          // 提取标签
          const tags = snippet?.tags || [];
          allTags.push(...tags);

          // 为每个标签创建关键词结果
          for (const tag of tags) {
            const relevance = this.calculateTagRelevance(keyword, tag);
            keywords.push({
              keyword: tag,
              dimension: this.detectDimension(tag),
              source: 'tagMining',
              relevance,
              type: 'broad',
              intent: 'info',
              estimatedSearchVolume: stats?.viewCount ? parseInt(stats.viewCount) / 1000 : 0,
              estimatedCompetition: this.calculateDynamicCompetition(tag, keyword, relevance),
              commercialValue: 0.3,
              recommendationScore: 0,
              sourceVideoIds: [video.id || ''],
            });
          }
        }
      }

      // 去重
      const uniqueKeywords = this.deduplicateKeywords(keywords);
      console.log(`[数据挖掘-标签] 提取完成，共 ${uniqueKeywords.length} 个关键词`);
      return uniqueKeywords.slice(0, maxResults);
    } catch (error: any) {
      console.error('标签提取失败:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
      
      if (error.code === 429 || error.code === 403) {
        await youtubeApiQuotaService.recordApiCall('search', 'search.list', false, error.message, {
          keyword,
          errorCode: error.code,
          purpose: 'tagMining',
        });
      }
      
      return [];
    }
  }

  // 从视频评论中提取关键词
  async extractFromComments(keyword: string, maxResults: number = 15): Promise<ExpansionResult[]> {
    try {
      console.log(`[数据挖掘-评论] 开始提取关键词: ${keyword}`);
      // 检查配额
      const canCallSearch = await youtubeApiQuotaService.canMakeCall('search', 'search.list');
      if (!canCallSearch) {
        console.warn('YouTube API search 配额已用完，跳过评论挖掘');
        return [];
      }

      // 获取语言特定的参数
      const relevanceLanguage = YOUTUBE_LANGUAGE_CODES[this.language];
      const regionCode = YOUTUBE_REGION_CODES[this.language];

      // 搜索相关视频
      const searchResponse = await this.callWithTimeout(
        this.youtube.search.list({
          q: keyword,
          part: ['snippet'],
          maxResults: 5,
          type: ['video'],
          relevanceLanguage,
          regionCode,
        }),
        15000 // 15秒超时
      );

      if (!searchResponse) {
        console.warn('YouTube API search 超时，跳过评论挖掘');
        return [];
      }

      // 记录 API 调用
      await youtubeApiQuotaService.recordApiCall('search', 'search.list', true, null, {
        keyword,
        maxResults: 5,
        relevanceLanguage,
        regionCode,
        purpose: 'commentMining',
      });

      let videoIds: string[] = [];
      if (searchResponse.data.items) {
        videoIds = searchResponse.data.items
          .map((item: any) => item.id?.videoId)
          .filter(Boolean);
      }

      if (videoIds.length === 0) {
        return [];
      }

      const keywords: ExpansionResult[] = [];

      // 检查评论 API 配额
      const canCallComments = await youtubeApiQuotaService.canMakeCall('commentThreads', 'commentThreads.list');
      if (!canCallComments) {
        console.warn('YouTube API commentThreads 配额已用完，跳过评论提取');
        return [];
      }

      // 获取每个视频的评论
      for (const videoId of videoIds.slice(0, 3)) {
        const commentsResponse = await this.callWithTimeout(
          this.youtube.commentThreads.list({
            videoId,
            part: ['snippet'],
            maxResults: 20,
            order: 'relevance',
          }),
          15000 // 15秒超时
        );

        if (!commentsResponse) {
          console.warn(`YouTube API commentThreads 超时，跳过视频 ${videoId} 的评论提取`);
          continue;
        }

        // 记录 API 调用
        await youtubeApiQuotaService.recordApiCall('commentThreads', 'commentThreads.list', true, null, {
          videoId,
          maxResults: 20,
          purpose: 'commentMining',
        });

        if (commentsResponse.data.items) {
          for (const thread of commentsResponse.data.items) {
            const comment = thread.snippet?.topLevelComment?.snippet;
            const text = comment?.textDisplay || '';

            // 简单的关键词提取（基于常见短语模式）
            const extractedKeywords = this.extractKeywordsFromComment(text, keyword);
            extractedKeywords.forEach(kw => {
              const relevance = 0.6;
              keywords.push({
                keyword: kw,
                dimension: this.detectDimension(kw),
                source: 'commentMining',
                relevance,
                type: this.detectKeywordType(kw),
                intent: 'info',
                estimatedSearchVolume: 0,
                estimatedCompetition: this.calculateDynamicCompetition(kw, keyword, relevance),
                commercialValue: 0.2,
                recommendationScore: 0,
                sourceVideoIds: [videoId],
              });
            });
          }
        }
      }

      // 去重
      const uniqueKeywords = this.deduplicateKeywords(keywords);
      console.log(`[数据挖掘-评论] 提取完成，共 ${uniqueKeywords.length} 个关键词`);
      return uniqueKeywords.slice(0, maxResults);
    } catch (error: any) {
      console.error('评论提取失败:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
      
      if (error.code === 429 || error.code === 403) {
        await youtubeApiQuotaService.recordApiCall('search', 'search.list', false, error.message, {
          keyword,
          errorCode: error.code,
          purpose: 'commentMining',
        });
      }
      
      return [];
    }
  }

  // 从评论文本中提取关键词
  private extractKeywordsFromComment(text: string, keyword: string): string[] {
    const keywords: string[] = [];

    // 常见的关键词模式
    const patterns = [
      /如何([^，。！？\n]{2,10})/g,
      /怎么([^，。！？\n]{2,10})/g,
      /([^，。！？\n]{2,8})方法/g,
      /([^，。！？\n]{2,8})技巧/g,
      /([^，。！？\n]{2,8})教程/g,
      /([^，。！？\n]{2,8})问题/g,
      /([^，。！？\n]{2,8})建议/g,
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          keywords.push(keyword + match[1]);
        }
      }
    }

    // 查找包含关键词的短语
    const keywordPatterns = [
      new RegExp(`${keyword}([^，。！？\n]{2,8})`, 'g'),
      new RegExp(`([^，。！？\n]{2,8})${keyword}`, 'g'),
    ];

    for (const pattern of keywordPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[0] && match[0].length <= 20) {
          keywords.push(match[0]);
        }
      }
    }

    return keywords;
  }

  // 计算标签相关性
  private calculateTagRelevance(originalKeyword: string, tag: string): number {
    if (!tag) return 0;

    // 完全匹配
    if (tag === originalKeyword) return 1.0;

    // 包含原始关键词
    if (tag.includes(originalKeyword)) {
      return 0.9;
    }

    // 原始关键词包含标签
    if (originalKeyword.includes(tag)) {
      return 0.8;
    }

    // 相似度计算
    const similarity = this.calculateSimilarity(originalKeyword, tag);
    return similarity * 0.6;
  }

  // 计算字符串相似度
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1);
    const set2 = new Set(str2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  // 检测关键词维度
  private detectDimension(keyword: string): 'scenario' | 'carrier' | 'state' | 'goal' | 'method' {
    const scenarioWords = ['使用', '场景', '日常', '办公', '家用', '学习', '工作'];
    const carrierWords = ['手机', '电脑', '平板', 'iPhone', 'Android', 'Windows', 'Mac', '系统', '软件', 'App'];
    const stateWords = ['免费', '付费', '推荐', '热门', '最新', '最佳', '高级', '专业'];
    const goalWords = ['赚钱', '学习', '教程', '入门', '精通', '变现', '副业'];
    const methodWords = ['怎么', '如何', '方法', '技巧', '教程', '步骤', '流程'];

    const lowerKeyword = keyword.toLowerCase();

    if (scenarioWords.some(w => keyword.includes(w))) return 'scenario';
    if (carrierWords.some(w => keyword.includes(w))) return 'carrier';
    if (stateWords.some(w => keyword.includes(w))) return 'state';
    if (goalWords.some(w => keyword.includes(w))) return 'goal';
    if (methodWords.some(w => keyword.includes(w))) return 'method';

    return 'scenario'; // 默认
  }

  // 检测关键词类型
  private detectKeywordType(keyword: string): 'broad' | 'long-tail' | 'question' | 'brand' {
    if (keyword.includes('？') || keyword.includes('?') || keyword.includes('怎么') || keyword.includes('如何')) {
      return 'question';
    }
    if (keyword.split(/\s+/).length > 3 || keyword.length > 15) {
      return 'long-tail';
    }
    return 'broad';
  }

  // 去重关键词
  private deduplicateKeywords(keywords: ExpansionResult[]): ExpansionResult[] {
    const seen = new Set<string>();
    const unique: ExpansionResult[] = [];

    for (const kw of keywords) {
      const normalized = kw.keyword.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(kw);
      }
    }

    return unique;
  }
}
