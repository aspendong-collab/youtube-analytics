import { LLMClient, Config } from 'coze-coding-dev-sdk';

/**
 * 关键词拓展类型
 */
export type ExpansionType = 
  | 'synonym'        // 同义词
  | 'related'        // 相关词
  | 'industry'       // 行业术语
  | 'scenario'       // 场景词
  | 'audience'       // 目标受众
  | 'product'        // 产品相关
  | 'ai_generated';  // AI 生成

/**
 * 拓展关键词结果
 */
export interface ExpandedKeyword {
  keyword: string;
  type: ExpansionType;
  relevance: number; // 相关性 0-100
  source: 'rule' | 'ai';
}

/**
 * 网站内容提取结果
 */
export interface WebsiteContent {
  brandName?: string;
  productKeywords?: string[];
  targetAudience?: string[];
  industryTerms?: string[];
  description?: string;
}

/**
 * 智能关键词拓展器
 */
class KeywordExpander {
  // 规则库（可以扩展）
  private readonly synonymRules: Record<string, string[]> = {
    // 健身
    '健身': ['健身训练', '健身房', '锻炼', '运动', '体能训练'],
    '减肥': ['减脂', '瘦身', '塑形', '体重管理', '燃烧脂肪'],
    '增肌': ['增重', '增力', '力量训练', '肌肉增长'],
    '瑜伽': ['普拉提', '冥想', '伸展', '柔韧性'],
    '跑步': ['慢跑', '长跑', '马拉松', '跑步训练'],
    
    // 美妆
    '美妆': ['化妆', '彩妆', '美容', '护肤', '妆容'],
    '护肤': ['皮肤护理', '美容护肤', '面膜', '精华', '面霜'],
    '口红': ['唇膏', '唇彩', '唇釉', '口红试色'],
    '粉底': ['底妆', '遮瑕', 'BB霜', 'CC霜'],
    
    // 科技
    '手机': ['智能手机', 'iPhone', '安卓手机', '手机评测'],
    '电脑': ['笔记本', '台式机', 'PC', '电脑评测'],
    '相机': ['单反', '微单', '摄影', '相机评测'],
    
    // 美食
    '美食': ['美食制作', '食谱', '烹饪', '菜谱', '美食视频'],
    '烘焙': ['蛋糕', '面包', '甜点', '烘焙教程'],
    '料理': ['家常菜', '菜谱', '料理教程', '美食制作'],
  };

  private readonly relatedWordsRules: Record<string, string[]> = {
    // 健身相关
    '健身': ['减肥', '增肌', '瑜伽', '普拉提', 'HIIT', '有氧运动', '力量训练', '腹肌', '马甲线'],
    '减肥': ['节食', '饮食', '营养', '健康饮食', '低碳饮食', '生酮饮食'],
    '增肌': ['蛋白粉', '氨基酸', '肌肉', '健身补剂', '训练计划'],
    
    // 美妆相关
    '美妆': ['妆容教程', '化妆技巧', '护肤心得', '美妆博主', '化妆品推荐'],
    '护肤': ['敏感肌', '干皮', '油皮', '混合肌', '抗衰老', '美白'],
    
    // 科技相关
    '手机': ['手机壳', '手机膜', '手机配件', '手机评测', '手机推荐'],
    '电脑': ['电脑配件', '外设', '鼠标', '键盘', '显示器'],
    
    // 美食相关
    '美食': ['探店', '餐厅', '小吃', '夜宵', '下午茶'],
  };

  private readonly industryTermsRules: Record<string, string[]> = {
    // 健身
    '健身': ['HIIT', 'Tabata', 'CrossFit', '有氧运动', '无氧运动', '核心训练', '功能性训练', '周期化训练'],
    '减肥': ['BMI', 'BMR', '体脂率', '基础代谢', '热量缺口', '间歇性断食', '生酮', '阿特金斯'],
    
    // 美妆
    '美妆': ['K-beauty', 'J-beauty', '欧美风', '网红妆', '日常妆', '约会妆', '职场妆'],
    '护肤': ['烟酰胺', '视黄醇', '玻尿酸', '胶原蛋白', '果酸', '水杨酸', '维C', 'A醇'],
    
    // 科技
    '手机': ['5G', '骁龙', '天玑', 'A系列芯片', '高刷屏', '快充', '无线充电', 'Face ID'],
  };

  private readonly scenarioWordsRules: Record<string, string[]> = {
    // 健身
    '健身': ['健身教程', '健身打卡', '健身挑战', '健身计划', '居家健身', '健身房训练', '健身餐'],
    '减肥': ['减肥食谱', '减肥计划', '减肥打卡', '减肥日记', '减肥成功', '减肥经验'],
    
    // 美妆
    '美妆': ['妆容教程', '化妆教程', '日常妆容', '约会妆容', '职场妆容', '新娘妆容', '毕业妆容'],
    '护肤': ['护肤流程', '护肤步骤', '早晚护肤', '护肤打卡', '护肤心得'],
    
    // 美食
    '美食': ['探店视频', '美食教程', '家常菜谱', '美食vlog', '美食分享', '美食挑战'],
  };

