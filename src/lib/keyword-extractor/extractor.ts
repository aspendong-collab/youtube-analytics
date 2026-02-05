/**
 * 关键词提取工具 - 改进版
 */
import { LANGUAGE_CONFIGS, getRegionCode } from './languages';

/**
 * 关键词来源
 */
export type KeywordSource = 'title' | 'description' | 'tags' | 'channel';

/**
 * 关键词类别
 */
export type KeywordCategory = 
  | 'productivity'  // 生产力
  | 'work'         // 工作
  | 'salary'       // 薪资
  | 'career'       // 职业发展
  | 'tech'         // 技术/工具
  | 'business'     // 商业
  | 'learning'     // 学习
  | 'health'       // 健康
  | 'lifestyle'    // 生活方式
  | 'finance'      // 财务
  | 'tutorial'     // 教程
  | 'other';       // 其他

/**
 * 关键词数据
 */
export interface KeywordData {
  keyword: string;
  frequency: number;
  sources: KeywordSource[];
  avgViews: number;
  avgEngagementRate: number;
  avgLikes: number;
  avgComments: number;
  videoCount: number;
  recentVideoCount: number;
  trend: 'up' | 'down' | 'stable';
  language: string;
  category: KeywordCategory;
  relevanceScore: number;
}

/**
 * 视频数据（简化版）
 */
export interface VideoData {
  videoId: string;
  title: string;
  description: string;
  tags?: string[];
  channelId: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  language?: string;
}

/**
 * 扩展停用词列表（英文）
 */
