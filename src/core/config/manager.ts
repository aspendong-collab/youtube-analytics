/**
 * 配置管理器
 * 提供统一的配置访问和管理接口
 */

import { ConfigItem, SystemConfig, ConfigCategory } from './types';

class ConfigManager {
  private static instance: ConfigManager;
  private configs: Map<string, ConfigItem> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 初始化配置管理器
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 从数据库加载配置（这里暂时使用默认配置）
    await this.loadDefaults();
    this.initialized = true;
  }

  /**
   * 加载默认配置
   */
  private async loadDefaults(): Promise<void> {
    const defaults: Record<string, ConfigItem> = {
      'system.name': {
        key: 'system.name',
        value: 'YouTube Analytics Platform',
        type: 'string',
        category: 'system',
        description: 'System name',
        isPublic: true,
      },
      'system.version': {
        key: 'system.version',
        value: '1.0.0',
        type: 'string',
        category: 'system',
        description: 'System version',
        isPublic: true,
      },
      'system.environment': {
        key: 'system.environment',
        value: process.env.NODE_ENV || 'development',
        type: 'string',
        category: 'system',
        description: 'System environment',
        isPublic: true,
      },
      'system.timezone': {
        key: 'system.timezone',
        value: 'UTC',
        type: 'string',
        category: 'system',
        description: 'System timezone',
      },
      'system.defaultLanguage': {
        key: 'system.defaultLanguage',
        value: 'en',
        type: 'string',
        category: 'system',
        description: 'Default language',
      },
      'youtube.maxResults': {
        key: 'youtube.maxResults',
        value: 50,
        type: 'number',
        category: 'youtube',
        description: 'Maximum results per search',
      },
      'youtube.apiQuotaLimit': {
        key: 'youtube.apiQuotaLimit',
        value: 10000,
        type: 'number',
        category: 'youtube',
        description: 'YouTube API daily quota limit',
      },
      'youtube.quotaResetHour': {
        key: 'youtube.quotaResetHour',
        value: 0,
        type: 'number',
        category: 'youtube',
        description: 'Hour when quota resets (0-23)',
      },
      'ai.provider': {
        key: 'ai.provider',
        value: 'deepseek',
        type: 'string',
        category: 'ai',
        description: 'AI provider',
      },
      'ai.model': {
        key: 'ai.model',
        value: 'deepseek-chat',
        type: 'string',
        category: 'ai',
        description: 'AI model name',
      },
      'ai.maxTokens': {
        key: 'ai.maxTokens',
        value: 2000,
        type: 'number',
        category: 'ai',
        description: 'Maximum tokens per request',
      },
      'ai.temperature': {
        key: 'ai.temperature',
        value: 0.7,
        type: 'number',
        category: 'ai',
        description: 'AI temperature (0-1)',
      },
      'ai.timeout': {
        key: 'ai.timeout',
        value: 30000,
        type: 'number',
        category: 'ai',
        description: 'AI request timeout (ms)',
      },
      'cache.enabled': {
        key: 'cache.enabled',
        value: true,
        type: 'boolean',
        category: 'cache',
        description: 'Enable caching',
        isPublic: true,
      },
      'cache.defaultTTL': {
        key: 'cache.defaultTTL',
        value: 3600,
        type: 'number',
        category: 'cache',
        description: 'Default cache TTL (seconds)',
      },
      'cache.maxSize': {
        key: 'cache.maxSize',
        value: 1000,
        type: 'number',
        category: 'cache',
        description: 'Maximum cache entries',
      },
      'affiliate.maxVideos': {
        key: 'affiliate.maxVideos',
        value: 200,
        type: 'number',
        category: 'affiliate',
        description: 'Maximum affiliate videos to search',
      },
      'affiliate.minViews': {
        key: 'affiliate.minViews',
        value: 1000,
        type: 'number',
        category: 'affiliate',
        description: 'Minimum views for affiliate videos',
      },
      'affiliate.minSubscribers': {
        key: 'affiliate.minSubscribers',
        value: 1000,
        type: 'number',
        category: 'affiliate',
        description: 'Minimum subscribers for affiliate channels',
      },
      'security.sessionTimeout': {
        key: 'security.sessionTimeout',
        value: 86400,
        type: 'number',
        category: 'security',
        description: 'Session timeout (seconds)',
      },
      'security.maxLoginAttempts': {
        key: 'security.maxLoginAttempts',
        value: 5,
        type: 'number',
        category: 'security',
        description: 'Maximum login attempts',
      },
      'security.passwordMinLength': {
        key: 'security.passwordMinLength',
        value: 8,
        type: 'number',
        category: 'security',
        description: 'Minimum password length',
      },
      'notifications.enabled': {
        key: 'notifications.enabled',
        value: true,
        type: 'boolean',
        category: 'notifications',
        description: 'Enable notifications',
      },
      'notifications.emailEnabled': {
        key: 'notifications.emailEnabled',
        value: false,
        type: 'boolean',
        category: 'notifications',
        description: 'Enable email notifications',
      },
      'notifications.websocketEnabled': {
        key: 'notifications.websocketEnabled',
        value: true,
        type: 'boolean',
        category: 'notifications',
        description: 'Enable WebSocket notifications',
      },
    };

    // 加载默认配置
    Object.values(defaults).forEach(config => {
      this.configs.set(config.key, config);
    });
  }

  /**
   * 获取配置值
   */
  get<K extends keyof SystemConfig>(key: K): SystemConfig[K] {
    const config = this.configs.get(key as string);
    if (!config) {
      console.warn(`Config not found: ${key}`);
      return undefined;
    }
    return config.value as SystemConfig[K];
  }

  /**
   * 设置配置值
   */
  async set<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]): Promise<void> {
    const existing = this.configs.get(key as string);
    const config: ConfigItem = existing || {
      key: key as string,
      value,
      type: typeof value === 'string' ? 'string' :
            typeof value === 'number' ? 'number' :
            typeof value === 'boolean' ? 'boolean' :
            Array.isArray(value) ? 'array' : 'json',
    };
    config.value = value;
    this.configs.set(key as string, config);
    
    // TODO: 保存到数据库
  }

  /**
   * 获取所有配置
   */
  getAll(): Record<string, ConfigItem> {
    return Object.fromEntries(this.configs.entries());
  }

  /**
   * 按分类获取配置
   */
  getByCategory(category: ConfigCategory): Record<string, ConfigItem> {
    const result: Record<string, ConfigItem> = {};
    this.configs.forEach((config, key) => {
      if (config.category === category) {
        result[key] = config;
      }
    });
    return result;
  }

  /**
   * 获取公开配置
   */
  getPublic(): Record<string, ConfigItem> {
    const result: Record<string, ConfigItem> = {};
    this.configs.forEach((config, key) => {
      if (config.isPublic) {
        result[key] = config;
      }
    });
    return result;
  }

  /**
   * 批量设置配置
   */
  async setMany(configs: Partial<SystemConfig>): Promise<void> {
    const promises = Object.entries(configs).map(([key, value]) => 
      this.set(key as keyof SystemConfig, value)
    );
    await Promise.all(promises);
  }

  /**
   * 重置为默认配置
   */
  async reset(): Promise<void> {
    this.configs.clear();
    await this.loadDefaults();
  }
}

// 导出单例实例
export const config = ConfigManager.getInstance();
