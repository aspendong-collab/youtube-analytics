/**
 * YouTube 搜索建议采集工具
 * 用于挖掘 YouTube Autocomplete 关键词
 */

interface SearchSuggestion {
  suggestion: string;
  type: 'autocomplete' | 'related' | 'trending';
}

/**
 * 搜索建议采集器
 */
class YouTubeSuggestionCollector {
  private baseUrl = 'https://suggestqueries.google.com/complete/search';
  private timeout = 3000; // 3秒超时（从5秒减少到3秒，更快触发降级）

  /**
   * 带超时的 fetch
   */
  private async fetchWithTimeout(url: string, timeout: number = this.timeout): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * 获取搜索建议
   */
  async getSearchSuggestions(query: string, options: {
    lang?: string;
    market?: string;
    depth?: number;
  } = {}): Promise<string[]> {
    const {
      lang = 'en',
      market = 'US',
      depth = 1,
    } = options;

    const suggestions = new Set<string>();

    // 第一层：直接查询
    try {
      const level1 = await this.fetchSuggestions(query, lang, market);
      level1.forEach(s => suggestions.add(s));
    } catch (error) {
      console.error(`[SuggestionCollector] 获取第一层建议失败:`, error);
    }

    // 第二层：对前10个建议进行递归查询
    if (depth >= 2) {
      const topSuggestions = Array.from(suggestions).slice(0, 10);

      for (const suggestion of topSuggestions) {
        try {
          const level2 = await this.fetchSuggestions(suggestion, lang, market);
          level2.forEach(s => suggestions.add(s));
        } catch (error) {
          console.error(`[SuggestionCollector] 获取第二层建议失败:`, error);
        }

        // 防止过度采集
        if (suggestions.size > 200) break;
      }
    }

    return Array.from(suggestions);
  }

  /**
   * 从 Google Suggest API 获取建议
   */
  private async fetchSuggestions(query: string, lang: string, market: string): Promise<string[]> {
    try {
      const url = `${this.baseUrl}?client=firefox&ds=yt&q=${encodeURIComponent(query)}&hl=${lang}&gl=${market}`;

      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.status}`);
      }

      const data = await response.json();

      // Google Suggest API 返回格式: [[query, suggestion1, suggestion2, ...], [search types]]
      if (Array.isArray(data) && data.length >= 1) {
        const suggestions = data[0];
        if (Array.isArray(suggestions)) {
          // 过滤掉原始查询词，只返回建议
          return suggestions
            .filter(s => s !== query && s.toLowerCase().includes(query.toLowerCase()))
            .slice(1); // 跳过原始查询
        }
      }

      return [];
    } catch (error) {
      console.error('[YouTubeSuggestionCollector] Fetch suggestions error:', error);
      return [];
    }
  }

  /**
   * 获取变体搜索建议（添加常见后缀）
   */
  async getVariantSuggestions(keyword: string, lang: string = 'en'): Promise<string[]> {
    const suffixes = [
      ' 2024',
      ' 2025',
      ' tutorial',
      ' tips',
      ' guide',
      ' for beginners',
      ' advanced',
      ' online',
      ' free',
      ' best',
      ' top 10',
      ' how to',
      ' with me',
      ' motivation',
      ' music',
      ' playlist',
      ' app',
      ' course',
      ' lesson',
    ];

    const suggestions = new Set<string>();

    // 获取基础建议
    const baseSuggestions = await this.getSearchSuggestions(keyword, { lang });
    baseSuggestions.forEach(s => suggestions.add(s));

    // 获取带后缀的建议
    for (const suffix of suffixes) {
      const variant = `${keyword}${suffix}`;
      const variantSuggestions = await this.getSearchSuggestions(variant, { lang, depth: 1 });
      variantSuggestions.forEach(s => suggestions.add(s));

      if (suggestions.size > 150) break;
    }

    return Array.from(suggestions);
  }

  /**
   * 批量采集多个关键词的建议
   */
  async batchGetSuggestions(keywords: string[], options: {
    lang?: string;
    market?: string;
    depth?: number;
  } = {}): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();

    for (const keyword of keywords) {
      const suggestions = await this.getSearchSuggestions(keyword, options);
      results.set(keyword, suggestions);
    }

    return results;
  }

  /**
   * 分类搜索建议
   */
  categorizeSuggestions(suggestions: string[]): {
    questions: string[];
    howTo: string[];
    lists: string[];
    comparisons: string[];
    withMe: string[];
    tutorial: string[];
    playlist: string[];
    music: string[];
    other: string[];
  } {
    const categories = {
      questions: [] as string[],
      howTo: [] as string[],
      lists: [] as string[],
      comparisons: [] as string[],
      withMe: [] as string[],
      tutorial: [] as string[],
      playlist: [] as string[],
      music: [] as string[],
      other: [] as string[],
    };

    suggestions.forEach(suggestion => {
      const lower = suggestion.toLowerCase();

      if (lower.startsWith('what') || lower.startsWith('why') || lower.startsWith('which') || lower.startsWith('when') || lower.includes('?')) {
        categories.questions.push(suggestion);
      } else if (lower.startsWith('how to')) {
        categories.howTo.push(suggestion);
      } else if (/\d+\s*(best|top|ways|tips|methods|apps)/i.test(lower)) {
        categories.lists.push(suggestion);
      } else if (lower.includes(' vs ') || lower.includes(' versus ') || lower.includes(' or ')) {
        categories.comparisons.push(suggestion);
      } else if (lower.includes('with me') || lower.includes('study with me')) {
        categories.withMe.push(suggestion);
      } else if (lower.includes('tutorial') || lower.includes('guide') || lower.includes('lesson')) {
        categories.tutorial.push(suggestion);
      } else if (lower.includes('playlist') || lower.includes('mix')) {
        categories.playlist.push(suggestion);
      } else if (lower.includes('music') || lower.includes('lofi') || lower.includes('beats')) {
        categories.music.push(suggestion);
      } else {
        categories.other.push(suggestion);
      }
    });

    return categories;
  }
}

// 导出单例
export const suggestionCollector = new YouTubeSuggestionCollector();
