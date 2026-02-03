'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Type, Sparkles, Copy, Check } from 'lucide-react';

interface TitleSuggestion {
  title: string;
  score: number;
  reasons: string[];
}

export default function TitleOptimizationPage() {
  const [inputTitle, setInputTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleOptimize = async () => {
    if (!inputTitle.trim()) {
      toast.error('请输入原始标题');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/optimize-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: inputTitle }),
      });

      if (!response.ok) {
        throw new Error('优化失败');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      toast.success('优化建议生成完成');
    } catch (error) {
      console.error('优化失败:', error);
      toast.error(error instanceof Error ? error.message : '优化失败');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (index: number, title: string) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedIndex(index);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 80) return 'bg-blue-100 text-blue-700';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Type className="w-8 h-8" />
          标题优化
        </h1>
        <p className="text-gray-600">
          AI生成多个标题建议，提升点击率和搜索排名
        </p>
      </div>

      {/* 输入区域 */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="inputTitle">原始标题</Label>
            <Input
              id="inputTitle"
              placeholder="输入视频原始标题..."
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOptimize()}
            />
          </div>
          <Button onClick={handleOptimize} disabled={isLoading} className="w-full">
            {isLoading ? '生成中...' : '生成优化建议'}
          </Button>
        </div>
      </Card>

      {/* 优化建议 */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            优化建议 ({suggestions.length})
          </h3>
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getScoreBadge(suggestion.score)}>
                      得分: {suggestion.score}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      #{index + 1}
                    </Badge>
                  </div>
                  <h4 className="text-lg font-medium mb-2">{suggestion.title}</h4>
                  <div className="space-y-1">
                    {suggestion.reasons.map((reason, i) => (
                      <div key={i} className="text-sm text-gray-600 flex items-start gap-1">
                        <span className="text-blue-600">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(index, suggestion.title)}
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && suggestions.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          <Type className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>输入标题开始优化</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">AI生成中...</p>
        </div>
      )}
    </div>
  );
}
