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
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState(2024);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');

  console.log('[AIDiscoveryPage] 页面状态:', { 
    loading, 
    influencersCount: influencers.length, 
    currentKeywords,
    currentLanguage,
    currentSortBy,
    pageToken,
    currentYear,
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
    setPageToken(null);
    setCurrentYear(2024);
    setHasMore(true);
    setTotalCount(0);
    setLoadingMessage('');

    try {
      console.log('[handleSearch] 发送API请求...');
      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords,
          language,
          sortBy,
          maxResults: 50 
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
        setTotalCount(result.data.totalResults || newInfluencers.length);
        
        // 保存下一页 token
        setPageToken(result.data.nextPageToken || null);
        
        // 更新 hasMore 状态
        const hasMoreData = result.data.hasMore !== undefined 
          ? result.data.hasMore 
          : !!result.data.nextPageToken;
        setHasMore(hasMoreData);
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
          maxResults: 50 
        }),
      });

      const result = await response.json();
      console.log('[handleSortChange] 响应数据:', result);

      if (result.success) {
        const newInfluencers = result.data.influencers || [];
        setInfluencers(newInfluencers);
        setAllInfluencers(newInfluencers);
        setTotalCount(result.data.totalResults || newInfluencers.length);
        setPageToken(result.data.nextPageToken || null);
        setHasMore(!!result.data.nextPageToken);
        setCurrentSortBy(sortBy);
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
    if (loadingMore || currentKeywords.length === 0) return;

    console.log('[handleLoadMore] 开始加载更多');
    console.log('[handleLoadMore] 当前状态:', { pageToken, currentYear, hasMore });
    setLoadingMore(true);
    setError(null);

    try {
      let newPageToken = pageToken;
      let newYear = currentYear;
      let searchParams: any = {
        keywords: currentKeywords,
        language: currentLanguage,
        sortBy: currentSortBy,
        maxResults: 50,
      };

      // 如果有 pageToken，使用分页
      if (newPageToken) {
        searchParams.pageToken = newPageToken;
        setLoadingMessage(`正在加载更多...`);
      } else {
        // 没有更多分页 token，切换到下一年
        if (newYear > 2020) {
          newYear = newYear - 1;
          searchParams.publishedAfter = `${newYear}-01-01T00:00:00Z`;
          searchParams.publishedBefore = `${newYear}-12-31T23:59:59Z`;
          searchParams.pageToken = undefined; // 重置分页 token
          setLoadingMessage(`正在搜索 ${newYear} 年的视频...`);
        } else {
          // 已经到了最早的年份，没有更多数据了
          setHasMore(false);
          setLoadingMore(false);
          return;
        }
      }

      console.log('[handleLoadMore] 搜索参数:', searchParams);

      const response = await fetch('/api/influencers/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      });

      const result = await response.json();
      console.log('[handleLoadMore] 响应数据:', result);

      if (result.success) {
        const newInfluencers = result.data.influencers || [];
        console.log('[handleLoadMore] 加载成功，新增达人:', newInfluencers.length);

        // 如果没有新数据且当前是使用分页（不是按年份搜索），切换到下一年
        if (newInfluencers.length === 0 && newPageToken) {
          if (newYear > 2020) {
            console.log('[handleLoadMore] 当前年份没有更多数据，切换到下一年');
            newPageToken = null;
            newYear = newYear - 1;
            setCurrentYear(newYear);
            setPageToken(null);
            setLoadingMore(false);
            // 递归调用
            return handleLoadMore();
          } else {
            console.log('[handleLoadMore] 所有可能的数据都已加载完成');
            setHasMore(false);
            setLoadingMore(false);
            return;
          }
        }

        // 去重：只添加不存在的达人
        const existingChannelIds = new Set(allInfluencers.map((inf: InfluencerProfile) => inf.channelId));
        const uniqueNewInfluencers = newInfluencers.filter(
          (inf: InfluencerProfile) => !existingChannelIds.has(inf.channelId)
        );

        console.log('[handleLoadMore] 去重后实际新增达人:', uniqueNewInfluencers.length);

        setInfluencers(prev => [...prev, ...uniqueNewInfluencers]);
        setAllInfluencers(prev => [...prev, ...uniqueNewInfluencers]);
        setTotalCount((prev) => prev + uniqueNewInfluencers.length);
        
        // 更新状态
        setPageToken(result.data.nextPageToken || null);
        setCurrentYear(newYear);
        
        // 更新 hasMore 状态
        const hasMoreData = result.data.hasMore !== undefined 
          ? result.data.hasMore 
          : !!result.data.nextPageToken || newYear > 2020;
        setHasMore(hasMoreData);

        console.log('[handleLoadMore] 状态更新完成:', { 
          nextPageToken: result.data.nextPageToken, 
          newYear,
          hasMore: hasMoreData 
        });
      } else {
        setError(result.error || result.message || '加载更多失败');
      }
    } catch (error) {
      console.error('[handleLoadMore] 加载更多错误:', error);
      setError(error instanceof Error ? error.message : '加载更多出错');
    } finally {
      setLoadingMore(false);
      setLoadingMessage('');
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
