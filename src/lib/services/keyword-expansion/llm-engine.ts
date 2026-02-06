import { ExpansionResult, KeywordDimension, SupportedLanguage, LANGUAGE_NAMES, YOUTUBE_LANGUAGE_CODES } from './types';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

/**
 * LLM引擎：使用大语言模型进行智能关键词拓展
 */
export class LLMEngine {
  private client: LLMClient;

  constructor() {
    const config = new Config();
    this.client = new LLMClient(config);
  }

  /**
   * 基于关键词特征动态计算竞争度
   * 考虑因素：关键词长度、关键词类型、相关性等
   */
  private calculateDynamicCompetition(
    keyword: string,
    originalKeyword: string,
    relevance: number
  ): number {
    let competition = 0.5; // 基础竞争度

    // 1. 基于关键词长度调整：长尾词竞争度更低
    const keywordLength = keyword.split(/\s+/).length;
    if (keywordLength >= 4) {
      competition -= 0.3; // 长尾词降低竞争度
    } else if (keywordLength >= 3) {
      competition -= 0.15; // 中等长度略微降低
    } else if (keywordLength === 1) {
      competition += 0.2; // 单词竞争度高
    }

    // 2. 基于相关性调整：相关性高的关键词竞争度可能更高
    competition += (relevance - 0.5) * 0.3; // 相关性对竞争度的影响范围 -0.15 到 +0.15

    // 3. 基于关键词特征调整
    const lowerKeyword = keyword.toLowerCase();

    // 品牌词（包含原始词的）竞争度高
    if (lowerKeyword.includes(originalKeyword.toLowerCase())) {
      competition += 0.1;
    }

    // 包含特定修饰词的关键词
    const highCompetitionPatterns = ['best', 'top', 'best', '推荐', '热门', '最佳'];
    const lowCompetitionPatterns = ['tutorial', 'how to', 'guide', '教程', '方法', '技巧'];

    if (highCompetitionPatterns.some(pattern => lowerKeyword.includes(pattern))) {
      competition += 0.1;
    }
    if (lowCompetitionPatterns.some(pattern => lowerKeyword.includes(pattern))) {
      competition -= 0.1;
    }

    // 4. 限制在 0-1 范围内
    return Math.max(0, Math.min(1, competition));
  }

  /**
   * 获取语言特定的关键词格式示例
   */
  private getLanguageKeywordFormats(language: SupportedLanguage): string[] {
    const formats: Record<SupportedLanguage, string[]> = {
      'en': [
        '"how to use [keyword] for [scenario]"',
        '"[keyword] tips for [scenario]"',
        '"best [keyword] for [scenario]"',
      ],
      'fr': [
        '"comment utiliser [keyword] pour [scenario]"',
        '"[keyword] astuces pour [scenario]"',
        '"meilleur [keyword] pour [scenario]"',
      ],
      'de': [
        '"wie man [keyword] für [scenario] verwendet"',
        '"[keyword] Tipps für [scenario]"',
        '"bester [keyword] für [scenario]"',
      ],
      'it': [
        '"come usare [keyword] per [scenario]"',
        '"[keyword] consigli per [scenario]"',
        '"migliore [keyword] per [scenario]"',
      ],
      'es': [
        '"cómo usar [keyword] para [scenario]"',
        '"[keyword] consejos para [scenario]"',
        '"mejor [keyword] para [scenario]"',
      ],
      'pt': [
        '"como usar [keyword] para [scenario]"',
        '"[keyword] dicas para [scenario]"',
        '"melhor [keyword] para [scenario]"',
      ],
      'ja': [
        '"[scenario]で[keyword]を使う方法"',
        '"[scenario]向け[keyword]の使い方"',
        '"[scenario]におすすめ[keyword]"',
      ],
      'ko': [
        '"[scenario]에서 [keyword] 사용 방법"',
        '"[scenario]을 위한 [keyword] 팁"',
        '"[scenario]에 좋은 [keyword]"',
      ],
      'zh-TW': [
        '"在[scenario]時使用[keyword]"',
        '"用[keyword]做[scenario]"',
        '"[keyword]在[scenario]下的應用"',
      ],
      'zh-CN': [
        '"在[scenario]时使用[keyword]"',
        '"用[keyword]做[scenario]"',
        '"[keyword]在[scenario]下的应用"',
      ],
    };

    return formats[language] || formats['en'];
  }

