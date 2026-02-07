/**
 * 缓存键生成工具
 */

/**
 * 生成标准化的缓存键
 */
export function buildCacheKey(namespace: string, ...parts: (string | number)[]): string {
  return [namespace, ...parts].join(':');
}

/**
 * 生成 YouTube 相关的缓存键
 */
export const youtubeKeys = {
  video: (videoId: string) => buildCacheKey('youtube', 'video', videoId),
  channel: (channelId: string) => buildCacheKey('youtube', 'channel', channelId),
  search: (query: string, region?: string) => 
    buildCacheKey('youtube', 'search', query, region || 'US'),
  videos: (videoIds: string[]) => buildCacheKey('youtube', 'videos', videoIds.join(',')),
  comments: (videoId: string) => buildCacheKey('youtube', 'comments', videoId),
  playlist: (playlistId: string) => buildCacheKey('youtube', 'playlist', playlistId),
};

/**
 * 生成关键词相关的缓存键
 */
export const keywordKeys = {
  keyword: (keyword: string) => buildCacheKey('keyword', keyword),
  variants: (keyword: string) => buildCacheKey('keyword', 'variants', keyword),
  analysis: (keyword: string, type: string) => 
    buildCacheKey('keyword', 'analysis', keyword, type),
  suggestions: (keyword: string) => buildCacheKey('keyword', 'suggestions', keyword),
  expansion: (keyword: string, language: string, types: string) => 
    buildCacheKey('keyword', 'expansion', keyword, language, types),
};

/**
 * 生成用户相关的缓存键
 */
export const userKeys = {
  user: (userId: string) => buildCacheKey('user', userId),
  sessions: (userId: string) => buildCacheKey('user', 'sessions', userId),
  permissions: (userId: string) => buildCacheKey('user', 'permissions', userId),
};

/**
 * 生成 API 相关的缓存键
 */
export const apiKeys = {
  quota: (apiKeyId: string, date: string) => 
    buildCacheKey('api', 'quota', apiKeyId, date),
  rateLimit: (apiKeyId: string, endpoint: string) => 
    buildCacheKey('api', 'rateLimit', apiKeyId, endpoint),
};

/**
 * 生成统计相关的缓存键
 */
export const statsKeys = {
  onlineUsers: () => buildCacheKey('stats', 'onlineUsers'),
  dailyActive: (date: string) => buildCacheKey('stats', 'dailyActive', date),
  videoCount: (channelId?: string) => 
    buildCacheKey('stats', 'videoCount', channelId || 'all'),
  channelCount: () => buildCacheKey('stats', 'channelCount'),
  systemOverview: () => buildCacheKey('stats', 'systemOverview'),
};
