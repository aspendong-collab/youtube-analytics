# 手动部署步骤指南

## 📋 前置准备

在开始之前，请确保：
- ✅ 代码已推送到 GitHub
- ✅ 你有 Vercel 账号
- ✅ 你有项目的访问权限

---

## 🚀 方法 1：通过 Vercel 控制台（最简单）

### 步骤 1：访问 Vercel

1. 打开浏览器
2. 访问：https://vercel.com
3. 登录你的账号

### 步骤 2：查找项目

1. 在 Vercel 首页或 Dashboard
2. 查找名为 `youtube-analytics` 的项目
3. **如果找不到项目**，跳到"方法 3：重新创建项目"

### 步骤 3：进入项目

1. 点击 `youtube-analytics` 项目卡片
2. 进入项目页面

### 步骤 4：查看当前状态

1. 检查项目状态是否正常
2. 查看最近的部署记录
3. 确认项目已连接到 GitHub

### 步骤 5：手动触发部署

**方式 A：重新部署最新提交**

1. 点击页面顶部的 **"Deployments"** 标签
2. 找到最新的部署记录
3. 点击右上角的 **"..."** (三个点) 按钮
4. 选择 **"Redeploy"**
5. 在弹出的对话框中，选择 **"Redeploy to Production"**
6. 点击 **"Redeploy"** 按钮

**方式 B：部署到预览环境**

1. 点击顶部的 **"Deployments"** 标签
2. 点击右上角的 **"Deploy"** 按钮
3. 选择 **"Preview"**
4. 等待部署完成

### 步骤 6：等待部署完成

1. 查看 **"Build Logs"** 标签
2. 观察构建进度：
   ```
   Cloning repository...
   Installing dependencies...
   Building...
   Done in 123ms
   ```
3. 构建完成后，状态会变为 **"Ready"**
4. 总时间预计：3-5 分钟

### 步骤 7：验证部署

1. 点击部署记录中的 URL
2. 访问生产环境
3. 测试功能是否正常

---

## 🖥️ 方法 2：通过命令行（推荐开发者）

### 步骤 1：打开终端

在你的项目根目录下打开终端或命令行

### 步骤 2：安装 Vercel CLI（如果未安装）

```bash
# 检查是否已安装
vercel --version

# 如果未安装，执行：
npm install -g vercel
```

### 步骤 3：登录 Vercel

```bash
# 登录命令
vercel login
```

系统会提示：
1. 选择登录方式（Email / GitHub / GitLab / Bitbucket）
2. 选择 **"Continue with GitHub"**
3. 在浏览器中授权登录
4. 回到终端，确认登录成功

### 步骤 4：链接项目（如果是第一次）

```bash
# 在项目根目录执行
vercel link
```

系统会提示：
1. 确认项目信息
2. 选择关联现有项目或创建新项目
3. 选择关联现有项目：`youtube-analytics`

### 步骤 5：部署到生产环境

```bash
# 部署到生产环境
vercel --prod
```

或者使用项目提供的脚本：

```bash
# 使用快速部署脚本
bash scripts/vercel-deploy.sh

# 按提示选择部署类型
# 输入 2 选择生产部署
```

### 步骤 6：等待部署完成

终端会显示：
```
Vercel CLI 37.4.0
🔍  Inspect: https://vercel.com/your-username/youtube-analytics/xxxxx
🚀  Preview: https://youtube-analytics-xxxxx.vercel.app
✅  Production: https://youtube-analytics-opal.vercel.app
```

### 步骤 7：访问部署的 URL

复制终端输出的 Production URL，在浏览器中访问

---

## 🔄 方法 3：重新创建项目（如果项目不存在）

### 步骤 1：删除旧项目（如果存在）

1. 访问 Vercel 控制台
2. 找到 `youtube-analytics` 项目
3. 点击 **"Settings"** 标签
4. 滚动到页面底部
5. 点击 **"Delete Project"**
6. 输入项目名称确认删除
7. 点击 **"Delete"** 按钮

### 步骤 2：创建新项目

1. 点击 Vercel 首页的 **"Add New"** 按钮
2. 选择 **"Project"**

### 步骤 3：导入 GitHub 仓库

1. 在 **"Import Git Repository"** 页面
2. 找到 `aspendong-collab/youtube-analytics` 仓库
3. 点击 **"Import"** 按钮

### 步骤 4：配置项目设置

在 **"Configure Project"** 页面：

**Framework Preset**：
- 选择：**Next.js**
- 自动检测到 Next.js 框架

**Root Directory**：
- 保持默认：`./`

**Build & Development Settings**：
- Build Command：`pnpm run build`
- Output Directory：`.next`
- Install Command：`pnpm install`
- Dev Command：`pnpm run dev`

**Environment Variables**（关键！）：

点击 **"Environment Variables"** 部分，添加以下变量：

```
NEXTAUTH_URL
值：https://youtube-analytics-opal.vercel.app

NEXTAUTH_SECRET
值：生成一个随机字符串
提示：使用 openssl rand -base64 32 生成

DATABASE_URL
值：你的 Neon 数据库 URL
格式：postgres://user:password@host/database

YOUTUBE_API_KEY
值：你的 YouTube Data API v3 Key
```

### 步骤 5：部署

1. 点击页面底部的 **"Deploy"** 按钮
2. 等待构建和部署完成（3-5 分钟）
3. 部署成功后会显示访问 URL

