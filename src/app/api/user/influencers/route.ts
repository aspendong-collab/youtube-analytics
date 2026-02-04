import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/storage/database/db';
import { userInfluencers, aiInfluencers } from '@/storage/database/influencer-schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/user/influencers
 * 获取用户达人列表（收藏的达人）
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const listName = searchParams.get('listName') || 'default';
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [
      eq(userInfluencers.userId, userId),
      eq(userInfluencers.listName, listName),
    ];

    if (status) {
      conditions.push(eq(userInfluencers.status, status));
    }

    // 获取用户达人记录
    const userInfluencerList = await db
      .select({
        userInfluencerId: userInfluencers.id,
        influencerId: userInfluencers.influencerId,
        channelId: userInfluencers.channelId,
        listName: userInfluencers.listName,
        status: userInfluencers.status,
        priority: userInfluencers.priority,
        note: userInfluencers.note,
        tags: userInfluencers.tags,
        lastContactedAt: userInfluencers.lastContactedAt,
        cooperationCount: userInfluencers.cooperationCount,
        createdAt: userInfluencers.createdAt,
        updatedAt: userInfluencers.updatedAt,
      })
      .from(userInfluencers)
      .where(and(...conditions))
      .orderBy(desc(userInfluencers.createdAt))
      .limit(limit)
      .offset(offset);

    if (userInfluencerList.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          influencers: [],
          total: 0,
          page,
          limit,
        },
      });
    }

    // 获取达人详细信息
    const channelIds = userInfluencerList.map(ui => ui.channelId);

    // 构建动态 OR 条件
    const orConditions = channelIds.map(channelId =>
      eq(aiInfluencers.channelId, channelId)
    );

    const influencersData = await db
      .select()
      .from(aiInfluencers)
      .where(or(...orConditions));

    const influencersMap = new Map(influencersData.map(inf => [inf.channelId, inf]));

    // 合并数据
    const merged = userInfluencerList.map(ui => ({
      ...ui,
      influencer: influencersMap.get(ui.channelId),
    }));

    // 获取总数
    const totalResult = await db
      .select({ count: userInfluencers.id })
      .from(userInfluencers)
      .where(and(...conditions));

    const total = totalResult.length;

    return NextResponse.json({
      success: true,
      data: {
        influencers: merged,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Get user influencers error:', error);
    return NextResponse.json(
      { error: 'Failed to get user influencers', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/influencers
 * 添加达人到用户列表
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channelId, influencerId, listName, note, tags } = body;

    if (!channelId || !influencerId) {
      return NextResponse.json(
        { error: 'Missing required fields: channelId and influencerId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // 检查是否已添加
    const existing = await db
      .select()
      .from(userInfluencers)
      .where(
        and(
          eq(userInfluencers.userId, userId),
          eq(userInfluencers.channelId, channelId),
          eq(userInfluencers.listName, listName || 'default')
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Influencer already added to list' },
        { status: 400 }
      );
    }

    // 创建用户达人记录
    const [userInfluencer] = await db
      .insert(userInfluencers)
      .values({
        userId,
        influencerId,
        channelId,
        listName: listName || 'default',
        status: 'added',
        priority: 'medium',
        note,
        tags,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: userInfluencer,
      message: 'Influencer added successfully',
    });
  } catch (error) {
    console.error('Add user influencer error:', error);
    return NextResponse.json(
      { error: 'Failed to add influencer', message: (error as Error).message },
      { status: 500 }
    );
  }
}
