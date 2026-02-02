import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbInstance as db } from "@/lib/db";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 检查是否已登录且是管理员
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "无权限执行此操作" },
        { status: 403 }
      );
    }

    const userId = params.id;

    // 更新用户状态为已通过
    const updatedUsers = await db
      .update(users)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUsers || updatedUsers.length === 0) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    const { password, ...userWithoutPassword } = updatedUsers[0];

    return NextResponse.json({
      message: "用户审核通过",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("审核用户失败:", error);
    return NextResponse.json(
      { error: "审核失败，请稍后重试" },
      { status: 500 }
    );
  }
}
