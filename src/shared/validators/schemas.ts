/**
 * 预定义验证 Schema
 */

import { SchemaValidator } from './validator';

/**
 * YouTube 搜索参数验证
 */
export function youtubeSearchSchema(): SchemaValidator {
  return SchemaValidator.create()
    .field('query')
      .required('Search query is required')
      .minLength(1, 'Query must not be empty')
      .maxLength(100, 'Query must not exceed 100 characters');
}

/**
 * Affiliate 搜索参数验证
 */
export function affiliateSearchSchema(): SchemaValidator {
  return SchemaValidator.create()
    .field('query')
      .required('Search query is required')
      .minLength(1, 'Query must not be empty');
}

/**
 * 关键词验证
 */
export function keywordSchema(): SchemaValidator {
  return SchemaValidator.create()
    .field('keyword')
      .required('Keyword is required')
      .minLength(1, 'Keyword must not be empty')
      .maxLength(200, 'Keyword must not exceed 200 characters');
}

/**
 * 用户注册验证
 */
export function userRegistrationSchema(): SchemaValidator {
  return SchemaValidator.create()
    .field('email')
      .required('Email is required')
      .email('Invalid email address')
    .field('password')
      .required('Password is required')
      .minLength(8, 'Password must be at least 8 characters')
      .maxLength(128, 'Password must not exceed 128 characters')
    .field('name')
      .maxLength(100, 'Name must not exceed 100 characters');
}

/**
 * 用户登录验证
 */
export function userLoginSchema(): SchemaValidator {
  return SchemaValidator.create()
    .field('email')
      .required('Email is required')
      .email('Invalid email address')
    .field('password')
      .required('Password is required');
}

/**
 * 分页参数验证
 */
export function paginationSchema(): SchemaValidator {
  return SchemaValidator.create()
    .field('page')
      .custom((v: any) => v === undefined || (Number.isInteger(v) && v >= 1), 'Page must be a positive integer')
    .field('pageSize')
      .custom((v: any) => v === undefined || (Number.isInteger(v) && v >= 1 && v <= 100), 'Page size must be between 1 and 100')
    .field('sortBy')
      .maxLength(50, 'Sort field must not exceed 50 characters')
    .field('sortOrder')
      .custom((v: any) => v === undefined || ['asc', 'desc'].includes(v), 'Sort order must be asc or desc');
}

/**
 * YouTube 视频 ID 验证
 */
export function youtubeVideoIdSchema(): SchemaValidator {
  return SchemaValidator.create()
    .field('videoId')
      .required('Video ID is required')
      .custom((v: string) => /^[a-zA-Z0-9_-]{11}$/.test(v), 'Invalid YouTube video ID');
}

/**
 * YouTube 频道 ID 验证
 */
export function youtubeChannelIdSchema(): SchemaValidator {
  return SchemaValidator.create()
    .field('channelId')
      .required('Channel ID is required')
      .custom((v: string) => /^UC[a-zA-Z0-9_-]{22}$/.test(v), 'Invalid YouTube channel ID');
}
