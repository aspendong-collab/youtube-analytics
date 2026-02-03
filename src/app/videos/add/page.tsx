'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Owner {
  id: string;
  name: string;
  email: string | null;
}

export default function AddVideoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    videoUrl: '',
    videoTitle: '',
    description: '',
    owner: '',
    tags: '',
    category: '',
    cooperationCost: '',
    publishDate: null as Date | null,
    publishStatus: 'published' as 'draft' | 'published',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

  // 加载负责人列表
  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      setIsLoadingOwners(true);
      const response = await fetch('/api/owners?isActive=true');
      if (response.ok) {
        const data = await response.json();
        setOwners(data.owners || []);
      }
    } catch (error) {
      console.error('加载负责人列表失败:', error);
    } finally {
      setIsLoadingOwners(false);
    }
  };

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
        throw new Error(data.error || '获取视频信息失败');
      }

      const data = await response.json();

      // 如果是未配置 API Key 的提示，显示友好的提示信息
      if (data.error && data.canManualInput) {
        setError('未配置 YouTube API Key，请手动输入视频信息');
        return;
      }

      setFormData({
        ...formData,
        videoTitle: data.title || '',
        description: data.description || '',
        tags: data.tags ? data.tags.join(', ') : '',
        category: data.categoryId || '',
        // 自动获取发布时间
        publishDate: data.publishedAt ? new Date(data.publishedAt) : null,
      });

      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取视频信息失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.videoUrl.trim()) {
      toast.error('请输入视频链接');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: formData.videoUrl,
          owner: formData.owner,
          tags: formData.tags,
          category: formData.category,
          cooperationCost: formData.cooperationCost ? parseFloat(formData.cooperationCost) : 0,
          publishDate: formData.publishDate ? formData.publishDate.toISOString() : null,
          publishStatus: formData.publishStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.error || '添加视频失败';
        const hint = data.hint || '';

        console.error('添加视频失败:', { status: response.status, data });

        // 如果是 API Key 相关错误，显示更友好的提示
        if (errorMsg.includes('API Key')) {
          toast.error(errorMsg + (hint ? ` (${hint})` : ''));
        } else {
          throw new Error(errorMsg);
        }
        return;
      }

      const data = await response.json();

      toast.success('视频添加成功！已自动获取视频信息和统计数据。');

      // 跳转到视频列表页面
      router.push('/videos');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加视频失败';

      console.error('添加视频异常:', err);

      // 如果错误包含"服务器内部错误"，可能是环境配置问题
      if (errorMessage === '服务器内部错误') {
        toast.error('添加视频失败，请检查网络连接或联系管理员');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D1D1F]">添加视频</h1>
          <p className="text-sm text-[#86868B] mt-1">添加新的视频到监控列表，系统会自动获取视频信息和统计数据</p>
        </div>
      </div>

      <Card className="p-6 bg-white shadow-sm border-[rgba(0,0,0,0.08)]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="videoUrl">视频链接 *</Label>
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
            <p className="text-xs text-[#86868B]">
              支持格式：https://www.youtube.com/watch?v=ID 或 https://youtu.be/ID
            </p>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-red-500">⚠️</span>
                  <div>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                    {error.includes('未配置') && (
                      <p className="text-xs text-red-600 mt-1">
                        请联系管理员配置 YouTube API Key
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoTitle">视频标题</Label>
            <Input
              id="videoTitle"
              placeholder="自动获取或手动输入"
              value={formData.videoTitle}
              onChange={(e) => setFormData({ ...formData, videoTitle: e.target.value })}
            />
            <p className="text-xs text-[#86868B]">
              可以点击"获取视频信息"按钮自动填充
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">视频描述</Label>
            <Textarea
              id="description"
              placeholder="自动获取或手动输入"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner">负责人</Label>
              <select
                id="owner"
                className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              >
                <option value="">请选择负责人</option>
                {isLoadingOwners ? (
                  <option disabled>加载中...</option>
                ) : owners.length === 0 ? (
                  <option disabled>暂无负责人</option>
                ) : (
                  owners.map((owner) => (
                    <option key={owner.id} value={owner.name}>
                      {owner.name}
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs text-[#86868B]">
                如果没有找到合适的负责人，请先在"负责人管理"中添加
              </p>
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

          {/* 新增字段 */}
          <div className="space-y-2">
            <Label htmlFor="cooperationCost">合作费用（$）</Label>
            <Input
              id="cooperationCost"
              type="number"
              step="0.01"
              placeholder="请输入合作费用"
              value={formData.cooperationCost}
              onChange={(e) => setFormData({ ...formData, cooperationCost: e.target.value })}
            />
            <p className="text-xs text-[#86868B]">
              用于计算 CPV 成本分析
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishDate">发布时间</Label>
            <Input
              id="publishDate"
              value={formData.publishDate ? format(formData.publishDate, 'yyyy-MM-dd HH:mm:ss') : ''}
              placeholder='点击"获取视频信息"后自动填充'
              readOnly
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-[#86868B]">
              此字段将从 YouTube 自动获取，无需手动输入
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publishStatus">发布状态</Label>
            <select
              id="publishStatus"
              value={formData.publishStatus}
              onChange={(e) => setFormData({ ...formData, publishStatus: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
            </select>
            <p className="text-xs text-[#86868B]">
              只有"已发布"的视频才会计入发布量统计
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-[#007AFF] hover:bg-[#0066CC]"
              disabled={isLoading}
            >
              {isLoading ? '添加中...' : '添加视频'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[rgba(0,0,0,0.1)]"
              onClick={() => router.push('/videos')}
            >
              取消
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
