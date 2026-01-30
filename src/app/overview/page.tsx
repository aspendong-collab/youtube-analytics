'use client';

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          数据总览
        </h1>
        <p className="text-sm text-[#86868B]">
          查看所有监控视频的整体数据表现
        </p>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="监控视频总数"
          value="128"
          change="+12"
          changeType="positive"
          icon="📹"
        />
        <MetricCard
          title="累计观看量"
          value="1.5M"
          change="+8.5%"
          changeType="positive"
          icon="👀"
        />
        <MetricCard
          title="平均互动率"
          value="7.8%"
          change="+1.2%"
          changeType="positive"
          icon="📊"
        />
        <MetricCard
          title="负责人数量"
          value="8"
          change="+2"
          changeType="positive"
          icon="👥"
        />
      </div>

      {/* 今日数据 */}
      <div className="bg-[#F5F5F7] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          今日数据
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4">
            <div className="text-sm text-[#86868B] mb-2">新增视频</div>
            <div className="text-2xl font-semibold text-[#1D1D1F]">5</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-sm text-[#86868B] mb-2">今日观看量</div>
            <div className="text-2xl font-semibold text-[#1D1D1F]">8.2K</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-sm text-[#86868B] mb-2">异常提醒</div>
            <div className="text-2xl font-semibold text-[#FF3B30]">3</div>
          </div>
        </div>
      </div>

      {/* 快速入口 */}
      <div className="bg-[#F5F5F7] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          快速入口
        </h2>
        <div className="flex flex-wrap gap-4">
          <QuickAction
            title="添加视频"
            description="手动添加需要监控的视频"
            icon="➕"
            href="/videos/add"
          />
          <QuickAction
            title="查看异常"
            description="查看表现异常的视频"
            icon="⚠️"
            href="/videos"
          />
          <QuickAction
            title="热点话题"
            description="查看当前热门话题趋势"
            icon="🔥"
            href="/trends"
          />
          <QuickAction
            title="导出报表"
            description="导出数据报表"
            icon="📊"
            href="/settings"
          />
        </div>
      </div>

      {/* 图表区域 */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          观看量趋势（近7天）
        </h2>
        <div className="h-[300px] flex items-center justify-center bg-[#F5F5F7] rounded-xl">
          <p className="text-[#86868B]">图表组件将在这里渲染</p>
        </div>
      </div>
    </div>
  );
}

// 指标卡片组件
function MetricCard({
  title,
  value,
  change,
  changeType,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-[#34C759]' : 'text-[#FF3B30]'
          }`}
        >
          {changeType === 'positive' ? '↑' : '↓'} {change}
        </span>
      </div>
      <div className="text-sm text-[#86868B] mb-2">{title}</div>
      <div className="text-3xl font-semibold text-[#1D1D1F]">{value}</div>
    </div>
  );
}

// 快速操作组件
function QuickAction({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex-1 min-w-[200px] bg-white rounded-xl p-4 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200 cursor-pointer"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-semibold text-[#1D1D1F] mb-1">{title}</div>
      <div className="text-sm text-[#86868B]">{description}</div>
    </a>
  );
}
