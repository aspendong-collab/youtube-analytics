'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Video, TrendingUp, Eye, ThumbsUp, MessageSquare, Calendar } from 'lucide-react';

interface ContentStrategy {
  channelId: string;
  channelTitle: string;
  topVideos: Array<{
    videoId: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    publishDate: string;
  }>;
  keywords: Array<{ keyword: string; count: number }>;
  uploadFrequency: string;
  averageViews: number;
  bestDayOfWeek: string;
}

export default function ContentBenchmarkPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<ContentStrategy | null>(null);

  useEffect(() => {
    loadStrategy();
  }, []);

  const loadStrategy = async () => {
    setIsLoading(true);

    try {
      // 从localStorage获取追踪的频道
      const saved = localStorage.getItem('trackedChannels');
      if (!saved) {
        toast.error('请先添加要追踪的频道');
        setIsLoading(false);
        return;
      }

      const trackedChannels = JSON.parse(saved);
      if (trackedChannels.length === 0) {
        toast.error('请先添加要追踪的频道');
        setIsLoading(false);
        return;
      }

      // 模拟内容策略数据
      const mockStrategy: ContentStrategy = {
        channelId: trackedChannels[0].channelId,
        channelTitle: trackedChannels[0].channelTitle,
        topVideos: [
          {
            videoId: '1',
            title: 'React 18 新特性完全解析',
            views: 125000,
            likes: 8500,
            comments: 450,
            publishDate: '2024-01-15',
          },
          {
            videoId: '2',
            title: 'TypeScript 最佳实践指南',
            views: 98000,
            likes: 7200,
            comments: 320,
            publishDate: '2024-01-20',
          },
          {
            videoId: '3',
            title: 'Next.js 14 全栈开发实战',
            views: 87000,
            likes: 6800,
            comments: 290,
            publishDate: '2024-01-25',
          },
        ],
        keywords: [
          { keyword: 'React', count: 15 },
          { keyword: 'TypeScript', count: 12 },
          { keyword: 'Next.js', count: 10 },
          { keyword: '教程', count: 8 },
          { keyword: '实战', count: 6 },
        ],
        uploadFrequency: '每周3次',
        averageViews: 45000,
        bestDayOfWeek: '周二',
      };

      setStrategy(mockStrategy);
    } catch (error) {
      console.error('加载失败:', error);
      toast.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
            <Video className="w-8 h-8" />
            内容策略对标
          </h1>
          <p className="text-gray-600">
            分析竞品内容策略，发现成功模式
          </p>
        </div>
        <Button onClick={loadStrategy} disabled={isLoading}>
          {isLoading ? '加载中...' : '刷新数据'}
        </Button>
      </div>

      {/* 策略概览 */}
      {strategy && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">频道: {strategy.channelTitle}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">平均播放量</div>
                <div className="text-2xl font-bold">
                  {formatNumber(strategy.averageViews)}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">更新频率</div>
                <div className="text-2xl font-bold">
                  {strategy.uploadFrequency}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">最佳发布日</div>
                <div className="text-2xl font-bold">
                  {strategy.bestDayOfWeek}
                </div>
              </div>
            </div>

            {/* 热门关键词 */}
            <div>
              <h4 className="font-medium mb-3">热门关键词</h4>
              <div className="flex flex-wrap gap-2">
                {strategy.keywords.map((kw, index) => (
                  <Badge key={index} variant="secondary">
                    {kw.keyword} ({kw.count})
                  </Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* 热门视频 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Video className="w-5 h-5" />
              热门视频 (Top 3)
            </h3>
            <div className="space-y-4">
              {strategy.topVideos.map((video, index) => (
                <div
                  key={video.videoId}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Badge variant="outline" className="text-lg font-mono">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{video.title}</h4>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatNumber(video.views)}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {formatNumber(video.likes)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {formatNumber(video.comments)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {video.publishDate}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 策略建议 */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              策略建议
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm">重点关注热门关键词，制作相关主题视频</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm">保持{strategy.uploadFrequency}的更新频率</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm">在{strategy.bestDayOfWeek}发布新视频</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-sm">学习热门视频的标题结构和内容布局</span>
              </li>
            </ul>
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && !strategy && (
        <Card className="p-12 text-center text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>点击右上角按钮加载内容策略数据</p>
          <p className="text-sm mt-2">请先在"竞品频道追踪"中添加频道</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      )}
    </div>
  );
}
