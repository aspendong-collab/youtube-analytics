"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Mail, MessageSquare, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AutoCampaignProgressPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("id");
  
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProgress = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/campaigns/${campaignId}/auto-progress`);
      const result = await response.json();
      
      if (result.success) {
        setProgress(result.data);
      }
    } catch (error) {
      console.error("Load progress error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
    const interval = setInterval(loadProgress, 10000); // 每10秒刷新
    return () => clearInterval(interval);
  }, [campaignId]);

  const triggerEmailQueue = async () => {
    try {
      const response = await fetch("/api/v1/jobs/process-email-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });
      
      if (response.ok) {
        toast.success("邮件队列处理已触发");
        loadProgress();
      }
    } catch (error) {
      console.error("Trigger queue error:", error);
    }
  };

  if (loading || !progress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const { progress: prog, matchedInfluencers } = progress;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">自动化进度监控</h1>
          <p className="text-sm text-[#86868B]">
            实时查看自动化推广的执行进度
          </p>
        </div>
        <Button onClick={loadProgress} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatsCard
          title="已匹配"
          value={prog.totalMatched}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="blue"
        />
        <StatsCard
          title="邮件发送"
          value={prog.emailsSent}
          icon={<Mail className="w-4 h-4" />}
          color="purple"
        />
        <StatsCard
          title="已打开"
          value={prog.emailsOpened}
          icon={<MessageSquare className="w-4 h-4" />}
          color="green"
        />
        <StatsCard
          title="谈判中"
          value={prog.negotiationsInProgress}
          icon={<MessageSquare className="w-4 h-4" />}
          color="orange"
        />
        <StatsCard
          title="已接受"
          value={prog.negotiationsAccepted}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="green"
        />
        <StatsCard
          title="等待确认"
          value={prog.awaitingUserApproval}
          icon={<Clock className="w-4 h-4" />}
          color="yellow"
        />
      </div>

      {/* 操作按钮 */}
      <Card className="p-6">
        <div className="flex gap-4">
          <Button onClick={triggerEmailQueue}>
            <Mail className="w-4 h-4 mr-2" />
            触发邮件队列
          </Button>
        </div>
      </Card>

      {/* 匹配的达人列表 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">匹配的达人</h2>
        <div className="space-y-4">
          {matchedInfluencers.map((match: any) => (
            <div key={match.influencerId} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                  {match.influencer.thumbnail && (
                    <img src={match.influencer.thumbnail} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{match.influencer.channelTitle}</p>
                  <p className="text-sm text-[#86868B]">
                    {match.influencer.subscriberCount?.toLocaleString()} 粉丝 · 
                    匹配度: {match.matchScore}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">${match.estimatedPrice}</p>
                <Badge variant={getStatusBadgeVariant(match.status)}>
                  {getStatusLabel(match.status)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
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
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} bg-opacity-10 flex items-center justify-center text-[#1D1D1F]`}>
          {icon}
        </div>
        <span className="text-sm text-[#86868B]">{title}</span>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </Card>
  );
}

function getStatusBadgeVariant(status: string): any {
  const variants: Record<string, any> = {
    pending: "secondary",
    queued: "secondary",
    sent: "default",
    negotiating: "default",
    accepted: "default",
    rejected: "destructive",
  };
  return variants[status] || "secondary";
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "待处理",
    queued: "队列中",
    sent: "已发送",
    negotiating: "谈判中",
    accepted: "已接受",
    rejected: "已拒绝",
  };
  return labels[status] || status;
}
