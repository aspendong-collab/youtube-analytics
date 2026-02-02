'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heatmap } from '@/components/charts/heatmap';
import { toast } from 'sonner';

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
  categoryId?: string;
  createdAt: string | Date;
  latestStats?: VideoStats | null;
}

interface TitleAnalysis {
  score: number;
  keywordCoverage: string;
  lengthAnalysis: string;
  suggestions: string[];
  optimizationReasons: string[];
}

interface TagAnalysis {
  coreKeywords: Array<{ tag: string; searchVolume: string; reason: string }>;
  longTailKeywords: Array<{ tag: string; searchVolume: string; reason: string }>;
  relatedTopics: Array<{ tag: string; searchVolume: string; reason: string }>;
  competitorKeywords: Array<{ tag: string; searchVolume: string; reason: string }>;
  allTags: string[];
}

interface DescriptionAnalysis {
  optimizedDescription: string;
  tips: string[];
}

export default function SuggestionsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  
  // AI 分析状态
  const [titleAnalysis, setTitleAnalysis] = useState<TitleAnalysis | null>(null);
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis | null>(null);
  const [descriptionAnalysis, setDescriptionAnalysis] = useState<DescriptionAnalysis | null>(null);
  const [publishTimeData, setPublishTimeData] = useState<any>(null);
  const [thumbnailAnalysis, setThumbnailAnalysis] = useState<any>(null);
  const [competitionAnalysis, setCompetitionAnalysis] = useState<any>(null);
  const [trendsAnalysis, setTrendsAnalysis] = useState<any>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<any>(null);
  const [contentDiagnosis, setContentDiagnosis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 基础建议
  const [basicSuggestions, setBasicSuggestions] = useState<any[]>([]);

  useEffect(() => {
    loadVideos();
    loadPublishTimeData();
    loadTrendsData();
    loadAudienceData();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await fetch('/api/videos?isActive=true&limit=1000');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
        if (data.videos && data.videos.length > 0) {
          setSelectedVideo(data.videos[0]);
          generateBasicSuggestions(data.videos);
        }
      }
    } catch (error) {
      console.error('加载视频数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublishTimeData = async () => {
    try {
      const response = await fetch('/api/suggestions/publish-time');
      if (response.ok) {
        const data = await response.json();
        setPublishTimeData(data || {
          topTimes: [],
          heatmap: [],
          averageViews: 0,
          recommendations: [],
          summary: {
            totalAnalyzed: 0,
            uniqueTimeSlots: 0,
            bestTimeSlot: '数据不足',
            worstTimeSlot: '数据不足',
          },
        });
      }
    } catch (error) {
      console.error('加载发布时间数据失败:', error);
      setPublishTimeData({
        topTimes: [],
        heatmap: [],
        averageViews: 0,
        recommendations: [],
        summary: {
          totalAnalyzed: 0,
          uniqueTimeSlots: 0,
          bestTimeSlot: '数据不足',
          worstTimeSlot: '数据不足',
        },
      });
    }
  };

  const generateBasicSuggestions = (videos: Video[]) => {
    const tasks = videos.map((video) => {
      const stats = video.latestStats;
      const views = stats?.viewCount || 0;
      const likes = stats?.likeCount || 0;
      const comments = stats?.commentCount || 0;
      const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

      const suggestions: string[] = [];

      if (video.title.length > 60) {
        suggestions.push('标题长度偏长，建议缩短至 60 字符内以提高点击率');
      } else if (video.title.length < 20) {
        suggestions.push('标题偏短，建议增加更多关键词和描述性内容');
      }

      if (engagement < 3) {
        suggestions.push('互动率偏低，建议优化内容开头吸引观众注意力');
      } else if (engagement > 10) {
        suggestions.push('互动率优秀，继续保持内容质量');
      }

      if (!video.description || video.description.length < 100) {
        suggestions.push('视频描述过于简单，建议添加更多详细信息');
      }

      if (!video.tags || video.tags.length < 3) {
        suggestions.push('标签数量不足，建议添加 5-10 个相关标签以提高搜索可见度');
      }

      if (views < 1000) {
        suggestions.push('观看量较低，建议优化封面图和标题');
      }

      if (suggestions.length === 0) {
        suggestions.push('视频表现良好，继续保持');
      }

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
        engagement,
        views,
      };
    });

    setBasicSuggestions(tasks);
  };

  const analyzeTitle = async () => {
    if (!selectedVideo) {
      toast.error('请先选择一个视频');
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/suggestions/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedVideo.title,
          category: selectedVideo.categoryId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setTitleAnalysis(data);
        toast.success('标题分析完成');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '标题分析失败');
      }
    } catch (error) {
      console.error('标题分析失败:', error);
      toast.error('标题分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeTags = async () => {
    if (!selectedVideo) {
      toast.error('请先选择一个视频');
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/suggestions/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedVideo.title,
          description: selectedVideo.description,
          category: selectedVideo.categoryId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setTagAnalysis(data);
        toast.success('标签生成完成');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '标签生成失败');
      }
    } catch (error) {
      console.error('标签分析失败:', error);
      toast.error('标签生成失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeDescription = async () => {
    if (!selectedVideo) {
      toast.error('请先选择一个视频');
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/suggestions/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedVideo.title,
          description: selectedVideo.description,
          category: selectedVideo.categoryId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setDescriptionAnalysis(data);
        toast.success('描述优化完成');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '描述优化失败');
      }
    } catch (error) {
      console.error('描述分析失败:', error);
      toast.error('描述优化失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeThumbnail = async () => {
    if (!selectedVideo) {
      toast.error('请先选择一个视频');
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/suggestions/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thumbnailUrl: selectedVideo.thumbnail,
          title: selectedVideo.title,
          category: selectedVideo.categoryId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setThumbnailAnalysis(data);
        toast.success('封面分析完成');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '封面分析失败');
      }
    } catch (error) {
      console.error('封面分析失败:', error);
      toast.error('封面分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeCompetition = async () => {
    if (!selectedVideo) {
      toast.error('请先选择一个视频');
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/suggestions/competition?videoId=${selectedVideo.videoId}`);
      if (response.ok) {
        const data = await response.json();
        setCompetitionAnalysis(data);
        toast.success('竞争分析完成');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '竞争分析失败');
      }
    } catch (error) {
      console.error('竞争分析失败:', error);
      toast.error('竞争分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadTrendsData = async () => {
    try {
      const response = await fetch('/api/suggestions/trends');
      if (response.ok) {
        const data = await response.json();
        setTrendsAnalysis(data);
      }
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  };

  const loadAudienceData = async () => {
    try {
      const response = await fetch('/api/suggestions/audience');
      if (response.ok) {
        const data = await response.json();
        setAudienceAnalysis(data);
      }
    } catch (error) {
      console.error('加载受众数据失败:', error);
    }
  };

  const analyzeContent = async () => {
    if (!selectedVideo) {
      toast.error('请先选择一个视频');
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/suggestions/content-diagnosis?videoId=${selectedVideo.videoId}`);
      if (response.ok) {
        const data = await response.json();
        setContentDiagnosis(data);
        toast.success('内容诊断完成');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '内容诊断失败');
      }
    } catch (error) {
      console.error('内容诊断失败:', error);
      toast.error('内容诊断失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 10000).toFixed(1) + 'W';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
            AI 驱动的视频优化建议
          </p>
        </div>
        <Card className="p-12 text-center">
          <div className="text-[#86868B]">
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
          AI 驱动的视频优化建议
        </p>
      </div>

      {/* 视频选择器 */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[#86868B]">选择视频：</span>
          <select
            value={selectedVideo?.videoId || ''}
            onChange={(e) => {
              const video = videos.find(v => v.videoId === e.target.value);
              setSelectedVideo(video || null);
              // 重置分析结果
              setTitleAnalysis(null);
              setTagAnalysis(null);
              setDescriptionAnalysis(null);
              setThumbnailAnalysis(null);
              setCompetitionAnalysis(null);
            }}
            className="flex-1 max-w-md px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
          >
            {videos.map(video => (
              <option key={video.videoId} value={video.videoId}>
                {video.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* AI 优化建议 - 竖向布局 */}
      <div className="flex gap-6">
        {/* 左侧导航 */}
        <Card className="w-64 p-4 h-fit sticky top-8">
          <h2 className="text-sm font-medium text-[#86868B] mb-3">分析板块</h2>
          <nav className="space-y-1">
            {[
              { id: 'basic', label: '基础分析', icon: '📊' },
              { id: 'title', label: '标题优化', icon: '📝' },
              { id: 'tags', label: '标签生成', icon: '🏷️' },
              { id: 'description', label: '描述优化', icon: '📄' },
              { id: 'thumbnail', label: '封面分析', icon: '🖼️' },
              { id: 'competition', label: '竞争分析', icon: '⚔️' },
              { id: 'content-diagnosis', label: '内容诊断', icon: '🔍' },
              { id: 'trends', label: '趋势洞察', icon: '🔥' },
              { id: 'audience', label: '受众分析', icon: '👥' },
              { id: 'publish-time', label: '发布时间', icon: '⏰' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center gap-3 ${
                  activeTab === item.id
                    ? 'bg-[#007AFF] text-white font-medium'
                    : 'text-[#1D1D1F] hover:bg-[rgba(0,122,255,0.08)]'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* 右侧内容 */}
        <div className="flex-1 space-y-6">
          {activeTab === 'basic' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">基础数据概览</h2>
                {selectedVideo && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#F5F5F7] p-4 rounded-lg">
                  <div className="text-sm text-[#86868B] mb-1">播放量</div>
                  <div className="text-2xl font-bold text-[#1D1D1F]">
                    {formatNumber(selectedVideo.latestStats?.viewCount || 0)}
                  </div>
                </div>
                <div className="bg-[#F5F5F7] p-4 rounded-lg">
                  <div className="text-sm text-[#86868B] mb-1">互动率</div>
                  <div className="text-2xl font-bold text-[#007AFF]">
                    {(
                      ((selectedVideo.latestStats?.likeCount || 0) + (selectedVideo.latestStats?.commentCount || 0)) / 
                      (selectedVideo.latestStats?.viewCount || 1) * 100
                    ).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-[#F5F5F7] p-4 rounded-lg">
                  <div className="text-sm text-[#86868B] mb-1">标题长度</div>
                  <div className="text-2xl font-bold text-[#1D1D1F]">
                    {selectedVideo.title.length}
                  </div>
                </div>
                <div className="bg-[#F5F5F7] p-4 rounded-lg">
                  <div className="text-sm text-[#86868B] mb-1">标签数量</div>
                  <div className="text-2xl font-bold text-[#1D1D1F]">
                    {selectedVideo.tags?.length || 0}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">所有视频优化建议</h2>
            <div className="space-y-3">
              {basicSuggestions.map((task) => (
                <div key={task.videoId} className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-[#1D1D1F]">{task.videoTitle}</h3>
                    <Badge
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                    >
                      {task.priority === 'high' ? '高优先级' : task.priority === 'medium' ? '中优先级' : '低优先级'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {task.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#007AFF] mt-1">💡</span>
                        <p className="text-sm text-[#1D1D1F]">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
              </Card>
            </>
          )}

          {/* 标题优化 */}
          {activeTab === 'title' && (
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">标题优化</h2>
              <Button onClick={analyzeTitle} disabled={isAnalyzing}>
                {isAnalyzing ? '分析中...' : '开始分析'}
              </Button>
            </div>
            
            {selectedVideo && (
              <div className="mb-4">
                <div className="text-sm text-[#86868B] mb-2">原标题：</div>
                <div className="p-3 bg-[#F5F5F7] rounded-lg">{selectedVideo.title}</div>
              </div>
            )}

            {titleAnalysis && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-[#86868B] mb-2">吸引力评分：</div>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl font-bold text-[#007AFF]">{titleAnalysis.score}/10</div>
                    <Badge variant={titleAnalysis.score >= 7 ? 'default' : titleAnalysis.score >= 5 ? 'secondary' : 'destructive'}>
                      {titleAnalysis.score >= 7 ? '优秀' : titleAnalysis.score >= 5 ? '良好' : '需改进'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-[#86868B] mb-2">关键词覆盖度：</div>
                  <div className="p-3 bg-[#F5F5F7] rounded-lg">{titleAnalysis.keywordCoverage}</div>
                </div>

                <div>
                  <div className="text-sm text-[#86868B] mb-2">标题长度分析：</div>
                  <div className="p-3 bg-[#F5F5F7] rounded-lg">{titleAnalysis.lengthAnalysis}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">优化建议：</div>
                  <div className="space-y-2">
                    {titleAnalysis.suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 bg-[#F5F5F7] rounded-lg">
                        <span className="text-sm text-[#1D1D1F]">{index + 1}. {suggestion}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">优化理由：</div>
                  <div className="space-y-1">
                    {titleAnalysis.optimizationReasons.map((reason, index) => (
                      <div key={index} className="text-sm text-[#1D1D1F]">• {reason}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
          )}

          {/* 标签生成 */}
          {activeTab === 'tags' && (
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">标签生成</h2>
              <Button onClick={analyzeTags} disabled={isAnalyzing}>
                {isAnalyzing ? '生成中...' : '生成标签'}
              </Button>
            </div>

            {tagAnalysis && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">核心关键词：</div>
                  <div className="flex flex-wrap gap-2">
                    {tagAnalysis.coreKeywords.map((keyword, index) => (
                      <Badge key={index} variant="default">
                        {keyword.tag} <span className="ml-1 text-xs opacity-70">({keyword.searchVolume})</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">长尾关键词：</div>
                  <div className="flex flex-wrap gap-2">
                    {tagAnalysis.longTailKeywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary">
                        {keyword.tag} <span className="ml-1 text-xs opacity-70">({keyword.searchVolume})</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">所有标签（可直接复制）：</div>
                  <div className="p-3 bg-[#F5F5F7] rounded-lg">
                    <code className="text-sm text-[#1D1D1F]">
                      {tagAnalysis.allTags.join(', ')}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </Card>
          )}

          {/* 描述优化 */}
          {activeTab === 'description' && (
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">描述优化</h2>
              <Button onClick={analyzeDescription} disabled={isAnalyzing}>
                {isAnalyzing ? '生成中...' : '生成描述'}
              </Button>
            </div>

            {selectedVideo && selectedVideo.description && (
              <div className="mb-4">
                <div className="text-sm text-[#86868B] mb-2">原描述：</div>
                <div className="p-3 bg-[#F5F5F7] rounded-lg text-sm max-h-40 overflow-y-auto">
                  {selectedVideo.description}
                </div>
              </div>
            )}

            {descriptionAnalysis && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">优化后的描述：</div>
                  <div className="p-3 bg-[#F5F5F7] rounded-lg text-sm whitespace-pre-wrap">
                    {descriptionAnalysis.optimizedDescription}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">优化提示：</div>
                  <div className="space-y-1">
                    {descriptionAnalysis.tips.map((tip, index) => (
                      <div key={index} className="text-sm text-[#1D1D1F]">• {tip}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
          )}

          {/* 封面分析 */}
          {activeTab === 'thumbnail' && (
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">封面图分析</h2>
              <Button onClick={analyzeThumbnail} disabled={isAnalyzing}>
                {isAnalyzing ? '分析中...' : '开始分析'}
              </Button>
            </div>

            {selectedVideo && selectedVideo.thumbnail && (
              <div className="mb-6">
                <div className="text-sm text-[#86868B] mb-2">当前封面图：</div>
                <div className="flex justify-center">
                  <img
                    src={selectedVideo.thumbnail}
                    alt="封面图"
                    className="rounded-lg max-w-md w-full object-cover"
                  />
                </div>
              </div>
            )}

            {thumbnailAnalysis && (
              <div className="space-y-6">
                {/* 综合评分 */}
                <div>
                  <div className="text-sm text-[#86868B] mb-2">综合评分：</div>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl font-bold text-[#007AFF]">{thumbnailAnalysis.overallScore}/10</div>
                    <Badge variant={thumbnailAnalysis.overallScore >= 7 ? 'default' : thumbnailAnalysis.overallScore >= 5 ? 'secondary' : 'destructive'}>
                      {thumbnailAnalysis.overallScore >= 7 ? '优秀' : thumbnailAnalysis.overallScore >= 5 ? '良好' : '需改进'}
                    </Badge>
                  </div>
                </div>

                {/* 分项评分 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-2">视觉冲击力</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-[#1D1D1F]">{thumbnailAnalysis.visualImpact}/10</div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#007AFF]"
                          style={{ width: `${thumbnailAnalysis.visualImpact * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-2">文字可读性</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-[#1D1D1F]">{thumbnailAnalysis.textReadability}/10</div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#007AFF]"
                          style={{ width: `${thumbnailAnalysis.textReadability * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-2">标题相关性</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-[#1D1D1F]">{thumbnailAnalysis.titleRelevance}/10</div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#007AFF]"
                          style={{ width: `${thumbnailAnalysis.titleRelevance * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-2">分类风格</div>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-[#1D1D1F]">{thumbnailAnalysis.categoryStyle}/10</div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#007AFF]"
                          style={{ width: `${thumbnailAnalysis.categoryStyle * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 改进建议 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">改进建议：</div>
                  <div className="space-y-2">
                    {thumbnailAnalysis.improvements?.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-[#F5F5F7] rounded-lg">
                        <span className="text-[#007AFF] mt-1">💡</span>
                        <p className="text-sm text-[#1D1D1F]">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 理想设计 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">理想封面设计：</div>
                  <div className="p-3 bg-[#F5F5F7] rounded-lg text-sm">
                    {thumbnailAnalysis.idealDesign}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

          {/* 竞争分析 */}
          {activeTab === 'competition' && (
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">竞争分析</h2>
              <Button onClick={analyzeCompetition} disabled={isAnalyzing}>
                {isAnalyzing ? '分析中...' : '开始分析'}
              </Button>
            </div>

            {competitionAnalysis && (
              <div className="space-y-6">
                {/* 目标视频表现 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-3">目标视频表现：</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="text-sm text-[#86868B] mb-1">播放量</div>
                      <div className="text-2xl font-bold text-[#1D1D1F]">
                        {formatNumber(competitionAnalysis.targetVideo.views || 0)}
                      </div>
                    </div>
                    <div className="p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="text-sm text-[#86868B] mb-1">互动率</div>
                      <div className="text-2xl font-bold text-[#007AFF]">
                        {(competitionAnalysis.targetVideo.engagement || 0).toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="text-sm text-[#86868B] mb-1">合作费用</div>
                      <div className="text-2xl font-bold text-[#1D1D1F]">
                        ${(competitionAnalysis.targetVideo.cost || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 同类视频基准 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-3">同类视频基准对比：</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-[#007AFF]">📊</span>
                        <span className="text-sm text-[#1D1D1F]">同类视频平均播放量</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-[#1D1D1F]">
                          {formatNumber(competitionAnalysis.categoryBenchmark.avgViews || 0)}
                        </span>
                        <Badge variant={competitionAnalysis.comparison?.viewsAboveCategoryAvg?.startsWith('+') ? 'default' : 'destructive'}>
                          {competitionAnalysis.comparison?.viewsAboveCategoryAvg || '0%'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-[#007AFF]">📊</span>
                        <span className="text-sm text-[#1D1D1F]">同类视频平均互动率</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-[#1D1D1F]">
                          {(competitionAnalysis.categoryBenchmark.avgEngagement || 0).toFixed(1)}%
                        </span>
                        <Badge variant={competitionAnalysis.comparison?.engagementAboveCategoryAvg?.startsWith('+') ? 'default' : 'destructive'}>
                          {competitionAnalysis.comparison?.engagementAboveCategoryAvg || '0%'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-[#007AFF]">📊</span>
                        <span className="text-sm text-[#1D1D1F]">同类视频排名</span>
                      </div>
                      <div className="text-lg font-semibold text-[#1D1D1F]">
                        第 {competitionAnalysis.categoryBenchmark.yourRanking} / {competitionAnalysis.categoryBenchmark.sampleSize}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 博主历史基准 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-3">博主历史基准对比：</div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-[#007AFF]">📈</span>
                        <span className="text-sm text-[#1D1D1F]">博主平均播放量</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-[#1D1D1F]">
                          {formatNumber(competitionAnalysis.channelBenchmark.avgViews || 0)}
                        </span>
                        <Badge variant={competitionAnalysis.comparison?.viewsAboveChannelAvg?.startsWith('+') ? 'default' : 'destructive'}>
                          {competitionAnalysis.comparison?.viewsAboveChannelAvg || '0%'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-[#007AFF]">📈</span>
                        <span className="text-sm text-[#1D1D1F]">博主平均互动率</span>
                      </div>
                      <div className="text-lg font-semibold text-[#1D1D1F]">
                        {(competitionAnalysis.channelBenchmark.avgEngagement || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* 优化建议 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">竞争分析建议：</div>
                  <div className="space-y-2">
                    {competitionAnalysis.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-[#F5F5F7] rounded-lg">
                        <span className="text-[#007AFF] mt-1">💡</span>
                        <p className="text-sm text-[#1D1D1F]">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOP 竞品视频 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-3">TOP 5 竞品视频：</div>
                  <div className="space-y-2">
                    {competitionAnalysis.topCompetitors?.map((competitor: any, index: number) => (
                      <div key={index} className="p-4 bg-[#F5F5F7] rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium text-[#1D1D1F] truncate max-w-xs">
                              {competitor.title || '未命名视频'}
                            </span>
                          </div>
                          <Badge variant="secondary">{competitor.channelTitle || '未知博主'}</Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <div className="text-[#86868B]">播放量</div>
                            <div className="font-medium text-[#1D1D1F]">{formatNumber(competitor.views || 0)}</div>
                          </div>
                          <div>
                            <div className="text-[#86868B]">互动率</div>
                            <div className="font-medium text-[#007AFF]">{(competitor.engagement || 0).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-[#86868B]">成本</div>
                            <div className="font-medium text-[#1D1D1F]">${(competitor.cost || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-[#86868B]">CPV</div>
                            <div className="font-medium text-[#1D1D1F]">${(competitor.cpv || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

          {/* 发布时间分析 */}
          {activeTab === 'publish-time' && (
            <Card className="p-6">
            <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">最佳发布时间分析</h2>
            
            {publishTimeData ? (
              <div className="space-y-6">
                {/* TOP 5 黄金时段 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-3">TOP 5 黄金时段：</div>
                  <div className="space-y-2">
                    {publishTimeData.topTimes.map((time: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-[#1D1D1F]">{time.dayName} {time.hour}:00</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#007AFF]">
                            {formatNumber(time.avgViews)}
                          </div>
                          <div className="text-xs text-[#86868B]">
                            高于平均 {time.aboveAvg}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 发布时间热力图 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-3">发布时间热力图：</div>
                  <div className="flex justify-center">
                    <Heatmap
                      data={publishTimeData.heatmap}
                      valueLabel="平均播放量"
                      cellSize={32}
                      colorScale={['#F5F5F7', '#FFE5E5', '#FFCCCC', '#FF9999', '#FF6666', '#FF3333', '#FF0000']}
                    />
                  </div>
                </div>

                {/* 优化建议 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-2">优化建议：</div>
                  <div className="space-y-2">
                    {publishTimeData.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#007AFF] mt-1">💡</span>
                        <p className="text-sm text-[#1D1D1F]">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 数据概览 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">分析视频数</div>
                    <div className="text-2xl font-bold text-[#1D1D1F]">
                      {publishTimeData.summary?.totalAnalyzed || 0}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">最佳时段</div>
                    <div className="text-lg font-bold text-[#007AFF]">
                      {publishTimeData.summary?.bestTimeSlot || '数据不足'}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">平均播放量</div>
                    <div className="text-2xl font-bold text-[#1D1D1F]">
                      {formatNumber(publishTimeData.averageViews || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#86868B]">加载中...</div>
            )}
          </Card>
          )}

          {/* 内容诊断 */}
          {activeTab === 'content-diagnosis' && (
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">内容诊断</h2>
              <Button onClick={analyzeContent} disabled={isAnalyzing}>
                {isAnalyzing ? '诊断中...' : '开始诊断'}
              </Button>
            </div>

            {contentDiagnosis && (
              <div className="space-y-6">
                {/* 综合得分 */}
                <div className="text-center p-6 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm text-[#86868B] mb-2">内容综合得分</div>
                  <div className="text-5xl font-bold text-[#007AFF]">{contentDiagnosis.overallScore}/100</div>
                  <Badge 
                    variant={parseFloat(contentDiagnosis.overallScore) >= 80 ? 'default' : 
                            parseFloat(contentDiagnosis.overallScore) >= 60 ? 'secondary' : 'destructive'}
                    className="mt-2"
                  >
                    {parseFloat(contentDiagnosis.overallScore) >= 80 ? '优秀' : 
                     parseFloat(contentDiagnosis.overallScore) >= 60 ? '良好' : '需改进'}
                  </Badge>
                </div>

                {/* 优势 */}
                {contentDiagnosis.strengths && contentDiagnosis.strengths.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-2">✅ 内容优势：</div>
                    <div className="space-y-2">
                      {contentDiagnosis.strengths.map((strength: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
                          <span className="text-green-600 mt-1">💪</span>
                          <p className="text-sm text-[#1D1D1F]">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 问题 */}
                {contentDiagnosis.issues && contentDiagnosis.issues.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-2">⚠️ 需要改进的问题：</div>
                    <div className="space-y-2">
                      {contentDiagnosis.issues.map((issue: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                          <span className="text-red-600 mt-1">⚠️</span>
                          <p className="text-sm text-[#1D1D1F]">{issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 建议 */}
                {contentDiagnosis.recommendations && contentDiagnosis.recommendations.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-2">💡 优化建议：</div>
                    <div className="space-y-2">
                      {contentDiagnosis.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-[#F5F5F7] rounded-lg">
                          <span className="text-[#007AFF] mt-1">💡</span>
                          <p className="text-sm text-[#1D1D1F]">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 分项评分 */}
                {contentDiagnosis.dimensions && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-3">分项评分：</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(contentDiagnosis.dimensions).map(([key, dim]: [string, any]) => (
                        <div key={key} className="p-4 bg-[#F5F5F7] rounded-lg">
                          <div className="text-sm text-[#86868B] mb-2">
                            {key === 'title' ? '标题' :
                             key === 'description' ? '描述' :
                             key === 'tags' ? '标签' :
                             key === 'duration' ? '时长' :
                             key === 'publishTime' ? '发布时间' :
                             key === 'engagement' ? '互动数据' :
                             key === 'cost' ? '成本效益' :
                             key === 'channelPerformance' ? '博主表现' : key}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-[#1D1D1F]">{dim.score || 0}/100</div>
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#007AFF]"
                                style={{ width: `${dim.score || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          )}

          {/* 趋势洞察 */}
          {activeTab === 'trends' && (
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">趋势洞察</h2>
              <Button onClick={loadTrendsData} disabled={isAnalyzing}>
                {isAnalyzing ? '分析中...' : '刷新数据'}
              </Button>
            </div>

            {trendsAnalysis && (
              <div className="space-y-6">
                {/* 数据概览 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">分析视频数</div>
                    <div className="text-2xl font-bold text-[#1D1D1F]">{trendsAnalysis.summary?.totalVideosAnalyzed || 0}</div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">高增长视频</div>
                    <div className="text-2xl font-bold text-[#007AFF]">{trendsAnalysis.summary?.highGrowthVideosCount || 0}</div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">平均增长率</div>
                    <div className="text-2xl font-bold text-[#1D1D1F]">{trendsAnalysis.summary?.avgGrowthRate || 0}</div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">TOP趋势</div>
                    <div className="text-lg font-bold text-[#007AFF] truncate">{trendsAnalysis.summary?.topTrend || '暂无'}</div>
                  </div>
                </div>

                {/* 热门话题 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-3">🔥 当前热门话题：</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {trendsAnalysis.hotTopics?.map((topic: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        index === 0 ? 'bg-red-50 border border-red-200' :
                        index === 1 ? 'bg-orange-50 border border-orange-200' :
                        index === 2 ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-[#F5F5F7]'
                      }`}>
                        <div className="font-medium text-[#1D1D1F] mb-1">{topic.topic}</div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#86868B]">{formatNumber(topic.totalViews)} 播放</span>
                          <Badge variant="outline" className="text-xs">{topic.popularity}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 高增长视频 */}
                {trendsAnalysis.highGrowthVideos && trendsAnalysis.highGrowthVideos.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-3">📈 高增长视频案例：</div>
                    <div className="space-y-2">
                      {trendsAnalysis.highGrowthVideos.slice(0, 5).map((video: any, index: number) => (
                        <div key={index} className="p-3 bg-[#F5F5F7] rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-[#1D1D1F] mb-1">{video.title}</div>
                              <div className="text-xs text-[#86868B] mb-2">{video.channelTitle}</div>
                              <div className="flex flex-wrap gap-1">
                                {video.tags?.slice(0, 3).map((tag: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-semibold text-[#007AFF]">{video.growthRate}</div>
                              <div className="text-xs text-[#86868B]">{video.engagement}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 高增长特征 */}
                {trendsAnalysis.highGrowthFeatures && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-3">📊 高增长视频共同特征：</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-[#F5F5F7] rounded-lg">
                        <div className="text-sm text-[#86868B] mb-2">常见标签</div>
                        <div className="flex flex-wrap gap-2">
                          {trendsAnalysis.highGrowthFeatures.commonTags?.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-[#F5F5F7] rounded-lg">
                        <div className="text-sm text-[#86868B] mb-2">平均增长率</div>
                        <div className="text-2xl font-bold text-[#007AFF]">{trendsAnalysis.highGrowthFeatures.avgGrowthRate}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 内容创作建议 */}
                {trendsAnalysis.suggestions && trendsAnalysis.suggestions.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-2">💡 内容创作建议：</div>
                    <div className="space-y-2">
                      {trendsAnalysis.suggestions.map((suggestion: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-[#F5F5F7] rounded-lg">
                          <span className="text-[#007AFF] mt-1">💡</span>
                          <p className="text-sm text-[#1D1D1F]">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          )}

          {/* 受众分析 */}
          {activeTab === 'audience' && (
            <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1D1D1F]">受众分析</h2>
              <Button onClick={loadAudienceData} disabled={isAnalyzing}>
                {isAnalyzing ? '分析中...' : '刷新数据'}
              </Button>
            </div>

            {audienceAnalysis && (
              <div className="space-y-6">
                {/* 数据概览 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">视频总数</div>
                    <div className="text-2xl font-bold text-[#1D1D1F]">{audienceAnalysis.summary?.totalVideos || 0}</div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">总播放量</div>
                    <div className="text-2xl font-bold text-[#1D1D1F]">{formatNumber(audienceAnalysis.summary?.totalViews || 0)}</div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">平均互动率</div>
                    <div className="text-2xl font-bold text-[#007AFF]">{audienceAnalysis.summary?.avgEngagementRate || 0}</div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">最受欢迎分类</div>
                    <div className="text-lg font-bold text-[#007AFF] truncate">{audienceAnalysis.summary?.topCategory || '无'}</div>
                  </div>
                </div>

                {/* 受众偏好 */}
                <div>
                  <div className="text-sm font-medium text-[#86868B] mb-3">👥 受众内容偏好：</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="text-sm text-[#86868B] mb-2">偏好内容类型</div>
                      <div className="space-y-2">
                        {audienceAnalysis.audiencePreferences?.preferredContentTypes?.slice(0, 3).map((type: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-[#007AFF] rounded-full" />
                            <span className="text-sm text-[#1D1D1F]">{type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="text-sm text-[#86868B] mb-2">偏好时长</div>
                      <div className="text-lg font-semibold text-[#007AFF]">{audienceAnalysis.audiencePreferences?.preferredDuration || '未知'}</div>
                    </div>
                    <div className="p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="text-sm text-[#86868B] mb-2">平均观看时长</div>
                      <div className="text-lg font-semibold text-[#1D1D1F]">{audienceAnalysis.audiencePreferences?.avgWatchTime || '未知'}</div>
                    </div>
                  </div>
                </div>

                {/* 分类表现 */}
                {audienceAnalysis.audiencePreferences?.preferredCategories && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-3">📊 分类表现：</div>
                    <div className="space-y-2">
                      {audienceAnalysis.audiencePreferences.preferredCategories.slice(0, 5).map((cat: any, index: number) => (
                        <div key={index} className="p-3 bg-[#F5F5F7] rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-500' :
                                index === 2 ? 'bg-orange-500' :
                                'bg-gray-400'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="font-medium text-[#1D1D1F]">{cat.category}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-[#86868B]">{cat.share}</div>
                              <div className="text-xs text-[#007AFF]">{cat.avgEngagement}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 最佳发布时间 */}
                {audienceAnalysis.optimalPostingTimes && audienceAnalysis.optimalPostingTimes.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-3">⏰ 最佳发布时间：</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {audienceAnalysis.optimalPostingTimes.slice(0, 3).map((time: any, index: number) => (
                        <div key={index} className={`p-4 rounded-lg ${
                          index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                          index === 1 ? 'bg-gray-50 border border-gray-200' :
                          index === 2 ? 'bg-orange-50 border border-orange-200' :
                          'bg-[#F5F5F7]'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-500' :
                              index === 2 ? 'bg-orange-500' :
                              'bg-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-medium text-[#1D1D1F]">{time.day}</span>
                          </div>
                          <div className="text-xs text-[#86868B]">占比 {time.share}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 高互动视频 */}
                {audienceAnalysis.engagementPatterns?.topEngagingVideos && audienceAnalysis.engagementPatterns.topEngagingVideos.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-3">🏆 高互动视频案例：</div>
                    <div className="space-y-2">
                      {audienceAnalysis.engagementPatterns.topEngagingVideos.slice(0, 5).map((video: any, index: number) => (
                        <div key={index} className="p-3 bg-[#F5F5F7] rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-[#1D1D1F] mb-1">{video.title}</div>
                              <div className="text-xs text-[#86868B]">
                                {video.channelTitle} · {video.duration} · {video.category}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-sm font-semibold text-[#007AFF]">{video.engagement}</div>
                              <div className="text-xs text-[#86868B]">{formatNumber(video.views)} 播放</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 受众建议 */}
                {audienceAnalysis.recommendations && audienceAnalysis.recommendations.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-[#86868B] mb-2">💡 受众优化建议：</div>
                    <div className="space-y-2">
                      {audienceAnalysis.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-[#F5F5F7] rounded-lg">
                          <span className="text-[#007AFF] mt-1">💡</span>
                          <p className="text-sm text-[#1D1D1F]">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
