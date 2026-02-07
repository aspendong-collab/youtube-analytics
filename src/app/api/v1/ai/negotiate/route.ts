// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { aiNegotiationService } from '@/services/ai/ai-negotiation';

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

    const suggestion = await aiNegotiationService.assistNegotiation({
      negotiationId,
      negotiationContext,
      messageHistory,
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
