# 快速开始 Vercel 部署

## 📋 前置条件

- ✅ GitHub 仓库已准备：`aspendong-collab/youtube-analytics`
- ✅ 代码已推送到 GitHub
- ✅ 本地构建验证通过

## 🚀 3 分钟部署到 Vercel

### 步骤 1: 登录 Vercel（2 分钟）

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Sign Up" 或 "Login"
3. 选择 "Continue with GitHub"
4. 授权 Vercel 访问你的 GitHub 账号

### 步骤 2: 导入项目（30 秒）

1. 在 Vercel Dashboard 点击 "Add New Project"
2. 找到 `aspendong-collab/youtube-analytics` 仓库
3. 点击 "Import"

### 步骤 3: 配置环境变量（30 秒）

在 "Environment Variables" 部分添加：

```
PGDATABASE_URL=postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
YOUTUBE_API_KEY=AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY
```

### 步骤 4: 部署（2-3 分钟）

1. 点击 "Deploy" 按钮
2. 等待构建完成
3. 部署成功后会获得 `.vercel.app` 域名

## ✅ 验证部署

### 方法 1: 自动化测试

```bash
./test-deployment.sh https://your-project.vercel.app
```

### 方法 2: 手动测试

1. 访问部署 URL
2. 测试以下页面：
   - [ ] 首页 (`/`)
   - [ ] 视频管理 (`/videos`)
   - [ ] 优化建议 (`/suggestions`)

3. 测试 API：
   - [ ] 访问 `/api/videos` 查看视频列表
   - [ ] 添加新视频功能

## 📚 详细文档

- [完整部署指南](./VERCEL_DEPLOYMENT.md)
- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
- [部署状态报告](./DEPLOYMENT_STATUS.md)

## ❓ 常见问题

### Q: 如何获取部署 URL？
A: 部署完成后，Vercel 会显示一个 `.vercel.app` 域名，例如：`https://youtube-analytics-abc123.vercel.app`

### Q: 部署失败怎么办？
A:
1. 查看 Vercel 构建日志
2. 检查环境变量配置
3. 确认数据库连接正常

### Q: 如何配置自定义域名？
A:
1. 在 Vercel 项目设置中添加域名
2. 配置 DNS 记录
3. SSL 证书自动启用

### Q: 如何监控部署状态？
A:
- 访问 [vercel.com/dashboard](https://vercel.com/dashboard)
- 查看项目部署日志
- 监控错误和性能

## 🎉 完成！

部署成功后，你将拥有：
- ✅ 可在线访问的 YouTube 数据分析平台
- ✅ 自动 HTTPS 支持
- ✅ 全球 CDN 加速
- ✅ 自动部署（Git Push 后）

享受你的新平台吧！ 🚀
