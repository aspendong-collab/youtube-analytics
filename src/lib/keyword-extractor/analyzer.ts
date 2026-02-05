/**
 * 关键词分析器
 * 计算竞争度、难度、机会等指标
 */

import type {
  EnhancedKeywordData,
  CompetitionLevel,
  TrendType,
  SearchIntent,
  KeywordType,
} from './types';

/**
 * 关键词分析器
 */
class KeywordAnalyzer {
  /**
   * 分析关键词类型
   */
  analyzeKeywordType(keyword: string): KeywordType {
    const lower = keyword.toLowerCase();
    const wordCount = lower.split(' ').filter(w => w.length > 0).length;

    // 问题型
    if (/^(what|how|why|when|where|which|can|should|does|is|are|will|best|top)\s/.test(lower) || lower.includes('?')) {
      return 'question';
    }

    // 比较型
    if (/ vs | versus | or /i.test(lower)) {
      return 'comparison';
    }

    // 列表型
    if (/\d+\s*(best|top|ways|tips|methods|apps|tools|techniques|strategies)/i.test(lower)) {
      return 'list';
    }

    // 地点型
    if (/\s(in|at|from|to)\s+[a-z\s]+(country|usa|uk|us|china|japan|korea|india|europe|asia|africa|america)/i.test(lower)) {
      return 'location';
    }

    // 长尾（3个词以上）
    if (wordCount >= 3) {
      return 'longtail';
    }

    // 词组
    if (wordCount === 2) {
      return 'phrase';
    }

    // 核心
    return 'core';
  }

  /**
   * 分析搜索意图
   */
  analyzeSearchIntent(keyword: string): SearchIntent {
    const lower = keyword.toLowerCase();

    // 信息类
    if (/^(what|how|why|when|where|which|who|guide|tutorial|tips|tricks|methods|techniques|strategies)/i.test(lower)) {
      return 'informational';
    }

    // 商业类
    if (/(review|comparison|best|top|vs|versus|pricing|features|benefits|pros\s+cons|deal|discount|cheap|affordable|expensive)/i.test(lower)) {
      return 'commercial';
    }

    // 品牌类
    if (/(youtube|channel|official|website|login|signup|download|app|store)/i.test(lower)) {
      return 'navigational';
    }

    // 交易类
    if (/(buy|purchase|order|get|download|rent|hire|book|reserve|subscribe|sign\s+up|register|free|trial|demo)/i.test(lower)) {
      return 'transactional';
    }

    // 默认信息类
    return 'informational';
  }

  /**
   * 估算搜索量（基于YouTube数据的简单估算）
   */
  estimateSearchVolume(videoCount: number, avgViews: number): number {
    // 简单估算公式：相关视频数量 * 平均观看量的对数
    if (videoCount === 0 || avgViews === 0) {
      return 0;
    }

    const base = Math.log10(avgViews + 1) * videoCount * 100;
    return Math.min(Math.floor(base), 1000000); // 最大不超过100万
  }