  /**
   * 获取语言特定的维度描述
   */
  private getLanguageDimensionDescriptions(language: SupportedLanguage): Record<KeywordDimension, string> {
    const descriptions: Record<SupportedLanguage, Record<KeywordDimension, string>> = {
      'en': {
        scenario: 'Usage scenarios (when/where to use)',
        carrier: 'Usage carriers (devices/platforms/systems)',
        state: 'State features (free/paid/recommended/best)',
        goal: 'Usage goals (learn/earn/solve problems)',
        method: 'Method steps (how to/tutorial/optimization)',
      },
      'fr': {
        scenario: 'Scénarios d\'utilisation (quand/où utiliser)',
        carrier: 'Porteurs d\'utilisation (appareils/plateformes/systèmes)',
        state: 'Fonctionnalités d\'état (gratuit/payant/recommandé/meilleur)',
        goal: 'Objectifs d\'utilisation (apprendre/gagner/résoudre)',
        method: 'Étapes de méthode (comment faire/tutoriel/optimisation)',
      },
      'de': {
        scenario: 'Verwendungsszenarien (wann/wo verwenden)',
        carrier: 'Verwendungsträger (Geräte/Plattformen/Systeme)',
        state: 'Zustandsmerkmale (kostenlos/bezahlt/empfohlen/bester)',
        goal: 'Verwendungsziele (lernen/verdienen/lösen)',
        method: 'Methodenschritte (wie/tutorial/optimierung)',
      },
      'it': {
        scenario: 'Scenari di utilizzo (quando/dove usare)',
        carrier: 'Portatori di utilizzo (dispositivi/piattaforme/sistemi)',
        state: 'Caratteristiche dello stato (gratuito/a pagamento/raccomandato/migliore)',
        goal: 'Obiettivi di utilizzo (imparare/guadagnare/risolvere)',
        method: 'Passaggi del metodo (come fare/tutorial/ottimizzazione)',
      },
      'es': {
        scenario: 'Escenarios de uso (cuándo/dónde usar)',
        carrier: 'Portadores de uso (dispositivos/plataformas/sistemas)',
        state: 'Características de estado (gratuito/pago/recomendado/mejor)',
        goal: 'Objetivos de uso (aprender/ganar/resolver)',
        method: 'Pasos del método (cómo hacer/tutorial/optimización)',
      },
      'pt': {
        scenario: 'Cenários de uso (quando/onde usar)',
        carrier: 'Portadores de uso (dispositivos/plataformas/sistemas)',
        state: 'Características de estado (gratuito/pago/recomendado/melhor)',
        goal: 'Objetivos de uso (aprender/ganhar/resolver)',
        method: 'Passos do método (como fazer/tutorial/otimização)',
      },
      'ja': {
        scenario: '使用シナリオ（いつ/どこで使う）',
        carrier: '使用キャリア（デバイス/プラットフォーム/システム）',
        state: '状態特性（無料/有料/おすすめ/最高）',
        goal: '使用目標（学ぶ/稼ぐ/問題解決）',
        method: '方法ステップ（方法/チュートリアル/最適化）',
      },
      'ko': {
        scenario: '사용 시나리오 (언제/어디서 사용)',
        carrier: '사용 매체 (장치/플랫폼/시스템)',
        state: '상태 특징 (무료/유료/추천/최고)',
        goal: '사용 목표 (학습/수익/문제 해결)',
        method: '방법 단계 (방법/자습서/최적화)',
      },
      'zh-TW': {
        scenario: '使用場景（何時/何地使用）',
        carrier: '使用載體（設備/平台/系統）',
        state: '狀態特徵（免費/付費/推薦/最佳）',
        goal: '使用目標（學習/賺錢/解決問題）',
        method: '方法步驟（怎麼做/教學/優化）',
      },
      'zh-CN': {
        scenario: '使用场景（何时/何地使用）',
        carrier: '使用载体（设备/平台/系统）',
        state: '状态特征（免费/付费/推荐/最佳）',
        goal: '使用目标（学习/赚钱/解决问题）',
        method: '方法步骤（怎么做/教程/优化）',
      },
    };

    return descriptions[language] || descriptions['en'];
  }
  // 使用LLM生成场景联想关键词
  async generateScenarios(keyword: string, count: number = 20): Promise<ExpansionResult[]> {
    const prompt = `你是一个YouTube关键词优化专家。请为关键词"${keyword}"生成${count}个场景相关的关键词。

要求：
1. 每个关键词都要包含"${keyword}"或与其高度相关
2. 关键词要描述使用场景，例如"开车时用"、"学习时用"、"开会时用"等
3. 关键词要符合YouTube搜索习惯，用户会真实搜索
4. 每个关键词要符合以下格式之一：
   - "XXX时用${keyword}"
   - "用${keyword}做XXX"
   - "${keyword}在XXX场景下的应用"
5. 返回格式为JSON数组，每个元素包含：
   - keyword: 生成的关键词
   - relevance: 相关性评分（0-1之间的数字）
   - type: 关键词类型（broad/long-tail/question）
   - intent: 搜索意图（info/tutorial/review/transaction）

请只返回JSON数组，不要包含其他内容。`;

    try {
      // 添加10秒超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('LLM timeout')), 10000);
      });

