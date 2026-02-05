/**
 * 关键词数据接口
 * 完善的关键词分类体系
 */

/**
 * 搜索意图类型
 */
export type SearchIntent =
  | 'informational'  // 信息类：学习、研究、了解
  | 'commercial'     // 商业类：比较、考虑购买
  | 'navigational'   // 品牌类：寻找特定品牌/频道
  | 'transactional'; // 交易类：准备行动/购买

/**
 * 关键词类型
 */
export type KeywordType =
  | 'core'        // 核心关键词（1-2个词）
  | 'longtail'    // 长尾关键词（3个词以上）
  | 'question'    // 问题型关键词
  | 'comparison'  // 比较型关键词
  | 'list'        // 列表型关键词（Top N, Best N）
  | 'location'    // 地点型关键词
  | 'phrase';     // 词组

/**
 * 竞争度
 */
export type CompetitionLevel = 'low' | 'medium' | 'high';

/**
 * 趋势类型
 */
export type TrendType = 'rising' | 'stable' | 'declining';

/**
 * 分类标签
 */
export type CategoryTag =
  | 'autocomplete'    // 搜索建议
  | 'related'         // 相关搜索
  | 'competitor'      // 竞品分析
  | 'question'        // 问题型
  | 'longtail'        // 长尾
  | 'trending'        // 趋势
  | 'opportunity';    // 机会（蓝海）

/**
 * 完善的关键词数据
 */
export interface EnhancedKeywordData {
  // 基础信息
  keyword: string;
  type: KeywordType;
  categoryTags: CategoryTag[];

  // 搜索意图
  searchIntent: SearchIntent;

  // 统计数据
  searchVolume: number;        // 月搜索量（估算）
  competitionLevel: CompetitionLevel;
  competitionScore: number;     // 竞争度评分（0-100）
  videoCount: number;          // YouTube上相关视频数
  avgViews: number;            // 相关视频平均观看量
  cpc: number;                 // 广告竞价（估算，单位：美元）

  // 趋势
  trend: TrendType;
  trendScore: number;          // 趋势评分（-100 到 100）

  // 难度和机会
  difficultyScore: number;     // 难度评分（0-100）
  opportunityScore: number;    // 机会评分（0-100）

  // 视频内容建议
  recommendedContentType: 'tutorial' | 'vlog' | 'review' | 'list' | 'comparison' | 'other';
  recommendedTitleTemplates: string[];  // 推荐标题模板
  recommendedDuration: string;  // 推荐时长
  thumbnailStyle: string;       // 推荐封面风格

  // 原始数据
  sources: string[];           // 数据来源
  frequency: number;           // 在采集数据中出现的频率

  // 相关性
  relevanceScore: number;      // 与原始关键词的相关性（0-1）

  // 语言
  language: string;
}

/**
 * 分类统计
 */
export interface CategoryStats {
  totalKeywords: number;
  categories: {
    [key in KeywordType]?: number;
  };
  intents: {
    [key in SearchIntent]?: number;
  };
  competitions: {
    [key in CompetitionLevel]?: number;
  };
  tags: {
    [key in CategoryTag]?: number;
  };
}

/**
 * 批量采集结果
 */
export interface BatchCollectionResult {
  keyword: string;
  totalKeywords: number;
  keywords: EnhancedKeywordData[];
  suggestions: string[];
  relatedSearches: string[];
  questions: string[];
  competitorKeywords: string[];
  stats: CategoryStats;
  quotaUsed: number;
}