  /**
   * 计算竞争度
   */
  calculateCompetitionLevel(videoCount: number, avgViews: number): CompetitionLevel {
    // 基于视频数量和平均观看量判断竞争度
    if (videoCount > 10000 || avgViews > 1000000) {
      return 'high';
    } else if (videoCount > 1000 || avgViews > 100000) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 计算竞争度评分（0-100）
   */
  calculateCompetitionScore(videoCount: number, avgViews: number): number {
    if (videoCount === 0 && avgViews === 0) {
      return 0;
    }

    // 归一化到0-100
    const videoScore = Math.min(videoCount / 10000 * 100, 100);
    const viewScore = Math.min(avgViews / 1000000 * 100, 100);

    return (videoScore * 0.4 + viewScore * 0.6);
  }

  /**
   * 分析趋势（基于发布时间的简单判断）
   */
  analyzeTrend(recentVideoRatio: number): { trend: TrendType; trendScore: number } {
    // recentVideoRatio: 最近30天视频占比

    if (recentVideoRatio > 0.5) {
      return { trend: 'rising', trendScore: Math.min(recentVideoRatio * 100, 100) };
    } else if (recentVideoRatio > 0.2) {
      return { trend: 'stable', trendScore: 0 };
    } else {
      return { trend: 'declining', trendScore: -Math.min((1 - recentVideoRatio) * 100, 100) };
    }
  }

  /**
   * 计算难度评分（0-100，越高越难）
   */
  calculateDifficultyScore(
    competitionScore: number,
    searchVolume: number,
    avgViews: number
  ): number {
    // 综合考虑竞争度、搜索量和平均观看量
    const competitionWeight = 0.5;
    const viewWeight = 0.3;
    const volumeWeight = 0.2;

    // 归一化搜索量影响（搜索量越大，竞争越大）
    const volumeFactor = Math.min(searchVolume / 100000 * 100, 100);

    const difficulty =
      competitionScore * competitionWeight +
      (avgViews > 500000 ? 100 : avgViews / 500000 * 100) * viewWeight +
      volumeFactor * volumeWeight;

    return Math.min(Math.floor(difficulty), 100);
  }

  /**
   * 计算机会评分（0-100，越高越好）
   */
  calculateOpportunityScore(
    searchVolume: number,
    competitionScore: number,
    trendScore: number,
    difficultyScore: number
  ): number {
    // 搜索量大、竞争小、上升趋势、难度低 = 机会大
    const volumeScore = Math.min(searchVolume / 10000 * 50, 100);
    const competitionScoreFactor = 100 - competitionScore;
    const trendFactor = Math.max(trendScore, 0); // 上升趋势加分
    const difficultyFactor = 100 - difficultyScore;

    const opportunity =
      volumeScore * 0.3 +
      competitionScoreFactor * 0.25 +
      trendFactor * 0.25 +
      difficultyFactor * 0.2;

    return Math.min(Math.floor(opportunity), 100);
  }

  /**
   * 生成推荐内容类型
   */
  recommendContentType(keyword: string, type: KeywordType, intent: SearchIntent): 'tutorial' | 'vlog' | 'review' | 'list' | 'comparison' | 'other' {
    const lower = keyword.toLowerCase();

    if (intent === 'informational') {
      if (/tutorial|guide|how\s+to|learn|study/i.test(lower)) {
        return 'tutorial';
      } else if (/with\s+me|routine|day\s+in\s+the\s+life|journey/i.test(lower)) {
        return 'vlog';
      }
    } else if (intent === 'commercial') {
      if (/review|vs|versus|comparison/i.test(lower)) {
        return 'review';
      } else if (/comparison|vs/i.test(lower)) {
        return 'comparison';
      }
    } else if (type === 'list') {
      return 'list';
    }

    return 'other';
  }

  /**
   * 生成推荐标题模板
   */
  generateTitleTemplates(keyword: string, contentType: string): string[] {
    const templates: Record<string, string[]> = {
      tutorial: [
        `How to ${keyword} (Step-by-Step Guide)`,
        `${keyword} Tutorial for Beginners`,
        `Master ${keyword} in 10 Minutes`,
        `The Complete ${keyword} Guide`,
        `Easy ${keyword} Tips & Tricks`,
      ],
      vlog: [
        `${keyword} With Me | A Day in My Life`,
        `My ${keyword} Journey: From Beginner to Pro`,
        `${keyword} Routine That Changed My Life`,
        `Behind the Scenes: How I ${keyword}`,
      ],
      review: [
        `${keyword} Review: Is It Worth It?`,
        `Best ${keyword} of 2024`,
        `${keyword} Pros and Cons | Honest Review`,
        `I Tested ${keyword} for 30 Days - Here's What Happened`,
      ],
      list: [
        `10 Best ${keyword} Tips You Need to Know`,
        `Top 5 ${keyword} Tools for Beginners`,
        `7 ${keyword} Mistakes to Avoid`,
        `The Ultimate ${keyword} Checklist`,
      ],
      comparison: [
        `${keyword} vs Alternative: Which is Better?`,
        `Best ${keyword} Compared: 2024 Review`,
        `${keyword} A vs B: Complete Comparison`,
      ],
      other: [
        `${keyword}: Everything You Need to Know`,
        `The Truth About ${keyword}`,
        `${keyword} Secrets Nobody Tells You`,
      ],
    };

    return templates[contentType] || templates.other;
  }

  /**
   * 估算CPC（基于YouTube平均值）
   */
  estimateCPC(keyword: string, searchVolume: number): number {
    // 基于关键词类型和搜索量估算CPC
    const lower = keyword.toLowerCase();

    // 商业类关键词CPC更高
    if (/buy|purchase|price|cost|review|best|top/i.test(lower)) {
      return Math.min(searchVolume / 10000 * 5, 10); // 最高$10
    }

    // 信息类关键词CPC较低
    if (/tutorial|guide|how\s+to|learn/i.test(lower)) {
      return Math.min(searchVolume / 20000 * 2, 3); // 最高$3
    }

    // 默认值
    return Math.min(searchVolume / 15000 * 3, 5); // 最高$5
  }

  /**
   * 推荐视频时长
   */
  recommendDuration(contentType: string, type: KeywordType): string {
    const durationMap: Record<string, string> = {
      tutorial: '10-20 minutes',
      vlog: '15-30 minutes',
      review: '8-15 minutes',
      list: '12-20 minutes',
      comparison: '10-18 minutes',
      other: '10-15 minutes',
    };

    return durationMap[contentType] || '10-15 minutes';
  }

  /**
   * 推荐封面风格
   */
  recommendThumbnailStyle(contentType: string): string {
    const styleMap: Record<string, string> = {
      tutorial: 'Clean text overlay + clear subject image',
      vlog: 'Personal photo + lifestyle elements',
      review: 'Product comparison + star rating',
      list: 'Numbered list icons + bold title',
      comparison: 'Side-by-side comparison + checkmarks',
      other: 'Bold title + engaging visual',
    };

    return styleMap[contentType] || 'Bold title + engaging visual';
  }
}

// 导出单例
export const keywordAnalyzer = new KeywordAnalyzer();
