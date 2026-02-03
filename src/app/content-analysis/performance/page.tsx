'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TrendingUp, Eye, Clock, Heart, MessageCircle, ThumbsUp } from 'lucide-react';

interface VideoPerformance {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  averageViewDuration: number;
  ctr: number;
  retentionRate: number;
  engagementRate: number;
  healthScore: number;
  publishDate: string;
}

export default function ContentPerformancePage() {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoPerformance[]>([]);
  const [sortBy, setSortBy] = useState<'views' | 'ctr' | 'retention' | 'engagement'>('views');
  const [selectedVideo, setSelectedVideo] = useState<VideoPerformance | null>(null);

  useEffect(() => {
    loadVideoPerformance();
  }, [sortBy]);

  const loadVideoPerformance = async () => {
    setLoading(true);
    try {
      // 模拟数据，实际应该从API获取
      const mockVideos: VideoPerformance[] = [
        {
          id: '1',
          title: 'Python学习指南：从入门到精通',
          thumbnail: 'https://example.com/thumb1.jpg',
          views: 125000,
          averageViewDuration: 480, // 8分钟
          ctr: 8.2,
          retentionRate: 58,
          engagementRate: 6.5,
          healthScore: 85,
          publishDate: '2024-01-15',
        },
        {
          id: '2',
          title: '10个React技巧让你的代码更优雅',
          thumbnail: 'https://example.com/thumb2.jpg',
          views: 89000,
          averageViewDuration: 360,
          ctr: 6.8,
          retentionRate: 45,
          engagementRate: 5.2,
          healthScore: 72,
          publishDate: '2024-01-10',
        },
        {
          id: '3',
          title: '如何学习编程：新手必看指南',
          thumbnail: 'https://example.com/thumb3.jpg',
          views: 156000,
          averageViewDuration: 420,
          ctr: 9.5,
          retentionRate: 62,
          engagementRate: 7.8,
          healthScore: 92,
          publishDate: '2024-01-20',
        },
      ];

      // 根据选择的字段排序
      const sorted = [...mockVideos].sort((a, b) => {
        const aVal = sortBy === 'retention' ? a.retentionRate : sortBy === 'engagement' ? a.engagementRate : a[sortBy];
        const bVal = sortBy === 'retention' ? b.retentionRate : sortBy === 'engagement' ? b.engagementRate : b[sortBy];
        return (bVal as number) - (aVal as number);
      });
      setVideos(sorted);
    } catch (error) {
      console.error('加载失败:', error);
      toast.error('加载视频表现数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 90) return { color: 'bg-green-500', text: '优秀' };
    if (score >= 80) return { color: 'bg-blue-500', text: '良好' };
    if (score >= 70) return { color: 'bg-yellow-500', text: '一般' };
    return { color: 'bg-red-500', text: '需改进' };
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          内容表现分析
        </h1>
        <p className="text-gray-600">
          分析视频表现，发现成功模式，优化内容策略
        </p>
      </div>

      {/* 排序选择器 */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">排序方式：</span>
          <Button
            variant={sortBy === 'views' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('views')}
          >
            <Eye className="w-4 h-4 mr-2" />
            播放量
          </Button>
          <Button
            variant={sortBy === 'ctr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('ctr')}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            CTR
          </Button>
          <Button
            variant={sortBy === 'retention' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('retention')}
          >
            <Clock className="w-4 h-4 mr-2" />
            完播率
          </Button>
          <Button
            variant={sortBy === 'engagement' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('engagement')}
          >
            <Heart className="w-4 h-4 mr-2" />
            互动率
          </Button>
        </div>
      </Card>

      {/* 视频列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video, index) => {
            const healthBadge = getHealthScoreBadge(video.healthScore);
            return (
              <Card key={video.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex gap-4">
                  {/* 缩略图 */}
                  <div className="w-48 h-28 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">
                    缩略图
                  </div>

                  {/* 内容 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-gray-500">#{index + 1}</span>
                          <h3 className="text-lg font-semibold">{video.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500">发布日期: {video.publishDate}</p>
                      </div>
                      <Badge className={`${healthBadge.color} text-white`}>
                        {healthBadge.text} ({video.healthScore}分)
                      </Badge>
                    </div>

                    {/* 指标 */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                          <Eye className="w-4 h-4" />
                          播放量
                        </div>
                        <div className="text-xl font-bold">{video.views.toLocaleString()}</div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                          <ThumbsUp className="w-4 h-4" />
                          CTR
                        </div>
                        <div className="text-xl font-bold">{video.ctr}%</div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                          <Clock className="w-4 h-4" />
                          完播率
                        </div>
                        <div className="text-xl font-bold">{video.retentionRate}%</div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                          <Heart className="w-4 h-4" />
                          互动率
                        </div>
                        <div className="text-xl font-bold">{video.engagementRate}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
