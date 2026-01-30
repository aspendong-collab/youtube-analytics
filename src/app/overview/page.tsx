'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStats } from '@/hooks/use-videos';

export default function OverviewPage() {
  const { data, isLoading } = useStats();
  const videos = data?.videos || [];

  // 计算统计数据
  const calculateStats = () => {
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + (v.latestStats?.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.latestStats?.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, v) => sum + (v.latestStats?.commentCount || 0), 0);
    const averageEngagement = totalViews > 0
      ? ((totalLikes + totalComments) / totalViews) * 100
      : 0;

    // 获取唯一的负责人
    const owners = new Set(videos.map((v) => v.owner).filter(Boolean));

    // 今日新增视频（今天创建的）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newVideosToday = videos.filter((v) => {
      const createdAt = v.createdAt instanceof Date ? v.createdAt : new Date(v.createdAt);
      return createdAt >= today;
    }).length;

    // 计算互动率
    const engagementRate = averageEngagement.toFixed(1);

    return {
      totalVideos,
      totalViews,
      averageEngagement: engagementRate,
      totalOwners: owners.size,
      newVideosToday,
    };
  };

  const stats = calculateStats();
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading && videos.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
            数据总览
          </h1>
          <p className="text-sm text-[#86868B]">
            查看所有监控视频的整体数据表现
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="text-[#86868B] mb-6">
            暂无视频数据，请先添加视频到监控列表
          </div>
          <Button
            onClick={() => (window.location.href = '/videos/add')}
            className="bg-[#007AFF] hover:bg-[#0056CC]"
          >
            添加第一个视频
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
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
          value={stats.totalVideos.toString()}
          icon="📹"
        />
        <MetricCard
          title="累计观看量"
          value={formatNumber(stats.totalViews)}
          icon="👀"
        />
        <MetricCard
          title="平均互动率"
          value={stats.averageEngagement + '%'}
          icon="📊"
        />
        <MetricCard
          title="负责人数量"
          value={stats.totalOwners.toString()}
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
            <div className="text-2xl font-semibold text-[#1D1D1F]">{stats.newVideosToday}</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-sm text-[#86868B] mb-2">监控中视频</div>
            <div className="text-2xl font-semibold text-[#1D1D1F]">{stats.totalVideos}</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-sm text-[#86868B] mb-2">活跃负责人</div>
            <div className="text-2xl font-semibold text-[#1D1D1F]">{stats.totalOwners}</div>
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
            title="视频列表"
            description="查看所有监控视频"
            icon="📹"
            href="/videos"
          />
          <QuickAction
            title="深度分析"
            description="查看详细数据分析"
            icon="📊"
            href="/analysis/channels"
          />
          <QuickAction
            title="系统设置"
            description="配置数据采集参数"
            icon="⚙️"
            href="/settings/data"
          />
        </div>
      </div>

      {/* 图表区域 */}
      <div className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          数据说明
        </h2>
        <div className="text-sm text-[#86868B] space-y-2">
          <p>• 视频数据每日自动更新（北京时间早上 9:00）</p>
          <p>• 互动率 = (点赞数 + 评论数) / 观看量 × 100%</p>
          <p>• 更多详细分析功能正在开发中</p>
        </div>
      </div>
    </div>
  );
}

// 指标卡片组件
function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
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
