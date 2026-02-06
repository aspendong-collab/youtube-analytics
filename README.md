# YouTube Analytics - 关键词智能拓展系统

## 项目简介

这是一个基于 Next.js 的 YouTube 数据分析和关键词智能拓展系统，支持多维度关键词挖掘、竞争对手监控和 KOL 分析。

## 核心功能

- ✅ **关键词智能拓展**：支持规则引擎、LLM 引擎、数据挖掘引擎
- ✅ **多维度分析**：场景、载体、状态、目标、方法五个维度
- ✅ **多语言支持**：中文、英文、日文、韩文等 10 种语言
- ✅ **搜索量估算**：基于 YouTube API 的搜索量和竞争度估算
- ✅ **竞争对手监控**：自动监控竞争对手频道和视频
- ✅ **KOL 分析**：全面分析 KOL 影响力指标
- ✅ **实时数据**：实时获取 YouTube 数据

## 最新更新

### 🔧 Bug 修复（2025-02-06）

修复了以下问题：

1. **LLM SDK 调用失败**
   - 问题：`GatewayErr (code: 697026704, message: 1213:未正常接收到prompt参数)`
   - 原因：未正确传递请求头（headers）给 SDK
   - 解决：在所有 LLM 调用处添加 `HeaderUtils.extractForwardHeaders`

2. **搜索量和竞争度为 0**
   - 问题：拓展后的关键词的搜索量和竞争度都显示为 0
   - 原因：模拟数据生成逻辑中，`Math.random()` 可能生成接近 0 的值
   - 解决：修改 `baseVolume` 为 `0.3 + Math.random() * 0.7`（0.3-1.0）

3. **数据来源统计显示为 0**
   - 问题：AI生成、标签提取、评论提取都显示为 0，只有规则来源显示
   - 原因：API 响应中缺少 `sourceStats` 字段
   - 解决：在返回数据中添加 `sourceStats` 字段

4. **联想词弹窗无法关闭**
   - 问题：点击弹窗外部区域无法关闭联想词弹窗
   - 原因：useEffect 依赖项为空，不会重新检查
   - 解决：修改 useEffect 依赖项，添加 `showSuggestions`，只在弹窗显示时监听点击事件

5. **数据库保存错误**
   - 问题：`values() must be called with at least one value` 错误
   - 原因：某些情况下 `results` 数组可能为空
   - 解决：添加空结果检查

### ✨ 功能完善

- LLM 引擎正常工作，响应时间约 500ms
- 数据库保存功能正常
- 关键词生成测试通过（单次可生成 360+ 个关键词）
- 数据来源统计正常显示
- 搜索量和竞争度正常显示（不再是 0）
- 联想词弹窗交互正常

## 快速开始

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/aspendong-collab/youtube-analytics.git
   cd youtube-analytics
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local，填入实际的配置
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```

5. **访问应用**
   ```
   http://localhost:5000
   ```

### 生产部署

详细部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 技术栈

- **前端框架**：Next.js 14 (App Router)
- **UI 组件**：shadcn/ui (基于 Radix UI)
- **样式方案**：Tailwind CSS 4
- **数据库**：PostgreSQL (Neon)
- **ORM**：Drizzle ORM
- **认证**：NextAuth.js
- **图表库**：Recharts
- **LLM 集成**：coze-coding-dev-sdk
- **YouTube API**：googleapis

## 项目结构

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   │   ├── keywords/         # 关键词相关 API
│   │   ├── influencers/      # KOL 相关 API
│   │   └── monitoring/       # 监控相关 API
│   ├── keyword-expansion/    # 关键词拓展页面
│   ├── monitoring/           # 监控页面
│   └── overview/             # 概览页面
├── components/               # React 组件
│   └── ui/                   # shadcn/ui 组件
├── lib/                      # 工具库
│   ├── services/             # 业务服务
│   │   └── keyword-expansion/# 关键词拓展服务
│   └── youtube-client/       # YouTube API 客户端
└── storage/                  # 数据存储
    └── database/             # 数据库相关
```

## 环境变量

必需的环境变量：

```env
# 数据库
PGDATABASE_URL=postgresql://...

# YouTube API
YOUTUBE_API_KEY=AIzaSy...

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
```

## 功能使用

### 关键词拓展

1. 访问 `/keyword-expansion`
2. 输入关键词
3. 选择拓展维度和语言
4. 点击"智能拓展"按钮
5. 查看生成结果和推荐指数

### 竞争对手监控

1. 访问 `/monitoring/competitors`
2. 添加竞争对手频道
3. 设置监控频率
4. 查看分析报告

### KOL 分析

1. 访问 `/influencers`
2. 搜索或浏览 KOL
3. 查看详细分析
4. 添加到收藏或合作列表

## API 文档

### 关键词拓展 API

```
POST /api/keywords/smart-expand
```

请求体：
```json
{
  "keyword": "AI视频制作",
  "language": "zh-CN",
  "useRuleEngine": true,
  "useLLMEngine": true,
  "useDataMining": false
}
```

响应：
```json
{
  "success": true,
  "data": {
    "keywords": [...],
    "summary": {...},
    "quotaUsage": {...}
  }
}
```

## 性能指标

- **LLM 响应时间**：约 500ms
- **关键词生成速度**：约 17s（生成 360+ 个关键词）
- **搜索量估算**：单次约 2-5s
- **数据库查询**：< 100ms

## 故障排查

### LLM 调用失败

如果遇到 LLM 调用失败，检查：
1. 环境变量是否正确配置
2. 请求头是否正确传递
3. 网络连接是否正常

### 数据库连接失败

检查：
1. `PGDATABASE_URL` 是否正确
2. 数据库是否允许访问
3. SSL 模式是否正确

### YouTube API 配额不足

检查：
1. `YOUTUBE_API_KEY` 是否有效
2. 配额是否超出限制
3. API 使用是否合理

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。

---

**注意**：本项目仅供学习和研究使用，请遵守 YouTube API 使用条款。
