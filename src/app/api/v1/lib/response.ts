/**
 * API v1 统一响应格式
 */

import { successResponse, errorResponse } from '@/shared/types/api';
import { ERROR_CODES } from '@/shared/constants';
import { NextResponse } from 'next/server';

/**
 * 创建成功响应
 */
export function apiSuccess<T>(data: T, message?: string, status: number = 200): NextResponse {
  return NextResponse.json(successResponse(data, message), { status });
}

/**
 * 创建错误响应
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(errorResponse(code, message, details), { status });
}

/**
 * 快捷错误响应方法
 */
export const apiErrors = {
  badRequest: (message: string = 'Bad Request', details?: any) => 
    apiError('BAD_REQUEST', message, 400, details),
  
  unauthorized: (message: string = 'Unauthorized', details?: any) => 
    apiError('UNAUTHORIZED', message, 401, details),
  
  forbidden: (message: string = 'Forbidden', details?: any) => 
    apiError('FORBIDDEN', message, 403, details),
  
  notFound: (message: string = 'Resource not found', details?: any) => 
    apiError('NOT_FOUND', message, 404, details),
  
  conflict: (message: string = 'Resource conflict', details?: any) => 
    apiError('CONFLICT', message, 409, details),
  
  validationError: (message: string = 'Validation failed', details?: any) => 
    apiError('VALIDATION_ERROR', message, 422, details),
  
  tooManyRequests: (message: string = 'Too many requests', details?: any) => 
    apiError('RATE_LIMIT_EXCEEDED', message, 429, details),
  
  internalError: (message: string = 'Internal server error', details?: any) => 
    apiError('INTERNAL_ERROR', message, 500, details),
  
  youtubeApiError: (message: string = 'YouTube API error', details?: any) => 
    apiError(ERROR_CODES.YOUTUBE_API_ERROR, message, 502, details),
  
  youtubeQuotaExceeded: (message: string = 'YouTube API quota exceeded', details?: any) => 
    apiError(ERROR_CODES.YOUTUBE_QUOTA_EXCEEDED, message, 503, details),
  
  aiError: (message: string = 'AI service error', details?: any) => 
    apiError(ERROR_CODES.AI_ERROR, message, 502, details),
};

/**
 * 分页响应包装器
 */
export function withPagination<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 解析查询参数
 */
export function parseQueryParams(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string | number | boolean> = {};
  
  url.searchParams.forEach((value, key) => {
    // 尝试解析为数字
    const numValue = Number(value);
    if (!isNaN(numValue) && value === String(numValue)) {
      params[key] = numValue;
    } 
    // 尝试解析为布尔值
    else if (value === 'true') {
      params[key] = true;
    } else if (value === 'false') {
      params[key] = false;
    }
    // 字符串
    else {
      params[key] = value;
    }
  });
  
  return params;
}

/**
 * 验证分页参数
 */
export function validatePagination(params: Record<string, any>) {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(params.pageSize) || 20)
  );
  
  return { page, pageSize };
}
