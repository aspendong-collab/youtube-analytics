"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 简化 SessionProvider 配置，避免 React 19 兼容性问题
  return <SessionProvider>{children}</SessionProvider>;
}
