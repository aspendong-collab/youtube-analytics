'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface TrendDataPoint {
  date: string;
  [key: string]: number | string;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  metrics: {
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  formatValue?: (value: number) => string;
  formatTooltip?: (value: number, name: string) => string;
}

export const TrendChart = React.memo<TrendChartProps>(({
  data,
  metrics,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  formatValue,
  formatTooltip,
}) => {
  // 格式化数值
  const defaultFormatValue = (value: number): string => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 10000) return (value / 10000).toFixed(1) + 'W';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  };

  const currentFormatValue = formatValue || defaultFormatValue;

  // 格式化日期
  const formatXAxisLabel = (label: any): string => {
    try {
      const date = new Date(label);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } catch {
      return String(label);
    }
  };

  // 格式化Tooltip
  const defaultFormatTooltip = (value: number, name: string): string => {
    return `${name}: ${currentFormatValue(value)}`;
  };

  const currentFormatTooltip = formatTooltip || defaultFormatTooltip as any;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" />
        )}
        <XAxis
          dataKey="date"
          tickFormatter={formatXAxisLabel}
          stroke="#86868B"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={currentFormatValue}
          stroke="#86868B"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        {showTooltip && (
          <Tooltip
            formatter={currentFormatTooltip}
            labelFormatter={formatXAxisLabel}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E5EA',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
        )}
        {showLegend && (
          <Legend
            verticalAlign="top"
            height={36}
            iconType="line"
            formatter={(value) => (
              <span style={{ color: '#1D1D1F', fontSize: '12px' }}>{value}</span>
            )}
          />
        )}
        {metrics.map((metric) => (
          <Line
            key={metric.key}
            type="monotone"
            dataKey={metric.key}
            stroke={metric.color}
            strokeWidth={metric.strokeWidth || 2}
            dot={false}
            activeDot={{ r: 6, fill: metric.color }}
            name={metric.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

TrendChart.displayName = 'TrendChart';
