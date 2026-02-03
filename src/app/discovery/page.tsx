'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, TrendingUp, Play, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  viewCount?: number;
}

export default function DiscoveryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'search' | 'trending'>('search');
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videos, setVideos] = useState<SearchVideo[]>([]);
  const [regionCode, setRegionCode] = useState('US');
  const [categoryId, setCategoryId] = useState('');

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }

    setIsLoading(true);
    setVideos([]);

    try {
      const response = await fetch(
        `/api/search?mode=keyword&q=${encodeURIComponent(keyword)}&maxResults=50`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '搜索失败');
      }

      const data = await response.json();
      setVideos(data.videos || []);
      toast.success(`找到 ${data.total || 0} 个相关视频`);
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error(error instanceof Error ? error.message : '搜索失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrending = async () => {
    setIsLoading(true);
    setVideos([]);

    try {
      const params = new URLSearchParams({
        mode: 'trending',
        regionCode,
        maxResults: '50',
      });

      if (categoryId) {
        params.append('categoryId', categoryId);
      }

      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取热门视频失败');
      }

      const data = await response.json();
      setVideos(data.videos || []);
      toast.success(`获取 ${data.videos?.length || 0} 个热门视频`);
    } catch (error) {
      console.error('获取热门视频失败:', error);
      toast.error(error instanceof Error ? error.message : '获取热门视频失败');
    } finally {
      setIsLoading(false);
    }
  };

  const addVideoToLibrary = async (video: SearchVideo) => {
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
      }
    } catch (error) {
      console.error('添加视频失败:', error);
      toast.error(error instanceof Error ? error.message : '添加失败');
    }
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2">发现</h1>
        <p className="text-gray-600">搜索关键词、查看热门趋势、发现优质内容</p>
      </div>

      {/* Tab 切换 */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={activeTab === 'search' ? 'default' : 'outline'}
          onClick={() => setActiveTab('search')}
        >
          <Search className="w-4 h-4 mr-2" />
          关键词搜索
        </Button>
        <Button
          variant={activeTab === 'trending' ? 'default' : 'outline'}
          onClick={() => setActiveTab('trending')}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          热门趋势
        </Button>
      </div>

      {/* 搜索面板 */}
      {activeTab === 'search' && (
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="keyword">搜索关键词</Label>
              <Input
                id="keyword"
                placeholder="输入关键词，例如：AI教程、React开发..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="mt-6">
              {isLoading ? '搜索中...' : '搜索'}
            </Button>
          </div>
        </Card>
      )}

      {/* 热门趋势面板 */}
      {activeTab === 'trending' && (
        <Card className="p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div>
              <Label htmlFor="region">地区</Label>
              <select
                id="region"
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
                className="mt-1.5 px-3 py-2 border rounded-md"
              >
                <option value="US">美国 (US)</option>
                <option value="CN">中国 (CN)</option>
                <option value="JP">日本 (JP)</option>
                <option value="KR">韩国 (KR)</option>
                <option value="GB">英国 (GB)</option>
                <option value="DE">德国 (DE)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="category">分类</Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 px-3 py-2 border rounded-md"
              >
                <option value="">全部分类</option>
                <option value="1">电影与动画</option>
                <option value="2">汽车</option>
                <option value="10">音乐</option>
                <option value="15">宠物与动物</option>
                <option value="17">体育</option>
                <option value="20">游戏</option>
                <option value="22">人物与博客</option>
                <option value="23">喜剧</option>
                <option value="24">娱乐</option>
                <option value="25">新闻与政治</option>
                <option value="26">DIY与生活技巧</option>
                <option value="27">教育</option>
                <option value="28">科学与技术</option>
              </select>
            </div>
            <Button onClick={handleTrending} disabled={isLoading} className="mt-6">
              {isLoading ? '加载中...' : '获取热门视频'}
            </Button>
          </div>
        </Card>
      )}

      {/* 视频列表 */}
      {videos.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === 'search' ? '搜索结果' : '热门视频'} ({videos.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute bottom-2 right-2 bg-black/70">
                    {video.viewCount ? formatViewCount(video.viewCount) : '0 views'}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-medium line-clamp-2 mb-2">{video.title}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{video.channelTitle}</p>
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
                      onClick={() => addVideoToLibrary(video)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      添加到库
                    </Button>
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
          {activeTab === 'search' ? (
            <>
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>输入关键词开始搜索</p>
            </>
          ) : (
            <>
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>点击"获取热门视频"查看最新趋势</p>
            </>
          )}
        </div>
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
