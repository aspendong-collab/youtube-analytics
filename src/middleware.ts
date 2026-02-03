import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 公开路由：不需要登录即可访问
  const publicRoutes = ['/login', '/register', '/pending-approval', '/account-rejected', '/api/auth', '/api/video-info', '/api/videos'];

  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 检查 session token
  const sessionToken = req.cookies.get('next-auth.session-token')?.value ||
                        req.cookies.get('__Secure-next-auth.session-token')?.value;

  // 如果没有 session，重定向到登录页
  if (!sessionToken) {
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
