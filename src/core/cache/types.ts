/**
 * 缓存接口定义
 */

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number | null;
  createdAt: number;
  accessCount: number;
  lastAccessAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}
