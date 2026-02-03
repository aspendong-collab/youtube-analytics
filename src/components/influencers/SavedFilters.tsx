'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, FolderOpen, Trash2, Share, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { FilterValues } from './AdvancedFilters';

interface SavedFilter {
  id: string;
  name: string;
  description: string;
  filters: FilterValues;
  createdAt: string;
  isPublic: boolean;
}

interface SavedFiltersProps {
  currentFilters: FilterValues;
  onLoad: (filters: FilterValues) => void;
}

export default function SavedFilters({ currentFilters, onLoad }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  // 从 localStorage 加载保存的筛选条件
  useEffect(() => {
    const saved = localStorage.getItem('savedFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // 保存到 localStorage
  const saveToStorage = (filters: SavedFilter[]) => {
    localStorage.setItem('savedFilters', JSON.stringify(filters));
  };

  const handleSave = () => {
    if (!saveName.trim()) {
      toast.error('请输入筛选条件名称');
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: saveName,
      description: saveDescription,
      filters: currentFilters,
      createdAt: new Date().toISOString(),
      isPublic: false,
    };

    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    saveToStorage(updatedFilters);

    toast.success('筛选条件已保存');
    setIsSaveDialogOpen(false);
    setSaveName('');
    setSaveDescription('');
  };

  const handleLoad = (filter: SavedFilter) => {
    onLoad(filter.filters);
    toast.success(`已加载筛选条件：${filter.name}`);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定要删除这个筛选条件吗？')) {
      return;
    }

    const updatedFilters = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updatedFilters);
    saveToStorage(updatedFilters);
    toast.success('筛选条件已删除');
  };

  const handleShare = (filter: SavedFilter) => {
    // 生成分享链接（base64编码）
    const encoded = btoa(JSON.stringify(filter.filters));
    const shareUrl = `${window.location.origin}/influencers?filter=${encoded}`;

    navigator.clipboard.writeText(shareUrl);
    toast.success('筛选条件链接已复制到剪贴板');
  };

  const getFilterCount = (filters: FilterValues) => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.level !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.favorite !== 'all') count++;
    if (filters.search) count++;
    if (filters.country !== 'all') count++;
    if (filters.tags.length > 0) count++;
    if (filters.subscriberCount[0] !== 0 || filters.subscriberCount[1] !== 10000000) count++;
    if (filters.averagePrice[0] !== 0 || filters.averagePrice[1] !== 50000) count++;
    if (filters.engagementRate[0] !== 0 || filters.engagementRate[1] !== 20) count++;
    if (filters.qualityScore[0] !== 0 || filters.qualityScore[1] !== 100) count++;
    if (filters.cooperationCount[0] !== 0 || filters.cooperationCount[1] !== 50) count++;
    return count;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">保存的筛选条件</h3>
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Save className="w-4 h-4 mr-2" />
              保存当前筛选
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>保存筛选条件</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="filterName">名称 *</Label>
                <Input
                  id="filterName"
                  placeholder="例如：科技类高性价比达人"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filterDescription">描述</Label>
                <Input
                  id="filterDescription"
                  placeholder="描述这个筛选条件的用途"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {savedFilters.length === 0 ? (
        <Card className="p-6 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-sm text-gray-600">还没有保存的筛选条件</p>
          <p className="text-xs text-gray-500 mt-1">
            设置好筛选条件后，点击"保存当前筛选"
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {savedFilters.map((filter) => (
            <Card key={filter.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{filter.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getFilterCount(filter.filters)} 个条件
                    </Badge>
                  </div>
                  {filter.description && (
                    <p className="text-sm text-gray-600">{filter.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    保存于 {formatDate(filter.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLoad(filter)}
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleShare(filter)}
                  >
                    <Share className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(filter.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
