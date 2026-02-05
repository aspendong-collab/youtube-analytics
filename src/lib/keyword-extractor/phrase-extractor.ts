/**
 * 词组提取和优化工具
 * 专门针对 YouTube 搜索场景优化
 */

/**
 * 词组类型
 */
export type PhraseType =
  | 'vlog'        // vlog 类视频
  | 'tutorial'    // 教程类
  | 'tips'        // 技巧类
  | 'challenge'   // 挑战类
  | 'review'      // 评论/测评
  | 'routine'     // 日常/惯例
  | 'journey'     // 旅程/经历
  | 'guide'       // 指南
  | 'method'      // 方法
  | 'story'       // 故事
  | 'beginner'    // 初学者
  | 'advanced'    // 进阶
  | 'free'        // 免费
  | 'online'      // 在线
  | 'course'      // 课程
  | 'class'       // 课程
  | 'lesson'      // 课程
  | 'topic'       // 主题/话题
  | 'other';      // 其他

/**
 * 词组数据
 */
export interface PhraseData {
  phrase: string;
  type: PhraseType;
  frequency: number;
  avgViews: number;
  videoCount: number;
  relevanceScore: number;
  searchIntent: string; // 搜索意图描述
  targetAudience: string; // 目标受众
}

/**
 * YouTube 常见搜索后缀
 */
const YOUTUBE_PHRASE_PATTERNS: Record<string, PhraseType> = {
  // 内容类型
  ' vlog': 'vlog',
  ' log': 'vlog',
  ' vlogs': 'vlog',
  ' daily': 'vlog',
  ' weekly': 'vlog',
  ' day in the life': 'vlog',
  ' day in my life': 'vlog',

  // 教程类
  ' tutorial': 'tutorial',
  ' tutorials': 'tutorial',
  ' guide': 'guide',
  ' how to': 'tutorial',
  ' how do i': 'tutorial',
  ' step by step': 'tutorial',
  ' complete': 'tutorial',
  ' full course': 'course',

  // 技巧类
  ' tips': 'tips',
  ' tip': 'tips',
  ' tricks': 'tips',
  ' trick': 'tips',
  ' hacks': 'tips',
  ' hack': 'tips',
  ' advice': 'tips',
  ' secrets': 'tips',

  // 挑战类
  ' challenge': 'challenge',
  ' challenges': 'challenge',
  ' days': 'challenge', // 如 30 days
  ' weeks': 'challenge', // 如 4 weeks

  // 评论/测评
  ' review': 'review',
  ' reviews': 'review',
  ' test': 'review',
  ' comparison': 'review',
  ' vs ': 'review',
  'best for': 'review',

  // 日常/惯例
  ' routine': 'routine',
  ' schedule': 'routine',
  ' plan': 'routine',
  ' timetable': 'routine',
  ' morning': 'routine',
  ' night': 'routine',

  // 旅程/经历
  ' journey': 'journey',
  ' story': 'story',
  ' experience': 'story',
  ' transformation': 'journey',
  ' progress': 'journey',

  // 方法
  ' method': 'method',
  ' ways': 'method',
  ' strategies': 'method',
  ' techniques': 'method',
  ' approach': 'method',

  // 难度级别
  ' for beginners': 'beginner',
  ' beginner': 'beginner',
  ' basic': 'beginner',
  ' introduction': 'beginner',
  ' 101': 'beginner',
  ' advanced': 'advanced',
  ' expert': 'advanced',
  ' master': 'advanced',
  ' professional': 'advanced',

  // 免费/在线
  ' free': 'free',
  ' online': 'online',
  ' self-taught': 'free',

  // 课程类
  ' course': 'course',
  ' class': 'class',
  ' lesson': 'lesson',
  ' module': 'lesson',
  ' series': 'course',
};

/**
 * 搜索意图模板
 */
const SEARCH_INTENT_TEMPLATES: Record<PhraseType, string> = {
  vlog: '查看日常学习/工作过程',
  tutorial: '学习具体方法和步骤',
  tips: '获取实用技巧和建议',
  challenge: '参与挑战活动',
  review: '了解产品/方法评价',
  routine: '建立学习和工作习惯',
  journey: '了解他人成长经历',
  guide: '获取完整指导',
  method: '学习特定方法',
  story: '了解相关故事',
  beginner: '适合初学者入门',
  advanced: '适合进阶学习',
  free: '获取免费资源',
  online: '在线学习资源',
  course: '系统课程学习',
  class: '课程学习',
  lesson: '单节课程',
  topic: '特定主题内容',
  other: '其他相关内容',
};

