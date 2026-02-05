'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Sparkles, Loader2, TrendingUp, BarChart3, Target, Wrench, Car, Home, Award, Zap } from 'lucide-react';
import type { ExpansionResponse, ExpansionResult } from '@/lib/services/keyword-expansion/types';

// 维度图标映射
const DIMENSION_ICONS: Record<string, any> = {
  scenario: Home,
  carrier: Car,
  state: Award,
  goal: Target,
  method: Wrench,
};

// 维度名称映射
const DIMENSION_NAMES: Record<string, string> = {
  scenario: '使用场景',
  carrier: '使用载体',
  state: '状态特征',
  goal: '使用目标',
  method: '方法步骤',
};

export default function KeywordExpansionPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('generic');
  const [useRuleEngine, setUseRuleEngine] = useState(true);
  const [useLLMEngine, setUseLLMEngine] = useState(true);
  const [useDataMining, setUseDataMining] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExpansionResponse | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string>('all');

  const handleExpand = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/keywords/smart-expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          category,
          useRuleEngine,
          useLLMEngine,
          useDataMining,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        console.error('拓展失败:', data.error);
      }
    } catch (error) {
      console.error('拓展失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredKeywords = (): ExpansionResult[] => {
    if (!result) return [];

    if (selectedDimension === 'all') {
      return result.topKeywords;
    }

    const dimensionKeywords = result.dimensions[selectedDimension as keyof typeof result.dimensions];
    return dimensionKeywords || [];
  };

  const getDimensionStats = () => {
    if (!result) return [];

    const dimensions = Object.entries(result.dimensions).map(([key, value]: [string, any]) => ({
      key,
      name: DIMENSION_NAMES[key],
      count: Array.isArray(value) ? value.length : 0,
      Icon: DIMENSION_ICONS[key] || Sparkles,
    }));

    return dimensions;
  };

  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0';
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            关键词智能拓展
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            基于多维度（场景、载体、状态、目标、方法）和AI的智能关键词拓展系统
          </p>
        </div>

        {/* 输入区域 */}
        <Card className="mb-6 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              输入关键词
            </CardTitle>
            <CardDescription>
              输入要拓展的关键词，系统将基于多维度规则、LLM和YouTube数据智能生成相关关键词
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 关键词输入 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="keyword-input">关键词</Label>
                  <Input
                    id="keyword-input"
                    placeholder="例如：剪映、Notion、ChatGPT"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleExpand()}
                    className="text-lg h-12"
                  />
                </div>
                <div className="w-40">
                  <Label htmlFor="category-select">关键词类型</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">通用词</SelectItem>
                      <SelectItem value="brand">品牌词</SelectItem>
                      <SelectItem value="longtail">长尾词</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    size="lg"
                    onClick={handleExpand}
                    disabled={loading || !keyword.trim()}
                    className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        拓展中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        开始拓展
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 配置选项 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="rule-engine" className="flex flex-col space-y-1">
                    <span>规则引擎</span>
                    <span className="font-normal text-xs text-slate-500">
                      基于预设模板生成
                    </span>
                  </Label>
                  <Switch
                    id="rule-engine"
                    checked={useRuleEngine}
                    onCheckedChange={setUseRuleEngine}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="llm-engine" className="flex flex-col space-y-1">
                    <span>LLM引擎</span>
                    <span className="font-normal text-xs text-slate-500">
                      AI智能场景联想
                    </span>
                  </Label>
                  <Switch
                    id="llm-engine"
                    checked={useLLMEngine}
                    onCheckedChange={setUseLLMEngine}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="data-mining" className="flex flex-col space-y-1">
                    <span>数据挖掘</span>
                    <span className="font-normal text-xs text-slate-500">
                      从YouTube提取
                    </span>
                  </Label>
                  <Switch
                    id="data-mining"
                    checked={useDataMining}
                    onCheckedChange={setUseDataMining}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 结果展示 */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 统计概览 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        总关键词数
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {result.totalKeywords}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        唯一关键词
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {result.uniqueKeywords}
                      </p>
                    </div>
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        维度覆盖
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {Object.keys(result.dimensions).length}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        拓展ID
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                        {result.expansionId.slice(0, 8)}...
                      </p>
                    </div>
                    <Zap className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 维度统计 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>维度分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {getDimensionStats().map(({ key, name, count, Icon }) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDimension === key || selectedDimension === 'all'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                      onClick={() => setSelectedDimension(key)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-medium">{name}</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                        {count}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 关键词列表 */}
            <Card>
              <CardHeader>
                <CardTitle>拓展结果</CardTitle>
                <CardDescription>
                  {selectedDimension === 'all' ? '推荐指数最高的20个关键词' : `${DIMENSION_NAMES[selectedDimension]}维度的所有关键词`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>关键词</TableHead>
                      <TableHead>维度</TableHead>
                      <TableHead>来源</TableHead>
                      <TableHead>搜索量</TableHead>
                      <TableHead>竞争度</TableHead>
                      <TableHead>推荐指数</TableHead>
                      <TableHead>类型</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredKeywords().map((kw, index) => (
                      <TableRow key={`${kw.keyword}-${index}`}>
                        <TableCell className="font-medium">{kw.keyword}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {DIMENSION_NAMES[kw.dimension]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              kw.source === 'llm'
                                ? 'default'
                                : kw.source === 'rule'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {kw.source === 'llm'
                              ? 'AI生成'
                              : kw.source === 'rule'
                              ? '规则'
                              : kw.source === 'dataMining'
                              ? '数据挖掘'
                              : kw.source === 'tagMining'
                              ? '标签提取'
                              : '评论提取'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatNumber(kw.estimatedSearchVolume)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{ width: `${(kw.estimatedCompetition || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs">{((kw.estimatedCompetition || 0) * 100).toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className={getScoreColor(kw.recommendationScore || 0)}>
                          {(kw.recommendationScore || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{kw.type}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
