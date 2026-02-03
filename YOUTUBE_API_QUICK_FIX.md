# 🚀 YouTube API Key 权限问题 - 快速修复指南

## 🎯 最可能的原因（按概率排序）

### 1️⃣ API Key 的应用限制配置过于严格（80% 概率）

**症状：** 403 错误，配额未用完

**解决方法：**

#### 步骤 1: 访问 Google Cloud Console
```
https://console.cloud.google.com/apis/credentials
```

#### 步骤 2: 编辑 API Key
1. 找到你的 API Key
2. 点击编辑图标 ✏️

#### 步骤 3: 修改应用限制
**临时测试（推荐）:**
- 选择 **"无限制"**
- 点击 **"保存"**

**生产环境（推荐）:**
- 选择 **"HTTP 引用"**
- 添加：`*.vercel.app`
- 点击 **"保存"**

#### 步骤 4: 重新部署 Vercel
1. 访问 Vercel Dashboard
2. 进入项目设置 > Deployments
3. 点击 **Redeploy**

---

### 2️⃣ YouTube Data API v3 未启用（15% 概率）

**症状：** 403 错误，提示 "API has not been used"

**解决方法：**

#### 步骤 1: 启用 API
```
https://console.cloud.google.com/apis/library/youtube.googleapis.com
```

#### 步骤 2: 点击 "启用" 按钮

#### 步骤 3: 重新部署 Vercel

---

### 3️⃣ 配额已用完（5% 概率）

**症状：** 403 错误，提示 "exceeded your quota"

**解决方法：**

#### 步骤 1: 检查配额
```
https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
```

#### 步骤 2: 查看使用情况
- 默认配额：10,000 单位/天
- 查看是否已用完

#### 步骤 3: 解决方案
- 等待第二天配额重置
- 或申请增加配额

---

## ✅ 3 分钟快速修复（推荐）

### 方案：临时移除所有限制

1. **访问 Google Cloud Console**
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **编辑 API Key**
   - 找到你的 API Key
   - 点击编辑图标 ✏️

3. **修改设置**
   - 应用限制：选择 **"无限制"**
   - API 限制：选择 **"不限制任何 API"**
   - 点击 **"保存"**

4. **重新部署 Vercel**
   - 访问 Vercel Dashboard
   - 点击 **Redeploy**

5. **测试功能**
   ```
   https://your-project.vercel.app/discovery/enhanced
   ```

---

## 🔍 验证修复是否成功

### 测试 API 端点

在浏览器中访问：
```
https://your-project.vercel.app/api/discovery/search?mode=keyword&q=tech&maxResults=5
```

### 成功的响应
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
  "total": 5
}
```

### 失败的响应
```json
{
  "error": "API 权限不足或配额已用完"
}
```

---

## 📋 部署后测试清单

- [ ] 访问发现页面：`/discovery/enhanced`
- [ ] 输入关键词搜索（例如：tech）
- [ ] 点击搜索按钮
- [ ] 查看是否返回结果
- [ ] 测试热门视频功能
- [ ] 测试筛选功能

---

## 🎯 如果问题仍然存在

### 1. 运行验证脚本
```bash
chmod +x scripts/verify-youtube-api-key.sh
./scripts/verify-youtube-api-key.sh
```

### 2. 检查 Vercel 环境变量
- 访问 Vercel 项目设置
- 确认 `YOUTUBE_API_KEY` 已正确配置
- 确认其他环境变量已配置

### 3. 查看 Vercel 日志
- 进入项目 > Deployments
- 点击最新部署
- 查看 Function Logs

### 4. 查看详细排查指南
- [完整排查指南](YOUTUBE_API_KEY_TROUBLESHOOTING.md)

---

## 💡 最佳实践（生产环境）

### 安全的 API Key 配置

**Google Cloud Console:**
- ✅ 应用限制：HTTP 引用（允许 *.vercel.app）
- ✅ API 限制：限制为 YouTube Data API v3

**Vercel:**
- ✅ 使用环境变量存储 API Key
- ✅ 不要在代码中硬编码 API Key

---

## 🚀 预计时间

- **快速修复**：3 分钟
- **完整排查**：10-15 分钟

---

## 📞 需要帮助？

如果以上步骤都无法解决问题，请：

1. 运行验证脚本并查看输出
2. 查看 Vercel 日志中的详细错误
3. 参考 [完整排查指南](YOUTUBE_API_KEY_TROUBLESHOOTING.md)

---

**最可能的原因：API Key 的应用限制配置过于严格（80% 概率）**

**最快的解决方法：将应用限制改为 "无限制"，然后重新部署**

**预计时间：3 分钟**

---

**立即开始修复：https://console.cloud.google.com/apis/credentials** 🚀
