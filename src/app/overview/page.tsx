'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useMultiStats } from '@/hooks/use-multi-stats';
import { useStats } from '@/hooks/use-stats';
import { subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

export default function OverviewPage() {
  const { data: multiStats, isLoading: isLoadingMulti } = useMultiStats();
  
  // 播放量统计自定义时间范围
  const [viewsDateRange, setViewsDateRange] = useState<DateRange | null>(null);
  const [showViewsCustom, setShowViewsCustom] = useState(false);
  const { data: customViewsStats, isLoading: isLoadingCustomViews } = useStats({
    startDate: viewsDateRange?.from?.toISOString(),
    endDate: viewsDateRange?.to?.toISOString(),
    enabled: showViewsCustom,
  });

  // 发布量统计自定义时间范围
  const [publishDateRange, setPublishDateRange] = useState<DateRange | null>(null);
  const [showPublishCustom, setShowPublishCustom] = useState(false);
  const { data: customPublishStats, isLoading: isLoadingCustomPublish } = useStats({
    startDate: publishDateRange?.from?.toISOString(),
    endDate: publishDateRange?.to?.toISOString(),
    enabled: showPublishCustom,
  });

  // 成本分析自定义时间范围
  const [costDateRange, setCostDateRange] = useState<DateRange | null>(null);
  const [showCostCustom, setShowCostCustom] = useState(false);
  const { data: customCostStats, isLoading: isLoadingCustomCost } = useStats({
    startDate: costDateRange?.from?.toISOString(),
    endDate: costDateRange?.to?.toISOString(),
    enabled: showCostCustom,
  });

  if (isLoadingMulti) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (num: number): string => {
    return '¥' + num.toFixed(2);
  };

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
        defaultData={{
          today: { label: '今日播放量', value: multiStats?.today.views || 0, unit: '次' },
          thisWeek: { label: '本周播放量', value: multiStats?.thisWeek.views || 0, unit: '次' },
          total: { label: '累计历史播放量', value: multiStats?.total.views || 0, unit: '次' },
        }}
        customData={showViewsCustom ? {
          label: '自定义期间播放量',
          value: customViewsStats?.periodTotalViews || 0,
          unit: '次',
        } : null}
        isLoadingCustom={isLoadingCustomViews}
        showCustom={showViewsCustom}
        onToggleCustom={() => setShowViewsCustom(!showViewsCustom)}
        onDateRangeChange={setViewsDateRange}
        dateRange={viewsDateRange}
      />

      {/* 发布量统计子版块 */}
      <StatsSection
        title="📹 发布量统计"
        description="查看视频发布数据"
        defaultData={{
          today: { label: '今日发布视频数', value: multiStats?.today.publishedVideos || 0, unit: '个' },
          thisWeek: { label: '本周发布视频数', value: multiStats?.thisWeek.publishedVideos || 0, unit: '个' },
          total: { label: '累计发布视频数', value: multiStats?.total.publishedVideos || 0, unit: '个' },
        }}
        customData={showPublishCustom ? {
          label: '自定义期间发布视频数',
          value: customPublishStats?.periodPublishedVideos || 0,
          unit: '个',
        } : null}
        isLoadingCustom={isLoadingCustomPublish}
        showCustom={showPublishCustom}
        onToggleCustom={() => setShowPublishCustom(!showPublishCustom)}
        onDateRangeChange={setPublishDateRange}
        dateRange={publishDateRange}
      />

      {/* 成本分析子版块 */}
      <CostSection
        title="💰 成本分析"
        description="查看视频合作费用和 CPV 数据"
        defaultData={{
          today: {
            cost: { label: '今日合作费用', value: multiStats?.today.cooperationCost || 0, unit: '元' },
            cpv: { label: '今日平均 CPV', value: multiStats?.today.averageCPV || 0, unit: '元/千次播放' },
          },
          thisWeek: {
            cost: { label: '本周合作费用', value: multiStats?.thisWeek.cooperationCost || 0, unit: '元' },
            cpv: { label: '本周平均 CPV', value: multiStats?.thisWeek.averageCPV || 0, unit: '元/千次播放' },
          },
          total: {
            cost: { label: '累计合作费用', value: multiStats?.total.cooperationCost || 0, unit: '元' },
            cpv: { label: '累计平均 CPV', value: multiStats?.total.averageCPV || 0, unit: '元/千次播放' },
          },
        }}
        customData={showCostCustom ? {
          cost: { label: '自定义期间合作费用', value: customCostStats?.periodCooperationCost || 0, unit: '元' },
          cpv: { label: '自定义期间平均 CPV', value: customCostStats?.periodAverageCPV || 0, unit: '元/千次播放' },
        } : null}
        isLoadingCustom={isLoadingCustomCost}
        showCustom={showCostCustom}
        onToggleCustom={() => setShowCostCustom(!showCostCustom)}
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
            value={multiStats?.other.totalVideos || 0}
            unit="个"
            icon="📋"
          />
          <MetricCard
            title="总频道数"
            value={multiStats?.other.totalChannels || 0}
            unit="个"
            icon="📺"
          />
          <MetricCard
            title="总负责人数"
            value={multiStats?.other.totalOwners || 0}
            unit="人"
            icon="👥"
          />
        </div>
      </div>
    </div>
  );
}

