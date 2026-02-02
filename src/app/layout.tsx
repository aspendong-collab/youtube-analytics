import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { QueryProvider } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/error-boundary';
import { AuthProvider } from '@/components/providers';

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
  return (
    <html lang="zh-CN">
      <body className={`antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <QueryProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <Toaster position="top-right" />
            </QueryProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
