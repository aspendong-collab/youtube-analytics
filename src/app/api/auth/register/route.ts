import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbInstance as db } from "@/lib/db";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";
import { insertUserSchema } from "@/storage/database/shared/schema";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 验证输入
    const validatedData = insertUserSchema.parse(body);

    // 检查邮箱是否已存在
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // 创建用户
    const newUser = await db
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
