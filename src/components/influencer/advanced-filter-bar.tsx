'use client';

import { useState } from 'react';
import { Filter, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterOptions {
  tier: string;           // 等级: 'all' | 'tier1' | 'tier2' | 'tier3' | 'tier4'
  subscribers: string;    // 订阅数范围
  growthRate: string;     // 增长率范围
  language: string;       // 语种
}

interface AdvancedFilterBarProps {
  onChange: (filters: FilterOptions) => void;
  onShowInfo?: () => void;
}

export default function AdvancedFilterBar({ onChange, onShowInfo }: AdvancedFilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    tier: 'all',
    subscribers: 'all',
    growthRate: 'all',
    language: 'all',
  });

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      tier: 'all',
      subscribers: 'all',
      growthRate: 'all',
      language: 'all',
    };
    setFilters(resetFilters);
    onChange(resetFilters);
  };

  const hasActiveFilters =
    filters.tier !== 'all' ||
    filters.subscribers !== 'all' ||
    filters.growthRate !== 'all' ||
    filters.language !== 'all';

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-3">
        {/* 推荐度筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#86868B]">推荐度：</span>
          <Select
            value={filters.tier}
            onValueChange={(value) => handleFilterChange('tier', value)}
          >
            <SelectTrigger className="w-[140px] h-9 bg-white border-[#E5E5EA]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="tier1">Tier 1 (80+分)</SelectItem>
              <SelectItem value="tier2">Tier 2 (60-80分)</SelectItem>
              <SelectItem value="tier3">Tier 3 (40-60分)</SelectItem>
              <SelectItem value="tier4">Tier 4 (&lt;40分)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 订阅数筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#86868B]">订阅数：</span>
          <Select
            value={filters.subscribers}
            onValueChange={(value) => handleFilterChange('subscribers', value)}
          >
            <SelectTrigger className="w-[140px] h-9 bg-white border-[#E5E5EA]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="0-1000">&lt;1K（新手）</SelectItem>
              <SelectItem value="1000-10000">1K-10K（小众）</SelectItem>
              <SelectItem value="10000-100000">10K-100K（成长中）</SelectItem>
              <SelectItem value="100000-1000000">100K-1M（成熟）</SelectItem>
              <SelectItem value="1000000-999999999">&gt;1M（头部）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 增长率筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#86868B]">增长率：</span>
          <Select
            value={filters.growthRate}
            onValueChange={(value) => handleFilterChange('growthRate', value)}
          >
            <SelectTrigger className="w-[140px] h-9 bg-white border-[#E5E5EA]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="50-999">&gt;50%（快速增长）</SelectItem>
              <SelectItem value="20-50">20%-50%（良好）</SelectItem>
              <SelectItem value="10-20">10%-20%（稳定）</SelectItem>
              <SelectItem value="5-10">5%-10%（平缓）</SelectItem>
              <SelectItem value="0-5">&lt;5%（低增长）</SelectItem>
              <SelectItem value="-999-0">负增长</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 语种筛选 */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#86868B]">语种：</span>
          <Select
            value={filters.language}
            onValueChange={(value) => handleFilterChange('language', value)}
          >
            <SelectTrigger className="w-[140px] h-9 bg-white border-[#E5E5EA]">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="zh">中文</SelectItem>
              <SelectItem value="en">英语</SelectItem>
              <SelectItem value="ja">日语</SelectItem>
              <SelectItem value="ko">韩语</SelectItem>
              <SelectItem value="es">西班牙语</SelectItem>
              <SelectItem value="fr">法语</SelectItem>
              <SelectItem value="de">德语</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-sm text-[#86868B] hover:text-[#1D1D1F]"
          >
            重置筛选
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onShowInfo}
          className="text-sm text-[#007AFF] hover:text-[#0056CC]"
        >
          <Info className="w-4 h-4 mr-1" />
          指标说明
        </Button>
      </div>
    </div>
  );
}
