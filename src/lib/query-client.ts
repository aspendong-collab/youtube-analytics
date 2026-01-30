'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据在 5 分钟内被认为是新鲜的，不会重新请求
            staleTime: 5 * 60 * 1000,
            // 缓存时间 10 分钟
            gcTime: 10 * 60 * 1000,
            // 窗口聚焦时不自动重新获取
            refetchOnWindowFocus: false,
            // 组件挂载时不自动重新获取（已有缓存时）
            refetchOnMount: false,
            // 网络重连时不自动重新获取
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
