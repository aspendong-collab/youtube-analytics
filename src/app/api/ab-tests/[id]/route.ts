import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database';
import { abTests, abTestVariants } from '@/storage/database/shared/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

// GET - 获取单个 A/B 测试详情
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const test = await db.query.abTests.findFirst({
      where: eq(abTests.id, params.id),
      with: {
        variants: {
          orderBy: [desc(abTestVariants.createdAt)],
        },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: 'A/B test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ test });
  } catch (error) {
    console.error('Failed to fetch A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch A/B test' },
      { status: 500 }
    );
  }
}

// DELETE - 删除 A/B 测试
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 删除测试（由于外键约束，相关的变体和结果也会被删除）
    await db.delete(abTests).where(eq(abTests.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to delete A/B test' },
      { status: 500 }
    );
  }
}
