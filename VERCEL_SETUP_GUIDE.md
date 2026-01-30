# Vercel 环境变量配置指南

## 配置 YouTube API Key

### 方法一：通过 Vercel 控制台配置（推荐）

1. **登录 Vercel**
   - 访问 https://vercel.com/
   - 登录你的账号

2. **进入项目设置**
   - 选择你的项目 `youtube-analytics`
   - 点击 **Settings** 标签

3. **添加环境变量**
   - 在左侧菜单点击 **Environment Variables**
   - 点击 **Add** 按钮

4. **配置 YOUTUBE_API_KEY**
   - Key: `YOUTUBE_API_KEY`
   - Value: 你的 YouTube API Key（从 Google Cloud Console 获取）
   - Environment: 选择所有环境（Production、Preview、Development）
   - 点击 **Save**

5. **重新部署**
   - 点击 **Deployments** 标签
   - 找到最新的部署，点击右侧的 **...** 按钮
   - 选择 **Redeploy**
   - 等待部署完成

### 方法二：通过 Vercel CLI 配置

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **设置环境变量**
   ```bash
   vercel env add YOUTUBE_API_KEY
   ```

4. **选择环境**
   - Production: 选择 `production`
   - Preview: 选择 `preview`
   - Development: 选择 `development`

5. **重新部署**
   ```bash
   vercel --prod
   ```

### 方法三：通过 vercel.json 配置

1. **在项目根目录创建或编辑 `vercel.json`**
   ```json
   {
     "build": {
       "env": {
         "YOUTUBE_API_KEY": "@youtube-api-key"
       }
     }
   }
   ```

2. **在 Vercel 控制台添加 secret**
   - Settings > Environment Variables
   - 添加 Key: `youtube-api-key`（不带 YOUTUBE_ 前缀）
   - 选择 Secret 类型
   - 点击 Save

3. **重新部署**

## 验证配置

### 检查环境变量是否生效

1. **查看部署日志**
   - Deployments 标签
   - 点击最新部署
   - 查看是否有环境变量加载成功

2. **测试 API**
   - 访问 https://your-domain.vercel.app/api/video-info?url=YOUR_TEST_VIDEO_URL
   - 应该能正常获取视频信息

## 配置优先级说明

系统会按以下优先级使用 YouTube API Key：

1. **Cookie 配置**（最高优先级）
   - 用户在"设置管理" > "数据采集"中配置
   - 服务端可读取
   - 立即生效

2. **Vercel 环境变量**（备用方案）
   - `YOUTUBE_API_KEY` 环境变量
   - 适合生产环境
   - 所有用户共享

3. **无配置**（错误状态）
   - 返回配置错误提示

## 推荐配置方案

### 方案 A：个人使用（推荐）
- 使用界面配置（Cookie + LocalStorage）
- 优势：即时生效，无需重新部署
- 适用：个人账号，只有你使用

### 方案 B：团队使用/生产环境（推荐）
- 配置 Vercel 环境变量
- 优势：所有用户共享，统一管理
- 适用：多人协作，团队项目

### 方案 C：混合配置（最灵活）
- 配置 Vercel 环境变量作为默认值
- 用户可以覆盖配置（Cookie 优先级更高）
- 优势：既有默认值，又支持个性化

## 常见问题

### Q1: 配置后还是报错"未配置 YouTube API Key"？
**A:**
1. 确认环境变量名称是否正确：`YOUTUBE_API_KEY`（大写，下划线）
2. 确认已经重新部署
3. 检查部署日志中是否显示环境变量加载成功

### Q2: 环境变量配置后，还需要在界面配置吗？
**A:**
- 如果配置了 Vercel 环境变量，可以直接使用，无需界面配置
- 如果在界面配置了，会覆盖环境变量（Cookie 优先级更高）

### Q3: 如何查看当前使用的 API Key？
**A:**
- 打开浏览器开发者工具（F12）
- Application > Cookies
- 查看 `app_settings` Cookie 的值
- 或在 Console 中执行：`localStorage.getItem('youtube_analytics_settings')`

### Q4: API Key 泄露了怎么办？
**A:**
1. 立即去 Google Cloud Console 撤销旧的 API Key
2. 创建新的 API Key
3. 在 Vercel 中更新环境变量
4. 重新部署
5. 清除所有用户的 Cookie 和 LocalStorage（需要用户手动操作）

## 获取 YouTube API Key

1. 访问 https://console.cloud.google.com/
2. 创建新项目或选择现有项目
3. 搜索并启用 "YouTube Data API v3"
4. 创建 API 密钥
5. 复制 API Key
6. 按照上述方法配置到 Vercel

## 注意事项

⚠️ **重要提醒**：
- 不要将 API Key 提交到 Git 仓库
- 不要在前端代码中硬编码 API Key
- 定期轮换 API Key（每 3-6 个月）
- 限制 API Key 的使用配额和权限
- 在 Google Cloud Console 中监控 API 使用情况

## 相关链接

- Vercel 环境变量文档: https://vercel.com/docs/projects/environment-variables
- Google Cloud Console: https://console.cloud.google.com/
- YouTube Data API 文档: https://developers.google.com/youtube/v3
