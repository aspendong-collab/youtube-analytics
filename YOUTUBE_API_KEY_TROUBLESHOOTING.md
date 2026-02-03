# 🔍 YouTube API Key 排查指南

## 📋 问题描述

用户反馈 Vercel 后台已经配置了 YouTube API Key，但代码中没有获取到。

---

## 🔍 排查步骤

### 步骤 1: 检查环境变量 API

部署完成后，访问以下 URL 检查环境变量状态：

```
https://your-project.vercel.app/api/check-env
```

**预期返回**（如果 API Key 已正确配置）:
```json
{
  "environment": "production",
  "hasApiKey": true,
  "apiKeyLength": 39,
  "apiKeyPrefix": "AIzaSyBgo...",
  "allEnvKeys": ["YOUTUBE_API_KEY"],
  "vercelEnv": "production",
  "timestamp": "2024-02-03T12:00:00.000Z"
}
```

**如果返回**（API Key 未配置）:
```json
{
  "environment": "production",
  "hasApiKey": false,
  "apiKeyLength": 0,
  "apiKeyPrefix": "...",
  "allEnvKeys": [],
  "vercelEnv": "production",
  "timestamp": "2024-02-03T12:00:00.000Z"
}
```

---

## 🔧 解决方案

### 解决方案 1: 检查环境变量配置

1. **访问 Vercel Dashboard**
   - URL: https://vercel.com/dashboard
   - 选择你的项目

2. **进入项目设置**
   - 点击项目名称
   - 进入 **Settings** 标签

3. **检查环境变量**
   - 点击 **Environment Variables**
   - 查找 `YOUTUBE_API_KEY` 变量

4. **确认配置正确**
   - 变量名: `YOUTUBE_API_KEY`（注意大小写）
   - 值: 你的 YouTube API Key
   - 环境: 选择 **Production**、**Preview**、**Development**（或选择 All）

### 解决方案 2: 重新添加环境变量

如果环境变量已配置但 `hasApiKey` 为 `false`：

1. **删除现有环境变量**
   - 在 Vercel Dashboard 中删除 `YOUTUBE_API_KEY`

2. **重新添加环境变量**
   - 点击 **Add New**
   - 变量名: `YOUTUBE_API_KEY`
   - 值: `AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY`
   - 环境: 选择 **All**（或分别添加到 Production、Preview、Development）

3. **重新部署**
   - 进入 **Deployments** 标签
   - 点击最新部署
   - 点击 **Redeploy**
   - 等待部署完成

### 解决方案 3: 检查环境变量作用域

**问题**: 环境变量可能只配置在 Development 环境，但 Production 环境没有。

**解决方法**:
1. 进入 **Environment Variables**
2. 查看 `YOUTUBE_API_KEY` 的环境设置
3. 确保至少选择了 **Production**
4. 推荐选择 **All**（适用于所有环境）

### 解决方案 4: 验证 API Key 是否有效

即使环境变量正确配置，API Key 可能无效或过期。

**验证步骤**:
1. 访问 Google Cloud Console
2. 进入 **API & Services > Credentials**
3. 查看你的 API Key
4. 确认状态为 **Active**
5. 检查配额是否充足

**测试 API Key**:
```bash
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=YOUR_API_KEY"
```

---

## 📊 日志分析

### 查看部署日志

1. **访问 Vercel Dashboard**
2. 进入 **Deployments** 标签
3. 点击最新部署
4. 查看 **Build Logs**

### 查找 API Key 相关日志

在日志中搜索：
```
YOUTUBE_API_KEY
API Key
检查 API Key
```

**期望看到**:
```
[API /api/videos] 检查 API Key: {
  hasApiKey: true,
  apiKeyLength: 39,
  envKeys: ['YOUTUBE_API_KEY']
}
```

**如果看到**:
```
[API /api/videos] 检查 API Key: {
  hasApiKey: false,
  apiKeyLength: 0,
  envKeys: []
}
```

说明环境变量未正确配置。

---

## 🐛 常见问题

### 问题 1: 环境变量修改后不生效

**原因**: Vercel 需要重新部署才能使环境变量生效

**解决方法**:
1. 修改环境变量
2. 触发重新部署
3. 等待部署完成

### 问题 2: 环境变量名称大小写错误

**错误**: `youtube_api_key`（全小写）
**正确**: `YOUTUBE_API_KEY`（全大写）

**解决方法**:
1. 删除错误的变量名
2. 添加正确的变量名
3. 重新部署

### 问题 3: 环境变量作用域配置错误

**错误**: 只配置在 Development 环境
**正确**: 至少配置在 Production 环境

**解决方法**:
1. 编辑环境变量
2. 选择正确的环境
3. 重新部署

### 问题 4: API Key 无效或配额不足

**表现**: `hasApiKey` 为 `true`，但 API 调用返回 403 错误

**解决方法**:
1. 检查 Google Cloud Console
2. 验证 API Key 状态
3. 检查配额使用情况
4. 如有必要，申请增加配额

---

## ✅ 验证清单

完成以下检查，确保 API Key 正确配置：

- [ ] 访问 `/api/check-env` 确认 `hasApiKey` 为 `true`
- [ ] Vercel Dashboard 中环境变量名称为 `YOUTUBE_API_KEY`
- [ ] 环境变量值正确
- [ ] 环境变量作用域包含 Production
- [ ] 已重新部署
- [ ] 部署日志显示 API Key 已加载
- [ ] API Key 在 Google Cloud Console 中状态为 Active
- [ ] API Key 配额充足

---

## 🚀 完整验证流程

### 1. 检查环境变量

```bash
curl https://your-project.vercel.app/api/check-env
```

### 2. 确认返回值

**成功**:
```json
{
  "hasApiKey": true,
  "apiKeyLength": 39
}
```

**失败**:
```json
{
  "hasApiKey": false,
  "apiKeyLength": 0
}
```

### 3. 如果失败，重新配置环境变量

按照上述"解决方案"部分操作。

### 4. 重新部署

```bash
# 方法 1: Vercel Dashboard
# 进入 Deployments > 点击最新部署 > Redeploy

# 方法 2: Git
git commit --allow-empty -m "trigger: 重新部署以加载环境变量"
git push origin main
```

### 5. 再次检查

```bash
curl https://your-project.vercel.app/api/check-env
```

### 6. 测试添加视频功能

访问 `/videos/add`，尝试添加视频。

---

## 📚 相关文档

- [Vercel 环境变量文档](https://vercel.com/docs/projects/environment-variables)
- [Google Cloud Console](https://console.cloud.google.com/)
- [YouTube Data API v3](https://developers.google.com/youtube/v3)

---

## 🎯 下一步

完成环境变量配置后：

1. **验证 API Key**: 访问 `/api/check-env`
2. **测试添加视频**: 访问 `/videos/add`
3. **检查日志**: 查看 Vercel 部署日志
4. **监控性能**: 观察 API 调用成功率

---

**排查完成时间**: _____

**排查结果**: [ ] API Key 已配置 [ ] API Key 未配置

**备注**: _________________________
