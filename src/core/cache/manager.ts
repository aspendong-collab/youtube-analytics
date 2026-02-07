/**
 * 缓存管理器
 * 提供统一的缓存接口，支持内存缓存和 Redis 缓存
 */

import { memoryCache } from './memory';
import { CacheOptions } from './types';

export class CacheManager {
  private static instance: CacheManager;
  private enabled: boolean;

  private constructor() {
    this.enabled = true;
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    if (!this.enabled) return;
    memoryCache.set(key, value, options);
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    if (!this.enabled) return null;
    return memoryCache.get<T>(key);
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    if (!this.enabled) return false;
    return memoryCache.delete(key);
  }

  /**
   * 按标签删除缓存
   */
  deleteByTag(tag: string): number {
    if (!this.enabled) return 0;
    return memoryCache.deleteByTag(tag);
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    if (!this.enabled) return false;
    return memoryCache.has(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    if (!this.enabled) return;
    memoryCache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    if (!this.enabled) return { hits: 0, misses: 0, size: 0, hitRate: 0 };
    return memoryCache.getStats();
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    if (!this.enabled) return;
    memoryCache.resetStats();
  }

  /**
   * 清理过期缓存
   */
  cleanup(): number {
    if (!this.enabled) return 0;
    return memoryCache.cleanup();
  }

  /**
   * 启用缓存
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用缓存
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * 获取或设置缓存（缓存穿透保护）
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 缓存未命中，执行工厂函数获取数据
    const value = await factory();

    // 设置缓存
    this.set(key, value, options);

    return value;
  }

  /**
   * 批量获取缓存
   */
  mget<T>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();
    keys.forEach(key => {
      result.set(key, this.get<T>(key));
    });
    return result;
  }

  /**
   * 批量设置缓存
   */
  mset<T>(entries: Map<string, T>, options: CacheOptions = {}): void {
    entries.forEach((value, key) => {
      this.set(key, value, options);
    });
  }

  /**
   * 批量删除缓存
   */
  mdel(keys: string[]): number {
    let count = 0;
    keys.forEach(key => {
      if (this.delete(key)) {
        count++;
      }
    });
    return count;
  }
}

// 导出单例实例
export const cache = CacheManager.getInstance();
