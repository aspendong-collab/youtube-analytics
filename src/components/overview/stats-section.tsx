import React, { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { MetricCard } from './metric-card';
import type { DateRange } from 'react-day-picker';

export interface StatsSectionProps {
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
  onDateRangeChange: (range: DateRange | undefined) => void;
  dateRange: DateRange | undefined;
}

// 统计子版块组件
export const StatsSection = React.memo<StatsSectionProps>(({
  title,
  description,
  defaultData,
  customData,
  isLoadingCustom,
  showCustom,
  onToggleCustom,
  onDateRangeChange,
  dateRange,
}) => {
  const formatValue = useCallback((num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }, []);

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
});

StatsSection.displayName = 'StatsSection';
