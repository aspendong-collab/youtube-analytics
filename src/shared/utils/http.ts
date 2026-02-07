/**
 * HTTP 工具
 */

/**
 * HTTP 错误类
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * 请求选项接口
 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * 默认请求选项
 */
const defaultOptions: RequestOptions = {
  method: 'GET',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
};

/**
 * 发送 HTTP 请求
 */
export async function request<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...opts.headers,
    };

    const response = await fetch(url, {
      method: opts.method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      throw new HttpError(
        response.status,
        errorData.message || `HTTP ${response.status}`,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // 重试逻辑
    if (opts.retries && opts.retries > 0) {
      if (error instanceof HttpError) {
        throw error; // HTTP 错误不重试
      }

      // 等待后重试
      await sleep(opts.retryDelay || 1000);
      return request<T>(url, {
        ...opts,
        retries: opts.retries - 1,
      });
    }

    throw error;
  }
}

/**
 * GET 请求
 */
export function get<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
  return request<T>(url, { ...options, method: 'GET' });
}

/**
 * POST 请求
 */
export function post<T = any>(url: string, data: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return request<T>(url, { ...options, method: 'POST', body: data });
}

/**
 * PUT 请求
 */
export function put<T = any>(url: string, data: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return request<T>(url, { ...options, method: 'PUT', body: data });
}

/**
 * DELETE 请求
 */
export function del<T = any>(url: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
  return request<T>(url, { ...options, method: 'DELETE' });
}

/**
 * PATCH 请求
 */
export function patch<T = any>(url: string, data: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
  return request<T>(url, { ...options, method: 'PATCH', body: data });
}

/**
 * 睡眠函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 带重试的请求
 */
export async function requestWithRetry<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  return request<T>(url, options);
}

/**
 * 超时装饰器
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: Error = new Error('Request timeout')
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(timeoutError), timeoutMs)
    ),
  ]);
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCall = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
