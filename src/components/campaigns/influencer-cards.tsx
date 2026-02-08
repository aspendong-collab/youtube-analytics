/**
 * 达人处理卡片组件
 * 显示每个达人的处理状态和详细信息
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface InfluencerCardProps {
  influencer: {
    id: string;
    channelTitle: string;
    thumbnail: string | null;
    email: string | null;
    subscriberCount: number;
    engagementRate: number;
    estimatedPrice: number;
    cpvScore: number;
  };
  status: {
    emailStatus: string;
    emailSentAt: Date | null;
    negotiationStatus: string | null;
    openCount: number;
    errorMessage: string | null;
  };
  onRetry?: (influencerId: string) => void;
  onResendEmail?: (influencerId: string) => void;
}

export function InfluencerCard({ influencer, status, onRetry, onResendEmail }: InfluencerCardProps) {
  const getEmailStatusVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'delivered':
        return 'secondary';
      case 'opened':
        return 'outline';
      case 'failed':
        return 'destructive';
      case 'bounced':
        return 'destructive';
      case 'queued':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getEmailStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return '已发送';
      case 'delivered':
        return '已送达';
      case 'opened':
        return '已打开';
      case 'failed':
        return '发送失败';
      case 'bounced':
        return '被退回';
      case 'queued':
        return '队列中';
      default:
        return status;
    }
  };

  const getNegotiationStatusVariant = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'in_progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getNegotiationStatusLabel = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case 'accepted':
        return '已接受';
      case 'rejected':
        return '已拒绝';
      case 'in_progress':
        return '谈判中';
      case 'pending':
        return '等待中';
      default:
        return status;
    }
  };

  const getCPVRating = (score: number) => {
    if (score >= 80) return { color: 'text-green-600', label: '优秀' };
    if (score >= 60) return { color: 'text-blue-600', label: '良好' };
    if (score >= 40) return { color: 'text-yellow-600', label: '一般' };
    return { color: 'text-red-600', label: '较差' };
  };

  const cpvRating = getCPVRating(influencer.cpvScore);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* 头像 */}
        {influencer.thumbnail ? (
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
            <img
              src={influencer.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
            {influencer.channelTitle.charAt(0)}
          </div>
        )}

        {/* 达人信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-base truncate">{influencer.channelTitle}</h4>
            {status.emailStatus === 'opened' && (
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            )}
            {status.emailStatus === 'failed' && (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>

          <p className="text-sm text-gray-600 truncate mb-2">
            {influencer.email || '无邮箱'}
          </p>

          {/* 统计信息 */}
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {influencer.subscriberCount.toLocaleString()} 粉丝
            </Badge>
            <Badge variant="outline" className="text-xs">
              {influencer.engagementRate}% 互动
            </Badge>
            <Badge variant="outline" className="text-xs">
              ${influencer.estimatedPrice}
            </Badge>
            <Badge variant="outline" className={`text-xs ${cpvRating.color}`}>
              CPV {influencer.cpvScore} ({cpvRating.label})
            </Badge>
          </div>

          {/* 状态信息 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getEmailStatusVariant(status.emailStatus)} className="text-xs">
              {getEmailStatusLabel(status.emailStatus)}
            </Badge>
            
            {status.openCount > 0 && (
              <span className="text-xs text-gray-500">
                打开 {status.openCount} 次
              </span>
            )}

            {status.negotiationStatus && (
              <Badge variant={getNegotiationStatusVariant(status.negotiationStatus)} className="text-xs">
                {getNegotiationStatusLabel(status.negotiationStatus)}
              </Badge>
            )}

            {status.emailSentAt && (
              <span className="text-xs text-gray-500">
                {new Date(status.emailSentAt).toLocaleString('zh-CN')}
              </span>
            )}
          </div>

          {/* 错误信息 */}
          {status.errorMessage && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {status.errorMessage}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {status.emailStatus === 'failed' && onRetry && (
            <Button
              onClick={() => onRetry(influencer.id)}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              重试
            </Button>
          )}
          
          {status.emailStatus === 'sent' && status.openCount === 0 && onResendEmail && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Mail className="w-3 h-3 mr-1" />
                  重发
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>重新发送邮件</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>确定要重新发送邮件给 <strong>{influencer.channelTitle}</strong> 吗？</p>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-1">收件人：</p>
                    <p className="font-medium">{influencer.email}</p>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <DialogTrigger asChild>
                      <Button variant="outline">取消</Button>
                    </DialogTrigger>
                    <Button
                      onClick={() => {
                        onResendEmail(influencer.id);
                        toast.success('邮件已重新发送');
                      }}
                    >
                      确定发送
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </Card>
  );
}
