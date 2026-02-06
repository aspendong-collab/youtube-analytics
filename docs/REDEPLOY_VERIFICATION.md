# 重新部署后验证指南

## 已完成的操作

✅ 环境变量命名已修正为:
- YOUTUBE_API_KEY_1
- YOUTUBE_API_KEY_2
- YOUTUBE_API_KEY_3
- YOUTUBE_API_KEY_4
- YOUTUBE_API_KEY_5

## 重要：需要重新部署

**⚠️ 修改环境变量后，必须重新部署才能生效！**

由于只是修改了环境变量，代码没有变化，所以不会自动触发部署。需要手动在 Vercel Dashboard 中重新部署。

## 重新部署步骤

### 方法 1: 通过 Vercel Dashboard（推荐）

1. **打开 Vercel Dashboard**
   - 访问: https://vercel.com/dashboard

2. **选择项目**
   - 项目: youtube-analytics

3. **进入 Deployments 页面**
   - 点击左侧菜单的 **Deployments**

4. **找到最新部署**
   - 查看列表中的最新部署（commit: d75e13d）

5. **重新部署**
   - 点击最新部署右侧的 **...** 按钮
   - 选择 **Redeploy**
   - 点击 **Redeploy** 确认

6. **等待部署完成**
   - 预计时间: 3-5 分钟
   - 状态变为 "Ready" 表示部署成功

### 方法 2: 推送空提交（自动部署）

如果您更喜欢通过 Git 触发自动部署，可以推送一个空提交：

```bash
# 在本地执行
git commit --allow-empty -m "chore: 触发 Vercel 重新部署以应用环境变量"
git push origin main
```

这会触发 Vercel 的自动部署。

## 部署完成后验证

### 步骤 1: 访问测试工具页面

1. 登录系统
2. 导航到: **设置管理** > **测试工具**
   - URL: `https://your-domain.com/test-tools`

3. 点击 **"检查环境变量"** 按钮

### 步骤 2: 查看验证结果

**✅ 预期结果（5 个 Key 已配置）**:

```json
{
  "success": true,
  "timestamp": "2026-02-06T10:20:00.000Z",
  "youtubeApiKeys": {
    "format": "YOUTUBE_API_KEY_N",
    "totalConfigured": 5,
    "keys": [
      {
        "name": "YOUTUBE_API_KEY_1",
        "isConfigured": true,
        "prefix": "AIzaSyBgo5",
        "suffix": "FcsjY",
        "length": 39
      },
      {
        "name": "YOUTUBE_API_KEY_2",
        "isConfigured": true,
        "prefix": "AIzaSyCgo5",
        "suffix": "GdtjZ",
        "length": 39
      },
      {
        "name": "YOUTUBE_API_KEY_3",
        "isConfigured": true,
        "prefix": "AIzaSyDgo5",
        "suffix": "HetjZ",
        "length": 39
      },
      {
        "name": "YOUTUBE_API_KEY_4",
        "isConfigured": true,
        "prefix": "AIzaSyEgo5",
        "suffix": "IetjZ",
        "length": 39
      },
      {
        "name": "YOUTUBE_API_KEY_5",
        "isConfigured": true,
        "prefix": "AIzaSyFgo5",
        "suffix": "JetjZ",
        "length": 39
      }
    ]
  }
}
```

### 步骤 3: 验证 Key 池状态

点击 **"查看 Key 池状态"** 按钮

**✅ 预期结果**:

