'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquare, RefreshCw, ThumbsUp, ThumbsDown, Minus, Star } from 'lucide-react';

interface Comment {
  commentId: string;
  videoId: string;
  authorName: string;
  authorChannelId?: string;
  textDisplay: string;
  likeCount: number;
  publishedAt: string;
  sentiment: string;
  qualityScore: number;
  isHighQuality: boolean;
}

interface Video {
  id: string;
  videoId: string;
  title: string;
  thumbnail?: string;
}

export default function CommentsAnalysisPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [sentimentStats, setSentimentStats] = useState({
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const response = await fetch('/api/videos?isActive=true&limit=50');
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('加载视频失败:', error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const loadComments = async (videoId: string) => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/comments?videoId=${videoId}&type=sentiment`);
      if (response.ok) {
        const data = await response.json();
        setSentimentStats(data);
        // 同时加载所有评论
        const allResponse = await fetch(`/api/comments?videoId=${videoId}`);
        if (allResponse.ok) {
          const allData = await allResponse.json();
          setComments(allData.comments || []);
        }
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const fetchCommentsFromYouTube = async () => {
    if (!selectedVideo) return;

    setIsFetching(true);
    try {
      const response = await fetch('/api/comments/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: selectedVideo.videoId,
          maxResults: 100,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '获取评论失败');
      }

      const data = await response.json();
      toast.success(data.message || `成功获取 ${data.total} 条评论`);

      // 重新加载评论
      await loadComments(selectedVideo.videoId);
    } catch (error) {
      console.error('获取评论失败:', error);
      toast.error(error instanceof Error ? error.message : '获取评论失败');
    } finally {
      setIsFetching(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="w-5 h-5 text-green-500" />;
      case 'negative':
        return <ThumbsDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <Badge className="bg-green-100 text-green-700">积极</Badge>;
      case 'negative':
        return <Badge className="bg-red-100 text-red-700">消极</Badge>;
      default:
        return <Badge variant="secondary">中性</Badge>;
    }
  };

  const highQualityComments = comments.filter(c => c.isHighQuality);
  const positiveComments = comments.filter(c => c.sentiment === 'positive');
  const negativeComments = comments.filter(c => c.sentiment === 'negative');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          评论分析
        </h1>
        <p className="text-gray-600">
          分析视频评论的情感倾向，发现高质量用户反馈
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：视频选择 */}
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">选择视频</h3>
            {isLoadingVideos ? (
              <div className="text-center py-8 text-gray-500">
                加载中...
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setSelectedVideo(video);
                      loadComments(video.videoId);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedVideo?.id === video.id
                        ? 'bg-blue-50 border-blue-200 border'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium line-clamp-2 text-sm">
                      {video.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {video.videoId}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* 右侧：评论分析 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedVideo ? (
            <>
              {/* 操作栏 */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold line-clamp-1">{selectedVideo.title}</h3>
                    <p className="text-sm text-gray-500">
                      视频ID: {selectedVideo.videoId}
                    </p>
                  </div>
                  <Button
                    onClick={fetchCommentsFromYouTube}
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        获取中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        从YouTube获取评论
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* 情感统计 */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  情感分析统计
                </h3>
                {isLoadingComments ? (
                  <div className="text-center py-8 text-gray-500">
                    加载中...
                  </div>
                ) : sentimentStats.total === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无评论数据</p>
                    <p className="text-sm mt-2">点击"从YouTube获取评论"开始分析</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">
                        {sentimentStats.positive}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">积极</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((sentimentStats.positive / sentimentStats.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-gray-600">
                        {sentimentStats.neutral}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">中性</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((sentimentStats.neutral / sentimentStats.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">
                        {sentimentStats.negative}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">消极</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {((sentimentStats.negative / sentimentStats.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* 高质量评论 */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  高质量评论 ({highQualityComments.length})
                </h3>
                {highQualityComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无高质量评论</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {highQualityComments.slice(0, 5).map((comment) => (
                      <div
                        key={comment.commentId}
                        className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.authorName}
                            </span>
                            {getSentimentBadge(comment.sentiment)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            {comment.qualityScore.toFixed(1)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {comment.textDisplay}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* 最新评论 */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4">最新评论 ({comments.length})</h3>
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>暂无评论</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {comments.slice(0, 10).map((comment) => (
                      <div key={comment.commentId} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.authorName}
                            </span>
                            {getSentimentBadge(comment.sentiment)}
                          </div>
                          {comment.isHighQuality && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {comment.textDisplay}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>请从左侧选择一个视频开始分析</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
