'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search,
  TrendingUp,
  BarChart3,
  Target,
  Flame,
  CheckCircle,
} from 'lucide-react';

interface KeywordData {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  trend: 'up' | 'down' | 'stable';
  difficulty: number;
  opportunityScore: number;
}

interface RelatedKeyword {
  keyword: string;
  searchVolume: number;
  difficulty: number;
}

export default function KeywordResearchPage() {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KeywordData[]>([]);
  const [trendingKeywords, setTrendingKeywords] = useState<KeywordData[]>([]);
  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeyword[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);

  useEffect(() => {
    loadTrendingKeywords();
  }, []);

  const loadTrendingKeywords = async () => {
    setLoading(true);
    try {
      // 模拟热门关键词数据
      const mockTrending: KeywordData[] = [
        {
          keyword: 'Python教程',
          searchVolume: 245000,
          competition: 'high',
          trend: 'up',
          difficulty: 85,
          opportunityScore: 78,
        },
        {
          keyword: 'React入门',
          searchVolume: 189000,
          competition: 'medium',
          trend: 'up',
          difficulty: 65,
          opportunityScore: 82,
        },
        {
          keyword: 'JavaScript技巧',
          searchVolume: 156000,
          competition: 'medium',
          trend: 'stable',
          difficulty: 58,
          opportunityScore: 75,
        },
        {
          keyword: '前端开发',
          searchVolume: 132000,
          competition: 'high',
          trend: 'down',
          difficulty: 72,
          opportunityScore: 65,
        },
        {
          keyword: 'TypeScript实战',
          searchVolume: 89000,
          competition: 'low',
          trend: 'up',
          difficulty: 42,
          opportunityScore: 88,
        },
      ];

      setTrendingKeywords(mockTrending);
    } catch (error) {
      console.error('加载失败:', error);
      toast.error('加载热门关键词失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }

    setSearching(true);
    try {
      // 模拟搜索结果
      const mockResults: KeywordData[] = [
        {
          keyword: searchQuery,
          searchVolume: Math.floor(Math.random() * 200000) + 50000,
          competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          difficulty: Math.floor(Math.random() * 100),
          opportunityScore: Math.floor(Math.random() * 100),
        },
        {
          keyword: `${searchQuery} 教程`,
          searchVolume: Math.floor(Math.random() * 150000) + 30000,
          competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          difficulty: Math.floor(Math.random() * 100),
          opportunityScore: Math.floor(Math.random() * 100),
        },
      ];

      // 模拟相关关键词
      const mockRelated: RelatedKeyword[] = [
        {
          keyword: `${searchQuery} 入门`,
          searchVolume: Math.floor(Math.random() * 100000) + 20000,
          difficulty: Math.floor(Math.random() * 100),
        },
        {
          keyword: `${searchQuery} 实战`,
          searchVolume: Math.floor(Math.random() * 80000) + 15000,
          difficulty: Math.floor(Math.random() * 100),
        },
        {
          keyword: `${searchQuery} 高级`,
          searchVolume: Math.floor(Math.random() * 60000) + 10000,
          difficulty: Math.floor(Math.random() * 100),
        },
      ];

      setSearchResults(mockResults);
      setRelatedKeywords(mockRelated);
      setSelectedKeyword(mockResults[0]);
      toast.success('搜索完成');
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error('搜索失败');
    } finally {
      setSearching(false);
    }
  };

  const getCompetitionBadge = (competition: string) => {
    switch (competition) {
      case 'low':
        return <Badge className="bg-green-100 text-green-700">低竞争</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">中竞争</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-700">高竞争</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      case 'stable':
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 40) return 'text-green-600';
    if (difficulty < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOpportunityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Search className="w-8 h-8" />
          关键词研究
        </h1>
        <p className="text-gray-600">
          发现高价值关键词，优化视频搜索流量
        </p>
      </div>

      {/* 搜索框 */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="keywordSearch">搜索关键词</Label>
            <Input
              id="keywordSearch"
              placeholder="输入关键词，例如：Python教程"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="category">分类</Label>
            <select
              id="category"
              className="w-full px-3 py-2 border rounded-md"
              defaultValue="all"
            >
              <option value="all">全部分类</option>
              <option value="tech">技术教程</option>
              <option value="entertainment">娱乐</option>
              <option value="education">教育</option>
              <option value="lifestyle">生活方式</option>
            </select>
          </div>
          <Button onClick={handleSearch} disabled={searching} className="mt-6">
            {searching ? '搜索中...' : '搜索'}
          </Button>
        </div>
      </Card>

      {/* 热门关键词 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          热门关键词
        </h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4">
            {trendingKeywords.map((keyword, index) => (
              <Card
                key={keyword.keyword}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSearchQuery(keyword.keyword);
                  setSelectedKeyword(keyword);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-orange-100 text-orange-700">
                    #{index + 1}
                  </Badge>
                  {getTrendIcon(keyword.trend)}
                </div>
                <div className="font-medium mb-2 line-clamp-2">{keyword.keyword}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">搜索量</span>
                    <span className="font-medium">{keyword.searchVolume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">难度</span>
                    <span className={`font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                      {keyword.difficulty}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">机会</span>
                    <span className={`font-medium ${getOpportunityColor(keyword.opportunityScore)}`}>
                      {keyword.opportunityScore}/100
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {/* 关键词列表 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              搜索结果
            </h3>
            <div className="space-y-3">
              {searchResults.map((keyword) => (
                <div
                  key={keyword.keyword}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedKeyword?.keyword === keyword.keyword
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border'
                  }`}
                  onClick={() => setSelectedKeyword(keyword)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium mb-1">{keyword.keyword}</div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(keyword.trend)}
                        <span className="text-sm text-gray-600">
                          {keyword.trend === 'up' ? '上升' : keyword.trend === 'down' ? '下降' : '稳定'}
                        </span>
                      </div>
                    </div>
                    {getCompetitionBadge(keyword.competition)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                    <div>
                      <div className="text-gray-600">搜索量</div>
                      <div className="font-medium">{keyword.searchVolume.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">难度</div>
                      <div className={`font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                        {keyword.difficulty}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">机会</div>
                      <div className={`font-medium ${getOpportunityColor(keyword.opportunityScore)}`}>
                        {keyword.opportunityScore}/100
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 详细分析 */}
          {selectedKeyword && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                关键词分析
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">关键词</div>
                  <div className="text-2xl font-bold">{selectedKeyword.keyword}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">搜索量</div>
                    <div className="text-2xl font-bold">{selectedKeyword.searchVolume.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 mt-1">月均搜索次数</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">竞争度</div>
                    <div className="text-2xl font-bold">{selectedKeyword.competition}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedKeyword.competition === 'low'
                        ? '竞争较小，容易排名'
                        : selectedKeyword.competition === 'medium'
                        ? '竞争适中'
                        : '竞争激烈'}
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">机会评分</div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div className={`text-3xl font-bold ${getOpportunityColor(selectedKeyword.opportunityScore)}`}>
                    {selectedKeyword.opportunityScore}/100
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {selectedKeyword.opportunityScore >= 80
                      ? '高价值关键词，强烈推荐'
                      : selectedKeyword.opportunityScore >= 60
                      ? '中等价值，可以考虑'
                      : '价值较低，建议谨慎'}
                  </div>
                </div>

                {/* 相关关键词 */}
                {relatedKeywords.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">相关关键词</h4>
                    <div className="space-y-2">
                      {relatedKeywords.map((related, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="font-medium">{related.keyword}</div>
                          <div className="text-sm">
                            <span className="text-gray-600 mr-2">
                              {related.searchVolume.toLocaleString()}
                            </span>
                            <span className={getDifficultyColor(related.difficulty)}>
                              {related.difficulty}/100
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
