/**
 * 关键词提取工具
 */
import { LANGUAGE_CONFIGS, getRegionCode } from './languages';

/**
 * 关键词来源
 */
export type KeywordSource = 'title' | 'description' | 'tags' | 'channel';

/**
 * 关键词数据
 */
export interface KeywordData {
  keyword: string;
  frequency: number;
  sources: KeywordSource[];
  avgViews: number;
  avgEngagementRate: number;
  avgLikes: number;
  avgComments: number;
  videoCount: number;
  recentVideoCount: number;
  trend: 'up' | 'down' | 'stable';
  language: string;
}

/**
 * 视频数据（简化版）
 */
export interface VideoData {
  videoId: string;
  title: string;
  description: string;
  tags?: string[];
  channelId: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  language?: string;
}

/**
 * 关键词提取结果
 */
export interface ExtractionResult {
  keyword: string;
  language: string;
  totalVideos: number;
  keywords: KeywordData[];
  summary: {
    totalKeywords: number;
    avgViews: number;
    avgEngagementRate: number;
    topKeyword: string;
  };
}

/**
 * 关键词提取器
 */
class KeywordExtractor {
  /**
   * 从视频数据中提取关键词
   */
  extractFromVideos(
    videos: VideoData[],
    language: string
  ): KeywordData[] {
    const keywordMap = new Map<string, KeywordData>();

    videos.forEach(video => {
      // 1. 从标题提取
      const titleKeywords = this.extractKeywords(video.title, language);
      this.updateKeywordMap(keywordMap, titleKeywords, video, 'title');

      // 2. 从描述提取
      const descKeywords = this.extractKeywords(video.description, language);
      this.updateKeywordMap(keywordMap, descKeywords, video, 'description');

      // 3. 从标签提取
      if (video.tags && video.tags.length > 0) {
        const tagKeywords = this.extractKeywords(video.tags.join(' '), language);
        this.updateKeywordMap(keywordMap, tagKeywords, video, 'tags');
      }
    });

    // 转换为数组并排序
    return Array.from(keywordMap.values())
      .sort((a, b) => {
        // 按频率和平均热度综合排序
        const scoreA = a.frequency * 0.6 + (a.avgViews / 1000000) * 0.4;
        const scoreB = b.frequency * 0.6 + (b.avgViews / 1000000) * 0.4;
        return scoreB - scoreA;
      });
  }

  /**
   * 从文本中提取关键词
   */
  private extractKeywords(text: string, language: string): string[] {
    const config = LANGUAGE_CONFIGS[language];
    if (!config) return [];

    let keywords: string[] = [];

    // 根据语言使用不同的分词策略
    if (language === 'zh' || language === 'zh-TW') {
      // 中文分词（简单版：按字符分词，实际项目应使用专业分词库）
      keywords = this.extractChineseKeywords(text);
    } else if (language === 'ja') {
      // 日语分词
      keywords = this.extractJapaneseKeywords(text);
    } else if (language === 'ko') {
      // 韩语分词
      keywords = this.extractKoreanKeywords(text);
    } else {
      // 其他语言按空格分词
      keywords = this.extractSpaceBasedKeywords(text, language);
    }

    // 过滤停用词和短词
    const stopWords = config.stopWords || [];
    return keywords.filter(kw => 
      kw.length >= 2 && 
      !stopWords.includes(kw.toLowerCase()) &&
      !/^\d+$/.test(kw) && // 排除纯数字
      !/^[^a-zA-Z\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+$/.test(kw) // 排除纯符号
    );
  }

  /**
   * 中文关键词提取（简化版）
   */
  private extractChineseKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // 提取2-4个字的连续汉字
    for (let i = 0; i < text.length - 1; i++) {
      for (let len = 2; len <= 4; len++) {
        if (i + len <= text.length) {
          const substring = text.substring(i, i + len);
          if (/^[\u4e00-\u9fa5]{2,4}$/.test(substring)) {
            keywords.push(substring);
          }
        }
      }
    }

    // 提取英文单词
    const englishWords = text.match(/[a-zA-Z]{2,}/g) || [];
    keywords.push(...englishWords);

    return keywords;
  }

  /**
   * 日语关键词提取（简化版）
   */
  private extractJapaneseKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // 提取汉字（2-4个字）
    for (let i = 0; i < text.length - 1; i++) {
      for (let len = 2; len <= 4; len++) {
        if (i + len <= text.length) {
          const substring = text.substring(i, i + len);
          if (/^[\u4e00-\u9fa5]{2,4}$/.test(substring)) {
            keywords.push(substring);
          }
        }
      }
    }

