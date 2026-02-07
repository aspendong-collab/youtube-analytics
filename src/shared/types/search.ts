/**
 * 搜索和过滤类型
 */

/**
 * YouTube 搜索过滤条件
 */
export interface YouTubeSearchFilters {
  regionCode?: string;
  relevanceLanguage?: string;
  safeSearch?: 'none' | 'moderate' | 'strict';
  videoDuration?: 'any' | 'short' | 'medium' | 'long';
  videoLicense?: 'any' | 'creativeCommon' | 'youtube';
  videoSyndicated?: 'any' | 'true' | 'false';
  videoType?: 'any' | 'episode' | 'movie';
}

/**
 * YouTube 搜索结果
 */
export interface YouTubeSearchResult {
  videos: any[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
    nextPageToken?: string;
    prevPageToken?: string;
  };
}

/**
 * Affiliate 搜索参数
 */
export interface AffiliateSearchParams {
  query: string;
  minViews?: number;
  maxViews?: number;
  minSubscribers?: number;
  maxSubscribers?: number;
  minLikes?: number;
  category?: string;
  region?: string;
  language?: string;
  sort?: 'relevance' | 'date' | 'viewCount' | 'rating';
  maxResults?: number;
}

/**
 * 关键词搜索参数
 */
export interface KeywordSearchParams {
  query?: string;
  category?: string;
  competition?: 'low' | 'medium' | 'high';
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
  status?: 'active' | 'archived' | 'deleted';
  minSearchVolume?: number;
  maxSearchVolume?: number;
}

/**
 * 通用排序参数
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * 通用过滤参数
 */
export interface FilterParams {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

/**
 * 查询构建器
 */
export class QueryBuilder {
  private filters: FilterParams[] = [];
  private sort?: SortParams;
  private pagination?: { page: number; pageSize: number };

  addFilter(filter: FilterParams): this {
    this.filters.push(filter);
    return this;
  }

  setSort(sort: SortParams): this {
    this.sort = sort;
    return this;
  }

  setPagination(page: number, pageSize: number): this {
    this.pagination = { page, pageSize };
    return this;
  }

  build(): {
    filters: FilterParams[];
    sort?: SortParams;
    pagination?: { page: number; pageSize: number };
  } {
    return {
      filters: this.filters,
      sort: this.sort,
      pagination: this.pagination,
    };
  }
}
