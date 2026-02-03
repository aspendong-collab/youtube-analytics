'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoSelector } from '@/components/video-selector';
import { useAnalysis } from '@/contexts/analysis-context';
import { toast } from 'sonner';
import { TrendingUp, Eye, Clock, Heart, MessageCircle, ThumbsUp, BarChart3 } from 'lucide-react';

interface VideoPerformance {
  id: string;
  title: string;
  thumbnail: string | null;
  views: number;
  likes: number;
  comments: number;
  averageViewDuration: number;
  ctr: number;
  retentionRate: number;
  engagementRate: number;
  healthScore: number;
  publishDate: string | null;
}

export default function ContentPerformancePage() {
  const { selectedVideo, setSelectedVideo, isAnalyzing, setIsAnalyzing } = useAnalysis();
  const [performance, setPerformance] = useState<VideoPerformance | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedVideo) {
      loadPerformanceData();
    } else {
      setPerformance(null);
    }
  }, [selectedVideo]);

  const loadPerformanceData = async () => {
    if (!selectedVideo) return;

    setLoading(true);
    setIsAnalyzing(true);

    try {
      // 获取视频统计数据
      const response = await fetch(`/api/stats?videoId=${selectedVideo.videoId}`);

      if (!response.ok) {
        throw new Error('加载性能数据失败');
      }

      const data = await response.json();

      // 计算各项指标
      const totalViews = data.viewCount || 0;
      const totalLikes = data.likeCount || 0;
      const totalComments = data.commentCount || 0;

      const engagementRate = totalViews > 0
        ? ((totalLikes + totalComments) / totalViews) * 100
        : 0;

      const healthScore = Math.min(100, Math.max(0, engagementRate * 10));

      setPerformance({
        id: selectedVideo.id,
        title: selectedVideo.title,
        thumbnail: selectedVideo.thumbnail,
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        averageViewDuration: Math.floor(totalViews * 0.4), // 模拟平均观看时长
        ctr: 6.5 + Math.random() * 3, // 模拟点击率
        retentionRate: 45 + Math.random() * 20, // 模拟留存率
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        healthScore: Math.floor(healthScore),
        publishDate: selectedVideo.publishDate,
      });
    } catch (error) {
      console.error('加载性能数据失败:', error);
      toast.error('加载失败', {
        description: '无法加载视频性能数据',
      });
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">内容表现分析</h1>
        <p className="text-sm text-[#86868B] mt-1">分析视频的表现数据和健康度</p>
      </div>

      {/* 视频选择器 */}
      <VideoSelector
        selectedVideoId={selectedVideo?.id || null}
        onVideoSelect={setSelectedVideo}
      />

      {/* 性能数据展示 */}
      {!selectedVideo ? (
        <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
          <div className="text-center text-[#86868B]">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">请选择要分析的视频</p>
            <p className="text-sm">选择视频后将显示详细的表现数据</p>
          </div>
        </Card>
      ) : loading ? (
        <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
          <div className="text-center text-[#86868B]">
            <div className="w-16 h-16 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg mb-2">正在分析视频表现...</p>
            <p className="text-sm">请稍候</p>
          </div>
        </Card>
      ) : performance ? (
        <div className="space-y-6">
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5 text-[#007AFF]" />
                <span className="text-sm text-[#86868B]">总观看次数</span>
              </div>
              <p className="text-2xl font-semibold text-[#1D1D1F]">
                {performance.views.toLocaleString()}
              </p>
            </Card>

            <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 mb-2">
                <ThumbsUp className="w-5 h-5 text-red-500" />
                <span className="text-sm text-[#86868B]">点赞数</span>
              </div>
              <p className="text-2xl font-semibold text-[#1D1D1F]">
                {performance.likes.toLocaleString()}
              </p>
            </Card>

            <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-[#86868B]">评论数</span>
              </div>
              <p className="text-2xl font-semibold text-[#1D1D1F]">
                {performance.comments.toLocaleString()}
              </p>
            </Card>

            <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <span className="text-sm text-[#86868B]">互动率</span>
              </div>
              <p className="text-2xl font-semibold text-[#1D1D1F]">
                {performance.engagementRate.toFixed(2)}%
              </p>
            </Card>
          </div>

          {/* 详细指标 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-6">详细指标</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 健康度分数 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#86868B]">视频健康度</span>
                  <Badge
                    variant="outline"
                    className={getHealthScoreColor(performance.healthScore)}
                  >
                    {performance.healthScore}分
                  </Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      performance.healthScore >= 80
                        ? 'bg-green-500'
                        : performance.healthScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${performance.healthScore}%` }}
                  />
                </div>
              </div>

              {/* 点击率 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#86868B]">点击率 (CTR)</span>
                  <span className="text-sm font-semibold text-[#1D1D1F]">
                    {performance.ctr.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#007AFF] h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(performance.ctr * 5, 100)}%` }}
                  />
                </div>
              </div>

              {/* 留存率 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#86868B]">留存率</span>
                  <span className="text-sm font-semibold text-[#1D1D1F]">
                    {performance.retentionRate.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${performance.retentionRate}%` }}
                  />
                </div>
              </div>

              {/* 平均观看时长 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Clock className="w-4 h-4 text-[#86868B]" />
                  <span className="text-sm text-[#86868B]">平均观看时长</span>
                  <span className="text-sm font-semibold text-[#1D1D1F]">
                    {Math.floor(performance.averageViewDuration / 60)}分
                    {(performance.averageViewDuration % 60).toFixed(0)}秒
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* 分析建议 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#007AFF]" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">优化建议</h3>
            </div>

            <div className="space-y-3">
              {performance.engagementRate < 3 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-600 mt-0.5">💡</div>
                  <div>
                    <p className="font-medium text-[#1D1D1F]">提高互动率</p>
                    <p className="text-sm text-[#86868B]">
                      当前互动率偏低，建议在视频中添加更多互动元素，如提问、投票等。
                    </p>
                  </div>
                </div>
              )}

              {performance.ctr < 5 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-blue-600 mt-0.5">📝</div>
                  <div>
                    <p className="font-medium text-[#1D1D1F]">优化标题和封面</p>
                    <p className="text-sm text-[#86868B]">
                      点击率较低，建议使用更具吸引力的标题和封面图片。
                    </p>
                  </div>
                </div>
              )}

              {performance.retentionRate < 50 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-green-600 mt-0.5">⏱️</div>
                  <div>
                    <p className="font-medium text-[#1D1D1F]">提升内容吸引力</p>
                    <p className="text-sm text-[#86868B]">
                      留存率较低，建议优化视频开头的钩子，快速吸引观众注意力。
                    </p>
                  </div>
                </div>
              )}

              {performance.healthScore >= 80 && (
                <div className="flex items-start gap-3 p-3 bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-lg">
                  <div className="text-[#007AFF] mt-0.5">🎉</div>
                  <div>
                    <p className="font-medium text-[#1D1D1F]">表现优秀！</p>
                    <p className="text-sm text-[#86868B]">
                      您的视频健康度很高，继续保持当前的内容策略。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
