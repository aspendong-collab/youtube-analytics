'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/sidebar';
import { redirect } from 'next/navigation';

const authRoutes = ['/login', '/register', '/pending-approval', '/account-rejected'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // 认证页面：不显示侧边栏，全屏显示
  if (isAuthRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  // 如果未加载 session，显示加载中
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#86868B]">加载中...</div>
      </div>
    );
  }

  // 如果未登录，应该被 middleware 重定向，但为了安全起见，显示空白
  if (status === 'unauthenticated') {
    return <div className="min-h-screen"></div>;
  }

  // 已登录，显示完整布局（侧边栏 + 内容）
  try {
    return (
      <div className="flex min-h-screen bg-[#F5F5F7]">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 bg-white min-h-screen">
          {children}
        </main>
      </div>
    );
  } catch (error) {
    console.error("LayoutWrapper error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#86868B]">
          加载出错，请刷新页面重试
        </div>
      </div>
    );
  }
}
