import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database';
import { abTests, abTestVariants, abTestResults } from '@/storage/database/shared/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

// GET - 获取所有 A/B 测试
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = db.select().from(abTests).orderBy(desc(abTests.createdAt));

    if (status) {
      query = query.where(eq(abTests.status, status as any));
    }

    const tests = await query;

    return NextResponse.json({ tests });
  } catch (error) {
    console.error('Failed to fetch A/B tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch A/B tests' },
      { status: 500 }
    );
  }
}

// POST - 创建新的 A/B 测试
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, videoId, userId, variants } = body;

    if (!name || !type || !userId || !variants || variants.length < 2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 创建 A/B 测试
    const testId = crypto.randomUUID();
    await db.insert(abTests).values({
      id: testId,
      name,
      type,
      videoId,
      userId,
      status: 'draft',
    });

    // 创建变体
    for (const variant of variants) {
      const variantId = crypto.randomUUID();
      await db.insert(abTestVariants).values({
        id: variantId,
        testId,
        variantName: variant.variantName,
        title: variant.title,
        description: variant.description,
        thumbnail: variant.thumbnail,
      });
    }

    // 获取创建的测试和变体
    const test = await db.query.abTests.findFirst({
      where: eq(abTests.id, testId),
      with: {
        variants: true,
      },
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error('Failed to create A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    );
  }
}

// PUT - 更新 A/B 测试状态
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { testId, status, winnerVariantId, confidence } = body;

    if (!testId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 更新测试状态
    await db.update(abTests).set({
      status,
      winnerVariantId,
      confidence,
      updatedAt: new Date(),
    }).where(eq(abTests.id, testId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to update A/B test' },
      { status: 500 }
    );
  }
}
