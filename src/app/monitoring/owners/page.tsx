'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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
  owner?: string;
  createdAt: string | Date;
  latestStats?: VideoStats | null;
}

interface OwnerData {
  id: string;
  name: string;
  videos: number;
  totalViews: number;
  avgViews: number;
  engagement: number;
}

export default function OwnersPerformancePage() {
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

  // 按负责人分组统计
  const getOwnerStats = () => {
    const ownerMap = new Map<string, OwnerData>();

    videos.forEach((video) => {
      const ownerName = video.owner || '未分配';
      const existing = ownerMap.get(ownerName) || {
        id: ownerName,
        name: ownerName,
        videos: 0,
        totalViews: 0,
        avgViews: 0,
        engagement: 0,
      };

      const views = video.latestStats?.viewCount || 0;
      const likes = video.latestStats?.likeCount || 0;
      const comments = video.latestStats?.commentCount || 0;
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

      ownerMap.set(ownerName, {
        ...existing,
        videos: existing.videos + 1,
        totalViews: existing.totalViews + views,
        avgViews: existing.avgViews + views,
        engagement: existing.engagement + engagement,
      });
    });

    return Array.from(ownerMap.values())
      .map((owner) => ({
        ...owner,
        avgViews: owner.avgViews / owner.videos,
        engagement: owner.engagement / owner.videos,
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .map((owner, index) => ({ ...owner, rank: index + 1 }));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const owners = getOwnerStats();

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
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">排行榜</h1>
          <p className="text-sm text-[#86868B] mt-1">查看负责人的工作绩效和表现</p>
        </div>
        <Card className="p-12 text-center">
          <div className="text-[#86868B]">暂无视频数据，请先添加视频</div>
        </Card>
      </div>
    );
  }

  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, v) => sum + (v.latestStats?.viewCount || 0), 0);
  const avgEngagement = videos.reduce((sum, v) => {
    const views = v.latestStats?.viewCount || 0;
    const likes = v.latestStats?.likeCount || 0;
    const comments = v.latestStats?.commentCount || 0;
    const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;
    return sum + engagement;
  }, 0) / videos.length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">排行榜</h1>
        <p className="text-sm text-[#86868B] mt-1">查看负责人的工作绩效和表现</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">总视频数</h3>
          <p className="text-2xl font-bold text-[#1D1D1F]">{totalVideos}</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">总播放量</h3>
          <p className="text-2xl font-bold text-[#007AFF]">{formatNumber(totalViews)}</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">平均互动率</h3>
          <p className="text-2xl font-bold text-[#007AFF]">{avgEngagement.toFixed(1)}%</p>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <h3 className="text-sm font-medium text-[#86868B] mb-2">负责人数量</h3>
          <p className="text-2xl font-bold text-green-600">{owners.length}</p>
        </Card>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h3 className="text-lg font-medium text-[#1D1D1F] mb-4">绩效排行榜</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[#86868B]">排名</TableHead>
              <TableHead className="text-[#86868B]">姓名</TableHead>
              <TableHead className="text-[#86868B]">视频数</TableHead>
              <TableHead className="text-[#86868B]">总播放量</TableHead>
              <TableHead className="text-[#86868B]">平均播放量</TableHead>
              <TableHead className="text-[#86868B]">互动率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {owners.map((person) => (
              <TableRow key={person.id}>
                <TableCell>
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    person.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                    person.rank === 2 ? 'bg-gray-100 text-gray-800' :
                    person.rank === 3 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {person.rank}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{person.name}</TableCell>
                <TableCell>{person.videos}</TableCell>
                <TableCell>{formatNumber(person.totalViews)}</TableCell>
                <TableCell>{formatNumber(person.avgViews)}</TableCell>
                <TableCell>{person.engagement.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
