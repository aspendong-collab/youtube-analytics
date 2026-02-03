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

interface TitleAnalysisResult {
  score: number;
  keywordCoverage: string;
  lengthAnalysis: string;
  suggestions: string[];
  optimizationReasons: string[];
}

export default function TitleOptimizationPage() {
  const { selectedVideo, setSelectedVideo } = useAnalysis();
  const [currentTitle, setCurrentTitle] = useState('');
  const [analysis, setAnalysis] = useState<TitleAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleAnalyze = async () => {
    const titleToAnalyze = currentTitle || selectedVideo?.title || '';

    if (!titleToAnalyze) {
      toast.error('请输入或选择视频标题');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/suggestions/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToAnalyze,
        }),
      });

      if (!response.ok) {
        throw new Error('分析失败');
      }

      const data = await response.json();
      setAnalysis(data);

      toast.success('分析完成', {
        description: `标题评分：${data.score}分`,
      });
    } catch (error) {
      console.error('分析失败:', error);
      toast.error('分析失败', {
        description: '无法完成标题分析',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
      toast.success('已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return 'bg-green-50 border-green-200';
    if (score >= 6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
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
        onVideoSelect={setSelectedVideo}
      />

      {/* 当前标题和生成按钮 */}
      {!selectedVideo && !currentTitle ? (
        <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
          <div className="text-center text-[#86868B]">
            <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">请选择视频或输入标题</p>
            <p className="text-sm">选择视频或输入标题后可以进行标题优化</p>
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
              value={currentTitle || selectedVideo?.title || ''}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="输入或修改当前标题"
              className="text-lg"
            />
            <div className="flex justify-between mt-3">
              <span className="text-xs text-[#86868B]">
                当前标题长度：{(currentTitle || selectedVideo?.title || '').length} 字符
              </span>
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="bg-[#007AFF] hover:bg-[#0066CC]"
              >
                {isLoading ? '分析中...' : '开始分析'}
              </Button>
            </div>
          </Card>

          {/* 分析结果 */}
          {analysis && (
            <div className="space-y-6">
              {/* 评分 */}
              <Card className={`p-6 border ${getScoreBg(analysis.score)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">标题评分</h3>
                  <Badge
                    variant="outline"
                    className={`${getScoreColor(analysis.score)} border-current`}
                  >
                    {analysis.score}/10 分
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      analysis.score >= 8
                        ? 'bg-green-500'
                        : analysis.score >= 6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.score * 10}%` }}
                  />
                </div>
              </Card>

              {/* 详细分析 */}
              <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">详细分析</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium text-[#1D1D1F]">关键词覆盖度</h4>
                    </div>
                    <p className="text-sm text-[#86868B]">{analysis.keywordCoverage}</p>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      <h4 className="font-medium text-[#1D1D1F]">长度分析</h4>
                    </div>
                    <p className="text-sm text-[#86868B]">{analysis.lengthAnalysis}</p>
                  </div>
                </div>
              </Card>

              {/* 优化建议 */}
              {analysis.suggestions.length > 0 && (
                <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-[#1D1D1F]">优化建议</h3>
                  </div>

                  <div className="space-y-3">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 border border-[rgba(0,0,0,0.08)] rounded-lg hover:border-[#007AFF]/30 transition-all"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-[#1D1D1F] mb-2">{suggestion}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(suggestion)}
                        >
                          {copiedText === suggestion ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              复制
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 优化原因 */}
              {analysis.optimizationReasons.length > 0 && (
                <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-[#1D1D1F]">优化原因</h3>
                  </div>

                  <div className="space-y-2">
                    {analysis.optimizationReasons.map((reason, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[#1D1D1F]">{reason}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
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
