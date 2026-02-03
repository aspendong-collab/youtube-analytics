import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 配置 LLM 客户端
const config = new Config();
const client = new LLMClient(config);

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    if ((!title && !description) || typeof title !== 'string' || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // 构建系统提示词
    const systemPrompt = `你是一个专业的 YouTube 视频标签优化专家。你的任务是基于视频标题和描述，生成相关的标签建议。

标签分类：
1. 核心标签 (primary): 直接描述视频主题的关键词
2. 次要标签 (secondary): 相关的扩展关键词
3. 长尾标签 (long-tail): 具体的细分领域关键词

请以JSON格式返回结果，格式如下：
{
  "suggestions": [
    {
      "tag": "标签名",
      "category": "primary|secondary|long-tail"
    },
    ...
  ]
}

请生成15-20个标签建议，确保：
1. 包含核心关键词
2. 覆盖相关主题
3. 包含一些长尾关键词
4. 标签与视频内容高度相关`;

    // 构建用户消息
    const content = [];
    if (title) content.push(`标题: ${title}`);
    if (description) content.push(`描述: ${description}`);

    const userMessage = `请为以下视频生成标签建议：\n${content.join('\n')}`;

    // 调用 LLM
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userMessage },
    ];

    const response = await client.invoke(messages, {
      temperature: 0.7,
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
          { tag: '教程', category: 'primary' },
          { tag: '学习', category: 'secondary' },
        ],
      };
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Tag optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tags' },
      { status: 500 }
    );
  }
}
