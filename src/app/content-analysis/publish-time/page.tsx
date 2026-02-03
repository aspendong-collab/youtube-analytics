'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VideoSelector } from '@/components/video-selector';
import { useAnalysis } from '@/contexts/analysis-context';
import { toast } from 'sonner';
import { Clock, TrendingUp, Calendar, Sun, Moon } from 'lucide-react';

interface TimeSlot {
  dayName: string;
  hour: number;
  avgViews: number;
  videoCount: number;
  aboveAvg: string;
}

interface HeatmapSlot {
  day: number;
  hour: number;
  value: number;
}

interface PublishTimeResult {
  topTimes: TimeSlot[];
  heatmap: HeatmapSlot[];
  averageViews: number;
  recommendations: string[];
  summary: {
    totalAnalyzed: number;
    uniqueTimeSlots: number;
    bestTimeSlot: string;
    worstTimeSlot: string;
  };
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function PublishTimePage() {
  const { selectedVideo, setSelectedVideo } = useAnalysis();
  const [result, setResult] = useState<PublishTimeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/suggestions/publish-time');

      if (!response.ok) {
        throw new Error('分析失败');
      }

      const data = await response.json();
      setResult(data);

      toast.success('分析完成', {
        description: '已找到最佳发布时段',
      });
    } catch (error) {
      console.error('分析失败:', error);
      toast.error('分析失败', {
        description: '无法完成发布时机分析',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isTopTime = (day: number, hour: number) => {
    return result?.topTimes.some(t => {
      const dayIndex = WEEKDAYS.indexOf(t.dayName);
      return dayIndex === day && t.hour === hour;
    });
  };

  const getTimeSlotValue = (day: number, hour: number) => {
    return result?.heatmap.find(h => h.day === day && h.hour === hour)?.value || 0;
  };

  const getHeatmapColor = (value: number, maxValue: number) => {
    const intensity = maxValue > 0 ? value / maxValue : 0;
    if (intensity > 0.8) return 'bg-red-500';
    if (intensity > 0.6) return 'bg-orange-500';
    if (intensity > 0.4) return 'bg-yellow-400';
    if (intensity > 0.2) return 'bg-yellow-200';
    return 'bg-gray-100';
  };

  const bestTimeSlot = result?.summary.bestTimeSlot || '';
  const bestDay = bestTimeSlot.split(' ')[0] || '';
  const bestHourStr = bestTimeSlot.split(' ')[1] || '';
  const bestHour = parseInt(bestHourStr) || 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F]">发布时机优化</h1>
        <p className="text-sm text-[#86868B] mt-1">分析最佳发布时间，提升视频曝光</p>
      </div>

      <VideoSelector
        selectedVideoId={selectedVideo?.id || null}
        onVideoSelect={setSelectedVideo}
      />

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="bg-[#007AFF] hover:bg-[#0066CC]"
        >
          {isLoading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-pulse" />
              分析中...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              开始分析
            </>
          )}
        </Button>
      </div>

      {/* 分析结果 */}
      {!result && !isLoading ? (
        <Card className="p-12 bg-white border-[rgba(0,0,0,0.08)]">
          <div className="text-center text-[#86868B]">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">准备好开始分析</p>
            <p className="text-sm">点击"开始分析"按钮发现最佳发布时机</p>
          </div>
        </Card>
      ) : result ? (
        <div className="space-y-6">
          {/* TOP 5 黄金时段 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[#007AFF]" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">TOP 5 黄金时段</h3>
            </div>

            <div className="space-y-3">
              {result.topTimes.map((time, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border border-[rgba(0,0,0,0.08)] rounded-lg hover:border-[#007AFF]/30 transition-all"
                >
                  <Badge
                    variant={index === 0 ? 'default' : 'outline'}
                    className={index === 0 ? 'bg-[#007AFF]' : ''}
                  >
                    #{index + 1}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[#1D1D1F]">
                        {time.dayName} {time.hour}:00
                      </span>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-yellow-700 bg-yellow-100">
                          🏆 最优
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#86868B]">
                      <span>平均播放: {time.avgViews.toLocaleString()}</span>
                      <span>•</span>
                      <span>视频数量: {time.videoCount}</span>
                      {time.aboveAvg !== 'NaN%' && (
                        <>
                          <span>•</span>
                          <span>高于均值: {time.aboveAvg}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 最佳发布时间总结 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">最佳发布时间总结</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-[#86868B] mb-1">最佳发布日</p>
                <p className="text-lg font-semibold text-[#1D1D1F]">
                  {bestDay}
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-[#86868B] mb-1">最佳发布时间</p>
                <p className="text-lg font-semibold text-[#1D1D1F]">
                  {bestHourStr}
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-[#86868B] mb-1">平均播放量</p>
                <p className="text-lg font-semibold text-[#1D1D1F]">
                  {result.averageViews.toLocaleString()}
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-[#86868B] mb-1">分析视频数</p>
                <p className="text-lg font-semibold text-[#1D1D1F]">
                  {result.summary.totalAnalyzed}
                </p>
              </div>
            </div>
          </Card>

          {/* 发布时段热力图 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">发布时段热力图</h3>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* 表头 */}
                <div className="grid grid-cols-25 gap-1 mb-2">
                  <div className="text-xs text-[#86868B] text-center font-medium p-2">
                    时间 \ 日期
                  </div>
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="text-xs text-[#86868B] text-center font-medium p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* 热力图网格 */}
                {Array.from({ length: 24 }).map((_, hour) => (
                  <div key={hour} className="grid grid-cols-25 gap-1 mb-1">
                    <div className="text-xs text-[#86868B] text-center p-2 flex items-center justify-center">
                      {hour}:00
                    </div>
                    {WEEKDAYS.map((_, dayIndex) => {
                      const value = getTimeSlotValue(dayIndex, hour);
                      const maxValue = Math.max(...result.heatmap.map(h => h.value), 1);
                      const isTop = isTopTime(dayIndex, hour);
                      return (
                        <div
                          key={dayIndex}
                          className={`
                            text-xs text-center p-2 rounded cursor-pointer
                            ${getHeatmapColor(value, maxValue)}
                            ${isTop ? 'ring-2 ring-[#007AFF] ring-offset-2' : ''}
                            hover:opacity-80 transition-opacity
                          `}
                          title={`${WEEKDAYS[dayIndex]} ${hour}:00: 播放量 ${value.toLocaleString()}`}
                        >
                          {value > 0 ? (value / 1000).toFixed(0) + 'k' : '-'}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[#86868B]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 rounded" />
                <span>低</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 rounded" />
                <span>较低</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-400 rounded" />
                <span>中等</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded" />
                <span>较高</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>高</span>
              </div>
            </div>
          </Card>

          {/* 优化建议 */}
          <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-[#1D1D1F]">发布时机优化建议</h3>
            </div>

            <div className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="text-green-600 mt-0.5">⏰</div>
                  <p className="text-sm text-[#1D1D1F]">{recommendation}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
