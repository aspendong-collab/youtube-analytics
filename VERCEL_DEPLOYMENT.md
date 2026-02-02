# Vercel 部署指南

## 部署前检查清单

- ✅ Next.js 15.2.8
- ✅ TypeScript 5
- ✅ PostgreSQL (Neon) 数据库
- ✅ 本地构建成功
- ✅ 代码已推送到 GitHub

## 快速部署步骤

### 方法 1：通过 Vercel Dashboard（推荐）

1. **登录 Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New Project"
   - 选择 `aspendong-collab/youtube-analytics` 仓库
   - 点击 "Import"

3. **配置环境变量**
   在 Project Settings > Environment Variables 中添加：

   ```
   PGDATABASE_URL=postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   YOUTUBE_API_KEY=AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY
   ```

4. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（约 2-3 分钟）
   - 部署成功后会获得一个 `.vercel.app` 域名

### 方法 2：通过 Vercel CLI

```bash
# 安装 Vercel CLI（如果还没安装）
pnpm add -g vercel

# 登录 Vercel
vercel login

# 部署到预览环境
vercel

# 部署到生产环境
vercel --prod
```

## 配置说明

### 构建配置
项目已配置 `vercel.json`：

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

### 环境变量
必需的环境变量：

| 变量名 | 描述 | 示例 |
|--------|------|------|
| `PGDATABASE_URL` | Neon 数据库连接字符串 | `postgresql://...` |
| `YOUTUBE_API_KEY` | YouTube Data API v3 密钥 | `AIzaSy...` |

### 部署区域
- 默认区域：`hkg1` (香港)
- 建议使用香港区域以优化中国用户访问速度

## 功能测试清单

部署完成后，请测试以下功能：

### 1. 基础页面
- [ ] 首页 (`/`) - 总览数据
- [ ] 视频管理 (`/videos`) - 视频列表
- [ ] 数据分析 (`/analysis`) - 数据统计
- [ ] 优化建议 (`/suggestions`) - AI 优化

### 2. API 端点
- [ ] `/api/videos` - 获取视频列表
- [ ] `/api/channels/[channelId]` - 获取博主数据
- [ ] `/api/stats` - 获取统计数据
- [ ] `/api/suggestions/title` - 标题优化
- [ ] `/api/suggestions/tags` - 标签生成
- [ ] `/api/suggestions/description` - 描述优化
- [ ] `/api/suggestions/thumbnail` - 封面分析
- [ ] `/api/suggestions/competition` - 竞争分析
- [ ] `/api/suggestions/publish-time` - 发布时间分析

### 3. 核心功能
- [ ] 添加新视频
- [ ] 查看博主详情
- [ ] 查看数据分析图表
- [ ] 使用 AI 优化建议
- [ ] 查看 YouTube API 数据获取

## 故障排查

### 构建失败
1. 检查 `package.json` 中的依赖是否完整
2. 查看 Vercel 构建日志
3. 确认环境变量已正确设置

### 数据库连接错误
1. 检查 `PGDATABASE_URL` 环境变量
2. 确认 Neon 数据库是否在线
3. 检查数据库连接字符串格式

### YouTube API 错误
1. 检查 `YOUTUBE_API_KEY` 是否有效
2. 确认 API 配额是否足够
3. 检查 YouTube API 密钥权限

### 页面加载缓慢
1. 检查部署区域设置
2. 优化图片资源
3. 检查数据库查询性能

## 监控与维护

### Vercel Dashboard
- 访问 [vercel.com/dashboard](https://vercel.com/dashboard)
- 查看部署日志、错误和性能指标

### 性能监控
- 使用 Vercel Analytics
- 监控页面加载时间
- 跟踪 API 响应时间

### 数据库监控
- 访问 [Neon Console](https://console.neon.tech/)
- 监控数据库连接数
- 检查查询性能

## 更新部署

### 推送代码后自动部署
```bash
git add .
git commit -m "描述你的更改"
git push origin main
```

Vercel 会自动检测 GitHub 推送并触发部署。

### 手动触发部署
```bash
vercel --prod
```

## 自定义域名

1. 在 Vercel 项目设置中添加域名
2. 配置 DNS 记录
3. 启用 SSL 证书（自动）

## 成本估算

### Vercel
- Hobby Plan（免费）
  - 100GB 带宽/月
  - 无限构建
  - 6,000 分钟构建时间/月

### Neon
- Free Tier
  - 0.5GB 存储
  - 无限连接
  - 60 小时/月运行时间

### YouTube API
- 免费配额：10,000 单位/天

## 技术支持

- Vercel 文档：[vercel.com/docs](https://vercel.com/docs)
- Neon 文档：[neon.tech/docs](https://neon.tech/docs)
- Next.js 文档：[nextjs.org/docs](https://nextjs.org/docs)

## 安全建议

1. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 使用 Vercel 环境变量
   - 定期轮换 API 密钥

2. **数据库安全**
   - 使用 SSL 连接
   - 启用数据库访问控制
   - 定期备份数据

3. **API 安全**
   - 限制 API 访问频率
   - 实施速率限制
   - 验证 API 调用来源

## 下一步优化

- [ ] 启用 Vercel Analytics
- [ ] 配置自定义域名
- [ ] 设置错误监控（Sentry）
- [ ] 配置 CI/CD 自动测试
- [ ] 优化数据库查询性能
- [ ] 实施缓存策略
