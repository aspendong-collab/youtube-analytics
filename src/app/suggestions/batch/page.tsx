'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export default function BatchSuggestionsPage() {
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);

  const videos = [
    {
      id: 1,
      title: '最新科技产品评测',
      thumbnail: '📱',
      suggestions: ['优化标题关键词', '添加更多标签', '改进缩略图'],
      priority: 'high',
    },
    {
      id: 2,
      title: '日常生活Vlog 2024',
      thumbnail: '📹',
      suggestions: ['调整视频时长', '优化发布时间', '添加互动元素'],
      priority: 'medium',
    },
    {
      id: 3,
      title: '编程教程：React入门',
      thumbnail: '💻',
      suggestions: ['优化视频封面', '添加章节标注', '改进描述文案'],
      priority: 'low',
    },
    {
      id: 4,
      title: '游戏实况：王者荣耀',
      thumbnail: '🎮',
      suggestions: ['优化标题', '添加热门标签', '调整视频节奏'],
      priority: 'high',
    },
  ];

  const handleSelectAll = (checked: boolean) => {
    setSelectedVideos(checked ? videos.map(v => v.id) : []);
  };

  const handleSelectVideo = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedVideos([...selectedVideos, id]);
    } else {
      setSelectedVideos(selectedVideos.filter(v => v !== id));
    }
  };

  const handleBatchOptimize = () => {
    alert(`已选中 ${selectedVideos.length} 个视频，开始批量优化...`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">批量优化</h1>
          <p className="text-sm text-[#86868B] mt-1">批量优化多个视频</p>
        </div>
        <div className="flex gap-3">
          <Checkbox
            checked={selectedVideos.length === videos.length}
            onCheckedChange={handleSelectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm text-[#86868B]">全选</label>
          <Button
            className="bg-[#007AFF] hover:bg-[#0066CC]"
            onClick={handleBatchOptimize}
            disabled={selectedVideos.length === 0}
          >
            批量优化 ({selectedVideos.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
            <div className="flex items-start gap-4">
              <Checkbox
                checked={selectedVideos.includes(video.id)}
                onCheckedChange={(checked) => handleSelectVideo(video.id, checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{video.thumbnail}</span>
                      <h3 className="font-medium text-[#1D1D1F]">{video.title}</h3>
                    </div>
                    <Badge
                      variant={
                        video.priority === 'high' ? 'destructive' :
                        video.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {video.priority === 'high' ? '高优先级' :
                       video.priority === 'medium' ? '中优先级' : '低优先级'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-[#86868B]">优化建议：</h4>
                  <ul className="space-y-1">
                    {video.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-[#86868B] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
