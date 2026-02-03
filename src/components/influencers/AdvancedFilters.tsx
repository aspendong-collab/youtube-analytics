'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Filter, ChevronDown, ChevronUp, RotateCcw, Save, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterValues) => void;
  onReset: () => void;
  loading?: boolean;
}

export interface FilterValues {
  // 基础筛选
  status: string;
  level: string;
  category: string;
  favorite: string;
  search: string;

  // 范围筛选
  subscriberCount: [number, number];
  averagePrice: [number, number];
  engagementRate: [number, number];
  qualityScore: [number, number];
  cooperationCount: [number, number];

  // 其他筛选
  country: string;
  tags: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const CATEGORIES = ['科技', '美妆', '游戏', '教育', '生活', '美食', '旅行', '音乐', '时尚', '其他'];
const COUNTRIES = ['US', 'CN', 'JP', 'KR', 'GB', 'DE', 'FR', 'BR', 'IN', 'CA'];
const TAGS = ['评测', '开箱', '教程', 'Vlog', '种草', '搞笑', '科普', '访谈'];

const SORT_OPTIONS = [
  { value: 'createdAt', label: '创建时间' },
  { value: 'subscriberCount', label: '订阅数' },
  { value: 'averagePrice', label: '平均报价' },
  { value: 'qualityScore', label: '质量评分' },
  { value: 'cooperationScore', label: '配合度评分' },
  { value: 'engagementRate', label: '互动率' },
  { value: 'cooperationCount', label: '合作次数' },
];

export default function AdvancedFilters({
  onFiltersChange,
  onReset,
  loading = false,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({
    status: 'all',
    level: 'all',
    category: 'all',
    favorite: 'all',
    search: '',

    subscriberCount: [0, 10000000],
    averagePrice: [0, 50000],
    engagementRate: [0, 20],
    qualityScore: [0, 100],
    cooperationCount: [0, 50],

    country: 'all',
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleRangeChange = (key: keyof FilterValues, value: number[]) => {
    handleFilterChange(key, value);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    handleFilterChange('tags', newTags);
  };

  const handleReset = () => {
    const resetFilters: FilterValues = {
      status: 'all',
      level: 'all',
      category: 'all',
      favorite: 'all',
      search: '',

      subscriberCount: [0, 10000000],
      averagePrice: [0, 50000],
      engagementRate: [0, 20],
      qualityScore: [0, 100],
      cooperationCount: [0, 50],

      country: 'all',
      tags: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    onReset();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">高级筛选</h3>
          <Badge variant="outline" className="ml-2">
            {getActiveFilterCount(filters)} 个条件
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={loading}
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
        <CollapsibleContent>
          {/* 基础筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>搜索</Label>
              <Input
                placeholder="频道名称、邮箱..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <Label>状态</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="available">可合作</SelectItem>
                  <SelectItem value="contacted">沟通中</SelectItem>
                  <SelectItem value="collaborating">合作中</SelectItem>
                  <SelectItem value="blacklist">黑名单</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>等级</Label>
              <Select
                value={filters.level}
                onValueChange={(value) => handleFilterChange('level', value)}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部等级</SelectItem>
                  {['S', 'A', 'B', 'C', 'D'].map((level) => (
                    <SelectItem key={level} value={level}>{level}级</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>收藏</Label>
              <Select
                value={filters.favorite}
                onValueChange={(value) => handleFilterChange('favorite', value)}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="true">已收藏</SelectItem>
                  <SelectItem value="false">未收藏</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 范围筛选 */}
          <div className="space-y-6 mb-6">
            {/* 订阅数范围 */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>订阅数</Label>
                <span className="text-sm text-gray-600">
                  {formatNumber(filters.subscriberCount[0])} - {formatNumber(filters.subscriberCount[1])}
                </span>
              </div>
              <Slider
                min={0}
                max={10000000}
                step={10000}
                value={filters.subscriberCount}
                onValueChange={(value) => handleRangeChange('subscriberCount', value)}
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* 价格范围 */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>价格范围 (USD)</Label>
                <span className="text-sm text-gray-600">
                  ${filters.averagePrice[0]} - ${filters.averagePrice[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={50000}
                step={100}
                value={filters.averagePrice}
                onValueChange={(value) => handleRangeChange('averagePrice', value)}
                disabled={loading}
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
                onValueChange={(value) => handleRangeChange('engagementRate', value)}
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* 质量评分范围 */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>质量评分</Label>
                <span className="text-sm text-gray-600">
                  {filters.qualityScore[0]} - {filters.qualityScore[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={filters.qualityScore}
                onValueChange={(value) => handleRangeChange('qualityScore', value)}
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* 合作次数范围 */}
            <div>
              <div className="flex justify-between mb-2">
                <Label>合作次数</Label>
                <span className="text-sm text-gray-600">
                  {filters.cooperationCount[0]} - {filters.cooperationCount[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={50}
                step={1}
                value={filters.cooperationCount}
                onValueChange={(value) => handleRangeChange('cooperationCount', value)}
                disabled={loading}
                className="w-full"
              />
            </div>
          </div>

          {/* 其他筛选 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>分类</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>国家</Label>
              <Select
                value={filters.country}
                onValueChange={(value) => handleFilterChange('country', value)}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部国家</SelectItem>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>排序方式</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger disabled={loading}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 标签筛选 */}
          <div>
            <Label>标签</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function getActiveFilterCount(filters: FilterValues): number {
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
}
