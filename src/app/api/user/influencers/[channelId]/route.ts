import { NextRequest, NextResponse } from 'next/server';
import { dbInstance } from '@/lib/db';
import { userInfluencers } from '@/storage/database/shared/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * DELETE /api/user/influencers/:channelId
 * 从用户列表中移除达人
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
    const { searchParams } = new URL(request.url);
    const listName = searchParams.get('listName') || 'default';
    const userId = session.user.id;

    // 删除用户达人记录
    const result = await dbInstance
      .delete(userInfluencers)
      .where(
        and(
          eq(userInfluencers.userId, userId),
          eq(userInfluencers.channelId, channelId),
          eq(userInfluencers.listName, listName)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User influencer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Influencer removed successfully',
    });
  } catch (error) {
    console.error('Delete user influencer error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user influencer', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/influencers/:channelId
 * 更新用户达人信息
 */
export async function PATCH(
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
    const body = await request.json();

    // 构建更新数据
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.note !== undefined) updateData.note = body.note;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.lastContactedAt !== undefined) updateData.lastContactedAt = body.lastContactedAt;
    if (body.cooperationCount !== undefined) updateData.cooperationCount = body.cooperationCount;

    // 更新用户达人记录
    const result = await dbInstance
      .update(userInfluencers)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userInfluencers.userId, userId),
          eq(userInfluencers.channelId, channelId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User influencer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Update user influencer error:', error);
    return NextResponse.json(
      { error: 'Failed to update user influencer', message: (error as Error).message },
      { status: 500 }
    );
  }
}
