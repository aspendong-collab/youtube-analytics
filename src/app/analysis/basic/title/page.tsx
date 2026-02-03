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

    // 模拟标题优化
    setTimeout(() => {
      const mockSuggestions: TitleSuggestion[] = [
        {
          title: `${inputTitle} - 零基础入门完整教程`,
          score: 92,
          reasons: ['增加了教程属性', '强调零基础友好', '完整教程增加价值感'],
        },
        {
          title: `【${inputTitle}】从入门到精通`,
          score: 88,
          reasons: ['使用方括号增加视觉突出', '从入门到精通覆盖全阶段'],
        },
        {
          title: `${inputTitle} | 实战案例演示`,
          score: 85,
          reasons: ['强调实战价值', '增加案例演示元素'],
        },
        {
          title: `必看！${inputTitle} 详细讲解`,
          score: 82,
          reasons: ['使用"必看"引发注意', '强调详细讲解'],
        },
        {
          title: `${inputTitle}：新手也能学会的技巧`,
          score: 78,
          reasons: ['针对新手定位', '强调可学性'],
        },
      ];

      setSuggestions(mockSuggestions);
      setIsLoading(false);
      toast.success('优化建议生成完成');
    }, 1500);
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