```json
{
  "success": true,
  "data": {
    "totalKeys": 5,
    "availableKeys": 5,
    "hasAvailableKey": true,
    "totalQuota": 50000,
    "totalUsed": 0,
    "totalAvailable": 50000,
    "keys": [
      {
        "id": "key_0",
        "quotaUsed": 0,
        "quotaLimit": 10000,
        "isAvailable": true,
        "usageRate": 0
      },
      {
        "id": "key_1",
        "quotaUsed": 0,
        "quotaLimit": 10000,
        "isAvailable": true,
        "usageRate": 0
      },
      {
        "id": "key_2",
        "quotaUsed": 0,
        "quotaLimit": 10000,
        "isAvailable": true,
        "usageRate": 0
      },
      {
        "id": "key_3",
        "quotaUsed": 0,
        "quotaLimit": 10000,
        "isAvailable": true,
        "usageRate": 0
      },
      {
        "id": "key_4",
        "quotaUsed": 0,
        "quotaLimit": 10000,
        "isAvailable": true,
        "usageRate": 0
      }
    ]
  }
}
```

### 步骤 4: 查看服务器日志

在 Vercel Dashboard 中：

1. 进入最新部署
2. 点击 **Function Logs**
3. 查找以下日志

**✅ 预期日志**:

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
[YoutubeApiKeyPool] Key 列表:
  - Key 1: AIzaSyBgo5...FcsjY
  - Key 2: AIzaSyCgo5...GdtjZ
  - Key 3: AIzaSyDgo5...HetjZ
  - Key 4: AIzaSyEgo5...IetjZ
  - Key 5: AIzaSyFgo5...JetjZ
```

## 快速验证命令

部署完成后，可以使用以下命令快速验证：

```bash
# 1. 检查环境变量
curl https://your-domain.com/api/check-env-youtube

# 2. 检查 Key 池状态
curl https://your-domain.com/api/youtube/key-pool/status

# 3. 测试 Affiliate 拓展（使用诊断功能）
curl "https://your-domain.com/api/influencers/affiliate/diagnose?keyword=wireless%20earbuds"
```

## 验证清单

部署完成后，请确认以下项：

- [ ] 环境变量检查 API 显示 `totalConfigured: 5`
- [ ] Key 池状态 API 显示 `totalKeys: 5`
- [ ] Key 池状态 API 显示 `totalQuota: 50000`
- [ ] 服务器日志显示 5 个 Key 已初始化
- [ ] 所有 Key 的 `isAvailable: true`
- [ ] 所有 Key 的 `quotaUsed: 0`

## 如果验证失败

### 情况 1: 仍然只看到 1 个 Key

**可能原因**:
- 环境变量没有保存
- 重新部署失败

**解决方案**:
1. 检查 Vercel 环境变量列表，确认 5 个 Key 都已保存
2. 确认环境变量名称正确
3. 再次点击 Redeploy

### 情况 2: 看到 0 个 Key

**可能原因**:
- 部署失败
- 代码有问题

**解决方案**:
1. 查看 Vercel Build Logs
2. 检查是否有编译错误
3. 查看 Function Logs

### 情况 3: 看到 5 个 Key，但 Affiliate 仍然无结果

**可能原因**:
- YouTube API Key 无效
- YouTube API 超时

**解决方案**:
1. 使用诊断工具测试
2. 验证 API Key 有效性（见 AFFILIATE_TROUBLESHOOTING.md）
3. 查看详细的错误日志

## 下一步操作

### 重新部署完成 ✅

1. 使用测试工具页面验证配置
2. 运行 Key 池测试
3. 测试 Affiliate 拓展功能

### Affiliate 拓展测试

配置验证通过后，测试 Affiliate 拓展功能：

1. 导航到: **Affiliate 拓展** (`/affiliate-expansion`)
2. 输入关键词（如: "wireless earbuds"）
3. 点击搜索
4. 查看是否能找到博主

如果仍然没有找到博主，请：
1. 点击"诊断问题"按钮
2. 查看详细的诊断结果
3. 根据 AFFILIATE_TROUBLESHOOTING.md 文档进行故障排查

## 联系支持

如果以上步骤都无法解决问题，请联系技术支持并提供：

1. 环境变量检查 API 的完整结果
2. Key 池状态 API 的完整结果
3. Vercel Function Logs（特别是 Key 池初始化日志）
4. Affiliate 诊断 API 的结果
5. 部署截图

---

**文档版本**: v1.1.0
**最后更新**: 2026-02-06
