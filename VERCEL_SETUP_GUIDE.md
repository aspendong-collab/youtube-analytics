# Vercel 部署配置指南

本指南帮助你将 YouTube Analytics Platform 部署到 Vercel。

## 前置准备

### 1. 获取 YouTube API Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 搜索并启用 "YouTube Data API v3"
4. 创建凭据 → API 密钥
5. 复制 API Key（格式：`AIza...`）

### 2. 准备 GitHub 仓库

确保你的代码已经推送到 GitHub 仓库。

## 部署步骤

### 方法一：通过 Vercel 网站部署（推荐新手）

1. **登录 Vercel**
   - 访问 https://vercel.com/
   - 点击 "Sign Up" 或 "Log In"
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 在 "Import Git Repository" 中选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置项目**
   - **Project Name**: 输入项目名称（如 `youtube-analytics`）
   - **Framework Preset**: 选择 "Next.js"
   - **Root Directory**: 保持默认 `./`
   - 点击 "Create"

4. **配置环境变量**
   - 在配置页面，找到 "Environment Variables" 部分
   - 点击 "Add New"
   - 输入：
     - **Name**: `YOUTUBE_API_KEY`
     - **Value**: 粘贴你的 YouTube API Key
   - 选择环境：Production / Preview / Development
   - 点击 "Add"

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（通常 1-2 分钟）
   - 部署成功后，会显示一个 Vercel 域名

### 方法二：通过 Vercel CLI 部署（推荐开发者）

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```
   选择 GitHub 账号登录

3. **部署项目**
   ```bash
   cd /path/to/your/project
   vercel
   ```

4. **配置环境变量**
   ```bash
   vercel env add YOUTUBE_API_KEY
   ```
   - 选择环境：`production` / `preview` / `development`
   - 粘贴你的 API Key

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

## 配置说明

### 环境变量

本平台需要以下环境变量：

| 变量名 | 说明 | 必需 | 示例 |
|-------|------|------|------|
| `YOUTUBE_API_KEY` | YouTube Data API 密钥 | ✅ 是 | `AIzaSy...` |

### 配置方式

**推荐使用环境变量配置**：
- ✅ 安全：API Key 不暴露在代码中
- ✅ 统一管理：所有用户共享同一个配置
- ✅ 易于维护：修改配置无需更改代码
- ✅ 适合生产环境

## 验证部署

### 1. 检查环境变量

在 Vercel 控制台中：
1. 进入项目设置
2. 点击 "Environment Variables"
3. 确认 `YOUTUBE_API_KEY` 已正确配置

### 2. 测试 API

使用浏览器或 curl 测试：

```bash
curl "https://your-domain.vercel.app/api/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

成功响应应该包含视频的详细信息：
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "视频标题",
  "description": "视频描述",
  ...
}
```

### 3. 访问应用

打开 Vercel 提供的域名（或自定义域名），访问以下页面：
- 首页：`/`
- 添加视频：`/videos/add`
- 数据采集设置：`/settings/data`

## 本地开发配置

在本地开发时，需要在项目根目录创建 `.env.local` 文件：

```bash
YOUTUBE_API_KEY=你的API密钥
```

⚠️ **重要**：
- `.env.local` 文件不会被提交到 Git
- 请确保 `.gitignore` 包含 `.env.local`
- 不要将 API Key 提交到代码仓库

## 自定义域名（可选）

### 1. 添加域名

在 Vercel 控制台中：
1. 进入项目设置
2. 点击 "Domains"
3. 输入你的域名（如 `analytics.yourdomain.com`）
4. 点击 "Add"

### 2. 配置 DNS

Vercel 会提供 DNS 配置说明，在你的域名提供商中添加 DNS 记录：

| 类型 | 名称 | 值 |
|-----|------|-----|
| CNAME | @ | cname.vercel-dns.com |

### 3. 验证

等待 DNS 生效后，访问你的自定义域名。

## 常见问题

### Q1: 部署失败，提示 "Cannot find module 'typescript'"？

**A:** TypeScript 依赖问题，确保 `package.json` 中包含：
```json
{
  "dependencies": {
    "typescript": "^5.0.0"
  }
}
```

### Q2: 环境变量配置后还是报错"未配置 YouTube API Key"？

**A:**
1. 确认环境变量名称正确：`YOUTUBE_API_KEY`（大写，下划线）
2. 确认已经重新部署
3. 检查部署日志

### Q3: 如何查看部署日志？

**A:**
1. 进入 Vercel 项目
2. 点击 "Deployments" 标签
3. 点击最新的部署
4. 查看 "Build Log" 或 "Function Logs"

### Q4: API Key 配额用完了怎么办？

**A:**
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 "API 和服务" > "配额"
3. 申请增加 YouTube Data API v3 的配额
4. 或者创建新的 API Key

### Q5: 可以在本地和 Vercel 使用不同的 API Key 吗？

**A:** 可以！
- 本地开发：使用 `.env.local` 中的 `YOUTUBE_API_KEY`
- Vercel 部署：使用环境变量中的 `YOUTUBE_API_KEY`
- 两者可以不同

### Q6: 如何自动部署？

**A:** Vercel 默认启用 Git 集成，每次推送到主分支会自动部署。你可以在：
1. 项目设置 > Git
2. 配置自动部署规则（如仅在特定分支部署）

## 安全建议

### API Key 管理

⚠️ **重要安全提醒**：

1. **不要提交 API Key 到代码仓库**
   - 使用环境变量
   - 确保 `.env.local` 在 `.gitignore` 中

2. **限制 API Key 权限**
   - 在 Google Cloud Console 中限制 API Key 的使用范围
   - 设置 IP 白名单（如果可能）

3. **定期轮换 API Key**
   - 建议每 3-6 个月更换一次
   - 如果怀疑泄露，立即更换

4. **监控 API 使用情况**
   - 在 Google Cloud Console 中查看 API 调用统计
   - 设置异常使用告警

### 环境变量保护

1. **不要在客户端代码中使用环境变量**
   - 只有服务端（API Routes）可以访问 `process.env`
   - 前端代码中不应直接使用 `process.env`

2. **使用不同环境**
   - Production: 生产 API Key
   - Preview/Development: 测试 API Key（限制配额）

## 性能优化

### 1. 启用 Edge Functions

对于简单的 API 路由，可以配置为 Edge Functions：

```json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "runtime": "edge"
    }
  }
}
```

### 2. 启用缓存

在 Next.js 中配置缓存策略：

```typescript
// fetch with cache
fetch(url, { next: { revalidate: 3600 } }); // 缓存 1 小时
```

### 3. 压缩资源

Vercel 默认会压缩静态资源，无需额外配置。

## 监控和日志

### 1. Vercel Analytics

1. 进入项目设置
2. 启用 "Vercel Analytics"
3. 查看访问量、性能指标

### 2. 错误监控

推荐集成 Sentry 或其他错误监控服务：

```bash
pnpm add @sentry/nextjs
```

### 3. 日志查看

- **构建日志**: Deployments > 选择部署 > Build Log
- **运行时日志**: Deployments > 选择部署 > Function Logs

## 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [YouTube Data API 文档](https://developers.google.com/youtube/v3)
- [问题排查指南](./TROUBLESHOOTING.md)
- [项目 README](./README.md)

## 获取帮助

如果遇到问题：
1. 查看 [问题排查指南](./TROUBLESHOOTING.md)
2. 检查 Vercel 部署日志
3. 搜索 Vercel 和 Next.js 的文档
4. 在 GitHub Issues 中提问
