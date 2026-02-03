'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoSelector } from '@/components/video-selector';
import { useAnalysis } from '@/contexts/analysis-context';
import { toast } from 'sonner';
import { Activity, CheckCircle, XCircle, AlertCircle, TrendingUp, Download, RefreshCw } from 'lucide-react';

interface DiagnosisResult {
  overallScore: number;
  diagnosis: {
    title: string;
    titleLength: number;
    titleOptimal: boolean;
    description: string;
    descriptionLength: number;
    descriptionOptimal: boolean;
    tags: string[];
    tagCount: number;
    tagsOptimal: boolean;
  };
  suggestions: {
    category: string;
    items: string[];
  }[];
  competitorComparison: {
    avgViews: number;
    avgEngagement: number;
    targetViews: number;
    targetEngagement: number;
    viewPercentile: number;
    engagementPercentile: number;
  };
}

export default function ContentDiagnosisPage() {
  const { selectedVideo, setSelectedVideo } = useAnalysis();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDiagnose = async () => {
    if (!selectedVideo) {
      toast.error('请先选择视频');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/suggestions/content-diagnosis?videoId=${selectedVideo.id}`
      );

      if (!response.ok) {
        throw new Error('诊断失败');
      }

      const data = await response.json();
      setDiagnosis(data);

      toast.success('诊断完成', {
        description: `内容健康度评分：${data.overallScore}分`,
      });
    } catch (error) {
      console.error('诊断失败:', error);
      toast.error('诊断失败', {
        description: '无法完成内容诊断',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getOptimalIcon = (optimal: boolean) => {
    return optimal ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">内容诊断</h1>
        <p className="text-sm text-[#86868B] mt-1">全面诊断视频内容，发现改进空间</p>
      </div>

      <VideoSelector
        selectedVideoId={selectedVideo?.id || null}
        onVideoSelect={setSelectedVideo}
      />

      {!selectedVideo ? (
        <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
          <div className="text-center text-[#86868B]">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">请选择要诊断的视频</p>
            <p className="text-sm">选择视频后将显示诊断结果</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button
              onClick={handleDiagnose}
              disabled={isLoading}
              className="bg-[#007AFF] hover:bg-[#0066CC]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  诊断中...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  开始诊断
                </>
              )}
            </Button>
          </div>

          {/* 诊断结果 */}
          {!diagnosis && !isLoading ? (
            <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
              <div className="text-center text-[#86868B]">
                <p className="text-lg mb-2">准备好开始诊断</p>
                <p className="text-sm">点击"开始诊断"按钮开始分析视频内容</p>
              </div>
            </Card>
          ) : diagnosis ? (
            <div className="space-y-6">
              {/* 总体评分 */}
              <Card className={`p-6 border ${getScoreBg(diagnosis.overallScore)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">内容健康度评分</h3>
                  <Badge
                    variant="outline"
                    className={`${getScoreColor(diagnosis.overallScore)} border-current`}
                  >
                    {diagnosis.overallScore}分
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      diagnosis.overallScore >= 80
                        ? 'bg-green-500'
                        : diagnosis.overallScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${diagnosis.overallScore}%` }}
                  />
                </div>
                <p className="text-sm text-[#86868B] mt-2">
                  {diagnosis.overallScore >= 80
                    ? '内容表现优秀，继续保持！'
                    : diagnosis.overallScore >= 60
                    ? '内容表现良好，还有提升空间'
                    : '内容需要优化，建议参考下方建议'}
                </p>
              </Card>

              {/* 详细诊断 */}
              <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">详细诊断</h3>

                <div className="space-y-4">
                  {/* 标题诊断 */}
                  <div className="flex items-start gap-3 p-4 border border-[rgba(0,0,0,0.08)] rounded-lg">
                    {getOptimalIcon(diagnosis.diagnosis.titleOptimal)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[#1D1D1F]">标题</span>
                        <span className="text-sm text-[#86868B]">
                          {diagnosis.diagnosis.titleLength} 字符
                        </span>
                      </div>
                      <p className="text-sm text-[#1D1D1F] mb-2 line-clamp-2">
                        {diagnosis.diagnosis.title}
                      </p>
                      <p className="text-xs text-[#86868B]">
                        {diagnosis.diagnosis.titleOptimal
                          ? '标题长度适中，符合最佳实践'
                          : '建议优化标题长度（50-60字符最佳）'}
                      </p>
                    </div>
                  </div>

                  {/* 描述诊断 */}
                  <div className="flex items-start gap-3 p-4 border border-[rgba(0,0,0,0.08)] rounded-lg">
                    {getOptimalIcon(diagnosis.diagnosis.descriptionOptimal)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[#1D1D1F]">描述</span>
                        <span className="text-sm text-[#86868B]">
                          {diagnosis.diagnosis.descriptionLength} 字符
                        </span>
                      </div>
                      <p className="text-sm text-[#1D1D1F] mb-2 line-clamp-3">
                        {diagnosis.diagnosis.description || '暂无描述'}
                      </p>
                      <p className="text-xs text-[#86868B]">
                        {diagnosis.diagnosis.descriptionOptimal
                          ? '描述内容丰富，有利于SEO'
                          : '建议补充描述（200-500字符最佳）'}
                      </p>
                    </div>
                  </div>

                  {/* 标签诊断 */}
                  <div className="flex items-start gap-3 p-4 border border-[rgba(0,0,0,0.08)] rounded-lg">
                    {getOptimalIcon(diagnosis.diagnosis.tagsOptimal)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#1D1D1F]">标签</span>
                        <span className="text-sm text-[#86868B]">
                          {diagnosis.diagnosis.tagCount} 个
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {diagnosis.diagnosis.tags.length > 0 ? (
                          diagnosis.diagnosis.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-[#86868B]">暂无标签</span>
                        )}
                      </div>
                      <p className="text-xs text-[#86868B]">
                        {diagnosis.diagnosis.tagsOptimal
                          ? '标签数量适中，覆盖相关关键词'
                          : '建议添加3-5个相关标签'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 竞品对比 */}
              <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[#007AFF]" />
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">竞品对比</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-[#86868B] mb-1">观看量排名</p>
                    <p className="text-2xl font-semibold text-[#1D1D1F]">
                      前 {100 - diagnosis.competitorComparison.viewPercentile}%
                    </p>
                    <p className="text-xs text-[#86868B] mt-1">
                      超越了 {diagnosis.competitorComparison.viewPercentile}% 的同类视频
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-[#86868B] mb-1">互动率排名</p>
                    <p className="text-2xl font-semibold text-[#1D1D1F]">
                      前 {100 - diagnosis.competitorComparison.engagementPercentile}%
                    </p>
                    <p className="text-xs text-[#86868B] mt-1">
                      超越了 {diagnosis.competitorComparison.engagementPercentile}% 的同类视频
                    </p>
                  </div>
                </div>
              </Card>

              {/* 优化建议 */}
              <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-[#1D1D1F]">优化建议</h3>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    导出报告
                  </Button>
                </div>

                <div className="space-y-4">
                  {diagnosis.suggestions.map((suggestion, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{suggestion.category}</Badge>
                      </div>
                      <ul className="space-y-2 ml-4">
                        {suggestion.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-[#1D1D1F]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
