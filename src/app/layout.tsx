import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: {
    default: 'YouTube Analytics',
    template: '%s | YouTube Analytics',
  },
  description: 'YouTube 视频数据分析与优化平台',
  keywords: ['YouTube', '数据分析', '视频监控', '优化建议'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        {isDev && <Inspector />}
        <div className="flex min-h-screen bg-[#F5F5F7]">
          {/* 左侧边栏 */}
          <Sidebar />
          {/* 主内容区域 */}
          <main className="flex-1 ml-64 p-8 bg-white min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
