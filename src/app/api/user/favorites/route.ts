import { NextRequest, NextResponse } from 'next/server';
import { dbInstance } from '@/lib/db';
import { userFavorites, influencers } from '@/storage/database/shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/user/favorites
 * 获取当前用户的收藏列表
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
    const offset = (page - 1) * limit;

    // 获取收藏记录
    const favorites = await dbInstance
      .select({
        favoriteId: userFavorites.id,
        influencerId: userFavorites.influencerId,
        channelId: userFavorites.channelId,
        note: userFavorites.note,
        tags: userFavorites.tags,
        createdAt: userFavorites.createdAt,
        updatedAt: userFavorites.updatedAt,
      })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    if (favorites.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          favorites: [],
          total: 0,
          page,
          limit,
        },
      });
    }

    // 获取达人详细信息
    const channelIds = favorites.map(f => f.channelId);
    const influencersData = await dbInstance
      .select()
      .from(influencers)
      .where(eq(influencers.channelId, channelIds[0] as any));

    const influencersMap = new Map(influencersData.map(inf => [inf.channelId, inf]));

    // 合并数据
    const merged = favorites.map(fav => ({
      ...fav,
      influencer: influencersMap.get(fav.channelId),
    }));

    // 获取总数
    const totalResult = await dbInstance
      .select({ count: userFavorites.id })
      .from(userFavorites)
      .where(eq(userFavorites.userId, userId));

    const total = totalResult.length;

    return NextResponse.json({
      success: true,
      data: {
        favorites: merged,
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { error: 'Failed to get favorites', message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/favorites
 * 收藏达人
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
    const { channelId, influencerId, note, tags } = body;

    if (!channelId || !influencerId) {
      return NextResponse.json(
        { error: 'Missing required fields: channelId and influencerId' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // 检查是否已收藏
    const existing = await dbInstance
      .select()
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.channelId, channelId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Influencer already favorited' },
        { status: 400 }
      );
    }

    // 创建收藏记录
    const [favorite] = await dbInstance
      .insert(userFavorites)
      .values({
        userId,
        influencerId,
        channelId,
        note,
        tags,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: favorite,
    });
  } catch (error) {
    console.error('Create favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to create favorite', message: (error as Error).message },
      { status: 500 }
    );
  }
}
