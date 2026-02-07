"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Users, MessageSquare, TrendingUp, Target } from "lucide-react";

interface WorkflowStats {
  totalInfluencers: number;
  pendingContacts: number;
  activeNegotiations: number;
  activeCampaigns: number;
  completedCampaigns: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export default function InfluencerOperationsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflowStats();
  }, []);

  const loadWorkflowStats = async () => {
    setLoading(true);
    try {
      // 加载工作流统计数据
      const response = await fetch("/api/v1/analytics");

      if (response.ok) {
        const result: ApiResponse<WorkflowStats> = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error("加载工作流数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const workflowSteps = [
    {
      id: "discovery",
      title: "发现达人",
      description: "搜索和评估合适的达人",
      icon: <Users className="w-5 h-5" />,
      path: "/my-influencers",
      color: "bg-blue-500",
      stats: stats?.totalInfluencers || 0,
    },
    {
      id: "contact",
      title: "联系达人",
      description: "生成个性化邀请消息",
      icon: <MessageSquare className="w-5 h-5" />,
      path: "/ai-assistant",
      color: "bg-purple-500",
      stats: stats?.pendingContacts || 0,
    },
    {
      id: "negotiate",
      title: "协商合作",
      description: "智能谈判策略与回复",
      icon: <Target className="w-5 h-5" />,
      path: "/negotiation",
      color: "bg-orange-500",
      stats: stats?.activeNegotiations || 0,
    },
    {
      id: "campaign",
      title: "创建活动",
      description: "管理营销活动",
      icon: <Clock className="w-5 h-5" />,
      path: "/campaigns",
      color: "bg-green-500",
      stats: stats?.activeCampaigns || 0,
    },
    {
      id: "track",
      title: "效果追踪",
      description: "分析活动效果和 ROI",
      icon: <TrendingUp className="w-5 h-5" />,
      path: "/dashboard",
      color: "bg-pink-500",
      stats: stats?.completedCampaigns || 0,
    },
  ];

  const quickActions = [
    {
      title: "添加新达人",
      description: "从达人库添加或手动录入",
      path: "/influencers",
      icon: "➕",
    },
    {
      title: "生成邀请消息",
      description: "使用 AI 快速生成邀请",
      path: "/ai-assistant",
      icon: "💬",
    },
    {
      title: "创建新活动",
      description: "启动营销活动",
      path: "/campaigns",
      icon: "📢",
    },
    {
      title: "查看数据报告",
      description: "分析整体运营效果",
      path: "/dashboard",
      icon: "📊",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
            达人运营中心
          </h1>
          <p className="text-sm text-[#86868B]">
            管理达人联系、谈判和营销活动的完整工作流
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {session?.user?.name}
        </Badge>
      </div>

      {/* 工作流引导 */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            达人运营工作流
          </h2>
          <p className="text-sm text-[#86868B]">
            按照以下步骤完成达人营销活动的全流程管理
          </p>
        </div>

        {/* 工作流步骤 */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4">
              {/* 步骤指示器 */}
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full ${step.color} text-white flex items-center justify-center font-semibold`}>
                  {index + 1}
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-300" />
                )}
              </div>

              {/* 步骤内容 */}
              <Link href={step.path} className="flex-1">
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${step.color} bg-opacity-10 flex items-center justify-center text-[#1D1D1F]`}>
                      {step.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#1D1D1F]">
                        {step.title}
                      </div>
                      <div className="text-xs text-[#86868B]">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">
                      {step.stats} 项
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-[#86868B]" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </Card>

      {/* 快速操作 */}
      <div>
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          快速操作
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.path} href={action.path}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-sm font-medium text-[#1D1D1F] mb-1">
                  {action.title}
                </div>
                <div className="text-xs text-[#86868B]">
                  {action.description}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 工作流统计 */}
      {!loading && stats && (
        <div>
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
            工作流概览
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div className="text-xs text-[#86868B]">达人库总数</div>
              </div>
              <div className="text-2xl font-semibold text-[#1D1D1F]">
                {stats.totalInfluencers}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <div className="text-xs text-[#86868B]">待联系达人</div>
              </div>
              <div className="text-2xl font-semibold text-[#1D1D1F]">
                {stats.pendingContacts}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-4 h-4 text-orange-600" />
                <div className="text-xs text-[#86868B]">进行中谈判</div>
              </div>
              <div className="text-2xl font-semibold text-[#1D1D1F]">
                {stats.activeNegotiations}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div className="text-xs text-[#86868B]">进行中活动</div>
              </div>
              <div className="text-2xl font-semibold text-[#1D1D1F]">
                {stats.activeCampaigns}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 使用提示 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-[#1D1D1F] mb-1">
              运营小贴士
            </div>
            <ul className="text-xs text-[#86868B] space-y-1">
              <li>• 使用 AI 助手可以快速生成个性化的达人邀请消息</li>
              <li>• 在创建活动前，建议先完善达人库和评估工作</li>
              <li>• 定期查看活动数据，优化达人和合作策略</li>
              <li>• 利用自动谈判助手提高协商效率</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
