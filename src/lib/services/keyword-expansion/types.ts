// 关键词拓展相关类型定义

// 支持的语言列表
export type SupportedLanguage =
  | 'en'      // 英语
  | 'fr'      // 法语
  | 'de'      // 德语
  | 'it'      // 意大利语
  | 'es'      // 西班牙语
  | 'pt'      // 葡萄牙语
  | 'ja'      // 日语
  | 'ko'      // 韩语
  | 'zh-TW'   // 繁体中文
  | 'zh-CN';  // 简体中文

// 语言显示名称映射
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  'en': 'English (英语)',
  'fr': 'Français (法语)',
  'de': 'Deutsch (德语)',
  'it': 'Italiano (意大利语)',
  'es': 'Español (西班牙语)',
  'pt': 'Português (葡萄牙语)',
  'ja': '日本語 (日语)',
  'ko': '한국어 (韩语)',
  'zh-TW': '繁體中文 (繁体中文)',
  'zh-CN': '简体中文 (简体中文)',
};

// YouTube API 语言代码映射
export const YOUTUBE_LANGUAGE_CODES: Record<SupportedLanguage, string> = {
  'en': 'en',
  'fr': 'fr',
  'de': 'de',
  'it': 'it',
  'es': 'es',
  'pt': 'pt',
  'ja': 'ja',
  'ko': 'ko',
  'zh-TW': 'zh-Hant',
  'zh-CN': 'zh-Hans',
};

// YouTube API 地区代码映射
export const YOUTUBE_REGION_CODES: Record<SupportedLanguage, string> = {
  'en': 'US',
  'fr': 'FR',
  'de': 'DE',
  'it': 'IT',
  'es': 'ES',
  'pt': 'BR',
  'ja': 'JP',
  'ko': 'KR',
  'zh-TW': 'TW',
  'zh-CN': 'CN',
};

export interface ExpansionConfig {
  useRuleEngine: boolean;
  useLLMEngine: boolean;
  useDataMining: boolean;
  keywordCategory: 'brand' | 'generic' | 'longtail';
  language: SupportedLanguage; // 新增：语言设置
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
