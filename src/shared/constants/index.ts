/**
 * 应用常量定义
 */

/**
 * YouTube 相关常量
 */
export const YOUTUBE_CONSTANTS = {
  API_BASE_URL: 'https://www.googleapis.com/youtube/v3',
  QUOTA_LIMIT: 10000, // 每日配额
  QUOTA_RESET_HOUR: 0, // 配额重置小时（UTC）
  MAX_RESULTS: 50, // 单次搜索最大结果数
  MAX_VIDEOS: 200, // Affiliate 搜索最大视频数
  DEFAULT_REGION: 'US',
  DEFAULT_LANGUAGE: 'en',
} as const;

/**
 * 缓存常量
 */
export const CACHE_CONSTANTS = {
  DEFAULT_TTL: 3600, // 1小时
  SHORT_TTL: 300, // 5分钟
  LONG_TTL: 86400, // 24小时
  VIDEO_TTL: 7200, // 2小时
  CHANNEL_TTL: 14400, // 4小时
  SEARCH_TTL: 1800, // 30分钟
  MAX_SIZE: 1000, // 最大缓存条目数
} as const;

/**
 * 分页常量
 */
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
} as const;

/**
 * 限流常量
 */
export const RATE_LIMIT_CONSTANTS = {
  DEFAULT_RATE_LIMIT: 100, // 每分钟请求数
  DEFAULT_BURST: 10, // 突发请求数
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 毫秒
} as const;

/**
 * 验证常量
 */
export const VALIDATION_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 255,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  KEYWORD_MAX_LENGTH: 200,
  KEYWORD_MIN_LENGTH: 1,
} as const;

/**
 * 文件常量
 */
export const FILE_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
  MAX_THUMBNAIL_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * 时间常量（毫秒）
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

/**
 * 正则表达式常量
 */
export const REGEX_CONSTANTS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  YOUTUBE_VIDEO_ID: /^[a-zA-Z0-9_-]{11}$/,
  YOUTUBE_CHANNEL_ID: /^UC[a-zA-Z0-9_-]{22}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  PHONE: /^\+?[1-9]\d{1,14}$/,
} as const;

/**
 * HTTP 状态码
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * 错误代码
 */
export const ERROR_CODES = {
  // 通用错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  
  // YouTube 相关错误
  YOUTUBE_API_ERROR: 'YOUTUBE_API_ERROR',
  YOUTUBE_QUOTA_EXCEEDED: 'YOUTUBE_QUOTA_EXCEEDED',
  YOUTUBE_VIDEO_NOT_FOUND: 'YOUTUBE_VIDEO_NOT_FOUND',
  YOUTUBE_CHANNEL_NOT_FOUND: 'YOUTUBE_CHANNEL_NOT_FOUND',
  
  // 验证错误
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_YOUTUBE_ID: 'INVALID_YOUTUBE_ID',
  
  // 限流错误
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // 缓存错误
  CACHE_ERROR: 'CACHE_ERROR',
  
  // AI 相关错误
  AI_ERROR: 'AI_ERROR',
  AI_QUOTA_EXCEEDED: 'AI_QUOTA_EXCEEDED',
} as const;
