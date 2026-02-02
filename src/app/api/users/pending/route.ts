import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbInstance as db } from "@/lib/db";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // 检查是否已登录且是管理员
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "无权限执行此操作" },
        { status: 403 }
      );
    }

    // 获取所有待审核用户
    const pendingUsers = await db
      .select()
      .from(users)
      .where(eq(users.status, "pending"));

    // 移除密码字段
    const usersWithoutPassword = pendingUsers.map(({ password, ...rest }) => rest);

    return NextResponse.json({
      users: usersWithoutPassword,
    });
  } catch (error) {
    console.error("获取待审核用户失败:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}
