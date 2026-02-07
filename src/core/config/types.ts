/**
 * 配置类型定义
 */

/**
 * 配置值类型
 */
export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'array';

/**
 * 配置分类
 */
export type ConfigCategory = 
  | 'system'
  | 'youtube'
  | 'ai'
  | 'cache'
  | 'database'
  | 'email'
  | 'affiliate'
  | 'security'
  | 'notifications';

/**
 * 配置项接口
 */
export interface ConfigItem {
  key: string;
  value: any;
  type: ConfigValueType;
  category?: ConfigCategory;
  description?: string;
  isPublic?: boolean;
  isEncrypted?: boolean;
}

/**
 * 系统配置接口
 */
export interface SystemConfig {
  // 系统配置
  'system.name'?: string;
  'system.version'?: string;
  'system.environment'?: 'development' | 'staging' | 'production';
  'system.timezone'?: string;
  'system.defaultLanguage'?: string;
  
  // YouTube 配置
  'youtube.apiKeys'?: string[];
  'youtube.defaultRegion'?: string;
  'youtube.maxResults'?: number;
  'youtube.apiQuotaLimit'?: number;
  'youtube.quotaResetHour'?: number;
  
  // AI 配置
  'ai.provider'?: 'openai' | 'deepseek' | 'anthropic';
  'ai.model'?: string;
  'ai.maxTokens'?: number;
  'ai.temperature'?: number;
  'ai.timeout'?: number;
  
  // 缓存配置
  'cache.enabled'?: boolean;
  'cache.defaultTTL'?: number;
  'cache.maxSize'?: number;
  
  // 数据库配置
  'database.poolSize'?: number;
  'database.connectionTimeout'?: number;
  
  // 邮件配置
  'email.enabled'?: boolean;
  'email.from'?: string;
  'email.replyTo'?: string;
  
  // Affiliate 配置
  'affiliate.maxVideos'?: number;
  'affiliate.minViews'?: number;
  'affiliate.minSubscribers'?: number;
  
  // 安全配置
  'security.sessionTimeout'?: number;
  'security.maxLoginAttempts'?: number;
  'security.passwordMinLength'?: number;
  
  // 通知配置
  'notifications.enabled'?: boolean;
  'notifications.emailEnabled'?: boolean;
  'notifications.websocketEnabled'?: boolean;
}