  private readonly audienceRules: Record<string, string[]> = {
    // 健身
    '健身': ['健身爱好者', '减肥人群', '增肌人群', '健身新手', '健身达人', '健身教练', '健身博主'],
    '减肥': ['减肥人士', '瘦身达人', '减脂达人', '体重管理者'],
    
    // 美妆
    '美妆': ['美妆爱好者', '化妆新手', '化妆达人', '美妆博主', '化妆师'],
    '护肤': ['护肤爱好者', '敏感肌人群', '油皮人群', '干皮人群', '护肤达人'],
    
    // 科技
    '手机': ['数码爱好者', '手机发烧友', '科技博主'],
  };

  /**
   * 通过规则拓展关键词
   * @param keyword 原始关键词
   * @param types 拓展类型（默认所有类型）
   * @returns 拓展后的关键词列表
   */
  expandByRules(
    keyword: string,
    types: ExpansionType[] = ['synonym', 'related', 'industry', 'scenario', 'audience']
  ): ExpandedKeyword[] {
    const results: ExpandedKeyword[] = [];
    const normalizedKeyword = keyword.trim();

    // 同义词拓展
    if (types.includes('synonym')) {
      const synonyms = this.synonymRules[normalizedKeyword] || this.findSimilarRules(normalizedKeyword, this.synonymRules);
      synonyms.forEach(word => {
        results.push({
          keyword: word,
          type: 'synonym',
          relevance: 90,
          source: 'rule',
        });
      });
    }

    // 相关词拓展
    if (types.includes('related')) {
      const related = this.relatedWordsRules[normalizedKeyword] || this.findSimilarRules(normalizedKeyword, this.relatedWordsRules);
      related.forEach(word => {
        results.push({
          keyword: word,
          type: 'related',
          relevance: 80,
          source: 'rule',
        });
      });
    }

    // 行业术语拓展
    if (types.includes('industry')) {
      const industry = this.industryTermsRules[normalizedKeyword] || this.findSimilarRules(normalizedKeyword, this.industryTermsRules);
      industry.forEach(word => {
        results.push({
          keyword: word,
          type: 'industry',
          relevance: 75,
          source: 'rule',
        });
      });
    }

    // 场景词拓展
    if (types.includes('scenario')) {
      const scenario = this.scenarioWordsRules[normalizedKeyword] || this.findSimilarRules(normalizedKeyword, this.scenarioWordsRules);
      scenario.forEach(word => {
        results.push({
          keyword: word,
          type: 'scenario',
          relevance: 70,
          source: 'rule',
        });
      });
    }

    // 目标受众拓展
    if (types.includes('audience')) {
      const audience = this.audienceRules[normalizedKeyword] || this.findSimilarRules(normalizedKeyword, this.audienceRules);
      audience.forEach(word => {
        results.push({
          keyword: word,
          type: 'audience',
          relevance: 65,
          source: 'rule',
        });
      });
    }

    // 去重并按相关性排序
    const uniqueResults = this.deduplicateKeywords(results);
    return uniqueResults.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * 通过 AI 拓展关键词
   * @param keyword 原始关键词
   * @param maxCount 最大生成数量
   * @returns AI 生成的关键词列表
   */
  async expandByAI(keyword: string, maxCount: number = 20): Promise<ExpandedKeyword[]> {
    try {
      // 使用 coze-coding-dev-sdk
      const config = new Config();
      const client = new LLMClient(config);
      
      // 构建 Prompt
      const prompt = `你是一个专业的 YouTube 达人搜索关键词专家。

请为关键词 "${keyword}" 生成 ${maxCount} 个相关的搜索关键词，用于在 YouTube 上寻找相关达人。

要求：
1. 关键词应该包含同义词、相关词、行业术语、场景词
2. 每个关键词应该是中文，2-8 个字
3. 关键词应该多样化，不要重复
4. 按 相关性 从高到低排序
5. 只返回关键词列表，用换行符分隔，不要有编号或其他文字

示例输出：
健身训练
健身房
锻炼
减肥
增肌
瑜伽
普拉提`;

      // 调用 LLM API（使用 invoke 方法）
      const messages: Array<{ role: 'user'; content: string }> = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await client.invoke(messages, {
        model: 'doubao-seed-1-6-flash-250615', // 使用快速模型
        temperature: 0.7,
      });
      
      // 解析返回的关键词
      const content = response.content;
      const keywords = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, maxCount);

      // 转换为 ExpandedKeyword 格式
      const results: ExpandedKeyword[] = keywords.map((word, index) => ({
        keyword: word,
        type: 'ai_generated',
        relevance: Math.max(50, 100 - index * 3), // 相关性递减
        source: 'ai',
      }));

      return results;
    } catch (error) {
      console.error('[KeywordExpander] AI 拓展失败:', error);
      // 失败时返回空数组，不影响规则拓展
      return [];
    }
  }

