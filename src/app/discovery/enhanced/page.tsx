'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, TrendingUp, Play, Eye, Heart, MessageCircle, Flame, Clock, User } from 'lucide-react';
import DiscoveryFilters, { FilterValues } from '@/components/discovery/DiscoveryFilters';
import type { YouTubeSearchVideo } from '@/types/discovery';

export default function EnhancedDiscoveryPage() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allVideos, setAllVideos] = useState<YouTubeSearchVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<YouTubeSearchVideo[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'trending'>('search');
  const [regionCode, setRegionCode] = useState('US');

  const [filters, setFilters] = useState<FilterValues>({
    viewCount: [0, 100000000],
    engagementRate: [0, 20],
    likeCount: [0, 1000000],
    commentCount: [0, 100000],
    popularityScore: [0, 100],
    daysSincePublished: [0, 365],
    duration: [0, 7200],
    subscriberCount: [0, 10000000],
    sortBy: 'popularityScore',
    sortOrder: 'desc',
  });

  // 应用筛选和排序
  const applyFilters = (newFilters: FilterValues) => {
    const filtered = allVideos.filter((video) => {
      return (
        video.viewCount >= newFilters.viewCount[0] &&
        video.viewCount <= newFilters.viewCount[1] &&
        video.engagementRate >= newFilters.engagementRate[0] &&
        video.engagementRate <= newFilters.engagementRate[1] &&
        video.likeCount >= newFilters.likeCount[0] &&
        video.likeCount <= newFilters.likeCount[1] &&
        video.commentCount >= newFilters.commentCount[0] &&
        video.commentCount <= newFilters.commentCount[1] &&
        video.popularityScore >= newFilters.popularityScore[0] &&
        video.popularityScore <= newFilters.popularityScore[1] &&
        video.daysSincePublished >= newFilters.daysSincePublished[0] &&
        video.daysSincePublished <= newFilters.daysSincePublished[1] &&
        video.durationSeconds >= newFilters.duration[0] &&
        video.durationSeconds <= newFilters.duration[1] &&
        video.subscriberCount >= newFilters.subscriberCount[0] &&
        video.subscriberCount <= newFilters.subscriberCount[1]
      );
    });

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[newFilters.sortBy];
      const bVal = b[newFilters.sortBy];
      return newFilters.sortOrder === 'desc'
        ? (bVal as number) - (aVal as number)
        : (aVal as number) - (bVal as number);
    });

    setFilteredVideos(sorted);
    setFilters(newFilters);
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }

    setIsLoading(true);
    setAllVideos([]);
    setFilteredVideos([]);

    try {
      const params = new URLSearchParams({
        mode: 'keyword',
        q: keyword,
        maxResults: '50',
      });

      const response = await fetch(`/api/discovery/search?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '搜索失败');
      }

      const data = await response.json();
      setAllVideos(data.videos || []);
      setFilteredVideos(data.videos || []);
      toast.success(`找到 ${data.videos?.length || 0} 个相关视频`);
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error(error instanceof Error ? error.message : '搜索失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrending = async () => {
    setIsLoading(true);
    setAllVideos([]);
    setFilteredVideos([]);

    try {
      const params = new URLSearchParams({
        mode: 'trending',
        regionCode,
        maxResults: '50',
      });

      const response = await fetch(`/api/discovery/search?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取热门视频失败');
      }

      const data = await response.json();
      setAllVideos(data.videos || []);
      setFilteredVideos(data.videos || []);
      toast.success(`获取 ${data.videos?.length || 0} 个热门视频`);
    } catch (error) {
      console.error('获取热门视频失败:', error);
      toast.error(error instanceof Error ? error.message : '获取热门视频失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFilteredVideos(allVideos);
    setFilters({
      viewCount: [0, 100000000],
      engagementRate: [0, 20],
      likeCount: [0, 1000000],
      commentCount: [0, 100000],
      popularityScore: [0, 100],
      daysSincePublished: [0, 365],
      duration: [0, 7200],
      subscriberCount: [0, 10000000],
      sortBy: 'popularityScore',
      sortOrder: 'desc',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
    if (num >= 10000000) return `${(num / 10000).toFixed(0)}万`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDaysText = (days: number) => {
    if (days === 0) return '今天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}月前`;
    return `${Math.floor(days / 365)}年前`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2">达人发现</h1>
        <p className="text-gray-600">
          基于 YouTube 全平台搜索，发现优质达人
        </p>
      </div>

      {/* 搜索区域 */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="输入关键词，例如：科技评测、产品开箱..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            <Search className="w-4 h-4 mr-2" />
            搜索
          </Button>
          <Button
            variant="outline"
            onClick={handleTrending}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            热门
          </Button>
        </div>
      </Card>

      {/* 筛选器 */}
      {allVideos.length > 0 && (
        <DiscoveryFilters
          onFiltersChange={applyFilters}
          onReset={handleReset}
          videoCount={filteredVideos.length}
        />
      )}

      {/* 搜索结果 */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">搜索中...</p>
        </Card>
      ) : allVideos.length === 0 && !isLoading ? (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">开始搜索达人</h3>
          <p className="text-gray-600">
            输入关键词或查看热门视频，发现优质的 YouTube 达人
          </p>
        </Card>
      ) : filteredVideos.length === 0 && allVideos.length > 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600">
            没有符合条件的视频，请调整筛选条件
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* 缩略图 */}
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
                <Badge
                  className="absolute top-2 right-2 bg-red-500"
                >
                  {video.popularityScore}° 热度
                </Badge>
              </div>

              {/* 视频信息 */}
              <div className="p-4">
                <h3 className="font-medium line-clamp-2 mb-2">
                  {video.title}
                </h3>

                {/* 频道信息 */}
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{video.channelTitle}</span>
                  <Badge variant="outline" className="text-xs">
                    {formatNumber(video.subscriberCount)} 订阅
                  </Badge>
                </div>

                {/* 数据指标 */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">{formatNumber(video.viewCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-gray-600">{formatNumber(video.likeCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">{formatNumber(video.commentCount)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">{video.engagementRate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* 发布时间 */}
                <div className="flex items-center gap-1 mt-3 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{getDaysText(video.daysSincePublished)}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    观看
                  </Button>
                  <Button size="sm" className="flex-1">
                    收藏达人
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
