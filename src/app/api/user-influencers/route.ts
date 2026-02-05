import { NextRequest, NextResponse } from 'next/server';
import { dbInstance } from '@/lib/db';
import { userInfluencers, influencers } from '@/storage/database/shared/schema';
import { eq, and, desc, asc, ilike, or, count } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/user-influencers
 * 获取当前用户的达人列表
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const isFavorite = searchParams.get('isFavorite');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [eq(userInfluencers.userId, userId)];

    if (status) {
      conditions.push(eq(userInfluencers.status, status));
    }

    if (priority) {
      conditions.push(eq(userInfluencers.priority, priority));
    }

    if (isFavorite === 'true') {
      conditions.push(eq(userInfluencers.isFavorite, true));
    }

    if (search) {
      conditions.push(
        or(
          ilike(influencers.channelTitle, `%${search}%`),
          ilike(userInfluencers.notes, `%${search}%`)
        )
      );
    }

    // 构建排序
    let orderBy;
    const orderField = sortOrder === 'asc' ? asc : desc;

    switch (sortBy) {
      case 'createdAt':
        orderBy = orderField(userInfluencers.createdAt);
        break;
      case 'updatedAt':
        orderBy = orderField(userInfluencers.updatedAt);
        break;
      case 'priority':
        orderBy = desc(userInfluencers.priority); // high, medium, low
        break;
      case 'status':
        orderBy = orderField(userInfluencers.status);
        break;
      case 'lastContactDate':
        orderBy = orderField(userInfluencers.lastContactDate);
        break;
      case 'nextFollowUpDate':
        orderBy = orderField(userInfluencers.nextFollowUpDate);
        break;
      case 'subscriberCount':
        orderBy = orderField(influencers.subscriberCount);
        break;
      case 'totalScore':
        orderBy = orderField(influencers.totalScore);
        break;
      default:
        orderBy = orderField(userInfluencers.createdAt);
    }

    // 查询达人列表
    const [data, totalResult] = await Promise.all([
      dbInstance
        .select({
          id: userInfluencers.id,
          influencerId: userInfluencers.influencerId,
          channelId: userInfluencers.channelId,
          status: userInfluencers.status,
          priority: userInfluencers.priority,
          notes: userInfluencers.notes,
          lastContactDate: userInfluencers.lastContactDate,
          nextFollowUpDate: userInfluencers.nextFollowUpDate,
          contactCount: userInfluencers.contactCount,
          estimatedBudget: userInfluencers.estimatedBudget,
          actualBudget: userInfluencers.actualBudget,
          contractStatus: userInfluencers.contractStatus,
          cooperationStartDate: userInfluencers.cooperationStartDate,
          cooperationEndDate: userInfluencers.cooperationEndDate,
          cooperationCount: userInfluencers.cooperationCount,
          tags: userInfluencers.tags,
          category: userInfluencers.category,
          isFavorite: userInfluencers.isFavorite,
          createdAt: userInfluencers.createdAt,
          updatedAt: userInfluencers.updatedAt,
          // AI 达人信息
          channelTitle: influencers.channelTitle,
          channelThumbnail: influencers.channelThumbnail,
          subscriberCount: influencers.subscriberCount,
          viewCount: influencers.viewCount,
          videoCount: influencers.videoCount,
          engagementRate: influencers.engagementRate,
          totalScore: influencers.totalScore,
          scoreTier: influencers.scoreTier,
          description: influencers.description,
          keywords: influencers.keywords,
        })
        .from(userInfluencers)
        .innerJoin(influencers, eq(userInfluencers.influencerId, influencers.id))
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      dbInstance
        .select({ count: count() })
        .from(userInfluencers)
        .where(and(...conditions))
        .then(result => result[0]?.count || 0),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: totalResult,
        totalPages: Math.ceil(totalResult / limit),
      },
    });
  } catch (error) {
    console.error('[GET /api/user-influencers] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user influencers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user-influencers
 * 添加达人到用户的列表
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

    const userId = session.user.id;
    const body = await request.json();
    const { influencerId, channelId, ...rest } = body;

    if (!influencerId || !channelId) {
      return NextResponse.json(
        { error: 'Missing required fields: influencerId, channelId' },
        { status: 400 }
      );
    }

    // 检查 influencerId 是否对应一个存在的达人
    // 如果不存在，使用 channelId 创建达人记录
    let finalInfluencerId = influencerId;
    let dbInfluencer = await dbInstance
      .select()
      .from(influencers)
      .where(eq(influencers.id, influencerId))
      .limit(1);

    if (dbInfluencer.length === 0) {
      // 达人不存在，尝试通过 channelId 查找
      const byChannelId = await dbInstance
        .select()
        .from(influencers)
        .where(eq(influencers.channelId, channelId))
        .limit(1);

      if (byChannelId.length > 0) {
        // 通过 channelId 找到了达人，使用这个 ID
        finalInfluencerId = byChannelId[0].id;
        dbInfluencer = byChannelId;
        console.log('[POST /api/user-influencers] 找到现有达人:', finalInfluencerId);
      } else {
        // 达人不存在，创建新记录
        console.log('[POST /api/user-influencers] 创建新达人记录:', channelId);
        const [newInfluencer] = await dbInstance
          .insert(influencers)
          .values({
            channelId,
            channelTitle: rest.channelTitle || 'Unknown',
            thumbnail: rest.channelThumbnail || rest.avatar || null,
            subscriberCount: rest.subscriberCount || 0,
            totalVideos: rest.videoCount || 0,
            totalViews: rest.viewCount || 0,
            email: null,
            phone: null,
            wechat: null,
            description: rest.description || null,
            tags: [],
            category: null,
            niche: null,
            level: 'unknown',
            status: 'new',
            isActive: true,
          })
          .returning();

        finalInfluencerId = newInfluencer.id;
        dbInfluencer = [newInfluencer];
        console.log('[POST /api/user-influencers] 新达人已创建:', finalInfluencerId);
      }
    }

    // 检查用户是否已添加该达人
    const existing = await dbInstance
      .select()
      .from(userInfluencers)
      .where(
        and(
          eq(userInfluencers.userId, userId),
          eq(userInfluencers.influencerId, finalInfluencerId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Influencer already exists in your list' },
        { status: 409 }
      );
    }

    // 创建用户达人关联记录
    const [newRecord] = await dbInstance
      .insert(userInfluencers)
      .values({
        userId,
        influencerId: finalInfluencerId,
        channelId,
        ...rest,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newRecord,
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/user-influencers] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to add influencer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
