import bcrypt from "bcryptjs";
import { dbInstance as db } from "@/lib/db";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

async function createAdminUser() {
  try {
    const adminEmail = "admin@example.com";
    const adminPassword = "admin123456"; // 请修改为更安全的密码

    // 检查管理员是否已存在
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      console.log("管理员账号已存在");
      process.exit(0);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 创建管理员
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      name: "系统管理员",
      role: "admin",
      status: "approved",
      isActive: true,
    });

    console.log("✅ 管理员账号创建成功！");
    console.log(`邮箱: ${adminEmail}`);
    console.log(`密码: ${adminPassword}`);
    console.log("⚠️  请立即修改默认密码！");
  } catch (error) {
    console.error("❌ 创建管理员失败:", error);
    process.exit(1);
  }
}

createAdminUser();
