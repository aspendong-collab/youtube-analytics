import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 公开路由：不需要登录即可访问
  const publicRoutes = ['/login', '/register', '/api/auth', '/api/public'];

  // 如果是公开路由，允许访问
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 检查 session token
  const sessionToken = req.cookies.get('next-auth.session-token')?.value ||
                        req.cookies.get('__Secure-next-auth.session-token')?.value;

  // 其他路由需要登录
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - public folder 中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
