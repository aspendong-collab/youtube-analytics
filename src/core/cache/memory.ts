/**
 * 内存缓存实现
 */

import { CacheEntry, CacheOptions, CacheStats } from './types';

export class MemoryCache {
  private cache: Map<string, CacheEntry>;
  private tagIndex: Map<string, Set<string>>;
  private stats: {
    hits: number;
    misses: number;
  };

  constructor() {
    this.cache = new Map();
    this.tagIndex = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const now = Date.now();
    const expiresAt = options.ttl ? now + options.ttl * 1000 : null;

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessAt: now,
    };

    this.cache.set(key, entry);

    // 更新标签索引
    if (options.tags && options.tags.length > 0) {
      options.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      });
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // 检查是否过期
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // 更新访问统计
    entry.accessCount++;
    entry.lastAccessAt = Date.now();
    this.stats.hits++;

    return entry.value as T;
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // 从标签索引中移除
    this.cache.delete(key);
    return true;
  }

  /**
   * 按标签删除缓存
   */
  deleteByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) {
      return 0;
    }

    let count = 0;
    keys.forEach(key => {
      if (this.delete(key)) {
        count++;
      }
    });

    this.tagIndex.delete(tag);
    return count;
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // 检查是否过期
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// 导出单例实例
export const memoryCache = new MemoryCache();
