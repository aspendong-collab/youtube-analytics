# Vercel 部署指南

本项目已经配置好 Vercel 部署，支持从 GitHub 自动部署。

## 快速部署（推荐）

### 1. 创建 Vercel 项目

1. 访问 https://vercel.com/new
2. 登录你的 Vercel 账号
3. 点击 "Import" 按钮
4. 在 "Import Git Repository" 部分，选择：
   - Repository: `aspendong-collab/youtube-analytics`
   - Framework Preset: Next.js
5. 点击 "Import"

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量（Project Settings → Environment Variables）：

```env
PGDATABASE_URL=postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
YOUTUBE_API_KEY=AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=youtube-analytics-secret-key-change-in-production
```

**重要说明**：
- 将 `https://your-project.vercel.app` 替换为你实际的 Vercel 项目 URL
- 生产环境建议使用更安全的 NEXTAUTH_SECRET（可以使用 `openssl rand -base64 32` 生成）

### 3. 配置构建设置

Vercel 会自动检测 Next.js 项目，但建议确认以下设置：

- **Framework Preset**: Next.js
- **Root Directory**: `.`
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

### 4. 部署

点击 "Deploy" 按钮，Vercel 将自动：
1. 安装依赖
2. 构建项目
3. 部署到生产环境

部署完成后，你会得到一个 URL，例如：`https://youtube-analytics-xxxxx.vercel.app`

### 5. 启用 GitHub 集成（自动部署）

1. 在 Vercel 项目中，进入 Settings → Git
2. 确保已连接 GitHub 账号
3. 选择 `main` 分支作为生产环境分支
4. 每次推送到 `main` 分支时，Vercel 会自动重新部署

## 验证部署

部署完成后，访问你的 Vercel 项目 URL 并验证以下功能：

1. **主页**: `https://your-project.vercel.app/`
2. **关键词拓展**: `https://your-project.vercel.app/keyword-expansion`
3. **竞争对手监控**: `https://your-project.vercel.app/monitoring/competitors`

### 测试关键词拓展功能

1. 访问关键词拓展页面
2. 输入关键词（例如："AI"）
3. 点击"开始拓展"
4. 验证：
   - 关键词生成成功
   - 数据来源统计正确显示（规则、LLM、标签提取、评论提取）
   - 搜索量和竞争度显示正确（不为 0）
   - 联想词弹窗可以正常打开和关闭

## 环境变量说明

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `PGDATABASE_URL` | PostgreSQL 数据库连接字符串 | `postgresql://...` |
| `YOUTUBE_API_KEY` | YouTube Data API v3 密钥 | `AIzaSy...` |
| `NEXTAUTH_URL` | 应用的完整 URL（生产环境） | `https://...vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth 使用的加密密钥 | `随机字符串` |

## 故障排查

### 1. 构建失败

**问题**: 构建过程中出现错误

**解决方案**:
- 查看 Vercel 部署日志（Deployments → 选择失败的部署 → View Logs）
- 检查环境变量是否正确配置
- 确保所有依赖都已正确安装

### 2. 环境变量缺失

**问题**: 应用运行时出现环境变量相关错误

**解决方案**:
- 确保所有必需的环境变量都已添加
- 变量名称必须完全匹配（区分大小写）
- 重新部署项目以应用更改

### 3. 数据库连接失败

**问题**: 无法连接到数据库

**解决方案**:
- 检查 `PGDATABASE_URL` 是否正确
- 确保数据库允许从 Vercel IP 访问
- 检查 SSL 模式是否正确（推荐 `sslmode=require`）

### 4. LLM 调用失败

**问题**: 关键词拓展时 LLM 功能失败

**解决方案**:
- 检查 API 密钥是否有效
- 确认网络连接正常
- 查看应用日志获取详细错误信息

### 5. YouTube API 配额不足

**问题**: 数据挖掘功能无法使用

**解决方案**:
- 检查 `YOUTUBE_API_KEY` 是否有效
- 确认 API 配额是否超出限制
- 在 YouTube API Console 中查看使用情况

## 性能优化

### 1. 启用缓存

Vercel 会自动缓存静态资源和构建产物。可以通过以下方式优化：

```vercel.json
{
  "caches": [
    {
      "pattern": "*.js",
      "pattern": "*.css",
      "ttl": 604800
    }
  ]
}
```

### 2. 配置 CDN

Vercel 默认使用全球 CDN，无需额外配置。

### 3. 优化图片

使用 Next.js Image 组件自动优化图片：

```jsx
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={500}
/>
```

## 自定义域名

### 1. 添加域名

1. 进入 Vercel 项目设置
2. 选择 "Domains"
3. 添加你的域名（例如：`example.com`）
4. 根据提示配置 DNS

### 2. 配置 DNS

Vercel 会提供需要添加的 DNS 记录：

- **A 记录**: 指向 Vercel 的 IP 地址
- **CNAME 记录**: 指向 `cname.vercel-dns.com`

## 监控和日志

### 1. 查看部署日志

- 进入 Vercel 项目
- 选择 "Deployments"
- 点击具体的部署查看日志

### 2. 查看实时日志

- 进入 Vercel 项目
- 选择 "Logs"
- 可以实时查看应用日志

### 3. 性能监控

Vercel 提供 Analytics 功能，可以查看：
- 访问量
- 页面加载时间
- 错误率
- 地理位置

## 更新和回滚

### 1. 更新应用

1. 在本地修改代码
2. 推送到 GitHub 的 `main` 分支
3. Vercel 会自动检测并重新部署

### 2. 回滚到之前的版本

1. 进入 Vercel 项目
2. 选择 "Deployments"
3. 找到要回滚的部署
4. 点击 "..." 菜单
5. 选择 "Promote to Production"

## 成本

Vercel 免费计划包括：
- 每月 100GB 带宽
- 无限项目
- 自动 HTTPS
- 全球 CDN
- 预览部署

如果需要更多功能，可以升级到 Pro 计划（$20/月）。

## 支持

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 文档**: https://nextjs.org/docs
- **GitHub Issues**: https://github.com/vercel/vercel/issues

## 注意事项

1. **API 密钥安全**: 不要在代码中硬编码 API 密钥，使用环境变量
2. **数据库连接**: 生产环境使用 SSL 连接
3. **配额管理**: YouTube API 有配额限制，合理使用
4. **定期更新**: 保持依赖包更新到最新版本

---

**提示**: 首次部署可能需要 5-10 分钟，后续部署会更快（得益于缓存）。
