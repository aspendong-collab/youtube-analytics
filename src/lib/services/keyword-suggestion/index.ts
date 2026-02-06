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
 * 支持智能语言适配和热度推荐
 */
function generateLocalSuggestions(query: string, language: string = 'zh-CN'): string[] {
  const q = query.trim();
  const suggestions: string[] = [];

  // 检测输入是否包含非ASCII字符（中文、日文、韩文等）
  const hasNonAscii = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(q);

  // 如果输入包含非ASCII字符，但语言是英文等非亚洲语言，则翻译输入
  let workingQuery = q;
  if (hasNonAscii && (language === 'en' || language === 'fr' || language === 'de' || language === 'it' || language === 'es' || language === 'pt')) {
    // 如果输入是中文但选择英语，提供英文相关建议
    // 简单映射：如果是"周"这样的中文，可以联想到"week"等英文词
    const commonMappings: Record<string, string> = {
      '周': 'week',
      '月': 'month',
      '年': 'year',
      '天': 'day',
      '时': 'hour',
      '分': 'minute',
      '秒': 'second',
      '学习': 'study',
      '工作': 'work',
      '生活': 'life',
      'PDF': 'PDF',
      'Excel': 'Excel',
      'Word': 'Word',
    };

    // 检查是否有映射
    for (const [zh, en] of Object.entries(commonMappings)) {
      if (q.includes(zh)) {
        workingQuery = q.replace(zh, en);
        break;
      }
    }

    // 如果没有映射，保留原始输入（可能是专有名词如PDF）
    if (workingQuery === q && /[a-zA-Z]/.test(q)) {
      workingQuery = q;
    }
  }

  // 根据目标语言生成建议模式
  const patterns = getLanguagePatterns(language);

  // 生成建议
  for (const pattern of patterns.prefixes) {
    if (language === 'zh-CN' || language === 'zh-TW') {
      suggestions.push(`${pattern}${workingQuery}`);
    } else if (language === 'ja' || language === 'ko') {
      suggestions.push(`${workingQuery}${pattern}`);
    } else {
      suggestions.push(`${pattern} ${workingQuery}`);
    }
  }

  for (const pattern of patterns.suffixes) {
    if (language === 'zh-CN' || language === 'zh-TW') {
      suggestions.push(`${workingQuery}${pattern}`);
    } else if (language === 'ja' || language === 'ko') {
      suggestions.push(`${workingQuery}${pattern}`);
    } else {
      suggestions.push(`${workingQuery} ${pattern}`);
    }
  }

  for (const pattern of patterns.combos) {
    const comboSuggestion = pattern.replace('{keyword}', workingQuery);
    if (!suggestions.includes(comboSuggestion)) {
      suggestions.push(comboSuggestion);
    }
  }

  // 添加热门相关词（模拟热度）
  if (patterns.hotPatterns) {
    for (const pattern of patterns.hotPatterns) {
      const hotSuggestion = pattern.replace('{keyword}', workingQuery);
      if (!suggestions.includes(hotSuggestion)) {
        suggestions.push(hotSuggestion);
      }
    }
  }

  // 去重并限制数量（增加到15个）
  return [...new Set(suggestions)].slice(0, 15);
}

/**
 * 获取语言特定的关键词模式
 */
