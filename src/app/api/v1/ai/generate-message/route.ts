// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { aiMessageService } from '@/services/ai/ai-message';

// POST /api/v1/ai/generate-message - AI 生成消息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template, context } = body;

    if (!template) {
      return NextResponse.json({
        success: false,
        error: 'Template is required',
      }, { status: 400 });
    }

    const message = await aiMessageService.generateMessage({
      template,
      context,
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error: any) {
    console.error('[AI/GenerateMessage] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate message',
    }, { status: 500 });
  }
}
