'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Target, Play, Plus, TrendingUp, Users, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompetitorVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  viewCount?: number;
  duration?: number;
  region?: string;
  language?: string;
}

interface CompetitorChannel {
  channelId: string;
  channelTitle: string;
}

export default function CompetitorTrackingPage() {
  const router = useRouter();
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [videos, setVideos] = useState<CompetitorVideo[]>([]);
  const [channelInfo, setChannelInfo] = useState<CompetitorChannel | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const handleSearch = async () => {
    if (!channelId.trim()) {
      toast.error('请输入频道ID');
      return;
    }

    setIsLoading(true);
    setVideos([]);
    setChannelInfo(null);
    setImportedCount(0);

    try {
      const response = await fetch(
        `/api/search?mode=competitor&channelId=${channelId}&maxResults=50`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取竞品视频失败');
      }

      const data = await response.json();
      setVideos(data.videos || []);

      if (data.channelTitle) {
        setChannelInfo({
          channelId: data.channelId || channelId,
          channelTitle: data.channelTitle,
        });
      }

      toast.success(`找到 ${data.videos?.length || 0} 个竞品视频`);
    } catch (error) {
      console.error('获取竞品视频失败:', error);
      toast.error(error instanceof Error ? error.message : '获取竞品视频失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportAll = async () => {
    if (videos.length === 0) {
      toast.error('没有可导入的视频');
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let failedCount = 0;

    for (const video of videos) {
      try {
        const response = await fetch('/api/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
          }),
        });

        if (response.ok) {
          successCount++;
        } else if (response.status === 409) {
          // 已存在
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
      }

      // 添加延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setImportedCount(successCount);
    setIsImporting(false);

    if (failedCount > 0) {
      toast.warning(`成功导入 ${successCount} 个，失败 ${failedCount} 个`);
    } else {
      toast.success(`成功导入 ${successCount} 个视频`);
    }
  };

  const addSingleVideo = async (video: CompetitorVideo) => {
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 409) {
          toast.info('视频已存在');
        } else {
          throw new Error(error.error || '添加失败');
        }
      } else {
        toast.success('视频添加成功');
        setImportedCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('添加视频失败:', error);
      toast.error(error instanceof Error ? error.message : '添加失败');
    }
  };

  const formatViewCount = (count: number) => {
    if (!count) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const formatDuration = (duration: number) => {
    if (!duration) return '未知';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getRegionName = (region: string) => {
    const regions: Record<string, string> = {
      'US': '美国',
      'CN': '中国',
      'JP': '日本',
      'KR': '韩国',
      'GB': '英国',
      'DE': '德国',
      'FR': '法国',
      'IN': '印度',
    };
    return regions[region] || region;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Target className="w-8 h-8" />
          竞品追踪
        </h1>
        <p className="text-gray-600">
          导入竞品频道的视频，对比分析表现，发现增长机会
        </p>
      </div>

      {/* 搜索面板 */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="channelId">竞品频道ID</Label>
            <Input
              id="channelId"
              placeholder="例如：UCxxxxxxxxxxxxxxxxxxxxxxx"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <p className="text-xs text-gray-500 mt-1">
              从YouTube频道URL中获取，例如：youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxxx
            </p>
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? '搜索中...' : '搜索竞品视频'}
          </Button>
        </div>
      </Card>

      {/* 频道信息 */}
      {channelInfo && (
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{channelInfo.channelTitle}</h3>
              <p className="text-sm text-gray-600">频道ID: {channelInfo.channelId}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {videos.length} 个视频
              </Badge>
              {videos.length > 0 && (
                <Button onClick={handleImportAll} disabled={isImporting}>
                  {isImporting ? '导入中...' : '全部导入'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 视频列表 */}
      {videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              竞品视频 ({videos.length})
            </h2>
            {importedCount > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                已导入 {importedCount} 个
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4">
            {videos.map((video) => (
              <Card key={video.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* 缩略图 */}
                  <div className="w-48 flex-shrink-0">
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-xs">
                        {formatDuration(video.duration)}
                      </Badge>
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium line-clamp-2 mb-2">{video.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {video.viewCount && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatViewCount(video.viewCount)}
                        </Badge>
                      )}
                      {video.region && (
                        <Badge variant="outline">
                          {getRegionName(video.region)}
                        </Badge>
                      )}
                      {video.language && (
                        <Badge variant="outline">
                          {video.language}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                      {video.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        播放
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addSingleVideo(video)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        导入
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && videos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>输入竞品频道ID开始追踪</p>
          <p className="text-sm mt-2">提示：可以从YouTube频道页面的URL中获取频道ID</p>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载竞品视频中...</p>
        </div>
      )}
    </div>
  );
}
