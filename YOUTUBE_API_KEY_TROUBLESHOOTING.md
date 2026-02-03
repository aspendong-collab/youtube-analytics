# 🔴 YouTube API Key 权限问题排查指南

## 问题描述

在 Vercel 部署后，仍然出现以下错误：
- **"API Key 权限不足或配额已用尽"**
- **HTTP 403 错误**

---

## 🔍 问题诊断

### 可能的原因

1. ❌ **API Key 未启用 YouTube Data API v3**
2. ❌ **API Key 的应用限制设置不正确**
3. ❌ **API Key 的 API 限制未配置**
4. ❌ **配额已用完**
5. ❌ **环境变量未正确配置**

---

## 🧪 第一步：验证 API Key 有效性

### 运行验证脚本

```bash
chmod +x scripts/verify-youtube-api-key.sh
./scripts/verify-youtube-api-key.sh
```

### 预期结果

**如果 API Key 正常：**
```
✅ 搜索 API 正常
✅ 视频 API 正常
✅ 频道 API 正常
✅ 所有 API 测试通过 - API Key 正常
```

**如果 API Key 有问题：**
```
❌ 搜索 API 失败
HTTP 状态码: 403
响应内容: { "error": { "code": 403, "message": "...", ... } }
```

---

## 🔧 第二步：检查 Google Cloud Console 配置

### 1. 访问 Google Cloud Console

```
https://console.cloud.google.com/
```

### 2. 进入 API 和服务

1. 点击左上角菜单 ☰
2. 选择 **API 和服务 > 凭证**

### 3. 检查 API Key 配置

#### A. 检查 YouTube Data API v3 是否启用

1. 进入 **API 和服务 > 库**
2. 搜索 "YouTube Data API v3"
3. 点击进入
4. 确保显示 **"已启用"** 状态

**如果未启用：**
- 点击 **"启用"** 按钮

#### B. 检查 API Key 的应用限制

1. 进入 **API 和服务 > 凭证**
2. 找到你的 API Key
3. 点击 **编辑图标** ✏️
4. 检查 **应用限制** 部分

**正确的配置：**

**选项 1: 无限制（不推荐，但用于测试）**
- 选择 **"无限制"**
- 点击 **"保存"**

**选项 2: HTTP 引用（推荐）**
- 选择 **"HTTP 引用"**
- 添加以下域名：
  ```
  *.vercel.app
  *.yourdomain.com
  ```
- 点击 **"保存"**

**选项 3: IP 地址（用于 Vercel）**
- 选择 **"IP 地址"**
- 添加 Vercel 的 IP 范围（不推荐，因为 Vercel IP 会变化）

**注意**：如果你配置了严格的限制（如仅允许特定域名或 IP），确保 Vercel 的域名在其中。

#### C. 检查 API Key 的 API 限制

1. 在编辑 API Key 页面
2. 找到 **API 限制** 部分

**正确的配置：**

**选项 1: 不限制任何 API（不推荐，但用于测试）**
- 选择 **"不限制任何 API"**
- 点击 **"保存"**

**选项 2: YouTube Data API v3（推荐）**
- 选择 **"限制 API"**
- 在搜索框中输入 **"YouTube Data API v3"**
- 选择并添加
- 点击 **"保存"**

#### D. 检查配额使用情况

1. 进入 **API 和服务 > 配额**
2. 查看配额使用情况

**常见配额限制：**
- **每日配额**: 10,000 单位/天
- **搜索请求**: 100 单位/次
- **视频详情**: 1 单位/次
- **频道详情**: 1 单位/次

**如何计算配额：**
```
一次搜索（50个结果）= 100 单位
50个视频详情 = 50 单位
50个频道详情 = 50 单位
总计 = 200 单位
```

**如果配额已用完：**
- 等待第二天配额重置
- 或申请增加配额

---

## 🚀 第三步：验证 Vercel 环境变量配置

### 1. 访问 Vercel 项目

```
https://vercel.com/dashboard
```

### 2. 进入项目设置

1. 找到项目 `youtube-analytics`
2. 点击 **Settings** 标签
3. 点击左侧 **Environment Variables**

### 3. 检查环境变量

确保以下环境变量已配置：

