/**
 * HTTP Header 工具类
 * 用于处理请求头，特别是转发请求头到后端服务
 */

export class HeaderUtils {
  /**
   * 从 Next.js Headers 对象中提取并转发请求头
   * 用于传递给 LLM SDK 等需要请求头的服务
   */
  static extractForwardHeaders(headers: Headers): Record<string, string> {
    const forwardHeaders: Record<string, string> = {};

    // 需要转发的请求头列表
    const headersToForward = [
      'authorization',
      'content-type',
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'user-agent',
      'cookie',
      'referer',
      'origin',
    ];

    // 提取并转发指定的请求头
    headersToForward.forEach(headerName => {
      const value = headers.get(headerName);
      if (value) {
        forwardHeaders[headerName] = value;
      }
    });

    return forwardHeaders;
  }

  /**
   * 转换 Headers 对象为普通对象
   */
  static headersToPlainObject(headers: Headers): Record<string, string> {
    const plainObject: Record<string, string> = {};

    headers.forEach((value, key) => {
      plainObject[key] = value;
    });

    return plainObject;
  }

  /**
   * 从普通对象创建 Headers 对象
   */
  static plainObjectToHeaders(plainObject: Record<string, string>): Headers {
    return new Headers(plainObject);
  }
}
