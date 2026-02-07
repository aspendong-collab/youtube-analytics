/**
 * AI 服务
 * 基于 coze-coding-dev-sdk 实现大语言模型调用
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { logger } from '@/core/logger';
import { config } from '@/core/config';
import { cache, keywordKeys } from '@/core/cache';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export class AIService {
  private static instance: AIService;
  private client: LLMClient;
  private defaultModel: string;
  private defaultTemperature: number;

  private constructor() {
    const llmConfig = new Config();
    this.client = new LLMClient(llmConfig);
    this.defaultModel = config.get('ai.model') as string || 'doubao-seed-1-8-251228';
    this.defaultTemperature = config.get('ai.temperature') as number || 0.7;
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * 生成文本（非流式）
   */
  async generateText(
    prompt: string,
    options: {
      systemPrompt?: string;
      model?: string;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const {
      systemPrompt,
      model = this.defaultModel,
      temperature = this.defaultTemperature,
    } = options;

    const messages: Message[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    logger.info('AI text generation', { model, temperature, promptLength: prompt.length });

    try {
      const response = await this.client.invoke(messages, {
        model,
        temperature,
        caching: 'disabled',
      });

      logger.info('AI text generation completed', { responseLength: response.content.length });

      return response.content;
    } catch (error) {
      logger.error('AI text generation failed', error as Error, { model });
      throw error;
    }
  }

  /**
   * 生成文本（流式）
   */
  async *generateTextStream(
    prompt: string,
    options: {
      systemPrompt?: string;
      model?: string;
      temperature?: number;
    } = {}
  ): AsyncGenerator<string> {
    const {
      systemPrompt,
      model = this.defaultModel,
      temperature = this.defaultTemperature,
    } = options;

    const messages: Message[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    logger.info('AI text generation (stream)', { model, temperature });

    try {
      const stream = this.client.stream(messages, {
        model,
        temperature,
        caching: 'disabled',
      });

      for await (const chunk of stream) {
        if (chunk.content) {
          yield chunk.content.toString();
        }
      }

      logger.info('AI text generation (stream) completed');
    } catch (error) {
      logger.error('AI text generation (stream) failed', error as Error, { model });
      throw error;
    }
  }

  /**
   * 拓展关键词（生成近义词、相关词、长尾词）
   */
  async expandKeywords(
    keyword: string,
    options: {
      language?: string;
      count?: number;
      types?: ('synonym' | 'related' | 'long_tail')[];
    } = {}
  ): Promise<{
    synonyms: string[];
    related: string[];
    long_tail: string[];
  }> {
    const { language = 'en', count = 10, types = ['synonym', 'related', 'long_tail'] } = options;

    const cacheKey = keywordKeys.expansion(keyword, language, types.join(','));
    
    // 尝试从缓存获取
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.info('Keyword expansion from cache', { keyword });
      return cached;
    }

    const systemPrompt = `You are a keyword research expert. Your task is to expand the given keyword into related terms, synonyms, and long-tail variations.

Output format:
Provide the results in the following JSON format:
{
  "synonyms": ["word1", "word2", ...],
  "related": ["word1", "word2", ...],
  "long_tail": ["phrase1", "phrase2", ...]
}

Rules:
- Synonyms: Words with similar meaning
- Related: Words that are conceptually connected
- Long-tail: Longer phrases that include the keyword or its variations
- Generate exactly ${count} variations for each requested type
- Language: ${language}`;

    const prompt = `Expand the keyword "${keyword}" into synonyms, related terms, and long-tail variations in ${language}.`;

    logger.info('Keyword expansion', { keyword, language, count, types });

    try {
      const response = await this.generateText(prompt, {
        systemPrompt,
        temperature: 0.7,
      });

      // 解析 JSON 响应
      let result: { synonyms: string[]; related: string[]; long_tail: string[] };

      try {
        // 尝试直接解析
        result = JSON.parse(response);
      } catch {
        // 如果直接解析失败，尝试提取 JSON 部分
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // 解析失败，返回空结果
          result = { synonyms: [], related: [], long_tail: [] };
          logger.warn('Failed to parse keyword expansion response', { keyword, response });
        }
      }

      // 过滤不需要的类型
      if (!types.includes('synonym')) result.synonyms = [];
      if (!types.includes('related')) result.related = [];
      if (!types.includes('long_tail')) result.long_tail = [];

      // 缓存结果（1小时）
      cache.set(cacheKey, result, { ttl: 3600 });

      logger.info('Keyword expansion completed', { keyword, total: result.synonyms.length + result.related.length + result.long_tail.length });

      return result;
    } catch (error) {
      logger.error('Keyword expansion failed', error as Error, { keyword });
      throw error;
    }
  }

  /**
   * 分析关键词竞争度
   */
  async analyzeKeywordCompetition(
    keyword: string,
    context?: {
      searchVolume?: number;
      cpc?: number;
    }
  ): Promise<{
    competition: 'low' | 'medium' | 'high';
    difficulty: number;
    opportunity: 'low' | 'medium' | 'high';
    reasoning: string;
  }> {
    const systemPrompt = `You are a keyword analysis expert. Analyze the given keyword's competition level and provide insights.

Output format:
{
  "competition": "low" | "medium" | "high",
  "difficulty": number (0-100),
  "opportunity": "low" | "medium" | "high",
  "reasoning": "explanation of your analysis"
}

Competition levels:
- low: Easy to rank, low competition
- medium: Moderate competition, achievable
- high: Highly competitive, difficult to rank

Difficulty scale:
- 0-20: Very easy
- 21-40: Easy
- 41-60: Medium
- 61-80: Difficult
- 81-100: Very difficult`;

    const contextInfo = context 
      ? `\n\nAdditional context:\n- Search Volume: ${context.searchVolume || 'N/A'}\n- CPC: $${context.cpc || 'N/A'}`
      : '';

    const prompt = `Analyze the competition level for the keyword "${keyword}"${contextInfo}.`;

    logger.info('Keyword competition analysis', { keyword, context });

    try {
      const response = await this.generateText(prompt, {
        systemPrompt,
        temperature: 0.3,
      });

      // 解析 JSON 响应
      let result: {
        competition: 'low' | 'medium' | 'high';
        difficulty: number;
        opportunity: 'low' | 'medium' | 'high';
        reasoning: string;
      };

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        logger.warn('Failed to parse competition analysis response', { keyword, response });
        result = {
          competition: 'medium',
          difficulty: 50,
          opportunity: 'medium',
          reasoning: 'Unable to analyze due to parsing error',
        };
      }

      logger.info('Keyword competition analysis completed', { keyword, competition: result.competition, difficulty: result.difficulty });

      return result;
    } catch (error) {
      logger.error('Keyword competition analysis failed', error as Error, { keyword });
      throw error;
    }
  }

  /**
   * 生成营销文案
   */
  async generateMarketingCopy(
    product: string,
    targetAudience: string,
    platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'blog',
    tone: 'professional' | 'casual' | 'enthusiastic' | 'informative' = 'professional'
  ): Promise<{
    headline: string;
    body: string;
    cta: string;
    hashtags: string[];
  }> {
    const systemPrompt = `You are a marketing copywriter expert. Create compelling marketing copy for social media and content platforms.

Output format:
{
  "headline": "catchy headline",
  "body": "main content with engaging storytelling",
  "cta": "call-to-action",
  "hashtags": ["#tag1", "#tag2", ...]
}

Guidelines:
- Headline: Short, attention-grabbing, under 100 characters
- Body: Engaging, benefit-focused, platform-appropriate length
- CTA: Clear action, create urgency
- Hashtags: 5-10 relevant hashtags
- Tone: ${tone}
- Platform: ${platform}`;

    const prompt = `Create marketing copy for "${product}" targeting "${targetAudience}" on ${platform}.`;

    logger.info('Marketing copy generation', { product, targetAudience, platform, tone });

    try {
      const response = await this.generateText(prompt, {
        systemPrompt,
        temperature: 0.8,
      });

      // 解析 JSON 响应
      let result: {
        headline: string;
        body: string;
        cta: string;
        hashtags: string[];
      };

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        logger.warn('Failed to parse marketing copy response', { product, response });
        result = {
          headline: 'Discover ' + product,
          body: response,
          cta: 'Learn more today!',
          hashtags: [],
        };
      }

      logger.info('Marketing copy generation completed', { product, headlineLength: result.headline.length });

      return result;
    } catch (error) {
      logger.error('Marketing copy generation failed', error as Error, { product });
      throw error;
    }
  }

  /**
   * 生成谈判话术
   */
  async generateNegotiationScript(
    scenario: string,
    context: {
      offer?: string;
      budget?: number;
      deliverables?: string[];
    }
  ): Promise<{
    opening: string;
    mainPoints: string[];
    closing: string;
    tips: string[];
  }> {
    const systemPrompt = `You are a skilled negotiation expert. Create a negotiation script for influencer marketing.

Output format:
{
  "opening": "opening statement",
  "mainPoints": ["point1", "point2", ...],
  "closing": "closing statement",
  "tips": ["tip1", "tip2", ...]
}

Guidelines:
- Opening: Professional, respectful, clear purpose
- Main Points: 3-5 key points covering terms, deliverables, timeline
- Closing: Clear next steps, call to action
- Tips: 2-4 practical tips for success`;

    const contextInfo = Object.entries(context)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n');

    const prompt = `Create a negotiation script for: ${scenario}\n\nContext:\n${contextInfo}`;

    logger.info('Negotiation script generation', { scenario });

    try {
      const response = await this.generateText(prompt, {
        systemPrompt,
        temperature: 0.6,
      });

      // 解析 JSON 响应
      let result: {
        opening: string;
        mainPoints: string[];
        closing: string;
        tips: string[];
      };

      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (error) {
        logger.warn('Failed to parse negotiation script response', { scenario, response });
        result = {
          opening: 'Thank you for considering our collaboration.',
          mainPoints: [response],
          closing: 'Looking forward to hearing from you.',
          tips: [],
        };
      }

      logger.info('Negotiation script generation completed', { scenario, pointsCount: result.mainPoints.length });

      return result;
    } catch (error) {
      logger.error('Negotiation script generation failed', error as Error, { scenario });
      throw error;
    }
  }

  /**
   * 总结内容
   */
  async summarizeContent(content: string, maxLength: number = 200): Promise<string> {
    const systemPrompt = `You are a content summarization expert. Summarize the given content concisely.

Guidelines:
- Keep it under ${maxLength} words
- Focus on key points and main ideas
- Maintain professional tone
- Use clear and simple language`;

    logger.info('Content summarization', { contentLength: content.length, maxLength });

    try {
      const response = await this.generateText(content, {
        systemPrompt,
        temperature: 0.3,
      });

      logger.info('Content summarization completed', { summaryLength: response.length });

      return response;
    } catch (error) {
      logger.error('Content summarization failed', error as Error);
      throw error;
    }
  }
}

// 导出单例实例
export const aiService = AIService.getInstance();
