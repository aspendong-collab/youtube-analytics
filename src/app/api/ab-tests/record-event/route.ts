import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database';
import { abTestVariants } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

// POST - 记录 A/B 测试变体的展示和点击数据
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, eventType, watchTime } = body;

    if (!variantId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 更新变体数据
    const variant = await db.query.abTestVariants.findFirst({
      where: eq(abTestVariants.id, variantId),
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    switch (eventType) {
      case 'impression':
        updateData.impressions = (variant.impressions || 0) + 1;
        break;
      case 'click':
        updateData.clicks = (variant.clicks || 0) + 1;
        break;
      case 'view':
        updateData.views = (variant.views || 0) + 1;
        if (watchTime) {
          const totalWatchTime = (variant.avgWatchTime || 0) * (variant.views || 0);
          updateData.avgWatchTime = Math.round((totalWatchTime + watchTime) / ((variant.views || 0) + 1));
        }
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid event type' },
          { status: 400 }
        );
    }

    // 重新计算 CTR
    if (updateData.impressions && updateData.clicks) {
      updateData.ctr = parseFloat(
        (updateData.clicks / updateData.impressions).toFixed(4)
      );
    }

    // 重新计算转化率
    if (updateData.clicks && updateData.views) {
      updateData.conversionRate = parseFloat(
        (updateData.views / updateData.clicks).toFixed(4)
      );
    }

    await db.update(abTestVariants)
      .set(updateData)
      .where(eq(abTestVariants.id, variantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record A/B test event:', error);
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    );
  }
}
