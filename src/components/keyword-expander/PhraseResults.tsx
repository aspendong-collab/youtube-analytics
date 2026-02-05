'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, ExternalLink, ChevronLeft, ChevronRight, Filter, Lightbulb, Users, Search } from 'lucide-react';
import type { PhraseData, PhraseType } from '@/lib/keyword-extractor/phrase-extractor';

interface PhraseResultsProps {
  phrases: PhraseData[];
  originalKeyword: string;
  onPhraseClick?: (phrase: string) => void;
}

export default function PhraseResults({
  phrases,
  originalKeyword,
  onPhraseClick,
}: PhraseResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<PhraseType | 'all'>('all');
  const itemsPerPage = 20;

  // 词组类型标签映射
  const typeLabels: Record<PhraseType | 'all', string> = {
    all: '全部',
    vlog: '📹 vlog',
    tutorial: '📚 教程',
    tips: '💡 技巧',
    challenge: '🎯 挑战',
    review: '⭐ 评价',
    routine: '📅 日常',
    journey: '🚀 旅程',
    guide: '📖 指南',
    method: '🔧 方法',
    story: '📖 故事',
    beginner: '🌱 初学者',
    advanced: '🎓 进阶',
    free: '💰 免费',
    online: '🌐 在线',
    course: '📝 课程',
    class: '🎓 班级',
    lesson: '📋 单节',
    topic: '🎯 话题',
    other: '📌 其他',
  };

  // 词组类型图标映射
  const typeIcons: Record<PhraseType, string> = {
    vlog: '📹',
    tutorial: '📚',
    tips: '💡',
    challenge: '🎯',
    review: '⭐',
    routine: '📅',
    journey: '🚀',
    guide: '📖',
    method: '🔧',
    story: '📖',
    beginner: '🌱',
    advanced: '🎓',
    free: '💰',
    online: '🌐',
    course: '📝',
    class: '🎓',
    lesson: '📋',
    topic: '🎯',
    other: '📌',
  };

  // 按类型过滤
  const filteredPhrases = selectedType === 'all'
    ? phrases
    : phrases.filter(ph => ph.type === selectedType);

  const totalPages = Math.ceil(filteredPhrases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPhrases = filteredPhrases.slice(startIndex, endIndex);

  // 类型统计
  const typeStats = phrases.reduce((acc, ph) => {
    if (!acc[ph.type]) {
      acc[ph.type] = 0;
    }
    acc[ph.type]++;
    return acc;
  }, {} as Record<PhraseType, number>);

  const formatNumber = (num: number): string => {
    if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toFixed(0);
  };

  const copyPhrase = (phrase: string) => {
    navigator.clipboard.writeText(phrase);
  };

  const searchOnYouTube = (phrase: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(phrase)}`, '_blank');
  };

  // 重置页码
  const handleTypeChange = (type: PhraseType | 'all') => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  // 推荐的搜索词组（相关性高、热度高）
  const recommendedPhrases = phrases
    .filter(ph => ph.relevanceScore >= 0.7 && ph.videoCount >= 3)
    .slice(0, 6);

  if (phrases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>词组拓展结果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂未发现相关词组</p>
            <p className="text-sm mt-2">请尝试使用更具体的关键词或增加搜索范围</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 推荐词组 */}
      {recommendedPhrases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              推荐搜索词组
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendedPhrases.map(phrase => (
                <div
                  key={phrase.phrase}
                  className="p-4 border rounded-lg hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => searchOnYouTube(phrase.phrase)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-sm flex-1">{phrase.phrase}</span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {typeIcons[phrase.type]}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Search className="w-3 h-3" />
                      <span>{phrase.searchIntent}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{phrase.targetAudience}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <span>热度 {formatNumber(phrase.avgViews)}</span>
                      <span>视频 {phrase.videoCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 类型过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            按词组类型筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedType === 'all' ? 'default' : 'outline'}
              onClick={() => handleTypeChange('all')}
            >
              全部 ({phrases.length})
            </Button>
            {(Object.keys(typeLabels) as (PhraseType | 'all')[])
              .filter(type => type !== 'all')
              .map(type => {
                const count = typeStats[type as PhraseType] || 0;
                return count > 0 ? (
                  <Button
                    key={type}
                    size="sm"
                    variant={selectedType === type ? 'default' : 'outline'}
                    onClick={() => handleTypeChange(type as PhraseType)}
                  >
                    {typeLabels[type]} ({count})
                  </Button>
                ) : null;
              })}
          </div>
        </CardContent>
      </Card>

      {/* 词组列表 */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedType === 'all' ? '所有词组' : typeLabels[selectedType].split(' ')[1]}
            <span className="text-sm font-normal text-gray-500 ml-2">
              显示 {startIndex + 1}-{Math.min(endIndex, filteredPhrases.length)} / 共 {filteredPhrases.length} 个
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>排名</TableHead>
                <TableHead>词组</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>相关性</TableHead>
                <TableHead>搜索意图</TableHead>
                <TableHead>目标受众</TableHead>
                <TableHead>平均热度</TableHead>
                <TableHead>视频数</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPhrases.length > 0 ? (
                currentPhrases.map((phrase, index) => (
                  <TableRow key={phrase.phrase}>
                    <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                    <TableCell className="font-semibold">{phrase.phrase}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {typeIcons[phrase.type]} {typeLabels[phrase.type].split(' ')[1]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${phrase.relevanceScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs">{(phrase.relevanceScore * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate" title={phrase.searchIntent}>
                      {phrase.searchIntent}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs truncate" title={phrase.targetAudience}>
                      {phrase.targetAudience}
                    </TableCell>
                    <TableCell>{formatNumber(phrase.avgViews)}</TableCell>
                    <TableCell>{phrase.videoCount}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyPhrase(phrase.phrase)}
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => searchOnYouTube(phrase.phrase)}
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
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    该类型暂无词组
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">
                显示 {startIndex + 1}-{Math.min(endIndex, filteredPhrases.length)} / 共 {filteredPhrases.length} 个词组
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
