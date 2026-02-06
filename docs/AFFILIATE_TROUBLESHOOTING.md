# Affiliate 拓展功能问题分析与解决方案

## 问题描述

用户反馈：在 Affiliate 板块搜索关键词时，显示"未找到符合条件的博主"。

## 问题诊断结果

通过诊断工具测试，发现以下情况：

### 1. Key 池状态 ✅
- **状态**: 正常
- **总 Key 数量**: 5 个（在 Vercel 中配置）
- **总配额**: 50,000 单位/天
- **可用性**: 所有 Key 配额充足

### 2. Affiliate 检测逻辑 ✅
- **状态**: 正常
- **测试用例**:
  - Ref 参数检测: ✓ 通过
  - 关键词检测: ✓ 通过
  - Disclosure 声明检测: ✓ 通过

### 3. YouTube API 调用 ❌
- **状态**: 超时
- **现象**: API 调用 30 秒后超时，未返回任何结果
- **原因**: 可能是 YouTube API Key 无效或网络连接问题

## 根本原因分析

### 可能的原因

1. **YouTube API Key 无效**
   - API Key 未启用 YouTube Data API v3
   - API Key 已过期或被撤销
   - API Key 配额已用完

2. **YouTube API 权限问题**
   - API Key 缺少必要的权限
   - 搜索功能未启用

3. **网络连接问题**
   - Vercel 部署环境网络限制
   - YouTube API 访问被防火墙阻止

4. **YouTube API 服务问题**
   - YouTube API 服务暂时不可用
   - API 限流

## 解决方案

### 方案 1: 验证 YouTube API Key（推荐）

**步骤：**

1. **打开 Google Cloud Console**
   - 访问: https://console.cloud.google.com/
   - 选择项目

2. **检查 API Key 配置**
   - 导航到 **APIs & Services** > **Credentials**
   - 找到您的 YouTube API Keys
   - 点击编辑按钮

3. **确认 YouTube Data API v3 已启用**
   - 导航到 **APIs & Services** > **Library**
   - 搜索 "YouTube Data API v3"
   - 确认状态为 "已启用"

4. **测试 API Key**
   ```bash
   curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=wireless+earbuds&type=video&maxResults=1&key=YOUR_API_KEY"
   ```

5. **更新 Vercel 环境变量**
   - 如果 API Key 有变化，更新 Vercel 环境变量
   - 重新部署项目

### 方案 2: 使用诊断工具

**访问诊断工具：**

1. **登录系统**
2. **导航到**: 设置管理 > 测试工具
3. **选择**: "Affiliate 测试" 标签
4. **点击**: "诊断问题" 按钮
5. **输入**: 要测试的关键词
6. **查看**: 诊断结果

**诊断结果说明：**

```
========================================
Affiliate 拓展功能诊断
========================================
测试关键词: "wireless earbuds"

=== 诊断步骤 1: 检查 Key 池状态 ===
✓ Key 池已初始化
  - 总 Key 数量: 5
  - 可用 Key 数量: 5
  - 总配额: 50000
  - 已用配额: 0
✓ Key 池状态正常

=== 诊断步骤 2: 测试 YouTube API 搜索 ===
✓ 服务实例创建成功

=== 诊断步骤 3: 测试 Affiliate 检测逻辑 ===
✓ Affiliate 检测逻辑正常

=== 诊断步骤 4: 测试完整的 Affiliate 拓展流程 ===
开始查找 affiliate 博主...
[AffiliateService] 调用 YouTube Search API: keyword="wireless earbuds", lang=en, region=US, maxResults=10
[YoutubeApiKeyPool] 使用 Key: key_0, 已使用配额: 1/10000
...
```

### 方案 3: 降低搜索参数（临时方案）

如果 API 调用超时，可以临时降低搜索参数：

**修改 API 调用参数：**

```typescript
// 在 src/app/affiliate-expansion/page.tsx 中
const response = await fetch('/api/influencers/affiliate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    keyword,
    language: 'en',
    maxVideos: 5,      // 降低从 50 到 5
    maxResults: 3,     // 降低从 20 到 3
    minAffiliateScore: 0,
    includeComments: false  // 禁用评论分析
  })
});
```

**优点**:
- 减少配额消耗
- 降低 API 调用时间
- 降低超时风险

**缺点**:
- 可能找不到足够的博主
- 结果不够全面

### 方案 4: 增加超时时间

**修改超时配置：**

