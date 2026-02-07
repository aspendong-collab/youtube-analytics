import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 公开路由：不需要登录即可访问
  // 页面路由
  const pageRoutes = ['/login', '/register', '/pending-approval', '/account-rejected', '/health'];
  
  // API 路由
  const apiRoutes = [
    '/api/auth',
    '/api/video-info',
    '/api/videos',
    '/api/owners',
    '/api/influencers',
    '/api/channels',
    '/api/stats',
    '/api/trending',
    '/api/discovery',
    '/api/search',
    '/api/comments',
    '/api/competitor-analysis',
    '/api/suggestions',
    '/api/test',
    '/api/health',
    '/api/check-env',
    '/api/check-env-youtube',
    '/api/users/pending',
    '/api/keywords',
    '/api/db',
    '/api/youtube/key-pool', // YouTube API Key 池监控
    '/api/v1/campaigns', // 暂时公开，用于测试
  ];

  // 组合所有公开路由
  const publicRoutes = [...pageRoutes, ...apiRoutes];

  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 检查 session token
  const sessionToken = req.cookies.get('next-auth.session-token')?.value ||
                        req.cookies.get('__Secure-next-auth.session-token')?.value;

  // 如果没有 session
  if (!sessionToken) {
    // 对于 API 请求，返回 401 错误
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // 对于页面请求，重定向到登录页
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 有 session，继续访问
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
