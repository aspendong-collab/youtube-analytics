/**
 * 内置验证规则
 */

import { ValidationRule } from './types';

/**
 * 必填规则
 */
export function required(message: string = 'This field is required'): ValidationRule {
  return {
    validate: (value: any) => value !== null && value !== undefined && value !== '',
    message,
  };
}

/**
 * 邮箱规则
 */
export function email(message: string = 'Invalid email address'): ValidationRule {
  return {
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  };
}

/**
 * 最小长度规则
 */
export function minLength(min: number, message?: string): ValidationRule {
  return {
    validate: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  };
}

/**
 * 最大长度规则
 */
export function maxLength(max: number, message?: string): ValidationRule {
  return {
    validate: (value: string) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
  };
}

/**
 * 数字范围规则
 */
export function range(min: number, max: number, message?: string): ValidationRule {
  return {
    validate: (value: number) => value >= min && value <= max,
    message: message || `Must be between ${min} and ${max}`,
  };
}

/**
 * 正则表达式规则
 */
export function pattern(regex: RegExp, message: string = 'Invalid format'): ValidationRule {
  return {
    validate: (value: string) => regex.test(value),
    message,
  };
}

/**
 * 枚举规则
 */
export function enumRule(values: any[], message: string = 'Invalid value'): ValidationRule {
  return {
    validate: (value: any) => values.includes(value),
    message,
  };
}

/**
 * URL 规则
 */
export function url(message: string = 'Invalid URL'): ValidationRule {
  return {
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  };
}

/**
 * YouTube 视频 ID 规则
 */
export function youtubeVideoId(message: string = 'Invalid YouTube video ID'): ValidationRule {
  return {
    validate: (value: string) => /^[a-zA-Z0-9_-]{11}$/.test(value),
    message,
  };
}

/**
 * YouTube 频道 ID 规则
 */
export function youtubeChannelId(message: string = 'Invalid YouTube channel ID'): ValidationRule {
  return {
    validate: (value: string) => /^UC[a-zA-Z0-9_-]{22}$/.test(value),
    message,
  };
}

/**
 * UUID 规则
 */
export function uuid(message: string = 'Invalid UUID'): ValidationRule {
  return {
    validate: (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
    message,
  };
}

/**
 * 自定义规则
 */
export function custom(validator: (value: any) => boolean, message: string): ValidationRule {
  return {
    validate: validator,
    message,
  };
}
