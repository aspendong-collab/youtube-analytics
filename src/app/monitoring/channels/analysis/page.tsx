'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TrendingUp, Users, Video, Plus, Target, BarChart3 } from 'lucide-react';

interface ChannelStats {
  channelId: string;
  channelTitle: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
}

interface CompetitorChannel {
  id: string;
  channelId: string;
  channelTitle: string;
  isTracked: boolean;
}

export default function ChannelAnalysisPage() {
  const [tab, setTab] = useState<'tracking' | 'benchmark' | 'growth'>('tracking');
  const [trackedChannels, setTrackedChannels] = useState<CompetitorChannel[]>([]);
  const [channelId, setChannelId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);

  useEffect(() => {
    loadTrackedChannels();
  }, []);

  const loadTrackedChannels = () => {
    // 从localStorage或API加载已追踪的频道
    const saved = localStorage.getItem('trackedChannels');
    if (saved) {
      setTrackedChannels(JSON.parse(saved));
    }
  };

  const trackChannel = async () => {
    if (!channelId.trim()) {
      toast.error('请输入频道ID');
      return;
    }

    setIsLoading(true);

    try {
      // 调用YouTube API获取频道信息
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('未配置YouTube API Key');
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('获取频道信息失败');
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error('未找到该频道');
      }

      const channel = data.items[0];
      const stats: ChannelStats = {
        channelId: channel.id,
        channelTitle: channel.snippet.title,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0,
        viewCount: parseInt(channel.statistics.viewCount) || 0,
        publishedAt: channel.snippet.publishedAt,
      };

      setChannelStats(stats);

      // 添加到追踪列表
      const newChannel: CompetitorChannel = {
        id: Date.now().toString(),
        channelId: channel.id,
        channelTitle: channel.snippet.title,
        isTracked: true,
      };

      const updated = [...trackedChannels, newChannel];
      setTrackedChannels(updated);
      localStorage.setItem('trackedChannels', JSON.stringify(updated));

      toast.success(`已添加频道: ${channel.snippet.title}`);
      setChannelId('');
    } catch (error) {
      console.error('追踪频道失败:', error);
      toast.error(error instanceof Error ? error.message : '追踪频道失败');
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
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          频道分析
        </h1>
        <p className="text-gray-600">
          追踪竞品频道，对标内容策略，分析粉丝增长
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === 'tracking' ? 'default' : 'outline'}
          onClick={() => setTab('tracking')}
        >
          <Target className="w-4 h-4 mr-2" />
          竞品频道追踪
        </Button>
        <Button
          variant={tab === 'benchmark' ? 'default' : 'outline'}
          onClick={() => setTab('benchmark')}
        >
          <Video className="w-4 h-4 mr-2" />
          内容策略对标
        </Button>
        <Button
          variant={tab === 'growth' ? 'default' : 'outline'}
          onClick={() => setTab('growth')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          粉丝增长分析
        </Button>
      </div>

      {/* 竞品频道追踪 */}
      {tab === 'tracking' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">添加竞品频道</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="channelId">频道ID</Label>
                <Input
                  id="channelId"
                  placeholder="例如：UCxxxxxxxxxxxxxxxxxxxxxxx"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && trackChannel()}
                />
              </div>
              <Button onClick={trackChannel} disabled={isLoading}>
                {isLoading ? '添加中...' : '添加频道'}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">已追踪频道 ({trackedChannels.length})</h3>
            {trackedChannels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无追踪的频道</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trackedChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                        {channel.channelTitle.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{channel.channelTitle}</div>
                        <div className="text-sm text-gray-500">{channel.channelId}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Target className="w-3 h-3 mr-1" />
                      追踪中
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 频道统计 */}
          {channelStats && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-4">频道统计</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(channelStats.subscriberCount)}
                  </div>
                  <div className="text-sm text-gray-600">粉丝数</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <Video className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(channelStats.videoCount)}
                  </div>
                  <div className="text-sm text-gray-600">视频数</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(channelStats.viewCount)}
                  </div>
                  <div className="text-sm text-gray-600">总播放量</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 内容策略对标 */}
      {tab === 'benchmark' && (
        <div className="space-y-6">
          <Card className="p-12 text-center text-gray-500">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">内容策略对标</h3>
            <p>选择一个追踪的频道，对比其内容策略</p>
            <Button className="mt-4" onClick={() => setTab('tracking')}>
              先添加竞品频道
            </Button>
          </Card>
        </div>
      )}

      {/* 粉丝增长分析 */}
      {tab === 'growth' && (
        <div className="space-y-6">
          <Card className="p-12 text-center text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">粉丝增长分析</h3>
            <p>查看频道粉丝增长趋势和历史数据</p>
            <Button className="mt-4" onClick={() => setTab('tracking')}>
              先添加竞品频道
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
