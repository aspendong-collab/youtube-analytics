import { NextRequest, NextResponse } from "next/server";
import { dbInstance as db } from "@/lib/db";
import { influencers } from "@/storage/database/shared/schema";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 临时禁用认证检查
    /*
    const { getServerSession } = await import("next-auth/next");
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (!session.user) {
      return NextResponse.json({ error: "用户信息不存在" }, { status: 401 });
    }
    */

    const [influencerData] = await db
      .select()
      .from(influencers)
      .where(eq(influencers.id, params.id))
      .limit(1);

    if (!influencerData) {
      return NextResponse.json({ error: "达人不存在" }, { status: 404 });
    }

    return NextResponse.json({ influencer: influencerData });
  } catch (error) {
    console.error("获取达人详情失败:", error);
    return NextResponse.json(
      { error: "获取达人详情失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 临时禁用认证检查
    /*
    const { getServerSession } = await import("next-auth/next");
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (!session.user) {
      return NextResponse.json({ error: "用户信息不存在" }, { status: 401 });
    }
    */

    const body = await request.json();

    // 更新达人
    const [updatedInfluencer] = await db
      .update(influencers)
      .set(body)
      .where(eq(influencers.id, params.id))
      .returning();

    if (!updatedInfluencer) {
      return NextResponse.json({ error: "达人不存在" }, { status: 404 });
    }

    return NextResponse.json({
      influencer: updatedInfluencer,
      message: "达人更新成功",
    });
  } catch (error) {
    console.error("更新达人失败:", error);
    return NextResponse.json(
      { error: "更新达人失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 临时禁用认证检查
    /*
    const { getServerSession } = await import("next-auth/next");
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (!session.user) {
      return NextResponse.json({ error: "用户信息不存在" }, { status: 401 });
    }
    */

    // 删除达人（软删除）
    const [deletedInfluencer] = await db
      .update(influencers)
      .set({ isActive: false })
      .where(eq(influencers.id, params.id))
      .returning();

    if (!deletedInfluencer) {
      return NextResponse.json({ error: "达人不存在" }, { status: 404 });
    }

    return NextResponse.json({
      message: "达人删除成功",
    });
  } catch (error) {
    console.error("删除达人失败:", error);
    return NextResponse.json(
      { error: "删除达人失败" },
      { status: 500 }
    );
  }
}
