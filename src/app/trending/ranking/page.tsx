'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TrendingUp, Play, Eye, Heart, MessageCircle, Flame, Clock, User, Award, RefreshCw, Database } from 'lucide-react';
import type { TrendingVideo } from '@/types/trending';
import { useTrendingRanking } from '@/hooks/use-trending-ranking';

export default function TrendingRankingPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [keywords, setKeywords] = useState('');
  const [autoFetch, setAutoFetch] = useState(false);

  // 使用自定义 hook 获取热门排行榜数据
  const { data, isLoading, refetch, error, dataUpdatedAt, isFetching } = useTrendingRanking({
    period,
    keywords,
    maxResults: 50,
    enabled: autoFetch,
  });

  const videos = data?.videos || [];

  // 手动获取排行榜
  const fetchTrending = async () => {
    setAutoFetch(true);
    await refetch();
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取时间段名称
  const getPeriodName = (p: string) => {
    switch (p) {
      case 'today': return '今日热门';
      case 'week': return '本周热门';
      case 'month': return '本月热门';
      default: return '热门排行榜';
    }
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // 获取排名样式
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
    return 'bg-gray-100 text-gray-600';
  };

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank.toString();
  };

  // 监听参数变化，自动刷新
  const handlePeriodChange = (newPeriod: 'today' | 'week' | 'month') => {
    setPeriod(newPeriod);
    setAutoFetch(false); // 切换时间段时不自动获取，需要手动点击
  };

  const handleFetch = async () => {
    try {
      await fetchTrending();
      toast.success(`获取到 ${videos.length} 个热门视频`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '获取热门排行榜失败');
    }
  };

  // 初始加载提示
  const showInitialHint = !autoFetch && videos.length === 0;

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          📊 热门内容排行榜
        </h1>
        <p className="text-sm text-[#86868B]">
          查看 YouTube 平台上的热门视频和内容趋势
        </p>
      </div>

      {/* 控制面板 */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* 时间范围选择 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
              时间范围
            </label>
            <div className="flex gap-2">
              {(['today', 'week', 'month'] as const).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'outline'}
                  onClick={() => handlePeriodChange(p)}
                  className="flex-1"
                >
                  {p === 'today' && '今日'}
                  {p === 'week' && '本周'}
                  {p === 'month' && '本月'}
                </Button>
              ))}
            </div>
          </div>

          {/* 关键词输入 */}
          <div className="flex-[2] min-w-[300px]">
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
              关键词（可选，多个关键词用逗号分隔）
            </label>
            <Input
              type="text"
              placeholder="例如：科技,评测,产品"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 获取按钮 */}
          <div>
            <Button
              onClick={handleFetch}
              disabled={isFetching}
              size="lg"
              className="min-w-[120px]"
            >
              {isFetching ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  加载中
                </>
              ) : (
                '获取排行榜'
              )}
            </Button>
          </div>
        </div>

        {/* 缓存状态提示 */}
        {autoFetch && !isLoading && dataUpdatedAt && (
          <div className="mt-4 flex items-center gap-2 text-sm text-[#86868B]">
            <Database className="w-4 h-4" />
            <span>数据已缓存 • 最后更新: {formatTime(dataUpdatedAt)}</span>
            {!isFetching && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFetch}
                className="h-auto px-2 py-0 text-[#007AFF] hover:text-[#0056CC]"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                刷新
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* 初始提示 */}
      {showInitialHint && (
        <Card className="p-8 text-center bg-gradient-to-r from-blue-50 to-purple-50">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-[#007AFF]" />
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">
            获取热门内容排行榜
          </h3>
          <p className="text-sm text-[#86868B] mb-4">
            选择时间范围和关键词，点击"获取排行榜"查看热门内容
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-[#86868B] mb-4">
            <Database className="w-4 h-4" />
            <span>数据将缓存 1 小时，避免重复调用 API</span>
          </div>
          <Button onClick={handleFetch} variant="default">
            获取排行榜
          </Button>
        </Card>
      )}

      {/* 排行榜结果 */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1D1D1F]">
              {getPeriodName(period)} - 排行榜
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                共 {videos.length} 个视频
              </Badge>
              {dataUpdatedAt && (
                <Badge variant="outline" className="text-xs">
                  更新于 {formatTime(dataUpdatedAt)}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {videos.map((video, index) => (
              <Card key={video.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-4">
                  {/* 排名 */}
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold ${getRankStyle(video.trendRank)}`}>
                      {getRankIcon(video.trendRank)}
                    </div>
                  </div>

                  {/* 视频缩略图 */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-48 h-28 object-cover rounded-lg"
                    />
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {Math.floor(video.durationSeconds / 60)}:{(video.durationSeconds % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  {/* 视频信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#1D1D1F] mb-1 line-clamp-2">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-[#86868B] mb-2">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {video.channelTitle}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {video.daysSincePublished} 天前
                          </span>
                        </div>
                      </div>

                      <Badge variant="secondary" className="flex-shrink-0">
                        <Flame className="w-3 h-3 mr-1" />
                        {video.trendScore} 分
                      </Badge>
                    </div>

                    {/* 数据指标 */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1 text-[#86868B]">
                        <Eye className="w-4 h-4" />
                        <span className="font-medium text-[#1D1D1F]">{formatNumber(video.viewCount)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#86868B]">
                        <Heart className="w-4 h-4" />
                        <span>{formatNumber(video.likeCount)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#86868B]">
                        <MessageCircle className="w-4 h-4" />
                        <span>{formatNumber(video.commentCount)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#86868B]">
                        <Award className="w-4 h-4" />
                        <span>互动率: {video.engagementRate.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#86868B]">
              正在获取热门排行榜...
            </p>
          </div>
        </Card>
      )}

      {/* 错误状态 */}
      {error && !isLoading && (
        <Card className="p-12 text-center border-red-200">
          <div className="flex flex-col items-center gap-4">
            <div className="text-4xl">❌</div>
            <p className="text-sm text-[#86868B]">
              获取热门排行榜失败
            </p>
            <p className="text-sm text-red-500">
              {error.message}
            </p>
            <Button onClick={handleFetch} variant="outline">
              重试
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
