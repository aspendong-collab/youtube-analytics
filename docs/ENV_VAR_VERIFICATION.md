# YouTube API Key 配置验证指南

## 问题描述

在 Vercel 中配置了 5 个 YouTube API Key，但系统只识别到 1 个 Key。

## 原因分析

系统支持以下环境变量格式：

### 1. YOUTUBE_API_KEY_N 格式（推荐）
```
YOUTUBE_API_KEY_1=your_first_api_key
YOUTUBE_API_KEY_2=your_second_api_key
YOUTUBE_API_KEY_3=your_third_api_key
YOUTUBE_API_KEY_4=your_fourth_api_key
YOUTUBE_API_KEY_5=your_fifth_api_key
```

### 2. YOUTUBE_API_KEY（单个 Key）
```
YOUTUBE_API_KEY=your_api_key
```

### 3. YOUTUBE_API_KEYS（多个 Key）
```
YOUTUBE_API_KEYS=["key1","key2","key3"]
```

**优先级**: YOUTUBE_API_KEY_N > YOUTUBE_API_KEYS > YOUTUBE_API_KEY

## 验证步骤

### 方法 1: 使用环境变量检查 API

1. **访问测试工具页面**
   - URL: `https://your-domain.com/test-tools`
   - 或访问本地: `http://localhost:5000/test-tools`

2. **点击"检查环境变量"按钮**
   - 这会显示所有已配置的 YouTube API Key

3. **查看结果**

**预期结果（5 个 Key 已配置）**:
```json
{
  "success": true,
  "youtubeApiKeys": {
    "format": "YOUTUBE_API_KEY_N",
    "totalConfigured": 5,
    "keys": [
      {
        "name": "YOUTUBE_API_KEY_1",
        "prefix": "AIzaSyBgo5",
        "suffix": "FcsjY",
        "length": 39,
        "isConfigured": true
      },
      {
        "name": "YOUTUBE_API_KEY_2",
        "prefix": "AIzaSyCgo5",
        "suffix": "GdtjZ",
        "length": 39,
        "isConfigured": true
      },
      ...
    ]
  }
}
```

**实际结果（只配置了 1 个 Key）**:
```json
{
  "success": true,
  "youtubeApiKeys": {
    "format": "YOUTUBE_API_KEY_N",
    "totalConfigured": 0,
    "keys": [
      {
        "name": "YOUTUBE_API_KEY_1",
        "isConfigured": false
      },
      {
        "name": "YOUTUBE_API_KEY_2",
        "isConfigured": false
      },
      ...
    ]
  },
  "otherFormats": {
    "YOUTUBE_API_KEY": {
      "isConfigured": true,
      "prefix": "AIzaSyBgo5",
      "suffix": "FcsjY",
      "length": 39
    }
  }
}
```

### 方法 2: 使用 Key 池状态 API

```bash
curl https://your-domain.com/api/youtube/key-pool/status
```

**预期结果（5 个 Key）**:
```json
{
  "success": true,
  "data": {
    "totalKeys": 5,
    "totalQuota": 50000,
    "totalUsed": 0,
    "totalAvailable": 50000
  }
}
```

### 方法 3: 查看服务器日志

在 Vercel Dashboard 中：
1. 进入项目: youtube-analytics
2. 点击最新部署
3. 查看 Function Logs

查找以下日志：
```
[YoutubeApiKeyPool] 开始从环境变量读取 YouTube API Key...
[YoutubeApiKeyPool] 检查 YOUTUBE_API_KEY_N 格式 (N = 1 to 20)
[YoutubeApiKeyPool] ✓ 找到 YOUTUBE_API_KEY_1: AIzaSyBgo5...
[YoutubeApiKeyPool] ✓ 找到 YOUTUBE_API_KEY_2: AIzaSyCgo5...
[YoutubeApiKeyPool] ✓ 找到 YOUTUBE_API_KEY_3: AIzaSyDgo5...
[YoutubeApiKeyPool] ✓ 找到 YOUTUBE_API_KEY_4: AIzaSyEgo5...
[YoutubeApiKeyPool] ✓ 找到 YOUTUBE_API_KEY_5: AIzaSyFgo5...
[YoutubeApiKeyPool] 通过 YOUTUBE_API_KEY_N 格式找到 5 个 Key
[YoutubeApiKeyPool] ✓ 已初始化 5 个 YouTube API Key
[YoutubeApiKeyPool] ✓ 总配额: 50000, 每日可用
```

## Vercel 环境变量配置步骤

### 1. 打开 Vercel Dashboard

访问: https://vercel.com/dashboard

### 2. 选择项目

选择: youtube-analytics

### 3. 进入环境变量设置

**Settings** > **Environment Variables**

### 4. 添加环境变量

**注意**: 环境变量名称必须完全匹配（区分大小写）

