import { useQuery } from '@tanstack/react-query';
import type { TrendingResponse } from '@/types/trending';

interface UseTrendingRankingParams {
  period: 'today' | 'week' | 'month';
  keywords?: string;
  maxResults?: number;
  enabled?: boolean;
}

export function useTrendingRanking({
  period,
  keywords,
  maxResults = 50,
  enabled = true,
}: UseTrendingRankingParams) {
  return useQuery({
    queryKey: ['trending-ranking', period, keywords, maxResults],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        keywords: keywords || '',
        maxResults: maxResults.toString(),
      });

      const response = await fetch(`/api/trending/ranking?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取热门排行榜失败');
      }

      return response.json() as Promise<TrendingResponse>;
    },
    enabled,
    // 缓存配置
    staleTime: 60 * 60 * 1000, // 1 小时内数据被视为新鲜
    gcTime: 24 * 60 * 60 * 1000, // 24 小时后清除缓存
    refetchOnMount: false, // 页面挂载时不自动刷新
    refetchOnWindowFocus: false, // 窗口聚焦时不自动刷新
    refetchOnReconnect: false, // 网络重连时不自动刷新
  });
}
