import { NextRequest, NextResponse } from "next/server";
import { dbInstance as db } from "@/lib/db";
import { influencers } from "@/storage/database/shared/schema";
import { authOptions } from "@/lib/auth";
import { eq, desc, and, or, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    // 使用 NextAuth 的 getServerSession
    const { getServerSession } = await import("next-auth/next");
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (!session.user) {
      return NextResponse.json({ error: "用户信息不存在" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "all";
    const level = searchParams.get("level") || "all";
    const category = searchParams.get("category") || "all";
    const isFavorite = searchParams.get("favorite");
    const search = searchParams.get("search");

    const conditions = [];

    // 状态过滤
    if (status !== "all") {
      conditions.push(eq(influencers.status, status));
    }

    // 等级过滤
    if (level !== "all") {
      conditions.push(eq(influencers.level, level));
    }

    // 分类过滤
    if (category !== "all") {
      conditions.push(eq(influencers.category, category));
    }

    // 收藏过滤
    if (isFavorite === "true") {
      conditions.push(eq(influencers.isFavorite, true));
    }

    // 搜索过滤
    if (search) {
      conditions.push(
        or(
          ilike(influencers.channelTitle, `%${search}%`),
          ilike(influencers.email, `%${search}%`),
          ilike(influencers.niche, `%${search}%`)
        )
      );
    }

    // 构建查询
    const query = db
      .select()
      .from(influencers)
      .where(
        conditions.length > 0
          ? and(...conditions)
          : undefined
      )
      .orderBy(desc(influencers.createdAt));

    const influencersData = await query;

    return NextResponse.json({
      influencers: influencersData,
      total: influencersData.length,
    });
  } catch (error) {
    console.error("获取达人列表失败:", error);
    return NextResponse.json(
      { error: "获取达人列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getServerSession } = await import("next-auth/next");
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (!session.user) {
      return NextResponse.json({ error: "用户信息不存在" }, { status: 401 });
    }

    const body = await request.json();
    const { channelId, channelTitle, ...otherData } = body;

    if (!channelId || !channelTitle) {
      return NextResponse.json(
        { error: "频道ID和频道标题不能为空" },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await db
      .select()
      .from(influencers)
      .where(eq(influencers.channelId, channelId))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "该达人已存在" },
        { status: 409 }
      );
    }

    // 创建达人
    const [newInfluencer] = await db
      .insert(influencers)
      .values({
        channelId,
        channelTitle,
        userId: session.user.id,
        ...otherData,
      })
      .returning();

    return NextResponse.json({
      influencer: newInfluencer,
      message: "达人创建成功",
    });
  } catch (error) {
    console.error("创建达人失败:", error);
    return NextResponse.json(
      { error: "创建达人失败" },
      { status: 500 }
    );
  }
}
