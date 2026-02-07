import { Card } from "@/components/ui/card";

interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
}

export function BarChart({
  data,
  height = 200,
  showLabels = true,
  showValues = true,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-2"
        style={{ height: `${height}px` }}
      >
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const defaultColors = [
            "bg-[#007AFF]",
            "bg-[#34C759]",
            "bg-[#FF9500]",
            "bg-[#FF3B30]",
            "bg-[#86868B]",
          ];
          const color = item.color || defaultColors[index % defaultColors.length];

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end group relative"
            >
              <div
                className={`w-full ${color} rounded-t-sm transition-all hover:opacity-80 cursor-pointer`}
                style={{ height: `${barHeight}%` }}
                title={`${item.label}: ${item.value}`}
              />
              {showValues && (
                <div className="text-xs text-[#86868B] mt-1">
                  {item.value}
                </div>
              )}
              {showLabels && (
                <div className="text-xs text-[#86868B] mt-1 truncate w-full text-center">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: string;
}

export function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="text-sm text-[#86868B] mb-2 flex items-center justify-between">
        <span>{title}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-[#1D1D1F] mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-[#86868B]">{subtitle}</div>
      )}
      {trend && (
        <div className="text-xs mt-2">
          <span
            className={
              trend.isPositive
                ? "text-[#34C759]"
                : "text-[#FF3B30]"
            }
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
          <span className="text-[#86868B] ml-1">较上期</span>
        </div>
      )}
    </Card>
  );
}

interface ProgressCircleProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
}

export function ProgressCircle({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "#007AFF",
  backgroundColor = "rgba(0,0,0,0.08)",
  showLabel = true,
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = value / max;
  const dashArray = circumference * progress;

  return (
    <div className="flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={circumference - dashArray}
          className="transition-all duration-500"
        />
      </svg>
      {showLabel && (
        <div className="absolute text-center">
          <div className="text-2xl font-bold text-[#1D1D1F]">
            {Math.round(progress * 100)}%
          </div>
          <div className="text-xs text-[#86868B]">
            {value}/{max}
          </div>
        </div>
      )}
    </div>
  );
}
