'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useStats } from '@/hooks/use-stats';
import { subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

export default function OverviewPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  const { data: stats, isLoading, error } = useStats({
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num: number): string => {
    return '¥' + formatNumber(num);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          数据总览
        </h1>
        <p className="text-sm text-[#86868B]">
          查看所有监控视频的整体数据表现
        </p>
      </div>

      {/* 时间范围选择器 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[#1D1D1F]">时间范围：</span>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            presets={['today', 'thisWeek', 'thisMonth', 'last7Days', 'last30Days']}
          />
          {stats?.timeRange.days && stats.timeRange.days > 0 && (
            <div className="text-sm text-[#86868B]">
              共 {stats.timeRange.days} 天
            </div>
          )}
        </div>
      </div>

      {/* 期间指标 */}
      <div>
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          📊 期间指标
          {dateRange.from && dateRange.to && (
            <span className="text-sm font-normal text-[#86868B] ml-2">
              ({dateRange.from.toLocaleDateString()} 至 {dateRange.to.toLocaleDateString()})
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="期间发布"
            value={stats?.periodPublishedVideos || 0}
            unit="个视频"
            icon="📹"
          />
          <MetricCard
            title="期间播放量"
            value={stats?.periodTotalViews || 0}
            unit="次"
            icon="👀"
          />
          <MetricCard
            title="期间合作费用"
            value={stats?.periodCooperationCost || 0}
            unit="元"
            prefix="¥"
            icon="💰"
          />
          <MetricCard
            title="期间平均 CPV"
            value={stats?.periodAverageCPV || 0}
            unit="元/千次播放"
            prefix="¥"
            formatAsCurrency
            icon="📊"
          />
        </div>
      </div>

      {/* 全局累计指标 */}
      <div>
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          📈 全局累计指标
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="累计发布视频"
            value={stats?.totalPublishedVideos || 0}
            unit="个"
            icon="📹"
          />
          <MetricCard
            title="累计历史播放"
            value={stats?.totalHistoricalViews || 0}
            unit="次"
            icon="👀"
          />
          <MetricCard
            title="累计合作费用"
            value={stats?.totalCooperationCost || 0}
            unit="元"
            prefix="¥"
            icon="💰"
          />
          <MetricCard
            title="全局平均 CPV"
            value={stats?.overallAverageCPV || 0}
            unit="元/千次播放"
            prefix="¥"
            formatAsCurrency
            icon="📊"
          />
        </div>
      </div>

      {/* 其他全局指标 */}
      <div>
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          🎯 其他指标
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="总视频数"
            value={stats?.totalVideos || 0}
            unit="个"
            icon="📋"
          />
          <MetricCard
            title="总频道数"
            value={stats?.totalChannels || 0}
            unit="个"
            icon="📺"
          />
          <MetricCard
            title="总负责人数"
            value={stats?.totalOwners || 0}
            unit="人"
            icon="👥"
          />
        </div>
      </div>

      {/* 快速入口 */}
      <div className="bg-[#F5F5F7] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          快速入口
        </h2>
        <div className="flex flex-wrap gap-4">
          <QuickAction
            title="添加视频"
            description="手动添加需要监控的视频"
            icon="➕"
            href="/videos/add"
          />
          <QuickAction
            title="视频列表"
            description="查看所有监控视频"
            icon="📹"
            href="/videos"
          />
          <QuickAction
            title="负责人管理"
            description="管理视频负责人信息"
            icon="👥"
            href="/owners"
          />
        </div>
      </div>
    </div>
  );
}

// 指标卡片组件
function MetricCard({
  title,
  value,
  unit = '',
  prefix = '',
  icon = '',
  formatAsCurrency = false,
}: {
  title: string;
  value: number;
  unit?: string;
  prefix?: string;
  icon?: string;
  formatAsCurrency?: boolean;
}) {
  const formatValue = (num: number): string => {
    if (formatAsCurrency) {
      return prefix + num.toFixed(4);
    }
    if (num >= 1000000) return prefix + (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return prefix + (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return prefix + (num / 1000).toFixed(1) + 'K';
    return prefix + num.toString();
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      {icon && (
        <div className="text-2xl mb-2">{icon}</div>
      )}
      <div className="text-sm text-[#86868B] mb-2">{title}</div>
      <div className="text-2xl font-semibold text-[#1D1D1F]">
        {formatValue(value)}
        {unit && !formatAsCurrency && (
          <span className="text-sm font-normal text-[#86868B] ml-1">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// 快速操作组件
function QuickAction({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex-1 min-w-[200px] bg-white rounded-xl p-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer border"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-[#1D1D1F] mb-1">{title}</div>
      <div className="text-sm text-[#86868B]">{description}</div>
    </a>
  );
}
