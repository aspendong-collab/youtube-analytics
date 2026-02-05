'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Loader2, Globe, Sparkles, Zap, BarChart3, Target, Lightbulb } from 'lucide-react';
import LanguageSelector from '@/components/keyword-expander/LanguageSelector';
import ComprehensiveKeywordResults from '@/components/keyword-expander/ComprehensiveKeywordResults';
import KeywordResults from '@/components/keyword-expander/KeywordResults';
import PhraseResults from '@/components/keyword-expander/PhraseResults';
import type { KeywordData } from '@/lib/keyword-extractor/extractor';
import type { PhraseData } from '@/lib/keyword-extractor/phrase-extractor';
import type { EnhancedKeywordData } from '@/lib/keyword-extractor/types';
import { detectLanguage } from '@/lib/keyword-extractor/languages';

export default function KeywordExpandPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['zh', 'en']);
  const [isLoading, setIsLoading] = useState(false);
  const [useComprehensiveSearch, setUseComprehensiveSearch] = useState(true);
  const [comprehensiveResults, setComprehensiveResults] = useState<{
    keywords: EnhancedKeywordData[];
    suggestions: string[];
    relatedSearches: string[];
    questions: string[];
    competitors: string[];
    statistics: any;
  } | null>(null);
  const [standardResults, setStandardResults] = useState<{
    keyword: string;
    languages: string[];
    keywords: KeywordData[];
    phrases: PhraseData[];
    summary: any;
  } | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('请输入关键词');
      return;
    }

    if (selectedLanguages.length === 0) {
      toast.error('请至少选择一种语言');
      return;
    }

    setIsLoading(true);
    setComprehensiveResults(null);
    setStandardResults(null);

    try {
      if (useComprehensiveSearch) {
        // 使用新的综合关键词采集 API
        const response = await fetch('/api/discovery/keywords/comprehensive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            languages: selectedLanguages,
            options: {
              maxVideos: 200,
              enableSuggestions: true,
              enableRelated: true,
              enableCompetitor: true,
              enableQuestions: true,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '搜索失败');
        }

        const data = await response.json();
        setComprehensiveResults(data.data);
        const keywordsCount = data.data.keywords?.length || 0;
        const suggestionsCount = data.data.suggestions?.length || 0;
        toast.success(`发现 ${keywordsCount} 个关键词，${suggestionsCount} 个搜索建议`);
      } else {
        // 使用旧的拓展 API
        const response = await fetch('/api/discovery/keywords/expand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            languages: selectedLanguages,
            options: {
              maxResults: 50,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '搜索失败');
        }

        const data = await response.json();
        setStandardResults(data.data);
        toast.success(`发现 ${data.data.summary.totalKeywords} 个关键词，${data.data.summary.totalPhrases} 个词组`);
      }
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error(error instanceof Error ? error.message : '搜索失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordClick = (kw: string) => {
    setKeyword(kw);
    // 可以选择自动搜索或让用户手动点击
  };

  // 智能语言检测
  const detectAndSuggestLanguages = () => {
    if (keyword.trim()) {
      const detectedLang = detectLanguage(keyword);
      if (!selectedLanguages.includes(detectedLang)) {
        const newLanguages = [detectedLang, ...selectedLanguages].slice(0, 3);
        setSelectedLanguages(newLanguages);
        toast.info(`已自动添加 ${detectedLang} 语言`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">YouTube SEO 关键词挖掘</h1>
        <p className="text-gray-500 mt-2">
          专业级关键词分析工具，多维度挖掘、竞争度分析、趋势预测
        </p>
      </div>

      {/* 搜索模式切换 */}
      <Card className="border-gradient">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>选择搜索模式</CardTitle>
              <CardDescription className="mt-1">
                综合搜索提供更全面的关键词分析，标准搜索更快但功能较少
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={useComprehensiveSearch ? 'default' : 'outline'}
                onClick={() => setUseComprehensiveSearch(true)}
                className={useComprehensiveSearch ? 'bg-gradient-to-r from-blue-500 to-purple-500' : ''}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                综合搜索
              </Button>
              <Button
                variant={!useComprehensiveSearch ? 'default' : 'outline'}
                onClick={() => setUseComprehensiveSearch(false)}
              >
                <Zap className="w-4 h-4 mr-2" />
                标准搜索
              </Button>
            </div>
          </div>
          {useComprehensiveSearch && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-blue-500" />
                <span>500+ 关键词</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-green-500" />
                <span>竞争度分析</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span>蓝海机会</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-purple-500" />
                <span>多维度分类</span>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* 搜索区域 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索关键词</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 关键词输入 */}
          <div>
            <label className="text-sm font-medium mb-2 block">关键词</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="输入关键词，如：健身、Fitness、study..."
                className="pl-10"
                onBlur={detectAndSuggestLanguages}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              支持中文、英文、日文、韩文、西班牙文等多种语言
            </p>
          </div>

          {/* 语言选择 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              选择语言（最多5种）
            </label>
            <LanguageSelector
              selectedLanguages={selectedLanguages}
              onChange={setSelectedLanguages}
              maxSelect={5}
            />
            <p className="text-xs text-gray-500 mt-1">
              综合搜索将采集 YouTube 搜索建议和相关搜索，需要选择语言
            </p>
          </div>

          {/* 采集选项 */}
          {useComprehensiveSearch && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <label className="text-sm font-medium block">数据源选项</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span>搜索建议</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span>相关搜索</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span>竞品分析</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span>问题型关键词</span>
                </label>
              </div>
            </div>
          )}

          {/* 搜索按钮 */}
          <Button
            onClick={handleSearch}
            disabled={isLoading || !keyword.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                搜索中...
              </>
            ) : (
              <>
                <Globe className="mr-2 w-4 h-4" />
                开始{useComprehensiveSearch ? '综合' : ''}搜索
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 搜索结果 - 综合搜索 */}
      {comprehensiveResults && (
        <ComprehensiveKeywordResults
          data={comprehensiveResults}
          originalKeyword={keyword}
          languages={selectedLanguages}
          onKeywordClick={handleKeywordClick}
        />
      )}

      {/* 搜索结果 - 标准搜索 */}
      {standardResults && (
        <Tabs defaultValue="keywords" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keywords">
              热门关键词 ({standardResults.summary.totalKeywords})
            </TabsTrigger>
            <TabsTrigger value="phrases">
              词组拓展 ({standardResults.summary.totalPhrases})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keywords">
            <KeywordResults
              keyword={standardResults.keyword}
              languages={standardResults.languages}
              keywords={standardResults.keywords}
              summary={standardResults.summary}
              onKeywordClick={handleKeywordClick}
            />
          </TabsContent>

          <TabsContent value="phrases">
            <PhraseResults
              phrases={standardResults.phrases}
              originalKeyword={standardResults.keyword}
              onPhraseClick={handleKeywordClick}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* 空状态 */}
      {!comprehensiveResults && !standardResults && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">开始挖掘关键词</h3>
            <p className="text-gray-500 text-center max-w-md">
              输入关键词并选择语言，系统将自动从多个维度挖掘关键词，包括搜索建议、相关搜索、竞品分析等
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
