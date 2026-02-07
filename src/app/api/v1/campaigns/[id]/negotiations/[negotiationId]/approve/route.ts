// 强制动态路由
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { dbInstance as db } from '@/lib/db';
import { campaignNegotiationLogs } from '@/storage/database/shared/schema';
import { eq, sql } from 'drizzle-orm';

// POST /api/v1/campaigns/[id]/negotiations/[negotiationId]/approve - 用户确认/拒绝谈判
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; negotiationId: string } }
) {
  try {
    const body = await request.json();
    const { approved, counterOffer, notes } = body;

    const negotiationId = params.negotiationId;

    // 1. 获取谈判记录
    const [negotiation] = await db
      .select()
      .from(campaignNegotiationLogs)
      .where(eq(campaignNegotiationLogs.id, negotiationId))
      .limit(1);

    if (!negotiation) {
      return NextResponse.json({
        success: false,
        error: 'Negotiation not found',
      }, { status: 404 });
    }

    // 2. 更新谈判状态
    if (approved) {
      // 接受报价
      await db
        .update(campaignNegotiationLogs)
        .set({
          status: 'accepted',
          completedAt: new Date(),
        })
        .where(eq(campaignNegotiationLogs.id, negotiationId));

      return NextResponse.json({
        success: true,
        data: {
          negotiationId,
          status: 'accepted',
          finalPrice: negotiation.counterOffer,
          message: 'Negotiation accepted successfully',
        },
      });
    } else {
      // 拒绝或还价
      const messages = JSON.parse(negotiation.messages || '[]');

      if (counterOffer && counterOffer > 0) {
        // 用户还价，继续谈判
        messages.push({
          role: 'user',
          content: `User counter-offer: $${counterOffer}. Notes: ${notes || ''}`,
          timestamp: new Date().toISOString(),
          price: counterOffer,
        });

        await db
          .update(campaignNegotiationLogs)
          .set({
            ourOffer: counterOffer,
            status: 'in_progress',
            messages: JSON.stringify(messages),
          })
          .where(eq(campaignNegotiationLogs.id, negotiationId));

        return NextResponse.json({
          success: true,
          data: {
            negotiationId,
            status: 'countered',
            counterOffer,
            message: 'Counter-offer submitted',
            nextAction: 'Continue negotiation',
          },
        });
      } else {
        // 直接拒绝
        await db
          .update(campaignNegotiationLogs)
          .set({
            status: 'rejected',
            completedAt: new Date(),
          })
          .where(eq(campaignNegotiationLogs.id, negotiationId));

        return NextResponse.json({
          success: true,
          data: {
            negotiationId,
            status: 'rejected',
            message: 'Negotiation rejected',
          },
        });
      }
    }

  } catch (error: any) {
    console.error('[Negotiation/Approve] POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to approve negotiation',
    }, { status: 500 });
  }
}
