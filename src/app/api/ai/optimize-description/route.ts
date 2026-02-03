import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 配置 LLM 客户端
const config = new Config();
const client = new LLMClient(config);

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { title, description } = await req.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Invalid title parameter' },
        { status: 400 }
      );
    }

    // 构建系统提示词
    const systemPrompt = `你是一个专业的 YouTube 视频描述优化专家。你的任务是基于视频标题和原始描述，生成3个优化后的描述建议。

优化原则：
1. 开头包含核心吸引点
2. 清晰的视频内容介绍
3. 包含时间戳（如果是教程类视频）
4. 添加相关资源链接
5. 鼓励用户互动（点赞、订阅、评论）
6. 包含相关关键词以提升SEO
7. 使用合适的表情符号增加可读性
8. 结构清晰，分段明确

请以JSON格式返回结果，格式如下：
{
  "suggestions": [
    {
      "description": "完整的优化描述内容",
      "score": 95,
      "highlights": ["亮点1", "亮点2", "亮点3"]
    },
    ...
  ]
}

score字段是对描述质量的评分（0-100），highlights字段是描述的亮点列表。`;

    // 构建用户消息
    let userMessage = `请为以下视频生成优化后的描述建议：\n\n标题: ${title}`;
    if (description) {
      userMessage += `\n原始描述: ${description}`;
    }

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
            description: `【${title}】\n\n${description || '精彩内容等你来发现！'}\n\n🔔 订阅频道，获取更多精彩内容！\n👍 觉得有用请点赞关注`,
            score: 80,
            highlights: ['结构清晰', '引导互动'],
          },
        ],
      };
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Description optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize description' },
      { status: 500 }
    );
  }
}
