'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VideoStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  statDate: string | Date;
}

interface Video {
  id: string;
  videoId: string;
  title: string;
  channelId?: string;
  channelTitle?: string;
  owner?: string;
  createdAt: string | Date;
  publishDate?: string | Date;
  cooperationCost?: number;
  latestStats?: VideoStats | null;
}

interface ChannelData {
  id: string;
  name: string;
  videos: number;
  totalViews: number;
  avgViews: number;
  avgEngagement: number;
  totalCost: number;
  avgCPV: number;
  channelId: string;
}

export default function ChannelsAnalysisPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await fetch('/api/videos?isActive=true&limit=1000');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('加载视频数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 按频道分组统计
  const getChannelStats = () => {
    const channelMap = new Map<string, ChannelData>();

    videos.forEach((video) => {
      const channelName = video.channelTitle || '未知频道';
      const existing = channelMap.get(channelName) || {
        id: video.channelId || video.id,
        name: channelName,
        channelId: video.channelId || video.id,
        videos: 0,
        totalViews: 0,
        avgViews: 0,
        avgEngagement: 0,
        totalCost: 0,
        avgCPV: 0,
      };

      const views = video.latestStats?.viewCount || 0;
      const likes = video.latestStats?.likeCount || 0;
      const comments = video.latestStats?.commentCount || 0;
      const cost = parseFloat(String(video.cooperationCost || 0));
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

      channelMap.set(channelName, {
        ...existing,
        videos: existing.videos + 1,
        totalViews: existing.totalViews + views,
        avgViews: existing.avgViews + views,
        avgEngagement: existing.avgEngagement + engagement,
        totalCost: existing.totalCost + cost,
      });
    });

    return Array.from(channelMap.values())
      .map((channel) => ({
        ...channel,
        avgViews: channel.avgViews / channel.videos,
        avgEngagement: channel.avgEngagement / channel.videos,
        avgCPV: channel.totalViews > 0 ? channel.totalCost / channel.totalViews : 0,
      }))
      .sort((a, b) => b.totalViews - a.totalViews);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const channels = getChannelStats();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">博主分析</h1>
          <p className="text-sm text-[#86868B] mt-1">分析博主的运营数据和表现</p>
        </div>
        <Card className="p-12 text-center">
          <div className="text-[#86868B]">暂无视频数据，请先添加视频</div>
        </Card>
      </div>
    );
  }

  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, v) => sum + (v.latestStats?.viewCount || 0), 0);
  const totalCost = videos.reduce((sum, v) => sum + parseFloat(String(v.cooperationCost || 0)), 0);
  const avgEngagement = videos.reduce((sum, v) => {
    const views = v.latestStats?.viewCount || 0;
    const likes = v.latestStats?.likeCount || 0;
    const comments = v.latestStats?.commentCount || 0;
    const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
    return sum + engagement;
  }, 0) / videos.length;
  const avgCPV = totalViews > 0 ? totalCost / totalViews : 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">博主分析</h1>
        <p className="text-sm text-[#86868B] mt-1">分析博主的运营数据和表现</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">博主数量</h3>
          <p className="text-2xl font-bold text-[#1D1D1F]">{channels.length}</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">总视频数</h3>
          <p className="text-2xl font-bold text-[#007AFF]">{totalVideos}</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">平均互动率</h3>
          <p className="text-2xl font-bold text-[#007AFF]">{avgEngagement.toFixed(1)}%</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">平均 CPV</h3>
          <p className="text-2xl font-bold text-[#007AFF]">${avgCPV.toFixed(4)}</p>
        </Card>
      </div>

      {/* 博主列表 */}
      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[#86868B]">博主名称</TableHead>
              <TableHead className="text-[#86868B]">视频数量</TableHead>
              <TableHead className="text-[#86868B]">总播放量</TableHead>
              <TableHead className="text-[#86868B]">平均播放量</TableHead>
              <TableHead className="text-[#86868B]">平均互动率</TableHead>
              <TableHead className="text-[#86868B]">总费用</TableHead>
              <TableHead className="text-[#86868B]">平均 CPV</TableHead>
              <TableHead className="text-[#86868B]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((channel) => (
              <TableRow key={channel.id}>
                <TableCell className="font-medium">
                  {channel.name}
                </TableCell>
                <TableCell>{channel.videos}</TableCell>
                <TableCell>{formatNumber(channel.totalViews)}</TableCell>
                <TableCell>{formatNumber(channel.avgViews)}</TableCell>
                <TableCell>{channel.avgEngagement.toFixed(1)}%</TableCell>
                <TableCell>${channel.totalCost.toFixed(2)}</TableCell>
                <TableCell>${channel.avgCPV.toFixed(4)}</TableCell>
                <TableCell>
                  <Link href={`/monitoring/channels/${channel.channelId}`}>
                    <Button variant="outline" size="sm">
                      查看详情
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
