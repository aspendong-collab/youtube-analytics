'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCategoryName } from '@/lib/youtube-categories';

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
  categoryId?: string;
  owner?: string;
  createdAt: string | Date;
  latestStats?: VideoStats | null;
}

export default function AnalysisPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [filters, setFilters] = useState({
    channel: 'all',
    owner: 'all',
    category: 'all',
    status: 'all',
  });
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

  // 计算统计数据
  const calculateStats = () => {
    const totalViews = videos.reduce((sum, v) => sum + (v.latestStats?.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.latestStats?.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, v) => sum + (v.latestStats?.commentCount || 0), 0);
    const averageEngagement = totalViews > 0
      ? ((totalLikes + totalComments) / totalViews) * 100
      : 0;

    return {
      totalViews,
      totalLikes,
      totalComments,
      averageEngagement: averageEngagement.toFixed(1),
    };
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // 获取唯一列表
  const channels = Array.from(new Set(videos.map((v) => v.channelTitle).filter(Boolean)));
  const owners = Array.from(new Set(videos.map((v) => v.owner).filter(Boolean)));
  const categories = Array.from(new Set(videos.map((v) => v.categoryId).filter(Boolean)));

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          视频分析
        </h1>
        <p className="text-sm text-[#86868B]">
          查看视频数据表现，分析趋势与规律
        </p>
      </div>

      {/* 日期筛选 */}
      <Card className="p-4 bg-[#F5F5F7] border-none">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[#86868B]">📅 日期范围</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="thisMonth">本月</option>
            <option value="thisQuarter">本季度</option>
          </select>
          <div className="flex gap-2">
            {['7d', '30d', 'thisMonth'].map(value => (
              <button
                key={value}
                onClick={() => setDateRange(value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  dateRange === value
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#86868B] hover:bg-white'
                }`}
              >
                {value === '7d' ? '最近7天' : value === '30d' ? '最近30天' : '本月'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 维度筛选 */}
      <Card className="p-5 bg-[#F5F5F7] border-none">
        <div className="mb-4">
          <span className="text-sm font-medium text-[#86868B]">🎯 维度筛选</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#86868B]">博主</label>
            <select
              value={filters.channel}
              onChange={(e) => setFilters({ ...filters, channel: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
            >
              <option value="all">全部</option>
              {channels.map((channel) => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#86868B]">负责人</label>
            <select
              value={filters.owner}
              onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
            >
              <option value="all">全部</option>
              {owners.map((owner) => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#86868B]">分类</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
            >
              <option value="all">全部</option>
              {categories.map((category) => (
                <option key={category} value={category}>{getCategoryName(category)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#86868B]">状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
            >
              <option value="all">全部</option>
              <option value="excellent">优秀</option>
              <option value="normal">正常</option>
              <option value="warning">异常</option>
            </select>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setFilters({
              channel: 'all',
              owner: 'all',
              category: 'all',
              status: 'all',
            });
          }}
        >
          重置筛选
        </Button>
      </Card>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="总观看量"
          value={formatNumber(stats.totalViews)}
        />
        <MetricCard
          title="总点赞数"
          value={formatNumber(stats.totalLikes)}
        />
        <MetricCard
          title="总评论数"
          value={formatNumber(stats.totalComments)}
        />
        <MetricCard
          title="平均互动率"
          value={stats.averageEngagement + '%'}
        />
      </div>

      {/* 趋势图表 */}
      <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          观看量趋势
        </h2>
        <div className="flex gap-4 mb-4">
          <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm">
            观看量
          </button>
          <button className="px-4 py-2 bg-[#F5F5F7] text-[#86868B] rounded-lg text-sm">
            点赞数
          </button>
          <button className="px-4 py-2 bg-[#F5F5F7] text-[#86868B] rounded-lg text-sm">
            评论数
          </button>
          <button className="px-4 py-2 bg-[#F5F5F7] text-[#86868B] rounded-lg text-sm">
            互动率
          </button>
        </div>
        <div className="h-[300px] flex items-center justify-center bg-[#F5F5F7] rounded-xl">
          <p className="text-[#86868B]">折线图将在这里渲染（使用 Recharts）</p>
        </div>
      </Card>

      {/* 对比分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
            博主表现对比
          </h2>
          <div className="h-[300px] flex items-center justify-center bg-[#F5F5F7] rounded-xl">
            <p className="text-[#86868B]">柱状图将在这里渲染</p>
          </div>
        </Card>
        <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
            视频分类分布
          </h2>
          <div className="h-[300px] flex items-center justify-center bg-[#F5F5F7] rounded-xl">
            <p className="text-[#86868B]">饼图将在这里渲染</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// 指标卡片组件
function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="text-sm text-[#86868B] mb-2">{title}</div>
      <div className="text-2xl font-semibold text-[#1D1D1F]">{value}</div>
    </div>
  );
}
