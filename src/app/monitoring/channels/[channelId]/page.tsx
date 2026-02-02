'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendChart } from '@/components/charts/trend-chart';
import { Heatmap } from '@/components/charts/heatmap';

export default function ChannelDetailPage() {
  const params = useParams();
  const channelId = params.channelId as string;
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChannelData();
  }, [channelId]);

  const loadChannelData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/channels/${channelId}`);
      if (!response.ok) {
        throw new Error('获取博主详情失败');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/monitoring/channels" className="text-[#007AFF] hover:underline">
            ← 返回博主列表
          </Link>
        </div>
        <Card className="p-12 text-center">
          <div className="text-[#86868B]">{error || '数据加载失败'}</div>
        </Card>
      </div>
    );
  }

  const { channel, trends, heatmap, topVideos } = data;

  return (
    <div className="p-8 space-y-8">
      {/* 页面标题 */}
      <div>
        <div className="mb-2">
          <Link href="/monitoring/channels" className="text-[#007AFF] hover:underline text-sm">
            ← 返回博主列表
          </Link>
        </div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          {channel.name}
        </h1>
        <p className="text-sm text-[#86868B]">
          博主详情分析
        </p>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <div className="text-sm text-[#86868B] mb-2">总视频数</div>
          <div className="text-2xl font-bold text-[#1D1D1F]">{channel.videoCount}</div>
          <div className="text-xs text-[#86868B] mt-1">个视频</div>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <div className="text-sm text-[#86868B] mb-2">总播放量</div>
          <div className="text-2xl font-bold text-[#007AFF]">{formatNumber(channel.totalViews)}</div>
          <div className="text-xs text-[#86868B] mt-1">累计播放</div>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <div className="text-sm text-[#86868B] mb-2">平均播放量</div>
          <div className="text-2xl font-bold text-[#007AFF]">{formatNumber(channel.avgViews)}</div>
          <div className="text-xs text-[#86868B] mt-1">每个视频平均</div>
        </Card>
        <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
          <div className="text-sm text-[#86868B] mb-2">平均互动率</div>
          <div className="text-2xl font-bold text-[#007AFF]">{channel.avgEngagement}%</div>
          <div className="text-xs text-[#86868B] mt-1">内容质量指标</div>
        </Card>
      </div>

      {/* 成本效益分析 */}
      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">💰 成本效益分析</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-[#86868B] mb-2">总合作费用</div>
            <div className="text-3xl font-bold text-[#1D1D1F]">
              ${channel.totalCost.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-sm text-[#86868B] mb-2">平均 CPV</div>
            <div className="text-3xl font-bold text-[#007AFF]">
              ${channel.avgCPV.toFixed(4)}
            </div>
            <div className="text-xs text-[#86868B] mt-1">单次播放成本</div>
          </div>
        </div>
      </Card>

      {/* 流量表现 - 播放量趋势 */}
      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">📊 播放量趋势</h2>
        <TrendChart
          data={trends.views}
          metrics={[{
            key: 'views',
            name: '播放量',
            color: '#007AFF',
          }]}
          height={300}
        />
      </Card>

      {/* 互动质量 - 互动率趋势 */}
      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">💬 互动率趋势</h2>
        <TrendChart
          data={trends.engagement}
          metrics={[{
            key: 'engagement',
            name: '互动率 (%)',
            color: '#34C759',
          }]}
          height={300}
          formatValue={(value) => `${value.toFixed(1)}%`}
        />
      </Card>

      {/* 发布策略 - 发布时间热力图 */}
      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">⏰ 发布时间分布</h2>
        <div className="flex justify-center">
          <Heatmap
            data={heatmap}
            valueLabel="视频数"
            cellSize={32}
          />
        </div>
      </Card>

      {/* TOP 10 视频 */}
      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">🏆 TOP 10 视频</h2>
        <div className="space-y-3">
          {topVideos.map((video: any, index: number) => (
            <div
              key={video.id}
              className="flex items-center gap-4 p-4 bg-[#F5F5F7] rounded-lg"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-800' :
                index === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-gray-50 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#1D1D1F] truncate">
                  {video.title}
                </div>
                <div className="text-xs text-[#86868B]">
                  发布于 {formatDate(video.publishDate)}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-semibold text-[#1D1D1F]">
                  {formatNumber(video.views)}
                </div>
                <div className="text-xs text-[#86868B]">播放量</div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-semibold text-[#007AFF]">
                  {video.engagement.toFixed(1)}%
                </div>
                <div className="text-xs text-[#86868B]">互动率</div>
              </div>
              {video.cost > 0 && (
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-semibold text-[#1D1D1F]">
                    ${video.cost.toFixed(2)}
                  </div>
                  <div className="text-xs text-[#86868B]">费用</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
