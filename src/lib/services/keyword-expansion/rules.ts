import { KeywordRule, KeywordDimension, ExpansionResult } from './types';

// 规则库：多维度关键词拓展规则
export const EXPANSION_RULES: Record<KeywordDimension, KeywordRule[]> = {
  // 场景维度
  scenario: [
    {
      id: 'scenario-1',
      name: '使用场景-前缀',
      description: '在关键词前添加场景描述',
      dimension: 'scenario',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}怎么用',
        '{keyword}使用方法',
        '{keyword}使用教程',
        '{keyword}使用技巧',
        '如何使用{keyword}',
        '{keyword}怎么用最好',
        '{keyword}使用指南',
        '{keyword}使用步骤',
        '{keyword}使用场景',
        '{keyword}常见用法',
        '{keyword}实用技巧',
        '{keyword}正确使用方法',
        '{keyword}进阶用法',
        '{keyword}高级用法',
        '{keyword}专业用法',
        '{keyword}初学者怎么用',
        '{keyword}入门用法',
        '{keyword}快捷用法',
        '{keyword}日常用法',
        '{keyword}特别用法',
        '{keyword}正确姿势',
        '{keyword}使用流程',
        '{keyword}上手指南',
        '{keyword}实战用法',
      ],
      priority: 1,
    },
    {
      id: 'scenario-2',
      name: '使用场景-后缀',
      description: '在关键词后添加场景描述',
      dimension: 'scenario',
      patterns: ['{keyword}'],
      templates: [
        '新手用{keyword}',
        '老手用{keyword}',
        '小白用{keyword}',
        '专业用{keyword}',
        '日常用{keyword}',
        '办公用{keyword}',
        '家用{keyword}',
        '学生用{keyword}',
        '商务用{keyword}',
        '旅行用{keyword}',
        '户外用{keyword}',
        '室内用{keyword}',
        '公司用{keyword}',
        '家庭用{keyword}',
        '个人用{keyword}',
        '团队用{keyword}',
        '校园用{keyword}',
        '游戏用{keyword}',
        '设计用{keyword}',
        '剪辑用{keyword}',
        '开发用{keyword}',
        '运营用{keyword}',
      ],
      priority: 2,
    },
    {
      id: 'scenario-3',
      name: '特定场景',
      description: '针对特定使用场景',
      dimension: 'scenario',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}开车时',
        '{keyword}开会时',
        '{keyword}做饭时',
        '{keyword}运动时',
        '{keyword}学习时',
        '{keyword}工作用',
        '{keyword}娱乐用',
        '{keyword}睡觉前',
        '{keyword}早起用',
        '{keyword}通勤用',
        '{keyword}约会用',
        '{keyword}聚会用',
        '{keyword}健身时',
        '{keyword}带娃用',
        '{keyword}赶路用',
        '{keyword}周末用',
        '{keyword}下班用',
        '{keyword}考试前',
        '{keyword}面试前',
        '{keyword}旅行前',
        '{keyword}出国用',
      ],
      priority: 3,
    },
  ],

  // 载体维度
  carrier: [
    {
      id: 'carrier-1',
      name: '设备载体',
      description: '关键词使用的设备载体',
      dimension: 'carrier',
      patterns: ['{keyword}'],
      templates: [
        '手机{keyword}',
        '电脑{keyword}',
        '平板{keyword}',
        '笔记本{keyword}',
        '台式机{keyword}',
        'iPhone{keyword}',
        '安卓{keyword}',
        'iPad{keyword}',
        'Mac{keyword}',
        'Windows{keyword}',
        '安卓手机{keyword}',
        '华为手机{keyword}',
        '小米手机{keyword}',
        'OPPO手机{keyword}',
        'vivo手机{keyword}',
        '三星手机{keyword}',
        'Surface{keyword}',
        'Chromebook{keyword}',
        '台式电脑{keyword}',
        '一体机{keyword}',
        '掌机{keyword}',
        '游戏机{keyword}',
      ],
      priority: 1,
    },
    {
      id: 'carrier-2',
      name: '平台载体',
      description: '关键词使用的平台载体',
      dimension: 'carrier',
      patterns: ['{keyword}'],
      templates: [
        '微信{keyword}',
        '抖音{keyword}',
        '快手{keyword}',
        '小红书{keyword}',
        'B站{keyword}',
        '知乎{keyword}',
        '微博{keyword}',
        '头条{keyword}',
        '淘宝{keyword}',
        '京东{keyword}',
        '拼多多{keyword}',
        '支付宝{keyword}',
        '拼多多{keyword}',
        '美团{keyword}',
        '大众点评{keyword}',
        '腾讯视频{keyword}',
        '爱奇艺{keyword}',
        '优酷{keyword}',
        '哔哩哔哩{keyword}',
        '喜马拉雅{keyword}',
        '网易云音乐{keyword}',
        '酷狗音乐{keyword}',
      ],
      priority: 2,
    },
    {
      id: 'carrier-3',
      name: '系统载体',
      description: '关键词使用的操作系统载体',
      dimension: 'carrier',
      patterns: ['{keyword}'],
      templates: [
        'iOS{keyword}',
        'Android{keyword}',
        'Windows{keyword}',
        'MacOS{keyword}',
        'Linux{keyword}',
        '鸿蒙{keyword}',
        '鸿蒙系统{keyword}',
        '安卓系统{keyword}',
        '苹果系统{keyword}',
        'Windows系统{keyword}',
        'iOS系统{keyword}',
        'iPadOS{keyword}',
        'ChromeOS{keyword}',
        'Ubuntu{keyword}',
        'CentOS{keyword}',
        'Debian{keyword}',
        'Kali{keyword}',
        'Manjaro{keyword}',
        'Arch Linux{keyword}',
        'Windows 11{keyword}',
        'Windows 10{keyword}',
      ],
      priority: 3,
    },
  ],

  // 状态维度
  state: [
    {
      id: 'state-1',
      name: '状态-前缀',
      description: '在关键词前添加状态描述',
      dimension: 'state',
      patterns: ['{keyword}'],
      templates: [
        '免费的{keyword}',
        '付费的{keyword}',
        '最新{keyword}',
        '热门{keyword}',
        '好用{keyword}',
        '推荐{keyword}',
        '高级{keyword}',
        '专业{keyword}',
        '入门{keyword}',
        '基础{keyword}',
        '进阶{keyword}',
        '简单{keyword}',
        '复杂{keyword}',
        '快速{keyword}',
        '慢速{keyword}',
        '永久免费{keyword}',
        '官方{keyword}',
        '正版{keyword}',
        '破解版{keyword}',
        '绿色版{keyword}',
        '便携版{keyword}',
        '安装版{keyword}',
      ],
      priority: 1,
    },
    {
      id: 'state-2',
      name: '状态-后缀',
      description: '在关键词后添加状态描述',
      dimension: 'state',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}推荐',
        '{keyword}排行',
        '{keyword}排名',
        '{keyword}对比',
        '{keyword}测评',
        '{keyword}评价',
        '{keyword}评测',
        '{keyword}体验',
        '{keyword}效果',
        '{keyword}怎么样',
        '{keyword}好用吗',
        '{keyword}值得买吗',
        '{keyword}怎么选',
        '{keyword}选哪个好',
        '{keyword}哪个牌子好',
        '{keyword}性价比',
        '{keyword}优惠',
        '{keyword}折扣',
        '{keyword}促销',
        '{keyword}活动',
        '{keyword}特价',
        '{keyword}免费版',
        '{keyword}会员版',
      ],
      priority: 2,
    },
    {
      id: 'state-3',
      name: '状态描述',
      description: '描述关键词的状态特征',
      dimension: 'state',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}好不好用',
        '{keyword}有没有用',
        '{keyword}是不是真的',
        '{keyword}靠谱吗',
        '{keyword}有效果吗',
        '{keyword}多久见效',
        '{keyword}有没有副作用',
        '{keyword}安全吗',
        '{keyword}合法吗',
        '{keyword}正规吗',
        '{keyword}真伪辨别',
        '{keyword}避坑指南',
        '{keyword}常见陷阱',
        '{keyword}坑不坑',
        '{keyword}靠谱吗',
        '{keyword}值不值',
        '{keyword}有必要吗',
        '{keyword}实用吗',
        '{keyword}高效吗',
        '{keyword}稳定吗',
        '{keyword}兼容性',
        '{keyword}兼容吗',
      ],
      priority: 3,
    },
  ],

  // 目标维度
  goal: [
    {
      id: 'goal-1',
      name: '学习目标',
      description: '用户学习的目标',
      dimension: 'goal',
      patterns: ['{keyword}'],
      templates: [
        '学习{keyword}',
        '学会{keyword}',
        '掌握{keyword}',
        '{keyword}入门',
        '{keyword}基础',
        '{keyword}从零开始',
        '{keyword}新手教程',
        '{keyword}自学',
        '如何学习{keyword}',
        '{keyword}怎么学',
        '{keyword}速成',
        '{keyword}快速入门',
        '{keyword}系统学习',
        '{keyword}深度学习',
        '{keyword}进阶学习',
        '{keyword}高级教程',
        '{keyword}精通',
        '{keyword}大神',
        '{keyword}学习路线',
        '{keyword}学习计划',
        '{keyword}学习资料',
        '{keyword}学习资源',
      ],
      priority: 1,
    },
    {
      id: 'goal-2',
      name: '使用目标',
      description: '用户的使用目标',
      dimension: 'goal',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}赚钱',
        '{keyword}赚钱方法',
        '{keyword}变现',
        '{keyword}副业',
        '{keyword}兼职',
        '用{keyword}赚钱',
        '{keyword}创业',
        '{keyword}就业',
        '{keyword}求职',
        '{keyword}面试',
        '{keyword}职业发展',
        '{keyword}职业规划',
        '{keyword}职业前景',
        '{keyword}转行',
        '{keyword}跳槽',
        '{keyword}升职加薪',
        '{keyword}涨工资',
        '{keyword}自由职业',
        '{keyword}远程工作',
        '{keyword}被动收入',
        '{keyword}睡后收入',
        '{keyword}搞钱',
      ],
      priority: 2,
    },
    {
      id: 'goal-3',
      name: '解决问题目标',
      description: '用户解决特定问题的目标',
      dimension: 'goal',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}解决什么问题',
        '{keyword}能做什么',
        '{keyword}有什么用',
        '{keyword}能解决什么',
        '{keyword}的作用',
        '{keyword}的好处',
        '{keyword}的优点',
        '{keyword}缺点',
        '{keyword}避坑',
        '{keyword}注意事项',
        '{keyword}常见问题',
        '{keyword}适用人群',
        '{keyword}适合谁',
        '{keyword}能帮你做什么',
        '{keyword}主要功能',
        '{keyword}核心功能',
        '{keyword}实际应用',
        '{keyword}典型案例',
        '{keyword}成功案例',
        '{keyword}失败案例',
        '{keyword}优缺点对比',
        '{keyword}弊端',
      ],
      priority: 3,
    },
  ],

  // 方法维度
  method: [
    {
      id: 'method-1',
      name: '学习方法',
      description: '学习某事物的方法',
      dimension: 'method',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}怎么学',
        '怎么学习{keyword}',
        '如何学习{keyword}',
        '{keyword}学习方法',
        '{keyword}学习技巧',
        '{keyword}学习经验',
        '{keyword}学习心得',
        '{keyword}学习步骤',
        '{keyword}学习流程',
        '{keyword}学习路线',
        '{keyword}学习计划',
        '{keyword}学习资源',
        '{keyword}学习材料',
        '{keyword}学习书籍',
        '{keyword}学习视频',
        '{keyword}学习课程',
        '{keyword}笔记',
        '{keyword}思维导图',
        '{keyword}重点',
        '{keyword}难点',
        '{keyword}考试',
        '{keyword}考证',
      ],
      priority: 1,
    },
    {
      id: 'method-2',
      name: '使用方法',
      description: '使用某事物的方法',
      dimension: 'method',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}怎么用',
        '怎么使用{keyword}',
        '如何使用{keyword}',
        '{keyword}使用方法',
        '{keyword}使用技巧',
        '{keyword}使用心得',
        '{keyword}使用经验',
        '{keyword}操作方法',
        '{keyword}操作步骤',
        '{keyword}操作流程',
        '{keyword}使用教程',
        '{keyword}教学视频',
        '{keyword}演示视频',
        '{keyword}实战教程',
        '{keyword}入门教程',
        '{keyword}进阶教程',
        '{keyword}操作指南',
        '{keyword}快速上手',
        '{keyword}配置教程',
        '{keyword}安装教程',
        '{keyword}卸载教程',
      ],
      priority: 2,
    },
    {
      id: 'method-3',
      name: '实现方法',
      description: '实现某目标的方法',
      dimension: 'method',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}怎么做',
        '怎么做{keyword}',
        '{keyword}制作方法',
        '{keyword}制作教程',
        '{keyword}制作流程',
        '{keyword}制作步骤',
        '{keyword}实现方法',
        '{keyword}实现教程',
        '{keyword}实现步骤',
        '{keyword}搭建教程',
        '{keyword}搭建方法',
        '{keyword}部署教程',
        '{keyword}开发教程',
        '{keyword}开发方法',
        '{keyword}开发步骤',
        '{keyword}配置方法',
        '{keyword}集成教程',
        '{keyword}连接教程',
        '{keyword}配置步骤',
        '{keyword}部署步骤',
        '{keyword}上线教程',
        '{keyword}发布教程',
      ],
      priority: 3,
    },
    {
      id: 'method-4',
      name: '优化方法',
      description: '优化某事物的方法',
      dimension: 'method',
      patterns: ['{keyword}'],
      templates: [
        '{keyword}优化',
        '{keyword}优化方法',
        '{keyword}优化技巧',
        '{keyword}优化方案',
        '{keyword}优化策略',
        '{keyword}提升',
        '{keyword}提升方法',
        '{keyword}提升技巧',
        '{keyword}改进',
        '{keyword}改进方法',
        '{keyword}改进建议',
        '{keyword}升级',
        '{keyword}升级教程',
        '{keyword}更新教程',
        '{keyword}加速',
        '{keyword}加速方法',
        '{keyword}提速',
        '{keyword}提速技巧',
        '{keyword}调优',
        '{keyword}调优教程',
        '{keyword}性能优化',
        '{keyword}效果优化',
        '{keyword}方案优化',
      ],
      priority: 4,
    },
  ],
};