      const llmPromise = this.invokeLLM(prompt);

      const response = await Promise.race([llmPromise, timeoutPromise]) as any;

      const data = JSON.parse(response);

      const keywords = data.keywords || [];

      return keywords.map((k: any) => {
        const relevance = k.relevance || 0.8;
        return {
          keyword: k.keyword,
          dimension: 'scenario',
          source: 'llm',
          relevance,
          type: k.type || 'broad',
          intent: k.intent || 'info',
          estimatedSearchVolume: 0,
          estimatedCompetition: this.calculateDynamicCompetition(k.keyword, '', relevance),
          commercialValue: 0,
          recommendationScore: 0,
        };
      });
    } catch (error) {
      console.error('LLM场景生成失败:', error);
      return [];
    }
  }

  // 调用LLM并返回响应内容
  private async invokeLLM(prompt: string): Promise<string> {
    const messages: Array<{ role: 'user'; content: string }> = [
      { role: 'user', content: prompt }
    ];

    const response = await this.client.invoke(messages, {
      model: 'doubao-seed-1-6-flash-250615',
      temperature: 0.8,
    });

    return response.content;
  }

  // 使用LLM生成所有维度的关键词
  async generateAllDimensions(
    keyword: string,
    language: SupportedLanguage = 'zh-CN'
  ): Promise<Record<KeywordDimension, ExpansionResult[]>> {
    const results: Record<KeywordDimension, ExpansionResult[]> = {} as any;

    // 为每个维度生成关键词
    const dimensions: KeywordDimension[] = ['scenario', 'carrier', 'state', 'goal', 'method'];

    // 使用Promise.allSettled并发调用，并为每个调用添加超时控制
    const promises = dimensions.map(async (dimension) => {
      try {
        // 添加10秒超时控制
        const timeoutPromise = new Promise<ExpansionResult[]>((_, reject) => {
          setTimeout(() => reject(new Error('LLM timeout')), 10000);
        });

        const resultPromise = this.generateDimensionKeywords(keyword, dimension, language);
        const results = await Promise.race([resultPromise, timeoutPromise]) as ExpansionResult[];
        return { dimension, results };
      } catch (error) {
        console.error(`LLM ${dimension}维度生成失败:`, error);
        return { dimension, results: [] };
      }
    });

    const settledResults = await Promise.allSettled(promises);

    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        const { dimension, results: dimensionResults } = settled.value;
        // 设置正确的维度
        results[dimension] = dimensionResults.map(k => ({
          ...k,
          dimension,
        }));
      }
    }

    return results;
  }

  // 为特定维度生成关键词
  private async generateDimensionKeywords(
    keyword: string,
    dimension: KeywordDimension,
    language: SupportedLanguage = 'zh-CN'
  ): Promise<ExpansionResult[]> {
    // 获取语言特定的维度描述
    const dimensionDescriptions = this.getLanguageDimensionDescriptions(language);
    const dimensionDesc = dimensionDescriptions[dimension];

    // 获取语言特定的关键词格式示例
    const keywordFormats = this.getLanguageKeywordFormats(language);

    // 语言名称映射
    const languageNames: Record<SupportedLanguage, string> = {
      'en': 'English',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'es': 'Spanish',
      'pt': 'Portuguese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh-TW': 'Traditional Chinese',
      'zh-CN': 'Simplified Chinese',
    };

    // 语言特定示例（使用实际关键词作为示例）
    const languageExamples: Record<SupportedLanguage, string[]> = {
      'en': ['how to use Notion for studying', 'Notion tips for productivity', 'best Notion for students', 'Notion tutorial for beginners', 'using Notion for project management'],
      'fr': ['comment utiliser Notion pour étudier', 'Notion conseils pour productivité', 'meilleur Notion pour étudiants', 'Notion tutoriel pour débutants', 'utiliser Notion pour gestion de projet'],
      'de': ['wie man Notion zum Lernen verwendet', 'Notion Tipps für Produktivität', 'bester Notion für Studenten', 'Notion Tutorial für Anfänger', 'Notion für Projektmanagement verwenden'],
      'it': ['come usare Notion per studiare', 'Notion consigli per produttività', 'migliore Notion per studenti', 'Notion tutorial per principianti', 'usare Notion per gestione progetti'],
      'es': ['cómo usar Notion para estudiar', 'Notion consejos para productividad', 'mejor Notion para estudiantes', 'Notion tutorial para principiantes', 'usar Notion para gestión de proyectos'],
      'pt': ['como usar Notion para estudiar', 'Notion dicas para produtividade', 'melhor Notion para estudantes', 'Notion tutorial para iniciantes', 'usar Notion para gestão de projetos'],
      'ja': ['Notionを学習に使う方法', 'Notionの生産性向上のコツ', '学生に最適なNotion', 'Notion初心者向けチュートリアル', 'プロジェクト管理にNotionを使用'],
      'ko': ['학습을 위해 Notion 사용하는 방법', '생산성을 위한 Notion 팁', '학생을 위한 최고의 Notion', '초보자를 위한 Notion 튜토리얼', '프로젝트 관리에 Notion 사용'],
      'zh-TW': ['如何使用Notion進行學習', 'Notion提升生產力的技巧', '學生最適合的Notion', 'Notion初學者教學', '使用Notion進行專案管理'],
      'zh-CN': ['如何使用Notion进行学习', 'Notion提升生产力的技巧', '学生最适合的Notion', 'Notion初学者教学', '使用Notion进行项目管理'],
    };

    const targetLanguage = languageNames[language];
    const examples = languageExamples[language] || languageExamples['en'];

    // 构建提示词
    const prompt = `Generate 30-40 YouTube keywords in ${targetLanguage} for "${keyword}".

Dimension: ${dimensionDesc}

Language: ${targetLanguage} ONLY - all keywords must be in this language.

Examples in ${targetLanguage}:
${examples.map(ex => `• ${ex.replace('Notion', keyword)}`).join('\n')}

Format:
${keywordFormats.map(f => `• ${f.replace('[keyword]', keyword).replace('[scenario]', 'XXX')}`).join('\n')}

Return JSON:
{
  "keywords": [
    {"keyword": "${targetLanguage} keyword with ${keyword}", "relevance": 0.8, "type": "broad", "intent": "info"}
  ]
}

ALL keywords must be in ${targetLanguage} language.`;

    try {
      // 添加10秒超时控制
      const timeoutPromise = new Promise<ExpansionResult[]>((_, reject) => {
        setTimeout(() => reject(new Error('LLM timeout')), 10000);
      });

      const llmPromise = this.invokeLLMWithParse(prompt);

      const keywords = await Promise.race([llmPromise, timeoutPromise]) as ExpansionResult[];

      return keywords || [];
    } catch (error) {
      console.error(`LLM ${dimension}维度生成失败:`, error);
      return [];
    }
  }

  // 调用LLM并解析JSON响应
  private async invokeLLMWithParse(prompt: string): Promise<ExpansionResult[]> {
    const messages: Array<{ role: 'user'; content: string }> = [
      { role: 'user', content: prompt }
    ];

    const response = await this.client.invoke(messages, {
      model: 'doubao-seed-1-6-flash-250615',
      temperature: 0.8,
    });

    const content = response.content;
    const data = JSON.parse(content);

    const keywords = data.keywords || [];

    return keywords.map((k: any) => {
      const relevance = k.relevance || 0.8;
      return {
        keyword: k.keyword,
        dimension: 'scenario', // 这里会在外层被替换
        source: 'llm',
        relevance,
        type: k.type || 'broad',
        intent: k.intent || 'info',
        estimatedSearchVolume: 0,
        estimatedCompetition: this.calculateDynamicCompetition(k.keyword, '', relevance),
        commercialValue: 0,
        recommendationScore: 0,
      };
    });
  }

  // 使用LLM优化关键词
  async optimizeKeywords(
    keywords: ExpansionResult[],
    inputKeyword: string
  ): Promise<ExpansionResult[]> {
    const keywordList = keywords.map(k => k.keyword).join(', ');

    const prompt = `你是一个YouTube关键词优化专家。请评估以下关键词的相关性和推荐指数。

原始关键词：${inputKeyword}
待评估关键词：${keywordList}

要求：
1. 为每个关键词评估：
   - relevance: 相关性评分（0-1之间的数字，1表示高度相关）
   - commercialValue: 商业价值（0-1之间的数字，1表示高商业价值）
   - estimatedCompetition: 估算竞争度（0-1之间的数字，1表示高竞争）
   - estimatedSearchVolume: 估算搜索量（整数，0-10000）
   - recommendationScore: 推荐指数（0-1之间的数字，综合评分）

2. 返回格式为JSON对象，包含：
   - evaluations: 评估数组，每个元素包含：
     - keyword: 关键词
     - relevance: 相关性
     - commercialValue: 商业价值
     - estimatedCompetition: 竞争度
     - estimatedSearchVolume: 搜索量
     - recommendationScore: 推荐指数

请只返回JSON对象，不要包含其他内容。`;

    try {
      // 添加15秒超时控制
      const timeoutPromise = new Promise<ExpansionResult[]>((_, reject) => {
        setTimeout(() => reject(new Error('LLM timeout')), 15000);
      });

      const llmPromise = this.invokeOptimize(prompt, keywords);

      const evaluations = await Promise.race([llmPromise, timeoutPromise]) as any[];

      // 创建映射以便快速查找
      const evalMap = new Map();
      evaluations.forEach((e: any) => {
        evalMap.set(e.keyword, e);
      });

      // 更新关键词数据
      return keywords.map(k => {
        const eval_ = evalMap.get(k.keyword);
        if (eval_) {
          return {
            ...k,
            relevance: eval_.relevance || k.relevance,
            commercialValue: eval_.commercialValue || 0,
            estimatedCompetition: eval_.estimatedCompetition || 0,
            estimatedSearchVolume: eval_.estimatedSearchVolume || 0,
            recommendationScore: eval_.recommendationScore || 0,
          };
        }
        return k;
      });
    } catch (error) {
      console.error('LLM关键词优化失败:', error);
      return keywords;
    }
  }

  // 调用LLM进行优化评估
  private async invokeOptimize(prompt: string, keywords: ExpansionResult[]): Promise<any[]> {
    const messages: Array<{ role: 'user'; content: string }> = [
      { role: 'user', content: prompt }
    ];

    const response = await this.client.invoke(messages, {
      model: 'doubao-seed-1-6-flash-250615',
      temperature: 0.5,
    });

    const content = response.content;
    const data = JSON.parse(content);

    return data.evaluations || [];
  }
}

export const llmEngine = new LLMEngine();
