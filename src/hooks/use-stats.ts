'use client';

import { useQuery } from '@tanstack/react-query';

export interface StatsResponse {
  // 时间范围
  timeRange: {
    startDate: string;
    endDate: string;
    days: number;
  };

  // 播放量指标（基于时间范围）
  periodNewViews: number;
  periodTotalViews: number;

  // 成本指标（基于时间范围）
  periodCooperationCost: number;
  periodAverageCPV: number;

  // 发布量指标（基于时间范围）
  periodPublishedVideos: number;

  // 全局累计指标（不受时间范围限制）
  totalHistoricalViews: number;
  totalPublishedVideos: number;
  totalCooperationCost: number;
  overallAverageCPV: number;

  // 原有指标
  totalVideos: number;
  totalChannels: number;
  totalOwners: number;
}

interface UseStatsOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useStats(options: UseStatsOptions = {}) {
  const { startDate, endDate, enabled = true } = options;

  return useQuery({
    queryKey: ['stats', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/stats?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json() as Promise<StatsResponse>;
    },
    staleTime: 10 * 60 * 1000, // 10 分钟
    gcTime: 30 * 60 * 1000, // 30 分钟
    enabled,
  });
}
