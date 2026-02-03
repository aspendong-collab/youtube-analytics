'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { TrendingUp, Search, Calendar, BarChart3 } from 'lucide-react';

interface KeywordTrend {
  keyword: string;
  searchVolume: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  relatedKeywords: string[];
}

export default function KeywordTrendsPage() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trends, setTrends] = useState<KeywordTrend[]>([]);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('请输入关键词');
      return;
    }

    setIsLoading(true);

    try {
      // 使用YouTube Search API获取相关视频，分析关键词热度
      const response = await fetch(
        `/api/search?mode=keyword&q=${encodeURIComponent(keyword)}&maxResults=50`
      );

      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const data = await response.json();
      const videos = data.videos || [];

      // 分析关键词趋势（基于视频数量和播放量）
      const totalViews = videos.reduce((sum: number, v: any) => sum + (v.viewCount || 0), 0);
      const avgViews = totalViews / videos.length;

      // 模拟趋势数据（实际应该从Google Trends API获取）
      const trendData: KeywordTrend = {
        keyword,
        searchVolume: videos.length * 1000, // 模拟搜索量
        trend: avgViews > 10000 ? 'up' : avgViews > 1000 ? 'stable' : 'down',
        changePercent: avgViews > 10000 ? 25 : avgViews > 1000 ? 5 : -10,
        relatedKeywords: videos.slice(0, 5).map((v: any) =>
          v.title.split(' ').slice(0, 2).join(' ')
        ),
      };

      setTrends([trendData]);

      toast.success(`分析完成，找到 ${videos.length} 个相关视频`);
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error(error instanceof Error ? error.message : '搜索失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-500 rotate-90" />;
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'up':
        return <Badge className="bg-green-100 text-green-700">上升</Badge>;
      case 'down':
        return <Badge className="bg-red-100 text-red-700">下降</Badge>;
      default:
        return <Badge variant="secondary">稳定</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          搜索趋势分析
        </h1>
        <p className="text-gray-600">
          分析关键词搜索趋势，发现热门话题和增长机会
        </p>
      </div>

      {/* 搜索面板 */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="keyword">关键词</Label>
            <Input
              id="keyword"
              placeholder="例如：AI教程、React开发、机器学习..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? '分析中...' : '分析趋势'}
          </Button>
        </div>
      </Card>

      {/* 趋势结果 */}
      {trends.length > 0 && (
        <div className="space-y-6">
          {trends.map((trend, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">{trend.keyword}</h3>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Search className="w-4 h-4" />
                      搜索量: {trend.searchVolume.toLocaleString()}
                    </Badge>
                    {getTrendBadge(trend.trend)}
                    <span className="text-sm text-gray-600">
                      {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                    </span>
                  </div>
                </div>
                {getTrendIcon(trend.trend)}
              </div>

              {/* 相关关键词 */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  相关关键词
                </h4>
                <div className="flex flex-wrap gap-2">
                  {trend.relatedKeywords.map((kw, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="cursor-pointer hover:bg-blue-100"
                      onClick={() => {
                        setKeyword(kw);
                        handleSearch();
                      }}
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && trends.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>输入关键词开始分析</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">分析中...</p>
        </div>
      )}
    </div>
  );
}
