'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Search, Sparkles, Loader2, TrendingUp, BarChart3, Target, Wrench, Car, Home, Award, Zap, Languages, ChevronDown, X, Flame, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { ExpansionResponse, ExpansionResult, SupportedLanguage } from '@/lib/services/keyword-expansion/types';
import { LANGUAGE_NAMES, detectKeywordType } from '@/lib/services/keyword-expansion/types';

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

// 关键词类型名称映射
const KEYWORD_TYPE_NAMES: Record<string, string> = {
  brand: '品牌词',
  generic: '通用词',
  longtail: '长尾词',
};

// 关键词类型图标映射
const KEYWORD_TYPE_ICONS: Record<string, any> = {
  brand: Zap,
  generic: Sparkles,
  longtail: Flame,
};

// 关键词类型颜色映射
const KEYWORD_TYPE_COLORS: Record<string, string> = {
  brand: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  generic: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  longtail: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export default function KeywordExpansionPage() {
  const [keyword, setKeyword] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>('zh-CN');
  const [useRuleEngine, setUseRuleEngine] = useState(true); // 规则引擎默认启用
  const [useLLMEngine, setUseLLMEngine] = useState(false); // LLM引擎默认关闭（需要配置API）
  const [useDataMining, setUseDataMining] = useState(false); // 数据挖掘默认关闭（需要配置YouTube API）
  const [useSemanticExpansion, setUseSemanticExpansion] = useState(false); // 语义相似度拓展默认关闭（需要配置API）
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExpansionResponse | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all'); // 新增：关键词类型选择
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [llmTestResult, setLlmTestResult] = useState<string | null>(null);
  const [llmTestLoading, setLlmTestLoading] = useState(false);

  // 测试 LLM 功能
  const testLLM = async () => {
    if (!keyword.trim()) {
      alert('请先输入关键词');
      return;
    }

    setLlmTestLoading(true);
    setLlmTestResult(null);

    try {
      console.log('========================================');
      console.log('开始测试 LLM');
      console.log('========================================');

      const response = await fetch('/api/test/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });

      const data = await response.json();

      console.log('LLM 测试响应:', data);

      if (data.success) {
        setLlmTestResult(`✅ LLM 测试成功\n\n响应: ${data.data.response}\n\n耗时: ${data.data.duration}ms`);
      } else {
        setLlmTestResult(`❌ LLM 测试失败\n\n错误: ${data.error}\n\n详情: ${data.details}\n\n堆栈: ${data.stack}`);
      }
    } catch (error) {
      console.error('LLM 测试异常:', error);
      setLlmTestResult(`❌ LLM 测试异常\n\n${error}`);
    } finally {
      setLlmTestLoading(false);
    }
  };

  // 排序状态
  const [sortBy, setSortBy] = useState<'volume' | 'competition' | 'recommendation' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 搜索推荐相关状态
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 防抖函数
  const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // 获取搜索推荐
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const response = await fetch(
          `/api/keywords/suggest?q=${encodeURIComponent(query)}&language=${language}`
        );
        const data = await response.json();

        if (data.success && data.data.keywords) {
          setSuggestions(data.data.keywords);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
        }
      } catch (error) {
        console.error('获取搜索推荐失败:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300),
    [language]
  );

  // 处理关键词输入
  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (value.trim()) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // 选择搜索推荐
  const handleSelectSuggestion = (suggestion: string) => {
    setKeyword(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleExpand();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // 点击外部关闭推荐
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions) {
        if (
          suggestionsRef.current &&
          !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
        }
      }
    };

    // 添加事件监听
    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
    }

    // 清理函数
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleExpand = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setErrorMessage(null);
    setResult(null);
    setShowSuggestions(false);
    setSelectedDimension('all'); // 重置维度选择
    setSelectedType('all'); // 重置类型选择

    console.log('========================================');
    console.log('开始关键词拓展');
    console.log('关键词:', keyword.trim());
    console.log('语言:', language);
    console.log('配置:', {
      useRuleEngine,
      useLLMEngine,
      useDataMining,
      category: 'generic'
    });
    console.log('========================================');

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 60000); // 60秒超时

    try {
      console.log('发送请求到 /api/keywords/smart-expand');
      const response = await fetch('/api/keywords/smart-expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          category: 'generic', // 自动判断，默认为 generic
          useRuleEngine,
          useLLMEngine,
          useDataMining,
          useSemanticExpansion, // 新增：语义相似度拓展开关
          language,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('收到响应，状态码:', response.status);
      const data = await response.json();
      console.log('完整响应数据:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log('✅ 拓展成功');
        console.log('总关键词数:', data.data.totalKeywords);
        console.log('唯一关键词数:', data.data.uniqueKeywords);

        // 统计各来源数量
        const allKeywords = Object.values(data.data.dimensions || {}).flat();
        const sourceStats = {
          rule: allKeywords.filter((k: any) => k.source === 'rule').length,
          llm: allKeywords.filter((k: any) => k.source === 'llm').length,
          tagMining: allKeywords.filter((k: any) => k.source === 'tagMining').length,
          commentMining: allKeywords.filter((k: any) => k.source === 'commentMining').length,
          semanticExpansion: allKeywords.filter((k: any) => k.source === 'semanticExpansion').length, // 新增：语义相似度统计
        };
        console.log('各来源统计:', sourceStats);
        console.log('所有维度关键词数量:', Object.keys(data.data.dimensions || {}).reduce((acc, dim) => {
          acc[dim] = (data.data.dimensions[dim] || []).length;
          return acc;
        }, {} as any));

        if (sourceStats.llm === 0) {
          console.warn('⚠️ LLM 生成了 0 个关键词！');
          console.warn('可能原因: LLM API 调用失败、超时、或环境变量未配置');
        }
        if (sourceStats.tagMining === 0 && useDataMining) {
          console.warn('⚠️ 标签提取生成了 0 个关键词！');
          console.warn('可能原因: YouTube API 配额不足、网络问题、或环境变量未配置');
        }
        if (sourceStats.commentMining === 0 && useDataMining) {
          console.warn('⚠️ 评论提取生成了 0 个关键词！');
          console.warn('可能原因: YouTube API 配额不足、网络问题、或环境变量未配置');
        }

        setResult(data.data);
      } else {
        const errorMsg = data.error || data.details || '拓展失败，请重试';
        console.error('❌ 拓展失败:', errorMsg);
        setErrorMessage(errorMsg);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);

      console.error('❌ 请求异常:', error);

      let errorMsg = '拓展失败，请重试';
      if (error.name === 'AbortError') {
        errorMsg = '请求超时，请尝试关闭"LLM引擎"或"数据挖掘"选项后再试';
      } else if (error.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
      console.error('拓展失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredKeywords = (): ExpansionResult[] => {
    if (!result) return [];

    let filteredKeywords: ExpansionResult[] = [];

    // 先按维度过滤
    if (selectedDimension === 'all') {
      // 使用所有维度的关键词，而不是只使用topKeywords
      filteredKeywords = Object.values(result.dimensions).flat();
    } else {
      const dimensionKeywords = result.dimensions[selectedDimension as keyof typeof result.dimensions];
      filteredKeywords = dimensionKeywords || [];
    }

    // 再按类型过滤
    if (selectedType !== 'all') {
      filteredKeywords = filteredKeywords.filter(kw =>
        detectKeywordType(kw.keyword) === selectedType
      );
    }

    // 按排序字段和方向排序
    if (sortBy) {
      filteredKeywords.sort((a, b) => {
        let valueA: number;
        let valueB: number;

        switch (sortBy) {
          case 'volume':
            valueA = a.estimatedSearchVolume || 0;
            valueB = b.estimatedSearchVolume || 0;
            break;
          case 'competition':
            valueA = a.estimatedCompetition || 0;
            valueB = b.estimatedCompetition || 0;
            break;
          case 'recommendation':
            valueA = a.recommendationScore || 0;
            valueB = b.recommendationScore || 0;
            break;
          default:
            return 0;
        }

        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      });
    }

    return filteredKeywords;
  };

  // 处理排序
  const handleSort = (column: 'volume' | 'competition' | 'recommendation') => {
    if (sortBy === column) {
      // 如果点击当前排序列，切换排序方向
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击新的排序列，设置为该列，默认降序
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // 获取排序图标
  const getSortIcon = (column: 'volume' | 'competition' | 'recommendation') => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-slate-400" />;
    }
    return sortOrder === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" />
      : <ArrowDown className="w-4 h-1 ml-1 text-blue-600" />;
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
                <div className="flex-1 relative">
                  <Label htmlFor="keyword-input">关键词</Label>
                  <Input
                    id="keyword-input"
                    ref={inputRef}
                    placeholder="例如：剪映、Notion、ChatGPT"
                    value={keyword}
                    onChange={(e) => handleKeywordChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => keyword.trim() && showSuggestions && setShowSuggestions(true)}
                    className="text-lg h-12 pr-10"
                  />
                  {keyword && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setKeyword('');
                        setSuggestions([]);
                        setShowSuggestions(false);
                        inputRef.current?.focus();
                      }}
                      className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* 搜索推荐下拉框 */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-[70px] left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                    >
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectSuggestion(suggestion);
                          }}
                          onMouseEnter={() => setSelectedSuggestionIndex(index)}
                          className={`px-4 py-3 cursor-pointer transition-colors ${
                            index === selectedSuggestionIndex
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        </div>
                      ))}
                      {loadingSuggestions && (
                        <div className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                          <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-48">
                  <Label htmlFor="language-select">输出语言</Label>
                  <Select value={language} onValueChange={(value) => setLanguage(value as SupportedLanguage)}>
                    <SelectTrigger id="language-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="zh-TW">繁体中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="rule-engine" className="flex flex-col space-y-1">
                    <span>规则引擎</span>
                    <span className="font-normal text-xs text-slate-500">
                      基于预设模板生成关键词（推荐启用）
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
                      AI智能场景联想（需配置LLM API）
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
                      从YouTube提取真实数据（需配置YouTube API）
                    </span>
                  </Label>
                  <Switch
                    id="data-mining"
                    checked={useDataMining}
                    onCheckedChange={setUseDataMining}
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="semantic-expansion" className="flex flex-col space-y-1">
                    <span>语义相似度拓展</span>
                    <span className="font-normal text-xs text-slate-500">
                      近义词、同义词、相关词（需配置LLM API）
                    </span>
                  </Label>
                  <Switch
                    id="semantic-expansion"
                    checked={useSemanticExpansion}
                    onCheckedChange={setUseSemanticExpansion}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 结果展示 */}
        {(result || errorMessage) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 错误提示 */}
            {errorMessage && (
              <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                    <div className="flex-1">
                      <p className="text-sm font-medium">拓展失败</p>
                      <p className="text-xs mt-1">{errorMessage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 成功结果 */}
            {result && (
              <>
            {/* 数据来源提示 */}
            <Card className="mb-6 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Zap className={`w-5 h-5 ${useDataMining ? 'text-purple-600' : 'text-blue-600'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {useDataMining ? '数据来源：规则引擎 + AI智能 + YouTube真实数据' : '数据来源：规则引擎 + AI智能估算'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {useDataMining
                        ? '已启用数据挖掘，关键词基于YouTube真实视频数据优化，搜索量和竞争度为实际估算值'
                        : '未启用数据挖掘，搜索量和竞争度为AI估算值，开启"数据挖掘"选项可获取YouTube真实数据'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API 配额信息 */}
            {result.quota && (
              <Card className={`mb-6 ${result.quota.isExhausted ? 'border-red-500 bg-red-50 dark:bg-red-950' : 'border-blue-200 bg-blue-50 dark:bg-blue-950'}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`w-5 h-5 ${result.quota.isExhausted ? 'text-red-600' : 'text-blue-600'}`} />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          YouTube API 配额
                        </p>
                        <p className={`text-lg font-bold ${result.quota.isExhausted ? 'text-red-600' : 'text-blue-600'}`}>
                          {result.quota.isExhausted ? '今日配额已用完' : `余量: ${result.quota.remaining.toLocaleString()} / ${result.quota.limit.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-48">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                          <span>使用情况</span>
                          <span>{result.quota.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${result.quota.isExhausted ? 'bg-red-500' : result.quota.percentage > 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                            style={{ width: `${result.quota.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* 来源统计 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>数据来源统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 mb-4">
                  {(() => {
                    const allKeywords = Object.values(result.dimensions).flat();
                    const sources = [
                      { source: 'rule', name: '规则引擎', color: 'bg-slate-500', icon: Sparkles, requiresConfig: false },
                      { source: 'llm', name: 'AI生成', color: 'bg-blue-500', icon: Zap, requiresConfig: true },
                      { source: 'tagMining', name: '标签提取', color: 'bg-green-500', icon: Target, requiresConfig: true },
                      { source: 'commentMining', name: '评论提取', color: 'bg-purple-500', icon: Home, requiresConfig: true },
                      { source: 'semanticExpansion', name: '语义相似度', color: 'bg-orange-500', icon: Languages, requiresConfig: true },
                    ];
                    return sources.map(({ source, name, color, icon: Icon, requiresConfig }) => {
                      const count = allKeywords.filter((k: any) => k.source === source).length;
                      const isZero = count === 0;
                      return (
                        <div
                          key={source}
                          className={`p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
                            isZero && requiresConfig ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${color}`} />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{name}</span>
                          </div>
                          <p className={`text-2xl font-bold ${isZero ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-50'}`}>{count}</p>
                          {isZero && requiresConfig && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">需配置API</p>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* 提示信息 */}
                {(() => {
                  const allKeywords = Object.values(result.dimensions).flat();
                  const llmCount = allKeywords.filter((k: any) => k.source === 'llm').length;
                  const dataMiningCount = allKeywords.filter((k: any) =>
                    k.source === 'tagMining' || k.source === 'commentMining'
                  ).length;

                  if (llmCount === 0 && dataMiningCount === 0 && allKeywords.length > 0) {
                    return (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          💡 <strong>提示：</strong>当前仅使用规则引擎生成关键词。如需获取更丰富的关键词（AI生成、YouTube真实数据），请在拓展前开启"LLM引擎"和"数据挖掘"选项，并配置相应的API密钥。
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </CardContent>
            </Card>

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
                      onClick={() => {
                        setSelectedDimension(key);
                        setSortBy(null);
                        setSortOrder('desc');
                      }}
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

            {/* 关键词类型统计 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>关键词类型筛选</CardTitle>
                <CardDescription>点击类型卡片筛选关键词</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {/* 全部 */}
                  <div
                    onClick={() => {
                      setSelectedType('all');
                      setSortBy(null);
                      setSortOrder('desc');
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedType === 'all'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">全部</span>
                      <Badge variant="secondary">
                        {Object.values(result.dimensions).flat().length}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      显示所有关键词
                    </p>
                  </div>

                  {/* 品牌词 */}
                  {(['brand', 'generic', 'longtail'] as const).map(type => {
                    const typeCount = Object.values(result.dimensions).flat().filter(
                      kw => detectKeywordType(kw.keyword) === type
                    ).length;
                    const Icon = KEYWORD_TYPE_ICONS[type];
                    const typeName = KEYWORD_TYPE_NAMES[type];
                    const isSelected = selectedType === type;

                    return (
                      <div
                        key={type}
                        onClick={() => {
                          setSelectedType(type);
                          setSortBy(null);
                          setSortOrder('desc');
                        }}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-600 dark:text-slate-400'}`} />
                            <span className="text-sm font-medium">{typeName}</span>
                          </div>
                          <Badge className={KEYWORD_TYPE_COLORS[type]}>
                            {typeCount}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {type === 'brand' && '特定品牌或产品名称'}
                          {type === 'generic' && '通用的搜索词汇'}
                          {type === 'longtail' && '具体、长尾的搜索短语'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* 筛选提示 */}
                {selectedDimension !== 'all' && selectedType !== 'all' && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      当前筛选：<strong>{DIMENSION_NAMES[selectedDimension]}</strong>
                      × <strong>{KEYWORD_TYPE_NAMES[selectedType]}</strong>
                      <button
                        onClick={() => {
                          setSelectedDimension('all');
                          setSelectedType('all');
                          setSortBy(null);
                          setSortOrder('desc');
                        }}
                        className="ml-2 text-xs underline hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        清除筛选
                      </button>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 关键词列表 */}
            <Card>
              <CardHeader>
                <CardTitle>拓展结果</CardTitle>
                <CardDescription>
                  {selectedDimension !== 'all' && selectedType !== 'all'
                    ? `${DIMENSION_NAMES[selectedDimension]} × ${KEYWORD_TYPE_NAMES[selectedType]}：${getFilteredKeywords().length} 个关键词`
                    : selectedDimension !== 'all'
                    ? `${DIMENSION_NAMES[selectedDimension]}维度的所有关键词`
                    : selectedType !== 'all'
                    ? `${KEYWORD_TYPE_NAMES[selectedType]}的所有关键词`
                    : '推荐指数最高的20个关键词'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>关键词</TableHead>
                      <TableHead>维度</TableHead>
                      <TableHead>来源</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('volume')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          搜索量
                          {getSortIcon('volume')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('competition')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          竞争度
                          {getSortIcon('competition')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('recommendation')}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                        >
                          推荐指数
                          {getSortIcon('recommendation')}
                        </button>
                      </TableHead>
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
                          <Badge className={KEYWORD_TYPE_COLORS[detectKeywordType(kw.keyword)]}>
                            {KEYWORD_TYPE_NAMES[detectKeywordType(kw.keyword)]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
