'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PlayCircle, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RetentionData {
  videoId: string;
  title: string;
  duration: number;
  avgRetention: number;
  dropOffPoints: Array<{ time: number; percentage: number; reason: string }>;
  recommendations: string[];
}

export default function RetentionAnalysisPage() {
  const [selectedVideo, setSelectedVideo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [retentionData, setRetentionData] = useState<RetentionData | null>(null);

  // 模拟视频列表
  const videos = [
    { id: 'video1', title: 'React 教程 - 从零开始' },
    { id: 'video2', title: 'Python 数据分析实战' },
    { id: 'video3', title: '机器学习基础课程' },
    { id: 'video4', title: '前端开发面试题讲解' },
    { id: 'video5', title: 'Docker 容器化部署指南' },
  ];

  const handleAnalyze = async () => {
    if (!selectedVideo) {
      toast.error('请选择视频');
      return;
    }

    setIsLoading(true);

    try {
      // 模拟获取保留率数据
      const mockData: RetentionData = {
        videoId: selectedVideo,
        title: videos.find(v => v.id === selectedVideo)?.title || '',
        duration: 1200, // 20分钟
        avgRetention: 45.2,
        dropOffPoints: [
          { time: 0, percentage: 100, reason: '视频开始' },
          { time: 30, percentage: 85, reason: '开头过长，内容进入慢' },
          { time: 120, percentage: 72, reason: '第二段内容不够吸引人' },
          { time: 300, percentage: 55, reason: '讲解节奏变慢' },
          { time: 480, percentage: 38, reason: '进入广告/赞助环节' },
          { time: 720, percentage: 28, reason: '内容过于技术性' },
          { time: 900, percentage: 22, reason: '视频结尾部分' },
          { time: 1200, percentage: 20, reason: '视频结束' },
        ],
        recommendations: [
          '在前30秒添加精彩预告',
          '优化开篇节奏，更快进入主题',
          '在5分钟处增加互动环节',
          '将技术性内容拆分为更短的小节',
          '考虑添加进度提示和章节导航',
        ],
      };

      setRetentionData(mockData);
      toast.success('分析完成');
    } catch (error) {
      console.error('分析失败:', error);
      toast.error(error instanceof Error ? error.message : '分析失败');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}小时${remainingMins}分钟`;
    }
    return `${mins}分${secs}秒`;
  };

  const getRetentionColor = (percentage: number) => {
    if (percentage >= 70) return '#22c55e';
    if (percentage >= 40) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <PlayCircle className="w-8 h-8" />
          完播率分析
        </h1>
        <p className="text-gray-600">
          分析观众观看行为，优化内容结构和节奏
        </p>
      </div>

      {/* 选择视频 */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="video">选择视频</Label>
            <Select value={selectedVideo} onValueChange={setSelectedVideo}>
              <SelectTrigger id="video">
                <SelectValue placeholder="选择要分析的视频" />
              </SelectTrigger>
              <SelectContent>
                {videos.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? '分析中...' : '开始分析'}
          </Button>
        </div>
      </Card>

      {/* 分析结果 */}
      {retentionData && (
        <div className="space-y-6">
          {/* 概览 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">{retentionData.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">视频时长</div>
                <div className="text-2xl font-bold">
                  {formatDuration(retentionData.duration)}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">平均完播率</div>
                <div className={`text-2xl font-bold ${
                  retentionData.avgRetention >= 50 ? 'text-green-600' :
                  retentionData.avgRetention >= 30 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {retentionData.avgRetention.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">流失点数</div>
                <div className="text-2xl font-bold">
                  {retentionData.dropOffPoints.length}
                </div>
              </div>
            </div>
          </Card>

          {/* 保留率曲线图表 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              观众保留率曲线
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={retentionData.dropOffPoints}>
                  <defs>
                    <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={(value) => formatTime(value)}
                    label={{ value: '时间', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    label={{ value: '保留率 (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    labelFormatter={(value) => formatTime(value)}
                    formatter={(value: number, name: string) => `${value.toFixed(0)}%`}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRetention)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 流失点详情 */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              关键流失点
            </h3>
            <div className="space-y-4">
              {retentionData.dropOffPoints
                .filter(point => point.percentage < 50 && point.time > 0)
                .map((point, index) => (
                  <div
                    key={index}
                    className="p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{formatTime(point.time)}</Badge>
                        <span className="font-medium">流失率: {(100 - point.percentage).toFixed(0)}%</span>
                      </div>
                      <Badge className="bg-red-100 text-red-700">
                        需要优化
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{point.reason}</p>
                  </div>
                ))}
            </div>
          </Card>

          {/* 优化建议 */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              优化建议
            </h3>
            <ul className="space-y-2">
              {retentionData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && !retentionData && (
        <Card className="p-12 text-center text-gray-500">
          <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>选择视频开始分析完播率</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">分析中...</p>
        </div>
      )}
    </div>
  );
}
