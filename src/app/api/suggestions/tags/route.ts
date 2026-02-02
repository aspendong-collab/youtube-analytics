import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getCategoryName } from '@/lib/youtube-categories';

// 设置为动态路由
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category } = body;

    if (!title) {
      return NextResponse.json(
        { error: '缺少标题参数' },
        { status: 400 }
      );
    }

    const config = new Config();
    const client = new LLMClient(config);

    const categoryName = getCategoryName(category);

    const prompt = `作为YouTube SEO专家，请为以下视频生成优化标签：

标题：${title}
描述：${description || '无'}
分类：${categoryName}

请生成10-15个标签，包括：
1. 核心关键词（3-5个）
2. 长尾关键词（3-5个）
3. 相关主题标签（2-3个）
4. 竞品标签（2-3个）

请提供JSON格式的回复，结构如下：
{
  "coreKeywords": [
    {"tag": "标签名", "searchVolume": "高/中/低", "reason": "选择理由"}
  ],
  "longTailKeywords": [
    {"tag": "标签名", "searchVolume": "高/中/低", "reason": "选择理由"}
  ],
  "relatedTopics": [
    {"tag": "标签名", "searchVolume": "高/中/低", "reason": "选择理由"}
  ],
  "competitorKeywords": [
    {"tag": "标签名", "searchVolume": "高/中/低", "reason": "选择理由"}
  ],
  "allTags": ["标签1", "标签2", ...]
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
      const content = response.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // 如果解析失败，创建默认响应
        result = {
          coreKeywords: [
            { tag: title.split(' ')[0] || '视频', searchVolume: '高', reason: '核心关键词' }
          ],
          longTailKeywords: [],
          relatedTopics: [],
          competitorKeywords: [],
          allTags: [title.split(' ')[0] || '视频']
        };
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      result = {
        coreKeywords: [
          { tag: title.split(' ')[0] || '视频', searchVolume: '高', reason: '核心关键词' }
        ],
        longTailKeywords: [],
        relatedTopics: [],
        competitorKeywords: [],
        allTags: [title.split(' ')[0] || '视频']
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API /api/suggestions/tags] 错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
