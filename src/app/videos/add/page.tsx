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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchVideoInfo = async () => {
    if (!formData.videoUrl.trim()) {
      setError('请先输入视频链接');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/video-info?url=${encodeURIComponent(formData.videoUrl)}`);

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || '获取视频信息失败';
        const details = data.details ? ` (${data.details})` : '';

        // 构建更友好的错误提示
        let fullError = errorMsg;

        if (data.error?.includes('未配置 YouTube API Key')) {
          fullError = '请先配置 YouTube API Key';
        } else if (data.error?.includes('无法从 URL 中提取视频 ID')) {
          fullError = '请输入正确的 YouTube 视频链接';
        } else if (data.error?.includes('未找到该视频')) {
          fullError = '无法找到该视频，请检查链接是否正确';
        } else if (data.statusCode === 403) {
          fullError = 'API Key 权限不足或已达到配额限制';
        } else if (data.statusCode === 401) {
          fullError = 'API Key 无效，请重新配置';
        }

        throw new Error(fullError + details);
      }

      const data = await response.json();

      setFormData({
        ...formData,
        videoTitle: data.title || '',
        description: data.description || '',
        tags: data.tags ? data.tags.join(', ') : '',
        category: data.categoryId || '',
      });

      // 成功后清除错误信息
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取视频信息失败';
      setError(errorMessage);

      // 如果是 API Key 相关错误，显示额外的提示
      if (errorMessage.includes('API Key')) {
        setError(errorMessage + '。请前往"设置管理 > 数据采集"进行配置。');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex gap-3">
              <Input
                id="videoUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={fetchVideoInfo}
                disabled={isLoading}
                className="whitespace-nowrap border-[#007AFF] text-[#007AFF] hover:bg-[rgba(0,122,255,0.08)]"
              >
                {isLoading ? '获取中...' : '获取视频信息'}
              </Button>
            </div>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-500">⚠️</span>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
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
