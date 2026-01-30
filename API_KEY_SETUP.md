# YouTube API Key 配置指南

## 问题描述

当你尝试添加视频时，如果看到以下错误：

> "平台未配置 YouTube API Key"

这意味着系统缺少 YouTube Data API 的访问密钥。

## 解决方案

### 1. 获取 YouTube API Key

按照以下步骤获取 YouTube API Key：

#### 步骤 1：访问 Google Cloud Console
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 登录你的 Google 账号
3. 创建一个新项目或选择现有项目

#### 步骤 2：启用 YouTube Data API v3
1. 在左侧菜单中，点击 "API 和服务" > "库"
2. 搜索 "YouTube Data API v3"
3. 点击进入并点击 "启用"

#### 步骤 3：创建 API 密钥
1. 在左侧菜单中，点击 "API 和服务" > "凭据"
2. 点击 "创建凭据" > "API 密钥"
3. 复制生成的 API Key（格式：`AIza...`）

#### 步骤 4：限制 API Key（推荐）
1. 点击创建的 API Key
2. 在 "应用程序限制" 中，选择 "IP 地址"
3. 添加你的服务器 IP 地址或使用 "无限制"（仅用于测试）
4. 在 "API 限制" 中，选择 "限制密钥"
5. 搜索并选择 "YouTube Data API v3"
6. 点击 "保存"

### 2. 配置 API Key

#### 本地开发配置

在项目根目录创建 `.env.local` 文件：

```bash
YOUTUBE_API_KEY=AIzaSy...你的API密钥
```

⚠️ **注意**：
- `.env.local` 文件不会被提交到 Git
- 确保 `.gitignore` 包含 `.env.local`

#### Vercel 部署配置

1. 访问 Vercel 项目设置
2. 进入 "Environment Variables"
3. 添加新的环境变量：
   - **Name**: `YOUTUBE_API_KEY`
   - **Value**: 粘贴你的 YouTube API Key
4. 选择环境：Production / Preview / Development
5. 点击 "Save"
6. 重新部署项目

### 3. 验证配置

#### 本地开发验证

1. 停止开发服务器（Ctrl+C）
2. 重新启动开发服务器：
   ```bash
   coze dev
   ```
3. 尝试添加视频

#### Vercel 部署验证

1. 等待部署完成
2. 访问应用并尝试添加视频

## 常见问题

### Q1: 为什么需要 YouTube API Key？

**A**: 系统需要调用 YouTube Data API 来获取视频信息（标题、描述、缩略图等）和统计数据（播放量、点赞数、评论数）。YouTube API Key 是访问这些数据的必要凭证。

### Q2: YouTube API Key 有配额限制吗？

**A**: 是的。YouTube Data API v3 有以下配额：
- 每日配额：10,000 单位
- 每次获取视频信息消耗：1 单位
- 每次获取统计数据消耗：1 单位

如果你监控大量视频，可能需要申请增加配额。

### Q3: 如何查看 API 使用情况？

**A**:
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 "API 和服务" > "配额"
3. 查看 YouTube Data API v3 的配额使用情况

### Q4: API Key 可以共享吗？

**A**: 可以。本平台使用环境变量配置 API Key，所有用户共享同一个配置。这是推荐的做法，因为：
- 更容易管理
- 更安全（API Key 不暴露在前端）
- 统一监控使用情况

### Q5: 如何保护 API Key？

**A**:
1. 限制 API Key 的使用范围（IP 地址、API 限制）
2. 定期轮换 API Key（每 3-6 个月）
3. 监控 API 使用情况，发现异常立即撤销
4. 不要将 API Key 提交到代码仓库

## 测试 API Key

你可以使用以下命令测试你的 API Key 是否有效：

```bash
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=YOUR_API_KEY"
```

如果返回视频信息，说明 API Key 配置正确。

## 相关链接

- [YouTube Data API 文档](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API 配额说明](https://developers.google.com/youtube/v3/determine_quota_cost)
- [问题排查指南](./TROUBLESHOOTING.md)
- [使用指南](./USAGE_GUIDE.md)
