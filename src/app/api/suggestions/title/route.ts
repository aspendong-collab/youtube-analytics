import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getCategoryName } from '@/lib/youtube-categories';

// 设置为动态路由
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category } = body;

    if (!title) {
      return NextResponse.json(
        { error: '缺少标题参数' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

    const categoryName = getCategoryName(category);

    const prompt = `作为YouTube标题优化专家，请分析以下标题并提供改进建议：

标题：${title}
分类：${categoryName}

请从以下维度分析：
1. 关键词覆盖度（是否包含核心搜索词）
2. 吸引力评分（1-10分）
3. 标题长度合理性
4. 是否符合该分类的最佳实践

请提供JSON格式的回复，结构如下：
{
  "score": 数字(1-10),
  "keywordCoverage": "关键词覆盖度评估",
  "lengthAnalysis": "标题长度分析",
  "suggestions": ["建议1", "建议2", "建议3", "建议4"],
  "optimizationReasons": ["理由1", "理由2"]
}`;

    const messages = [
      { role: 'user' as const, content: prompt }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
    });

    // 尝试解析JSON响应
    let result;
    try {
      // 提取JSON部分（处理可能的markdown代码块）
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // 如果解析失败，创建默认响应
        result = {
          score: 7,
          keywordCoverage: '无法自动分析',
          lengthAnalysis: title.length > 60 ? '标题偏长' : title.length < 20 ? '标题偏短' : '长度适中',
          suggestions: [
            '添加更多相关关键词',
            '使用数字或疑问句提高点击率',
            '突出视频核心价值',
            '保持简洁明了'
          ],
          optimizationReasons: ['基于通用优化建议']
        };
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      // 返回默认建议
      result = {
        score: 7,
        keywordCoverage: '无法自动分析',
        lengthAnalysis: title.length > 60 ? '标题偏长' : title.length < 20 ? '标题偏短' : '长度适中',
        suggestions: [
          '添加更多相关关键词',
          '使用数字或疑问句提高点击率',
          '突出视频核心价值',
          '保持简洁明了'
        ],
        optimizationReasons: ['基于通用优化建议']
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API /api/suggestions/title] 错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
