import React, { useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { MetricCard } from './metric-card';
import type { DateRange } from 'react-day-picker';

export interface CostSectionProps {
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
  onDateRangeChange: (range: DateRange | undefined) => void;
  dateRange: DateRange | undefined;
}

// 成本分析子版块组件
export const CostSection = React.memo<CostSectionProps>(({
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
});

CostSection.displayName = 'CostSection';
