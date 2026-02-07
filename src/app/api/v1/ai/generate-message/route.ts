// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai';

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

    const aiService = AIService.getInstance();
    
    // 构建提示词
    let prompt = template;
    if (context) {
      prompt += `\n\nContext: ${JSON.stringify(context)}`;
    }
    
    const systemPrompt = 'You are a professional communication assistant. Generate personalized and engaging messages based on the provided template and context.';
    
    const message = await aiService.generateText(prompt, {
      systemPrompt,
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
