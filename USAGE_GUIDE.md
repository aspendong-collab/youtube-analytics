# YouTube 数据采集系统使用指南

## 功能概述

本系统已实现完整的视频数据采集和管理功能：

### ✅ 已实现功能

1. **视频添加与自动数据采集**
   - 添加视频时自动获取视频信息（标题、描述、缩略图等）
   - 自动获取当前统计数据（播放量、点赞数、评论数）
   - 支持从 YouTube URL 提取视频 ID

2. **每日自动更新**
   - 每天北京时间早上 9:00 自动更新所有视频数据
   - 使用 Vercel Cron Jobs 实现
   - 支持手动触发更新（用于测试）

3. **数据展示**
   - 视频列表页面展示所有监控视频
   - 数据总览页面展示整体统计
   - 实时计算互动率
   - 视频状态分类（优秀/正常/需关注）

4. **按日统计**
   - 所有统计数据按日期存储
   - 支持历史数据查询
   - 为后续数据分析提供基础

## 快速开始

### 1. 添加视频

访问 `/videos/add` 页面：

1. 输入 YouTube 视频链接
   - 支持格式：
     - `https://www.youtube.com/watch?v=VIDEO_ID`
     - `https://youtu.be/VIDEO_ID`
2. （可选）点击"获取视频信息"按钮，自动填充视频信息
3. （可选）输入负责人、标签、分类
4. 点击"添加视频"
5. 系统会自动：
   - 保存视频信息到数据库
   - 获取并保存当前统计数据

### 2. 查看视频列表

访问 `/videos` 页面：

- 查看所有监控视频
- 查看每个视频的最新统计数据
- 按负责人筛选
- 搜索视频

### 3. 查看数据总览

访问 `/overview` 页面：

- 查看整体统计数据
  - 监控视频总数
  - 累计观看量
  - 平均互动率
  - 负责人数量
- 查看今日数据
  - 新增视频数
  - 监控中视频数
  - 活跃负责人数

## 数据更新机制

### 自动更新

- **时间**：每天北京时间早上 9:00
- **方式**：Vercel Cron Jobs
- **内容**：
  - 获取所有活跃视频的最新统计数据
  - 保存到 `video_stats` 表
  - 每个视频每天生成一条记录

### 手动更新（用于测试）

可以通过 API 手动触发更新：

```bash
curl -X POST https://your-domain.vercel.app/api/cron/update-video-stats
```

**注意**：如果在 Vercel 中配置了 `CRON_SECRET` 环境变量，需要携带认证头：

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/update-video-stats
```

## 数据库结构

### videos 表

存储视频基本信息：

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | varchar(36) | 主键 UUID |
| video_id | varchar(20) | YouTube 视频 ID |
| title | varchar(500) | 视频标题 |
| description | text | 视频描述 |
| thumbnail | text | 视频缩略图 URL |
| channel_id | varchar(50) | 频道 ID |
| channel_title | varchar(200) | 频道名称 |
| tags | jsonb | 标签数组 |
| category_id | varchar(10) | 分类 ID |
| owner | varchar(100) | 负责人 |
| is_active | boolean | 是否活跃 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### video_stats 表

存储每日统计数据：

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | varchar(36) | 主键 UUID |
| video_id | varchar(20) | 关联的视频 ID |
| stat_date | timestamp | 统计日期 |
| view_count | integer | 播放量 |
| like_count | integer | 点赞数 |
| comment_count | integer | 评论数 |
| created_at | timestamp | 创建时间 |

## 互动率计算

互动率 = (点赞数 + 评论数) / 观看量 × 100%

### 状态分类

- **优秀**：互动率 ≥ 8%
- **正常**：5% ≤ 互动率 < 8%
- **需关注**：互动率 < 5%

## API 文档

### 添加视频

```http
POST /api/videos
Content-Type: application/json

{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "owner": "张三",
  "tags": "教程,科技",
  "category": "22"
}
```

**响应**：

```json
{
  "success": true,
  "video": {
    "id": "uuid",
    "videoId": "dQw4w9WgXcQ",
    "title": "视频标题",
    ...
  },
  "message": "视频添加成功"
}
```

### 获取视频列表

```http
GET /api/videos?isActive=true&limit=50&skip=0
```

**响应**：

```json
{
  "videos": [
    {
      "id": "uuid",
      "videoId": "dQw4w9WgXcQ",
      "title": "视频标题",
      "owner": "张三",
      "latestStats": {
        "viewCount": 10000,
        "likeCount": 500,
        "commentCount": 100,
        "statDate": "2025-01-15T00:00:00.000Z"
      },
      ...
    }
  ],
  "total": 10
}
```

### 更新统计数据（定时任务）

```http
GET /api/cron/update-video-stats
```

**响应**：

```json
{
  "success": true,
  "message": "更新完成: 成功 10 个, 失败 0 个",
  "updated": 10,
  "failed": 0
}
```

## 环境变量配置

在 Vercel 项目中配置以下环境变量：

| 变量名 | 说明 | 必需 |
|-------|------|------|
| `YOUTUBE_API_KEY` | YouTube Data API 密钥 | ✅ 是 |
| `CRON_SECRET` | Cron Job 认证密钥 | ❌ 否 |
| `PGDATABASE_URL` | PostgreSQL 数据库连接 URL | ✅ 是（自动配置） |

## 常见问题

### Q1: 添加视频后为什么没有显示统计数据？

**A**: 统计数据需要单独获取，添加视频时会自动获取一次。如果没有显示，可能：
1. YouTube API 调用失败
2. 视频没有统计数据
3. 检查 Vercel 日志查看错误信息

### Q2: 数据多久更新一次？

**A**:
- 添加视频时：立即获取一次
- 定时更新：每天北京时间早上 9:00
- 手动更新：通过 API 触发

### Q3: 如何手动更新视频数据？

**A**: 调用 `/api/cron/update-video-stats` API：

```bash
curl -X POST https://your-domain.vercel.app/api/cron/update-video-stats
```

### Q4: 查看历史数据？

**A**: 当前版本主要展示最新数据。历史数据功能正在开发中。

### Q5: 如何删除视频？

**A**: 当前版本支持软删除（标记为不活跃）。删除功能将在后续版本添加。

## 部署说明

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量（`YOUTUBE_API_KEY`）
4. 部署

Cron Jobs 会自动配置，无需额外操作。

### 本地开发

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 配置环境变量（`.env.local`）：
   ```bash
   YOUTUBE_API_KEY=你的API密钥
   ```

3. 启动开发服务器：
   ```bash
   coze dev
   ```

## 后续计划

- [ ] 视频详情页面
- [ ] 历史数据图表展示
- [ ] 数据导出功能
- [ ] 多维度分析
- [ ] 视频对比功能
- [ ] 异常提醒通知
- [ ] 负责人管理
- [ ] 标签分类管理

## 技术支持

如有问题，请查看：
- [问题排查指南](./TROUBLESHOOTING.md)
- [Vercel 部署指南](./VERCEL_SETUP_GUIDE.md)
- [项目 README](./README.md)
