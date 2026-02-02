'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useMultiStats } from '@/hooks/use-multi-stats';
import { useStats } from '@/hooks/use-stats';
import { MetricCard } from '@/components/overview/metric-card';
import { StatsSection } from '@/components/overview/stats-section';
import { CostSection } from '@/components/overview/cost-section';
import type { DateRange } from 'react-day-picker';

export default function OverviewPage() {
  const { data: multiStats, isLoading: isLoadingMulti } = useMultiStats();
  
  // 播放量统计自定义时间范围
  const [viewsDateRange, setViewsDateRange] = useState<DateRange | undefined>(undefined);
  const [showViewsCustom, setShowViewsCustom] = useState(false);
  const { data: customViewsStats, isLoading: isLoadingCustomViews } = useStats({
    startDate: viewsDateRange?.from?.toISOString(),
    endDate: viewsDateRange?.to?.toISOString(),
    enabled: showViewsCustom,
  });

  // 发布量统计自定义时间范围
  const [publishDateRange, setPublishDateRange] = useState<DateRange | undefined>(undefined);
  const [showPublishCustom, setShowPublishCustom] = useState(false);
  const { data: customPublishStats, isLoading: isLoadingCustomPublish } = useStats({
    startDate: publishDateRange?.from?.toISOString(),
    endDate: publishDateRange?.to?.toISOString(),
    enabled: showPublishCustom,
  });

  // 成本分析自定义时间范围
  const [costDateRange, setCostDateRange] = useState<DateRange | undefined>(undefined);
  const [showCostCustom, setShowCostCustom] = useState(false);
  const { data: customCostStats, isLoading: isLoadingCustomCost } = useStats({
    startDate: costDateRange?.from?.toISOString(),
    endDate: costDateRange?.to?.toISOString(),
    enabled: showCostCustom,
  });

  // 使用 useMemo 缓存数据处理，避免每次渲染重新计算
  const viewsData = useMemo(() => {
    const stats = multiStats || {};
    const today = stats.today || {};
    const thisWeek = stats.thisWeek || {};
    const total = stats.total || {};

    return {
      today: { label: '今日播放量', value: today.views || 0, unit: '次' },
      thisWeek: { label: '本周播放量', value: thisWeek.views || 0, unit: '次' },
      total: { label: '累计历史播放量', value: total.views || 0, unit: '次' },
    };
  }, [multiStats]);

  const publishData = useMemo(() => {
    const stats = multiStats || {};
    const today = stats.today || {};
    const thisWeek = stats.thisWeek || {};
    const total = stats.total || {};

    return {
      today: { label: '今日发布视频数', value: today.publishedVideos || 0, unit: '个' },
      thisWeek: { label: '本周发布视频数', value: thisWeek.publishedVideos || 0, unit: '个' },
      total: { label: '累计发布视频数', value: total.publishedVideos || 0, unit: '个' },
    };
  }, [multiStats]);

  const costData = useMemo(() => {
    const stats = multiStats || {};
    const today = stats.today || {};
    const thisWeek = stats.thisWeek || {};
    const total = stats.total || {};

    return {
      today: {
        cost: { label: '今日合作费用', value: today.cooperationCost || 0, unit: '元' },
        cpv: { label: '今日平均 CPV', value: today.averageCPV || 0, unit: '元/千次播放' },
      },
      thisWeek: {
        cost: { label: '本周合作费用', value: thisWeek.cooperationCost || 0, unit: '元' },
        cpv: { label: '本周平均 CPV', value: thisWeek.averageCPV || 0, unit: '元/千次播放' },
      },
      total: {
        cost: { label: '累计合作费用', value: total.cooperationCost || 0, unit: '元' },
        cpv: { label: '累计平均 CPV', value: total.averageCPV || 0, unit: '元/千次播放' },
      },
    };
  }, [multiStats]);

  const customViewsData = useMemo(() => showViewsCustom ? {
    label: '自定义期间播放量',
    value: customViewsStats?.periodTotalViews || 0,
    unit: '次',
  } : null, [showViewsCustom, customViewsStats]);

  const customPublishData = useMemo(() => showPublishCustom ? {
    label: '自定义期间发布视频数',
    value: customPublishStats?.periodPublishedVideos || 0,
    unit: '个',
  } : null, [showPublishCustom, customPublishStats]);

  const customCostData = useMemo(() => showCostCustom ? {
    cost: { label: '自定义期间合作费用', value: customCostStats?.periodCooperationCost || 0, unit: '元' },
    cpv: { label: '自定义期间平均 CPV', value: customCostStats?.periodAverageCPV || 0, unit: '元/千次播放' },
  } : null, [showCostCustom, customCostStats]);

  // 使用 useCallback 缓存状态切换函数
  const toggleViewsCustom = useCallback(() => setShowViewsCustom(prev => !prev), []);
  const togglePublishCustom = useCallback(() => setShowPublishCustom(prev => !prev), []);
  const toggleCostCustom = useCallback(() => setShowCostCustom(prev => !prev), []);

  if (isLoadingMulti) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          数据总览
        </h1>
        <p className="text-sm text-[#86868B]">
          查看所有监控视频的整体数据表现
        </p>
      </div>

      {/* 播放量统计子版块 */}
      <StatsSection
        title="📊 播放量统计"
        description="查看视频播放量数据"
        defaultData={viewsData}
        customData={customViewsData}
        isLoadingCustom={isLoadingCustomViews}
        showCustom={showViewsCustom}
        onToggleCustom={toggleViewsCustom}
        onDateRangeChange={setViewsDateRange}
        dateRange={viewsDateRange}
      />

      {/* 发布量统计子版块 */}
      <StatsSection
        title="📹 发布量统计"
        description="查看视频发布数据"
        defaultData={publishData}
        customData={customPublishData}
        isLoadingCustom={isLoadingCustomPublish}
        showCustom={showPublishCustom}
        onToggleCustom={togglePublishCustom}
        onDateRangeChange={setPublishDateRange}
        dateRange={publishDateRange}
      />

      {/* 成本分析子版块 */}
      <CostSection
        title="💰 成本分析"
        description="查看视频合作费用和 CPV 数据"
        defaultData={costData}
        customData={customCostData}
        isLoadingCustom={isLoadingCustomCost}
        showCustom={showCostCustom}
        onToggleCustom={toggleCostCustom}
        onDateRangeChange={setCostDateRange}
        dateRange={costDateRange}
      />

      {/* 其他指标 */}
      <div>
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          🎯 其他指标
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="总视频数"
            value={multiStats?.other?.totalVideos || 0}
            unit="个"
            icon="📋"
          />
          <MetricCard
            title="总频道数"
            value={multiStats?.other?.totalChannels || 0}
            unit="个"
            icon="📺"
          />
          <MetricCard
            title="总负责人数"
            value={multiStats?.other?.totalOwners || 0}
            unit="人"
            icon="👥"
          />
        </div>
      </div>
    </div>
  );
}
