'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoSelector } from '@/components/video-selector';
import { useAnalysis } from '@/contexts/analysis-context';
import { toast } from 'sonner';
import { Activity, CheckCircle, XCircle, AlertCircle, Download, RefreshCw } from 'lucide-react';

interface DiagnosisResult {
  overallScore: string;
  dimensions: {
    title: { score: number; issues: string[]; recommendations: string[]; strengths: string[] };
    description: { score: number; issues: string[]; recommendations: string[]; strengths: string[] };
    tags: { score: number; issues: string[]; recommendations: string[]; strengths: string[] };
    duration: { score: number; issues: string[]; recommendations: string[]; strengths: string[] };
    publishTime: { score: number; issues: string[]; recommendations: string[]; strengths: string[] };
    engagement: { score: number; issues: string[]; recommendations: string[]; strengths: string[] };
    cost: { score: number; issues: string[]; recommendations: string[]; strengths: string[] };
    channelPerformance: { score: number; issues: string[]; recommendations: string[]; strengths: string[] };
  };
  issues: string[];
  recommendations: string[];
  strengths: string[];
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

  const overallScore = parseFloat(diagnosis?.overallScore || '0');

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
              <Card className={`p-6 border ${getScoreBg(overallScore)}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">内容健康度评分</h3>
                  <Badge
                    variant="outline"
                    className={`${getScoreColor(overallScore)} border-current`}
                  >
                    {diagnosis.overallScore}分
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      overallScore >= 80
                        ? 'bg-green-500'
                        : overallScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${overallScore}%` }}
                  />
                </div>
                <p className="text-sm text-[#86868B] mt-2">
                  {overallScore >= 80
                    ? '内容表现优秀，继续保持！'
                    : overallScore >= 60
                    ? '内容表现良好，还有提升空间'
                    : '内容需要优化，建议参考下方建议'}
                </p>
              </Card>

              {/* 详细诊断 */}
              <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                <h3 className="text-lg font-semibold text-[#1D1D1F] mb-4">详细诊断</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(diagnosis.dimensions).map(([key, dim]) => (
                    <div
                      key={key}
                      className={`p-4 border rounded-lg ${getScoreBg(dim.score)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#1D1D1F] capitalize">
                          {getDimensionLabel(key)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`${getScoreColor(dim.score)} border-current`}
                        >
                          {dim.score}分
                        </Badge>
                      </div>
                      {dim.issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-[#86868B] mb-1">问题：</p>
                          {dim.issues.slice(0, 2).map((issue, idx) => (
                            <p key={idx} className="text-xs text-[#1D1D1F]">
                              • {issue}
                            </p>
                          ))}
                        </div>
                      )}
                      {dim.strengths.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-[#86868B] mb-1">优点：</p>
                          {dim.strengths.slice(0, 2).map((strength, idx) => (
                            <p key={idx} className="text-xs text-[#1D1D1F]">
                              ✓ {strength}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* 问题和建议 */}
              {diagnosis.issues.length > 0 && (
                <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-[#1D1D1F]">主要问题</h3>
                  </div>
                  <div className="space-y-2">
                    {diagnosis.issues.map((issue, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[#1D1D1F]">{issue}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {diagnosis.strengths.length > 0 && (
                <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-[#1D1D1F]">内容优势</h3>
                  </div>
                  <div className="space-y-2">
                    {diagnosis.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[#1D1D1F]">{strength}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {diagnosis.recommendations.length > 0 && (
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
                  <div className="space-y-2">
                    {diagnosis.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[#1D1D1F]">{rec}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function getDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    title: '标题',
    description: '描述',
    tags: '标签',
    duration: '时长',
    publishTime: '发布时间',
    engagement: '互动数据',
    cost: '成本',
    channelPerformance: '频道表现',
  };
  return labels[key] || key;
}
