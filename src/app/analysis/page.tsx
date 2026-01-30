'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AnalysisPage() {
  const [dateRange, setDateRange] = useState('7d');
  const [filters, setFilters] = useState({
    channel: 'all',
    owner: 'all',
    category: 'all',
    status: 'all',
  });

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-semibold text-[#1D1D1F] mb-2">
          视频分析
        </h1>
        <p className="text-sm text-[#86868B]">
          查看视频数据表现，分析趋势与规律
        </p>
      </div>

      {/* 日期筛选 */}
      <Card className="p-4 bg-[#F5F5F7] border-none">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-[#86868B]">📅 日期范围</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm"
          >
            <option value="7d">最近7天</option>
            <option value="30d">最近30天</option>
            <option value="thisMonth">本月</option>
            <option value="thisQuarter">本季度</option>
          </select>
          <div className="flex gap-2">
            {['7d', '30d', 'thisMonth'].map(value => (
              <button
                key={value}
                onClick={() => setDateRange(value)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  dateRange === value
                    ? 'bg-[#007AFF] text-white'
                    : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#86868B] hover:bg-white'
                }`}
              >
                {value === '7d' ? '最近7天' : value === '30d' ? '最近30天' : '本月'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 维度筛选 */}
      <Card className="p-5 bg-[#F5F5F7] border-none">
        <div className="mb-4">
          <span className="text-sm font-medium text-[#86868B]">🎯 维度筛选</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#86868B]">博主</label>
            <select className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm">
              <option>全部</option>
              <option>博主A</option>
              <option>博主B</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#86868B]">负责人</label>
            <select className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm">
              <option>全部</option>
              <option>张三</option>
              <option>李四</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#86868B]">分类</label>
            <select className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm">
              <option>全部</option>
              <option>教育</option>
              <option>娱乐</option>
              <option>科技</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#86868B]">状态</label>
            <select className="w-full px-3 py-2 bg-white border border-[rgba(0,0,0,0.1)] rounded-lg text-sm">
              <option>全部</option>
              <option>优秀</option>
              <option>正常</option>
              <option>异常</option>
            </select>
          </div>
        </div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setFilters({
              channel: 'all',
              owner: 'all',
              category: 'all',
              status: 'all',
            });
          }}
        >
          重置筛选
        </Button>
      </Card>

      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="总观看量"
          value="1.5M"
          change="+12%"
          changeType="positive"
        />
        <MetricCard
          title="总点赞数"
          value="120K"
          change="+8%"
          changeType="positive"
        />
        <MetricCard
          title="总评论数"
          value="8.5K"
          change="+5%"
          changeType="positive"
        />
        <MetricCard
          title="平均互动率"
          value="7.8%"
          change="+1.2%"
          changeType="positive"
        />
      </div>

      {/* 趋势图表 */}
      <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
          观看量趋势
        </h2>
        <div className="flex gap-4 mb-4">
          <button className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm">
            观看量
          </button>
          <button className="px-4 py-2 bg-[#F5F5F7] text-[#86868B] rounded-lg text-sm">
            点赞数
          </button>
          <button className="px-4 py-2 bg-[#F5F5F7] text-[#86868B] rounded-lg text-sm">
            评论数
          </button>
          <button className="px-4 py-2 bg-[#F5F5F7] text-[#86868B] rounded-lg text-sm">
            互动率
          </button>
        </div>
        <div className="h-[300px] flex items-center justify-center bg-[#F5F5F7] rounded-xl">
          <p className="text-[#86868B]">折线图将在这里渲染（使用 Recharts）</p>
        </div>
      </Card>

      {/* 对比分析图表 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
            博主表现对比
          </h2>
          <div className="h-[300px] flex items-center justify-center bg-[#F5F5F7] rounded-xl">
            <p className="text-[#86868B]">柱状图将在这里渲染</p>
          </div>
        </Card>
        <Card className="p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <h2 className="text-lg font-semibold text-[#1D1D1F] mb-4">
            视频分类分布
          </h2>
          <div className="h-[300px] flex items-center justify-center bg-[#F5F5F7] rounded-xl">
            <p className="text-[#86868B]">饼图将在这里渲染</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

// 指标卡片组件
function MetricCard({
  title,
  value,
  change,
  changeType,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#86868B]">{title}</span>
        <span
          className={`text-xs font-medium ${
            changeType === 'positive' ? 'text-[#34C759]' : 'text-[#FF3B30]'
          }`}
        >
          {changeType === 'positive' ? '↑' : '↓'} {change}
        </span>
      </div>
      <div className="text-2xl font-semibold text-[#1D1D1F]">{value}</div>
    </div>
  );
}
