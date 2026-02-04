'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import type { InfluencerProfile } from '@/types/influencer';

interface SearchPageProps {
  onSearch: (keyword: string) => Promise<void>;
  onFilterChange: (filters: any) => void;
  loading: boolean;
  influencers: InfluencerProfile[];
}

export default function SearchPage({ onSearch, onFilterChange, loading, influencers }: SearchPageProps) {
  const [keyword, setKeyword] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(['生产力工具', '科技测评', '教程分享', '生活方式']);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    // 添加到搜索历史
    if (!searchHistory.includes(keyword)) {
      setSearchHistory(prev => [keyword, ...prev].slice(0, 10));
    }

    // 添加到最近搜索
    if (!recentSearches.includes(keyword)) {
      setRecentSearches(prev => [keyword, ...prev].slice(0, 5));
    }

    await onSearch(keyword);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 头部 */}
      <div className="bg-white border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2">智能达人发现</h1>
          <p className="text-[#86868B]">发现精准的创作者合作伙伴</p>
        </div>
      </div>

      {/* 搜索区域 */}
      {!loading && influencers.length === 0 && (
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm p-12">
            {/* 搜索框 */}
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
                onClick={handleSearch}
                disabled={!keyword.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                搜索
              </button>
            </div>

            {/* 快捷入口 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <QuickEntryCard icon="🔍" title="关键词搜索" description="搜索关键词" />
              <QuickEntryCard icon="🌍" title="热门内容" description="热门内容" />
              <QuickEntryCard icon="📊" title="内容分类" description="内容分类" />
              <QuickEntryCard icon="⭐" title="为你推荐" description="为你推荐" />
            </div>

            {/* 推荐搜索 */}
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

          {/* 最近搜索 */}
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

      {/* 搜索中状态 */}
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
                ✅ 已搜索关键词
              </p>
              <p className="text-[#86868B] text-sm">
                ⏳ 正在分析达人数据...
              </p>
              <p className="text-[#86868B] text-sm">
                ⏳ 正在计算评分...
              </p>
              <p className="text-[#86868B] text-xs mt-4">
                💡 提示：首次搜索可能需要 10-15 秒，后续搜索会更快
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {!loading && influencers.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* 搜索栏 */}
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
                onClick={handleSearch}
                className="px-6 py-2 bg-[#007AFF] text-white rounded-lg hover:bg-[#0056CC] transition-colors font-medium"
              >
                搜索
              </button>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <FilterBar onChange={onFilterChange} />
          </div>

          {/* 结果统计 */}
          <div className="mb-6">
            <p className="text-[#86868B]">
              找到 <span className="font-semibold text-[#1D1D1F]">{influencers.length}</span> 个结果
            </p>
          </div>

          {/* 达人卡片列表 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {influencers.map((influencer) => (
              <InfluencerCard key={influencer.channelId} influencer={influencer} />
            ))}
          </div>

          {/* 加载更多 */}
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

// 快捷入口卡片
function QuickEntryCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <button className="p-6 bg-[#F5F5F7] rounded-xl hover:bg-[#E5E5EA] transition-colors text-left">
      <div className="text-3xl mb-3">{icon}</div>
      <p className="font-semibold text-[#1D1D1F] mb-1">{title}</p>
      <p className="text-sm text-[#86868B]">{description}</p>
    </button>
  );
}

// 筛选器组件（简化版）
function FilterBar({ onChange }: { onChange: (filters: any) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterButton label="全部" active={true} onClick={() => onChange({})} />
      <FilterButton label="📊 推荐度" onClick={() => onChange({ sortBy: 'score' })} />
      <FilterButton label="👥 订阅数" onClick={() => onChange({ sortBy: 'subscribers' })} />
      <FilterButton label="📈 增长率" onClick={() => onChange({ sortBy: 'growth' })} />
      <FilterButton label="🗣️ 语种" onClick={() => onChange({ sortBy: 'language' })} />
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-[#007AFF] text-white'
          : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
      }`}
    >
      {label}
    </button>
  );
}

// 达人卡片组件（简化版）
function InfluencerCard({ influencer }: { influencer: InfluencerProfile }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* 缩略图 */}
      <div className="relative aspect-video bg-[#F5F5F7]">
        {influencer.recentVideos?.[0]?.thumbnail ? (
          <img
            src={influencer.recentVideos[0].thumbnail}
            alt={influencer.recentVideos[0].title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#86868B]">无视频</span>
          </div>
        )}
        <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
          <span className="text-white font-bold">⭐ {influencer.score?.total || 0}</span>
        </div>
      </div>

      {/* 信息 */}
      <div className="p-4">
        <h3 className="font-semibold text-[#1D1D1F] mb-2 truncate">{influencer.channelTitle}</h3>
        <div className="flex items-center gap-2 text-xs text-[#86868B] mb-3">
          <span>{influencer.inferredCountry?.country || '🌍'}</span>
          <span>•</span>
          <span>{influencer.inferredEmail?.email ? '📧 ✅' : '📧 ❌'}</span>
          <span>•</span>
          <span>{influencer.inferredLanguage?.language || '🗣️'}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#86868B] mb-3">
          <span>👥 {formatNumber(influencer.subscriberCount)}</span>
          <span>📊 {formatNumber(influencer.avgViews)} 均播</span>
        </div>
        <div className="flex items-center gap-2 text-xs mb-4">
          <span className="px-2 py-1 bg-[#F5F5F7] rounded-md">📊 {influencer.score?.total || 0}分</span>
          <span className="px-2 py-1 bg-[#007AFF]/10 text-[#007AFF] rounded-md">🌟 {influencer.score?.tier || 'Tier 4'}</span>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium hover:bg-[#0056CC] transition-colors">
            查看详情
          </button>
          <button className="px-4 py-2 border border-[#E5E5EA] text-[#1D1D1F] rounded-lg text-sm font-medium hover:bg-[#F5F5F7] transition-colors">
            收藏
          </button>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
