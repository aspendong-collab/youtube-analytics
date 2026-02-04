'use client';

import { useState } from 'react';
import SearchPage from '@/components/influencer/search-page';
import DetailDialog from '@/components/influencer/detail-dialog';
import type { InfluencerProfile } from '@/types/influencer';
import type { FilterOptions } from '@/components/influencer/advanced-filter-bar';

export default function AIDiscoveryPage() {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [allInfluencers, setAllInfluencers] = useState<InfluencerProfile[]>([]); // 保存原始数据
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKeyword, setCurrentKeyword] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handleSearch = async (keyword: string) => {
    console.log('[handleSearch] 开始搜索:', keyword);
    setLoading(true);
    setLoadingMore(false);
    setInfluencers([]); // 清空之前的结果
    setAllInfluencers([]); // 清空原始数据
    setError(null); // 清空错误信息
    setCurrentKeyword(keyword); // 保存当前搜索关键词
    setPage(1); // 重置页码
    setHasMore(true); // 重置是否有更多

    try {
      console.log('[handleSearch] 发送API请求...');
      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, maxResults: 20 }),
      });

      console.log('[handleSearch] 收到响应:', response.status);
      const result = await response.json();

      console.log('[handleSearch] 响应数据:', result);

      if (result.success) {
        console.log('[handleSearch] 搜索成功，找到达人:', result.data.influencers?.length || 0);
        const newInfluencers = result.data.influencers || [];
        setInfluencers(newInfluencers);
        setAllInfluencers(newInfluencers); // 保存原始数据
        // 每页20个，如果返回少于20个，说明没有更多了
        setHasMore(newInfluencers.length >= 20);
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

  const handleLoadMore = async () => {
    if (loadingMore || !currentKeyword || !hasMore) return;

    console.log('[handleLoadMore] 开始加载更多，当前页:', page, '关键词:', currentKeyword);
    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: currentKeyword,
          maxResults: 20,
          page: nextPage,
        }),
      });

      const result = await response.json();
      console.log('[handleLoadMore] 响应数据:', result);

      if (result.success) {
        const newInfluencers = result.data.influencers || [];
        console.log('[handleLoadMore] 加载成功，新增达人:', newInfluencers.length);

        // 追加到现有列表
        setInfluencers(prev => [...prev, ...newInfluencers]);
        setAllInfluencers(prev => [...prev, ...newInfluencers]);
        setPage(nextPage);

        // 如果返回少于20个，说明没有更多了
        setHasMore(newInfluencers.length >= 20);
      } else {
        setError(result.error || result.message || '加载更多失败');
      }
    } catch (error) {
      console.error('[handleLoadMore] 加载更多错误:', error);
      setError(error instanceof Error ? error.message : '加载更多出错');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (filters: FilterOptions) => {
    console.log('[handleFilterChange] 筛选条件:', filters);

    let filtered = [...allInfluencers];

    // 1. 按等级筛选
    if (filters.tier !== 'all') {
      filtered = filtered.filter((inf) => inf.score?.tier === filters.tier);
    }

    // 2. 按订阅数筛选
    if (filters.subscribers !== 'all') {
      const [min, max] = filters.subscribers.split('-').map(Number);
      filtered = filtered.filter((inf) => {
        const count = typeof inf.subscriberCount === 'number' ? inf.subscriberCount : 0;
        return count >= min && count < max;
      });
    }

    // 3. 按增长率筛选
    if (filters.growthRate !== 'all') {
      const [min, max] = filters.growthRate.split('-').map(Number);
      filtered = filtered.filter((inf) => {
        const trend = typeof inf.viewsTrend === 'number' ? inf.viewsTrend : 0;
        return trend >= min && trend < max;
      });
    }

    // 4. 按语种筛选
    if (filters.language !== 'all') {
      filtered = filtered.filter((inf) => {
        const language = inf.inferredLanguage?.language || inf.defaultLanguage || '';
        if (filters.language === 'other') {
          return !['zh', 'en', 'ja', 'ko', 'es', 'fr', 'de'].includes(language.toLowerCase());
        }
        return language.toLowerCase().startsWith(filters.language.toLowerCase());
      });
    }

    setInfluencers(filtered);
    console.log('[handleFilterChange] 筛选结果:', filtered.length);
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
        loadingMore={loadingMore}
        influencers={influencers}
        error={error}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />

      <DetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        influencer={selectedInfluencer}
      />
    </div>
  );
}
