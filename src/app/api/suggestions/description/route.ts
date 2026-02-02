import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getCategoryName } from '@/lib/youtube-categories';

// 设置为动态路由
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, description: existingDescription } = body;

    if (!title) {
      return NextResponse.json(
        { error: '缺少标题参数' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

    const categoryName = getCategoryName(category);

    const prompt = `作为YouTube描述文案专家，请为以下视频生成优化描述：

标题：${title}
分类：${categoryName}
现有描述：${existingDescription || '无'}

描述结构要求：
1. 开头2-3句话：吸引观众，突出视频价值
2. 中间部分：详细内容介绍（3-5个要点）
3. 结尾：行动号召（点赞、关注、分享）
4. 关键词自然融入（不堆砌）
5. 相关视频推荐
6. 社交媒体链接（占位符）

请生成约300-500字的优化描述，直接返回描述文本，不要JSON格式。`;

    const messages = [
      { role: 'user' as const, content: prompt }
    ];

    const response = await client.invoke(messages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
    });

    const result = {
      optimizedDescription: response.content.trim(),
      tips: [
        '记得替换社交媒体链接占位符',
        '根据实际内容调整相关视频推荐',
        '可以添加时间戳以提高观看体验',
        '定期更新描述以保持内容新鲜'
      ]
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API /api/suggestions/description] 错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
