'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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

  // 基础建议
  const [basicSuggestions, setBasicSuggestions] = useState<any[]>([]);

  useEffect(() => {
    loadVideos();
    loadGlobalData();
  }, []);

  const loadGlobalData = async () => {
    // 加载不依赖选择视频的全局数据
    await Promise.all([
      loadPublishTimeData(),
      loadTrendsData(),
      loadAudienceData()
    ]);
  };

  const loadVideos = async () => {
    try {
      const response = await fetch('/api/videos?isActive=true&limit=1000');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
        if (data.videos && data.videos.length > 0) {
          setSelectedVideo(data.videos[0]);
          generateBasicSuggestions(data.videos);
          // 自动执行所有分析
          runAllAnalyses(data.videos[0]);
        }
      }
    } catch (error) {
      console.error('加载视频数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAllAnalyses = async (video: Video) => {
    setIsAnalyzing(true);
    try {
      // 并行执行所有分析
      await Promise.all([
        analyzeTitle(video),
        analyzeTags(video),
        analyzeDescription(video),
        analyzeThumbnail(video),
        analyzeCompetition(video),
        analyzeContent(video)
      ]);
    } catch (error) {
      console.error('批量分析失败:', error);
      toast.error('部分分析加载失败，请刷新页面重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVideoChange = async (videoId: string) => {
    const video = videos.find(v => v.videoId === videoId);
    if (video) {
      setSelectedVideo(video);
      // 切换视频后自动重新分析
      runAllAnalyses(video);
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

  const analyzeTitle = async (video: Video) => {
    try {
      const response = await fetch('/api/suggestions/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          tags: video.tags,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTitleAnalysis(data);
      }
    } catch (error) {
      console.error('标题分析失败:', error);
    }
  };

  const analyzeTags = async (video: Video) => {
    try {
      const response = await fetch('/api/suggestions/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
          tags: video.tags,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTagAnalysis(data);
      }
    } catch (error) {
      console.error('标签分析失败:', error);
    }
  };

  const analyzeDescription = async (video: Video) => {
    try {
      const response = await fetch('/api/suggestions/description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          description: video.description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDescriptionAnalysis(data);
      }
    } catch (error) {
      console.error('描述优化失败:', error);
    }
  };

  const analyzeThumbnail = async (video: Video) => {
    try {
      const response = await fetch(`/api/suggestions/thumbnail?videoId=${video.videoId}`);
      if (response.ok) {
        const data = await response.json();
        setThumbnailAnalysis(data);
      }
    } catch (error) {
      console.error('封面分析失败:', error);
    }
  };

  const analyzeCompetition = async (video: Video) => {
    try {
      const response = await fetch(`/api/suggestions/competition?videoId=${video.videoId}`);
      if (response.ok) {
        const data = await response.json();
        setCompetitionAnalysis(data);
      }
    } catch (error) {
      console.error('竞争分析失败:', error);
    }
  };

  const analyzeContent = async (video: Video) => {
    try {
      const response = await fetch(`/api/suggestions/content-diagnosis?videoId=${video.videoId}`);
      if (response.ok) {
        const data = await response.json();
        setContentDiagnosis(data);
      }
    } catch (error) {
      console.error('内容诊断失败:', error);
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
            onChange={(e) => handleVideoChange(e.target.value)}
            className="flex-1 max-w-md px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
          >
            {videos.map(video => (
              <option key={video.videoId} value={video.videoId}>
                {video.title}
              </option>
            ))}
          </select>
          {isAnalyzing && (
            <span className="text-sm text-[#007AFF]">分析中...</span>
          )}
        </div>
      </Card>

      {/* AI 优化建议 - 全部展开 */}
      <div className="space-y-6">
        {/* 1. 基础分析 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">📊 基础数据概览</h2>
          {selectedVideo && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

          <h3 className="text-md font-medium text-[#1D1D1F] mb-3">所有视频优化建议</h3>
          <div className="space-y-3">
            {basicSuggestions.map((task) => (
              <div key={task.videoId} className="p-4 bg-[#F5F5F7] rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-[#1D1D1F]">{task.videoTitle}</h4>
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

        {/* 2. 标题优化 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">📝 标题优化</h2>
          
          {selectedVideo && (
            <div className="mb-4 p-3 bg-[#F5F5F7] rounded-lg">
              <div className="text-xs text-[#86868B] mb-1">当前标题</div>
              <div className="text-sm text-[#1D1D1F]">{selectedVideo.title}</div>
            </div>
          )}

          {!titleAnalysis && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {titleAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-xs text-[#86868B] mb-1">标题评分</div>
                  <div className="text-2xl font-bold text-[#007AFF]">{titleAnalysis.score}/100</div>
                </div>
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-xs text-[#86868B] mb-1">关键词覆盖率</div>
                  <div className="text-2xl font-bold text-[#1D1D1F]">{titleAnalysis.keywordCoverage}</div>
                </div>
              </div>

              <div className="p-4 bg-[#F5F5F7] rounded-lg">
                <div className="text-sm font-medium text-[#1D1D1F] mb-2">长度分析</div>
                <p className="text-sm text-[#1D1D1F]">{titleAnalysis.lengthAnalysis}</p>
              </div>

              <div className="p-4 bg-[#F5F5F7] rounded-lg">
                <div className="text-sm font-medium text-[#1D1D1F] mb-2">优化建议</div>
                <div className="space-y-2">
                  {titleAnalysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-[#007AFF] mt-1">•</span>
                      <p className="text-sm text-[#1D1D1F]">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#F5F5F7] rounded-lg">
                <div className="text-sm font-medium text-[#1D1D1F] mb-2">优化理由</div>
                <div className="space-y-2">
                  {titleAnalysis.optimizationReasons.map((reason, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-[#007AFF] mt-1">💡</span>
                      <p className="text-sm text-[#1D1D1F]">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* 3. 标签生成 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">🏷️ 标签生成</h2>

          {!tagAnalysis && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {tagAnalysis && (
            <div className="space-y-4">
              {tagAnalysis.coreKeywords && tagAnalysis.coreKeywords.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">核心关键词</div>
                  <div className="flex flex-wrap gap-2">
                    {tagAnalysis.coreKeywords.map((item, index) => (
                      <Badge key={index} variant="default" className="bg-[#007AFF]">
                        {item.tag} ({item.searchVolume})
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-[#86868B]">
                    {tagAnalysis.coreKeywords[0]?.reason}
                  </div>
                </div>
              )}

              {tagAnalysis.longTailKeywords && tagAnalysis.longTailKeywords.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">长尾关键词</div>
                  <div className="flex flex-wrap gap-2">
                    {tagAnalysis.longTailKeywords.map((item, index) => (
                      <Badge key={index} variant="secondary">
                        {item.tag} ({item.searchVolume})
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-[#86868B]">
                    {tagAnalysis.longTailKeywords[0]?.reason}
                  </div>
                </div>
              )}

              {tagAnalysis.allTags && tagAnalysis.allTags.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">推荐标签列表</div>
                  <div className="flex flex-wrap gap-2">
                    {tagAnalysis.allTags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 4. 描述优化 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">📄 描述优化</h2>

          {!descriptionAnalysis && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {descriptionAnalysis && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F5F7] rounded-lg">
                <div className="text-sm font-medium text-[#1D1D1F] mb-2">优化后的描述</div>
                <p className="text-sm text-[#1D1D1F] whitespace-pre-wrap">
                  {descriptionAnalysis.optimizedDescription}
                </p>
              </div>

              {descriptionAnalysis.tips && descriptionAnalysis.tips.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">优化提示</div>
                  <div className="space-y-2">
                    {descriptionAnalysis.tips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#007AFF] mt-1">💡</span>
                        <p className="text-sm text-[#1D1D1F]">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 5. 封面分析 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">🖼️ 封面图分析</h2>

          {selectedVideo && selectedVideo.thumbnail && (
            <div className="mb-4 flex justify-center">
              <img
                src={selectedVideo.thumbnail}
                alt="封面"
                className="max-w-md rounded-lg"
              />
            </div>
          )}

          {!thumbnailAnalysis && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {thumbnailAnalysis && (
            <div className="space-y-4">
              {thumbnailAnalysis.score && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-xs text-[#86868B] mb-1">封面评分</div>
                    <div className="text-2xl font-bold text-[#007AFF]">{thumbnailAnalysis.score}/100</div>
                  </div>
                  {thumbnailAnalysis.colorAnalysis && (
                    <div className="p-4 bg-[#F5F5F7] rounded-lg">
                      <div className="text-xs text-[#86868B] mb-1">主色调</div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: thumbnailAnalysis.colorAnalysis?.mainColor || '#000' }}
                        />
                        <div className="text-sm text-[#1D1D1F]">{thumbnailAnalysis.colorAnalysis?.mainColor || '未知'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {thumbnailAnalysis.suggestions && thumbnailAnalysis.suggestions.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">优化建议</div>
                  <div className="space-y-2">
                    {thumbnailAnalysis.suggestions.map((suggestion: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#007AFF] mt-1">•</span>
                        <p className="text-sm text-[#1D1D1F]">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 6. 竞争分析 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">⚔️ 竞争分析</h2>

          {!competitionAnalysis && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {competitionAnalysis && (
            <div className="space-y-4">
              {competitionAnalysis.overview && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">竞争概况</div>
                  <p className="text-sm text-[#1D1D1F]">{competitionAnalysis.overview}</p>
                </div>
              )}

              {competitionAnalysis.competitors && competitionAnalysis.competitors.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">竞品视频</div>
                  <div className="space-y-2">
                    {competitionAnalysis.competitors.map((competitor: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#1D1D1F]">{competitor.title}</div>
                          <div className="text-xs text-[#86868B]">{competitor.views} 观看</div>
                        </div>
                        <Badge variant="outline">{index + 1}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {competitionAnalysis.gaps && competitionAnalysis.gaps.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">竞争差距分析</div>
                  <div className="space-y-2">
                    {competitionAnalysis.gaps.map((gap: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#007AFF] mt-1">📊</span>
                        <p className="text-sm text-[#1D1D1F]">{gap}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {competitionAnalysis.recommendations && competitionAnalysis.recommendations.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">优化建议</div>
                  <div className="space-y-2">
                    {competitionAnalysis.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
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

        {/* 7. 内容诊断 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">🔍 内容诊断</h2>

          {!contentDiagnosis && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {contentDiagnosis && (
            <div className="space-y-4">
              {contentDiagnosis.overallScore !== undefined && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-[#F5F5F7] rounded-lg">
                    <div className="text-xs text-[#86868B] mb-1">综合评分</div>
                    <div className="text-2xl font-bold text-[#007AFF]">{contentDiagnosis.overallScore}/100</div>
                  </div>
                  {contentDiagnosis.scoreBreakdown && (
                    <>
                      <div className="p-4 bg-[#F5F5F7] rounded-lg">
                        <div className="text-xs text-[#86868B] mb-1">内容质量</div>
                        <div className="text-2xl font-bold text-[#1D1D1F]">{contentDiagnosis.scoreBreakdown.contentQuality}/100</div>
                      </div>
                      <div className="p-4 bg-[#F5F5F7] rounded-lg">
                        <div className="text-xs text-[#86868B] mb-1">互动表现</div>
                        <div className="text-2xl font-bold text-[#1D1D1F]">{contentDiagnosis.scoreBreakdown.engagement}/100</div>
                      </div>
                      <div className="p-4 bg-[#F5F5F7] rounded-lg">
                        <div className="text-xs text-[#86868B] mb-1">传播潜力</div>
                        <div className="text-2xl font-bold text-[#1D1D1F]">{contentDiagnosis.scoreBreakdown.viralPotential}/100</div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {contentDiagnosis.strengths && contentDiagnosis.strengths.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">✅ 优势分析</div>
                  <div className="space-y-2">
                    {contentDiagnosis.strengths.map((strength: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <p className="text-sm text-[#1D1D1F]">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contentDiagnosis.weaknesses && contentDiagnosis.weaknesses.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">❌ 需要改进</div>
                  <div className="space-y-2">
                    {contentDiagnosis.weaknesses.map((weakness: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">✗</span>
                        <p className="text-sm text-[#1D1D1F]">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contentDiagnosis.recommendations && contentDiagnosis.recommendations.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">💡 改进建议</div>
                  <div className="space-y-2">
                    {contentDiagnosis.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#007AFF] mt-1">•</span>
                        <p className="text-sm text-[#1D1D1F]">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 8. 趋势洞察 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">🔥 趋势洞察</h2>

          {!trendsAnalysis && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {trendsAnalysis && (
            <div className="space-y-4">
              {trendsAnalysis.hotTopics && trendsAnalysis.hotTopics.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">热门话题</div>
                  <div className="space-y-2">
                    {trendsAnalysis.hotTopics.map((topic: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="text-sm text-[#1D1D1F]">{topic.topic}</span>
                        <Badge variant="outline">{topic.trend}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trendsAnalysis.growthVideos && trendsAnalysis.growthVideos.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">快速增长视频</div>
                  <div className="space-y-2">
                    {trendsAnalysis.growthVideos.map((video: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="text-sm text-[#1D1D1F]">{video.title}</span>
                        <Badge className="bg-green-500">{video.growthRate}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trendsAnalysis.contentIdeas && trendsAnalysis.contentIdeas.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">内容创作建议</div>
                  <div className="space-y-2">
                    {trendsAnalysis.contentIdeas.map((idea: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#007AFF] mt-1">💡</span>
                        <p className="text-sm text-[#1D1D1F]">{idea}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 9. 受众分析 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">👥 受众分析</h2>

          {!audienceAnalysis && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {audienceAnalysis && (
            <div className="space-y-4">
              {audienceAnalysis.overview && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">受众概览</div>
                  <p className="text-sm text-[#1D1D1F]">{audienceAnalysis.overview}</p>
                </div>
              )}

              {audienceAnalysis.interests && audienceAnalysis.interests.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">兴趣偏好</div>
                  <div className="flex flex-wrap gap-2">
                    {audienceAnalysis.interests.map((interest: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {interest.topic} ({interest.percentage}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {audienceAnalysis.contentPreferences && audienceAnalysis.contentPreferences.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">内容偏好</div>
                  <div className="space-y-2">
                    {audienceAnalysis.contentPreferences.map((pref: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="text-sm text-[#1D1D1F]">{pref.type}</span>
                        <Badge variant="secondary">{pref.percentage}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {audienceAnalysis.bestPublishTime && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">最佳发布时间</div>
                  <p className="text-sm text-[#1D1D1F]">{audienceAnalysis.bestPublishTime}</p>
                </div>
              )}

              {audienceAnalysis.recommendations && audienceAnalysis.recommendations.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">💡 受众优化建议</div>
                  <div className="space-y-2">
                    {audienceAnalysis.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
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

        {/* 10. 发布时间分析 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">⏰ 最佳发布时间分析</h2>
          
          {!publishTimeData && !isAnalyzing && (
            <div className="text-center py-8 text-[#86868B]">
              分析失败，请刷新页面重试
            </div>
          )}

          {publishTimeData && (
            <div className="space-y-6">
              {/* TOP 5 黄金时段 */}
              {publishTimeData.topTimes && publishTimeData.topTimes.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">🏆 TOP 5 黄金时段</div>
                  <div className="space-y-2">
                    {publishTimeData.topTimes.map((timeSlot: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-[#007AFF]">#{index + 1}</Badge>
                          <span className="text-sm text-[#1D1D1F]">{timeSlot.time}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-[#007AFF]">{formatNumber(timeSlot.averageViews)}</div>
                          <div className="text-xs text-[#86868B]">平均观看</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 热力图 */}
              {publishTimeData.heatmap && publishTimeData.heatmap.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">📊 发布时间热力图</div>
                  <Heatmap data={publishTimeData.heatmap} />
                </div>
              )}

              {/* 推荐时段 */}
              {publishTimeData.recommendations && publishTimeData.recommendations.length > 0 && (
                <div className="p-4 bg-[#F5F5F7] rounded-lg">
                  <div className="text-sm font-medium text-[#1D1D1F] mb-2">💡 发布建议</div>
                  <div className="space-y-2">
                    {publishTimeData.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-[#007AFF] mt-1">•</span>
                        <p className="text-sm text-[#1D1D1F]">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 数据摘要 */}
              {publishTimeData.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-[#F5F5F7] rounded-lg">
                    <div className="text-xs text-[#86868B] mb-1">分析视频数</div>
                    <div className="text-lg font-bold text-[#1D1D1F]">{publishTimeData.summary.totalAnalyzed}</div>
                  </div>
                  <div className="p-3 bg-[#F5F5F7] rounded-lg">
                    <div className="text-xs text-[#86868B] mb-1">覆盖时段数</div>
                    <div className="text-lg font-bold text-[#1D1D1F]">{publishTimeData.summary.uniqueTimeSlots}</div>
                  </div>
                  <div className="p-3 bg-[#F5F5F7] rounded-lg">
                    <div className="text-xs text-[#86868B] mb-1">最佳时段</div>
                    <div className="text-sm font-bold text-[#007AFF]">{publishTimeData.summary.bestTimeSlot}</div>
                  </div>
                  <div className="p-3 bg-[#F5F5F7] rounded-lg">
                    <div className="text-xs text-[#86868B] mb-1">平均观看</div>
                    <div className="text-lg font-bold text-[#1D1D1F]">{formatNumber(publishTimeData.averageViews)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
