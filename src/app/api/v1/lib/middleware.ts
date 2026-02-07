/**
 * API 中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/core/logger';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { apiSuccess, apiErrors, parseQueryParams, validatePagination, withPagination } from './response';

// 检查是否在构建时
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NODE_ENV === undefined;

/**
 * 请求日志中间件
 */
export async function withLogging(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  // 构建时直接返回空响应
  if (isBuildTime) {
    return NextResponse.json({ success: true, data: [] });
  }

  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  logger.info(`${method} ${url}`, {
    action: 'api_request_start',
    userAgent: request.headers.get('user-agent'),
  });

  try {
    const response = await handler(request);
    const duration = Date.now() - startTime;

    logger.info(`${method} ${url} ${response.status}`, {
      action: 'api_request_complete',
      duration,
    });

    // 添加响应时间头
    response.headers.set('x-response-time', `${duration}ms`);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(`${method} ${url} - Error`, error as Error, {
      action: 'api_request_error',
      duration,
    });

    throw error;
  }
}

/**
 * 错误处理中间件
 */
export async function withErrorHandler(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  // 构建时直接返回空响应
  if (isBuildTime) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    return await handler(request);
  } catch (error: any) {
    logger.error('API Error', error, {
      url: request.url,
      method: request.method,
    });

    // 返回标准错误响应
    if (error.status) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'An unexpected error occurred',
            details: error.details,
          },
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * CORS 中间件
 */
export function withCors(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 构建时直接返回空响应
    if (isBuildTime) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(request);

    // 添加 CORS 头
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
  };
}

/**
 * 请求 ID 中间件
 */
export function withRequestId(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // 构建时直接返回空响应
    if (isBuildTime) {
      return NextResponse.json({ success: true, data: [] });
    }

    const requestId = request.headers.get('x-request-id') || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 将请求 ID 添加到 headers 中，供后续使用
    const modifiedRequest = new Request(request, {
      headers: new Headers(request.headers),
    });
    modifiedRequest.headers.set('x-request-id', requestId);

    const response = await handler(modifiedRequest);

    // 在响应头中添加请求 ID
    response.headers.set('x-request-id', requestId);

    return response;
  };
}

/**
 * 提取转发头（用于 SDK）
 */
export function getForwardHeaders(request: NextRequest): Record<string, string> {
  return HeaderUtils.extractForwardHeaders(request.headers);
}

/**
 * 组合中间件
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: any) => any>
) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    // 构建时返回一个直接返回空响应的处理器
    if (isBuildTime) {
      return () => NextResponse.json({ success: true, data: [] });
    }

    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * 默认中间件链
 */
export const withDefaultMiddleware = composeMiddleware(
  withRequestId,
  withCors,
  withErrorHandler,
  withLogging
);

// 重新导出 response.ts 的内容，方便统一导入
export {
  apiSuccess,
  apiError,
  apiErrors,
  withPagination,
  parseQueryParams,
  validatePagination,
} from './response';
