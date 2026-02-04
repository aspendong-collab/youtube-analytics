'use client';

import { useState } from 'react';
import SearchPage from '@/components/influencer/search-page';
import DetailDialog from '@/components/influencer/detail-dialog';
import type { InfluencerProfile } from '@/types/influencer';

export default function AIDiscoveryPage() {
  const [loading, setLoading] = useState(false);
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (keyword: string) => {
    console.log('[handleSearch] 开始搜索:', keyword);
    setLoading(true);
    setInfluencers([]); // 清空之前的结果
    setError(null); // 清空错误信息

    try {
      console.log('[handleSearch] 发送API请求...');
      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });

      console.log('[handleSearch] 收到响应:', response.status);
      const result = await response.json();

      console.log('[handleSearch] 响应数据:', result);

      if (result.success) {
        console.log('[handleSearch] 搜索成功，找到达人:', result.data.influencers?.length || 0);
        setInfluencers(result.data.influencers || []);
      } else {
        console.error('[handleSearch] 搜索失败:', result.error);
        setError(result.error || result.message || '搜索失败');
      }
    } catch (error) {
      console.error('[handleSearch] 搜索错误:', error);
      setError(error instanceof Error ? error.message : '搜索出错');
    } finally {
      setLoading(false);
      console.log('[handleSearch] 搜索完成，loading:', false);
    }
  };

  const handleFilterChange = (filters: any) => {
    // 简化的前端筛选
    let filtered = [...influencers];

    if (filters.sortBy === 'score') {
      filtered.sort((a, b) => (b.score?.total || 0) - (a.score?.total || 0));
    } else if (filters.sortBy === 'subscribers') {
      filtered.sort((a, b) => b.subscriberCount - a.subscriberCount);
    } else if (filters.sortBy === 'growth') {
      filtered.sort((a, b) => b.viewsTrend - a.viewsTrend);
    } else if (filters.sortBy === 'language') {
      filtered.sort((a, b) => (a.inferredLanguage?.language || '').localeCompare(b.inferredLanguage?.language || ''));
    }

    setInfluencers(filtered);
  };

  const handleViewDetails = (influencer: InfluencerProfile) => {
    setSelectedInfluencer(influencer);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <SearchPage
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onViewDetails={handleViewDetails}
        loading={loading}
        influencers={influencers}
        error={error}
      />

      <DetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        influencer={selectedInfluencer}
      />
    </div>
  );
}
