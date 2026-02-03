'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Target, Shield, AlertTriangle } from 'lucide-react';

interface CompetitionResult {
  keyword: string;
  competitionScore: number; // 0-100
  competitionLevel: 'low' | 'medium' | 'high';
  totalResults: number;
  avgViews: number;
  topChannels: Array<{ channelTitle: string; viewCount: number }>;
  recommendations: string[];
}

export default function CompetitionAnalysisPage() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompetitionResult | null>(null);

  const handleAnalysis = async () => {
    if (!keyword.trim()) {
      toast.error('请输入关键词');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/search?mode=keyword&q=${encodeURIComponent(keyword)}&maxResults=50`
      );

      if (!response.ok) {
        throw new Error('搜索失败');
      }

      const data = await response.json();
      const videos = data.videos || [];

      const totalViews = videos.reduce((sum: number, v: any) => sum + (v.viewCount || 0), 0);
      const avgViews = videos.length > 0 ? totalViews / videos.length : 0;

      // 简单的竞争度评估算法
      let competitionScore = 0;

      // 基于结果数量
      if (videos.length > 40) competitionScore += 30;
      else if (videos.length > 20) competitionScore += 20;
      else if (videos.length > 10) competitionScore += 10;

      // 基于平均播放量
      if (avgViews > 100000) competitionScore += 40;
      else if (avgViews > 10000) competitionScore += 30;
      else if (avgViews > 1000) competitionScore += 20;

      // 基于头部内容集中度
      const topChannelViews = videos.slice(0, 5).reduce((sum: number, v: any) => sum + (v.viewCount || 0), 0);
      const concentration = topChannelViews / totalViews;
      if (concentration > 0.6) competitionScore += 30;
      else if (concentration > 0.4) competitionScore += 20;

      competitionScore = Math.min(competitionScore, 100);

      const competitionLevel: 'low' | 'medium' | 'high' =
        competitionScore >= 70 ? 'high' : competitionScore >= 40 ? 'medium' : 'low';

      // 生成建议
      const recommendations: string[] = [];
      if (competitionLevel === 'high') {
        recommendations.push('竞争激烈，建议使用长尾关键词');
        recommendations.push('考虑添加地区限定词');
        recommendations.push('关注细分领域');
      } else if (competitionLevel === 'medium') {
        recommendations.push('竞争适中，优化标题和标签可以提高排名');
        recommendations.push('关注热门视频的内容策略');
      } else {
        recommendations.push('竞争较低，是很好的切入点');
        recommendations.push('建议尽快发布相关内容抢占流量');
      }

      const competitionResult: CompetitionResult = {
        keyword,
        competitionScore,
        competitionLevel,
        totalResults: videos.length * 1000, // 模拟总结果数
        avgViews: Math.floor(avgViews),
        topChannels: videos.slice(0, 5).map((v: any) => ({
          channelTitle: v.channelTitle,
          viewCount: v.viewCount || 0,
        })),
        recommendations,
      };

      setResult(competitionResult);
      toast.success('分析完成');
    } catch (error) {
      console.error('分析失败:', error);
      toast.error(error instanceof Error ? error.message : '分析失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getCompetitionBadge = (level: string) => {
    switch (level) {
      case 'low':
        return (
          <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
            <Shield className="w-4 h-4" />
            低竞争
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 flex items-center gap-1">
            <Target className="w-4 h-4" />
            中等竞争
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            高竞争
          </Badge>
        );
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Target className="w-8 h-8" />
          竞争度评估
        </h1>
        <p className="text-gray-600">
          评估关键词竞争程度，制定合理的SEO策略
        </p>
      </div>

      {/* 搜索面板 */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="keyword">关键词</Label>
            <Input
              id="keyword"
              placeholder="输入要评估的关键词..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalysis()}
            />
          </div>
          <Button onClick={handleAnalysis} disabled={isLoading}>
            {isLoading ? '分析中...' : '评估竞争度'}
          </Button>
        </div>
      </Card>

      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          {/* 竞争度概览 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">竞争度概览</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {result.competitionScore}
                </div>
                <div className="text-sm text-gray-600">竞争度分数 (0-100)</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {getCompetitionBadge(result.competitionLevel)}
                </div>
                <div className="text-sm text-gray-600">竞争等级</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {result.totalResults.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">总搜索结果数</div>
              </div>
            </div>
          </Card>

          {/* 头部频道 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">
              头部频道表现 (Top 5)
            </h3>
            <div className="space-y-3">
              {result.topChannels.map((channel, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      #{index + 1}
                    </Badge>
                    <div className="font-medium">{channel.channelTitle}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    播放量: {channel.viewCount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 建议 */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              优化建议
            </h3>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && !result && (
        <Card className="p-12 text-center text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>输入关键词开始评估</p>
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
