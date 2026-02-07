"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard, BarChart, ProgressCircle } from "@/components/charts";

interface SystemOverview {
  totalInfluencers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalInvitations: number;
  totalParticipations: number;
  averageResponseRate: number;
}

interface CampaignStats {
  campaignId: string;
  campaignName: string;
  invitedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  pendingCount: number;
  completedCount: number;
  responseRate: number;
  completionRate: number;
}

interface TrendData {
  date: string;
  invitations: number;
  participations: number;
  completions: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState("7d");

  useEffect(() => {
    loadDashboardData();
  }, [trendPeriod]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [overviewRes, campaignsRes, trendsRes] = await Promise.all([
        fetch("/api/v1/analytics"),
        fetch("/api/v1/analytics/campaigns"),
        fetch(`/api/v1/analytics/trends?period=${trendPeriod}`),
      ]);

      if (!overviewRes.ok || !campaignsRes.ok || !trendsRes.ok) {
        throw new Error("加载仪表盘数据失败");
      }

      const overviewResult: ApiResponse<SystemOverview> = await overviewRes.json();
      const campaignsResult: ApiResponse<CampaignStats[]> = await campaignsRes.json();
      const trendsResult: ApiResponse<TrendData[]> = await trendsRes.json();

      if (overviewResult.success && overviewResult.data) {
        setOverview(overviewResult.data);
      }

      if (campaignsResult.success && campaignsResult.data) {
        setCampaignStats(campaignsResult.data);
      }

      if (trendsResult.success && trendsResult.data) {
        setTrendData(trendsResult.data);
      }
    } catch (error) {
      console.error("加载仪表盘数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
          数据分析仪表盘
        </h1>
        <p className="text-sm text-[#86868B]">
          查看系统整体数据和关键指标
        </p>
      </div>

      {loading ? (
        <Card className="p-12 text-center text-[#86868B]">加载中...</Card>
      ) : (
        <>
          {/* 系统概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="总达人数"
              value={overview?.totalInfluencers || 0}
              icon="👥"
            />

            <StatCard
              title="总活动数"
              value={overview?.totalCampaigns || 0}
              subtitle={`进行中: ${overview?.activeCampaigns || 0}`}
              icon="📢"
            />

            <StatCard
              title="总邀请数"
              value={overview?.totalInvitations || 0}
              subtitle={`参与数: ${overview?.totalParticipations || 0}`}
              icon="📨"
            />

            <StatCard
              title="平均响应率"
              value={overview ? formatPercentage(overview.averageResponseRate) : "0%"}
              icon="📈"
            />
          </div>

          {/* 趋势分析 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">
                趋势分析
              </h2>
              <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">最近 7 天</SelectItem>
                  <SelectItem value="30d">最近 30 天</SelectItem>
                  <SelectItem value="90d">最近 90 天</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {trendData.length > 0 ? (
              <div className="space-y-6">
                {/* 邀请数趋势 */}
                <div>
                  <div className="text-sm font-medium text-[#1D1D1F] mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#007AFF] rounded" />
                    邀请数趋势
                  </div>
                  <BarChart
                    data={trendData.map((item) => ({
                      label: formatDate(item.date),
                      value: item.invitations,
                    }))}
                    height={150}
                  />
                </div>

                {/* 参与数趋势 */}
                <div>
                  <div className="text-sm font-medium text-[#1D1D1F] mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#34C759] rounded" />
                    参与数趋势
                  </div>
                  <BarChart
                    data={trendData.map((item) => ({
                      label: formatDate(item.date),
                      value: item.participations,
                    }))}
                    height={150}
                  />
                </div>

                {/* 完成数趋势 */}
                <div>
                  <div className="text-sm font-medium text-[#1D1D1F] mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#FF9500] rounded" />
                    完成数趋势
                  </div>
                  <BarChart
                    data={trendData.map((item) => ({
                      label: formatDate(item.date),
                      value: item.completions,
                    }))}
                    height={150}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center text-[#86868B] py-8">
                暂无趋势数据
              </div>
            )}
          </Card>

          {/* 活动统计 */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[#1D1D1F] mb-6">
              活动统计
            </h2>

            {campaignStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[rgba(0,0,0,0.08)]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#86868B]">
                        活动名称
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#86868B]">
                        已邀请
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#86868B]">
                        已接受
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#86868B]">
                        已拒绝
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#86868B]">
                        待处理
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#86868B]">
                        已完成
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#86868B]">
                        响应率
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#86868B]">
                        完成率
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignStats.map((stats) => (
                      <tr
                        key={stats.campaignId}
                        className="border-b border-[rgba(0,0,0,0.08)] hover:bg-[rgba(0,122,255,0.02)]"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1D1D1F]">
                            {stats.campaignName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant="secondary">{stats.invitedCount}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-[#34C759] font-medium">
                          {stats.acceptedCount}
                        </td>
                        <td className="py-3 px-4 text-right text-[#FF3B30] font-medium">
                          {stats.rejectedCount}
                        </td>
                        <td className="py-3 px-4 text-right text-[#FF9500] font-medium">
                          {stats.pendingCount}
                        </td>
                        <td className="py-3 px-4 text-right text-[#007AFF] font-medium">
                          {stats.completedCount}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatPercentage(stats.responseRate)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {formatPercentage(stats.completionRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-[#86868B] py-8">
                <div className="text-4xl mb-2">📊</div>
                <p>暂无活动统计数据</p>
              </div>
            )}
          </Card>

          {/* 刷新按钮 */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={loadDashboardData}
              disabled={loading}
            >
              {loading ? "加载中..." : "刷新数据"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
