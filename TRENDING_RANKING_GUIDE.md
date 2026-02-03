# 📊 热门内容排行榜功能文档

## 🎯 功能概述

自动抓取 YouTube 平台上指定关键词的热门内容，并输出今日、本周、本月的热门内容排行榜。

### ✨ 核心特性

- 🕒 **多时间范围**：支持今日、本周、本月三个时间段
- 🔍 **关键词支持**：可指定多个关键词进行精准搜索
- 📈 **智能排名**：基于播放量、互动率、新近度计算趋势分数
- 🔄 **自动更新**：支持定时任务自动抓取
- 💾 **数据持久化**：保存到数据库，支持历史查询

---

## 🚀 快速开始

### 访问功能

**导航路径**：
```
侧边栏 > 发现 > 热门排行榜
```

**URL**：
```
https://your-project.vercel.app/trending/ranking
```

### 基本使用

1. **选择时间范围**
   - 今日：今天发布的视频
   - 本周：本周发布的视频
   - 本月：本月发布的视频

2. **输入关键词（可选）**
   - 留空：搜索平台热门视频
   - 输入：如 "科技,评测,产品"（多个关键词用逗号分隔）

3. **获取排行榜**
   - 点击"获取排行榜"按钮
   - 等待数据加载（5-15秒）

4. **查看结果**
   - 查看排名、视频信息、各项数据指标
   - 点击视频可跳转到 YouTube

---

## 📊 排行榜指标

### 排名标准

**趋势分数计算公式**：
```
趋势分数 = 播放量分数 + 互动分数 + 新近度分数
```

**各分数权重**：
- **播放量分数（40%）**：对数缩放，避免播放量差距过大
- **互动分数（30%）**：点赞和评论的综合表现
- **新近度分数（30%）**：新发布的视频获得额外加分

### 数据指标

| 指标 | 说明 | 计算方式 |
|------|------|----------|
| 播放量 | 视频观看次数 | YouTube API 返回 |
| 点赞数 | 视频点赞次数 | YouTube API 返回 |
| 评论数 | 视频评论数 | YouTube API 返回 |
| 互动率 | 互动比例 | (点赞 + 评论) / 播放量 × 100% |
| 趋势分数 | 综合评分 | 播放量 + 互动 + 新近度 |
| 排名 | 热度排名 | 按趋势分数降序排列 |

---

## 🔌 API 接口

### 获取热门排行榜

**接口**：
```
GET /api/trending/ranking
```

**参数**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `period` | string | 否 | 时间范围：`today`、`week`、`month`（默认 `today`） |
| `keywords` | string | 否 | 关键词，多个用逗号分隔（默认空） |
| `regionCode` | string | 否 | 地区代码（默认 `US`） |
| `maxResults` | number | 否 | 最大结果数（默认 50） |

**示例请求**：

```bash
# 获取今日热门
curl "https://your-project.vercel.app/api/trending/ranking?period=today"

# 获取本周科技类热门
curl "https://your-project.vercel.app/api/trending/ranking?period=week&keywords=科技,评测"

# 获取本月热门（100个结果）
curl "https://your-project.vercel.app/api/trending/ranking?period=month&maxResults=100"
```

**响应示例**：

```json
{
  "period": "today",
  "keywords": ["科技", "评测"],
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "视频标题",
      "thumbnail": "https://...",
      "publishedAt": "2024-02-03T10:00:00Z",
      "channelId": "UC_x5XG1OV2P6uZZ5FSM9Ttw",
      "channelTitle": "频道名称",
      "viewCount": 123456,
      "likeCount": 12345,
      "commentCount": 1234,
      "duration": "PT10M30S",
      "durationSeconds": 630,
      "engagementRate": 11.11,
      "trendScore": 85,
      "trendRank": 1
    }
  ],
  "total": 50,
  "timestamp": "2024-02-03T10:00:00Z"
}
```

---

## ⚙️ 自动抓取配置

### 方法 1：使用 Vercel Cron Jobs

**1. 创建 `vercel.json` 配置**：

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-trending",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**2. 创建 Cron API 路由**：

在 `src/app/api/cron/fetch-trending/route.ts`：

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  // 验证 Cron Secret（可选）
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync('npx tsx scripts/fetch-trending-daily.ts');
    return NextResponse.json({ success: true, output: stdout });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**3. 设置环境变量**：

在 Vercel 项目设置中添加：
```
CRON_SECRET=your-random-secret-key
```

### 方法 2：使用 GitHub Actions

**创建 `.github/workflows/fetch-trending.yml`**：

```yaml
name: Fetch Trending Videos

on:
  schedule:
    - cron: '0 0 * * *'  # 每天午夜 UTC 运行
  workflow_dispatch:  # 支持手动触发

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx tsx scripts/fetch-trending-daily.ts
        env:
          PGDATABASE_URL: ${{ secrets.DATABASE_URL }}
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
```