// 规则引擎：基于规则库生成关键词
export class RuleEngine {
  private rules: Record<KeywordDimension, KeywordRule[]> = EXPANSION_RULES;

  // 应用规则生成关键词
  applyRules(keyword: string, dimension: KeywordDimension): ExpansionResult[] {
    const dimensionRules = this.rules[dimension] || [];
    const results: ExpansionResult[] = [];

    for (const rule of dimensionRules) {
      for (const template of rule.templates) {
        const generatedKeyword = template.replace(/{keyword}/g, keyword);
        results.push({
          keyword: generatedKeyword,
          dimension,
          source: 'rule',
          relevance: this.calculateRelevance(keyword, generatedKeyword),
          type: this.detectKeywordType(generatedKeyword),
          intent: this.detectKeywordIntent(generatedKeyword),
        });
      }
    }

    return results;
  }

  // 应用所有维度的规则
  applyAllRules(keyword: string): Record<KeywordDimension, ExpansionResult[]> {
    const dimensions: KeywordDimension[] = ['scenario', 'carrier', 'state', 'goal', 'method'];
    const results: Record<KeywordDimension, ExpansionResult[]> = {} as any;

    for (const dimension of dimensions) {
      results[dimension] = this.applyRules(keyword, dimension);
    }

    return results;
  }