  /**
   * 从网站 URL 提取产品相关信息
   * @param url 网站 URL
   * @returns 网站内容
   */
  async extractFromWebsite(url: string): Promise<WebsiteContent> {
    try {
      // 简化版：从 URL 中提取关键词
      // 在实际应用中，应该使用网页爬虫获取网站内容
      
      const hostname = new URL(url).hostname;
      const domainParts = hostname.replace('www.', '').split('.');
      const brandName = domainParts[0];
      
      // 根据 domain 推断行业和关键词
      const content: WebsiteContent = {
        brandName,
        productKeywords: [],
        targetAudience: [],
        industryTerms: [],
      };

      // 常见品牌映射
      const brandMappings: Record<string, WebsiteContent> = {
        'nike': {
          brandName: 'Nike',
          productKeywords: ['运动鞋', '运动服', '篮球鞋', '跑步鞋', '运动装备', '运动品牌'],
          targetAudience: ['运动员', '运动爱好者', '篮球爱好者', '跑步爱好者'],
          industryTerms: ['耐克', 'Just Do It', 'Air Jordan', 'Air Max'],
        },
        'apple': {
          brandName: 'Apple',
          productKeywords: ['iPhone', 'iPad', 'MacBook', 'Apple Watch', 'AirPods', '苹果'],
          targetAudience: ['科技爱好者', '设计师', '学生', '商务人士'],
          industryTerms: ['iOS', 'macOS', 'iOS设备', '苹果生态'],
        },
        'xiaomi': {
          brandName: 'Xiaomi',
          productKeywords: ['小米手机', '小米', '小米产品', '智能设备'],
          targetAudience: ['科技爱好者', '年轻人', '预算有限用户'],
          industryTerms: ['MIUI', '小米生态链'],
        },
      };

      if (brandMappings[brandName]) {
        Object.assign(content, brandMappings[brandName]);
      }

      return content;
    } catch (error) {
      console.error('[KeywordExpander] 网站解析失败:', error);
      return {};
    }
  }

  /**
   * 混合拓展（规则 + AI）
   * @param keyword 关键词或网站 URL
   * @param options 选项
   * @returns 拓展后的关键词列表
   */
  async expand(
    keyword: string,
    options: {
      useRules?: boolean;
      useAI?: boolean;
      maxResults?: number;
      types?: ExpansionType[];
    } = {}
  ): Promise<{
    original: string;
    keywords: ExpandedKeyword[];
    total: number;
    source: string;
  }> {
    const {
      useRules = true,
      useAI = true,
      maxResults = 50,
      types = ['synonym', 'related', 'industry', 'scenario', 'audience'],
    } = options;

    let results: ExpandedKeyword[] = [];
    let isWebsite = false;

    // 检查是否为网站 URL
    if (keyword.startsWith('http://') || keyword.startsWith('https://')) {
      isWebsite = true;
      const websiteContent = await this.extractFromWebsite(keyword);
      
      // 从网站内容提取关键词
      if (websiteContent.productKeywords) {
        websiteContent.productKeywords.forEach(kw => {
          results.push({
            keyword: kw,
            type: 'product',
            relevance: 95,
            source: 'rule',
          });
        });
      }
      
      if (websiteContent.industryTerms) {
        websiteContent.industryTerms.forEach(kw => {
          results.push({
            keyword: kw,
            type: 'industry',
            relevance: 90,
            source: 'rule',
          });
        });
      }
      
      if (websiteContent.targetAudience) {
        websiteContent.targetAudience.forEach(kw => {
          results.push({
            keyword: kw,
            type: 'audience',
            relevance: 85,
            source: 'rule',
          });
        });
      }

      // 使用品牌名称作为关键词
      if (websiteContent.brandName) {
        keyword = websiteContent.brandName;
      }
    }

    // 规则拓展
    if (useRules) {
      const ruleResults = this.expandByRules(keyword, types);
      results.push(...ruleResults);
    }

    // AI 拓展
    if (useAI && !isWebsite) {
      const aiResults = await this.expandByAI(keyword, 20);
      results.push(...aiResults);
    }

    // 去重并排序
    const uniqueResults = this.deduplicateKeywords(results);
    const sortedResults = uniqueResults
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxResults);

    return {
      original: keyword,
      keywords: sortedResults,
      total: sortedResults.length,
      source: isWebsite ? 'website' : 'keyword',
    };
  }

  /**
   * 去重关键词
   * @param keywords 关键词列表
   * @returns 去重后的关键词列表
   */
  private deduplicateKeywords(keywords: ExpandedKeyword[]): ExpandedKeyword[] {
    const seen = new Set<string>();
    const result: ExpandedKeyword[] = [];

    for (const kw of keywords) {
      const normalized = kw.keyword.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(kw);
      }
    }

    return result;
  }

  /**
   * 查找相似规则
   * @param keyword 关键词
   * @param rules 规则库
   * @returns 匹配的关键词列表
   */
  private findSimilarRules(keyword: string, rules: Record<string, string[]>): string[] {
    const results: string[] = [];
    
    for (const [key, values] of Object.entries(rules)) {
      if (keyword.includes(key) || key.includes(keyword)) {
        results.push(...values);
      }
    }
    
    return results;
  }
}

// 导出单例
export const keywordExpander = new KeywordExpander();