const EN_STOP_WORDS = new Set([
  // 基础停用词
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',

  // 非实意词
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could',
  'may', 'might', 'must', 'ought', 'need', 'dare', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
  'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours',
  'theirs', 'this', 'that', 'these', 'those', 'am', 'are', 'is', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',

  // 网络和URL相关
  'http', 'https', 'www', 'com', 'org', 'net', 'edu', 'gov', 'io', 'co',
  'youtube', 'video', 'watch', 'link', 'url', 'website', 'web', 'online',

  // 常见无意义词
  'just', 'like', 'get', 'got', 'go', 'going', 'goes', 'go', 'come',
  'coming', 'comes', 'see', 'seeing', 'seen', 'saw', 'make', 'made', 'making',
  'take', 'took', 'taken', 'taking', 'use', 'used', 'using', 'say', 'said',
  'saying', 'tell', 'told', 'telling', 'ask', 'asked', 'asking', 'think',
  'thought', 'thinking', 'know', 'knew', 'knowing', 'want', 'wanted', 'wanting',
  'new', 'good', 'best', 'better', 'right', 'wrong', 'old', 'young', 'small',
  'big', 'large', 'little', 'long', 'short', 'high', 'low', 'first', 'last',
  'early', 'late', 'now', 'then', 'here', 'there', 'yes', 'no', 'please',
  'thank', 'thanks', 'hi', 'hello', 'bye', 'goodbye', 'ok', 'okay', 'well',

  // 动词和助动词
  'able', 'about', 'across', 'after', 'again', 'against', 'all', 'almost',
  'already', 'also', 'although', 'always', 'am', 'among', 'an', 'and', 'any',
  'anyone', 'anything', 'anywhere', 'are', 'area', 'areas', 'around', 'as',
  'ask', 'asked', 'asking', 'asks', 'at', 'away', 'b', 'back', 'backed',
  'backing', 'backs', 'be', 'became', 'because', 'become', 'becomes', 'been',
  'before', 'began', 'behind', 'being', 'best', 'better', 'between', 'big',
  'both', 'but', 'by', 'c', 'came', 'can', 'cannot', 'case', 'cases', 'certain',
  'certainly', 'clear', 'clearly', 'come', 'could', 'd', 'did', 'differ',
  'different', 'differently', 'do', 'does', 'done', 'down', 'downed', 'downing',
  'downs', 'during', 'e', 'each', 'early', 'either', 'end', 'ended', 'ending',
  'ends', 'enough', 'even', 'evenly', 'ever', 'every', 'everybody', 'everyone',
  'everything', 'everywhere', 'f', 'face', 'faces', 'fact', 'facts', 'far',
  'felt', 'few', 'find', 'finds', 'first', 'for', 'four', 'from', 'full', 'fully',
  'further', 'furthered', 'furthering', 'furthers', 'g', 'gave', 'general',
  'generally', 'get', 'gets', 'give', 'given', 'gives', 'go', 'going', 'good',
  'goods', 'got', 'great', 'greater', 'greatest', 'group', 'grouped', 'grouping',
  'groups', 'h', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'herself',
  'high', 'higher', 'highest', 'him', 'himself', 'his', 'how', 'however', 'i',
  'if', 'important', 'in', 'interest', 'interested', 'interesting', 'interests',
  'into', 'is', 'it', 'its', 'itself', 'j', 'just', 'k', 'keep', 'keeps', 'kind',
  'knew', 'know', 'known', 'knows', 'l', 'large', 'largely', 'last', 'later',
  'latest', 'least', 'less', 'let', 'lets', 'like', 'likely', 'long', 'longer',
  'longest', 'm', 'made', 'make', 'making', 'man', 'many', 'may', 'me', 'member',
  'members', 'men', 'might', 'more', 'most', 'mostly', 'mr', 'mrs', 'much', 'must',
  'my', 'myself', 'n', 'necessary', 'need', 'needed', 'needing', 'needs', 'never',
  'new', 'newer', 'newest', 'next', 'no', 'non', 'not', 'now', 'nowhere', 'number',
  'numbers', 'of', 'off', 'often', 'old', 'older', 'oldest', 'on', 'once', 'one',
  'only', 'open', 'opened', 'opening', 'opens', 'or', 'order', 'ordered', 'ordering',
  'orders', 'other', 'others', 'our', 'out', 'over', 'p', 'part', 'parted', 'parting',
  'parts', 'per', 'perhaps', 'place', 'places', 'point', 'pointed', 'pointing',
  'points', 'possible', 'present', 'presented', 'presenting', 'presents', 'problem',
  'problems', 'put', 'puts', 'q', 'quite', 'r', 'rather', 'really', 'right', 'room',
  'rooms', 's', 'said', 'same', 'saw', 'say', 'saying', 'says', 'second', 'seconds',
  'see', 'seem', 'seemed', 'seeming', 'seems', 'sees', 'several', 'shall', 'she',
  'should', 'show', 'showed', 'showing', 'shows', 'side', 'sides', 'since', 'small',
  'smaller', 'smallest', 'some', 'somebody', 'someone', 'something', 'somewhere',
  'state', 'states', 'still', 'such', 'sure', 't', 'take', 'taken', 'than', 'that',
  'the', 'their', 'them', 'then', 'there', 'therefore', 'these', 'they', 'thing',
  'things', 'think', 'thinks', 'this', 'those', 'though', 'thought', 'thoughts',
  'three', 'through', 'thus', 'to', 'today', 'together', 'too', 'took', 'toward',
  'turn', 'turned', 'turning', 'turns', 'two', 'u', 'under', 'until', 'up', 'upon',
  'us', 'use', 'used', 'uses', 'v', 'very', 'w', 'want', 'wanted', 'wanting',
  'wants', 'was', 'way', 'ways', 'we', 'well', 'wells', 'went', 'were', 'what',
  'when', 'where', 'whether', 'which', 'while', 'who', 'whole', 'whose', 'why',
  'will', 'with', 'within', 'without', 'work', 'worked', 'working', 'works', 'would',
  'x', 'y', 'year', 'years', 'yet', 'you', 'young', 'younger', 'youngest', 'your',
  'yours', 'z',
]);

/**
 * 关键词分类规则
 */
