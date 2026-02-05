'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Loader2, Globe } from 'lucide-react';
import LanguageSelector from '@/components/keyword-expander/LanguageSelector';
import KeywordResults from '@/components/keyword-expander/KeywordResults';
import PhraseResults from '@/components/keyword-expander/PhraseResults';
import type { KeywordData } from '@/lib/keyword-extractor/extractor';
import type { PhraseData } from '@/lib/keyword-extractor/phrase-extractor';
import { detectLanguage } from '@/lib/keyword-extractor/languages';

export default function KeywordExpandPage() {
  const [keyword, setKeyword] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['zh', 'en']);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
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
    setResults(null);

    try {
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
      setResults(data.data);
      toast.success(`发现 ${data.data.summary.totalKeywords} 个关键词，${data.data.summary.totalPhrases} 个词组`);
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
        <h1 className="text-3xl font-bold">关键词拓展</h1>
        <p className="text-gray-500 mt-2">
          根据搜索结果和内容热度，智能拓展 YouTube 关键词
        </p>
      </div>

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
                placeholder="输入关键词，如：健身、Fitness..."
                className="pl-10"
                onBlur={detectAndSuggestLanguages}
              />
            </div>
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
          </div>

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
                开始搜索
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 搜索结果 */}
      {results && (
        <Tabs defaultValue="keywords" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keywords">
              热门关键词 ({results.summary.totalKeywords})
            </TabsTrigger>
            <TabsTrigger value="phrases">
              词组拓展 ({results.summary.totalPhrases})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keywords">
            <KeywordResults
              keyword={results.keyword}
              languages={results.languages}
              keywords={results.keywords}
              summary={results.summary}
              onKeywordClick={handleKeywordClick}
            />
          </TabsContent>

          <TabsContent value="phrases">
            <PhraseResults
              phrases={results.phrases}
              originalKeyword={results.keyword}
              onPhraseClick={handleKeywordClick}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* 空状态 */}
      {!results && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">开始拓展关键词</h3>
            <p className="text-gray-500 text-center max-w-md">
              输入关键词并选择语言，系统将自动从 YouTube 提取相关关键词，并根据热度排序
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
