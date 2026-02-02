'use client';

import React, { useMemo } from 'react';

export interface HeatmapDataPoint {
  day: number; // 0-6 (周日到周六)
  hour: number; // 0-23
  value: number; // 该时段发布的视频数或播放量
}

export interface HeatmapProps {
  data: HeatmapDataPoint[];
  valueLabel?: string;
  height?: number;
  cellSize?: number;
  maxValue?: number;
  colorScale?: string[];
  onCellClick?: (day: number, hour: number, value: number) => void;
}

export const Heatmap = React.memo<HeatmapProps>(({
  data,
  valueLabel = '视频数',
  height = 300,
  cellSize = 40,
  maxValue,
  colorScale = ['#F5F5F7', '#FFE5E5', '#FFCCCC', '#FF9999', '#FF6666', '#FF3333', '#FF0000'],
  onCellClick,
}) => {
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // 计算最大值（用于颜色缩放）
  const calculatedMaxValue = useMemo(() => {
    if (maxValue !== undefined) return maxValue;
    return Math.max(...data.map(d => d.value), 1);
  }, [data, maxValue]);

  // 创建数据矩阵
  const dataMatrix = useMemo(() => {
    const matrix: (number | null)[][] = [];
    for (let day = 0; day < 7; day++) {
      const row: (number | null)[] = [];
      for (let hour = 0; hour < 24; hour++) {
        const point = data.find(d => d.day === day && d.hour === hour);
        row.push(point?.value ?? null);
      }
      matrix.push(row);
    }
    return matrix;
  }, [data]);

  // 获取颜色
  const getColor = (value: number | null): string => {
    if (value === null || value === 0) return colorScale[0];
    const ratio = Math.min(value / calculatedMaxValue, 1);
    const index = Math.floor(ratio * (colorScale.length - 1));
    return colorScale[index];
  };

  // 格式化时段标签
  const formatHourLabel = (hour: number): string => {
    if (hour === 0) return '0点';
    if (hour < 12) return `${hour}点`;
    if (hour === 12) return '12点';
    return `${hour}点`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* 表格 */}
        <div className="flex">
          {/* 左侧星期标签 */}
          <div className="flex flex-col pt-6 pr-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="flex items-center justify-end text-xs font-medium text-[#86868B]"
                style={{ height: cellSize }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 热力图主体 */}
          <div>
            {/* 顶部小时标签 */}
            <div className="flex mb-1 ml-1">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="flex items-center justify-center text-xs text-[#86868B]"
                  style={{ width: cellSize }}
                >
                  {hour % 6 === 0 ? formatHourLabel(hour) : ''}
                </div>
              ))}
            </div>

            {/* 热力图网格 */}
            <div className="border border-[#E5E5EA] rounded-lg overflow-hidden">
              {dataMatrix.map((row, dayIndex) => (
                <div key={dayIndex} className="flex">
                  {row.map((value, hourIndex) => {
                    const cellValue = data.find(d => d.day === dayIndex && d.hour === hourIndex);
                    return (
                      <div
                        key={`${dayIndex}-${hourIndex}`}
                        className="relative group cursor-pointer transition-all hover:scale-110 hover:z-10"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: getColor(value),
                          border: '1px solid rgba(0,0,0,0.05)',
                        }}
                        onClick={() => onCellClick?.(dayIndex, hourIndex, value || 0)}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          <div className="font-medium">{weekDays[dayIndex]} {formatHourLabel(hourIndex)}</div>
                          <div>{valueLabel}: {value || 0}</div>
                          {/* 小三角 */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center mt-4 gap-2">
          <span className="text-xs text-[#86868B]">少</span>
          <div className="flex">
            {colorScale.map((color, index) => (
              <div
                key={index}
                className="w-4 h-4"
                style={{ backgroundColor: color, border: '1px solid rgba(0,0,0,0.05)' }}
              />
            ))}
          </div>
          <span className="text-xs text-[#86868B]">多</span>
        </div>
      </div>
    </div>
  );
});

Heatmap.displayName = 'Heatmap';
