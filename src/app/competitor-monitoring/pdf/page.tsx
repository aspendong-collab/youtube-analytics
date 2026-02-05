'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Target, Play, Eye, Heart, MessageCircle, TrendingUp, Clock, User, RefreshCw, Video } from 'lucide-react';

interface CompetitorVideo {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  competitorName: string;
  competitorId: string;
  mentionType: string;
  relevanceScore: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  viewsAtDetection: number;
  viewsGrowth: number;
  growthRate: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  engagementRate: number;
  daysSincePublished: number;
}

interface CompetitorInfo {
  id: string;
  name: string;
  slug: string;
  videoCount: number;
}

interface MonitoringData {
  competitors: CompetitorInfo[];
  videos: CompetitorVideo[];
  total: number;
  timestamp: string;
}

export default function CompetitorMonitoringPDFPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d'>('7d');
  const [sortBy, setSortBy] = useState<'views' | 'growth' | 'engagement' | 'relevance'>('views');

  // 获取监控数据
  const fetchMonitoringData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompetitor) params.append('competitorSlug', selectedCompetitor);
      params.append('timeRange', timeRange);
      params.append('sortBy', sortBy);
      params.append('limit', '50');

      const response = await fetch(`/api/competitor-monitoring/pdf?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`获取监控数据失败: ${response.status}`);
      }

      const result: MonitoringData = await response.json();
      setData(result);
      toast.success(`获取到 ${result.total} 个相关视频`);
    } catch (error) {
      console.error('[竞品监控] 获取数据失败:', error);
      toast.error(error instanceof Error ? error.message : '获取监控数据失败');
    } finally {
      setIsLoading(false);
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

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取提及类型标签样式
  const getMentionTypeBadge = (mentionType: string) => {
    switch (mentionType) {
      case 'title':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">标题</Badge>;
      case 'description':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">描述</Badge>;
      case 'tag':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">标签</Badge>;
      case 'all':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">全部</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  // 获取竞品颜色
  const getCompetitorColor = (competitorName: string) => {
    switch (competitorName) {
      case 'PDFelement':
        return 'bg-blue-500';
      case 'Foxit PDF':
        return 'bg-red-500';
      case 'PDFgear':
        return 'bg-green-500';
      case 'UPDF':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2 flex items-center gap-2">
          <Target className="w-8 h-8" />
          PDF软件竞品监控
        </h1>
        <p className="text-sm text-[#86868B]">
          监控主要PDF软件（PDFelement、Foxit PDF、PDFgear、UPDF）在YouTube上的热门内容和表现
        </p>
      </div>

      {/* 控制面板 */}
      <Card className="p-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* 竞品选择 */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
              竞品筛选
            </label>
            <div className="flex gap-2">
              <Button
                variant={selectedCompetitor === '' ? 'default' : 'outline'}
                onClick={() => setSelectedCompetitor('')}
                className="flex-1"
              >
                全部
              </Button>
              <Button
                variant={selectedCompetitor === 'pdfelement' ? 'default' : 'outline'}
                onClick={() => setSelectedCompetitor('pdfelement')}
                className="flex-1"
              >
                PDFelement
              </Button>
              <Button
                variant={selectedCompetitor === 'foxit-pdf' ? 'default' : 'outline'}
                onClick={() => setSelectedCompetitor('foxit-pdf')}
                className="flex-1"
              >
                Foxit
              </Button>
              <Button
                variant={selectedCompetitor === 'pdfgear' ? 'default' : 'outline'}
                onClick={() => setSelectedCompetitor('pdfgear')}
                className="flex-1"
              >
                PDFgear
              </Button>
              <Button
                variant={selectedCompetitor === 'updf' ? 'default' : 'outline'}
                onClick={() => setSelectedCompetitor('updf')}
                className="flex-1"
              >
                UPDF
              </Button>
            </div>
          </div>

          {/* 时间范围选择 */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
              时间范围
            </label>
            <div className="flex gap-2">
              {(['1d', '7d', '30d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  onClick={() => setTimeRange(range)}
                  className="flex-1"
                >
                  {range === '1d' && '24小时'}
                  {range === '7d' && '7天'}
                  {range === '30d' && '30天'}
                </Button>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
              排序方式
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="views">按播放量</option>
              <option value="growth">按增长量</option>
              <option value="engagement">按互动率</option>
              <option value="relevance">按相关性</option>
            </select>
          </div>

          {/* 获取按钮 */}
          <div>
            <Button
              onClick={fetchMonitoringData}
              disabled={isLoading}
              size="lg"
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  加载中
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  开始监控
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* 竞品统计概览 */}
      {data && data.competitors.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-4">竞品视频数量统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {data.competitors.map((competitor) => (
              <div
                key={competitor.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getCompetitorColor(competitor.name)}`} />
                  <span className="font-medium text-[#1D1D1F]">{competitor.name}</span>
                </div>
                <div className="text-2xl font-bold text-[#007AFF]">
                  {competitor.videoCount}
                </div>
                <div className="text-xs text-[#86868B]">个视频</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 视频列表 */}
      {data && data.videos.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-[#1D1D1F]">
              相关视频列表 ({data.total} 个)
            </h3>
            <div className="text-sm text-[#86868B]">
              最后更新: {new Date(data.timestamp).toLocaleString('zh-CN')}
            </div>
          </div>

          <div className="space-y-4">
            {data.videos.map((video, index) => (
              <div
                key={video.id}
                className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                {/* 缩略图 */}
                <div className="relative flex-shrink-0">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-48 h-28 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30 rounded-lg">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </a>
                  <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold shadow">
                    {index + 1}
                  </div>
                </div>

                {/* 视频信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getCompetitorColor(video.competitorName)}`} />
                      <span className="text-sm font-medium text-[#1D1D1F]">
                        {video.competitorName}
                      </span>
                      {getMentionTypeBadge(video.mentionType)}
                    </div>
                  </div>

                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-medium text-[#1D1D1F] hover:text-[#007AFF] transition-colors mb-1 line-clamp-2"
                  >
                    {video.title}
                  </a>

                  <div className="flex items-center gap-3 text-xs text-[#86868B] mb-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {video.channelTitle}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(video.publishedAt)}
                    </span>
                  </div>

                  {/* 统计数据 */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-[#1D1D1F]">
                      <Eye className="w-3 h-3" />
                      {formatNumber(video.viewCount)}
                    </span>
                    <span className="flex items-center gap-1 text-[#1D1D1F]">
                      <Heart className="w-3 h-3" />
                      {formatNumber(video.likeCount)}
                    </span>
                    <span className="flex items-center gap-1 text-[#1D1D1F]">
                      <MessageCircle className="w-3 h-3" />
                      {formatNumber(video.commentCount)}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      {video.engagementRate.toFixed(2)}% 互动率
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 空状态 */}
      {!data && !isLoading && (
        <Card className="p-8 text-center bg-gradient-to-r from-blue-50 to-purple-50">
          <Target className="w-16 h-16 mx-auto mb-4 text-[#007AFF]" />
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">
            开始竞品监控
          </h3>
          <p className="text-sm text-[#86868B] mb-4">
            选择竞品、时间范围和排序方式，点击"开始监控"查看相关视频
          </p>
          <Button onClick={fetchMonitoringData} size="lg">
            <Target className="w-4 h-4 mr-2" />
            开始监控
          </Button>
        </Card>
      )}
    </div>
  );
}
