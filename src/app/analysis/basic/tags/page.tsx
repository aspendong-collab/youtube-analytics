'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Hash, Plus, X, Sparkles, Copy, Check } from 'lucide-react';

interface Tag {
  id: string;
  text: string;
  category: 'primary' | 'secondary' | 'long-tail';
}

export default function TagOptimizationPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customTags, setCustomTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleAddCustomTag = () => {
    if (!newTagInput.trim()) return;

    const newTag: Tag = {
      id: Date.now().toString(),
      text: newTagInput.trim(),
      category: 'secondary',
    };

    setCustomTags([...customTags, newTag]);
    setNewTagInput('');
  };

  const handleRemoveCustomTag = (id: string) => {
    setCustomTags(customTags.filter(tag => tag.id !== id));
  };

  const handleGenerateSuggestions = async () => {
    if (!title.trim() && !description.trim()) {
      toast.error('请输入标题或描述');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/optimize-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const data = await response.json();

      // 转换 AI 响应为前端格式
      const suggestions: Tag[] = data.suggestions.map((s: any, i: number) => ({
        id: `ai-${i}`,
        text: s.tag,
        category: s.category,
      }));

      setSuggestedTags(suggestions);
      setIsLoading(false);
      toast.success('标签建议生成完成');
    } catch (error) {
      console.error('生成失败:', error);
      toast.error(error instanceof Error ? error.message : '生成失败');
      setSuggestedTags([]);
      setIsLoading(false);
    }
  };

  const handleAddSuggestedTag = (tag: Tag) => {
    if (!customTags.find(t => t.text === tag.text)) {
      setCustomTags([...customTags, tag]);
      toast.success(`已添加标签: ${tag.text}`);
    } else {
      toast.warning('该标签已存在');
    }
  };

  const handleCopyAllTags = async () => {
    const allTags = customTags.map(tag => tag.text).join(', ');
    try {
      await navigator.clipboard.writeText(allTags);
      setCopiedAll(true);
      toast.success('所有标签已复制到剪贴板');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'primary':
        return <Badge className="bg-blue-100 text-blue-700">核心</Badge>;
      case 'secondary':
        return <Badge className="bg-purple-100 text-purple-700">次要</Badge>;
      case 'long-tail':
        return <Badge className="bg-green-100 text-green-700">长尾</Badge>;
      default:
        return <Badge variant="secondary">其他</Badge>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Hash className="w-8 h-8" />
          标签优化
        </h1>
        <p className="text-gray-600">
          AI生成相关标签，提升视频搜索曝光
        </p>
      </div>

      {/* 输入区域 */}
      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">视频标题</Label>
            <Input
              id="title"
              placeholder="输入视频标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">视频描述</Label>
            <Textarea
              id="description"
              placeholder="输入视频描述..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={handleGenerateSuggestions} disabled={isLoading}>
            {isLoading ? '生成中...' : '生成标签建议'}
          </Button>
        </div>
      </Card>

      {/* 自定义标签 */}
      <Card className="p-6 mb-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-3">自定义标签 ({customTags.length})</h3>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="输入标签..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
            />
            <Button onClick={handleAddCustomTag}>
              <Plus className="w-4 h-4 mr-2" />
              添加
            </Button>
          </div>
        </div>

        {customTags.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              {customTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                  {tag.text}
                  <button
                    onClick={() => handleRemoveCustomTag(tag.id)}
                    className="hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={handleCopyAllTags}
              className="w-full"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  复制所有标签
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* 标签建议 */}
      {suggestedTags.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            标签建议 ({suggestedTags.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    #{tag.text}
                  </Badge>
                  {getCategoryBadge(tag.category)}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddSuggestedTag(tag)}
                  disabled={customTags.some(t => t.text === tag.text)}
                >
                  {customTags.some(t => t.text === tag.text) ? (
                    '已添加'
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      添加
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 空状态 */}
      {!isLoading && suggestedTags.length === 0 && customTags.length === 0 && (
        <Card className="p-12 text-center text-gray-500">
          <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>输入标题和描述开始生成标签建议</p>
        </Card>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">AI生成中...</p>
        </div>
      )}
    </div>
  );
}
