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

  const handleSearch = async (keyword: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });

      const result = await response.json();

      if (result.success) {
        setInfluencers(result.data.influencers);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
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
        loading={loading}
        influencers={influencers}
      />

      <DetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        influencer={selectedInfluencer}
      />
    </div>
  );
}
