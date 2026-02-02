'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Heatmap } from '@/components/charts/heatmap';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 基础建议
  const [basicSuggestions, setBasicSuggestions] = useState<any[]>([]);

  useEffect(() => {
    loadVideos();
    loadPublishTimeData();
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
        setPublishTimeData(data);
      }
    } catch (error) {
      console.error('加载发布时间数据失败:', error);
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
    if (!selectedVideo) return;
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
      }
    } catch (error) {
      console.error('标题分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeTags = async () => {
    if (!selectedVideo) return;
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
      }
    } catch (error) {
      console.error('标签分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeDescription = async () => {
    if (!selectedVideo) return;
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
      }
    } catch (error) {
      console.error('描述分析失败:', error);
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

      {/* AI 优化建议 */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">基础分析</TabsTrigger>
          <TabsTrigger value="title">标题优化</TabsTrigger>
          <TabsTrigger value="tags">标签生成</TabsTrigger>
          <TabsTrigger value="description">描述优化</TabsTrigger>
          <TabsTrigger value="publish-time">发布时间</TabsTrigger>
        </TabsList>

        {/* 基础分析 */}
        <TabsContent value="basic" className="space-y-4">
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
        </TabsContent>

        {/* 标题优化 */}
        <TabsContent value="title" className="space-y-4">
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
        </TabsContent>

        {/* 标签生成 */}
        <TabsContent value="tags" className="space-y-4">
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
        </TabsContent>

        {/* 描述优化 */}
        <TabsContent value="description" className="space-y-4">
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
        </TabsContent>

        {/* 发布时间 */}
        <TabsContent value="publish-time" className="space-y-4">
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
                      {publishTimeData.summary.totalAnalyzed}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">最佳时段</div>
                    <div className="text-lg font-bold text-[#007AFF]">
                      {publishTimeData.summary.bestTimeSlot}
                    </div>
                  </div>
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-sm text-[#86868B] mb-1">平均播放量</div>
                    <div className="text-2xl font-bold text-[#1D1D1F]">
                      {formatNumber(publishTimeData.averageViews)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#86868B]">加载中...</div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