/**
 * 目标受众描述
 */
const TARGET_AUDIENCE_TEMPLATES: Record<PhraseType, string> = {
  vlog: '喜欢真实记录的观众',
  tutorial: '需要系统学习的观众',
  tips: '追求效率的观众',
  challenge: '喜欢挑战的观众',
  review: '决策前的观众',
  routine: '希望建立习惯的观众',
  journey: '寻找灵感的观众',
  guide: '需要全面指导的观众',
  method: '寻找具体方法的观众',
  story: '喜欢故事的观众',
  beginner: '入门学习者',
  advanced: '进阶学习者',
  free: '预算有限的观众',
  online: '偏好在线学习的观众',
  course: '希望系统学习的观众',
  class: '上课学习者',
  lesson: '单次课程学习者',
  topic: '对特定主题感兴趣的观众',
  other: '广泛受众',
};

/**
 * 词组提取器
 */
class PhraseExtractor {
  private originalKeyword: string = '';

  /**
   * 从视频中提取词组
   */
  extractPhrasesFromVideos(
    videos: any[],
    language: string,
    originalKeyword: string
  ): PhraseData[] {
    this.originalKeyword = originalKeyword.toLowerCase();

    const phraseMap = new Map<string, PhraseData>();

    videos.forEach(video => {
      // 1. 从标题提取词组
      const titlePhrases = this.extractPhrases(video.title, language);
      this.updatePhraseMap(phraseMap, titlePhrases, video);

      // 2. 从描述提取词组
      const descPhrases = this.extractPhrases(video.description, language);
      this.updatePhraseMap(phraseMap, descPhrases, video);

      // 3. 从标签提取词组
      if (video.tags && video.tags.length > 0) {
        const tagPhrases = video.tags.flatMap(tag =>
          this.extractPhrases(tag, language)
        );
        this.updatePhraseMap(phraseMap, tagPhrases, video);
      }
    });

    // 生成智能词组（基于原始关键词）
    const generatedPhrases = this.generateIntelligentPhrases(phraseMap);
    generatedPhrases.forEach(phrase => {
      if (!phraseMap.has(phrase.phrase)) {
        phraseMap.set(phrase.phrase, phrase);
      }
    });

    // 计算相关性评分
    phraseMap.forEach(data => {
      data.relevanceScore = this.calculatePhraseRelevance(data.phrase);
    });

    // 过滤和排序
    return Array.from(phraseMap.values())
      .filter(data =>
        data.frequency >= 2 &&
        data.relevanceScore >= 0.4 &&
        data.videoCount >= 2
      )
      .sort((a, b) => {
        const scoreA = a.frequency * 0.5 + a.relevanceScore * 50 + (a.avgViews / 10000) * 0.3;
        const scoreB = b.frequency * 0.5 + b.relevanceScore * 50 + (b.avgViews / 10000) * 0.3;
        return scoreB - scoreA;
      })
      .slice(0, 100); // 返回前100个词组
  }

