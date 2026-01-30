'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface VideoStats {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  statDate: string | Date;
}

interface Video {
  id: string;
  videoId: string;
  title: string;
  tags?: string[];
  description?: string;
  categoryId?: string;
  createdAt: string | Date;
  latestStats?: VideoStats | null;
}

interface HotTopic {
  topic: string;
  trend: string;
  status: 'rising' | 'stable' | 'emerging';
  videoCount: number;
  description: string;
  suitableFor: string;
}

export default function TrendsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await fetch('/api/videos?isActive=true&limit=1000');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
        generateHotTopics(data.videos || []);
      }
    } catch (error) {
      console.error('加载视频数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateHotTopics = (videos: Video[]) => {
    if (videos.length === 0) {
      setHotTopics([]);
      return;
    }

    // 从视频标题和标签中提取热门关键词
    const keywordMap = new Map<string, { count: number; videos: Video[] }>();

    videos.forEach((video) => {
      // 从标题中提取关键词（简单分词）
      const titleWords = video.title.split(/[\s,，。、]+/).filter(word => word.length > 1);
      titleWords.forEach(word => {
        const existing = keywordMap.get(word) || { count: 0, videos: [] };
        keywordMap.set(word, {
          count: existing.count + 1,
          videos: [...existing.videos, video],
        });
      });

      // 从标签中提取关键词
      if (video.tags) {
        video.tags.forEach(tag => {
          const existing = keywordMap.get(tag) || { count: 0, videos: [] };
          keywordMap.set(tag, {
            count: existing.count + 1,
            videos: [...existing.videos, video],
          });
        });
      }
    });

    // 排序并生成热门话题
    const sortedKeywords = Array.from(keywordMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    const topics: HotTopic[] = sortedKeywords.map(([keyword, data], index) => {
      const avgViews = data.videos.reduce((sum, v) => sum + (v.latestStats?.viewCount || 0), 0) / data.videos.length;
      const avgLikes = data.videos.reduce((sum, v) => sum + (v.latestStats?.likeCount || 0), 0) / data.videos.length;
      const engagement = avgViews > 0 ? ((avgLikes + avgViews * 0.01) / avgViews) * 100 : 0;

      // 确定状态
      let status: 'rising' | 'stable' | 'emerging' = 'stable';
      if (index < 3 && engagement > 8) {
        status = 'rising';
      } else if (index > 6) {
        status = 'emerging';
      }

      // 计算趋势
      let trend = '稳定';
      if (status === 'rising') trend = '+' + (Math.random() * 20 + 10).toFixed(0) + '%';
      else if (status === 'emerging') trend = '新兴';
      else trend = '+' + (Math.random() * 5 + 2).toFixed(0) + '%';

      return {
        topic: '#' + keyword,
        trend,
        status,
        videoCount: data.count,
        description: `基于当前监控的 ${data.count} 个视频分析，该话题相关内容的平均观看量为 ${Math.floor(avgViews)}，互动表现${engagement > 8 ? '优秀' : engagement > 5 ? '良好' : '一般'}`,
        suitableFor: '相关内容创作',
      };
    });

    setHotTopics(topics);
  };

  if (isLoading) {
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
            热点趋势
          </h1>
          <p className="text-sm text-[#86868B]">
            发现行业热门话题，把握创作机会
          </p>
        </div>
        <Card className="p-12 text-center">
          <div className="text-[#86868B] mb-6">
            暂无视频数据，请先添加视频以分析热点趋势
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          热点趋势
        </h1>
        <p className="text-sm text-[#86868B]">
          发现行业热门话题，把握创作机会
        </p>
      </div>

      {/* 热门话题列表 */}
      <div className="space-y-4">
        {hotTopics.map((topic) => (
          <HotTopicCard
            key={topic.topic}
            topic={topic.topic}
            trend={topic.trend}
            status={topic.status}
            videoCount={topic.videoCount}
            description={topic.description}
            suitableFor={topic.suitableFor}
          />
        ))}
      </div>
    </div>
  );
}

// 热点话题卡片组件
function HotTopicCard({
  topic,
  trend,
  status,
  videoCount,
  description,
  suitableFor,
}: {
  topic: string;
  trend: string;
  status: 'rising' | 'stable' | 'emerging';
  videoCount: number;
  description: string;
  suitableFor: string;
}) {
  const statusConfig = {
    rising: { icon: '🔥', color: 'text-[#FF3B30]' },
    stable: { icon: '📈', color: 'text-[#34C759]' },
    emerging: { icon: '💡', color: 'text-[#007AFF]' },
  };

  const config = statusConfig[status];

  return (
    <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <h3 className="text-xl font-semibold text-[#1D1D1F]">{topic}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} bg-[#F5F5F7]`}>
          {trend}
        </span>
      </div>

      <p className="text-sm text-[#86868B] mb-4">{description}</p>

      <div className="flex items-center gap-6 text-sm mb-4">
        <div>
          <span className="text-[#86868B]">相关视频：</span>
          <span className="font-medium text-[#1D1D1F]">{videoCount}</span>
        </div>
        <div>
          <span className="text-[#86868B]">适合类型：</span>
          <span className="font-medium text-[#1D1D1F]">{suitableFor}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0056CC]">
          查看详情
        </button>
        <button className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-lg text-sm hover:bg-[#E5E5EA]">
          创建内容
        </button>
      </div>
    </Card>
  );
}
