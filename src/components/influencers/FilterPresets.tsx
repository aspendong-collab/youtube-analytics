'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Award, Shield, DollarSign, Clock } from 'lucide-react';
import { FilterValues } from './AdvancedFilters';

interface FilterPresetProps {
  onApply: (filters: FilterValues) => void;
  loading?: boolean;
}

interface Preset {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  filters: FilterValues;
  color: string;
}

const PRESETS: Preset[] = [
  {
    id: 'high-engagement',
    name: '高互动达人',
    icon: <TrendingUp className="w-5 h-5" />,
    description: '互动率 > 10% 的优质达人',
    color: 'bg-green-100 text-green-700',
    filters: {
      status: 'all',
      level: 'all',
      category: 'all',
      favorite: 'all',
      search: '',
      subscriberCount: [0, 10000000],
      averagePrice: [0, 50000],
      engagementRate: [10, 20],
      qualityScore: [0, 100],
      cooperationCount: [0, 50],
      country: 'all',
      tags: [],
      sortBy: 'engagementRate',
      sortOrder: 'desc',
    },
  },
  {
    id: 'high-growth',
    name: '高增长达人',
    icon: <Zap className="w-5 h-5" />,
    description: '近期活跃且增长的潜力达人',
    color: 'bg-blue-100 text-blue-700',
    filters: {
      status: 'all',
      level: 'B',
      category: 'all',
      favorite: 'all',
      search: '',
      subscriberCount: [10000, 100000],
      averagePrice: [0, 5000],
      engagementRate: [5, 20],
      qualityScore: [70, 100],
      cooperationCount: [0, 3],
      country: 'all',
      tags: [],
      sortBy: 'qualityScore',
      sortOrder: 'desc',
    },
  },
  {
    id: 'top-tier',
    name: '头部达人',
    icon: <Award className="w-5 h-5" />,
    description: 'S级或A级的大影响力达人',
    color: 'bg-purple-100 text-purple-700',
    filters: {
      status: 'all',
      level: 'S',
      category: 'all',
      favorite: 'all',
      search: '',
      subscriberCount: [1000000, 10000000],
      averagePrice: [5000, 50000],
      engagementRate: [0, 20],
      qualityScore: [80, 100],
      cooperationCount: [0, 50],
      country: 'all',
      tags: [],
      sortBy: 'subscriberCount',
      sortOrder: 'desc',
    },
  },
  {
    id: 'cost-effective',
    name: '高性价比达人',
    icon: <DollarSign className="w-5 h-5" />,
    description: '价格合理、互动率高的达人',
    color: 'bg-yellow-100 text-yellow-700',
    filters: {
      status: 'available',
      level: 'B',
      category: 'all',
      favorite: 'all',
      search: '',
      subscriberCount: [100000, 500000],
      averagePrice: [1000, 5000],
      engagementRate: [8, 20],
      qualityScore: [70, 100],
      cooperationCount: [0, 5],
      country: 'all',
      tags: [],
      sortBy: 'engagementRate',
      sortOrder: 'desc',
    },
  },
  {
    id: 'new-talent',
    name: '潜力新人',
    icon: <Clock className="w-5 h-5" />,
    description: '近期活跃的C级潜力达人',
    color: 'bg-pink-100 text-pink-700',
    filters: {
      status: 'available',
      level: 'C',
      category: 'all',
      favorite: 'all',
      search: '',
      subscriberCount: [10000, 100000],
      averagePrice: [0, 2000],
      engagementRate: [5, 20],
      qualityScore: [60, 100],
      cooperationCount: [0, 2],
      country: 'all',
      tags: [],
      sortBy: 'subscriberCount',
      sortOrder: 'desc',
    },
  },
  {
    id: 'reliable',
    name: '可信赖达人',
    icon: <Shield className="w-5 h-5" />,
    description: '配合度高、质量稳定的优质达人',
    color: 'bg-indigo-100 text-indigo-700',
    filters: {
      status: 'all',
      level: 'all',
      category: 'all',
      favorite: 'all',
      search: '',
      subscriberCount: [0, 10000000],
      averagePrice: [0, 50000],
      engagementRate: [0, 20],
      qualityScore: [80, 100],
      cooperationCount: [3, 50],
      country: 'all',
      tags: [],
      sortBy: 'cooperationScore',
      sortOrder: 'desc',
    },
  },
];

export default function FilterPresets({ onApply, loading }: FilterPresetProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700">快速筛选</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {PRESETS.map((preset) => (
          <Card
            key={preset.id}
            className="p-4 cursor-pointer hover:shadow-md transition-all hover:scale-105 border-2 border-transparent hover:border-blue-200"
            onClick={() => !loading && onApply(preset.filters)}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 rounded-full mb-3 ${preset.color}`}>
                {preset.icon}
              </div>
              <div className="font-medium text-sm mb-1">{preset.name}</div>
              <div className="text-xs text-gray-600 line-clamp-2">
                {preset.description}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
