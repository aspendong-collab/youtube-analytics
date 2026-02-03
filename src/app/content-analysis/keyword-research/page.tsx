'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoSelector } from '@/components/video-selector';
import { useAnalysis } from '@/contexts/analysis-context';
import { toast } from 'sonner';
import { Search, TrendingUp, ArrowUp, ArrowDown, Minus, Tag, Hash } from 'lucide-react';

interface TrendKeyword {
  keyword: string;
  count: number;
  growth: number;
  avgViews: number;
  category: string;
}

interface TrendResult {
  highGrowthKeywords: TrendKeyword[];
  trendingTags: string[];
  hotCategories: {
    category: string;
    count: number;
    avgViews: number;
  }[];
  recommendations: string[];
}

export default function KeywordResearchPage() {
  const { selectedVideo, setSelectedVideo } = useAnalysis();
  const [trendResult, setTrendResult] = useState<TrendResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResearch = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/suggestions/trends');

      if (!response.ok) {
        throw new Error('分析失败');
      }

      const data = await response.json();
      setTrendResult(data);

      toast.success('分析完成', {
        description: '发现多个热门趋势',
      });
    } catch (error) {
      console.error('分析失败:', error);
      toast.error('分析失败', {
        description: '无法完成关键词研究',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 10) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (growth < -10) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-yellow-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 10) return 'text-green-500';
    if (growth < -10) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">关键词研究</h1>
        <p className="text-sm text-[#86868B] mt-1">分析热门趋势，发现优化机会</p>
      </div>

      <VideoSelector
        selectedVideoId={selectedVideo?.id || null}
        onVideoSelect={setSelectedVideo}
      />

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button
          onClick={handleResearch}
          disabled={isLoading}
          className="bg-[#007AFF] hover:bg-[#0066CC]"
        >
          {isLoading ? (
            <>
              <Search className="w-4 h-4 mr-2 animate-pulse" />
              分析中...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              开始分析
            </>
          )}
        </Button>
      </div>

      {/* 分析结果 */}
      {!trendResult && !isLoading ? (
        <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
          <div className="text-center text-[#86868B]">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">准备好开始分析</p>
            <p className="text-sm">点击"开始分析"按钮发现热门趋势</p>
          </div>
        </Card>
      ) : trendResult ? (
        <div className="space-y-6">
          {/* 高增长关键词 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">高增长关键词</h3>
              <Badge variant="secondary">TOP 10</Badge>
            </div>

            <div className="space-y-3">
              {trendResult.highGrowthKeywords.map((keyword, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border border-[rgba(0,0,0,0.08)] rounded-lg hover:border-[#007AFF]/30 transition-all"
                >
                  <Badge
                    variant="outline"
                    className="w-8 h-8 flex items-center justify-center p-0"
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[#1D1D1F]">
                        {keyword.keyword}
                      </span>
                      {getGrowthIcon(keyword.growth)}
                      <span className={`text-sm ${getGrowthColor(keyword.growth)}`}>
                        {keyword.growth > 0 ? '+' : ''}
                        {keyword.growth.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#86868B]">
                      <span>使用次数: {keyword.count}</span>
                      <span>•</span>
                      <span>平均播放: {(keyword.avgViews / 1000).toFixed(1)}k</span>
                      <span>•</span>
                      <span>{keyword.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 热门标签 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-[#007AFF]" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">热门标签</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {trendResult.trendingTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-4 py-2 cursor-pointer hover:bg-[#007AFF] hover:text-white transition-colors"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </Card>

          {/* 热门分类 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <Hash className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">热门分类</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendResult.hotCategories.map((category, index) => (
                <div
                  key={index}
                  className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-[#1D1D1F]">
                      {category.category}
                    </span>
                    <Badge variant="secondary">{category.count} 个视频</Badge>
                  </div>
                  <p className="text-xs text-[#86868B]">
                    平均播放: {(category.avgViews / 1000).toFixed(1)}k
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* 优化建议 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">关键词优化建议</h3>
            </div>

            <div className="space-y-3">
              {trendResult.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="text-blue-600 mt-0.5">💡</div>
                  <p className="text-sm text-[#1D1D1F]">{recommendation}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
