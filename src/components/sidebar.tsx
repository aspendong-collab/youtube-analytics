'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navItems, NavItem } from '@/types/navigation';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#FAFAFA] border-r border-[rgba(0,0,0,0.08)] flex flex-col overflow-y-auto z-50">
      {/* Logo 区域 */}
      <div className="p-6 border-b border-[rgba(0,0,0,0.08)]">
        <h1 className="text-xl font-semibold text-[#1D1D1F]">
          YouTube Analytics
        </h1>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.id}>
            {/* 一级导航项 */}
            <Link
              href={item.path}
              onClick={() => {
                if (item.children) {
                  toggleExpand(item.id);
                }
              }}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive(item.path) || isChildActive(item)
                  ? 'bg-[#007AFF] text-white'
                  : 'text-[#1D1D1F] hover:bg-[rgba(0,122,255,0.08)]'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.children && (
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
              )}
            </Link>

            {/* 二级导航项 */}
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
      </nav>
    </aside>
  );
}
