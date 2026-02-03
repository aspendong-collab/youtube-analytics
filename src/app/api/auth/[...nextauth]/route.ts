import NextAuth from "next-auth";

// 检查是否在构建时
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

// 构建时返回空配置，运行时才加载真实配置
const getAuthOptions = async () => {
  if (isBuildTime) {
    return {
      secret: process.env.NEXTAUTH_SECRET || "youtube-analytics-secret-key-2024-change-in-production",
      providers: [],
    };
  }

  const { authOptions } = await import("@/lib/auth");
  return authOptions;
};

export const GET = async (req: Request, res: any) => {
  const authOptions = await getAuthOptions();
  const handler = NextAuth(authOptions as any);
  return handler(req, res);
};

export const POST = async (req: Request, res: any) => {
  const authOptions = await getAuthOptions();
  const handler = NextAuth(authOptions as any);
  return handler(req, res);
};
