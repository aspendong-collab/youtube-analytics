/**
 * 环境变量加载器
 * 从环境变量中加载配置
 */

import { config } from './manager';

/**
 * 加载环境变量到配置管理器
 */
export async function loadEnvConfig(): Promise<void> {
  // YouTube API Keys
  const youtubeApiKeys = process.env.YOUTUBE_API_KEYS;
  if (youtubeApiKeys) {
    const keys = youtubeApiKeys.split(',').map(k => k.trim()).filter(Boolean);
    await config.set('youtube.apiKeys' as any, keys);
  }

  // AI 配置
  if (process.env.AI_PROVIDER) {
    await config.set('ai.provider' as any, process.env.AI_PROVIDER);
  }
  if (process.env.AI_MODEL) {
    await config.set('ai.model' as any, process.env.AI_MODEL);
  }
  if (process.env.AI_MAX_TOKENS) {
    await config.set('ai.maxTokens' as any, parseInt(process.env.AI_MAX_TOKENS, 10));
  }
  if (process.env.AI_TEMPERATURE) {
    await config.set('ai.temperature' as any, parseFloat(process.env.AI_TEMPERATURE));
  }

  // 缓存配置
  if (process.env.CACHE_ENABLED) {
    await config.set('cache.enabled' as any, process.env.CACHE_ENABLED === 'true');
  }
  if (process.env.CACHE_DEFAULT_TTL) {
    await config.set('cache.defaultTTL' as any, parseInt(process.env.CACHE_DEFAULT_TTL, 10));
  }

  // Affiliate 配置
  if (process.env.AFFILIATE_MAX_VIDEOS) {
    await config.set('affiliate.maxVideos' as any, parseInt(process.env.AFFILIATE_MAX_VIDEOS, 10));
  }
  if (process.env.AFFILIATE_MIN_VIEWS) {
    await config.set('affiliate.minViews' as any, parseInt(process.env.AFFILIATE_MIN_VIEWS, 10));
  }
  if (process.env.AFFILIATE_MIN_SUBSCRIBERS) {
    await config.set('affiliate.minSubscribers' as any, parseInt(process.env.AFFILIATE_MIN_SUBSCRIBERS, 10));
  }

  // 安全配置
  if (process.env.SESSION_TIMEOUT) {
    await config.set('security.sessionTimeout' as any, parseInt(process.env.SESSION_TIMEOUT, 10));
  }
  if (process.env.MAX_LOGIN_ATTEMPTS) {
    await config.set('security.maxLoginAttempts' as any, parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10));
  }
}

/**
 * 验证必需的环境变量
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required: string[] = [];
  
  // 根据需要添加必需的环境变量
  // if (!process.env.YOUTUBE_API_KEYS) {
  //   required.push('YOUTUBE_API_KEYS');
  // }
  
  return {
    valid: required.length === 0,
    missing: required,
  };
}
