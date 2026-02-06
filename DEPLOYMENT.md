# Vercel 部署指南

本项目已经配置好 Vercel 部署，支持从 GitHub 自动部署。

## 自动部署（推荐）

1. **在 Vercel 上创建项目**
   - 访问 https://vercel.com/new
   - 导入 GitHub 仓库：`aspendong-collab/youtube-analytics`
   - 点击 "Import"

2. **配置项目设置**
   - Framework Preset: Next.js
   - Root Directory: `.`
   - Build Command: `pnpm run build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：

   ```
   PGDATABASE_URL=postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   YOUTUBE_API_KEY=AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY
   NEXTAUTH_URL=https://your-project.vercel.app
   NEXTAUTH_SECRET=youtube-analytics-secret-key-change-in-production
   ```

4. **启用 GitHub 集成**
   - 在 Vercel 项目设置中，进入 "Git" 标签
   - 确保 GitHub 集成已启用
   - 选择 `main` 分支作为生产环境

5. **自动部署**
   - 每次 push 到 `main` 分支时，Vercel 会自动部署
   - 访问 Vercel Dashboard 查看部署状态

## 手动部署

如果需要手动触发部署：

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

## 验证部署

部署完成后，访问您的 Vercel 项目 URL 进行验证：

- 主页：`https://your-project.vercel.app`
- 关键词拓展功能：`https://your-project.vercel.app/keyword-expansion`
- 监控页面：`https://your-project.vercel.app/monitoring/competitors`

## 环境变量说明

- `PGDATABASE_URL`: PostgreSQL 数据库连接字符串
- `YOUTUBE_API_KEY`: YouTube Data API v3 密钥
- `NEXTAUTH_URL`: 应用的完整 URL（生产环境）
- `NEXTAUTH_SECRET`: NextAuth 使用的加密密钥

## 故障排查

如果部署失败，请检查：

1. **构建错误**
   - 查看 Vercel 部署日志
   - 确保所有依赖都已正确安装

2. **环境变量缺失**
   - 确保所有必需的环境变量都已配置
   - 环境变量名称必须完全匹配（区分大小写）

3. **数据库连接失败**
   - 检查 `PGDATABASE_URL` 是否正确
   - 确保数据库允许从 Vercel IP 访问

4. **API 调用失败**
   - 检查 `YOUTUBE_API_KEY` 是否有效
   - 确认 API 配额未超出限制
