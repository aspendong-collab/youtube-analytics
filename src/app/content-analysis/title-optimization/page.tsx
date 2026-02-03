'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { VideoSelector } from '@/components/video-selector';
import { useAnalysis } from '@/contexts/analysis-context';
import { toast } from 'sonner';
import { Target, TrendingUp, Lightbulb, Copy, Check, Wand2 } from 'lucide-react';

interface SuggestedTitle {
  title: string;
  reason: string;
  estimatedCTR: number;
}

export default function TitleOptimizationPage() {
  const { selectedVideo } = useAnalysis();
  const [currentTitle, setCurrentTitle] = useState('');
  const [suggestedTitles, setSuggestedTitles] = useState<SuggestedTitle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!selectedVideo) {
      toast.error('请先选择视频');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/suggestions/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTitle: currentTitle || selectedVideo.title,
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();

      // 模拟建议数据（如果没有返回真实数据）
      const suggestions = data.suggestions || [
        {
          title: `10个技巧：${selectedVideo.title}`,
          reason: '添加数字和"技巧"可以提升点击率',
          estimatedCTR: 8.5,
        },
        {
          title: `🔥 ${selectedVideo.title} - 必看指南`,
          reason: '使用表情符号和强调词吸引注意力',
          estimatedCTR: 9.2,
        },
        {
          title: `为什么你应该看${selectedVideo.title}`,
          reason: '使用疑问句激发好奇心',
          estimatedCTR: 7.8,
        },
      ];

      setSuggestedTitles(suggestions);
      setCurrentTitle(selectedVideo.title);

      toast.success('生成成功', {
        description: '已生成多个优化建议',
      });
    } catch (error) {
      console.error('生成标题失败:', error);
      toast.error('生成失败', {
        description: '无法生成优化建议',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (title: string) => {
    try {
      await navigator.clipboard.writeText(title);
      setCopiedTitle(title);
      setTimeout(() => setCopiedTitle(null), 2000);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">标题优化</h1>
        <p className="text-sm text-[#86868B] mt-1">优化视频标题，提升点击率和观看次数</p>
      </div>

      {/* 视频选择器 */}
      <VideoSelector
        selectedVideoId={selectedVideo?.id || null}
        onVideoSelect={() => {}}
      />

      {/* 当前标题和生成按钮 */}
      {!selectedVideo ? (
        <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
          <div className="text-center text-[#86868B]">
            <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">请选择要优化的视频</p>
            <p className="text-sm">选择视频后将可以进行标题优化</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 当前标题 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <Label className="text-sm font-medium text-[#1D1D1F] mb-2 block">
              当前标题
            </Label>
            <Input
              value={currentTitle || selectedVideo.title}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="输入或修改当前标题"
              className="text-lg"
            />
            <div className="flex justify-between mt-3">
              <span className="text-xs text-[#86868B]">
                当前标题长度：{(currentTitle || selectedVideo.title).length} 字符
              </span>
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-[#007AFF] hover:bg-[#0066CC]"
              >
                {isLoading ? '生成中...' : '生成优化建议'}
              </Button>
            </div>
          </Card>

          {/* 优化建议 */}
          {suggestedTitles.length > 0 && (
            <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-[#1D1D1F]">优化建议</h3>
              </div>

              <div className="space-y-4">
                {suggestedTitles.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border border-[rgba(0,0,0,0.08)] rounded-lg hover:border-[#007AFF]/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-[#1D1D1F] mb-1">
                          {suggestion.title}
                        </h4>
                        <p className="text-sm text-[#86868B] mb-2">
                          {suggestion.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          预计 CTR: {suggestion.estimatedCTR}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(suggestion.title)}
                        className="flex-1"
                      >
                        {copiedTitle === suggestion.title ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            复制标题
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentTitle(suggestion.title)}
                      >
                        应用此标题
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 标题优化技巧 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-[#007AFF]" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">标题优化技巧</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-[#1D1D1F] mb-1">使用数字</p>
                <p className="text-sm text-[#86868B]">
                  "10个技巧"比"多个技巧"更具吸引力
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-[#1D1D1F] mb-1">添加表情符号</p>
                <p className="text-sm text-[#86868B]">
                  🎯✨🔥 可以提升注意度和点击率
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-[#1D1D1F] mb-1">制造悬念</p>
                <p className="text-sm text-[#86868B]">
                  使用"为什么"、"如何"等疑问词
                </p>
              </div>

              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <p className="font-medium text-[#1D1D1F] mb-1">控制长度</p>
                <p className="text-sm text-[#86868B]">
                  最佳长度为50-60字符，确保在搜索结果中完整显示
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