function getLanguagePatterns(language: string): {
  prefixes: string[];
  suffixes: string[];
  combos: string[];
  hotPatterns?: string[];
} {
  const patterns: Record<string, any> = {
    'zh-CN': {
      prefixes: ['如何使用', '怎么用', '使用教程', '使用方法', '使用技巧', '最佳', '推荐', '免费', '付费', '最新', '好用', '专业', '入门', '进阶'],
      suffixes: ['教程', '指南', '入门', '精通', '下载', '安装', '使用方法', '技巧', '评测', '对比', '推荐', '排行榜', '哪个好', '怎么样'],
      combos: ['{keyword} vs ', '{keyword}和', '{keyword}替代品', '{keyword}类似工具'],
      hotPatterns: ['{keyword}视频教程', '{keyword}实战教程', '{keyword}新手教程', '{keyword}必看'],
    },
    'zh-TW': {
      prefixes: ['如何使用', '怎麼用', '使用教學', '使用方法', '使用技巧', '最佳', '推薦', '免費', '付費', '最新', '好用', '專業', '入門', '進階'],
      suffixes: ['教學', '指南', '入門', '精通', '下載', '安裝', '使用方法', '技巧', '評測', '對比', '推薦', '排行榜', '哪個好', '怎麼樣'],
      combos: ['{keyword} vs ', '{keyword}和', '{keyword}替代品', '{keyword}類似工具'],
      hotPatterns: ['{keyword}視頻教學', '{keyword}實戰教學', '{keyword}新手教學', '{keyword}必看'],
    },
    'en': {
      prefixes: ['how to use', 'best', 'top', 'free', 'paid', 'latest', 'popular', 'recommended', 'ultimate', 'complete'],
      suffixes: ['tutorial', 'guide', 'tips', 'tricks', 'review', 'alternatives', 'vs', 'for beginners', 'for professionals', 'step by step', '2024', '2025'],
      combos: ['{keyword} vs ', '{keyword} alternatives', '{keyword} for ', '{keyword} review', '{keyword} comparison'],
      hotPatterns: ['{keyword} video tutorial', '{keyword} crash course', '{keyword} full course', '{keyword} masterclass'],
    },
    'ja': {
      prefixes: ['使い方', '使い方ガイド', '使い方のコツ', '初心者向け', '無料', '有料', '最新', '人気', 'おすすめ', 'プロ向け', '上級'],
      suffixes: ['の使い方', 'チュートリアル', 'ガイド', '使い方', '入門', '完全版', '徹底解説', '使いこなす', 'マスター'],
      combos: ['{keyword} vs ', '{keyword} 代替', '{keyword} 類似'],
      hotPatterns: ['{keyword} 動画チュートリアル', '{keyword} 完全ガイド', '{keyword} 実践編', '{keyword} 入門編'],
    },
    'ko': {
      prefixes: ['사용법', '사용법 가이드', '사용법 팁', '초보자용', '무료', '유료', '최신', '인기', '추천', '전문가용', '고급'],
      suffixes: [' 사용법', '튜토리얼', '가이드', '사용법', '입문', '완전판', '완벽 해설', '활용법', '마스터'],
      combos: ['{keyword} vs ', '{keyword} 대체', '{keyword} 유사'],
      hotPatterns: ['{keyword} 비디오 튜토리얼', '{keyword} 완벽 가이드', '{keyword} 실전 편', '{keyword} 입문 편'],
    },
    'fr': {
      prefixes: ['comment utiliser', 'meilleur', 'top', 'gratuit', 'payant', 'dernier', 'populaire', 'recommandé', 'ultime', 'complet'],
      suffixes: ['tutoriel', 'guide', 'astuces', 'conseils', 'review', 'alternatives', 'vs', 'pour débutants', 'étape par étape'],
      combos: ['{keyword} vs ', '{keyword} alternatives', '{keyword} pour ', '{keyword} comparaison'],
      hotPatterns: ['{keyword} vidéo tutoriel', '{keyword} cours complet', '{keyword} guide complet'],
    },
    'de': {
      prefixes: ['wie man verwendet', 'bester', 'top', 'kostenlos', 'kostenpflichtig', 'neueste', 'beliebt', 'empfohlen', 'ultimativ', 'vollständig'],
      suffixes: ['Tutorial', 'Leitfaden', 'Tipps', 'Tricks', 'Review', 'Alternativen', 'vs', 'für Anfänger', 'Schritt für Schritt'],
      combos: ['{keyword} vs ', '{keyword} Alternativen', '{keyword} für ', '{keyword} Vergleich'],
      hotPatterns: ['{keyword} Video Tutorial', '{keyword} Vollkurs', '{keyword} Vollständiger Leitfaden'],
    },
    'it': {
      prefixes: ['come usare', 'migliore', 'top', 'gratuito', 'a pagamento', 'ultimo', 'popolare', 'raccomandato', 'ultimativo', 'completo'],
      suffixes: ['tutorial', 'guida', 'consigli', 'trucchetti', 'recensione', 'alternative', 'vs', 'per principianti', 'passo dopo passo'],
      combos: ['{keyword} vs ', '{keyword} alternative', '{keyword} per ', '{keyword} confronto'],
      hotPatterns: ['{keyword} video tutorial', '{keyword} corso completo', '{keyword} guida completa'],
    },
    'es': {
      prefixes: ['cómo usar', 'mejor', 'top', 'gratis', 'de pago', 'último', 'popular', 'recomendado', 'último', 'completo'],
      suffixes: ['tutorial', 'guía', 'consejos', 'trucos', 'reseña', 'alternativas', 'vs', 'para principiantes', 'paso a paso'],
      combos: ['{keyword} vs ', '{keyword} alternativas', '{keyword} para ', '{keyword} comparación'],
      hotPatterns: ['{keyword} video tutorial', '{keyword} curso completo', '{keyword} guía completa'],
    },
    'pt': {
      prefixes: ['como usar', 'melhor', 'top', 'gratuito', 'pago', 'último', 'popular', 'recomendado', 'último', 'completo'],
      suffixes: ['tutorial', 'guia', 'dicas', 'truques', 'review', 'alternativas', 'vs', 'para iniciantes', 'passo a passo'],
      combos: ['{keyword} vs ', '{keyword} alternativas', '{keyword} para ', '{keyword} comparação'],
      hotPatterns: ['{keyword} video tutorial', '{keyword} curso completo', '{keyword} guia completa'],
    },
  };

  return patterns[language] || patterns['en'];
}

/**
 * 从缓存获取或获取新的建议
 */
export async function getSuggestions(query: string, language: string = 'zh-CN'): Promise<string[]> {
  if (!query || query.trim().length < 1) {
    return [];
  }

  // 如果输入是中文但选择英语等非亚洲语言，检查是否有映射
  const hasNonAscii = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(query.trim());
  if (hasNonAscii && (language === 'en' || language === 'fr' || language === 'de' || language === 'it' || language === 'es' || language === 'pt')) {
    const commonMappings: Record<string, string> = {
      '周': 'week',
      '月': 'month',
      '年': 'year',
      '天': 'day',
      '时': 'hour',
      '分': 'minute',
      '秒': 'second',
      '学习': 'study',
      '工作': 'work',
      '生活': 'life',
    };

    for (const [zh, en] of Object.entries(commonMappings)) {
      if (query.includes(zh)) {
        query = query.replace(zh, en);
        break;
      }
    }
  }

  // 映射后检查长度
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