  // 计算相关性（基于关键词相似度）
  private calculateRelevance(original: string, generated: string): number {
    const similarity = this.calculateSimilarity(original, generated);
    // 添加额外因子：包含原始词的得分更高
    const containsOriginal = generated.includes(original) ? 0.9 : 0.7;
    return (similarity * 0.3 + containsOriginal * 0.7);
  }

  // 计算字符串相似度
  private calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1);
    const set2 = new Set(str2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  // 检测关键词类型
  private detectKeywordType(keyword: string): 'broad' | 'long-tail' | 'question' | 'brand' {
    if (keyword.includes('？') || keyword.includes('?') || keyword.includes('怎么') || keyword.includes('如何')) {
      return 'question';
    }
    if (keyword.split(/\s+/).length > 3) {
      return 'long-tail';
    }
    return 'broad';
  }

  // 检测搜索意图
  private detectKeywordIntent(keyword: string): 'info' | 'tutorial' | 'review' | 'transaction' {
    if (keyword.includes('教程') || keyword.includes('学习') || keyword.includes('方法') || keyword.includes('技巧')) {
      return 'tutorial';
    }
    if (keyword.includes('评价') || keyword.includes('测评') || keyword.includes('推荐') || keyword.includes('排行')) {
      return 'review';
    }
    if (keyword.includes('买') || keyword.includes('购买') || keyword.includes('价格') || keyword.includes('多少钱')) {
      return 'transaction';
    }
    return 'info';
  }
}

export const ruleEngine = new RuleEngine();
