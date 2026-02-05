'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Search, TrendingUp, TrendingDown, Minus, ExternalLink, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import type { KeywordData, KeywordCategory } from '@/lib/keyword-extractor/extractor';

interface KeywordResultsProps {
  keyword: string;
  languages: string[];
  keywords: KeywordData[];
  summary: any;
  onKeywordClick?: (keyword: string) => void;
}

export default function KeywordResults({
  keyword,
  languages,
  keywords,
  summary,
  onKeywordClick,
}: KeywordResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<KeywordCategory | 'all'>('all');
  const itemsPerPage = 50;

  // 类别标签映射
  const categoryLabels: Record<KeywordCategory | 'all', string> = {
    all: '全部',
    productivity: '💼 生产力',
    work: '👔 工作',
    salary: '💰 薪资',
    career: '📈 职业发展',
    tech: '💻 技术/工具',
    business: '🏢 商业',
    learning: '📚 学习',
    health: '🏃 健康',
    lifestyle: '🌟 生活方式',
    finance: '💵 财务',
    tutorial: '🎓 教程',
    other: '📌 其他',
  };

  // 按类别过滤
  const filteredKeywords = selectedCategory === 'all'
    ? keywords
    : keywords.filter(kw => kw.category === selectedCategory);

  const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentKeywords = filteredKeywords.slice(startIndex, endIndex);

  // 类别统计
  const categoryStats = keywords.reduce((acc, kw) => {
    if (!acc[kw.category]) {
      acc[kw.category] = 0;
    }
    acc[kw.category]++;
    return acc;
  }, {} as Record<KeywordCategory, number>);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'up':
        return '📈 上升';
      case 'down':
        return '⬇️ 下降';
      default:
        return '➡️ 稳定';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toFixed(0);
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
  };

  const searchOnYouTube = (kw: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`, '_blank');
  };

  // 重置页码
  const handleCategoryChange = (category: KeywordCategory | 'all') => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 概览面板 */}
      <Card>
        <CardHeader>
          <CardTitle>关键词拓展结果：{keyword}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {languages.map(lang => (
              <Badge key={lang} variant="secondary">
                {lang}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">发现关键词</p>
              <p className="text-2xl font-bold">{summary.totalKeywords}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">关联视频</p>
              <p className="text-2xl font-bold">{formatNumber(summary.totalVideos)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">平均热度</p>
              <p className="text-2xl font-bold">{formatNumber(summary.avgViews)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">覆盖语言</p>
              <p className="text-2xl font-bold">{summary.languages}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 类别过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            按类别筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => handleCategoryChange('all')}
            >
              全部 ({keywords.length})
            </Button>
            {(Object.keys(categoryLabels) as (KeywordCategory | 'all')[])
              .filter(cat => cat !== 'all')
              .map(category => {
                const count = categoryStats[category as KeywordCategory] || 0;
                return count > 0 ? (
                  <Button
                    key={category}
                    size="sm"
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    onClick={() => handleCategoryChange(category as KeywordCategory)}
                  >
                    {categoryLabels[category]} ({count})
                  </Button>
                ) : null;
              })}
          </div>
        </CardContent>
      </Card>

      {/* 关键词列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedCategory === 'all' ? '热门关键词' : categoryLabels[selectedCategory].split(' ')[1]}
            <span className="text-sm font-normal text-gray-500 ml-2">
              显示 {startIndex + 1}-{Math.min(endIndex, filteredKeywords.length)} / 共 {filteredKeywords.length} 个
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>关键词</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>相关性</TableHead>
                <TableHead>出现频率</TableHead>
                <TableHead>平均热度</TableHead>
                <TableHead>关联视频</TableHead>
                <TableHead>趋势</TableHead>
                <TableHead>语言</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentKeywords.length > 0 ? (
                currentKeywords.map((kw, index) => (
                  <TableRow key={kw.keyword}>
                    <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                    <TableCell className="font-semibold">{kw.keyword}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {categoryLabels[kw.category].split(' ')[1]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${kw.relevanceScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs">{(kw.relevanceScore * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{kw.frequency}</TableCell>
                    <TableCell>{formatNumber(kw.avgViews)}</TableCell>
                    <TableCell>{kw.videoCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(kw.trend)}
                        <span className="text-xs">{getTrendText(kw.trend)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{kw.language}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyKeyword(kw.keyword)}
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => searchOnYouTube(kw.keyword)}
                          title="在 YouTube 搜索"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    该类别暂无关键词
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">
                显示 {startIndex + 1}-{Math.min(endIndex, filteredKeywords.length)} / 共 {filteredKeywords.length} 个关键词
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一页
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
