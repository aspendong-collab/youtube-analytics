'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface PredictionResult {
  score: number; // 0-100
  ctr: number; // 预测点击率
  factors: {
    title: { score: number; issues: string[]; improvements: string[] };
    thumbnail: { score: number; issues: string[]; improvements: string[] };
    timing: { score: number; issues: string[]; improvements: string[] };
  };
}

export default function CTRPredictionPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const handlePredict = () => {
    if (!title.trim()) {
      toast.error('请输入视频标题');
      return;
    }

    setIsAnalyzing(true);

    // 模拟预测分析
    setTimeout(() => {
      const titleLength = title.length;
      const titleWords = title.split(/\s+/).length;
      const hasNumbers = /\d/.test(title);
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(title);
      const descriptionLength = description.length;

      // 标题评分
      let titleScore = 50;
      const titleIssues: string[] = [];
      const titleImprovements: string[] = [];

      if (titleLength < 10) {
        titleScore -= 20;
        titleIssues.push('标题过短');
        titleImprovements.push('标题长度建议在20-60字符之间');
      } else if (titleLength > 100) {
        titleScore -= 10;
        titleIssues.push('标题过长');
        titleImprovements.push('标题过长可能被截断');
      } else {
        titleScore += 10;
      }

      if (titleWords < 3) {
        titleScore -= 10;
        titleIssues.push('关键词过少');
        titleImprovements.push('增加更多相关关键词');
      }

      if (hasNumbers) {
        titleScore += 15;
        titleImprovements.push('使用数字可以提高点击率');
      }

      if (hasEmoji) {
        titleScore += 10;
        titleImprovements.push('使用表情符号可以吸引注意');
      }

      // 缩略图评分
      let thumbnailScore = 60;
      const thumbnailIssues: string[] = [];
      const thumbnailImprovements: string[] = [];

      if (!thumbnail) {
        thumbnailScore -= 20;
        thumbnailIssues.push('未上传缩略图');
        thumbnailImprovements.push('自定义缩略图比自动生成的点击率高30%');
      }

      // 时效性评分
      let timingScore = 70;
      const timingIssues: string[] = [];
      const timingImprovements: string[] = [];

      timingImprovements.push('在用户活跃时段发布视频');

      // 总分
      const overallScore = Math.round((titleScore + thumbnailScore + timingScore) / 3);
      const predictedCTR = (overallScore / 100) * 0.15; // 最高15%点击率

      setResult({
        score: overallScore,
        ctr: predictedCTR,
        factors: {
          title: {
            score: Math.round(titleScore),
            issues: titleIssues,
            improvements: titleImprovements,
          },
          thumbnail: {
            score: Math.round(thumbnailScore),
            issues: thumbnailIssues,
            improvements: thumbnailImprovements,
          },
          timing: {
            score: Math.round(timingScore),
            issues: timingIssues,
            improvements: timingImprovements,
          },
        },
      });

      setIsAnalyzing(false);
      toast.success('预测完成');
    }, 1500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Eye className="w-8 h-8" />
          点击率预测
        </h1>
        <p className="text-gray-600">
          AI分析视频标题和缩略图，预测点击率并优化建议
        </p>
      </div>

      {/* 输入表单 */}
      <Card className="p-6 mb-6">
        <h3 className="font-semibold mb-4">视频信息</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">视频标题 *</Label>
            <Input
              id="title"
              placeholder="输入视频标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="text-xs text-gray-500 mt-1">
              当前长度: {title.length} 字符
            </div>
          </div>

          <div>
            <Label htmlFor="description">视频描述</Label>
            <Textarea
              id="description"
              placeholder="输入视频描述..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <div className="text-xs text-gray-500 mt-1">
              当前长度: {description.length} 字符
            </div>
          </div>

          <div>
            <Label htmlFor="thumbnail">缩略图URL</Label>
            <Input
              id="thumbnail"
              placeholder="输入缩略图URL..."
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
            />
          </div>

          <Button onClick={handlePredict} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? '分析中...' : '预测点击率'}
          </Button>
        </div>
      </Card>

      {/* 预测结果 */}
      {result && (
        <div className="space-y-6">
          {/* 总分 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">预测结果</h3>
              <Badge className={`${getScoreBadge(result.score)}`}>
                预测点击率: {formatPercent(result.ctr)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}
                </div>
                <div className="text-sm text-gray-600 mt-1">综合评分</div>
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      result.score >= 70 ? 'bg-green-500' :
                      result.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* 详细分析 */}
          <div className="space-y-4">
            <h3 className="font-semibold">详细分析</h3>

            {/* 标题分析 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">标题</h4>
                <Badge variant="outline">
                  得分: <span className={getScoreColor(result.factors.title.score)}>
                    {result.factors.title.score}
                  </span>
                </Badge>
              </div>
              {result.factors.title.issues.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    问题
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 pl-6">
                    {result.factors.title.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.factors.title.improvements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    建议
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 pl-6">
                    {result.factors.title.improvements.map((imp, i) => (
                      <li key={i}>• {imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* 缩略图分析 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">缩略图</h4>
                <Badge variant="outline">
                  得分: <span className={getScoreColor(result.factors.thumbnail.score)}>
                    {result.factors.thumbnail.score}
                  </span>
                </Badge>
              </div>
              {result.factors.thumbnail.issues.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    问题
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 pl-6">
                    {result.factors.thumbnail.issues.map((issue, i) => (
                      <li key={i}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.factors.thumbnail.improvements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    建议
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 pl-6">
                    {result.factors.thumbnail.improvements.map((imp, i) => (
                      <li key={i}>• {imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* 时效性分析 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">发布时机</h4>
                <Badge variant="outline">
                  得分: <span className={getScoreColor(result.factors.timing.score)}>
                    {result.factors.timing.score}
                  </span>
                </Badge>
              </div>
              {result.factors.timing.improvements.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    建议
                  </div>
                  <ul className="space-y-1 text-sm text-gray-600 pl-6">
                    {result.factors.timing.improvements.map((imp, i) => (
                      <li key={i}>• {imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {!isAnalyzing && !result && (
        <Card className="p-12 text-center text-gray-500">
          <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>输入视频信息开始预测</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isAnalyzing && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">AI分析中...</p>
        </div>
      )}
    </div>
  );
}
