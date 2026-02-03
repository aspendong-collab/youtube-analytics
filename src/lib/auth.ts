import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { dbInstance as db } from "@/lib/db";
import { users } from "@/storage/database/shared/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!db) {
          throw new Error("数据库连接失败，请稍后重试");
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
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "youtube-analytics-secret-key-change-in-production-123",
};
