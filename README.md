# YouTube Analytics Platform

一个基于 [Next.js 16](https://nextjs.org) + [shadcn/ui](https://ui.shadcn.com) 的 YouTube 数据分析与优化平台，提供数据总览、视频监控、深度分析、优化建议等功能。

## 功能特性

- 📊 **数据总览** - 查看关键指标和趋势分析
- 🎬 **视频监控** - 监控视频表现和互动数据
- 📈 **深度分析** - 多维度数据分析和可视化
- 💡 **优化建议** - 基于数据的智能建议
- 🔥 **热点趋势** - 发现热门内容和趋势
- ⚙️ **设置管理** - 个性化配置数据采集偏好
- 🔄 **视频信息自动获取** - 从 YouTube URL 自动提取视频信息
- 👥 **多用户支持** - 所有用户共享平台资源，个性化配置采集偏好

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 包管理器

### 启动开发服务器

```bash
coze dev
```

启动后，在浏览器中打开 [http://localhost:5000](http://localhost:5000) 查看。

开发服务器支持热更新，修改代码后页面会自动刷新。

### 构建生产版本

```bash
coze build
```

### 启动生产服务器

```bash
coze start
```

### 部署到 Vercel

详细的部署步骤请参考 [Vercel 部署指南](./VERCEL_SETUP_GUIDE.md)。

## 配置 YouTube API Key

**重要：本平台使用环境变量配置 YouTube API Key，所有用户共享使用。**

### 获取 YouTube API Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建或选择一个项目
3. 搜索并启用 "YouTube Data API v3"
4. 创建凭据 → API 密钥
5. 复制 API Key

### 在 Vercel 中配置

1. 访问 Vercel 项目设置
2. 进入 "Environment Variables" 标签
3. 添加环境变量：
   - Name: `YOUTUBE_API_KEY`
   - Value: （粘贴你的 API Key）
4. 选择环境：Production / Preview / Development
5. 点击 "Save"
6. 重新部署项目

### 本地开发配置

在项目根目录创建 `.env.local` 文件：

```bash
YOUTUBE_API_KEY=你的API密钥
```

⚠️ **注意：** `.env.local` 文件不会被提交到 Git，请在本地自行配置。

## 多用户使用说明

本平台支持多用户同时访问和使用：

### 共享资源
- YouTube API Key：由管理员统一配置，所有用户共享
- 数据库：所有用户的数据存储在同一个数据库中
- 平台功能：所有用户可以使用所有功能

### 个性化配置
用户可以在 "设置管理 > 数据采集" 中配置：
- 自动采集计划
- 采集间隔
- 数据指标选择

这些配置保存在用户的浏览器本地存储中，不会影响其他用户。

## 问题排查

如果遇到视频信息获取失败等问题，请查看详细的 [问题排查指南](./TROUBLESHOOTING.md)。

常见问题：
- ❌ **平台未配置 API Key** - 联系管理员配置
- ❌ **API Key 无效** - 管理员检查配置
- ❌ **视频链接错误** - 使用正确的 YouTube 链接格式
- ❌ **视频不存在** - 检查视频是否已被删除

## 项目结构# Auto-trigger deployment
