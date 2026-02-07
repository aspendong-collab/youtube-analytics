/**
 * 中间件管道
 */

import { MiddlewareFunction, Middleware, MiddlewareContext } from './types';

export class MiddlewarePipeline {
  private middlewares: MiddlewareFunction[] = [];

  /**
   * 添加中间件
   */
  use(middleware: MiddlewareFunction | Middleware): this {
    if (typeof middleware === 'function') {
      this.middlewares.push(middleware);
    } else {
      this.middlewares.push(middleware.handle);
    }
    return this;
  }

  /**
   * 移除中间件
   */
  remove(middleware: MiddlewareFunction): this {
    const index = this.middlewares.indexOf(middleware);
    if (index > -1) {
      this.middlewares.splice(index, 1);
    }
    return this;
  }

  /**
   * 清空所有中间件
   */
  clear(): void {
    this.middlewares = [];
  }

  /**
   * 执行中间件管道
   */
  async execute(
    initialContext: MiddlewareContext,
    handler: (context: MiddlewareContext) => Promise<Response>
  ): Promise<Response> {
    let index = 0;
    const context = { ...initialContext };

    const next = async (): Promise<Response> => {
      if (index >= this.middlewares.length) {
        // 所有中间件执行完毕，执行最终的处理器
        return handler(context);
      }

      const middleware = this.middlewares[index++];
      return await middleware(context, next);
    };

    return next();
  }
}

/**
 * 创建中间件管道的便捷方法
 */
export function createPipeline(): MiddlewarePipeline {
  return new MiddlewarePipeline();
}
