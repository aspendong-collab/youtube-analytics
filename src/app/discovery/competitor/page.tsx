"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CompetitorAnalysis } from "@/types/youtube";

export default function CompetitorAnalysisPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"videos" | "channels" | "trends">("videos");

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("请输入搜索关键词");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/competitor-analysis?q=${encodeURIComponent(query)}&type=search&maxResults=50`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "分析失败");
      }

      const data = await response.json();
      setAnalysis(data);
      toast.success(`找到 ${data.totalResults} 个相关视频`);
    } catch (error) {
      console.error("竞品分析失败:", error);
      toast.error(error instanceof Error ? error.message : "分析失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1D1D1F] mb-2">
          竞品检测
        </h1>
        <p className="text-sm text-[#86868B]">
          通过关键词搜索和分析竞争对手的视频和频道表现
        </p>
      </div>

      {/* 搜索区域 */}
      <Card className="p-6">
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="输入关键词（如：YouTube 视频优化、科技评测）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={loading}
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-8"
          >
            {loading ? "分析中..." : "开始分析"}
          </Button>
        </div>

        {/* 搜索建议 */}
        <div className="mt-4 flex gap-2 flex-wrap">
          <span className="text-sm text-[#86868B]">热门搜索：</span>
          {["YouTube 教程", "科技评测", "游戏攻略", "美食制作"].map((suggestion) => (
            <Badge
              key={suggestion}
              variant="secondary"
              className="cursor-pointer hover:bg-[rgba(0,122,255,0.1)] transition-colors"
              onClick={() => setQuery(suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      </Card>

      {/* 分析结果 */}
      {analysis && (
        <>
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="text-sm text-[#86868B] mb-2">总搜索结果</div>
              <div className="text-3xl font-semibold text-[#1D1D1F]">
                {formatNumber(analysis.totalResults)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-[#86868B] mb-2">平均观看次数</div>
              <div className="text-3xl font-semibold text-[#1D1D1F]">
                {formatNumber(analysis.averageViews)}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm text-[#86868B] mb-2">平均参与度</div>
              <div className="text-3xl font-semibold text-[#1D1D1F]">
                {analysis.averageEngagement.toFixed(2)}%
              </div>
            </Card>
          </div>

          {/* 标签页 */}
          <Card className="p-6">
            <div className="flex gap-4 border-b border-[rgba(0,0,0,0.08)] pb-4 mb-6">
              <button
                onClick={() => setActiveTab("videos")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "videos"
                    ? "text-[#007AFF]"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                热门视频
              </button>
              <button
                onClick={() => setActiveTab("channels")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "channels"
                    ? "text-[#007AFF]"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                竞品频道
              </button>
              <button
                onClick={() => setActiveTab("trends")}
                className={`text-sm font-medium transition-colors ${
                  activeTab === "trends"
                    ? "text-[#007AFF]"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                内容趋势
              </button>
            </div>

            {/* 视频列表 */}
            {activeTab === "videos" && (
              <div className="space-y-4">
                {analysis.topVideos.map((video, index) => (
                  <div
                    key={video.videoId}
                    className="flex gap-4 p-4 bg-[#F5F5F7] rounded-xl hover:bg-[rgba(0,122,255,0.05)] transition-colors"
                  >
                    <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                        {video.duration}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-sm font-medium text-[#86868B]">#{index + 1}</span>
                        <h3 className="font-medium text-[#1D1D1F] line-clamp-2 flex-1">
                          {video.title}
                        </h3>
                      </div>
                      <p className="text-sm text-[#86868B] mb-2">{video.channelTitle}</p>
                      <div className="flex gap-4 text-xs">
                        <span className="text-[#1D1D1F]">
                          👁 {formatNumber(video.viewCount)}
                        </span>
                        <span className="text-[#1D1D1F]">
                          👍 {formatNumber(video.likeCount)}
                        </span>
                        <span className="text-[#1D1D1F]">
                          💬 {formatNumber(video.commentCount)}
                        </span>
                        <span className="text-[#34C759]">
                          参与度 {video.engagementRate.toFixed(2)}%
                        </span>
                        <span className="text-[#007AFF]">
                          {formatNumber(video.viewsPerDay)}/天
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 频道列表 */}
            {activeTab === "channels" && (
              <div className="space-y-4">
                {analysis.topChannels.map((channel, index) => (
                  <div
                    key={channel.channelId}
                    className="flex items-center gap-4 p-4 bg-[#F5F5F7] rounded-xl hover:bg-[rgba(0,122,255,0.05)] transition-colors"
                  >
                    <div className="text-sm font-medium text-[#86868B] w-8">
                      #{index + 1}
                    </div>
                    <img
                      src={channel.thumbnail}
                      alt={channel.title}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#1D1D1F] mb-1">
                        {channel.title}
                      </h3>
                      <p className="text-sm text-[#86868B] line-clamp-1">
                        {channel.description}
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-[#1D1D1F]">
                          {formatNumber(channel.subscriberCount)}
                        </div>
                        <div className="text-xs text-[#86868B]">订阅数</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-[#1D1D1F]">
                          {formatNumber(channel.videoCount)}
                        </div>
                        <div className="text-xs text-[#86868B]">视频数</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-[#1D1D1F]">
                          {formatNumber(channel.totalViews)}
                        </div>
                        <div className="text-xs text-[#86868B]">总观看</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 趋势分析 */}
            {activeTab === "trends" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 上升趋势 */}
                <div>
                  <h3 className="text-sm font-medium text-[#1D1D1F] mb-3 flex items-center gap-2">
                    📈 上升趋势
                  </h3>
                  <div className="space-y-2">
                    {analysis.trends.rising.map((title, index) => (
                      <div
                        key={index}
                        className="p-3 bg-[rgba(52,199,89,0.1)] rounded-lg text-sm text-[#1D1D1F]"
                      >
                        {title}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 下降趋势 */}
                <div>
                  <h3 className="text-sm font-medium text-[#1D1D1F] mb-3 flex items-center gap-2">
                    📉 需要关注
                  </h3>
                  <div className="space-y-2">
                    {analysis.trends.declining.map((title, index) => (
                      <div
                        key={index}
                        className="p-3 bg-[rgba(255,59,48,0.1)] rounded-lg text-sm text-[#1D1D1F]"
                      >
                        {title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {/* 初始提示 */}
      {!analysis && !loading && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-[#1D1D1F] mb-2">
            开始竞品检测
          </h3>
          <p className="text-sm text-[#86868B]">
            输入关键词，分析竞争对手的视频和频道表现
          </p>
        </Card>
      )}
    </div>
  );
}
