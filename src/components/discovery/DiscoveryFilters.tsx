'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface DiscoveryFiltersProps {
  onFiltersChange: (filters: FilterValues) => void;
  onReset: () => void;
  videoCount?: number;
}

export interface FilterValues {
  // 播放量范围
  viewCount: [number, number];

  // 互动率范围 (%)
  engagementRate: [number, number];

  // 点赞数范围
  likeCount: [number, number];

  // 评论数范围
  commentCount: [number, number];

  // 热度评分范围 (0-100)
  popularityScore: [number, number];

  // 发布时间（天数）
  daysSincePublished: [number, number]; // 0-365

  // 视频时长范围（秒）
  duration: [number, number];

  // 订阅数范围
  subscriberCount: [number, number];

  // 排序方式
  sortBy: 'viewCount' | 'engagementRate' | 'popularityScore' | 'likeCount' | 'daysSincePublished';
  sortOrder: 'asc' | 'desc';
}

export default function DiscoveryFilters({
  onFiltersChange,
  onReset,
  videoCount = 0,
}: DiscoveryFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);

  const [filters, setFilters] = useState<FilterValues>({
    viewCount: [0, 100000000],
    engagementRate: [0, 20],
    likeCount: [0, 1000000],
    commentCount: [0, 100000],
    popularityScore: [0, 100],
    daysSincePublished: [0, 365],
    duration: [0, 7200],
    subscriberCount: [0, 10000000],
    sortBy: 'popularityScore',
    sortOrder: 'desc',
  });

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterValues = {
      viewCount: [0, 100000000],
      engagementRate: [0, 20],
      likeCount: [0, 1000000],
      commentCount: [0, 100000],
      popularityScore: [0, 100],
      daysSincePublished: [0, 365],
      duration: [0, 7200],
      subscriberCount: [0, 10000000],
      sortBy: 'popularityScore',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    onReset();
  };

  const formatNumber = (num: number) => {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
    if (num >= 10000000) return `${(num / 10000000).toFixed(1)}千万`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`;
  };

  const formatDays = (days: number) => {
    if (days === 0) return '今天';
    if (days < 7) return `${days}天内`;
    if (days < 30) return `${Math.floor(days / 7)}周内`;
    if (days < 365) return `${Math.floor(days / 30)}月内`;
    return `${Math.floor(days / 365)}年内`;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.viewCount[0] !== 0 || filters.viewCount[1] !== 100000000) count++;
    if (filters.engagementRate[0] !== 0 || filters.engagementRate[1] !== 20) count++;
    if (filters.likeCount[0] !== 0 || filters.likeCount[1] !== 1000000) count++;
    if (filters.commentCount[0] !== 0 || filters.commentCount[1] !== 100000) count++;
    if (filters.popularityScore[0] !== 0 || filters.popularityScore[1] !== 100) count++;
    if (filters.daysSincePublished[0] !== 0 || filters.daysSincePublished[1] !== 365) count++;
    if (filters.duration[0] !== 0 || filters.duration[1] !== 7200) count++;
    if (filters.subscriberCount[0] !== 0 || filters.subscriberCount[1] !== 10000000) count++;
    return count;
  };

  const SORT_OPTIONS = [
    { value: 'popularityScore', label: '综合热度' },
    { value: 'viewCount', label: '播放量' },
    { value: 'engagementRate', label: '互动率' },
    { value: 'likeCount', label: '点赞数' },
    { value: 'daysSincePublished', label: '发布时间' },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">筛选结果</h3>
          <Badge variant="outline" className="ml-2">
            {videoCount} 个视频
          </Badge>
          {getActiveFilterCount() > 0 && (
            <Badge className="bg-blue-500">
              {getActiveFilterCount()} 个筛选条件
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置
          </Button>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      <Collapsible open={isOpen}>
        <CollapsibleContent className="space-y-6">
          {/* 排序方式 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>排序方式</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>排序顺序</Label>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => handleFilterChange('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序（高到低）</SelectItem>
                  <SelectItem value="asc">升序（低到高）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 播放量范围 */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>播放量</Label>
              <span className="text-sm text-gray-600">
                {formatNumber(filters.viewCount[0])} - {formatNumber(filters.viewCount[1])}
              </span>
            </div>
            <Slider
              min={0}
              max={100000000}
              step={1000}
              value={filters.viewCount}
              onValueChange={(value) => handleFilterChange('viewCount', value)}
              className="w-full"
            />
          </div>

          {/* 互动率范围 */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>互动率 (%)</Label>
              <span className="text-sm text-gray-600">
                {filters.engagementRate[0]}% - {filters.engagementRate[1]}%
              </span>
            </div>
            <Slider
              min={0}
              max={20}
              step={0.5}
              value={filters.engagementRate}
              onValueChange={(value) => handleFilterChange('engagementRate', value)}
              className="w-full"
            />
          </div>

          {/* 点赞数范围 */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>点赞数</Label>
              <span className="text-sm text-gray-600">
                {formatNumber(filters.likeCount[0])} - {formatNumber(filters.likeCount[1])}
              </span>
            </div>
            <Slider
              min={0}
              max={1000000}
              step={100}
              value={filters.likeCount}
              onValueChange={(value) => handleFilterChange('likeCount', value)}
              className="w-full"
            />
          </div>

          {/* 评论数范围 */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>评论数</Label>
              <span className="text-sm text-gray-600">
                {formatNumber(filters.commentCount[0])} - {formatNumber(filters.commentCount[1])}
              </span>
            </div>
            <Slider
              min={0}
              max={100000}
              step={10}
              value={filters.commentCount}
              onValueChange={(value) => handleFilterChange('commentCount', value)}
              className="w-full"
            />
          </div>

          {/* 热度评分范围 */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>热度评分 (0-100)</Label>
              <span className="text-sm text-gray-600">
                {filters.popularityScore[0]} - {filters.popularityScore[1]}
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={filters.popularityScore}
              onValueChange={(value) => handleFilterChange('popularityScore', value)}
              className="w-full"
            />
          </div>

          {/* 发布时间范围 */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>发布时间</Label>
              <span className="text-sm text-gray-600">
                {formatDays(filters.daysSincePublished[0])} - {formatDays(filters.daysSincePublished[1])}
              </span>
            </div>
            <Slider
              min={0}
              max={365}
              step={1}
              value={filters.daysSincePublished}
              onValueChange={(value) => handleFilterChange('daysSincePublished', value)}
              className="w-full"
            />
          </div>

          {/* 视频时长范围 */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>视频时长</Label>
              <span className="text-sm text-gray-600">
                {formatDuration(filters.duration[0])} - {formatDuration(filters.duration[1])}
              </span>
            </div>
            <Slider
              min={0}
              max={7200}
              step={60}
              value={filters.duration}
              onValueChange={(value) => handleFilterChange('duration', value)}
              className="w-full"
            />
          </div>

          {/* 订阅数范围 */}
          <div>
            <div className="flex justify-between mb-2">
              <Label>频道订阅数</Label>
              <span className="text-sm text-gray-600">
                {formatNumber(filters.subscriberCount[0])} - {formatNumber(filters.subscriberCount[1])}
              </span>
            </div>
            <Slider
              min={0}
              max={10000000}
              step={1000}
              value={filters.subscriberCount}
              onValueChange={(value) => handleFilterChange('subscriberCount', value)}
              className="w-full"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
