'use client';

import { useQuery } from '@tanstack/react-query';

export interface MultiStatsResponse {
  today: {
    views: number;
    publishedVideos: number;
    cooperationCost: number;
    averageCPV: number;
  };
  thisWeek: {
    views: number;
    publishedVideos: number;
    cooperationCost: number;
    averageCPV: number;
  };
  total: {
    views: number;
    publishedVideos: number;
    cooperationCost: number;
    averageCPV: number;
  };
  other: {
    totalVideos: number;
    totalChannels: number;
    totalOwners: number;
  };
}

export function useMultiStats() {
  return useQuery({
    queryKey: ['multi-stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats/multi');
      if (!response.ok) {
        throw new Error('Failed to fetch multi stats');
      }
      return response.json() as Promise<MultiStatsResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5 分钟
    gcTime: 30 * 60 * 1000, // 30 分钟
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
