# Vercel 部署指南 - 达人发现功能

## 📋 部署前检查清单

### ✅ 代码文件检查

- [x] API 路由：`src/app/api/discovery/search/route.ts`
- [x] 组件文件：`src/components/discovery/DiscoveryFilters.tsx`
- [x] 页面文件：`src/app/discovery/enhanced/page.tsx`
- [x] 类型定义：`src/types/discovery.ts`
- [x] 依赖已安装：`googleapis` (^168.0.0)

### ✅ 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

```bash
# 数据库配置
PGDATABASE_URL=postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# YouTube API Key
YOUTUBE_API_KEY=AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY

# NextAuth 配置
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=youtube-analytics-secret-key-change-in-production
```

### ✅ 注意事项

1. **NEXTAUTH_URL**：部署后必须改为你的 Vercel 域名
2. **NEXTAUTH_SECRET**：生产环境建议使用随机生成的密钥
   ```bash
   # 生成随机密钥
   openssl rand -base64 32
   ```

---

## 🚀 部署步骤

### 步骤 1：推送代码到 GitHub

```bash
# 查看当前状态
git status

# 添加所有更改的文件
git add .

# 提交更改
git commit -m "feat: 实现基于 YouTube 全平台的达人发现和多维度筛选功能"

# 推送到 GitHub
git push origin main
```

### 步骤 2：在 Vercel 中触发部署

#### 方式 1：自动部署（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目 `youtube-analytics`
3. Vercel 会自动检测到新的 commit 并开始部署
4. 等待部署完成（通常 2-5 分钟）

#### 方式 2：手动部署

1. 进入项目设置
2. 点击 **Deployments** 标签
3. 点击右上角的 **Redeploy** 按钮
4. 选择 **Redeploy specific commit**
5. 选择最新的 commit
6. 点击 **Redeploy**

### 步骤 3：验证部署

部署完成后，访问以下 URL 验证功能：

```
https://your-project.vercel.app/discovery/enhanced
```

**测试步骤：**

1. ✅ 页面正常加载
2. ✅ 输入关键词搜索（例如：科技评测）
3. ✅ 查看搜索结果
4. ✅ 调整筛选器（播放量、互动率等）
5. ✅ 验证筛选结果实时更新
6. ✅ 切换排序方式
7. ✅ 测试热门视频功能

---

## 🔧 环境变量配置

### 在 Vercel 中配置环境变量

1. 进入你的 Vercel 项目
2. 点击 **Settings** 标签
3. 点击左侧菜单的 **Environment Variables**
4. 点击 **Add New** 添加环境变量

### 环境变量列表

| 变量名 | 说明 | 必需 | 示例值 |
|--------|------|------|--------|
| `PGDATABASE_URL` | PostgreSQL 数据库连接字符串 | ✅ 是 | `postgresql://...` |
| `YOUTUBE_API_KEY` | YouTube Data API 密钥 | ✅ 是 | `AIzaSy...` |
| `NEXTAUTH_URL` | NextAuth 回调 URL | ✅ 是 | `https://your-project.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth 会话密钥 | ✅ 是 | `随机32位字符串` |

### 配置生产环境变量

```bash
# NEXTAUTH_URL - 改为你的 Vercel 域名
NEXTAUTH_URL=https://your-project.vercel.app

