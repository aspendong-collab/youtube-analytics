'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useVideos, type Video } from '@/hooks/use-videos';
import { Trash2, Loader2 } from 'lucide-react';

export default function VideosPage() {
  const router = useRouter();
  const { data, isLoading, isFetching, error, status, refetch } = useVideos({ isActive: true, limit: 100 });
  const [filterOwner, setFilterOwner] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 删除相关状态
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const videos = data?.videos || [];

  // 调试信息
  console.log('[VideosPage] Status:', status, 'isLoading:', isLoading, 'isFetching:', isFetching, 'videos count:', videos.length);

  // 如果有错误，显示错误信息
  if (error) {
    console.error('[VideosPage] Error:', error);
    toast.error('加载视频列表失败');
  }

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'W';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
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

  // 筛选视频
  const filteredVideos = videos.filter((video) => {
    const matchOwner = !filterOwner || video.owner === filterOwner;
    const matchSearch = !searchQuery ||
                       video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       (video.channelTitle && video.channelTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchOwner && matchSearch;
  });

  // 获取所有负责人
  const owners = Array.from(new Set(videos.map((v) => v.owner).filter(Boolean)));

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
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除视频失败';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      setDeleteVideoId(null);
    }
  };

  // 只有在第一次加载且没有任何数据时才显示加载中
  const isFirstLoad = status === 'pending' && videos.length === 0;

  if (isFirstLoad) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
            视频监控
          </h1>
          <p className="text-sm text-[#86868B]">
            管理所有监控的视频，查看实时数据
          </p>
        </div>
        <Button
          onClick={() => router.push('/videos/add')}
          className="bg-[#007AFF] hover:bg-[#0056CC] text-white rounded-xl px-6"
        >
          + 添加视频
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card className="p-4 bg-[#F5F5F7] border-none">
        <div className="flex gap-4">
          <select
            className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
          >
            <option value="">全部负责人</option>
            {owners.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="搜索视频..."
            className="flex-1 px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
              <VideoCard
                key={video.id}
                id={video.id}
                videoId={video.videoId}
                thumbnail={video.thumbnail}
                title={video.title}
                owner={video.owner || '未分配'}
                views={formatNumber(views)}
                likes={formatNumber(likes)}
                comments={formatNumber(comments)}
                engagement={engagementStr}
                publishedAt={formatDate(video.createdAt)}
                status={status}
                onDelete={() => setDeleteVideoId(video.id)}
              />
            );
          })}
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={(open) => !open && !isDeleting && setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除视频？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该视频及其所有相关统计数据（包括历史统计数据）。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
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
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  确认删除
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 视频卡片组件
function VideoCard({
  id,
  videoId,
  thumbnail,
  title,
  owner,
  views,
  likes,
  comments,
  engagement,
  publishedAt,
  status,
  onDelete,
}: {
  id: string;
  videoId: string;
  thumbnail?: string;
  title: string;
  owner: string;
  views: string;
  likes: string;
  comments: string;
  engagement: string;
  publishedAt: string;
  status: 'excellent' | 'normal' | 'warning';
  onDelete: () => void;
}) {
  const statusConfig = {
    excellent: { label: '优秀', color: 'bg-[#34C759]' },
    normal: { label: '正常', color: 'bg-[#007AFF]' },
    warning: { label: '需关注', color: 'bg-[#FF9500]' },
  };

  const config = statusConfig[status];

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <Card className="p-5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200">
      <div className="flex gap-4">
        {/* 缩略图 */}
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200"
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#86868B]">
              无缩略图
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-sm">▶</span>
          </div>
        </a>

        {/* 视频信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#1D1D1F] mb-1 truncate hover:text-[#007AFF] transition-colors"
              >
                {title}
              </a>
              <p className="text-sm text-[#86868B] mb-2">
                {owner} • {publishedAt}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs text-white ${config.color}`}>
              {config.label}
            </span>
          </div>

          {/* 数据指标 */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-[#86868B]">👀</span>{' '}
              <span className="font-medium text-[#1D1D1F]">{views}</span>
            </div>
            <div>
              <span className="text-[#86868B]">👍</span>{' '}
              <span className="font-medium text-[#1D1D1F]">{likes}</span>
            </div>
            <div>
              <span className="text-[#86868B]">💬</span>{' '}
              <span className="font-medium text-[#1D1D1F]">{comments}</span>
            </div>
            <div>
              <span className="text-[#86868B]">📊</span>{' '}
              <span className="font-medium text-[#1D1D1F]">{engagement}</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open(`/videos/${id}`, '_blank')}
            >
              查看详情
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => window.open(videoUrl, '_blank')}
            >
              在 YouTube 打开
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              删除
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
