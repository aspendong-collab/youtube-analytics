import { ExpansionResult, KeywordDimension } from './types';
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

      return keywords.map((k: any) => ({
        keyword: k.keyword,
        dimension: 'scenario',
        source: 'llm',
        relevance: k.relevance || 0.8,
        type: k.type || 'broad',
        intent: k.intent || 'info',
        estimatedSearchVolume: 0,
        estimatedCompetition: 0,
        commercialValue: 0,
        recommendationScore: 0,
      }));
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
  async generateAllDimensions(keyword: string): Promise<Record<KeywordDimension, ExpansionResult[]>> {
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

        const resultPromise = this.generateDimensionKeywords(keyword, dimension);
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
    dimension: KeywordDimension
  ): Promise<ExpansionResult[]> {
    const dimensionPrompts: Record<KeywordDimension, string> = {
      scenario: '使用场景',
      carrier: '使用载体（设备/平台/系统）',
      state: '状态特征（免费/付费/推荐/评测等）',
      goal: '使用目标（学习/赚钱/解决问题等）',
      method: '方法步骤（怎么用/如何做/优化等）',
    };

    const prompt = `你是一个YouTube关键词优化专家。请为关键词"${keyword}"生成15-20个${dimensionPrompts[dimension]}相关的关键词。

维度说明：${dimensionPrompts[dimension]}

要求：
1. 每个关键词都要包含"${keyword}"或与其高度相关
2. 关键词要符合YouTube搜索习惯，用户会真实搜索
3. 每个关键词要描述${dimensionPrompts[dimension]}
4. 返回格式为JSON对象，包含：
   - keywords: 关键词数组，每个元素包含：
     - keyword: 生成的关键词
     - relevance: 相关性评分（0-1之间的数字）
     - type: 关键词类型（broad/long-tail/question）
     - intent: 搜索意图（info/tutorial/review/transaction）

请只返回JSON对象，不要包含其他内容。`;

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

    return keywords.map((k: any) => ({
      keyword: k.keyword,
      dimension: 'scenario', // 这里会在外层被替换
      source: 'llm',
      relevance: k.relevance || 0.8,
      type: k.type || 'broad',
      intent: k.intent || 'info',
      estimatedSearchVolume: 0,
      estimatedCompetition: 0,
      commercialValue: 0,
      recommendationScore: 0,
    }));
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
