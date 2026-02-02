import React from 'react';

export interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  prefix?: string;
  icon?: string;
  formatAsCurrency?: boolean;
}

// 指标卡片组件
export const MetricCard = React.memo<MetricCardProps>(({
  title,
  value,
  unit = '',
  prefix = '',
  icon = '',
  formatAsCurrency,
}) => {
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
});

MetricCard.displayName = 'MetricCard';
