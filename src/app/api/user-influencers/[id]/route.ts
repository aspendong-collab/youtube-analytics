import { NextRequest, NextResponse } from 'next/server';
import { dbInstance } from '@/lib/db';
import { userInfluencers } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * PATCH /api/user-influencers/[id]
 * 更新达人跟进信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const influencerId = params.id;
    const body = await request.json();

    // 检查权限
    const existing = await dbInstance
      .select()
      .from(userInfluencers)
      .where(
        and(
          eq(userInfluencers.id, influencerId),
          eq(userInfluencers.userId, userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      );
    }

    // 更新记录
    const [updated] = await dbInstance
      .update(userInfluencers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(userInfluencers.id, influencerId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[PATCH /api/user-influencers/[id]] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update influencer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user-influencers/[id]
 * 从用户的列表中删除达人
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const influencerId = params.id;

    // 检查权限
    const existing = await dbInstance
      .select()
      .from(userInfluencers)
      .where(
        and(
          eq(userInfluencers.id, influencerId),
          eq(userInfluencers.userId, userId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      );
    }

    // 删除记录
    await dbInstance
      .delete(userInfluencers)
      .where(eq(userInfluencers.id, influencerId));

    return NextResponse.json({
      success: true,
      message: 'Influencer removed successfully',
    });
  } catch (error) {
    console.error('[DELETE /api/user-influencers/[id]] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove influencer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
