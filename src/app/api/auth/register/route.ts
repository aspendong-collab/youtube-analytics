import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbInstance as db } from "@/lib/db";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// 本地定义验证 schema，避免构建时导入问题
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  // 检查数据库连接
  if (!db) {
    return NextResponse.json(
      { error: "数据库未配置" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // 验证输入
    const validatedData = registerSchema.parse(body);

    // 检查邮箱是否已存在（只检查活跃用户）
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser && existingUser.length > 0 && existingUser[0].isActive) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // 创建用户或重新激活已删除的用户
    let newUser;
    if (existingUser && existingUser.length > 0 && !existingUser[0].isActive) {
      // 重新激活已删除的用户
      newUser = await db
        .update(users)
        .set({
          password: hashedPassword,
          name: validatedData.name,
          role: "user",
          status: "pending",
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(users.email, validatedData.email))
        .returning();
    } else {
      // 创建新用户
      newUser = await db
        .insert(users)
        .values({
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          role: "user",
          status: "pending", // 默认为待审核状态
          isActive: true,
        })
        .returning();
    }

    // 返回用户信息（不包含密码）
    const { password, ...userWithoutPassword } = newUser[0];

    return NextResponse.json(
      {
        message: "注册成功，请等待管理员审核",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入数据格式错误", details: error.errors },
        { status: 400 }
      );
    }

    console.error("注册失败:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