// 统计子版块组件
function StatsSection({
  title,
  description,
  defaultData,
  customData,
  isLoadingCustom,
  showCustom,
  onToggleCustom,
  onDateRangeChange,
  dateRange,
}: {
  title: string;
  description: string;
  defaultData: {
    today: { label: string; value: number; unit: string };
    thisWeek: { label: string; value: number; unit: string };
    total: { label: string; value: number; unit: string };
  };
  customData: { label: string; value: number; unit: string } | null;
  isLoadingCustom: boolean;
  showCustom: boolean;
  onToggleCustom: () => void;
  onDateRangeChange: (range: DateRange | null) => void;
  dateRange: DateRange | null;
}) {
  const formatValue = (value: number): string => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 10000) return (value / 10000).toFixed(1) + 'W';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  };

  return (
    <Card className="p-6 bg-white shadow-sm border">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-1">{title}</h2>
        <p className="text-sm text-[#86868B]">{description}</p>
      </div>

      {showCustom && customData ? (
        // 自定义时间范围视图
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCustom}
            >
              ← 返回默认视图
            </Button>
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              presets={['today', 'thisWeek', 'thisMonth', 'last7Days', 'last30Days']}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title={customData.label}
              value={customData.value}
              unit={customData.unit}
            />
          </div>
        </div>
      ) : (
        // 默认视图（今日、本周、累计）
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title={defaultData.today.label}
              value={defaultData.today.value}
              unit={defaultData.today.unit}
            />
            <MetricCard
              title={defaultData.thisWeek.label}
              value={defaultData.thisWeek.value}
              unit={defaultData.thisWeek.unit}
            />
            <MetricCard
              title={defaultData.total.label}
              value={defaultData.total.value}
              unit={defaultData.total.unit}
            />
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCustom}
            >
              查看自定义时间范围 →
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

// 成本分析子版块组件
function CostSection({
  title,
  description,
  defaultData,
  customData,
  isLoadingCustom,
  showCustom,
  onToggleCustom,
  onDateRangeChange,
  dateRange,
}: {
  title: string;
  description: string;
  defaultData: {
    today: {
      cost: { label: string; value: number; unit: string };
      cpv: { label: string; value: number; unit: string };
    };
    thisWeek: {
      cost: { label: string; value: number; unit: string };
      cpv: { label: string; value: number; unit: string };
    };
    total: {
      cost: { label: string; value: number; unit: string };
      cpv: { label: string; value: number; unit: string };
    };
  };
  customData: {
    cost: { label: string; value: number; unit: string };
    cpv: { label: string; value: number; unit: string };
  } | null;
  isLoadingCustom: boolean;
  showCustom: boolean;
  onToggleCustom: () => void;
  onDateRangeChange: (range: DateRange | null) => void;
  dateRange: DateRange | null;
}) {
  const formatCurrency = (num: number): string => {
    return '$' + num.toFixed(2);
  };

  const formatCPV = (num: number): string => {
    return '$' + num.toFixed(4);
  };

  return (
    <Card className="p-6 bg-white shadow-sm border">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-1">{title}</h2>
        <p className="text-sm text-[#86868B]">{description}</p>
      </div>

      {showCustom && customData ? (
        // 自定义时间范围视图
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCustom}
            >
              ← 返回默认视图
            </Button>
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
              presets={['today', 'thisWeek', 'thisMonth', 'last7Days', 'last30Days']}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              title={customData.cost.label}
              value={customData.cost.value}
              unit={customData.cost.unit}
              prefix="$"
            />
            <MetricCard
              title={customData.cpv.label}
              value={customData.cpv.value}
              unit={customData.cpv.unit}
              prefix="$"
              formatAsCurrency
            />
          </div>
        </div>
      ) : (
        // 默认视图（今日、本周、累计）
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 今日 */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-[#1D1D1F] mb-2">今日</div>
              <MetricCard
                title={defaultData.today.cost.label}
                value={defaultData.today.cost.value}
                unit={defaultData.today.cost.unit}
                prefix="$"
              />
              <MetricCard
                title={defaultData.today.cpv.label}
                value={defaultData.today.cpv.value}
                unit={defaultData.today.cpv.unit}
                prefix="$"
                formatAsCurrency
              />
            </div>
            {/* 本周 */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-[#1D1D1F] mb-2">本周</div>
              <MetricCard
                title={defaultData.thisWeek.cost.label}
                value={defaultData.thisWeek.cost.value}
                unit={defaultData.thisWeek.cost.unit}
                prefix="$"
              />
              <MetricCard
                title={defaultData.thisWeek.cpv.label}
                value={defaultData.thisWeek.cpv.value}
                unit={defaultData.thisWeek.cpv.unit}
                prefix="$"
                formatAsCurrency
              />
            </div>
            {/* 累计 */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-[#1D1D1F] mb-2">累计</div>
              <MetricCard
                title={defaultData.total.cost.label}
                value={defaultData.total.cost.value}
                unit={defaultData.total.cost.unit}
                prefix="$"
              />
              <MetricCard
                title={defaultData.total.cpv.label}
                value={defaultData.total.cpv.value}
                unit={defaultData.total.cpv.unit}
                prefix="$"
                formatAsCurrency
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCustom}
            >
              查看自定义时间范围 →
            </Button>
          </div>
        </>
      )}
    </Card>
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
    <div className="bg-[#F5F5F7] rounded-xl p-4">
      {icon && (
        <div className="text-xl mb-2">{icon}</div>
      )}
      <div className="text-sm text-[#86868B] mb-1">{title}</div>
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
