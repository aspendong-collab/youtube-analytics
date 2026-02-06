# YouTube API Key 池管理 - 使用指南

## 概述

本项目已实现 YouTube API Key 池管理功能，支持配置多个 API Key 并自动轮询，解决单 Key 每日 10000 配额限制。

## 配置方法

### 在 Vercel 中配置（推荐）

1. 打开 Vercel Dashboard
2. 选择项目: youtube-analytics
3. 进入 **Settings** > **Environment Variables**
4. 添加以下环境变量：

```
YOUTUBE_API_KEY_1=AIzaSyD1...
YOUTUBE_API_KEY_2=AIzaSyD2...
YOUTUBE_API_KEY_3=AIzaSyD3...
YOUTUBE_API_KEY_4=AIzaSyD4...
YOUTUBE_API_KEY_5=AIzaSyD5...
```

5. 点击 **Save**
6. 重新部署项目（**Redeploy**）

### 在本地开发环境配置

在项目根目录创建 `.env.local` 文件，添加以下内容：

```bash
YOUTUBE_API_KEY_1=your_first_api_key
YOUTUBE_API_KEY_2=your_second_api_key
YOUTUBE_API_KEY_3=your_third_api_key
# ... 可以继续添加更多
```

## 功能特性

### 1. 智能调度策略

支持 4 种 Key 选择策略：

- **least-used**（默认）：优先使用配额剩余最多的 Key
- **round-robin**：按顺序轮换使用
- **priority**：根据配置的优先级选择（YOUTUBE_API_KEY_1 优先级最高）
- **random**：随机选择可用 Key

### 2. 配额追踪

- 实时记录每个 Key 的使用情况
- 配额超限自动切换到下一个可用 Key
- 支持配额持久化（保存到数据库）

### 3. 健康检查

- 自动检测 Key 可用性
- 故障 Key 自动降级
- 定期恢复可用性检查

## API 接口

### 1. 查看 Key 池状态

```bash
GET /api/youtube/key-pool/status
```

**响应示例：**

```json
{
  "success": true,
  "data": {
    "keys": [
      {
        "id": "key_0",
        "quotaUsed": 100,
        "quotaLimit": 10000,
        "isAvailable": true,
        "usageRate": 0.01
      },
      {
        "id": "key_1",
        "quotaUsed": 500,
        "quotaLimit": 10000,
        "isAvailable": true,
        "usageRate": 0.05
      }
    ],
    "totalKeys": 2,
    "availableKeys": 2,
    "hasAvailableKey": true,
    "totalQuota": 20000,
    "totalUsed": 600,
    "totalAvailable": 19400
  }
}
```

### 2. 重置所有 Key 配额

```bash
POST /api/youtube/key-pool/reset
```

**请求体：**

```json
{
  "action": "reset"
}
```

### 3. 运行 Key 池测试

```bash
GET /api/youtube/key-pool/test
```

## 使用示例

### 在代码中使用

```typescript
import { youtubeApiKeyPool } from '@/lib/services/youtube-api-key-pool';

// 获取 YouTube 客户端
const youtube = youtubeApiKeyPool.createClient();

// 调用 API
const response = await youtube.channels.list({
  part: ['snippet', 'statistics'],
  id: ['UC_x5XG1OV2P6uZZ5FSM9Ttw']
});
```

### 在 InfluencerAffiliateService 中使用

```typescript
import { InfluencerAffiliateService } from '@/lib/services/influencer-affiliate';

const service = new InfluencerAffiliateService('en');
const influencers = await service.findAffiliateInfluencers(
  'wireless earbuds',
  'en',
  { maxVideos: 50, maxResults: 20 }
);
```

## 测试工具

### 访问测试页面

1. 登录系统
2. 导航到 **设置管理** > **测试工具** (`/test-tools`)

### 测试功能

**Key 池测试：**
- 查看当前 Key 池状态
- 运行完整测试（初始化、获取 Key、创建客户端、API 调用）

**Affiliate 拓展测试：**
- 输入产品关键词
- 测试查找适合 affiliate 合作的博主

## 配额计算

### 每个 Key 的配额

- **每日免费配额**: 10,000 单位
- **典型消耗**:
  - 搜索 (search.list): 100 单位
  - 视频详情 (videos.list): 1 单位
  - 频道详情 (channels.list): 1 单位
  - 评论 (commentThreads.list): 1 单位

### 总配额计算

如果配置了 5 个 API Key：

- **总配额**: 5 × 10,000 = 50,000 单位/天
- **理论搜索次数**: 500 次/天（仅搜索 API）
- **综合使用**: 可支持约 200-300 次完整的博主分析

## 监控与告警

### 建议监控指标

1. **总配额使用率**: `totalUsed / totalQuota`
2. **可用 Key 数量**: `availableKeys`
3. **单 Key 使用率**: `quotaUsed / quotaLimit`

### 告警阈值

- 🔴 **严重**: 可用 Key 数量 < 2
- 🟡 **警告**: 总配额使用率 > 80%
- 🟢 **正常**: 总配额使用率 < 60%

## 故障排查

### 问题：找不到可用的 YouTube API Key

**解决方案：**
1. 检查环境变量是否正确配置
2. 访问 `/api/youtube/key-pool/status` 查看状态
3. 检查所有 Key 的配额是否已用完
4. 考虑添加更多 API Key

### 问题：API 调用返回 403 错误

**解决方案：**
1. 检查 Key 是否有效
2. 确认 API 已启用（Google Cloud Console）
3. 检查配额是否超限
4. 查看是否触发了速率限制

### 问题：Key 池没有正确初始化

**解决方案：**
1. 查看服务器日志，确认 Key 初始化成功
2. 检查环境变量名称是否正确（YOUTUBE_API_KEY_1）
3. 重启服务

## 最佳实践

1. **配置多个 Key**: 至少配置 3-5 个 Key，确保配额充足
2. **定期监控**: 每周检查一次配额使用情况
3. **合理分配**: 根据实际使用情况调整 Key 数量
4. **错误处理**: 在代码中添加适当的错误处理和重试逻辑
5. **日志记录**: 记录 Key 切换和配额使用情况，便于分析

## 更新日志

### v1.0.0 (当前版本)

- ✅ 支持多 Key 管理（YOUTUBE_API_KEY_N 格式）
- ✅ 实现 4 种调度策略
- ✅ 配额追踪和自动切换
- ✅ Key 池状态监控 API
- ✅ 测试工具页面
- ✅ 集成到 InfluencerAffiliateService
- ✅ 移除预检查，优化配额使用

## 技术支持

如有问题，请联系开发团队或查看项目文档。
