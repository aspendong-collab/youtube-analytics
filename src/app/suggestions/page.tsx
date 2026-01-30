'use client';

import { Card } from '@/components/ui/card';

export default function SuggestionsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          优化建议
        </h1>
        <p className="text-sm text-[#86868B]">
          基于数据分析提供视频优化建议
        </p>
      </div>

      {/* 优化任务列表 */}
      <div className="space-y-4">
        <OptimizationTask
          videoTitle="如何提升YouTube视频观看量？"
          priority="high"
          suggestions={[
            '标题长度偏长，建议缩短至 25 字符内',
            '封面颜色对比度不足，建议增加视觉冲击力',
            '前30秒吸引力不够，建议加入悬念或亮点',
          ]}
        />
        <OptimizationTask
          videoTitle="2025年电商趋势分析"
          priority="medium"
          suggestions={[
            '标签选择不够精准，建议增加 #电商分析 相关标签',
            '发布时间建议调整到晚上 8-10 点',
            '结尾缺少互动引导，建议增加提问或呼吁',
          ]}
        />
      </div>
    </div>
  );
}

// 优化任务组件
function OptimizationTask({
  videoTitle,
  priority,
  suggestions,
}: {
  videoTitle: string;
  priority: 'high' | 'medium' | 'low';
  suggestions: string[];
}) {
  const priorityConfig = {
    high: { label: '高优先级', color: 'bg-[#FF3B30]' },
    medium: { label: '中优先级', color: 'bg-[#FF9500]' },
    low: { label: '低优先级', color: 'bg-[#007AFF]' },
  };

  const config = priorityConfig[priority];

  return (
    <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-[#1D1D1F]">{videoTitle}</h3>
        <span className={`px-3 py-1 rounded-full text-xs text-white ${config.color}`}>
          {config.label}
        </span>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-[#007AFF] mt-1">💡</span>
            <p className="text-sm text-[#1D1D1F]">{suggestion}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-4 pt-4 border-t border-[rgba(0,0,0,0.08)]">
        <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0056CC]">
          标记为已处理
        </button>
        <button className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-lg text-sm hover:bg-[#E5E5EA]">
          查看详情
        </button>
      </div>
    </Card>
  );
}
