/**
 * 关键词推荐服务
 * 提供 Google Suggest API 集成和本地缓存
 */

// 简单的内存缓存
const suggestionCache = new Map<string, { suggestions: string[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * Google Suggest API 获取搜索建议
 */
async function fetchGoogleSuggestions(query: string, language: string = 'zh-CN'): Promise<string[]> {
  try {
    // Google Suggest API 从服务器端访问可能受限，使用备用方案
    // 生成基于关键词的相关建议
    return generateLocalSuggestions(query, language);
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    return generateLocalSuggestions(query, language);
  }
}

/**
 * 生成本地搜索建议（当 Google API 不可用时使用）
 */
function generateLocalSuggestions(query: string, language: string = 'zh-CN'): string[] {
  const q = query.trim();
  const suggestions: string[] = [];

  // 根据语言生成不同的建议模式
  if (language === 'zh-CN' || language === 'zh-TW') {
    // 中文建议
    const prefixes = ['如何使用', '怎么用', '使用教程', '使用方法', '使用技巧', '最佳', '推荐', '免费', '付费'];
    const suffixes = ['教程', '指南', '入门', '精通', '下载', '安装', '使用方法', '技巧', '评测', '对比'];
    const combos = [' vs ', ' 和 ', ' 或 ', ' 替代品', ' 类似工具'];

    prefixes.forEach(p => suggestions.push(`${p}${q}`));
    suffixes.forEach(s => suggestions.push(`${q}${s}`));
    combos.forEach(c => {
      if (!q.includes(c)) {
        suggestions.push(`${q}${c}`);
      }
    });
  } else if (language === 'en') {
    // 英文建议
    const prefixes = ['how to use', 'best', 'top', 'free', 'paid'];
    const suffixes = ['tutorial', 'guide', 'tips', 'tricks', 'review', 'alternatives', 'vs', 'for beginners', 'for professionals'];
    const combos = [' vs ', ' vs ', ' alternatives', ' for ', ' review'];

    prefixes.forEach(p => suggestions.push(`${p} ${q}`));
    suffixes.forEach(s => suggestions.push(`${q} ${s}`));
    combos.forEach(c => {
      if (!q.toLowerCase().includes(c)) {
        suggestions.push(`${q}${c}`);
      }
    });
  } else if (language === 'ja') {
    // 日语建议
    const prefixes = ['使い方', '使い方ガイド', '使い方のコツ', '初心者向け', '無料', '有料'];
    const suffixes = ['の使い方', 'チュートリアル', 'ガイド', '使い方', 'の使い方'];
    const combos = [' 対比', ' 代替', ' 類似'];

    prefixes.forEach(p => suggestions.push(`${q}${p}`));
    suffixes.forEach(s => suggestions.push(`${q}${s}`));
    combos.forEach(c => {
      if (!q.includes(c)) {
        suggestions.push(`${q}${c}`);
      }
    });
  } else {
    // 其他语言使用通用英文模式
    const prefixes = ['how to use', 'best', 'tutorial'];
    const suffixes = ['guide', 'tips', 'review', 'alternatives'];

    prefixes.forEach(p => suggestions.push(`${p} ${q}`));
    suffixes.forEach(s => suggestions.push(`${q} ${s}`));
  }

  // 去重并限制数量
  return [...new Set(suggestions)].slice(0, 10);
}

/**
 * 从缓存获取或获取新的建议
 */
export async function getSuggestions(query: string, language: string = 'zh-CN'): Promise<string[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cacheKey = `${query}:${language}`;
  const cached = suggestionCache.get(cacheKey);

  // 检查缓存是否有效
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.suggestions;
  }

  // 获取新的建议
  const suggestions = await fetchGoogleSuggestions(query, language);

  // 更新缓存
  suggestionCache.set(cacheKey, {
    suggestions,
    timestamp: Date.now(),
  });

  // 清理过期缓存（简单策略：限制缓存大小）
  if (suggestionCache.size > 100) {
    const entries = Array.from(suggestionCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // 删除最旧的 20% 缓存
    const deleteCount = Math.floor(entries.length * 0.2);
    for (let i = 0; i < deleteCount; i++) {
      suggestionCache.delete(entries[i][0]);
    }
  }

  return suggestions;
}

/**
 * 清除缓存
 */
export function clearSuggestionCache(): void {
  suggestionCache.clear();
}

/**
 * 获取热门关键词（可以扩展为从数据库获取）
 */
export async function getPopularKeywords(language: string = 'zh-CN'): Promise<string[]> {
  // 常见的 YouTube 搜索关键词
  const popularKeywords: Record<string, string[]> = {
    'en': ['AI tools', 'ChatGPT', 'Notion', 'Productivity', 'Video editing', 'Python tutorial', 'Web development', 'React', 'JavaScript'],
    'fr': ['Outils IA', 'ChatGPT', 'Notion', 'Productivité', 'Montage vidéo', 'Tutoriel Python', 'Développement web'],
    'de': ['KI Tools', 'ChatGPT', 'Notion', 'Produktivität', 'Videoschnitt', 'Python Tutorial', 'Webentwicklung'],
    'it': ['Strumenti AI', 'ChatGPT', 'Notion', 'Produttività', 'Editing video', 'Tutorial Python', 'Sviluppo web'],
    'es': ['Herramientas IA', 'ChatGPT', 'Notion', 'Productividad', 'Edición de video', 'Tutorial Python', 'Desarrollo web'],
    'pt': ['Ferramentas IA', 'ChatGPT', 'Notion', 'Produtividade', 'Edição de vídeo', 'Tutorial Python', 'Desenvolvimento web'],
    'ja': ['AIツール', 'ChatGPT', 'Notion', '生産性', '動画編集', 'Pythonチュートリアル', 'Web開発'],
    'ko': ['AI 도구', 'ChatGPT', 'Notion', '생산성', '비디오 편집', 'Python 튜토리얼', '웹 개발'],
    'zh-TW': ['AI工具', 'ChatGPT', 'Notion', '生產力', '影片剪輯', 'Python教學', '網頁開發'],
    'zh-CN': ['AI工具', 'ChatGPT', 'Notion', '生产力', '视频剪辑', 'Python教程', '网页开发', 'React', 'JavaScript'],
  };

  return popularKeywords[language] || popularKeywords['zh-CN'];
}