const CATEGORY_RULES: Record<KeywordCategory, string[]> = {
  productivity: [
    'productivity', 'efficient', 'efficiency', 'focus', 'manage', 'management',
    'time', 'schedule', 'planning', 'organize', 'organize', 'productivity',
    'workflow', 'routine', 'habit', 'goal', 'target', 'objective', 'task',
    '完成', '效率', '专注', '管理', '时间', '计划', '组织', '工作流',
  ],
  work: [
    'work', 'job', 'career', 'profession', 'office', 'team', 'colleague',
    'coworker', 'manager', 'boss', 'employee', 'staff', 'company', 'business',
    'corporate', 'professional', 'workplace', '工作', '职业', '办公室',
    '团队', '同事', '经理', '老板', '员工', '公司', '职场',
  ],
  salary: [
    'salary', 'income', 'wage', 'pay', 'earn', 'earning', 'money', 'cash',
    'compensation', 'benefit', 'bonus', 'raise', 'increase', 'negotiate',
    '薪资', '收入', '工资', '薪水', '奖金', '福利', '加薪',
  ],
  career: [
    'career', 'development', 'growth', 'advance', 'advancement', 'promote',
    'promotion', 'skill', 'skills', 'learn', 'training', 'education', 'degree',
    '职业', '发展', '成长', '晋升', '技能', '学习', '培训',
  ],
  tech: [
    'tech', 'technology', 'tool', 'tools', 'software', 'app', 'application',
    'program', 'programming', 'code', 'coding', 'digital', 'computer',
    'automation', 'ai', 'artificial intelligence', 'machine', 'ml',
    '技术', '工具', '软件', '应用', '编程', '代码', '自动化',
  ],
  business: [
    'business', 'startup', 'entrepreneur', 'enterprise', 'market', 'marketing',
    'sales', 'customer', 'client', 'revenue', 'profit', 'strategy', 'plan',
    '商业', '创业', '企业家', '市场', '营销', '销售', '客户', '利润',
  ],
  learning: [
    'learn', 'learning', 'study', 'tutorial', 'guide', 'course', 'lesson',
    'education', 'teach', 'teaching', 'train', 'training', 'knowledge',
    'skill', 'skills', 'master', 'understand', 'understanding',
    '学习', '教程', '课程', '教育', '知识', '技能', '掌握',
  ],
  health: [
    'health', 'wellness', 'fitness', 'exercise', 'workout', 'diet', 'nutrition',
    'mental', 'mental health', 'stress', 'relax', 'balance', 'sleep',
    '健康', '健身', '锻炼', '营养', '心理健康', '压力', '放松', '睡眠',
  ],
  lifestyle: [
    'lifestyle', 'life', 'living', 'daily', 'routine', 'habit', 'hobby',
    'personal', 'life', 'quality', 'happiness', 'enjoy', 'enjoying',
    '生活方式', '生活', '日常', '习惯', '爱好', '快乐',
  ],
  finance: [
    'finance', 'financial', 'investment', 'invest', 'saving', 'save', 'budget',
    'money', 'currency', 'wealth', 'asset', 'portfolio', 'stock', 'trading',
    '财务', '金融', '投资', '储蓄', '预算', '资金', '财富', '股票',
  ],
  tutorial: [
    'tutorial', 'how to', 'guide', 'step', 'tips', 'trick', 'tricks',
    'beginner', 'basic', 'basics', 'advanced', 'expert', 'master',
    '教程', '如何', '指南', '技巧', '入门', '基础', '进阶', '大师',
  ],
  other: [],
};

/**
 * 关键词提取器
 */
class KeywordExtractor {
  private originalKeyword: string = '';

