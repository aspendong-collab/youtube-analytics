'use client';

import { useState } from 'react';
import { Search, X, Globe, Eye, TrendingUp, MessageCircle, Mail, Star, Flame, Calendar, ThumbsUp } from 'lucide-react';
import type { InfluencerProfile } from '@/types/influencer';

interface SearchPageProps {
  onSearch: (keywords: string[], language: string, sortBy: string) => Promise<void>;
  onFilterChange: (filters: any) => void;
  onViewDetails?: (influencer: InfluencerProfile) => void;
  loading: boolean;
  loadingMore: boolean;
  influencers: InfluencerProfile[];
  error?: string | null;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  totalCount: number;
  onCategoryFilter?: (category: string) => void; // 新增：分类筛选回调
}

// 语种选项
const LANGUAGE_OPTIONS = [
  { value: 'all', label: '全部语言', flag: '🌍' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
  { value: 'th', label: 'ไทย', flag: '🇹🇭' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
];

// 排序选项
const SORT_OPTIONS = [
  { value: 'relevance', label: '综合推荐', icon: '⭐', Icon: Star },
  { value: 'viewCount', label: '热度', icon: '🔥', Icon: Flame },
  { value: 'date', label: '时间', icon: '📅', Icon: Calendar },
  { value: 'rating', label: '评分', icon: '👍', Icon: ThumbsUp },
  { value: 'views', label: '观看', icon: '👁', Icon: Eye },
];

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
  const formatSubscribers = (count: number | undefined | null) => {
    if (typeof count !== 'number' || isNaN(count)) return '-';
    return (count / 10000).toFixed(1) + '万';
  };

  const formatScore = (score: InfluencerProfile['score']) => {
    if (!score || typeof score.total !== 'number' || isNaN(score.total)) return '-';
    return score.total.toFixed(1);
  };

  const formatViews = (count: number | undefined | null) => {
    if (typeof count !== 'number' || isNaN(count)) return '-';
    if (count >= 100000000) return (count / 100000000).toFixed(1) + '亿';
    if (count >= 10000) return (count / 10000).toFixed(1) + '万';
    return count.toFixed(0);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    return (value * 100).toFixed(1) + '%';
  };

  const formatGrowthRate = (value: number | undefined | null) => {
    if (typeof value !== 'number' || isNaN(value)) return '-';
    const sign = value >= 0 ? '+' : '';
    return sign + (value * 100).toFixed(1) + '%';
  };

  const getCountry = (influencer: InfluencerProfile) => {
    return influencer.inferredCountry?.countryName || influencer.country || '-';
  };

  const getEmail = (influencer: InfluencerProfile) => {
    return influencer.inferredEmail?.email ||
           influencer.contactInfo?.email ||
           influencer.contactInfo?.businessEmail ||
           '-';
  };

  // 获取分类标签的颜色和样式
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case '精准博主':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          border: 'border-green-200',
        };
      case '次优博主':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-200',
        };
      case '潜在博主':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          border: 'border-orange-200',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          border: 'border-gray-200',
        };
    }
  };

  const category = influencer.score?.category || '待评估';
  const categoryStyle = getCategoryStyle(category);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => onViewDetails?.(influencer)}>
      <div className="aspect-video bg-gradient-to-br from-[#007AFF] to-[#5856D6] relative">
        <img
          src={influencer.avatar || influencer.channelThumbnail}
          alt={influencer.name || influencer.channelTitle}
          className="w-full h-full object-cover"
        />
        {/* 分类标签 */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} border`}>
            {category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[#1D1D1F] mb-1 truncate">{influencer.name || influencer.channelTitle}</h3>
        <p className="text-sm text-[#86868B] mb-3 line-clamp-2">{influencer.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#1D1D1F]">
              {formatSubscribers(influencer.subscriberCount)}
            </span>
            <span className="text-xs text-[#86868B]">订阅</span>
          </div>
          <div className="text-sm font-semibold text-[#34C759]">
            {formatScore(influencer.score)}
          </div>
        </div>

        <div className="space-y-2 text-xs border-t border-[#E5E5EA] pt-3">
          <div className="flex items-center gap-2 text-[#1D1D1F]">
            <Globe className="w-3.5 h-3.5 text-[#86868B]" />
            <span className="flex-1 truncate">{getCountry(influencer)}</span>
          </div>
          <div className="flex items-center gap-2 text-[#1D1D1F]">
            <Eye className="w-3.5 h-3.5 text-[#86868B]" />
            <span className="flex-1">均播: {formatViews(influencer.avgViews)}</span>
          </div>
          <div className="flex items-center gap-2 text-[#1D1D1F]">
            <TrendingUp className="w-3.5 h-3.5 text-[#86868B]" />
            <span className="flex-1">增长: {formatGrowthRate(influencer.viewsTrend)}</span>
          </div>
          <div className="flex items-center gap-2 text-[#1D1D1F]">
            <MessageCircle className="w-3.5 h-3.5 text-[#86868B]" />
            <span className="flex-1">互动: {formatPercentage(influencer.engagementRate)}</span>
          </div>
          <div className="flex items-center gap-2 text-[#1D1D1F]">
            <Mail className="w-3.5 h-3.5 text-[#86868B]" />
            <span className="flex-1 truncate text-[#007AFF]">{getEmail(influencer)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage({ 
  onSearch, 
  onFilterChange, 
  onViewDetails, 
  loading, 
  loadingMore, 
  influencers, 
  error, 
  hasMore, 
  onLoadMore,
  sortBy,
  onSortChange,
  totalCount,
  onCategoryFilter,
}: SearchPageProps) {
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [language, setLanguage] = useState('all');
  const [searchHistory, setSearchHistory] = useState<string[]>(['生产力工具', '科技测评', '教程分享', '生活方式']);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // 新增：选中的分类

  console.log('[SearchPage] 渲染状态:', { 
    loading, 
    influencersCount: influencers.length, 
    keywords, 
    language, 
    sortBy, 
    hasMore, 
    loadingMore,
    totalCount
  });

  const addKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 5) {
      setKeywords(prev => [...prev, trimmed]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearch = async () => {
    if (keywords.length === 0) return;

    console.log('[SearchPage] 开始搜索:', { keywords, language, sortBy });

    // 添加到搜索历史
    const searchKey = keywords.join(' + ');
    if (!searchHistory.includes(searchKey)) {
      setSearchHistory(prev => [searchKey, ...prev].slice(0, 10));
    }

    if (!recentSearches.includes(searchKey)) {
      setRecentSearches(prev => [searchKey, ...prev].slice(0, 5));
    }

    await onSearch(keywords, language, sortBy);
    console.log('[SearchPage] 搜索完成');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addKeyword();
    }
  };

  const handleQuickSearch = (keyword: string) => {
    setKeywords([keyword]);
    handleSearch();
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    console.log('[SearchPage] 加载更多...');
    await onLoadMore();
  };

  // 新增：处理分类筛选
  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (onCategoryFilter) {
      onCategoryFilter(category);
    }
  };

  // 新增：计算各分类的数量
  const getCategoryCounts = () => {
    const counts = {
      all: influencers.length,
      '精准博主': 0,
      '次优博主': 0,
      '潜在博主': 0,
      '不推荐': 0,
    };

    influencers.forEach(inf => {
      const category = inf.score?.category || '待评估';
      if (counts[category] !== undefined) {
        counts[category]++;
      }
    });

    return counts;
  };

  const categoryCounts = getCategoryCounts();

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="bg-white border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2">智能达人发现</h1>
          <p className="text-[#86868B]">发现精准的创作者合作伙伴</p>
        </div>
      </div>

      {/* 搜索控制台 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            {/* 关键词输入 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] w-5 h-5" />
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入关键词、频道名称或产品类型..."
                  className="w-full pl-10 pr-4 py-3 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  disabled={loading}
                />
                {keywordInput && (
                  <button
                    onClick={() => setKeywordInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 关键词标签 */}
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {keywords.map((keyword, index) => (
                    <div key={index} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(index)}
                        className="hover:text-blue-900 transition-colors"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 语种选择 */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-4 py-3 bg-[#F5F5F7] rounded-xl text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              disabled={loading}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>

            {/* 搜索按钮 */}
            <button
              onClick={handleSearch}
              disabled={loading || keywords.length === 0}
              className="px-8 py-3 bg-[#007AFF] text-white rounded-xl hover:bg-[#0056CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>

        {/* 排序控制栏 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#86868B] mr-2">排序：</span>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  sortBy === option.value
                    ? 'bg-[#007AFF] text-white'
                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
                disabled={loading}
              >
                <span>{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 分类筛选栏 */}
        {influencers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#86868B] mr-2">分类：</span>
              <button
                onClick={() => handleCategoryFilter('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#007AFF] text-white'
                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
                disabled={loading}
              >
                <span className="text-sm font-medium">全部 ({categoryCounts.all})</span>
              </button>
              <button
                onClick={() => handleCategoryFilter('精准博主')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === '精准博主'
                    ? 'bg-green-500 text-white'
                    : 'text-[#1D1D1F] hover:bg-green-100'
                }`}
                disabled={loading}
              >
                <span className="text-sm font-medium">精准 ({categoryCounts['精准博主']})</span>
              </button>
              <button
                onClick={() => handleCategoryFilter('次优博主')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === '次优博主'
                    ? 'bg-blue-500 text-white'
                    : 'text-[#1D1D1F] hover:bg-blue-100'
                }`}
                disabled={loading}
              >
                <span className="text-sm font-medium">次优 ({categoryCounts['次优博主']})</span>
              </button>
              <button
                onClick={() => handleCategoryFilter('潜在博主')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === '潜在博主'
                    ? 'bg-orange-500 text-white'
                    : 'text-[#1D1D1F] hover:bg-orange-100'
                }`}
                disabled={loading}
              >
                <span className="text-sm font-medium">潜在 ({categoryCounts['潜在博主']})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
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

      {/* 空状态 */}
      {!loading && !error && influencers.length === 0 && (
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="bg-white rounded-2xl shadow-sm p-12">
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
                      onClick={() => handleQuickSearch(term)}
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
                      onClick={() => handleQuickSearch(term)}
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

      {/* 搜索结果 */}
      {!loading && !error && influencers.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-4">
            <p className="text-sm text-[#86868B]">找到 <span className="font-semibold text-[#1D1D1F]">{totalCount}</span> 个达人</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {influencers.map((influencer) => (
              <InfluencerCard key={influencer.channelId} influencer={influencer} onViewDetails={onViewDetails} />
            ))}
          </div>

          <div className="mt-8 text-center">
            {hasMore ? (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-white border border-[#E5E5EA] text-[#1D1D1F] rounded-xl hover:bg-[#F5F5F7] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? '加载中...' : '加载更多...'}
              </button>
            ) : (
              <p className="text-sm text-[#86868B]">
                已加载全部 {influencers.length} 个结果
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