| 变量名 | 值 | 必需 |
|--------|-----|------|
| `YOUTUBE_API_KEY` | `AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY` | ✅ 是 |
| `PGDATABASE_URL` | 你的数据库连接字符串 | ✅ 是 |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | ✅ 是 |
| `NEXTAUTH_SECRET` | 随机密钥 | ✅ 是 |

### 4. 重新部署

修改环境变量后，必须重新部署：

1. 进入 **Deployments** 标签
2. 点击右上角 **Redeploy**
3. 选择 **Redeploy specific commit**
4. 选择最新的 commit
5. 点击 **Redeploy**

---

## 🧪 第四步：在 Vercel 上测试

### 1. 等待部署完成

确保显示 **"Ready"** 状态

### 2. 测试 API 端点

在浏览器中访问：
```
https://your-project.vercel.app/api/discovery/search?mode=keyword&q=tech&maxResults=5
```

### 3. 检查响应

**成功响应：**
```json
{
  "videos": [
    {
      "id": "...",
      "title": "...",
      "viewCount": 12345,
      ...
    }
  ],
  "total": 5,
  "query": "tech"
}
```

**失败响应：**
```json
{
  "error": "API 权限不足或配额已用完",
  "status": 403
}
```

### 4. 查看 Vercel 日志

1. 进入 **Deployments** 标签
2. 点击最新的部署
3. 点击 **Function Logs**
4. 查看 API 路由的日志

---

## 🔧 常见问题解决

### 问题 1: 403 错误 - 权限不足

**症状：**
```
{ "error": { "code": 403, "message": "The request cannot be completed because you have exceeded your quota." } }
```

**解决方案：**
1. 检查配额使用情况
2. 等待配额重置
3. 或申请增加配额

### 问题 2: 403 错误 - 未启用 API

**症状：**
```
{ "error": { "code": 403, "message": "YouTube Data API v3 has not been used in project..." } }
```

**解决方案：**
1. 在 Google Cloud Console 启用 YouTube Data API v3
2. 重新部署

### 问题 3: 403 错误 - 应用限制

**症状：**
```
{ "error": { "code": 403, "message": "The request cannot be completed because you have exceeded your quota." } }
```

**解决方案：**
1. 检查 API Key 的应用限制
2. 确保 Vercel 域名在允许列表中
3. 或临时设置为 "无限制"

### 问题 4: 环境变量未生效

**症状：**
API 返回 "未配置 YouTube API Key"

**解决方案：**
1. 检查 Vercel 环境变量是否正确配置
2. 重新部署项目
3. 确保变量名拼写正确（区分大小写）

---

## 📝 快速检查清单

使用以下清单快速排查问题：

- [ ] API Key 已复制并粘贴到 Vercel 环境变量
- [ ] YouTube Data API v3 已在 Google Cloud Console 中启用
- [ ] API Key 的应用限制允许 Vercel 域名
- [ ] API Key 的 API 限制包含 YouTube Data API v3
- [ ] 配额未用完
- [ ] 环境变量名称拼写正确（区分大小写）
- [ ] 修改环境变量后已重新部署
- [ ] 部署状态为 "Ready"

---

## 🚀 推荐配置

### 最安全的配置（生产环境）

**Google Cloud Console:**
- ✅ YouTube Data API v3 已启用
- ✅ 应用限制: HTTP 引用（允许 *.vercel.app）
- ✅ API 限制: 限制为 YouTube Data API v3

**Vercel:**
- ✅ YOUTUBE_API_KEY 已配置
- ✅ 其他环境变量已配置

### 最宽松的配置（测试/开发）

**Google Cloud Console:**
- ✅ YouTube Data API v3 已启用
- ✅ 应用限制: 无限制
- ✅ API 限制: 不限制任何 API

**Vercel:**
- ✅ YOUTUBE_API_KEY 已配置
- ✅ 其他环境变量已配置

---

## 📞 需要帮助？

如果以上步骤都无法解决问题：

1. **查看 Google Cloud Console 日志**
   - 进入 **API 和服务 > 仪表盘**
   - 查看 API 调用日志

2. **查看 Vercel 日志**
   - 进入项目的 **Function Logs**
   - 查看详细的错误信息

3. **联系 Google 支持**
   - https://support.google.com/googlecloud/

---

## 📚 相关文档

- [YouTube Data API v3 文档](https://developers.google.com/youtube/v3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [API Key 最佳实践](https://support.google.com/cloud/answer/6310037)

---

**最后更新：2024-02-03**
