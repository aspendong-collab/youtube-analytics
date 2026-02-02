'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCategoryName } from '@/lib/youtube-categories';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

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
  thumbnail?: string;
  createdAt: string | Date;
  latestStats?: VideoStats | null;
}

export default function MonitoringPage() {
  const router = useRouter();
  const [dateRange, setDateRange] = useState('7d');
  const [filters, setFilters] = useState({
    channel: 'all',
    owner: 'all',
    category: 'all',
    status: 'all',
  });
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterOwner, setFilterOwner] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 删除相关状态
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // 格式化日期
  const formatDate = (date: string | Date): string => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return d.toLocaleDateString('zh-CN');
  };

  // 计算互动率
  const calculateEngagement = (views: number, likes: number, comments: number): string => {
    if (views === 0) return '0%';
    const engagement = ((likes + comments) / views) * 100;
    return engagement.toFixed(1) + '%';
  };

  // 计算状态
  const calculateStatus = (engagement: number): 'excellent' | 'normal' | 'warning' => {
    if (engagement >= 8) return 'excellent';
    if (engagement >= 5) return 'normal';
    return 'warning';
  };

  // 获取唯一列表
  const channels = Array.from(new Set(videos.map((v) => v.channelTitle).filter(Boolean)));
  const owners = Array.from(new Set(videos.map((v) => v.owner).filter(Boolean)));
  const categories = Array.from(new Set(videos.map((v) => v.categoryId).filter(Boolean)));

  // 筛选视频
  const filteredVideos = videos.filter((video) => {
    const stats = video.latestStats;
    const views = stats?.viewCount || 0;
    const likes = stats?.likeCount || 0;
    const comments = stats?.commentCount || 0;
    const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

    const matchOwner = !filterOwner || video.owner === filterOwner;
    const matchSearch = !searchQuery ||
                       video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (video.channelTitle && video.channelTitle.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchFilterChannel = filters.channel === 'all' || video.channelTitle === filters.channel;
    const matchFilterOwner = filters.owner === 'all' || video.owner === filters.owner;
    const matchFilterCategory = filters.category === 'all' || video.categoryId === filters.category;
    const matchFilterStatus = filters.status === 'all' ||
      (filters.status === 'excellent' && engagement >= 8) ||
      (filters.status === 'normal' && engagement >= 5 && engagement < 8) ||
      (filters.status === 'warning' && engagement < 5);

    return matchOwner && matchSearch && matchFilterChannel && matchFilterOwner && matchFilterCategory && matchFilterStatus;
  });

  // 删除视频
  const handleDeleteVideo = async () => {
    if (!deleteVideoId) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/videos/${deleteVideoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '删除视频失败');
      }

      const data = await response.json();

      toast.success(data.message || '视频删除成功');

      // 刷新视频列表
      loadVideos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除视频失败';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteVideoId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
            视频监控
          </h1>
          <p className="text-sm text-[#86868B]">
            监控所有视频数据，分析趋势与表现
          </p>
        </div>
        <Button
          onClick={() => router.push('/videos/add')}
          className="bg-[#007AFF] hover:bg-[#0056CC] text-white rounded-xl px-6"
        >
          + 添加视频
        </Button>
      </div>

      {/* 关键指标看板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-none shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <div className="text-[#86868B] text-sm mb-2">总播放量</div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">{formatNumber(stats.totalViews)}</div>
          <div className="text-xs text-[#86868B] mt-1">累计观看次数</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-none shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <div className="text-[#86868B] text-sm mb-2">总点赞数</div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">{formatNumber(stats.totalLikes)}</div>
          <div className="text-xs text-[#86868B] mt-1">累计点赞数</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-none shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <div className="text-[#86868B] text-sm mb-2">总评论数</div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">{formatNumber(stats.totalComments)}</div>
          <div className="text-xs text-[#86868B] mt-1">累计评论数</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-white border-none shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <div className="text-[#86868B] text-sm mb-2">平均互动率</div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">{stats.averageEngagement}%</div>
          <div className="text-xs text-[#86868B] mt-1">互动率统计</div>
        </Card>
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
      </Card>

      {/* 视频列表 */}
      {filteredVideos.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-[#86868B] mb-4">
            {videos.length === 0 ? '暂无视频数据' : '没有找到匹配的视频'}
          </div>
          {videos.length === 0 && (
            <Button
              onClick={() => router.push('/videos/add')}
              className="bg-[#007AFF] hover:bg-[#0056CC]"
            >
              添加第一个视频
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => {
            const stats = video.latestStats;
            const views = stats?.viewCount || 0;
            const likes = stats?.likeCount || 0;
            const comments = stats?.commentCount || 0;
            const engagementStr = calculateEngagement(views, likes, comments);
            const engagement = parseFloat(engagementStr);
            const status = calculateStatus(engagement);

            return (
              <Card
                key={video.id}
                className="p-6 bg-white border border-[rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow"
              >
                <div className="flex gap-4">
                  {/* 缩略图 */}
                  <div className="w-40 h-24 bg-[#F5F5F7] rounded-lg overflow-hidden flex-shrink-0">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#86868B]">
                        📹
                      </div>
                    )}
                  </div>

                  {/* 视频信息 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1D1D1F] mb-1 truncate">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-[#86868B] mb-2">
                      <span>{video.channelTitle || '未知博主'}</span>
                      <span>•</span>
                      <span>{getCategoryName(video.categoryId)}</span>
                      <span>•</span>
                      <span>{video.owner || '未分配'}</span>
                      <span>•</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>

                    {/* 数据指标 */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-[#86868B]">播放量</span>
                        <span className="text-sm font-semibold text-[#1D1D1F]">
                          {formatNumber(views)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-[#86868B]">点赞</span>
                        <span className="text-sm font-semibold text-[#1D1D1F]">
                          {formatNumber(likes)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-[#86868B]">评论</span>
                        <span className="text-sm font-semibold text-[#1D1D1F]">
                          {formatNumber(comments)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-[#86868B]">互动率</span>
                        <span
                          className={`text-sm font-semibold ${
                            status === 'excellent'
                              ? 'text-green-600'
                              : status === 'normal'
                              ? 'text-blue-600'
                              : 'text-orange-600'
                          }`}
                        >
                          {engagementStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/videos/${video.id}/edit`)}
                      className="text-[#007AFF]"
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteVideoId(video.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={(open) => !open && setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该视频数据，删除后无法恢复。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVideo}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                '确认删除'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
