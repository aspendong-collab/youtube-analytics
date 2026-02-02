import { NextRequest, NextResponse } from 'next/server';

// 设置为动态路由
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { thumbnailUrl, title, category } = body;

    if (!thumbnailUrl) {
      return NextResponse.json(
        { error: '缺少缩略图URL参数' },
        { status: 400 }
      );
    }

    // 生成模拟的封面分析结果（因为coze-coding-dev-sdk在Next.js RSC环境中有兼容性问题）
    // TODO: 等待SDK修复后启用真实的AI分析
    const result = {
      visualImpact: 7,
      textReadability: 7,
      titleRelevance: 7,
      categoryStyle: 7,
      overallScore: 7,
      improvements: [
        '确保文字清晰可读，使用高对比度配色',
        '添加关键词或吸引眼球的标题文字',
        '使用符合视频内容的高质量图像',
        '保持简洁的设计风格，避免过多元素',
        '考虑添加人物表情以增加情感连接'
      ],
      idealDesign: '使用清晰的标题文字，配合相关的高质量图像，确保色彩协调且对比度足够高。建议使用16:9的宽高比，保持画面简洁，突出核心信息。'
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API /api/suggestions/thumbnail] 错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