# NEXTAUTH_SECRET - 使用随机生成的密钥
NEXTAUTH_SECRET=your-random-secret-key-here
```

---

## 🧪 部署后测试

### 测试 API

测试搜索 API：

```bash
curl "https://your-project.vercel.app/api/discovery/search?mode=keyword&q=科技评测&maxResults=10"
```

预期响应：

```json
{
  "videos": [
    {
      "id": "视频ID",
      "title": "视频标题",
      "description": "视频描述",
      "thumbnail": "缩略图URL",
      "publishedAt": "2024-01-15T00:00:00Z",
      "channelId": "频道ID",
      "channelTitle": "频道名称",
      "viewCount": 123456,
      "likeCount": 12345,
      "commentCount": 1234,
      "duration": "PT10M30S",
      "durationSeconds": 630,
      "subscriberCount": 1000000,
      "channelVideoCount": 500,
      "engagementRate": 5.5,
      "engagementScore": 55,
      "popularityScore": 72,
      "daysSincePublished": 15
    }
  ],
  "total": 10,
  "query": "科技评测"
}
```

### 测试页面功能

1. **搜索功能**
   - 输入关键词：`科技评测`
   - 点击搜索
   - 验证返回结果

2. **热门视频**
   - 点击"热门"按钮
   - 验证返回热门视频

3. **筛选功能**
   - 调整播放量滑块
   - 调整互动率滑块
   - 验证结果实时更新

4. **排序功能**
   - 切换排序方式（热度/播放量/互动率）
   - 切换排序顺序（升序/降序）
   - 验证结果正确排序

---

## ⚠️ 常见问题

### 问题 1：部署失败

**错误信息：**
```
Build failed
```

**解决方案：**
1. 检查 Vercel 构建日志
2. 确认所有依赖已安装
3. 检查 TypeScript 错误
4. 确认 Node.js 版本（建议 18.x 或 20.x）

### 问题 2：API 返回 500 错误

**错误信息：**
```json
{
  "error": "未配置 YouTube API Key"
}
```

**解决方案：**
1. 确认 `YOUTUBE_API_KEY` 已在 Vercel 环境变量中配置
2. 确认 API Key 有效
3. 重新部署项目

### 问题 3：搜索结果为空

**错误信息：**
```json
{
  "videos": [],
  "total": 0,
  "message": "未找到相关视频"
}
```

**解决方案：**
1. 尝试不同的关键词
2. 检查 API 配额是否已用尽
3. 确认关键词拼写正确

### 问题 4：筛选功能不工作

**可能原因：**
- JavaScript 错误
- 组件未正确加载

**解决方案：**
1. 打开浏览器控制台查看错误
2. 清除浏览器缓存
3. 硬刷新页面（Ctrl + Shift + R）

### 问题 5：部署后访问 404

**错误信息：**
```
404 Not Found
```

**解决方案：**
1. 确认 URL 正确：`/discovery/enhanced`
2. 确认文件路径正确
3. 重新部署项目

---

## 📊 监控与日志

### 查看 Vercel 日志

1. 进入项目设置
2. 点击 **Deployments** 标签
3. 点击最新的部署
4. 查看 **Build Logs** 和 **Function Logs**

### 查看实时日志

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 查看实时日志
vercel logs
```

---

## 🔐 安全检查

### ✅ 部署前安全检查

- [ ] API Key 不在代码中硬编码
- [ ] 所有敏感数据使用环境变量
- [ ] NEXTAUTH_SECRET 已更改为随机密钥
- [ ] 数据库连接字符串正确
- [ ] API 请求有错误处理
- [ ] 没有 console.log 泄露敏感信息

### 🔒 生产环境建议

1. **使用环境变量**：所有配置通过环境变量
2. **定期更换密钥**：定期更换 NEXTAUTH_SECRET
3. **监控配额**：监控 YouTube API 配额使用情况
4. **错误日志**：配置错误监控和告警
5. **HTTPS**：确保使用 HTTPS（Vercel 默认提供）

---

## 🚀 性能优化

### 1. 缓存策略

```typescript
// 在 API 路由中添加缓存头
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return response;
}
```

### 2. 图片优化

```tsx
// 使用 Next.js Image 组件
import Image from 'next/image';

<Image
  src={video.thumbnail}
  alt={video.title}
  width={320}
  height={180}
  loading="lazy"
/>
```

### 3. 代码分割

```typescript
// 动态导入大型组件
const DiscoveryFilters = dynamic(() => import('@/components/discovery/DiscoveryFilters'), {
  loading: () => <div>加载中...</div>
  ssr: false
});
```

---

## 📈 后续优化

### 短期优化（1-2周）

- [ ] 添加分页功能
- [ ] 添加保存筛选条件功能
- [ ] 添加批量操作功能
- [ ] 优化移动端体验

### 中期优化（1-2月）

- [ ] 添加缓存机制
- [ ] 添加推荐算法
- [ ] 添加达人对比功能
- [ ] 优化 SEO

### 长期优化（3-6月）

- [ ] 集成 Analytics API
- [ ] 添加 AI 推荐
- [ ] 添加数据导出功能
- [ ] 添加自定义报告

---

## 📞 技术支持

如有问题，请：

1. 查看 Vercel 部署日志
2. 检查浏览器控制台错误
3. 查看本文档的常见问题部分
4. 联系技术支持

---

## ✅ 部署完成检查清单

- [ ] 代码已推送到 GitHub
- [ ] 环境变量已配置
- [ ] 项目已成功部署到 Vercel
- [ ] 搜索功能正常工作
- [ ] 热门视频功能正常工作
- [ ] 筛选功能正常工作
- [ ] 排序功能正常工作
- [ ] 无 JavaScript 错误
- [ ] 无 API 错误
- [ ] 页面加载速度正常

---

**部署完成后，记得更新本文档中的项目 URL！**
