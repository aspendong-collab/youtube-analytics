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
  channelId?: string;
  channelTitle?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  createdAt: string | Date;
  latestStats?: VideoStats | null;
}

interface OptimizationTask {
  videoId: string;
  videoTitle: string;
  priority: 'high' | 'medium' | 'low';
  suggestions: string[];
}

export default function SuggestionsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [optimizationTasks, setOptimizationTasks] = useState<OptimizationTask[]>([]);
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
        generateSuggestions(data.videos || []);
      }
    } catch (error) {
      console.error('加载视频数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = (videos: Video[]) => {
    const tasks: OptimizationTask[] = videos.map((video) => {
      const stats = video.latestStats;
      const views = stats?.viewCount || 0;
      const likes = stats?.likeCount || 0;
      const comments = stats?.commentCount || 0;
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

      const suggestions: string[] = [];

      // 基于标题长度
      if (video.title.length > 60) {
        suggestions.push('标题长度偏长，建议缩短至 60 字符内以提高点击率');
      } else if (video.title.length < 20) {
        suggestions.push('标题偏短，建议增加更多关键词和描述性内容');
      }

      // 基于互动率
      if (engagement < 3) {
        suggestions.push('互动率偏低，建议优化内容开头吸引观众注意力');
      } else if (engagement > 10) {
        suggestions.push('互动率优秀，继续保持内容质量');
      }

      // 基于描述
      if (!video.description || video.description.length < 100) {
        suggestions.push('视频描述过于简单，建议添加更多详细信息');
      }

      // 基于标签
      if (!video.tags || video.tags.length < 3) {
        suggestions.push('标签数量不足，建议添加 5-10 个相关标签以提高搜索可见度');
      }

      // 基于观看量
      if (views < 1000) {
        suggestions.push('观看量较低，建议优化封面图和标题');
        suggestions.push('考虑在热门时间段发布视频');
      }

      // 如果没有建议，提供通用建议
      if (suggestions.length === 0) {
        suggestions.push('视频表现良好，继续保持');
        suggestions.push('可考虑添加更多互动引导（如点赞、评论、关注）');
      }

      // 确定优先级
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (engagement < 3 || views < 1000) {
        priority = 'high';
      } else if (engagement > 10 && views > 10000) {
        priority = 'low';
      }

      return {
        videoId: video.videoId,
        videoTitle: video.title,
        priority,
        suggestions,
      };
    });

    setOptimizationTasks(tasks);
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
            优化建议
          </h1>
          <p className="text-sm text-[#86868B]">
            基于数据分析提供视频优化建议
          </p>
        </div>
        <Card className="p-12 text-center">
          <div className="text-[#86868B] mb-6">
            暂无视频数据，请先添加视频
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
          优化建议
        </h1>
        <p className="text-sm text-[#86868B]">
          基于数据分析提供视频优化建议
        </p>
      </div>

      {/* 优化任务列表 */}
      <div className="space-y-4">
        {optimizationTasks.map((task) => (
          <OptimizationTask
            key={task.videoId}
            videoTitle={task.videoTitle}
            priority={task.priority}
            suggestions={task.suggestions}
          />
        ))}
      </div>
    </div>
  );
}

// 优化任务组件
function OptimizationTask({
  videoTitle,
  priority,
  suggestions,
}: {
  videoTitle: string;
  priority: 'high' | 'medium' | 'low';
  suggestions: string[];
}) {
  const priorityConfig = {
    high: { label: '高优先级', color: 'bg-[#FF3B30]' },
    medium: { label: '中优先级', color: 'bg-[#FF9500]' },
    low: { label: '低优先级', color: 'bg-[#007AFF]' },
  };

  const config = priorityConfig[priority];

  return (
    <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-[#1D1D1F]">{videoTitle}</h3>
        <span className={`px-3 py-1 rounded-full text-xs text-white ${config.color}`}>
          {config.label}
        </span>
      </div>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="text-[#007AFF] mt-1">💡</span>
            <p className="text-sm text-[#1D1D1F]">{suggestion}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-4 pt-4 border-t border-[rgba(0,0,0,0.08)]">
        <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm hover:bg-[#0056CC]">
          标记为已处理
        </button>
        <button className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-lg text-sm hover:bg-[#E5E5EA]">
          查看详情
        </button>
      </div>
    </Card>
  );
}
