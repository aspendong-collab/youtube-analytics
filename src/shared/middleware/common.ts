/**
 * 常用中间件
 */

import { MiddlewareFunction, MiddlewareContext } from './types';
import { createLogger } from '../../core/logger';

const logger = createLogger('middleware');

/**
 * 日志中间件
 */
export function loggingMiddleware(): MiddlewareFunction {
  return async (context: MiddlewareContext, next: () => Promise<Response>) => {
    const startTime = Date.now();
    const url = context.request.url;
    const method = context.request.method;

    logger.info(`${method} ${url}`, {
      action: 'request_start',
      userAgent: context.request.headers.get('user-agent'),
    });

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      logger.info(`${method} ${url} ${response.status}`, {
        action: 'request_complete',
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`${method} ${url} - Error`, error as Error, {
        action: 'request_error',
        duration,
      });

      throw error;
    }
  };
}

/**
 * 错误处理中间件
 */
export function errorHandlerMiddleware(): MiddlewareFunction {
  return async (context: MiddlewareContext, next: () => Promise<Response>) => {
    try {
      return await next();
    } catch (error) {
      logger.error('Unhandled error', error as Error);

      // 返回错误响应
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
          },
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

/**
 * CORS 中间件
 */
export function corsMiddleware(options: {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
} = {}): MiddlewareFunction {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    credentials = false,
    maxAge = 86400,
  } = options;

  return async (context: MiddlewareContext, next: () => Promise<Response>) => {
    const requestOrigin = context.request.headers.get('origin') || '';

    // 处理 OPTIONS 请求
    if (context.request.method === 'OPTIONS') {
      const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': methods.join(', '),
        'Access-Control-Allow-Headers': allowedHeaders.join(', '),
        'Access-Control-Max-Age': maxAge.toString(),
      };

      // 设置 Origin
      if (typeof origin === 'string') {
        headers['Access-Control-Allow-Origin'] = origin;
      } else if (Array.isArray(origin)) {
        const allowed = origin.includes(requestOrigin) ? requestOrigin : origin[0];
        headers['Access-Control-Allow-Origin'] = allowed;
      } else if (typeof origin === 'function') {
        const allowed = origin(requestOrigin) ? requestOrigin : '';
        headers['Access-Control-Allow-Origin'] = allowed;
      }

      // 设置 Credentials
      if (credentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
      }

      return new Response(null, { status: 204, headers });
    }

    // 处理其他请求
    const response = await next();

    // 添加 CORS 头
    const headers = new Headers(response.headers);

    if (typeof origin === 'string') {
      headers.set('Access-Control-Allow-Origin', origin);
    } else if (Array.isArray(origin)) {
      const allowed = origin.includes(requestOrigin) ? requestOrigin : origin[0];
      headers.set('Access-Control-Allow-Origin', allowed);
    } else if (typeof origin === 'function') {
      const allowed = origin(requestOrigin) ? requestOrigin : '';
      headers.set('Access-Control-Allow-Origin', allowed);
    }

    if (credentials) {
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * 请求 ID 中间件
 */
export function requestIdMiddleware(): MiddlewareFunction {
  return async (context: MiddlewareContext, next: () => Promise<Response>) => {
    // 从请求头获取或生成新的请求 ID
    const requestId = context.request.headers.get('x-request-id') || 
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 添加到上下文
    context.metadata = context.metadata || {};
    context.metadata.requestId = requestId;

    const response = await next();

    // 在响应头中添加请求 ID
    const headers = new Headers(response.headers);
    headers.set('x-request-id', requestId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * 请求限流中间件
 */
export function rateLimitMiddleware(options: {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string;
}): MiddlewareFunction {
  const { windowMs, maxRequests, keyGenerator } = options;
  const requests: Map<string, number[]> = new Map();

  const cleanup = () => {
    const now = Date.now();
    const threshold = now - windowMs;

    for (const [key, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > threshold);
      if (validTimestamps.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, validTimestamps);
      }
    }
  };

  // 定期清理过期记录
  setInterval(cleanup, windowMs);

  return async (context: MiddlewareContext, next: () => Promise<Response>) => {
    const key = keyGenerator 
      ? keyGenerator(context.request)
      : context.request.headers.get('x-forwarded-for') || 
        context.request.headers.get('x-real-ip') || 
        'unknown';

    const now = Date.now();
    const timestamps = requests.get(key) || [];

    // 清理过期时间戳
    const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Maximum ${maxRequests} requests per ${windowMs}ms.`,
          },
        }),
        {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
          },
        }
      );
    }

    validTimestamps.push(now);
    requests.set(key, validTimestamps);

    return next();
  };
}

/**
 * 响应时间中间件
 */
export function responseTimeMiddleware(): MiddlewareFunction {
  return async (context: MiddlewareContext, next: () => Promise<Response>) => {
    const startTime = Date.now();
    const response = await next();
    const duration = Date.now() - startTime;

    const headers = new Headers(response.headers);
    headers.set('x-response-time', `${duration}ms`);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
