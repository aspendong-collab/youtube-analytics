import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';
import { userFavorites } from '@/storage/database/influencer-schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * DELETE /api/user/favorites/:channelId
 * 取消收藏达人
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { channelId } = await params;
    const userId = session.user.id;

    // 删除收藏记录
    const result = await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.channelId, channelId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Favorite removed successfully',
    });
  } catch (error) {
    console.error('Delete favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to delete favorite', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/favorites/:channelId
 * 检查达人是否已收藏
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { channelId } = await params;
    const userId = session.user.id;

    // 检查收藏记录
    const result = await db
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.channelId, channelId)
        )
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      isFavorited: result.length > 0,
      data: result[0] || null,
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite', message: (error as Error).message },
      { status: 500 }
    );
  }
}