  /**
   * 从视频数据中提取关键词
   */
  extractFromVideos(
    videos: VideoData[],
    language: string,
    originalKeyword: string = ''
  ): KeywordData[] {
    this.originalKeyword = originalKeyword.toLowerCase();
    const keywordMap = new Map<string, KeywordData>();

    videos.forEach(video => {
      // 1. 从标题提取
      const titleKeywords = this.extractKeywords(video.title, language);
      this.updateKeywordMap(keywordMap, titleKeywords, video, 'title');

      // 2. 从描述提取
      const descKeywords = this.extractKeywords(video.description, language);
      this.updateKeywordMap(keywordMap, descKeywords, video, 'description');

      // 3. 从标签提取
      if (video.tags && video.tags.length > 0) {
        const tagKeywords = this.extractKeywords(video.tags.join(' '), language);
        this.updateKeywordMap(keywordMap, tagKeywords, video, 'tags');
      }
    });

    // 计算趋势和分类
    keywordMap.forEach(data => {
      data.trend = this.calculateTrend(data);
      data.category = this.categorizeKeyword(data.keyword, language);
      data.relevanceScore = this.calculateRelevance(data.keyword, language);
    });

    // 过滤低相关度和低质量关键词
    const filteredKeywords = Array.from(keywordMap.values()).filter(data => {
      // 过滤条件：
      // 1. 频率至少为2
      // 2. 相关性评分至少为0.3
      // 3. 平均热度至少为1000
      return data.frequency >= 2 &&
             data.relevanceScore >= 0.3 &&
             data.avgViews >= 1000;
    });

    // 转换为数组并排序
    return filteredKeywords
      .sort((a, b) => {
        // 综合排序：频率 * 0.4 + 相关性 * 0.3 + 热度 * 0.3
        const scoreA = a.frequency * 0.4 + a.relevanceScore * 30 + (a.avgViews / 100000) * 0.3;
        const scoreB = b.frequency * 0.4 + b.relevanceScore * 30 + (b.avgViews / 100000) * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, 500); // 最多返回500个关键词
  }

  /**
   * 从文本中提取关键词
   */
  private extractKeywords(text: string, language: string): string[] {
    const config = LANGUAGE_CONFIGS[language];
    if (!config) return [];

    let keywords: string[] = [];

    // 根据语言使用不同的分词策略
    if (language === 'zh' || language === 'zh-TW') {
      // 中文分词
      keywords = this.extractChineseKeywords(text);
    } else if (language === 'ja') {
      // 日语分词
      keywords = this.extractJapaneseKeywords(text);
    } else if (language === 'ko') {
      // 韩语分词
      keywords = this.extractKoreanKeywords(text);
    } else {
      // 其他语言按空格分词
      keywords = this.extractSpaceBasedKeywords(text, language);
    }

    // 过滤条件：
    // 1. 长度至少3个字符（英文）或2个字（中文）
    // 2. 不在停用词表中
    // 3. 不是纯数字
    // 4. 不包含特殊字符
    const stopWords = config?.stopWords || [];
    return keywords.filter(kw => {
      const normalized = kw.toLowerCase().trim();

      // 英文至少3个字符，中文至少2个字
      const isValidLength = /^[a-zA-Z]+$/.test(normalized)
        ? normalized.length >= 3
        : normalized.length >= 2;

      return isValidLength &&
             !EN_STOP_WORDS.has(normalized) &&
             !stopWords.includes(normalized) &&
             !/^\d+$/.test(normalized) &&
             !/^[^a-zA-Z\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]+$/.test(normalized);
    });
  }

  /**
   * 中文关键词提取
   */
  private extractChineseKeywords(text: string): string[] {
    const keywords: string[] = [];

    // 提取2-4个字的连续汉字
    for (let i = 0; i < text.length - 1; i++) {
      for (let len = 2; len <= 4; len++) {
        if (i + len <= text.length) {
          const substring = text.substring(i, i + len);
          if (/^[\u4e00-\u9fa5]{2,4}$/.test(substring)) {
            keywords.push(substring);
          }
        }
      }
    }

    // 提取英文单词（至少3个字符）
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    keywords.push(...englishWords);

    return keywords;
  }

  /**
   * 日语关键词提取
   */
  private extractJapaneseKeywords(text: string): string[] {
    const keywords: string[] = [];

    // 提取汉字（2-4个字）
    for (let i = 0; i < text.length - 1; i++) {
      for (let len = 2; len <= 4; len++) {
        if (i + len <= text.length) {
          const substring = text.substring(i, i + len);
          if (/^[\u4e00-\u9fa5]{2,4}$/.test(substring)) {
            keywords.push(substring);
          }
        }
      }
    }

    // 提取片假名（至少2个字符）
    const katakana = text.match(/[\u30a0-\u30ff]{2,}/g) || [];
    keywords.push(...katakana);

    // 提取英文单词（至少3个字符）
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    keywords.push(...englishWords);

    return keywords;
  }

  /**
   * 韩语关键词提取
   */
  private extractKoreanKeywords(text: string): string[] {
    const keywords: string[] = [];

    // 提取韩语单词（2-6个字）
    for (let i = 0; i < text.length - 1; i++) {
      for (let len = 2; len <= 6; len++) {
        if (i + len <= text.length) {
          const substring = text.substring(i, i + len);
          if (/^[\uac00-\ud7af]{2,6}$/.test(substring)) {
            keywords.push(substring);
          }
        }
      }
    }

    // 提取英文单词（至少3个字符）
    const englishWords = text.match(/[a-zA-Z]{3,}/g) || [];
    keywords.push(...englishWords);

    return keywords;
  }

  /**
   * 基于空格的关键词提取（西文）
   */
  private extractSpaceBasedKeywords(text: string, language: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s,.!?;:"'()<>[\]{}\/\\|`~@#$%^&*+=_-]+/)
      .map(word => word.trim())
      .filter(word => word.length >= 3); // 至少3个字符
  }

  /**
   * 计算关键词与原始关键词的相关性
   */
  private calculateRelevance(keyword: string, language: string): number {
    const normalizedKeyword = keyword.toLowerCase();
    const normalizedOriginal = this.originalKeyword;

    // 如果没有原始关键词，返回默认分数
    if (!normalizedOriginal) {
      return 0.5;
    }

    let score = 0;

    // 1. 精确匹配
    if (normalizedKeyword === normalizedOriginal) {
      score += 1.0;
    }

    // 2. 包含原始关键词
    if (normalizedKeyword.includes(normalizedOriginal)) {
      score += 0.8;
    }

    // 3. 原始关键词包含关键词
    if (normalizedOriginal.includes(normalizedKeyword)) {
      score += 0.7;
    }

    // 4. 检查分类规则匹配
    for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
      if (category !== 'other') {
        for (const rule of keywords) {
          const normalizedRule = rule.toLowerCase();
          // 原始关键词和提取关键词都匹配同一个分类
          if (normalizedOriginal.includes(normalizedRule) &&
              normalizedKeyword.includes(normalizedRule)) {
            score += 0.5;
          }
        }
      }
    }

    // 5. 共同前缀
    const commonPrefix = this.getCommonPrefix(normalizedKeyword, normalizedOriginal);
    if (commonPrefix.length >= 2) {
      score += 0.3 * (commonPrefix.length / Math.max(normalizedKeyword.length, normalizedOriginal.length));
    }

    // 6. 编辑距离（相似度）
    const distance = this.calculateEditDistance(normalizedKeyword, normalizedOriginal);
    const maxLen = Math.max(normalizedKeyword.length, normalizedOriginal.length);
    const similarity = 1 - (distance / maxLen);
    score += 0.2 * similarity;

    return Math.min(score, 1.0);
  }

