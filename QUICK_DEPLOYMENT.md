# ⚡ 快速部署指南

## 🚀 一键部署（推荐）

如果你已经配置好 Vercel CLI，可以直接运行：

```bash
./deploy.sh
```

## 📋 手动部署步骤

### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel

```bash
vercel login
```

### 步骤 3: 部署到生产环境

```bash
vercel --prod
```

### 步骤 4: 配置环境变量（首次部署）

访问 https://vercel.com/dashboard，找到你的项目，进入 Settings → Environment Variables，添加以下变量：

```bash
PGDATABASE_URL=postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
YOUTUBE_API_KEY=AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=youtube-analytics-secret-key-change-in-production
```

### 步骤 5: 重新部署

配置环境变量后，重新触发部署：

```bash
vercel --prod
```

## 🧪 部署后测试

### 快速功能测试

1. **访问应用**
   ```
   https://your-project.vercel.app
   ```

2. **测试登录**
   - 访问 `/login`
   - 测试登录功能

3. **测试热门排行榜（新功能）**
   - 访问 `/trending/ranking`
   - 点击"获取排行榜"
   - 验证缓存功能
   - 切换页面后返回，验证缓存命中

4. **测试全平台达人发现**
   - 访问 `/discovery/enhanced`
   - 搜索关键词
   - 验证筛选功能

### 完整测试

按照 `TRENDING_RANKING_TEST_GUIDE.md` 进行完整的 10 个测试场景。

## 📊 性能验证

### 使用 Chrome DevTools

1. 打开 Chrome DevTools (F12)
2. 切换到 Network 标签
3. 访问热门排行榜页面
4. 观察 API 调用次数

**预期结果**:
- 首次获取: 1 次 API 调用
- 返回页面: 0 次 API 调用（使用缓存）
- 手动刷新: 1 次 API 调用

**性能指标**:
- 缓存命中时响应 < 100ms
- 平均响应时间提升 80%

## 🔍 查看部署日志

```bash
vercel logs --follow
```

## ⚠️ 常见问题

### 问题 1: API 返回 403 错误

**解决方案**: 访问 Google Cloud Console，将 API Key 的应用限制改为"无限制"，然后重新部署。

详见: `YOUTUBE_API_QUICK_FIX.md`

### 问题 2: 环境变量未生效

**解决方案**: 配置环境变量后必须重新部署。

```bash
vercel --prod
```

### 问题 3: 部署失败

**解决方案**: 查看部署日志，检查错误信息。

```bash
vercel logs
```

## 📚 相关文档

- [完整部署指南](VERCEL_DEPLOYMENT_COMPLETE_GUIDE.md)
- [热门排行榜测试指南](TRENDING_RANKING_TEST_GUIDE.md)
- [缓存优化说明](TRENDING_CACHE_OPTIMIZATION.md)
- [YouTube API 快速修复](YOUTUBE_API_QUICK_FIX.md)

## ✅ 部署检查清单

- [ ] Vercel CLI 已安装
- [ ] 已登录 Vercel
- [ ] 环境变量已配置
- [ ] 部署成功（状态：Ready）
- [ ] 登录功能正常
- [ ] 热门排行榜功能正常（包括缓存）
- [ ] 缓存性能验证通过
- [ ] 全平台达人发现功能正常
- [ ] API 接口正常响应

---

**部署成功！** 🎉

访问你的应用开始使用：`https://your-project.vercel.app`
