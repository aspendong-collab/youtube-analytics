'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { navItems, NavItem } from '@/types/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  // 自动展开包含当前路径的菜单项
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // 根据当前路径自动展开菜单
  useEffect(() => {
    const autoExpand: string[] = [];
    navItems.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.path))) {
        autoExpand.push(item.id);
      }
    });
    if (autoExpand.length > 0) {
      setExpandedItems(autoExpand);
    }
  }, [pathname]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const isActive = (path: string) => {
    if (path === pathname) return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const isChildActive = (item: NavItem) => {
    return item.children?.some(child => isActive(child.path));
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // 过滤掉登录、注册、审核页面的导航项，只显示功能菜单
  const filteredNavItems = navItems.filter(
    item => !item.path.includes('/login') && 
            !item.path.includes('/register') && 
            !item.path.includes('/admin')
  );

  // 为管理员添加审核页面
  const adminNavItem: NavItem = {
    id: 'admin',
    label: '用户管理',
    icon: '👤',
    path: '/admin/approvals',
  };

  const finalNavItems = session?.user?.role === 'admin'
    ? [...filteredNavItems, adminNavItem]
    : filteredNavItems;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#FAFAFA] border-r border-[rgba(0,0,0,0.08)] flex flex-col overflow-y-auto z-50">
      {/* Logo 区域 */}
      <div className="p-6 border-b border-[rgba(0,0,0,0.08)]">
        <h1 className="text-xl font-semibold text-[#1D1D1F]">
          YouTube Analytics
        </h1>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {status === 'loading' ? (
          <div className="px-4 py-2 text-sm text-[#86868B]">
            加载中...
          </div>
        ) : session ? (
          <>
            {/* 用户信息 */}
            <div className="mb-4 px-4 py-3 bg-[#F5F5F7] rounded-lg">
              <div className="text-sm font-medium text-[#1D1D1F] mb-1">
                {session.user?.name}
              </div>
              <div className="text-xs text-[#86868B] truncate">
                {session.user?.email}
              </div>
              <div className="mt-2">
                {session.user?.status === 'approved' ? (
                  <span className="text-xs text-[#34C759]">✓ 已审核通过</span>
                ) : session.user?.status === 'pending' ? (
                  <span className="text-xs text-[#FF9500]">⏳ 待审核</span>
                ) : (
                  <span className="text-xs text-[#FF3B30]">✗ 审核未通过</span>
                )}
              </div>
            </div>

            {/* 功能菜单 */}
            {finalNavItems.map((item) => (
                <div key={item.id}>
                  {item.children ? (
                    // 有子菜单的情况：使用 button 而不是 Link
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        isChildActive(item)
                          ? 'bg-[#007AFF] text-white'
                          : 'text-[#1D1D1F] hover:bg-[rgba(0,122,255,0.08)]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <svg
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          expandedItems.includes(item.id) ? 'rotate-180' : ''
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  ) : (
                    // 没有子菜单的情况：使用 Link
                    <Link
                      href={item.path}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive(item.path)
                          ? 'bg-[#007AFF] text-white'
                          : 'text-[#1D1D1F] hover:bg-[rgba(0,122,255,0.08)]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  )}

                {item.children && expandedItems.includes(item.id) && (
                  <div className="mt-1 ml-4 bg-white rounded-lg overflow-hidden">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.path}
                        className={cn(
                          'block px-5 py-2.5 text-sm transition-all duration-200',
                          isActive(child.path)
                            ? 'bg-[rgba(0,122,255,0.1)] text-[#007AFF] font-medium'
                            : 'text-[#86868B] hover:bg-[rgba(0,122,255,0.08)] hover:text-[#007AFF]'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 退出登录 */}
            <div className="mt-4 pt-4 border-t border-[rgba(0,0,0,0.08)]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#1D1D1F] hover:bg-[rgba(0,0,0,0.05)] transition-all duration-200"
              >
                <span className="text-base">🚪</span>
                <span>退出登录</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 未登录状态 - 不显示任何内容，因为未登录用户会被 middleware 重定向到登录页 */}
            <div className="px-4 py-3 text-sm text-[#86868B]">
              请先登录
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
