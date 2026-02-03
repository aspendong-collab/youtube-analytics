import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 配置 LLM 客户端
const config = new Config();
const client = new LLMClient(config);

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Invalid title parameter' },
        { status: 400 }
      );
    }

    // 构建系统提示词
    const systemPrompt = `你是一个专业的 YouTube 视频标题优化专家。你的任务是基于用户提供的原始标题，生成5个优化后的标题建议。

优化原则：
1. 标题应该吸引用户点击
2. 包含关键词以提升SEO效果
3. 使用数字和表情符号可以增加点击率
4. 长度控制在20-60个字符之间
5. 避免标题党，保持内容真实性

请以JSON格式返回结果，格式如下：
{
  "suggestions": [
    {
      "title": "优化后的标题1",
      "score": 95,
      "reasons": ["优化原因1", "优化原因2", "优化原因3"]
    },
    ...
  ]
}

score字段是对标题质量的评分（0-100），reasons字段是优化原因列表。`;

    // 构建用户消息
    const userMessage = `请为以下YouTube视频标题生成5个优化建议：${title}`;

    // 调用 LLM
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.8,
      model: 'doubao-seed-1-8-251228',
    });

    // 解析 AI 响应
    let aiResponse;
    try {
      // 尝试提取 JSON 部分
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // 如果解析失败，返回默认响应
      aiResponse = {
        suggestions: [
          {
            title: `${title} - 完整教程`,
            score: 85,
            reasons: ['添加教程属性', '增加专业感'],
          },
        ],
      };
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Title optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize title' },
      { status: 500 }
    );
  }
}
