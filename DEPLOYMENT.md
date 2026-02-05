# 部署指南

## 当前状态

✅ 代码已推送到 GitHub 仓库
✅ 功能开发完成，包括：
  - 关键词提取核心库
  - 多语言并行采集 API
  - 前端 UI 组件
  - 菜单入口配置

⚠️ 缺少自动部署配置

## 部署方案

### 方案 1：使用 GitHub Actions（推荐）

#### 步骤 1：更新 GitHub Token 权限

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选以下权限：
   - ✅ `repo` (完整仓库权限)
   - ✅ `workflow` (工作流权限)
4. 生成 token 并复制

#### 步骤 2：更新本地 Git 配置

```bash
git remote set-url origin https://新_TOKEN@github.com/aspendong-collab/youtube-analytics.git
```

#### 步骤 3：添加部署配置

已创建 `.github/workflows/deploy.yml` 文件，包含以下功能：

- ✅ 自动构建项目
- ✅ 运行代码检查
- ✅ 上传构建产物
- ✅ 部署通知

#### 步骤 4：提交并推送

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: 添加 GitHub Actions 自动部署配置"
git push origin main
```

推送后，GitHub Actions 会自动运行，可在 Actions 标签页查看进度。

---

### 方案 2：使用 Vercel（快速部署）

#### 步骤 1：连接 GitHub 仓库

1. 访问 https://vercel.com
2. 登录并点击 "Add New Project"
3. 导入 GitHub 仓库：`aspendong-collab/youtube-analytics`

#### 步骤 2：配置项目

Vercel 会自动检测 Next.js 项目，使用以下配置：

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

#### 步骤 3：添加环境变量

在 Vercel 项目设置中添加以下环境变量：

```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=your-postgres-url
YOUTUBE_API_KEY=your-youtube-api-key
```

#### 步骤 4：部署

点击 "Deploy" 按钮，Vercel 会自动构建和部署。

---

### 方案 3：手动部署（用于测试）

#### 步骤 1：拉取代码

```bash
git clone https://github.com/aspendong-collab/youtube-analytics.git
cd youtube-analytics
```

#### 步骤 2：安装依赖

```bash
pnpm install
```

#### 步骤 3：构建项目

```bash
pnpm run build
```

#### 步骤 4：启动服务

```bash
pnpm start
```

服务将在 http://localhost:3000 启动

---

## 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 环境变量已配置
- [ ] 数据库已设置
- [ ] YouTube API Key 已配置
- [ ] 部署配置已完成
- [ ] 功能测试通过

## 常见问题

### Q1: 推送 workflow 文件失败

**错误信息**：
```
refusing to allow a Personal Access Token to create or update workflow
```

**解决方案**：
更新 GitHub Token，添加 `workflow` 权限（参考方案 1）

### Q2: 构建失败

**检查项**：
1. Node.js 版本是否正确（推荐 v20）
2. 依赖是否安装完整
3. 环境变量是否配置

### Q3: 部署后功能不可用

**检查项**：
1. 数据库连接是否正常
2. API Key 是否有效
3. 域名配置是否正确

## 技术栈

- **框架**: Next.js 14.2.18
- **运行时**: Node.js 20+
- **包管理器**: pnpm
- **数据库**: PostgreSQL (Neon)
- **部署平台**: GitHub Actions / Vercel

## 联系支持

如果遇到部署问题，请提供：
1. 错误日志
2. 部署平台（GitHub Actions / Vercel）
3. 错误步骤和时间
