# 🚀 Vercel 部署完整指南

## 📋 当前状态

### ✅ 代码状态

- **最新提交**: `7237044` - 添加热门内容排行榜功能总结
- **仓库**: `github.com/aspendong-collab/youtube-analytics.git`
- **分支**: `main`
- **状态**: ✅ 已推送到 GitHub

### 🎯 最新功能

1. ✅ 全平台达人发现功能
2. ✅ 热门内容排行榜
3. ✅ 多维度筛选
4. ✅ 智能排名算法
5. ✅ 自动数据抓取
6. ✅ 演示数据已清理

---

## 🔧 部署步骤

### 步骤 1: 访问 Vercel Dashboard

**URL**: https://vercel.com/dashboard

### 步骤 2: 找到项目

查找项目名称：`youtube-analytics`

### 步骤 3: 检查部署状态

1. 点击项目进入详情页
2. 查看 **Deployments** 标签
3. 查看最新的部署状态

### 步骤 4: 配置环境变量（首次或未配置）

如果环境变量未配置，需要添加：

进入项目设置 → **Environment Variables** → 添加以下变量：

#### 必需的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PGDATABASE_URL` | `postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` | PostgreSQL 数据库连接 |
| `YOUTUBE_API_KEY` | `AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY` | YouTube API 密钥 |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | NextAuth 回调 URL（部署后更新） |
| `NEXTAUTH_SECRET` | `youtube-analytics-secret-key-change-in-production` | NextAuth 会话密钥（生产环境建议修改） |

#### 可选的环境变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `CRON_SECRET` | `your-random-secret-key` | Cron 任务验证密钥（如果使用自动抓取） |

### 步骤 5: 触发部署

#### 方法 A: 自动部署（推荐）

如果已配置 GitHub 集成，推送代码后会自动部署。

**状态**: ✅ 代码已推送，Vercel 会自动检测并开始部署

#### 方法 B: 手动触发部署

1. 进入项目设置
2. 点击 **Deployments** 标签
3. 点击右上角 **Redeploy** 按钮
4. 选择 **Redeploy specific commit**
5. 选择最新的 commit (`7237044`)
6. 点击 **Redeploy**

### 步骤 6: 等待部署完成

**预计时间**: 2-5 分钟

查看部署状态：
- **Building**: 正在构建
- **Queued**: 排队中
- **Ready**: 部署成功
- **Error**: 部署失败

---

## 🧪 部署后测试

### 1. 基础功能测试

访问项目 URL（部署完成后显示）：
```
https://your-project.vercel.app
```

**测试清单**:
- [ ] 页面正常加载
- [ ] 登录功能正常
- [ ] 侧边栏显示正常

### 2. 核心功能测试

#### A. 全平台达人发现

**URL**: `https://your-project.vercel.app/discovery/enhanced`

**测试步骤**:
1. 点击侧边栏 **"发现" > "全平台达人发现"**
2. 输入关键词（例如：`tech`）
3. 点击搜索
4. 查看搜索结果

**预期结果**:
- ✅ 返回视频列表
- ✅ 显示各项数据指标
- ✅ 筛选功能正常

#### B. 热门排行榜

**URL**: `https://your-project.vercel.app/trending/ranking`

**测试步骤**:
1. 点击侧边栏 **"发现" > "热门排行榜"**
2. 选择时间范围（今日/本周/本月）
3. 输入关键词（可选）
4. 点击"获取排行榜"

**预期结果**:
- ✅ 显示排行榜
- ✅ 排名正确
- ✅ 前三名有特殊样式

#### C. 数据总览

**URL**: `https://your-project.vercel.app/overview`

**预期结果**:
- ✅ 所有数据显示为 0（演示数据已清理）

### 3. API 接口测试

测试搜索 API：
```bash
curl "https://your-project.vercel.app/api/discovery/search?mode=keyword&q=tech&maxResults=5"
```

测试排行榜 API：
```bash
curl "https://your-project.vercel.app/api/trending/ranking?period=today&maxResults=5"
```

**预期结果**:
- ✅ 返回 JSON 数据
- ✅ 无 403 或 500 错误

---

