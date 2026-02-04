'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { InfluencerProfile } from '@/types/influencer';

interface SearchPageProps {
  onSearch: (keyword: string) => Promise<void>;
  onFilterChange: (filters: any) => void;
  onViewDetails?: (influencer: InfluencerProfile) => void;
  loading: boolean;
  influencers: InfluencerProfile[];
  error?: string | null;
}

function QuickEntryCard({ icon, title, description, onClick }: { icon: string; title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#F5F5F7] rounded-xl p-4 text-left hover:bg-[#E5E5EA] transition-colors"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-medium text-[#1D1D1F] text-sm">{title}</div>
      <div className="text-xs text-[#86868B] mt-1">{description}</div>
    </button>
  );
}

function InfluencerCard({ influencer, onViewDetails }: { influencer: InfluencerProfile; onViewDetails?: (influencer: InfluencerProfile) => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => onViewDetails?.(influencer)}>
      <div className="aspect-video bg-gradient-to-br from-[#007AFF] to-[#5856D6] relative">
        <img
          src={influencer.avatar}
          alt={influencer.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[#1D1D1F] mb-1 truncate">{influencer.name}</h3>
        <p className="text-sm text-[#86868B] mb-3 line-clamp-2">{influencer.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#1D1D1F]">
              {(influencer.subscriberCount / 10000).toFixed(1)}万
            </span>
          </div>
          <div className="text-sm font-semibold text-[#34C759]">
            {influencer.score?.toFixed(1) || '-'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage({ onSearch, onFilterChange, onViewDetails, loading, influencers, error }: SearchPageProps) {
  const [keyword, setKeyword] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(['生产力工具', '科技测评', '教程分享', '生活方式']);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  console.log('[SearchPage] 渲染状态:', { loading, influencersCount: influencers.length, keyword });

  const handleSearch = async (searchKeyword?: string) => {
    const keywordToSearch = searchKeyword || keyword;
    if (!keywordToSearch.trim()) return;

    console.log('[SearchPage] 开始搜索:', keywordToSearch);

    if (!searchHistory.includes(keywordToSearch)) {
      setSearchHistory(prev => [keywordToSearch, ...prev].slice(0, 10));
    }

    if (!recentSearches.includes(keywordToSearch)) {
      setRecentSearches(prev => [keywordToSearch, ...prev].slice(0, 5));
    }

    await onSearch(keywordToSearch);
    console.log('[SearchPage] 搜索完成');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="bg-white border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2">智能达人发现</h1>
          <p className="text-[#86868B]">发现精准的创作者合作伙伴</p>
        </div>
      </div>

      {!loading && error && (
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">搜索失败</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      )}

      {!loading && !error && influencers.length === 0 && (
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm p-12">
            <div className="relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B] w-6 h-6" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入关键词、频道名称或产品类型..."
                className="w-full pl-14 pr-4 py-4 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder-[#86868B] text-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
              <button
                onClick={() => handleSearch()}
                disabled={!keyword.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                搜索
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <QuickEntryCard icon="🔍" title="关键词搜索" description="搜索关键词" onClick={() => {}} />
              <QuickEntryCard icon="🌍" title="热门内容" description="热门内容" onClick={() => {}} />
              <QuickEntryCard icon="📊" title="内容分类" description="内容分类" onClick={() => {}} />
              <QuickEntryCard icon="⭐" title="为你推荐" description="为你推荐" onClick={() => {}} />
            </div>

            {searchHistory.length > 0 && (
              <div>
                <p className="text-sm font-medium text-[#86868B] mb-4 uppercase tracking-wide">推荐搜索</p>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setKeyword(term);
                        onSearch(term);
                      }}
                      className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-full hover:bg-[#E5E5EA] transition-colors text-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {recentSearches.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-medium text-[#86868B] mb-4 uppercase tracking-wide">最近搜索</p>
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setKeyword(term);
                        onSearch(term);
                      }}
                      className="px-4 py-2 bg-[#F5F5F7] text-[#1D1D1F] rounded-full hover:bg-[#E5E5EA] transition-colors text-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm p-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-[#1D1D1F] mb-2">正在搜索达人...</h2>
              <div className="w-full bg-[#E5E5EA] rounded-full h-2 mb-4">
                <div className="bg-[#007AFF] h-2 rounded-full transition-all duration-300" style={{ width: '47%' }}></div>
              </div>
              <p className="text-[#86868B] text-sm">
                已搜索关键词
              </p>
              <p className="text-[#86868B] text-sm">
                正在分析达人数据...
              </p>
              <p className="text-[#86868B] text-sm">
                正在计算评分...
              </p>
              <p className="text-[#86868B] text-xs mt-4">
                提示：首次搜索可能需要 10-15 秒，后续搜索会更快
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && influencers.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <Search className="text-[#86868B] w-6 h-6" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入关键词搜索..."
                className="flex-1 bg-transparent text-[#1D1D1F] placeholder-[#86868B] focus:outline-none"
              />
              <button
                onClick={() => handleSearch()}
                className="px-6 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056CC] transition-colors font-medium"
              >
                搜索
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {influencers.map((influencer) => (
              <InfluencerCard key={influencer.channelId} influencer={influencer} onViewDetails={onViewDetails} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <button className="px-8 py-3 bg-white border border-[#E5E5EA] text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors font-medium">
              加载更多...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