  /**
   * 获取两个字符串的共同前缀
   */
  private getCommonPrefix(str1: string, str2: string): string {
    let i = 0;
    while (i < str1.length && i < str2.length && str1[i] === str2[i]) {
      i++;
    }
    return str1.substring(0, i);
  }

  /**
   * 计算编辑距离
   */
  private calculateEditDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],
            dp[i][j - 1],
            dp[i - 1][j - 1]
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * 更新关键词映射
   */
  private updateKeywordMap(
    map: Map<string, KeywordData>,
    keywords: string[],
    video: VideoData,
    source: KeywordSource
  ): void {
    keywords.forEach(keyword => {
      const normalizedKeyword = keyword.toLowerCase().trim();

      if (!map.has(normalizedKeyword)) {
        map.set(normalizedKeyword, {
          keyword: normalizedKeyword,
          frequency: 0,
          sources: [],
          avgViews: 0,
          avgEngagementRate: 0,
          avgLikes: 0,
          avgComments: 0,
          videoCount: 0,
          recentVideoCount: 0,
          trend: 'stable',
          language: video.language || 'en',
          category: 'other',
          relevanceScore: 0,
        });
      }

      const data = map.get(normalizedKeyword)!;

      // 更新频率
      data.frequency++;

      // 更新来源
      if (!data.sources.includes(source)) {
        data.sources.push(source);
      }

      // 累加统计数据
      const engagementRate = video.viewCount > 0
        ? ((video.likeCount + video.commentCount) / video.viewCount) * 100
        : 0;

      data.avgViews = (data.avgViews * data.videoCount + video.viewCount) / (data.videoCount + 1);
      data.avgEngagementRate = (data.avgEngagementRate * data.videoCount + engagementRate) / (data.videoCount + 1);
      data.avgLikes = (data.avgLikes * data.videoCount + video.likeCount) / (data.videoCount + 1);
      data.avgComments = (data.avgComments * data.videoCount + video.commentCount) / (data.videoCount + 1);
      data.videoCount++;

      // 检查是否为近期视频（30天内）
      const publishedDate = new Date(video.publishedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 30) {
        data.recentVideoCount++;
      }
    });
  }

  /**
   * 计算关键词趋势
   */
  private calculateTrend(keywordData: KeywordData): 'up' | 'down' | 'stable' {
    if (keywordData.videoCount < 2) {
      return 'stable';
    }

    const recentRatio = keywordData.recentVideoCount / keywordData.videoCount;

    if (recentRatio > 0.3) {
      return 'up';
    } else if (recentRatio < 0.1) {
      return 'down';
    } else {
      return 'stable';
    }
  }

  /**
   * 分类关键词
   */
  private categorizeKeyword(keyword: string, language: string): KeywordCategory {
    const normalizedKeyword = keyword.toLowerCase();

    // 检查每个分类规则
    for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
      if (category !== 'other') {
        for (const rule of keywords) {
          const normalizedRule = rule.toLowerCase();
          // 包含分类关键词
          if (normalizedKeyword.includes(normalizedRule) ||
              normalizedRule.includes(normalizedKeyword)) {
            return category as KeywordCategory;
          }
        }
      }
    }

    return 'other';
  }
}

// 导出单例
export const keywordExtractor = new KeywordExtractor();
