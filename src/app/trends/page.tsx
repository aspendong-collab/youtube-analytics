'use client';

import { Card } from '@/components/ui/card';

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          热点趋势
        </h1>
        <p className="text-sm text-[#86868B]">
          发现行业热门话题，把握创作机会
        </p>
      </div>

      {/* 热门话题列表 */}
      <div className="space-y-4">
        <HotTopicCard
          topic="#AI视频工具"
          trend="+45%"
          status="rising"
          videoCount={128}
          description="AI 视频生成工具的使用教程和评测内容热度持续上升"
          suitableFor="教程类、工具类视频"
        />
        <HotTopicCard
          topic="#短视频变现"
          trend="稳定"
          status="stable"
          videoCount={85}
          description="短视频平台的变现方法和成功案例分析"
          suitableFor="经验分享、案例分析"
        />
        <HotTopicCard
          topic="#创作者变现"
          trend="新兴"
          status="emerging"
          videoCount={32}
          description="内容创作者的变现途径和平台对比"
          suitableFor="新手指南、平台对比"
        />
      </div>
    </div>
  );
}

// 热点话题卡片组件
function HotTopicCard({
  topic,
  trend,
  status,
  videoCount,
  description,
  suitableFor,
}: {
  topic: string;
  trend: string;
  status: 'rising' | 'stable' | 'emerging';
  videoCount: number;
  description: string;
  suitableFor: string;
}) {
  const statusConfig = {
    rising: { icon: '🔥', color: 'text-[#FF3B30]' },
    stable: { icon: '📈', color: 'text-[#34C759]' },
    emerging: { icon: '💡', color: 'text-[#007AFF]' },
  };

  const config = statusConfig[status];

  return (
    <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <h3 className="text-xl font-semibold text-[#1D1D1F]">{topic}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} bg-[#F5F5F7]`}>
          {trend}
        </span>
      </div>

      <p className="text-sm text-[#86868B] mb-4">{description}</p>

      <div className="flex items-center gap-6 text-sm mb-4">
        <div>
          <span className="text-[#86868B]">相关视频：</span>
          <span className="font-medium text-[#1D1D1F]">{videoCount}</span>
        </div>
        <div>
          <span className="text-[#86868B]">适合类型：</span>
          <span className="font-medium text-[#1D1D1F]">{suitableFor}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0056CC]">
          查看详情
        </button>
        <button className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-lg text-sm hover:bg-[#E5E5EA]">
          创建内容
        </button>
      </div>
    </Card>
  );
}
