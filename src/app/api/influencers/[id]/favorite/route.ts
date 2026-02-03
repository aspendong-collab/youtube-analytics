import { NextRequest, NextResponse } from "next/server";
import { dbInstance as db } from "@/lib/db";
import { influencers } from "@/storage/database/shared/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取当前达人状态
    const [currentInfluencer] = await db
      .select()
      .from(influencers)
      .where(eq(influencers.id, params.id))
      .limit(1);

    if (!currentInfluencer) {
      return NextResponse.json({ error: "达人不存在" }, { status: 404 });
    }

    // 切换收藏状态
    const [updatedInfluencer] = await db
      .update(influencers)
      .set({ isFavorite: !currentInfluencer.isFavorite })
      .where(eq(influencers.id, params.id))
      .returning();

    return NextResponse.json({
      influencer: updatedInfluencer,
      message: updatedInfluencer.isFavorite ? "已收藏" : "已取消收藏",
    });
  } catch (error) {
    console.error("切换收藏状态失败:", error);
    return NextResponse.json(
      { error: "操作失败" },
      { status: 500 }
    );
  }
}
