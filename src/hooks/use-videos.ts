'use client';

import { useQuery } from '@tanstack/react-query';

export interface VideoStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  statDate: string | Date;
}

export interface Video {
  id: string;
  videoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  channelId?: string;
  channelTitle?: string;
  owner?: string;
  isActive?: boolean;
  isMonitored?: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
  latestStats?: VideoStats | null;
}

export interface VideosResponse {
  videos: Video[];
  total: number;
}

// 获取视频列表
export function useVideos(options: {
  isActive?: boolean;
  limit?: number;
  skip?: number;
} = {}) {
  const { isActive, limit = 100, skip = 0 } = options;

  return useQuery({
    queryKey: ['videos', { isActive, limit, skip }],
    queryFn: async (): Promise<VideosResponse> => {
      const params = new URLSearchParams({
        ...(isActive !== undefined && { isActive: String(isActive) }),
        limit: String(limit),
        ...(skip && { skip: String(skip) }),
      });

      const response = await fetch(`/api/videos?${params}`);

      if (!response.ok) {
        throw new Error('获取视频列表失败');
      }

      return response.json();
    },
    // 数据在 10 分钟内被认为是新鲜的，不会重新请求
    staleTime: 10 * 60 * 1000,
    // 缓存时间 30 分钟
    gcTime: 30 * 60 * 1000,
    // 组件挂载时不自动重新获取（已有缓存时）
    refetchOnMount: false,
    // 窗口聚焦时不自动重新获取
    refetchOnWindowFocus: false,
  });
}

// 获取单个视频详情
export function useVideo(videoId: string) {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: async (): Promise<Video> => {
      const response = await fetch(`/api/videos/${videoId}`);

      if (!response.ok) {
        throw new Error('获取视频详情失败');
      }

      return response.json();
    },
    // 单个视频详情 10 分钟内被认为是新鲜的
    staleTime: 10 * 60 * 1000,
    // 如果 videoId 为空，不执行查询
    enabled: !!videoId,
  });
}

// 获取统计数据
export function useStats() {
  return useQuery({
    queryKey: ['videos', { isActive: true, limit: 1000 }],
    queryFn: async (): Promise<VideosResponse> => {
      const response = await fetch('/api/videos?isActive=true&limit=1000');

      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }

      return response.json();
    },
    // 统计数据在 10 分钟内被认为是新鲜的
    staleTime: 10 * 60 * 1000,
    // 缓存时间 30 分钟
    gcTime: 30 * 60 * 1000,
    // 组件挂载时不自动重新获取（已有缓存时）
    refetchOnMount: false,
    // 窗口聚焦时不自动重新获取
    refetchOnWindowFocus: false,
  });
}
