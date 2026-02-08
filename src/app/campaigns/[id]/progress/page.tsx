"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { RefreshCw, Mail, MessageSquare, CheckCircle2, Clock, AlertTriangle, XCircle, Eye, EyeOff, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AutoCampaignProgressPage() {
  const params = useParams();
  const campaignId = params.id as string;
  
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadProgress = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/campaigns/${campaignId}/progress`);
      const result = await response.json();
      
      if (result.success) {
        setProgress(result.data);
        
        // 如果有等待中的邮件，自动触发邮件队列处理
        if (result.data.stats && result.data.stats.queued > 0) {
          console.log(`Found ${result.data.stats.queued} queued emails, triggering queue processing...`);
          try {
            await fetch("/api/v1/jobs/process-email-queue", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ limit: 10 }),
            });
            console.log("Email queue processing triggered");
          } catch (error) {
            console.error("Failed to trigger email queue processing:", error);
          }
        }
      }
    } catch (error) {
      console.error("Load progress error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
    
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadProgress, 3000); // 每3秒刷新
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
      
      if (response.ok) {
        toast.success("邮件队列处理已触发");
        loadProgress();
      }
    } catch (error) {
      console.error("Trigger queue error:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  if (loading && !progress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const { progress: prog, stats, emails } = progress || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">自动化进度监控</h1>
          <p className="text-sm text-[#86868B]">
            实时查看自动化推广的执行进度和邮件发送情况
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
          <Button onClick={loadProgress} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 进度条 */}
      {prog !== undefined && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">总体进度</span>
            <span className="text-sm font-semibold">{prog}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${prog}%` }}
            />
          </div>
        </Card>
      )}

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatsCard
          title="总邮件数"
          value={stats?.total || 0}
          icon={<Mail className="w-4 h-4" />}
          color="blue"
        />
        <StatsCard
          title="已发送"
          value={stats?.sent || 0}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="green"
        />
        <StatsCard
          title="已送达"
          value={stats?.delivered || 0}
          icon={<CheckCircle2 className="w-4 h-4" />}
          color="green"
        />
        <StatsCard
          title="已打开"
          value={stats?.opened || 0}
          icon={<Eye className="w-4 h-4" />}
          color="purple"
        />
        <StatsCard
          title="发送失败"
          value={stats?.failed || 0}
          icon={<XCircle className="w-4 h-4" />}
          color="red"
        />
        <StatsCard
          title="被退回"
          value={stats?.bounced || 0}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="orange"
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

      {/* 邮件列表 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">邮件发送详情</h2>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>达人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>打开次数</TableHead>
                <TableHead>发送时间</TableHead>
                <TableHead>谈判状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails && emails.length > 0 ? (
                emails.map((email: any) => (
                  <TableRow key={email.emailId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {email.thumbnail && (
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <img src={email.thumbnail} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{email.channelTitle}</p>
                          <p className="text-xs text-[#86868B]">
                            {email.subscriberCount?.toLocaleString()} 粉丝
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getEmailStatusVariant(email.emailStatus)}>
                        {getEmailStatusLabel(email.emailStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>{email.openCount || 0}</TableCell>
                    <TableCell>
                      {email.sentAt ? new Date(email.sentAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {email.negotiationId ? (
                        <Badge variant={getNegotiationStatusVariant(email.negotiationStatus)}>
                          {getNegotiationStatusLabel(email.negotiationStatus)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-[#86868B]">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(email)}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            查看详情
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>邮件与谈判详情</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[60vh]">
                            <EmailDetail email={selectedEmail} />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-[#86868B]">暂无邮件数据</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
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

function EmailDetail({ email }: { email: any }) {
  if (!email) return <p>请选择一封邮件查看详情</p>;

  return (
    <div className="space-y-6">
      {/* 邮件基本信息 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {email.thumbnail && (
            <div className="w-16 h-16 rounded-full overflow-hidden">
              <img src={email.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">{email.channelTitle}</h3>
            <p className="text-sm text-[#86868B]">
              {email.subscriberCount?.toLocaleString()} 粉丝 · 等级: {email.level}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#86868B]">邮件状态:</span>{' '}
            <Badge variant={getEmailStatusVariant(email.emailStatus)}>
              {getEmailStatusLabel(email.emailStatus)}
            </Badge>
          </div>
          <div>
            <span className="text-[#86868B]">打开次数:</span> {email.openCount || 0}
          </div>
          <div>
            <span className="text-[#86868B]">点击次数:</span> {email.clickCount || 0}
          </div>
          <div>
            <span className="text-[#86868B]">重试次数:</span> {email.retryCount || 0}
          </div>
        </div>

        {email.errorMessage && (
          <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
            <p className="font-semibold mb-1">错误信息:</p>
            <p>{email.errorMessage}</p>
          </div>
        )}

        {email.bouncedAt && (
          <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
            <p className="font-semibold mb-1">退回信息:</p>
            <p>{email.bounceReason}</p>
          </div>
        )}
      </div>

      {/* 邮件内容 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">邮件内容</h4>
          <Button variant="ghost" size="sm" onClick={() => email.content && navigator.clipboard.writeText(email.content)}>
            <Copy className="w-4 h-4 mr-1" />
            复制
          </Button>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium mb-2">{email.subject}</p>
          <div className="text-sm whitespace-pre-wrap">{email.content}</div>
        </div>
      </div>

      {/* 谈判记录 */}
      {email.negotiationId && (
        <div className="space-y-4">
          <h4 className="font-semibold">谈判记录</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#86868B]">谈判状态:</span>{' '}
              <Badge variant={getNegotiationStatusVariant(email.negotiationStatus)}>
                {getNegotiationStatusLabel(email.negotiationStatus)}
              </Badge>
            </div>
            <div>
              <span className="text-[#86868B]">初始报价:</span> ${email.initialPrice}
            </div>
            {email.ourOffer && (
              <div>
                <span className="text-[#86868B]">我们的报价:</span> ${email.ourOffer}
              </div>
            )}
            {email.counterOffer && (
              <div>
                <span className="text-[#86868B]">对方还价:</span> ${email.counterOffer}
              </div>
            )}
            {email.finalPrice && (
              <div>
                <span className="text-[#86868B]">最终价格:</span>{' '}
                <span className="font-semibold text-green-600">${email.finalPrice}</span>
              </div>
            )}
            {email.needsUserApproval && (
              <div>
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  需要人工确认
                </Badge>
              </div>
            )}
          </div>

          {/* 谈判消息 */}
          {email.messages && email.messages.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium">谈判消息</h5>
              <div className="space-y-2">
                {email.messages.map((msg: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-50 ml-8' 
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {msg.role === 'user' ? '我们' : '达人'}
                      </span>
                      {msg.price && (
                        <span className="text-xs font-semibold text-blue-600">
                          报价: ${msg.price}
                        </span>
                      )}
                      <span className="text-xs text-[#86868B] ml-auto">
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getEmailStatusVariant(status: string): any {
  const variants: Record<string, any> = {
    queued: "secondary",
    sending: "default",
    sent: "default",
    failed: "destructive",
    bounced: "destructive",
    delivered: "default",
    opened: "default",
    clicked: "default",
  };
  return variants[status] || "secondary";
}

function getEmailStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    queued: "等待中",
    sending: "发送中",
    sent: "已发送",
    failed: "发送失败",
    bounced: "被退回",
    delivered: "已送达",
    opened: "已打开",
    clicked: "已点击",
  };
  return labels[status] || status;
}

function getNegotiationStatusVariant(status: string): any {
  const variants: Record<string, any> = {
    pending: "secondary",
    in_progress: "default",
    accepted: "default",
    rejected: "destructive",
    failed: "destructive",
    user_intervention: "outline",
  };
  return variants[status] || "secondary";
}

function getNegotiationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "等待中",
    in_progress: "谈判中",
    accepted: "已接受",
    rejected: "已拒绝",
    failed: "谈判失败",
    user_intervention: "需要人工介入",
  };
  return labels[status] || status;
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