## ⚠️ 常见问题

### 问题 1: 部署失败

**可能原因**:
- 环境变量未配置
- 依赖安装失败
- 构建错误

**解决方案**:
1. 查看 **Build Logs**
2. 检查环境变量
3. 查看错误信息

### 问题 2: API 返回 403 错误

**可能原因**:
- API Key 的应用限制配置过严
- 配额已用完

**解决方案**:
1. 访问 Google Cloud Console
2. 编辑 API Key
3. 将应用限制改为"无限制"
4. 重新部署

详见：[YOUTUBE_API_QUICK_FIX.md](YOUTUBE_API_QUICK_FIX.md)

### 问题 3: 页面 404

**可能原因**:
- 路由未正确配置
- 部署未完成

**解决方案**:
1. 等待部署完成
2. 清除浏览器缓存
3. 检查 URL 是否正确

### 问题 4: 登录失败

**可能原因**:
- 演示数据已清理
- 需要重新注册

**解决方案**:
1. 访问 `/register`
2. 注册新用户
3. 首个用户自动成为管理员

---

## 🔄 部署后配置

### 1. 更新 NEXTAUTH_URL

部署完成后，更新 `NEXTAUTH_URL` 环境变量：

```bash
NEXTAUTH_URL=https://your-project.vercel.app
```

### 2. 配置 NEXTAUTH_SECRET（推荐）

生成随机密钥：
```bash
openssl rand -base64 32
```

更新环境变量：
```bash
NEXTAUTH_SECRET=生成的随机密钥
```

### 3. 配置自定义域名（可选）

1. 进入项目设置
2. 点击 **Domains**
3. 添加自定义域名
4. 配置 DNS 记录

### 4. 启用自动抓取（可选）

详见：[TRENDING_RANKING_GUIDE.md](TRENDING_RANKING_GUIDE.md)

---

## 📊 性能优化

### 1. 启用缓存

在 API 路由中添加缓存头：

```typescript
// src/app/api/discovery/search/route.ts
response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
```

### 2. 启用图片优化

使用 Next.js Image 组件：

```tsx
import Image from 'next/image';

<Image
  src={video.thumbnail}
  alt={video.title}
  width={320}
  height={180}
  loading="lazy"
/>
```

### 3. 配置 CDN

Vercel 自动配置 CDN，无需额外配置。

---

## 🔍 监控和日志

### 查看实时日志

```bash
vercel logs --follow
```

### 查看 Function Logs

1. 进入项目设置
2. 点击 **Deployments**
3. 点击最新部署
4. 查看 **Function Logs**

### 查看 Analytics

1. 进入项目设置
2. 点击 **Analytics**
3. 查看访问统计

---

## 📝 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建
- [ ] 环境变量已配置
- [ ] 部署状态为 "Ready"
- [ ] 登录功能正常
- [ ] 全平台达人发现功能正常
- [ ] 热门排行榜功能正常
- [ ] 数据总览显示正常
- [ ] API 接口正常响应
- [ ] 无控制台错误

---

## 🎉 部署完成

### 访问应用

```
https://your-project.vercel.app
```

### 主要功能页面

| 功能 | URL |
|------|-----|
| 登录 | `/login` |
| 注册 | `/register` |
| 数据总览 | `/overview` |
| 全平台达人发现 | `/discovery/enhanced` |
| 热门排行榜 | `/trending/ranking` |
| 视频监控 | `/monitoring` |
| 达人管理 | `/influencers` |
| 内容分析 | `/content-analysis` |

### 后续优化建议

1. **启用自动抓取** - 配置定时任务抓取热门内容
2. **优化算法** - 根据实际数据调整排名权重
3. **添加缓存** - 减少重复 API 请求
4. **监控配额** - 定期检查 YouTube API 配额使用情况

---

## 📚 相关文档

- [YouTube API 快速修复](YOUTUBE_API_QUICK_FIX.md)
- [热门排行榜指南](TRENDING_RANKING_GUIDE.md)
- [演示数据清理报告](DEMO_DATA_CLEANUP_REPORT.md)

---

**部署完成时间**: 2024-02-03

**祝你部署成功！** 🚀
