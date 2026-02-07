/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lf-coze-web-cdn.coze.cn',
        pathname: '/**',
      },
    ],
  },
  // 禁用静态优化，所有路由都是动态的
  output: 'standalone',
  experimental: {
    // 禁用静态生成
    serverComponentsExternalPackages: ['drizzle-orm', 'postgres'],
  },
};

module.exports = nextConfig;