### 步骤 6：配置自定义域名（可选）

1. 在项目设置中找到 **"Domains"**
2. 点击 **"Add"** 按钮
3. 输入你的域名（如：`analytics.example.com`）
4. 配置 DNS 记录
5. 等待 SSL 证书生成

---

## 🧪 方法 4：通过 GitHub Actions（自动化）

### 步骤 1：创建 GitHub Actions workflow

在本地创建文件 `.github/workflows/vercel-deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  workflow_dispatch:  # 允许手动触发

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 步骤 2：配置 GitHub Secrets

1. 访问：https://github.com/aspendong-collab/youtube-analytics/settings/secrets/actions
2. 点击 **"New repository secret"**
3. 添加以下 Secrets：

**获取 VERCEL_TOKEN**：
```bash
# 在本地执行
vercel login
vercel token
# 复制生成的 token
```

**获取 VERCEL_ORG_ID 和 VERCEL_PROJECT_ID**：
```bash
# 在项目根目录执行
vercel link
cat .vercel/project.json
# 复制 orgId 和 projectId
```

**添加到 GitHub**：
- Secret 1：`VERCEL_TOKEN`，值：从上面获取的 token
- Secret 2：`VERCEL_ORG_ID`，值：从上面获取的 orgId
- Secret 3：`VERCEL_PROJECT_ID`，值：从上面获取的 projectId

### 步骤 3：触发部署

**自动触发**：推送代码到 main 分支

**手动触发**：
1. 访问：https://github.com/aspendong-collab/youtube-analytics/actions
2. 选择 **"Deploy to Vercel"** workflow
3. 点击 **"Run workflow"**
4. 点击 **"Run workflow"** 按钮

---

## ✅ 部署后验证

### 1. 访问生产环境

```
https://youtube-analytics-opal.vercel.app
```

### 2. 测试登录功能

1. 点击登录
2. 输入邮箱和密码
3. 确认登录成功

### 3. 测试关键词拓展功能

1. 登录后，找到左侧导航栏
2. 点击 **"发现"** 菜单
3. 展开后，点击 **"关键词拓展"**
4. 输入关键词（如：健身）
5. 选择语言
6. 点击 **"开始搜索"**
7. 查看搜索结果

### 4. 检查关键功能

- [ ] 页面正常加载
- [ ] 登录功能正常
- [ ] 侧边栏显示完整
- [ ] "发现"菜单可展开
- [ ] "关键词拓展"入口可见
- [ ] 功能页面可访问
- [ ] 关键词输入正常
- [ ] 语言选择正常
- [ ] 搜索功能正常
- [ ] 结果展示正常

---

## 🔧 常见问题排查

### 问题 1：构建失败

**症状**：Build Logs 显示错误

**解决方案**：
1. 查看 Build Logs 中的错误信息
2. 检查环境变量是否配置正确
3. 检查依赖是否安装成功
4. 检查 TypeScript 类型错误

### 问题 2：部署成功但功能不正常

**症状**：页面可访问但功能报错

**解决方案**：
1. 清除浏览器缓存
2. 硬刷新页面（Ctrl + Shift + R）
3. 检查浏览器控制台错误
4. 检查网络请求是否正常

### 问题 3：登录失败

**症状**：无法登录或登录后立即退出

**解决方案**：
1. 检查 `NEXTAUTH_URL` 环境变量
2. 检查 `NEXTAUTH_SECRET` 环境变量
3. 检查数据库连接
4. 查看 Vercel Logs

### 问题 4：API 调用失败

**症状**：关键词搜索或其他 API 请求失败

**解决方案**：
1. 检查 `YOUTUBE_API_KEY` 环境变量
2. 检查 API Key 是否有效
3. 检查 API 配额是否用尽
4. 查看 API 错误信息

---

## 📊 部署时间预估

| 步骤 | 预计时间 |
|------|----------|
| Vercel 控制台操作 | 1-2 分钟 |
| 克隆代码 | 30 秒 |
| 安装依赖 | 1-2 分钟 |
| 构建项目 | 1-2 分钟 |
| 部署到生产环境 | 1 分钟 |
| **总计** | **5-7 分钟** |

---

## 🎯 推荐方案

**最快的方案**：方法 1（Vercel 控制台）
- 无需安装工具
- 操作简单
- 适合新手

**最灵活的方案**：方法 2（命令行）
- 可以自定义配置
- 适合开发者
- 可以集成到 CI/CD

**最稳定的方案**：方法 3（重新创建项目）
- 确保配置正确
- 适合初次部署
- 可以彻底解决问题

**最自动化的方案**：方法 4（GitHub Actions）
- 完全自动化
- 适合持续集成
- 需要额外配置

---

## 💡 快速开始

**如果你是新手**：
1. 使用方法 1（Vercel 控制台）
2. 按照步骤操作
3. 5 分钟内完成

**如果你是开发者**：
1. 使用方法 2（命令行）
2. 执行 `bash scripts/vercel-deploy.sh`
3. 3 分钟内完成

**如果项目不存在**：
1. 使用方法 3（重新创建）
2. 按照配置步骤操作
3. 10 分钟内完成

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Vercel 文档：https://vercel.com/docs
2. 查看项目诊断报告：`VERCEL_DEPLOYMENT_DIAGNOSIS.md`
3. 查看部署指南：`DEPLOYMENT.md`

---

**祝你部署顺利！🚀**
