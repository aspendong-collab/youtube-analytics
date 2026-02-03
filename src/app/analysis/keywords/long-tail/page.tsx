'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Lightbulb, Tag } from 'lucide-react';

interface LongTailKeyword {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  opportunityScore: number;
}

export default function LongTailKeywordsPage() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState<LongTailKeyword[]>([]);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('请输入核心关键词');
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

      // 基于视频标题提取长尾关键词
      const extractedKeywords: Set<string> = new Set();

      videos.forEach((video: any) => {
        const words = video.title.split(/\s+/);
        // 提取2-3个词的组合
        for (let i = 0; i < words.length - 1; i++) {
          extractedKeywords.add(words[i] + ' ' + words[i + 1]);
          if (i < words.length - 2) {
            extractedKeywords.add(words[i] + ' ' + words[i + 1] + ' ' + words[i + 2]);
          }
        }
      });

      // 转换为长尾关键词列表
      const longTailKeywords: LongTailKeyword[] = Array.from(extractedKeywords)
        .filter(kw => kw.length > 5 && kw !== keyword.toLowerCase())
        .slice(0, 20)
        .map(kw => ({
          keyword: kw,
          searchVolume: Math.floor(Math.random() * 5000) + 100, // 模拟搜索量
          competition: Math.random() > 0.6 ? 'low' : Math.random() > 0.3 ? 'medium' : 'high',
          opportunityScore: 0, // 稍后计算
        }))
        .map(kw => ({
          ...kw,
          competition: kw.competition as 'low' | 'medium' | 'high',
          opportunityScore: kw.searchVolume / (kw.competition === 'low' ? 1 : kw.competition === 'medium' ? 3 : 5),
        }))
        .sort((a, b) => b.opportunityScore - a.opportunityScore);

      setKeywords(longTailKeywords);
      toast.success(`找到 ${longTailKeywords.length} 个长尾关键词`);
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error(error instanceof Error ? error.message : '搜索失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getCompetitionBadge = (competition: string) => {
    switch (competition) {
      case 'low':
        return <Badge className="bg-green-100 text-green-700">低竞争</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">中等竞争</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-700">高竞争</Badge>;
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  const formatScore = (score: number) => {
    return score.toFixed(1);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Lightbulb className="w-8 h-8" />
          长尾关键词挖掘
        </h1>
        <p className="text-gray-600">
          发现低竞争、高机会的长尾关键词，提升SEO效果
        </p>
      </div>

      {/* 搜索面板 */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="keyword">核心关键词</Label>
            <Input
              id="keyword"
              placeholder="例如：React、Python、数据分析..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? '挖掘中...' : '挖掘关键词'}
          </Button>
        </div>
      </Card>

      {/* 结果列表 */}
      {keywords.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">
            长尾关键词 ({keywords.length})
          </h3>
          <div className="space-y-3">
            {keywords.map((kw, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge variant="outline" className="text-lg font-mono">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="font-medium">{kw.keyword}</div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <span>搜索量: {kw.searchVolume.toLocaleString()}</span>
                      {getCompetitionBadge(kw.competition)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatScore(kw.opportunityScore)}
                  </div>
                  <div className="text-xs text-gray-500">机会分数</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 空状态 */}
      {!isLoading && keywords.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>输入核心关键词开始挖掘</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">挖掘中...</p>
        </div>
      )}
    </div>
  );
}
