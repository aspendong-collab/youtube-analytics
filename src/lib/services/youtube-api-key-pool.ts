/**
 * YouTube API Key 池管理器
 * 支持多个 API Key 的轮询和智能调度
 */

export interface ApiKeyInfo {
  key: string;
  id: string;
  quotaUsed: number;
  quotaLimit: number;
  lastUsed: Date;
  isAvailable: boolean;
  priority: number; // 优先级，数字越小优先级越高
}

export interface SelectionStrategy {
  type: 'round-robin' | 'least-used' | 'priority' | 'random';
}

/**
 * YouTube API Key 池管理器
 */
export class YoutubeApiKeyPool {
  private keys: Map<string, ApiKeyInfo> = new Map();
  private currentIndex: number = 0;
  private strategy: SelectionStrategy = { type: 'least-used' };

  constructor() {
    this.initializeKeys();
  }

  /**
   * 从环境变量初始化 API Keys
   */
  private initializeKeys(): void {
    // 从环境变量读取多个 API Key
    const envKey = process.env.YOUTUBE_API_KEYS || process.env.YOUTUBE_API_KEY || '';

    if (!envKey) {
      console.warn('[YoutubeApiKeyPool] 未配置 YOUTUBE_API_KEYS');
      return;
    }

    // 支持多种格式：
    // 1. JSON 数组: ["key1", "key2", "key3"]
    // 2. 逗号分隔: key1,key2,key3
    // 3. 单个 Key: key1
    let keyList: string[] = [];

    try {
      // 尝试解析 JSON
      const parsed = JSON.parse(envKey);
      keyList = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      // 解析失败，尝试逗号分隔
      keyList = envKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    if (keyList.length === 0) {
      console.warn('[YoutubeApiKeyPool] 没有有效的 YouTube API Key');
      return;
    }

    // 初始化每个 Key
    keyList.forEach((key, index) => {
      const keyInfo: ApiKeyInfo = {
        key,
        id: `key_${index}`,
        quotaUsed: 0,
        quotaLimit: 10000, // YouTube API 每天免费额度
        lastUsed: new Date(),
        isAvailable: true,
        priority: index // 按顺序设置优先级
      };

      this.keys.set(keyInfo.id, keyInfo);
    });

    console.log(`[YoutubeApiKeyPool] 已初始化 ${keyList.length} 个 YouTube API Key`);
  }

  /**
   * 获取下一个可用的 API Key
   */
  getNextKey(): string | null {
    const availableKeys = Array.from(this.keys.values()).filter(k => k.isAvailable);

    if (availableKeys.length === 0) {
      console.error('[YoutubeApiKeyPool] 所有 API Key 都不可用');
      return null;
    }

    let selectedKey: ApiKeyInfo;

    switch (this.strategy.type) {
      case 'round-robin':
        selectedKey = this.selectRoundRobin(availableKeys);
        break;
      case 'least-used':
        selectedKey = this.selectLeastUsed(availableKeys);
        break;
      case 'priority':
        selectedKey = this.selectByPriority(availableKeys);
        break;
      case 'random':
        selectedKey = this.selectRandom(availableKeys);
        break;
      default:
        selectedKey = this.selectLeastUsed(availableKeys);
    }

    // 更新使用信息
    selectedKey.lastUsed = new Date();
    selectedKey.quotaUsed++;

    console.log(`[YoutubeApiKeyPool] 使用 Key: ${selectedKey.id}, 已使用配额: ${selectedKey.quotaUsed}/${selectedKey.quotaLimit}`);

    return selectedKey.key;
  }

  /**
   * 轮询策略
   */
  private selectRoundRobin(availableKeys: ApiKeyInfo[]): ApiKeyInfo {
    const key = availableKeys[this.currentIndex % availableKeys.length];
    this.currentIndex++;
    return key;
  }

  /**
   * 最少使用策略（推荐）
   */
  private selectLeastUsed(availableKeys: ApiKeyInfo[]): ApiKeyInfo {
    return availableKeys.reduce((min, current) => {
      const minUsageRate = min.quotaUsed / min.quotaLimit;
      const currentUsageRate = current.quotaUsed / current.quotaLimit;
      return currentUsageRate < minUsageRate ? current : min;
    });
  }

  /**
   * 优先级策略
   */
  private selectByPriority(availableKeys: ApiKeyInfo[]): ApiKeyInfo {
    return availableKeys.reduce((min, current) => {
      // 先按优先级排序，再按使用率
      if (current.priority < min.priority) {
        return current;
      } else if (current.priority === min.priority) {
        const minUsageRate = min.quotaUsed / min.quotaLimit;
        const currentUsageRate = current.quotaUsed / current.quotaLimit;
        return currentUsageRate < minUsageRate ? current : min;
      }
      return min;
    });
  }

  /**
   * 随机策略
   */
  private selectRandom(availableKeys: ApiKeyInfo[]): ApiKeyInfo {
    const index = Math.floor(Math.random() * availableKeys.length);
    return availableKeys[index];
  }

  /**
   * 记录配额使用
   */
  recordQuotaUsage(key: string, quotaCost: number): void {
    for (const keyInfo of this.keys.values()) {
      if (keyInfo.key === key) {
        keyInfo.quotaUsed += quotaCost;

        // 检查是否超过配额
        if (keyInfo.quotaUsed >= keyInfo.quotaLimit) {
          keyInfo.isAvailable = false;
          console.warn(`[YoutubeApiKeyPool] Key ${keyInfo.id} 配额已用完 (${keyInfo.quotaUsed}/${keyInfo.quotaLimit})`);
        }

        break;
      }
    }
  }

  /**
   * 标记 Key 为不可用（配额用完）
   */
  markAsUnavailable(key: string): void {
    for (const keyInfo of this.keys.values()) {
      if (keyInfo.key === key) {
        keyInfo.isAvailable = false;
        console.warn(`[YoutubeApiKeyPool] Key ${keyInfo.id} 已标记为不可用`);
        break;
      }
    }
  }

  /**
   * 重置所有 Key 的配额（每天 UTC 0:00 调用）
   */
  resetAllQuotas(): void {
    for (const keyInfo of this.keys.values()) {
      keyInfo.quotaUsed = 0;
      keyInfo.isAvailable = true;
    }
    console.log('[YoutubeApiKeyPool] 所有 API Key 配额已重置');
  }

  /**
   * 获取 Key 池状态
   */
  getPoolStatus(): Array<{ id: string; quotaUsed: number; quotaLimit: number; isAvailable: boolean; usageRate: number }> {
    return Array.from(this.keys.values()).map(k => ({
      id: k.id,
      quotaUsed: k.quotaUsed,
      quotaLimit: k.quotaLimit,
      isAvailable: k.isAvailable,
      usageRate: (k.quotaUsed / k.quotaLimit) * 100
    }));
  }

  /**
   * 检查是否有可用的 Key
   */
  hasAvailableKey(): boolean {
    return Array.from(this.keys.values()).some(k => k.isAvailable);
  }

  /**
   * 获取可用 Key 数量
   */
  getAvailableKeyCount(): number {
    return Array.from(this.keys.values()).filter(k => k.isAvailable).length;
  }

  /**
   * 设置选择策略
   */
  setStrategy(strategy: SelectionStrategy): void {
    this.strategy = strategy;
    console.log(`[YoutubeApiKeyPool] 切换策略为: ${strategy.type}`);
  }
}

// 导出单例
export const youtubeApiKeyPool = new YoutubeApiKeyPool();
