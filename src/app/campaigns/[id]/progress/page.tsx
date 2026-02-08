"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { RefreshCw, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { WorkflowSteps } from "@/components/campaigns/workflow-steps";
import { LiveLogs } from "@/components/campaigns/live-logs";
import { InfluencerCard } from "@/components/campaigns/influencer-cards";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

export default function AutoCampaignProgressPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  
  const [campaign, setCampaign] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadCampaignData = async () => {
    if (!campaignId) return;

    setLoading(true);
    try {
      // 加载活动详情
      const campaignResponse = await fetch(`/api/v1/campaigns/${campaignId}/progress`);
      const campaignResult = await campaignResponse.json();

      if (campaignResult.success && campaignResult.data) {
        setCampaign(campaignResult.data.campaign || null);
        setEmails(campaignResult.data.emails || []);
      } else {
        console.error('[ProgressPage] Failed to load campaign data', campaignResult);
        setCampaign(null);
        setEmails([]);
      }
    } catch (error) {
      console.error('[ProgressPage] Load campaign data error:', error);
      setCampaign(null);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignData();
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadCampaignData, 5000); // 每5秒刷新
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [campaignId, autoRefresh]);

  const triggerEmailQueue = async () => {
    try {
      const response = await fetch("/api/v1/jobs/process-email-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`邮件队列处理完成：处理 ${result.data.processed} 封，成功 ${result.data.succeeded} 封`);
        loadCampaignData();
      } else {
        toast.error(result.error || "邮件队列处理失败");
      }
    } catch (error) {
      console.error("Trigger queue error:", error);
      toast.error("邮件队列处理失败");
    }
  };

  const handleRetryEmail = async (emailId: string) => {
    try {
      const response = await fetch(`/api/v1/campaigns/${campaignId}/emails/${emailId}/retry`, {
        method: "POST",
      });
      
      if (response.ok) {
        toast.success("已重新发送邮件");
        loadCampaignData();
      } else {
        toast.error("重发失败");
      }
    } catch (error) {
      console.error("Retry email error:", error);
      toast.error("重发失败");
    }
  };

  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">活动不存在</h2>
          <Button onClick={() => router.push('/campaigns')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回活动列表
          </Button>
        </div>
      </div>
    );
  }

  const stats = {
    total: emails.length,
    sent: emails.filter((e: any) => e.status === 'sent').length,
    delivered: emails.filter((e: any) => e.status === 'delivered').length,
    opened: emails.filter((e: any) => e.status === 'opened').length,
    failed: emails.filter((e: any) => e.status === 'failed').length,
    bounced: emails.filter((e: any) => e.status === 'bounced').length,
  };

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/campaigns')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-[#1D1D1F]">
              {campaign.name}
            </h1>
          </div>
          <p className="text-sm text-[#86868B] ml-7">
            实时监控自动化推广执行进度
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? '自动刷新中' : '开启自动刷新'}
          </Button>
          <Button onClick={loadCampaignData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="总邮件数"
          value={stats.total}
          icon={<Mail className="w-4 h-4" />}
          color="blue"
        />
        <StatsCard
          title="已发送"
          value={stats.sent}
          icon={<Mail className="w-4 h-4" />}
          color="green"
        />
        <StatsCard
          title="已送达"
          value={stats.delivered}
          icon={<Mail className="w-4 h-4" />}
          color="green"
        />
        <StatsCard
          title="已打开"
          value={stats.opened}
          icon={<Mail className="w-4 h-4" />}
          color="purple"
        />
        <StatsCard
          title="发送失败"
          value={stats.failed}
          icon={<Mail className="w-4 h-4" />}
          color="red"
        />
        <StatsCard
          title="被退回"
          value={stats.bounced}
          icon={<Mail className="w-4 h-4" />}
          color="orange"
        />
      </div>

      {/* 主要内容区域 */}
      <Tabs defaultValue="workflow" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflow">工作流</TabsTrigger>
          <TabsTrigger value="logs">实时日志</TabsTrigger>
          <TabsTrigger value="emails">邮件详情</TabsTrigger>
        </TabsList>

        {/* 工作流标签页 */}
        <TabsContent value="workflow" className="space-y-4">
          <WorkflowSteps campaignId={campaignId} autoRefresh={autoRefresh} />
        </TabsContent>

        {/* 实时日志标签页 */}
        <TabsContent value="logs" className="space-y-4">
          <LiveLogs campaignId={campaignId} autoRefresh={autoRefresh} />
        </TabsContent>

        {/* 邮件详情标签页 */}
        <TabsContent value="emails" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">邮件发送详情</h2>
              <Button onClick={triggerEmailQueue}>
                <Mail className="w-4 h-4 mr-2" />
                触发邮件队列
              </Button>
            </div>

            {emails.length > 0 ? (
              <div className="space-y-4">
                {emails.map((email: any) => (
                  <InfluencerCard
                    key={email.id}
                    influencer={{
                      id: email.influencerId,
                      channelTitle: email.channelTitle,
                      thumbnail: email.thumbnail,
                      email: email.recipientEmail,
                      subscriberCount: email.subscriberCount,
                      engagementRate: email.engagementRate,
                      estimatedPrice: email.estimatedPrice,
                      cpvScore: email.cpvScore,
                    }}
                    status={{
                      emailStatus: email.status,
                      emailSentAt: email.sentAt,
                      negotiationStatus: email.negotiationStatus,
                      openCount: email.openCount,
                      errorMessage: email.errorMessage,
                    }}
                    onRetry={() => handleRetryEmail(email.id)}
                    onResendEmail={() => handleRetryEmail(email.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无邮件数据
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({ title, value, icon, color }: any) {
  const colorClasses = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-[#86868B]">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );
}
