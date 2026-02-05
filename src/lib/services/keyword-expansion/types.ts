// 关键词拓展相关类型定义

export interface ExpansionConfig {
  useRuleEngine: boolean;
  useLLMEngine: boolean;
  useDataMining: boolean;
  keywordCategory: 'brand' | 'generic' | 'longtail';
}

export interface KeywordRule {
  id: string;
  name: string;
  description: string;
  dimension: KeywordDimension;
  patterns: string[];
  templates: string[];
  priority: number;
}

export type KeywordDimension = 'scenario' | 'carrier' | 'state' | 'goal' | 'method';
export type KeywordSource = 'rule' | 'llm' | 'dataMining' | 'commentMining' | 'tagMining';

export interface ExpansionResult {
  keyword: string;
  dimension: KeywordDimension;
  source: KeywordSource;
  relevance: number;
  estimatedSearchVolume?: number;
  estimatedCompetition?: number;
  commercialValue?: number;
  recommendationScore?: number;
  type?: 'broad' | 'long-tail' | 'question' | 'brand';
  intent?: 'info' | 'tutorial' | 'review' | 'transaction';
  relatedKeywords?: string[];
  sourceVideoIds?: string[];
}

export interface DimensionResult {
  dimension: KeywordDimension;
  keywords: ExpansionResult[];
}

// API 配额信息
export interface QuotaInfo {
  apiType: string;
  date: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  isExhausted: boolean;
}

export interface ExpansionResponse {
  expansionId: string;
  inputKeyword: string;
  totalKeywords: number;
  uniqueKeywords: number;
  dimensions: Record<KeywordDimension, ExpansionResult[]>;
  topKeywords: ExpansionResult[];
  quota?: QuotaInfo; // 新增：配额信息
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: Date;
}

export interface VideoWithComments extends YouTubeVideo {
  comments: string[];
}
