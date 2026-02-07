/**
 * 中间件类型定义
 */

/**
 * 中间件上下文
 */
export interface MiddlewareContext {
  request: Request;
  response?: Response;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  user?: any;
  metadata?: Record<string, any>;
}

/**
 * 中间件函数
 */
export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<Response>
) => Promise<Response>;

/**
 * 中间件类接口
 */
export interface Middleware {
  name: string;
  handle: MiddlewareFunction;
}