### 方法 3：使用 VPS / Cron Job

**SSH 到服务器**：

```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天午夜运行）
0 0 * * * cd /path/to/project && npx tsx scripts/fetch-trending-daily.ts >> /var/log/trending.log 2>&1
```

---

## 💾 数据库结构

### 表：trending_videos

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) | 主键 UUID |
| `video_id` | VARCHAR(20) | YouTube 视频 ID |
| `title` | VARCHAR(500) | 视频标题 |
| `thumbnail` | TEXT | 视频缩略图 URL |
| `published_at` | TIMESTAMP | 发布时间 |
| `channel_id` | VARCHAR(50) | 频道 ID |
| `channel_title` | VARCHAR(200) | 频道名称 |
| `view_count` | INTEGER | 播放量 |
| `like_count` | INTEGER | 点赞数 |
| `comment_count` | INTEGER | 评论数 |
| `trend_score` | INTEGER | 趋势分数 |
| `trend_rank` | INTEGER | 排名 |
| `period` | VARCHAR(10) | 时间范围（today/week/month） |
| `fetched_at` | TIMESTAMP | 抓取时间 |
| `created_at` | TIMESTAMP | 创建时间 |

---

## 📝 使用场景

### 场景 1：内容创作者

**目的**：了解热门内容趋势，创作爆款视频

**操作**：
1. 选择"本周"时间范围
2. 输入你的领域关键词（如：美食,烹饪）
3. 查看排行榜
4. 分析热门视频的共同特征

### 场景 2：营销人员

**目的**：发现热门话题，制定营销策略

**操作**：
1. 选择"今日"时间范围
2. 留空关键词（查看平台热门）
3. 找到高互动率的视频
4. 分析用户评论和反馈

### 场景 3：竞品分析

**目的**：监控竞品内容表现

**操作**：
1. 选择"本月"时间范围
2. 输入竞品频道或品牌关键词
3. 查看竞品热门内容
4. 对比分析数据表现

---

## ⚠️ 注意事项

### API 配额

YouTube API 配额限制：
- **每日配额**：10,000 单位
- **单次搜索**：100 单位
- **视频详情**：1 单位/视频

**配额计算**：
```
一次完整抓取（3个时间段，50个视频）：
- 搜索请求：3 × 100 = 300 单位
- 视频详情：150 × 1 = 150 单位
- 频道详情：50 × 1 = 50 单位
总计：500 单位

每日可执行次数：10,000 / 500 = 20 次
```

### 最佳实践

1. **合理设置抓取频率**
   - 建议：每天 1-2 次
   - 避免过度消耗配额

2. **使用缓存**
   - 抓取后保存到数据库
   - 避免重复请求

3. **错误处理**
   - 添加重试机制
   - 记录错误日志

4. **数据验证**
   - 检查 API 返回数据
   - 过滤无效数据

---

## 🚀 高级配置

### 自定义关键词列表

编辑 `scripts/fetch-trending-daily.ts`：

```typescript
// 修改这部分
const keywords: string[] = [
  '科技',
  '产品评测',
  '开箱',
  '教程',
  // 添加更多关键词...
];
```

### 调整排名算法

编辑 `src/app/api/trending/ranking/route.ts` 中的 `calculateTrendScore` 函数：

```typescript
function calculateTrendScore(
  viewCount: number,
  likeCount: number,
  commentCount: number,
  daysSincePublished: number,
  period: string
): number {
  // 自定义算法
  let viewScore = Math.log10(Math.max(viewCount, 1)) * 30; // 降低播放量权重
  let engagementScore = (likeCount + commentCount) / Math.max(viewCount, 1) * 1500; // 提高互动权重
  let recencyScore = daysSincePublished === 0 ? 100 : Math.max(0, 100 - daysSincePublished * 20);

  return viewScore + engagementScore + recencyScore;
}
```

---

## 📞 故障排除

### 问题 1：搜索无结果

**可能原因**：
- API Key 配额已用完
- 网络连接失败
- 时间范围内无视频

**解决方案**：
1. 检查 API Key 配额
2. 查看网络连接
3. 尝试不同的时间段或关键词

### 问题 2：数据不准确

**可能原因**：
- YouTube API 数据延迟
- 排名算法不合理

**解决方案**：
1. 等待 YouTube API 更新
2. 调整排名算法参数

### 问题 3：自动抓取失败

**可能原因**：
- Cron 任务配置错误
- 环境变量未设置
- 脚本执行失败

**解决方案**：
1. 检查 Cron 日志
2. 验证环境变量
3. 手动运行脚本测试

---

## 📚 相关文档

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**最后更新：2024-02-03**
