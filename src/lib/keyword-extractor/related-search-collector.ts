/**
 * YouTube 相关搜索采集工具
 * 用于挖掘相关搜索词
 */

/**
 * 相关搜索采集器
 */
class RelatedSearchCollector {
  private timeout = 3000; // 3秒超时（比搜索建议更短，因为有多个请求）

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
   * 获取相关搜索词（基于搜索建议的变体）
   */
  async getRelatedSearches(keyword: string, options: {
    lang?: string;
    market?: string;
  } = {}): Promise<string[]> {
    const {
      lang = 'en',
      market = 'US',
    } = options;

    const relatedSearches = new Set<string>();

    // 策略1：字母递归（获取所有以关键词开头的建议）
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    for (const letter of alphabet) {
      const query = `${keyword} ${letter}`;
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}&hl=${lang}&gl=${market}`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();

        if (Array.isArray(data) && data.length >= 1) {
          const suggestions = data[0];
          if (Array.isArray(suggestions)) {
            suggestions.forEach(s => {
              if (s !== keyword && s.toLowerCase().includes(keyword.toLowerCase())) {
                relatedSearches.add(s);
              }
            });
          }
        }
      } catch (error) {
        // 静默失败，继续处理下一个字母
        continue;
      }

      if (relatedSearches.size > 100) break;
    }

    // 策略2：添加常见前缀
    const prefixes = [
      'best',
      'how to',
      'why',
      'what is',
      'top 10',
      'good',
      'free',
      'cheap',
      'effective',
      'quick',
      'easy',
      'advanced',
      'basic',
      'online',
      'mobile',
    ];

    for (const prefix of prefixes) {
      const query = `${prefix} ${keyword}`;
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}&hl=${lang}&gl=${market}`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();

        if (Array.isArray(data) && data.length >= 1) {
          const suggestions = data[0];
          if (Array.isArray(suggestions)) {
            suggestions.forEach(s => {
              if (s !== keyword && s.toLowerCase().includes(keyword.toLowerCase())) {
                relatedSearches.add(s);
              }
            });
          }
        }
      } catch (error) {
        continue;
      }

      if (relatedSearches.size > 150) break;
    }

    return Array.from(relatedSearches);
  }

  /**
   * 获取相关话题（基于推荐算法模拟）
   */
  async getRelatedTopics(keyword: string, lang: string = 'en'): Promise<string[]> {
    const topics = new Set<string>();

    // 基于关键词的语义扩展
    const semanticExpansions = [
      `${keyword} tips`,
      `${keyword} tricks`,
      `${keyword} hacks`,
      `${keyword} strategies`,
      `${keyword} methods`,
      `${keyword} techniques`,
      `${keyword} tools`,
      `${keyword} apps`,
      `${keyword} software`,
      `${keyword} for beginners`,
      `${keyword} advanced`,
      `${keyword} 2024`,
      `${keyword} 2025`,
      `${keyword} course`,
      `${keyword} tutorial`,
      `${keyword} guide`,
      `${keyword} playlist`,
      `${keyword} motivation`,
      `${keyword} challenge`,
      `${keyword} routine`,
    ];

    // 对每个扩展进行搜索建议查询
    for (const expansion of semanticExpansions) {
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(expansion)}&hl=${lang}`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();

        if (Array.isArray(data) && data.length >= 1) {
          const suggestions = data[0];
          if (Array.isArray(suggestions)) {
            suggestions.forEach(s => {
              if (s.toLowerCase().includes(keyword.toLowerCase())) {
                topics.add(s);
              }
            });
          }
        }
      } catch (error) {
        continue;
      }

      if (topics.size > 100) break;
    }

    return Array.from(topics);
  }

  /**
   * 获取竞品关键词（基于常见频道模式）
   */
  async getCompetitorKeywords(keyword: string): Promise<string[]> {
    const competitorPatterns = [
      `${keyword} with me`,
      `study with me ${keyword}`,
      `${keyword} day in the life`,
      `how I ${keyword}`,
      `${keyword} routine`,
      `${keyword} schedule`,
      `my ${keyword} journey`,
      `${keyword} transformation`,
      `best ${keyword}`,
      `${keyword} review`,
    ];

    const competitorKeywords = new Set<string>();

    for (const pattern of competitorPatterns) {
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(pattern)}`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();

        if (Array.isArray(data) && data.length >= 1) {
          const suggestions = data[0];
          if (Array.isArray(suggestions)) {
            suggestions.forEach(s => {
              competitorKeywords.add(s);
            });
          }
        }
      } catch (error) {
        continue;
      }

      if (competitorKeywords.size > 50) break;
    }

    return Array.from(competitorKeywords);
  }

  /**
   * 挖掘问题型关键词
   */
  async extractQuestionKeywords(keyword: string, lang: string = 'en'): Promise<string[]> {
    const questionPrefixes = [
      'what is',
      'how to',
      'how do i',
      'why',
      'when',
      'where',
      'which',
      'can',
      'should',
      'does',
      'is',
      'are',
      'will',
      'best',
      'top',
    ];

    const questions = new Set<string>();

    for (const prefix of questionPrefixes) {
      try {
        const query = prefix === 'how to' ? `${prefix} ${keyword}` : `${prefix} ${keyword}`;
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}&hl=${lang}`;
        const response = await this.fetchWithTimeout(url);
        const data = await response.json();

        if (Array.isArray(data) && data.length >= 1) {
          const suggestions = data[0];
          if (Array.isArray(suggestions)) {
            suggestions.forEach(s => {
              if (s.toLowerCase().includes(keyword.toLowerCase())) {
                questions.add(s);
              }
            });
          }
        }
      } catch (error) {
        continue;
      }

      if (questions.size > 50) break;
    }

    return Array.from(questions);
  }
}

// 导出单例
export const relatedSearchCollector = new RelatedSearchCollector();
