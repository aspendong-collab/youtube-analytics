'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';

const authRoutes = ['/login', '/register', '/pending-approval', '/account-rejected'];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  if (isAuthRoute) {
    // 认证页面：不显示侧边栏，全屏显示
    return <div className="min-h-screen">{children}</div>;
  }

  // 普通页面：显示侧边栏
  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 bg-white min-h-screen">
        {children}
      </main>
    </div>
  );
}