```
环境变量名            环境变量值
──────────────────────────────────────────────────────
YOUTUBE_API_KEY_1    AIzaSyBgo5...（您的第一个 Key）
YOUTUBE_API_KEY_2    AIzaSyCgo5...（您的第二个 Key）
YOUTUBE_API_KEY_3    AIzaSyDgo5...（您的第三个 Key）
YOUTUBE_API_KEY_4    AIzaSyEgo5...（您的第四个 Key）
YOUTUBE_API_KEY_5    AIzaSyFgo5...（您的第五个 Key）
```

**重要提示**:
- ✅ 环境变量名必须是 `YOUTUBE_API_KEY_1`（注意下划线和数字）
- ✅ 数字必须是连续的（1, 2, 3, 4, 5）
- ✅ 不能跳过数字（不能是 1, 3, 5）
- ❌ 不能使用 `YOUTUBE_API_KEY_01`（不能有前导零）
- ❌ 不能使用 `YOUTUBE_API_KEY1`（必须有下划线）

### 5. 保存环境变量

点击 **Save** 按钮

### 6. 重新部署

**重要**: 添加或修改环境变量后，必须重新部署才能生效

**方法 1: 通过 Vercel Dashboard**
- 进入 **Deployments** 标签
- 找到最新部署
- 点击 **...** > **Redeploy**

**方法 2: 通过 Git**
- 推送一个新的提交
- Vercel 会自动触发部署

## 常见配置错误

### 错误 1: 环境变量名称错误

❌ **错误**:
```
YOUTUBE_APIKEY_1=xxx
YOUTUBE_API_KEY1=xxx
Youtube_Api_Key_1=xxx
```

✅ **正确**:
```
YOUTUBE_API_KEY_1=xxx
YOUTUBE_API_KEY_2=xxx
```

### 错误 2: 数字不连续

❌ **错误**:
```
YOUTUBE_API_KEY_1=xxx
YOUTUBE_API_KEY_3=xxx  # 跳过了 2
YOUTUBE_API_KEY_5=xxx  # 跳过了 4
```

✅ **正确**:
```
YOUTUBE_API_KEY_1=xxx
YOUTUBE_API_KEY_2=xxx
YOUTUBE_API_KEY_3=xxx
YOUTUBE_API_KEY_4=xxx
YOUTUBE_API_KEY_5=xxx
```

### 错误 3: 混用格式

❌ **错误**:
```
YOUTUBE_API_KEY_1=xxx
YOUTUBE_API_KEY=xxx  # 混用了两种格式
```

✅ **正确**:
```
YOUTUBE_API_KEY_1=xxx
YOUTUBE_API_KEY_2=xxx
YOUTUBE_API_KEY_3=xxx
YOUTUBE_API_KEY_4=xxx
YOUTUBE_API_KEY_5=xxx
```

### 错误 4: 未重新部署

❌ **错误**:
```
1. 添加环境变量
2. 保存
3. 直接测试（❌ 环境变量未生效）
```

✅ **正确**:
```
1. 添加环境变量
2. 保存
3. 重新部署（✅ 环境变量生效）
4. 测试
```

## 故障排查

### 问题 1: 只看到 1 个 Key

**可能原因**:
- 环境变量名称配置错误
- 只配置了 YOUTUBE_API_KEY（单个），没有配置 YOUTUBE_API_KEY_N

**解决方案**:
1. 检查环境变量名称是否正确
2. 按照上述步骤重新配置 YOUTUBE_API_KEY_1 到 YOUTUBE_API_KEY_5
3. 重新部署

### 问题 2: 看到 0 个 Key

**可能原因**:
- 所有环境变量都没有配置
- 环境变量配置后没有重新部署

**解决方案**:
1. 确认环境变量已配置
2. 重新部署
3. 使用环境变量检查 API 验证

### 问题 3: 看到 5 个 Key，但配额仍不足

**可能原因**:
- YouTube API Key 无效
- API Key 未启用 YouTube Data API v3

**解决方案**:
1. 验证 API Key 有效性（见上一节文档）
2. 在 Google Cloud Console 中启用 YouTube Data API v3
3. 重新配置环境变量并部署

## 验证清单

- [ ] 环境变量名称正确（YOUTUBE_API_KEY_1, YOUTUBE_API_KEY_2, ...）
- [ ] 数字连续（1, 2, 3, 4, 5）
- [ ] 环境变量值正确（有效的 YouTube API Key）
- [ ] 已保存环境变量
- [ ] 已重新部署
- [ ] 使用环境变量检查 API 验证
- [ ] 使用 Key 池状态 API 验证
- [ ] 查看 Function Logs 确认初始化日志

## 快速检查命令

```bash
# 检查环境变量
curl https://your-domain.com/api/check-env-youtube

# 检查 Key 池状态
curl https://your-domain.com/api/youtube/key-pool/status

# 测试诊断
curl "https://your-domain.com/api/influencers/affiliate/diagnose?keyword=wireless%20earbuds"
```

## 联系支持

如果以上步骤都无法解决问题，请联系技术支持并提供：
1. 环境变量检查 API 的结果
2. Key 池状态 API 的结果
3. Vercel Function Logs
4. 环境变量配置截图

---

**文档版本**: v1.0.0
**最后更新**: 2026-02-06
