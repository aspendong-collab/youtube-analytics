'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, ExternalLink, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Search, Lightbulb, CopyCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { EnhancedKeywordData } from '@/lib/keyword-extractor/types';

interface ComprehensiveKeywordResultsProps {
  data: {
    keywords: EnhancedKeywordData[];
    suggestions: string[];
    relatedSearches: string[];
    questions: string[];
    competitors: string[];
    statistics: {
      totalKeywords: number;
      totalSearchVolume: number;
      avgCompetition: number;
      highOpportunityCount: number;
      dataSourceStatus?: {
        suggestions: { enabled: boolean; success: boolean; count: number };
        relatedSearches: { enabled: boolean; success: boolean; count: number };
        competitorKeywords: { enabled: boolean; success: boolean; count: number };
        questions: { enabled: boolean; success: boolean; count: number };
        videos: { success: boolean; count: number };
      };
    };
  };
  originalKeyword: string;
  languages: string[];
  onKeywordClick?: (keyword: string) => void;
}

export default function ComprehensiveKeywordResults({
  data,
  originalKeyword,
  languages,
  onKeywordClick,
}: ComprehensiveKeywordResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'core' | 'long-tail' | 'question' | 'comparison' | 'list' | 'location'>('all');
  const [selectedIntent, setSelectedIntent] = useState<'all' | 'informational' | 'commercial' | 'navigational' | 'transactional'>('all');
  const [selectedSource, setSelectedSource] = useState<'all' | 'autocomplete' | 'related' | 'competitor' | 'extracted'>('all');
  const itemsPerPage = 30;

  // 分类标签映射
  const categoryLabels: Record<typeof selectedCategory, string> = {
    all: '全部',
    core: '🎯 核心关键词',
    'long-tail': '📏 长尾关键词',
    question: '❓ 问题型',
    comparison: '⚖️ 比较型',
    list: '📋 列表型',
    location: '📍 地理型',
  };

  // 搜索意图标签映射
  const intentLabels: Record<typeof selectedIntent, string> = {
    all: '全部意图',
    informational: '📖 信息类',
    commercial: '🛒 商业类',
    navigational: '🧭 品牌类',
    transactional: '💳 交易类',
  };

  // 数据源标签映射
  const sourceLabels: Record<string, string> = {
    autocomplete: '🔍 搜索建议',
    related: '🔗 相关搜索',
    competitor: '🏆 竞品',
    extracted: '📹 视频数据',
    video: '📹 视频数据',
    suggestion: '💡 搜索建议',
  };

  // 目标受众类型标签映射
  const audienceLabels: Record<string, string> = {
    beginner: '🌱 初学者',
    intermediate: '📚 中级',
    advanced: '🎓 高级',
    professional: '💼 专业人士',
    student: '👨‍🎓 学生',
    general: '👥 大众',
  };

  // 多重过滤
  const filteredKeywords = (data.keywords || []).filter(kw => {
    if (selectedCategory !== 'all' && kw.keywordType !== selectedCategory) return false;
    if (selectedIntent !== 'all' && kw.searchIntent !== selectedIntent) return false;
    if (selectedSource !== 'all' && (!kw.sources || !kw.sources.includes(selectedSource))) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredKeywords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentKeywords = filteredKeywords.slice(startIndex, endIndex);

  // 统计信息
  const categoryStats = (data.keywords || []).reduce((acc, kw) => {
    const type = kw.keywordType;
    if (!acc[type]) acc[type] = 0;
    acc[type]++;
    return acc;
  }, {} as Record<string, number>);

  const intentStats = (data.keywords || []).reduce((acc, kw) => {
    const intent = kw.searchIntent;
    if (!acc[intent]) acc[intent] = 0;
    acc[intent]++;
    return acc;
  }, {} as Record<string, number>);

  const sourceStats = (data.keywords || []).reduce((acc, kw) => {
    if (kw.sources && Array.isArray(kw.sources)) {
      kw.sources.forEach(src => {
        if (!acc[src]) acc[src] = 0;
        acc[src]++;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500 bg-green-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'high': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getCompetitionText = (level: string) => {
    switch (level) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      default: return '-';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'rising': return '📈 上升';
      case 'falling': return '⬇️ 下降';
      default: return '➡️ 稳定';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const copyTitleTemplate = (template: string, keyword: string) => {
    const title = template.replace('{keyword}', keyword);
    navigator.clipboard.writeText(title);
    toast.success('标题模板已复制');
  };

  const searchOnYouTube = (kw: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(kw)}`, '_blank');
  };

  // 重置页码
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // 检查是否有数据源失败
  const hasFailedDataSource = data.statistics?.dataSourceStatus ? Object.values(data.statistics.dataSourceStatus).some(
    ds => ds.enabled !== undefined && !ds.success && ds.enabled
  ) : false;

  const failedDataSources = data.statistics?.dataSourceStatus ? Object.entries(data.statistics.dataSourceStatus)
    .filter(([key, value]) => value.enabled !== undefined && !value.success && value.enabled)
    .map(([key]) => key) : [];

  // 获取高机会关键词（机会评分 > 70）
  const highOpportunityKeywords = filteredKeywords.filter(kw => kw.opportunityScore > 70);

  return (
    <div className="space-y-6">
      {/* 数据源状态警告 */}
      {hasFailedDataSource && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="text-yellow-600 mt-0.5">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">部分数据源未成功获取数据</h4>
                <p className="text-sm text-yellow-700">
                  以下数据源可能由于API限制或网络问题未成功获取数据：
                  <span className="font-medium">
                    {failedDataSources.join(', ')}
                  </span>
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  已成功的数据源（{data.statistics?.dataSourceStatus?.videos?.success || data.keywords.some(kw => kw.sources?.includes('video')) ? '视频数据' : ''}
                  {data.statistics?.dataSourceStatus?.suggestions?.success || data.suggestions.length > 0 ? '、搜索建议' : ''}
                  {data.statistics?.dataSourceStatus?.relatedSearches?.success || data.relatedSearches.length > 0 ? '、相关搜索' : ''}）
                  仍然可以提供有价值的分析结果。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计面板 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>发现关键词</CardDescription>
            <CardTitle className="text-2xl">{data.statistics?.totalKeywords || (data.keywords?.length || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>月搜索量</CardDescription>
            <CardTitle className="text-2xl">{formatNumber(data.statistics?.totalSearchVolume || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>高机会</CardDescription>
            <CardTitle className="text-2xl text-green-600">{data.statistics?.highOpportunityCount || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均竞争度</CardDescription>
            <CardTitle className="text-2xl">{(data.statistics?.avgCompetition || 0).toFixed(0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 搜索建议、相关问题、竞品关键词 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🔍 搜索建议 ({(data.suggestions || []).length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {data.suggestions.slice(0, 20).map((suggestion, idx) => (
              <div
                key={idx}
                className="text-sm p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between group"
                onClick={() => onKeywordClick?.(suggestion)}
              >
                <span className="truncate">{suggestion}</span>
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 p-1 h-auto">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">❓ 相关问题 ({(data.questions || []).length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {(data.questions || []).slice(0, 20).map((question, idx) => (
              <div
                key={idx}
                className="text-sm p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between group"
                onClick={() => onKeywordClick?.(question)}
              >
                <span className="truncate">{question}</span>
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 p-1 h-auto">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">🏆 竞品关键词 ({(data.competitors || []).length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-60 overflow-y-auto">
            {(data.competitors || []).slice(0, 20).map((competitor, idx) => (
              <div
                key={idx}
                className="text-sm p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer flex items-center justify-between group"
                onClick={() => onKeywordClick?.(competitor)}
              >
                <span className="truncate">{competitor}</span>
                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 p-1 h-auto">
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选关键词</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 关键词类型 */}
          <div>
            <label className="text-sm font-medium mb-2 block">关键词类型</label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => { setSelectedCategory('all'); handleFilterChange(); }}
              >
                全部 ({data.keywords.length})
              </Button>
              {(Object.keys(categoryLabels) as (typeof selectedCategory)[])
                .filter(cat => cat !== 'all')
                .map(category => {
                  const count = categoryStats[category] || 0;
                  return count > 0 ? (
                    <Button
                      key={category}
                      size="sm"
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      onClick={() => { setSelectedCategory(category); handleFilterChange(); }}
                    >
                      {categoryLabels[category]} ({count})
                    </Button>
                  ) : null;
                })}
            </div>
          </div>

          {/* 搜索意图 */}
          <div>
            <label className="text-sm font-medium mb-2 block">搜索意图</label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedIntent === 'all' ? 'default' : 'outline'}
                onClick={() => { setSelectedIntent('all'); handleFilterChange(); }}
              >
                全部
              </Button>
              {(Object.keys(intentLabels) as (typeof selectedIntent)[])
                .filter(intent => intent !== 'all')
                .map(intent => {
                  const count = intentStats[intent] || 0;
                  return count > 0 ? (
                    <Button
                      key={intent}
                      size="sm"
                      variant={selectedIntent === intent ? 'default' : 'outline'}
                      onClick={() => { setSelectedIntent(intent); handleFilterChange(); }}
                    >
                      {intentLabels[intent]} ({count})
                    </Button>
                  ) : null;
                })}
            </div>
          </div>

          {/* 数据源 */}
          <div>
            <label className="text-sm font-medium mb-2 block">数据源</label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedSource === 'all' ? 'default' : 'outline'}
                onClick={() => { setSelectedSource('all'); handleFilterChange(); }}
              >
                全部
              </Button>
              {(Object.keys(sourceLabels) as (typeof selectedSource)[])
                .filter(source => source !== 'all')
                .map(source => {
                  const count = sourceStats[source] || 0;
                  return count > 0 ? (
                    <Button
                      key={source}
                      size="sm"
                      variant={selectedSource === source ? 'default' : 'outline'}
                      onClick={() => { setSelectedSource(source); handleFilterChange(); }}
                    >
                      {sourceLabels[source]} ({count})
                    </Button>
                  ) : null;
                })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 高机会关键词 */}
      {highOpportunityKeywords.length > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              蓝海机会 ({highOpportunityKeywords.length})
            </CardTitle>
            <CardDescription>
              这些关键词搜索量大、竞争度低，是优质的内容创作机会
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {highOpportunityKeywords.slice(0, 6).map((kw, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{kw.keyword}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">{kw.keywordType}</Badge>
                        <Badge variant="secondary" className="text-xs">{kw.searchIntent}</Badge>
                        <Badge variant="outline" className="text-xs">{audienceLabels[kw.targetAudience as keyof typeof audienceLabels] || kw.targetAudience}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">机会评分</p>
                      <p className="text-lg font-bold text-green-600">{kw.opportunityScore}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>👁️ {formatNumber(kw.searchVolume)}/月</span>
                    <span>⚔️ {getCompetitionText(kw.competition)}</span>
                    <span>📊 难度 {kw.difficulty}</span>
                  </div>
                  {kw.recommendedContentTypes && kw.recommendedContentTypes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">推荐内容类型: {kw.recommendedContentTypes.join(', ')}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 关键词列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            关键词详情
            <span className="text-sm font-normal text-gray-500 ml-2">
              显示 {startIndex + 1}-{Math.min(endIndex, filteredKeywords.length)} / 共 {filteredKeywords.length} 个
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">排名</TableHead>
                <TableHead>关键词</TableHead>
                <TableHead className="w-[100px]">搜索量</TableHead>
                <TableHead className="w-[100px]">竞争度</TableHead>
                <TableHead className="w-[100px]">难度</TableHead>
                <TableHead className="w-[100px]">机会</TableHead>
                <TableHead className="w-[80px]">趋势</TableHead>
                <TableHead className="w-[120px]">类型</TableHead>
                <TableHead className="w-[120px]">意图</TableHead>
                <TableHead className="w-[120px]">受众</TableHead>
                <TableHead className="w-[100px]">来源</TableHead>
                <TableHead className="w-[120px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentKeywords.length > 0 ? (
                currentKeywords.map((kw, index) => (
                  <TableRow key={kw.keyword} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{kw.keyword}</p>
                        {kw.tags && kw.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {kw.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatNumber(kw.searchVolume)}</p>
                      <p className="text-xs text-gray-500">/月</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCompetitionColor(kw.competition)}>
                        {getCompetitionText(kw.competition)}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{kw.competitionScore.toFixed(0)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${kw.difficulty}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{kw.difficulty}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${kw.opportunityScore > 70 ? 'bg-green-500' : kw.opportunityScore > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${kw.opportunityScore}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${kw.opportunityScore > 70 ? 'text-green-600' : kw.opportunityScore > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {kw.opportunityScore}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(kw.trend)}
                        <span className="text-xs">{getTrendText(kw.trend)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{kw.keywordType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{kw.searchIntent}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{audienceLabels[kw.targetAudience as keyof typeof audienceLabels] || kw.targetAudience}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {kw.sources?.map((src, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{sourceLabels[src] || src}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyKeyword(kw.keyword)}
                          title="复制"
                        >
                          {copiedKeyword === kw.keyword ? <CopyCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
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
                  <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                    没有符合条件的关键词
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
