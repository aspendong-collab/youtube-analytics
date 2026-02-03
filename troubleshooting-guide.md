# Vercel 自动部署故障排查指南

## 确认信息
- ✅ 代码已推送到 GitHub (commit: 4943e76)
- ✅ 仓库: aspendong-collab/youtube-analytics
- ✅ 分支: main
- ✅ vercel.json 配置文件存在

## 可能的问题及解决方案

### 问题 1: Vercel 项目未连接到 GitHub

**检查方法**:
1. 访问 https://vercel.com/dashboard
2. 找到 youtube-analytics 项目
3. 点击 "Settings" → "Git"
4. 检查 "Git Integration" 部分

**解决方法**:
1. 点击 "Connect Git Repository"
2. 选择 "GitHub"
3. 找到并选择 `aspendong-collab/youtube-analytics`
4. 选择 `main` 分支
5. 启用 "Auto Deploy"

### 问题 2: 自动部署被禁用

**检查方法**:
1. 在项目设置中找到 "Deployments" 或 "Build & Development"
2. 查看是否有 "Ignored Build Step" 配置
3. 查看是否有 "Auto Deploy" 选项

**解决方法**:
1. 确保 "Auto Deploy on Git Push" 已启用
2. 清除 "Ignored Build Step" 中的内容（如果有）

### 问题 3: 环境变量配置问题

**检查方法**:
1. 在 Vercel 项目设置中查看 "Environment Variables"
2. 确认所有必需的环境变量都已配置

**必需的环境变量**:
```
NEXTAUTH_SECRET
PGDATABASE_URL
YOUTUBE_API_KEY
```

### 问题 4: 构建错误

**检查方法**:
1. 查看 Vercel 的 "Deployments" 标签页
2. 找到最近的一次部署尝试
3. 点击查看详细的构建日志

**常见构建错误**:
- TypeScript 类型错误
- 依赖安装失败
- 环境变量缺失
- 数据库连接失败

## 临时解决方案：手动触发部署

### 方案 A: 使用 Vercel Dashboard
1. 访问 Vercel Dashboard
2. 进入 youtube-analytics 项目
3. 点击 "Deployments" 标签页
4. 点击 "Redeploy" 按钮
5. 选择 "main" 分支
6. 点击 "Deploy"

### 方案 B: 使用 Vercel CLI
```bash
# 登录 Vercel
vercel login

# 触发生产环境部署
vercel --prod

# 或者指定分支
vercel --prod --branch=main
```

### 方案 C: 使用 Vercel API
```bash
# 需要 Vercel API Token
curl -X POST \
  -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"youtube-analytics","branch":"main"}' \
  https://api.vercel.com/v12/deployments
```

## 推荐的操作步骤

1. **首先尝试手动触发部署**
   - 访问 Vercel Dashboard
   - 找到项目并点击 "Redeploy"

2. **如果手动部署失败**
   - 查看构建日志
   - 根据错误信息修复问题
   - 重新提交代码

3. **修复自动部署**
   - 检查 Git 集成配置
   - 重新连接 GitHub 仓库
   - 确保 webhook 正常工作

## 联系支持

如果以上方法都无法解决问题：
- 访问 Vercel 支持页面: https://vercel.com/support
- 查看 Vercel 状态页面: https://vercel-status.com
