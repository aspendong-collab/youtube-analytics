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
  const [allInfluencers, setAllInfluencers] = useState<InfluencerProfile[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentKeywords, setCurrentKeywords] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('all');
  const [currentSortBy, setCurrentSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  console.log('[AIDiscoveryPage] 页面状态:', { 
    loading, 
    influencersCount: influencers.length, 
    currentKeywords,
    currentLanguage,
    currentSortBy,
    totalCount
  });

  const handleSearch = async (keywords: string[], language: string, sortBy: string) => {
    console.log('[handleSearch] 开始搜索:', { keywords, language, sortBy });
    setLoading(true);
    setLoadingMore(false);
    setInfluencers([]);
    setAllInfluencers([]);
    setError(null);
    setCurrentKeywords(keywords);
    setCurrentLanguage(language);
    setCurrentSortBy(sortBy);
    setPage(1);
    setHasMore(true);
    setTotalCount(0);

    try {
      console.log('[handleSearch] 发送API请求...');
      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords,
          language,
          sortBy,
          maxResults: 20 
        }),
      });

      console.log('[handleSearch] 收到响应:', response.status);
      const result = await response.json();

      console.log('[handleSearch] 响应数据:', result);

      if (result.success) {
        console.log('[handleSearch] 搜索成功，找到达人:', result.data.influencers?.length || 0);
        const newInfluencers = result.data.influencers || [];
        setInfluencers(newInfluencers);
        setAllInfluencers(newInfluencers);
        setTotalCount(result.data.count || newInfluencers.length);
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

  const handleSortChange = async (sortBy: string) => {
    console.log('[handleSortChange] 排序改变:', { currentKeywords, currentLanguage, sortBy });
    
    // 如果没有搜索结果，直接更新排序方式
    if (influencers.length === 0) {
      setCurrentSortBy(sortBy);
      return;
    }

    // 重新搜索，应用新的排序方式
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: currentKeywords,
          language: currentLanguage,
          sortBy,
          maxResults: 20 
        }),
      });

      const result = await response.json();
      console.log('[handleSortChange] 响应数据:', result);

      if (result.success) {
        const newInfluencers = result.data.influencers || [];
        setInfluencers(newInfluencers);
        setAllInfluencers(newInfluencers);
        setTotalCount(result.data.count || newInfluencers.length);
        setHasMore(newInfluencers.length >= 20);
        setCurrentSortBy(sortBy);
        setPage(1);
      } else {
        setError(result.error || result.message || '排序失败');
      }
    } catch (error) {
      console.error('[handleSortChange] 排序错误:', error);
      setError(error instanceof Error ? error.message : '排序出错');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || currentKeywords.length === 0 || !hasMore) return;

    console.log('[handleLoadMore] 开始加载更多，当前页:', page);
    setLoadingMore(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: currentKeywords,
          language: currentLanguage,
          sortBy: currentSortBy,
          maxResults: 20,
          page: nextPage,
        }),
      });

      const result = await response.json();
      console.log('[handleLoadMore] 响应数据:', result);

      if (result.success) {
        const newInfluencers = result.data.influencers || [];
        console.log('[handleLoadMore] 加载成功，新增达人:', newInfluencers.length);

        setInfluencers(prev => [...prev, ...newInfluencers]);
        setAllInfluencers(prev => [...prev, ...newInfluencers]);
        setPage(nextPage);
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

    if (filters.tier !== 'all') {
      filtered = filtered.filter((inf) => inf.score?.tier === filters.tier);
    }

    if (filters.subscribers !== 'all') {
      const [min, max] = filters.subscribers.split('-').map(Number);
      filtered = filtered.filter((inf) => {
        const count = typeof inf.subscriberCount === 'number' ? inf.subscriberCount : 0;
        return count >= min && count < max;
      });
    }

    if (filters.growthRate !== 'all') {
      const [min, max] = filters.growthRate.split('-').map(Number);
      filtered = filtered.filter((inf) => {
        const trend = typeof inf.viewsTrend === 'number' ? inf.viewsTrend : 0;
        return trend >= min && trend < max;
      });
    }

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
        sortBy={currentSortBy}
        onSortChange={handleSortChange}
        totalCount={totalCount}
      />

      <DetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        influencer={selectedInfluencer}
      />
    </div>
  );
}
