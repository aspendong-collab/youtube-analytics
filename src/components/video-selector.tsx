'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Video, Play, Calendar, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Video {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string | null;
  channelId: string | null;
  channelTitle: string | null;
  publishDate: string | null;
  totalViews: number | null;
  createdAt: string;
}

interface VideoSelectorProps {
  selectedVideoId: string | null;
  onVideoSelect: (video: Video | null) => void;
  disabled?: boolean;
}

export function VideoSelector({ selectedVideoId, onVideoSelect, disabled = false }: VideoSelectorProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos');

      if (!response.ok) {
        throw new Error('加载视频列表失败');
      }

      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('加载视频列表失败:', error);
      toast.error('加载失败', {
        description: '无法加载视频列表',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedVideo = videos.find(v => v.id === selectedVideoId);

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(search.toLowerCase()) ||
    video.videoId.toLowerCase().includes(search.toLowerCase())
  );

  const handleVideoSelect = (video: Video) => {
    onVideoSelect(video);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onVideoSelect(null);
  };

  if (loading) {
    return (
      <Card className="p-6 bg-white border-[rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-center py-8">
          <div className="text-[#86868B]">加载视频列表中...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-[rgba(0,0,0,0.08)]">
      {/* 选中的视频显示 */}
      <div className="p-4 border-b border-[rgba(0,0,0,0.08)]">
        {selectedVideo ? (
          <div className="flex items-start gap-4">
            {selectedVideo.thumbnail && (
              <img
                src={selectedVideo.thumbnail}
                alt={selectedVideo.title}
                className="w-32 h-20 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#1D1D1F] line-clamp-2 mb-1">
                    {selectedVideo.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-[#86868B]">
                    {selectedVideo.channelTitle && (
                      <span>{selectedVideo.channelTitle}</span>
                    )}
                    {selectedVideo.totalViews !== null && (
                      <span className="flex items-center gap-1">
                        <Eye size={14} />
                        {selectedVideo.totalViews.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="text-[#86868B] hover:text-red-500"
                  >
                    切换视频
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#86868B]">
              <Video size={18} />
              <span>请选择要分析的视频</span>
            </div>
            {!disabled && (
              <Button
                onClick={() => setIsOpen(!isOpen)}
                variant="outline"
                size="sm"
              >
                选择视频
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 视频选择器下拉框 */}
      {isOpen && !disabled && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
              <Input
                placeholder="搜索视频标题或ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              取消
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {filteredVideos.length === 0 ? (
              <div className="text-center py-8 text-[#86868B]">
                没有找到匹配的视频
              </div>
            ) : (
              filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleVideoSelect(video)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedVideoId === video.id
                      ? 'border-[#007AFF] bg-[#007AFF]/5'
                      : 'border-[rgba(0,0,0,0.08)] hover:border-[#007AFF]/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-[#1D1D1F] line-clamp-2 text-sm mb-1">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#86868B]">
                        {video.channelTitle && (
                          <span className="truncate max-w-[120px]">
                            {video.channelTitle}
                          </span>
                        )}
                        {video.totalViews !== null && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              {(video.totalViews / 1000).toFixed(1)}k
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {selectedVideoId === video.id && (
                      <Badge variant="default" className="bg-[#007AFF]">
                        已选择
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