  /**
   * 从文本中提取词组
   */
  private extractPhrases(text: string, language: string): string[] {
    const phrases: string[] = [];
    const normalizedText = text.toLowerCase();

    // 1. 提取 N-gram (2-4 个词)
    const words = normalizedText.split(/[\s,.!?;:"'()<>[\]{}\/\\|`~@#$%^&*+=_-]+/)
      .map(w => w.trim())
      .filter(w => w.length >= 2);

    // 2-gram (2个词的组合)
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`;
      if (phrase.length >= 5 && phrase.length <= 50) {
        phrases.push(phrase);
      }
    }

    // 3-gram (3个词的组合)
    for (let i = 0; i < words.length - 2; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (phrase.length >= 8 && phrase.length <= 60) {
        phrases.push(phrase);
      }
    }

    // 4-gram (4个词的组合)
    for (let i = 0; i < words.length - 3; i++) {
      const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`;
      if (phrase.length >= 12 && phrase.length <= 70) {
        phrases.push(phrase);
      }
    }

    // 2. 识别包含原始关键词的词组
    const keywordPhrases = phrases.filter(phrase =>
      phrase.includes(this.originalKeyword) ||
      this.originalKeyword.includes(phrase.split(' ')[0])
    );

    // 3. 识别符合 YouTube 搜索模式的词组
    const youtubePhrases = phrases.filter(phrase =>
      Object.keys(YOUTUBE_PHRASE_PATTERNS).some(pattern =>
        phrase.includes(pattern)
      )
    );

    // 合并并去重
    const allPhrases = [...keywordPhrases, ...youtubePhrases];
    return [...new Set(allPhrases)];
  }

  /**
   * 生成智能词组（基于原始关键词和常见模式）
   */
  private generateIntelligentPhrases(
    existingPhrases: Map<string, PhraseData>
  ): PhraseData[] {
    const generated: PhraseData[] = [];
    const keyword = this.originalKeyword;

    // 1. 基于常见模式生成词组
    const patterns = [
      `${keyword} vlog`,
      `${keyword} tips`,
      `${keyword} tutorial`,
      `${keyword} routine`,
      `${keyword} guide`,
      `${keyword} for beginners`,
      `${keyword} challenges`,
      `${keyword} journey`,
      `${keyword} course`,
      `${keyword} class`,
      `${keyword} online`,
      `how to ${keyword}`,
      `${keyword} hacks`,
      `${keyword} methods`,
      `${keyword} strategies`,
      `best ${keyword}`,
      `${keyword} mistakes`,
      `${keyword} secrets`,
      `${keyword} transformation`,
      `my ${keyword} journey`,
      `a day of ${keyword}`,
      `${keyword} day in the life`,
    ];

    patterns.forEach(pattern => {
      const normalizedPattern = pattern.toLowerCase();
      if (!existingPhrases.has(normalizedPattern)) {
        const type = this.identifyPhraseType(normalizedPattern);
        generated.push({
          phrase: normalizedPattern,
          type,
          frequency: 0, // 初始频率为0，会在实际数据中更新
          avgViews: 0,
          videoCount: 0,
          relevanceScore: this.calculatePhraseRelevance(normalizedPattern),
          searchIntent: SEARCH_INTENT_TEMPLATES[type],
          targetAudience: TARGET_AUDIENCE_TEMPLATES[type],
        });
      }
    });

    return generated;
  }

  /**
   * 识别词组类型
   */
  private identifyPhraseType(phrase: string): PhraseType {
    const lowerPhrase = phrase.toLowerCase();

    for (const [pattern, type] of Object.entries(YOUTUBE_PHRASE_PATTERNS)) {
      if (lowerPhrase.includes(pattern)) {
        return type;
      }
    }

    return 'other';
  }

  /**
   * 计算词组相关性
   */
  private calculatePhraseRelevance(phrase: string): number {
    let score = 0;
    const normalizedPhrase = phrase.toLowerCase();
    const normalizedKeyword = this.originalKeyword;

    // 1. 包含原始关键词
    if (normalizedPhrase.includes(normalizedKeyword)) {
      score += 0.6;

      // 原始关键词在开头（权重更高）
      if (normalizedPhrase.startsWith(normalizedKeyword)) {
        score += 0.2;
      }
    }

    // 2. 匹配 YouTube 搜索模式
    const matchedPattern = Object.keys(YOUTUBE_PHRASE_PATTERNS).find(pattern =>
      normalizedPhrase.includes(pattern)
    );
    if (matchedPattern) {
      score += 0.3;
    }

    // 3. 词组长度适中（2-4个词最佳）
    const wordCount = normalizedPhrase.split(' ').length;
    if (wordCount === 2 || wordCount === 3) {
      score += 0.1;
    }

    // 4. 避免过长的词组
    if (normalizedPhrase.length > 50) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(score, 1.0));
  }

  /**
   * 更新词组映射
   */
  private updatePhraseMap(
    map: Map<string, PhraseData>,
    phrases: string[],
    video: any
  ): void {
    phrases.forEach(phrase => {
      const normalizedPhrase = phrase.toLowerCase().trim();

      if (!map.has(normalizedPhrase)) {
        const type = this.identifyPhraseType(normalizedPhrase);
        map.set(normalizedPhrase, {
          phrase: normalizedPhrase,
          type,
          frequency: 0,
          avgViews: 0,
          videoCount: 0,
          relevanceScore: 0,
          searchIntent: SEARCH_INTENT_TEMPLATES[type],
          targetAudience: TARGET_AUDIENCE_TEMPLATES[type],
        });
      }

      const data = map.get(normalizedPhrase)!;
      data.frequency++;
      data.avgViews = (data.avgViews * data.videoCount + video.viewCount) / (data.videoCount + 1);
      data.videoCount++;
    });
  }
}

// 导出单例
export const phraseExtractor = new PhraseExtractor();
