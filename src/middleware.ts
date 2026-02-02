import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // 如果用户已登录但状态不是 approved，检查用户状态
    if (token && token.status !== 'approved') {
      const status = token.status;

      // 如果在审核页面，允许访问
      if (pathname === '/pending-approval' || pathname === '/account-rejected') {
        return NextResponse.next();
      }

      // 否则根据状态重定向到对应页面
      if (status === 'pending') {
        return NextResponse.redirect(new URL('/pending-approval', req.url));
      } else if (status === 'rejected') {
        return NextResponse.redirect(new URL('/account-rejected', req.url));
      }
    }

    // 已审核通过的用户可以访问受保护的路由
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // 公开路由：不需要登录即可访问
        const publicRoutes = ['/login', '/register', '/api/auth', '/api/public'];

        // 如果是公开路由，允许访问
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // 其他路由需要登录
        return !!token;
      },
    },
  }
);

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
