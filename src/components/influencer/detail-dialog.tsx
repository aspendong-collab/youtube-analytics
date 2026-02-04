'use client';

import { useState, useEffect } from 'react';
import { X, Star, Heart, UserPlus, Mail } from 'lucide-react';
import { toast } from 'sonner';
import type { InfluencerProfile } from '@/types/influencer';

interface InfluencerDetailDialogProps {
  open: boolean;
  onClose: () => void;
  influencer: InfluencerProfile | null;
}

export default function InfluencerDetailDialog({ open, onClose, influencer }: InfluencerDetailDialogProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isAddLoading, setIsAddLoading] = useState(false);

  // 检查收藏状态和添加状态
  useEffect(() => {
    if (open && influencer) {
      checkFavoriteStatus();
      checkAddedStatus();
    }
  }, [open, influencer]);

  const checkFavoriteStatus = async () => {
    if (!influencer) return;
    try {
      const response = await fetch(`/api/user/favorites/${influencer.channelId}`);
      if (response.ok) {
        const result = await response.json();
        setIsFavorited(result.isFavorited);
      }
    } catch (error) {
      console.error('Failed to check favorite status:', error);
    }
  };

  const checkAddedStatus = async () => {
    if (!influencer) return;
    try {
      const response = await fetch(`/api/user/influencers`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const found = result.data.influencers.find((ui: any) => ui.channelId === influencer.channelId);
          setIsAdded(!!found);
        }
      }
    } catch (error) {
      console.error('Failed to check added status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    if (!influencer) return;

    setIsFavoriteLoading(true);
    try {
      if (isFavorited) {
        // 取消收藏
        const response = await fetch(`/api/user/favorites/${influencer.channelId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('取消收藏失败');
        }

        setIsFavorited(false);
        toast.success('已取消收藏');
      } else {
        // 添加收藏
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: influencer.channelId,
            influencerId: influencer.id || influencer.channelId,
          }),
        });

        if (!response.ok) {
          throw new Error('收藏失败');
        }

        setIsFavorited(true);
        toast.success('收藏成功');
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      toast.error(isFavorited ? '取消收藏失败' : '收藏失败');
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleAddToList = async () => {
    if (!influencer) return;

    setIsAddLoading(true);
    try {
      if (isAdded) {
        // 从列表移除
        const response = await fetch(`/api/user/influencers/${influencer.channelId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('从列表移除失败');
        }

        setIsAdded(false);
        toast.success('已从列表移除');
      } else {
        // 添加到列表
        const response = await fetch('/api/user/influencers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: influencer.channelId,
            influencerId: influencer.id || influencer.channelId,
            listName: 'default',
          }),
        });

        if (!response.ok) {
          throw new Error('添加到列表失败');
        }

        setIsAdded(true);
        toast.success('已添加到列表');
      }
    } catch (error) {
      console.error('Toggle list error:', error);
      toast.error(isAdded ? '从列表移除失败' : '添加到列表失败');
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleContactInfluencer = () => {
    if (!influencer) return;

    // 如果有邮箱，复制邮箱
    if (influencer.inferredEmail?.email) {
      navigator.clipboard.writeText(influencer.inferredEmail.email);
      toast.success('邮箱已复制到剪贴板');
      return;
    }

    // 如果有其他联系信息，显示提示
    toast.info('请在达人详情中查看联系信息');
  };
  if (!open || !influencer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-[#E5E5EA] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#1D1D1F]">达人详情</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#86868B]" />
          </button>
        </div>

        {/* 内容 - 可滚动 */}
        <div className="overflow-y-auto max-h-[calc(90vh-64px)] p-6">
          {/* 频道信息 */}
          <div className="mb-8">
            <div className="flex items-start gap-4">
              {influencer.channelThumbnail && (
                <img
                  src={influencer.channelThumbnail}
                  alt={influencer.channelTitle}
                  className="w-20 h-20 rounded-full"
                />
              )}
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-[#1D1D1F] mb-1">{influencer.channelTitle}</h3>
                <p className="text-[#86868B] mb-2">@{influencer.customUrl || influencer.channelId}</p>
                <p className="text-[#86868B] text-sm line-clamp-2">{influencer.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Tag icon="🌍" text={influencer.inferredCountry?.countryName || '未知'} />
                  <Tag
                    icon="📧"
                    text={influencer.inferredEmail?.email || '未找到'}
                    status={influencer.inferredEmail?.email ? 'success' : 'warning'}
                  />
                  <Tag icon="🗣️" text={influencer.inferredLanguage?.languageName || '未知'} />
                </div>
              </div>
            </div>
          </div>

          {/* 核心数据 */}
          <Section title="核心数据">
            <div className="grid grid-cols-3 gap-4">
              <MetricCard label="订阅数" value={formatNumber(influencer.subscriberCount)} />
              <MetricCard label="均播" value={formatNumber(influencer.avgViews)} />
              <MetricCard label="互动率" value={`${influencer.engagementRate.toFixed(2)}%`} />
              <MetricCard label="增长率" value={`+${influencer.viewsTrend.toFixed(1)}%`} />
              <MetricCard label="评分" value={`${influencer.score?.total || 0}分`} />
              <MetricCard label="Tier" value={influencer.score?.tier || 'Tier 4'} />
            </div>
          </Section>

          {/* 智能推断 */}
          <Section title="智能推断">
            <div className="grid grid-cols-2 gap-4">
              <InferenceCard
                title="所在地区"
                value={influencer.inferredCountry?.countryName || '未知'}
                confidence={influencer.inferredCountry?.confidence || 0}
                evidence={influencer.inferredCountry?.evidence}
              />
              <InferenceCard
                title="主要语种"
                value={influencer.inferredLanguage?.languageName || '未知'}
                confidence={influencer.inferredLanguage?.confidence || 0}
                evidence={[influencer.inferredLanguage?.evidence].filter(Boolean)}
              />
              <InferenceCard
                title="联系邮箱"
                value={influencer.inferredEmail?.email || '未找到'}
                confidence={influencer.inferredEmail?.confidence || 0}
                evidence={influencer.inferredEmail?.suggestions}
              />
              <InferenceCard
                title="社交媒体"
                value={
                  influencer.inferredSocialMedia?.twitter ||
                  influencer.inferredSocialMedia?.instagram ||
                  '未找到'
                }
                confidence={50}
                evidence={[]}
              />
            </div>
          </Section>

          {/* 最近视频 */}
          <Section title={`最近视频 (${influencer.recentVideos?.length || 0}个)`}>
            <div className="space-y-3">
              {influencer.recentVideos?.slice(0, 5).map((video, index) => (
                <VideoCard key={index} video={video} />
              ))}
            </div>
          </Section>

          {/* 合作建议 */}
          <Section title="合作建议">
            <div className="space-y-2">
              {influencer.score?.recommendations?.map((rec, index) => (
                <div key={index} className="flex items-center gap-2 text-[#1D1D1F]">
                  <span className="text-[#34C759]">✅</span>
                  <span>{rec}</span>
                </div>
              ))}
              {influencer.estimatedReach && (
                <div className="mt-4 pt-4 border-t border-[#E5E5EA]">
                  <p className="text-sm text-[#86868B]">
                    预估触达：{formatNumber(influencer.estimatedReach.views)} 播放量 /{' '}
                    {formatNumber(influencer.estimatedReach.engagement)} 互动
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* 评分明细 */}
          <Section title="评分明细">
            <div className="space-y-3">
              {influencer.score?.breakdown && (
                <>
                  <ProgressBar label="受众规模" value={influencer.score.breakdown.audienceSize * 100} />
                  <ProgressBar label="受众质量" value={influencer.score.breakdown.audienceQuality * 100} />
                  <ProgressBar label="内容质量" value={influencer.score.breakdown.contentQuality * 100} />
                  <ProgressBar label="发布稳定" value={influencer.score.breakdown.consistency * 100} />
                  <ProgressBar label="增长率" value={influencer.score.breakdown.growthRate * 100} />
                  <ProgressBar label="相关性" value={influencer.score.breakdown.relevance * 100} />
                  <ProgressBar label="性价比" value={influencer.score.breakdown.costEfficiency * 100} />
                </>
              )}
            </div>
          </Section>
        </div>

        {/* 底部操作 */}
        <div className="sticky bottom-0 bg-white border-t border-[#E5E5EA] px-6 py-4 flex gap-3">
          <button
            onClick={handleToggleFavorite}
            disabled={isFavoriteLoading}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              isFavorited
                ? 'bg-[#FF3B30] text-white hover:bg-[#D32F2F]'
                : 'bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7]'
            }`}
          >
            {isFavoriteLoading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <>
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? '已收藏' : '收藏'}
              </>
            )}
          </button>
          <button
            onClick={handleContactInfluencer}
            className="flex-1 px-6 py-3 bg-[#007AFF] text-white rounded-xl font-medium hover:bg-[#0056CC] transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            联系达人
          </button>
          <button
            onClick={handleAddToList}
            disabled={isAddLoading}
            className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
              isAdded
                ? 'bg-[#34C759] text-white hover:bg-[#2DB456]'
                : 'bg-white border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7]'
            }`}
          >
            {isAddLoading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <>
                <UserPlus className={`w-5 h-5 ${isAdded ? 'fill-current' : ''}`} />
                {isAdded ? '已添加' : '添加到列表'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// 子组件
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-[#1D1D1F] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Tag({
  icon,
  text,
  status,
}: {
  icon: string;
  text: string;
  status?: 'success' | 'warning' | 'default';
}) {
  const statusColors = {
    success: 'bg-[#34C759]/10 text-[#34C759]',
    warning: 'bg-[#FF9500]/10 text-[#FF9500]',
    default: 'bg-[#F5F5F7] text-[#1D1D1F]',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${statusColors[status || 'default']}`}>
      {icon} {text}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-3 bg-[#F5F5F7] rounded-xl">
      <p className="text-xs text-[#86868B] mb-1">{label}</p>
      <p className="text-lg font-semibold text-[#1D1D1F]">{value}</p>
    </div>
  );
}

function InferenceCard({
  title,
  value,
  confidence,
  evidence,
}: {
  title: string;
  value: string;
  confidence: number;
  evidence?: string[];
}) {
  const getConfidenceColor = (conf: number) => {
    if (conf >= 70) return 'text-[#34C759]';
    if (conf >= 50) return 'text-[#FF9500]';
    return 'text-[#FF3B30]';
  };

  return (
    <div className="p-4 bg-[#F5F5F7] rounded-xl">
      <p className="text-sm text-[#86868B] mb-1">{title}</p>
      <p className="font-semibold text-[#1D1D1F] mb-2">{value}</p>
      {confidence > 0 && (
        <p className={`text-sm font-medium ${getConfidenceColor(confidence)} mb-1`}>
          置信度 {confidence}%
        </p>
      )}
      {evidence && evidence.length > 0 && (
        <div className="text-xs text-[#86868B]">
          {evidence.slice(0, 2).map((ev, idx) => (
            <p key={idx}>• {ev}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCard({ video }: { video: any }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-xl">
      {video.thumbnail && (
        <img src={video.thumbnail} alt={video.title} className="w-24 h-14 object-cover rounded-lg" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1D1D1F] truncate">{video.title}</p>
        <p className="text-xs text-[#86868B]">
          {formatNumber(video.viewCount)} 观看 • {formatDate(video.publishedAt)}
        </p>
      </div>
      <p className="text-xs text-[#86868B] whitespace-nowrap">{video.durationFormatted}</p>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-[#86868B]">{label}</span>
        <span className="text-sm font-medium text-[#1D1D1F]">{Math.round(value)}分</span>
      </div>
      <div className="w-full bg-[#E5E5EA] rounded-full h-2">
        <div
          className="bg-[#007AFF] h-2 rounded-full transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '1天前';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${Math.floor(days / 30)}月前`;
}
