'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Stethoscope, AlertTriangle, CheckCircle, AlertCircle, Target } from 'lucide-react';

interface DiagnosisIssue {
  id: string;
  category: 'high' | 'medium' | 'low';
  type: 'title' | 'thumbnail' | 'content' | 'tags' | 'timing';
  description: string;
  impact: string;
  suggestion: string;
  improvement: string;
}

interface VideoDiagnosis {
  id: string;
  title: string;
  overallScore: number;
  issues: DiagnosisIssue[];
  expectedImprovement: {
    ctr: number;
    retention: number;
    engagement: number;
  };
}

export default function ContentDiagnosisPage() {
  const [loading, setLoading] = useState(true);
  const [diagnoses, setDiagnoses] = useState<VideoDiagnosis[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoDiagnosis | null>(null);

  useEffect(() => {
    loadDiagnoses();
  }, []);

  const loadDiagnoses = async () => {
    setLoading(true);
    try {
      // 模拟诊断数据
      const mockDiagnoses: VideoDiagnosis[] = [
        {
          id: '1',
          title: 'Python学习指南',
          overallScore: 65,
          issues: [
            {
              id: '1',
              category: 'high',
              type: 'title',
              description: '标题缺少数字和情感词',
              impact: '影响CTR: -30%',
              suggestion: '"Python学习指南" → "10个Python技巧，新手必看"',
              improvement: 'CTR预计提升 80%',
            },
            {
              id: '2',
              category: 'high',
              type: 'thumbnail',
              description: '封面文字过小',
              impact: '影响CTR: -20%',
              suggestion: '使用大号字体，对比度增强',
              improvement: 'CTR预计提升 25%',
            },
            {
              id: '3',
              category: 'medium',
              type: 'content',
              description: '前30秒缺乏吸引力',
              impact: '影响完播率: -15%',
              suggestion: '添加悬念或直接展示成果',
              improvement: '完播率预计提升 20%',
            },
            {
              id: '4',
              category: 'medium',
              type: 'content',
              description: '缺少行动号召',
              impact: '影响订阅率: -10%',
              suggestion: '结尾添加"点赞订阅"提示',
              improvement: '订阅率预计提升 30%',
            },
            {
              id: '5',
              category: 'low',
              type: 'tags',
              description: '标签未包含热门关键词',
              impact: '影响搜索: -5%',
              suggestion: '添加"Python教程"、"编程入门"等标签',
              improvement: '搜索流量预计提升 15%',
            },
          ],
          expectedImprovement: {
            ctr: 86,
            retention: 29,
            engagement: 50,
          },
        },
      ];

      setDiagnoses(mockDiagnoses);
      setSelectedVideo(mockDiagnoses[0]);
    } catch (error) {
      console.error('加载失败:', error);
      toast.error('加载诊断数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700">高优先级</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">中优先级</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-700">低优先级</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      title: '标题',
      thumbnail: '封面',
      content: '内容',
      tags: '标签',
      timing: '发布时间',
    };
    return <Badge variant="outline">{typeMap[type] || type}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '一般';
    return '需改进';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Stethoscope className="w-8 h-8" />
          内容诊断
        </h1>
        <p className="text-gray-600">
          360度视频诊断，发现问题和改进机会
        </p>
      </div>

      {/* 视频选择列表 */}
      <Card className="p-4 mb-6">
        <h3 className="font-semibold mb-3">选择诊断的视频</h3>
        <div className="space-y-2">
          {diagnoses.map((diag) => (
            <div
              key={diag.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedVideo?.id === diag.id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedVideo(diag)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{diag.title}</div>
                  <div className="text-sm text-gray-600">评分: {diag.overallScore}/100</div>
                </div>
                <Badge
                  className={
                    diag.overallScore >= 80
                      ? 'bg-green-500'
                      : diag.overallScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }
                >
                  {getScoreBadge(diag.overallScore)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 诊断详情 */}
      {selectedVideo && (
        <div className="space-y-6">
          {/* 总体评分 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              诊断报告
            </h3>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(selectedVideo.overallScore)}`}>
                  {selectedVideo.overallScore}
                </div>
                <div className="text-sm text-gray-600 mt-1">整体评分</div>
              </div>
              <div className="flex-1">
                <div className="flex gap-2 mb-4">
                  {selectedVideo.issues.filter((i) => i.category === 'high').length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="text-red-600 font-medium">
                        {selectedVideo.issues.filter((i) => i.category === 'high').length}个高优先级问题
                      </span>
                    </div>
                  )}
                  {selectedVideo.issues.filter((i) => i.category === 'medium').length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-600 font-medium">
                        {selectedVideo.issues.filter((i) => i.category === 'medium').length}个中优先级问题
                      </span>
                    </div>
                  )}
                  {selectedVideo.issues.filter((i) => i.category === 'low').length > 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">
                        {selectedVideo.issues.filter((i) => i.category === 'low').length}个低优先级问题
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  点击问题卡片查看详细改进建议
                </div>
              </div>
            </div>
          </Card>

          {/* 问题列表 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">问题详情</h3>
            <div className="space-y-4">
              {selectedVideo.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(issue.category)}
                      <div>
                        <div className="font-medium">{issue.description}</div>
                        <div className="text-sm text-gray-600">{issue.impact}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getCategoryBadge(issue.category)}
                      {getTypeBadge(issue.type)}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">💡 建议</div>
                      <div className="text-sm text-gray-600">{issue.suggestion}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-green-700 mb-1">
                        ✨ 预期效果
                      </div>
                      <div className="text-sm text-green-600">{issue.improvement}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 改进后预期 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">改进后预期提升</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">CTR</div>
                <div className="text-2xl font-bold text-blue-600">
                  +{selectedVideo.expectedImprovement.ctr}%
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">完播率</div>
                <div className="text-2xl font-bold text-green-600">
                  +{selectedVideo.expectedImprovement.retention}%
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-600 mb-1">订阅率</div>
                <div className="text-2xl font-bold text-purple-600">
                  +{selectedVideo.expectedImprovement.engagement}%
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