    // 提取片假名
    const katakana = text.match(/[\u30a0-\u30ff]{2,}/g) || [];
    keywords.push(...katakana);

    // 提取英文单词
    const englishWords = text.match(/[a-zA-Z]{2,}/g) || [];
    keywords.push(...englishWords);

    return keywords;
  }

  /**
   * 韩语关键词提取（简化版）
   */
  private extractKoreanKeywords(text: string): string[] {
    const keywords: string[] = [];
    
    // 提取韩语单词（2-6个字）
    for (let i = 0; i < text.length - 1; i++) {
      for (let len = 2; len <= 6; len++) {
        if (i + len <= text.length) {
          const substring = text.substring(i, i + len);
          if (/^[\uac00-\ud7af]{2,6}$/.test(substring)) {
            keywords.push(substring);
          }
        }
      }
    }

    // 提取英文单词
    const englishWords = text.match(/[a-zA-Z]{2,}/g) || [];
    keywords.push(...englishWords);

    return keywords;
  }

  /**
   * 基于空格的关键词提取
   */
  private extractSpaceBasedKeywords(text: string, language: string): string[] {
    const config = LANGUAGE_CONFIGS[language];
    const stopWords = config?.stopWords || [];

    return text
      .toLowerCase()
      .split(/[\s,.!?;:"'()<>[\]{}\/\\|`~@#$%^&*+=_-]+/)
      .map(word => word.trim())
      .filter(word => 
        word.length >= 2 && 
        !stopWords.includes(word) &&
        !/^\d+$/.test(word) &&
        /^[a-zA-Z\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+$/.test(word)
      );
  }

  /**
   * 更新关键词映射
   */
  private updateKeywordMap(
    map: Map<string, KeywordData>,
    keywords: string[],
    video: VideoData,
    source: KeywordSource
  ): void {
    keywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase().trim();
      
      if (!map.has(normalizedKeyword)) {
        map.set(normalizedKeyword, {
          keyword: normalizedKeyword,
          frequency: 0,
          sources: [],
          avgViews: 0,
          avgEngagementRate: 0,
          avgLikes: 0,
          avgComments: 0,
          videoCount: 0,
          recentVideoCount: 0,
          trend: 'stable',
          language: video.language || 'en',
        });
      }

      const data = map.get(normalizedKeyword)!;
      
      // 更新频率
      data.frequency++;
      
      // 更新来源
      if (!data.sources.includes(source)) {
        data.sources.push(source);
      }

      // 累加统计数据
      const engagementRate = video.viewCount > 0 
        ? ((video.likeCount + video.commentCount) / video.viewCount) * 100 
        : 0;

      data.avgViews = (data.avgViews * data.videoCount + video.viewCount) / (data.videoCount + 1);
      data.avgEngagementRate = (data.avgEngagementRate * data.videoCount + engagementRate) / (data.videoCount + 1);
      data.avgLikes = (data.avgLikes * data.videoCount + video.likeCount) / (data.videoCount + 1);
      data.avgComments = (data.avgComments * data.videoCount + video.commentCount) / (data.videoCount + 1);
      data.videoCount++;

      // 检查是否为近期视频（30天内）
      const publishedDate = new Date(video.publishedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 30) {
        data.recentVideoCount++;
      }
    });
  }

  /**
   * 计算关键词趋势
   */
  private calculateTrend(keywordData: KeywordData): 'up' | 'down' | 'stable' {
    const recentRatio = keywordData.recentVideoCount / keywordData.videoCount;
    
    if (recentRatio > 0.3) {
      return 'up';
    } else if (recentRatio < 0.1) {
      return 'down';
    } else {
      return 'stable';
    }
  }

  /**
   * 分类关键词
   */
  categorizeKeyword(keyword: string, language: string): string {
    // 基于关键词特征的简单分类
    const lowerKeyword = keyword.toLowerCase();

    // 教程类
    if (lowerKeyword.includes('tutorial') || 
        lowerKeyword.includes('教程') || 
        lowerKeyword.includes('how to') ||
        lowerKeyword.includes('ガイド') ||
        lowerKeyword.includes('가이드')) {
      return 'tutorial';
    }

    // 热门类
    if (keywordData => keywordData.avgViews > 1000000) {
      return 'hot';
    }

    // 长尾类
    if (keyword.split(' ').length > 2 || keyword.length > 10) {
      return 'long-tail';
    }

    // 核心类
    return 'core';
  }
}

// 导出单例
export const keywordExtractor = new KeywordExtractor();