在 `src/lib/services/influencer-affiliate.ts` 中：

```typescript
// 将超时时间从 30 秒增加到 60 秒
const searchResponse = await Promise.race([
  youtube.search.list({
    q: keyword,
    part: ['snippet'],
    maxResults: maxResults,
    type: ['video'],
    relevanceLanguage,
    regionCode,
    order: 'relevance'
  }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('YouTube API search timeout (60s)')), 60000)
  )
]);
```

## 验证步骤

### 1. 验证 YouTube API Key

```bash
# 替换 YOUR_API_KEY 为您的实际 API Key
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=wireless+earbuds&type=video&maxResults=1&key=YOUR_API_KEY"
```

**预期结果：**
```json
{
  "kind": "youtube#searchListResponse",
  "etag": "...",
  "regionCode": "US",
  "pageInfo": {
    "totalResults": 1000000,
    "resultsPerPage": 1
  },
  "items": [...]
}
```

### 2. 验证 Vercel 环境变量

```bash
# 在 Vercel Dashboard 中确认以下环境变量已配置
YOUTUBE_API_KEY_1=AIzaSy...
YOUTUBE_API_KEY_2=AIzaSy...
YOUTUBE_API_KEY_3=AIzaSy...
YOUTUBE_API_KEY_4=AIzaSy...
YOUTUBE_API_KEY_5=AIzaSy...
```

### 3. 验证 Key 池状态

```bash
curl https://your-domain.com/api/youtube/key-pool/status
```

**预期结果：**
```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "id": "key_0",
        "quotaUsed": 0,
        "quotaLimit": 10000,
        "isAvailable": true,
        "usageRate": 0
      },
      ...
    ],
    "totalKeys": 5,
    "availableKeys": 5,
    "totalQuota": 50000,
    "totalUsed": 0,
    "totalAvailable": 50000
  }
}
```

## 监控与日志

### 查看日志

**Vercel 部署日志：**
1. 打开 Vercel Dashboard
2. 选择项目: youtube-analytics
3. 进入 **Deployments** 标签
4. 点击最新部署
5. 查看 **Function Logs**

**本地开发日志：**
```bash
tail -n 50 /app/work/logs/bypass/app.log
```

### 关键日志标识

查找以下日志标识：
- `[AffiliateService]` - Affiliate 服务日志
- `[YoutubeApiKeyPool]` - Key 池日志
- `YouTube API search timeout` - 超时错误
- `YouTube API 配额已用完` - 配额错误
- `YouTube API Key 无效` - Key 错误

## 常见错误及解决

### 错误 1: "YouTube API search timeout"

**原因**: API 调用超时

**解决方案**:
1. 检查网络连接
2. 验证 API Key 有效性
3. 增加超时时间
4. 降低搜索参数

### 错误 2: "YouTube API 配额已用完"

**原因**: 配额已用完

**解决方案**:
1. 查看 Key 池状态 API
2. 等待配额重置（每日太平洋时间午夜）
3. 添加更多 API Key
4. 优化搜索参数

### 错误 3: "YouTube API Key 无效"

**原因**: API Key 无效或未启用

**解决方案**:
1. 检查 Google Cloud Console
2. 确认 YouTube Data API v3 已启用
3. 重新生成 API Key
4. 更新 Vercel 环境变量

### 错误 4: "所有 YouTube API Key 都已用完"

**原因**: 所有 Key 配额已用完

**解决方案**:
1. 查看每个 Key 的使用情况
2. 等待配额重置
3. 添加更多 API Key
4. 优化配额使用

## 最佳实践

1. **定期监控配额使用**
   - 每天检查一次 Key 池状态
   - 设置告警阈值（配额使用 > 80%）

2. **优化搜索参数**
   - 根据实际需求调整 maxVideos 和 maxResults
   - 禁用不必要的评论分析
   - 使用更具体的关键词

3. **备用方案**
   - 配置足够的 API Key（至少 3-5 个）
   - 监控 API Key 的健康状态
   - 准备备用 API Key

4. **日志分析**
   - 定期查看错误日志
   - 分析超时模式
   - 优化 API 调用策略

## 联系支持

如果以上方案都无法解决问题，请联系技术支持并提供以下信息：

1. 诊断工具的完整输出
2. Vercel 部署日志
3. Key 池状态 API 返回结果
4. 使用的测试关键词
5. 错误发生的时间

---

**文档版本**: v1.0.0
**最后更新**: 2026-02-06
