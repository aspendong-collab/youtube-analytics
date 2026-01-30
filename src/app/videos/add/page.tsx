'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AddVideoPage() {
  const [formData, setFormData] = useState({
    videoUrl: '',
    videoTitle: '',
    description: '',
    owner: '',
    tags: '',
    category: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('添加视频:', formData);
    // TODO: 实现添加视频逻辑
    alert('视频添加成功！');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">添加视频</h1>
          <p className="text-sm text-[#86868B] mt-1">添加新的视频到监控列表</p>
        </div>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="videoUrl">视频链接</Label>
            <Input
              id="videoUrl"
              placeholder="https://www.youtube.com/watch?v=..."
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoTitle">视频标题</Label>
            <Input
              id="videoTitle"
              placeholder="输入视频标题"
              value={formData.videoTitle}
              onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">视频描述</Label>
            <Textarea
              id="description"
              placeholder="输入视频描述"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner">负责人</Label>
            <Input
              id="owner"
              placeholder="选择负责人"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              placeholder="输入标签，用逗号分隔"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">分类</Label>
            <Input
              id="category"
              placeholder="输入视频分类"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="bg-[#007AFF] hover:bg-[#0066CC]">
              添加视频
            </Button>
            <Button type="button" variant="outline" className="border-[rgba(0,0,0,0.1)]">
              取消
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
