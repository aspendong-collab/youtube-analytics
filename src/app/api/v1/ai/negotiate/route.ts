// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai';

// POST /api/v1/ai/negotiate - AI 协助谈判
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { negotiationId, negotiationContext, messageHistory } = body;

    if (!negotiationId || !negotiationContext) {
      return NextResponse.json({
        success: false,
        error: 'negotiationId and negotiationContext are required',
      }, { status: 400 });
    }

    const aiService = AIService.getInstance();
    
    // 构建提示词
    let prompt = `Negotiation Context: ${JSON.stringify(negotiationContext)}`;
    
    if (messageHistory && messageHistory.length > 0) {
      prompt += `\n\nMessage History:\n${messageHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;
    }
    
    prompt += '\n\nPlease provide a strategic response suggestion for this negotiation.';
    
    const systemPrompt = 'You are an expert in business negotiation and communication. Provide strategic, professional, and effective negotiation responses that help achieve win-win outcomes.';

    const suggestion = await aiService.generateText(prompt, {
      systemPrompt,
    });

    return NextResponse.json({
      success: true,
      data: suggestion,
    });
  } catch (error: any) {
    console.error('[AI/Negotiate] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to assist negotiation',
    }, { status: 500 });
  }
}
