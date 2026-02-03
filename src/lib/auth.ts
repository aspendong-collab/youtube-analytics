import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbInstance as db } from "@/lib/db";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

// 确保有有效的 secret
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "youtube-analytics-secret-key-2024-change-in-production";

// 在开发环境启用调试
const NEXTAUTH_DEBUG = process.env.NODE_ENV === "development";

// 检查是否在构建时
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

export const authOptions: NextAuthOptions = {
  debug: NEXTAUTH_DEBUG,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 构建时返回 null，避免数据库连接问题
        if (isBuildTime || !db) {
          return null;
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error("请提供邮箱和密码");
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user || user.length === 0) {
          throw new Error("邮箱或密码错误");
        }

        const userData = user[0];

        if (!userData.isActive) {
          throw new Error("账号已被禁用");
        }

        if (userData.status !== "approved") {
          if (userData.status === "pending") {
            throw new Error("账号正在审核中，请等待管理员审核");
          } else if (userData.status === "rejected") {
            throw new Error("账号审核未通过，请联系管理员");
          }
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          userData.password
        );

        if (!isPasswordValid) {
          throw new Error("邮箱或密码错误");
        }

        // 更新最后登录时间
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, userData.id));

        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          status: userData.status,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          token.status = user.status;
        }
      } catch (error) {
        console.error("JWT callback error:", error);
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session && session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.status = token.status as string;
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
  },
  secret: NEXTAUTH_SECRET,
};
