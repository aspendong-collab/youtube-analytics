# Affiliate 拓展搜索算法优化

## 优化内容

### 1. 增加搜索范围

**优化前**:
- 搜索视频数: 50 个
- 返回博主数: 20 个

**优化后**:
- 搜索视频数: 200 个（4 倍）
- 返回博主数: 100 个（5 倍）

### 2. 实现分页搜索

**新增功能**: 使用 YouTube API 的 `pageToken` 支持分页

```typescript
// 在 src/lib/services/influencer-affiliate.ts 中
let pageToken: string | undefined = undefined;
const maxSearchResults = Math.min(maxResults, 200); // 最多搜索 200 个视频

while (allVideos.length < maxSearchResults) {
  const searchResponse = await youtube.search.list({
    q: keyword,
    maxResults: 50, // YouTube API 单次最大值
    pageToken // 使用分页令牌
  });

  // 检查是否还有下一页
  if (!searchResponse.data.nextPageToken) {
    break;
  }

  pageToken = searchResponse.data.nextPageToken;
}
```

**优势**:
- 可以获取更多相关视频
- 不受单次 API 调用限制
- 提高搜索覆盖率

### 3. 支持加载更多

**前端功能**: 添加"加载更多"按钮

```typescript
// 在 src/app/affiliate-expansion/page.tsx 中
const [hasMore, setHasMore] = useState(false);
const [loadingMore, setLoadingMore] = useState(false);

const handleSearch = async (loadMore: boolean = false) => {
  if (loadMore) {
    setLoadingMore(true);
    // 加载更多逻辑
  } else {
    setLoading(true);
    // 新搜索逻辑
  }
};
```

**UI 改进**:
- 显示已加载博主数量
- 显示总找到数量
- "加载更多博主"按钮
- 加载状态指示

### 4. 优化搜索策略

**参数调整**:
- `maxVideos: 200` - 搜索 200 个视频
- `maxResults: 100` - 返回 100 个博主
- `includeComments: false` - 暂时禁用评论分析（提高速度）

**配额影响**:
- 搜索 API: 4 次调用（200 个视频 ÷ 50 个/次）
- 视频 API: 4 次调用（获取视频详情）
- 总配额: 400 单位（搜索）+ 4 单位（视频）= 404 单位

**每个 Key**: 404 单位 / 10000 = 4.04%

**5 个 Key 总共**: 25 次完整搜索

## 使用方法

### 1. 基础搜索

1. 输入关键词（如: "pdf"）
2. 选择语言
3. 点击"搜索"
4. 等待结果加载

### 2. 加载更多

1. 搜索完成后，查看结果列表
2. 如果有"加载更多博主"按钮，点击它
3. 等待加载完成
4. 查看新增的博主

### 3. 查看详情

1. 点击任意博主的"查看详情"按钮
2. 查看完整的博主信息
3. 查看所有 affiliate 证据
4. 查看视频列表

## 性能优化

### 1. 配额管理

**优化前**:
- 每次搜索: 50 个视频 + 50 个视频详情 = 50 + 1 = 51 单位
- 每天搜索次数: 10000 ÷ 51 = 196 次

**优化后**:
- 每次搜索: 200 个视频 + 4 次视频详情 = 200 + 4 = 204 单位
- 每天搜索次数: 10000 ÷ 204 = 49 次
- 但每次返回更多结果（5 倍）

### 2. 响应时间

**优化前**:
- 搜索 50 个视频: ~10-15 秒
- 返回 20 个博主

**优化后**:
- 搜索 200 个视频: ~30-40 秒（分页 4 次）
- 返回 100 个博主

**注意**: 虽然 API 调用时间增加，但用户可以分次加载，体验更好。

### 3. 用户体验

**改进点**:
1. 更多结果（100 个 vs 20 个）
2. 按需加载（不需要一次性等待所有结果）
3. 实时反馈（显示加载进度）
4. 清晰的统计（显示已加载/总数）

## 算法优化建议

### 1. 关键词变体搜索

**建议**: 使用多个关键词变体扩大搜索范围

```typescript
const keywordVariants = [
  'pdf',
  'pdf software',
  'pdf editor',
  'pdf reader',
  'pdf converter',
  'pdf tools'
];

// 并行搜索
const results = await Promise.all(
  keywordVariants.map(k => searchVideos(k, 'en', 50))
);

// 去重并合并
const uniqueVideos = deduplicateAndMerge(results);
```

**优势**:
- 覆盖更多相关博主
- 发现隐藏的 affiliate 合作
- 提高搜索准确率

### 2. 多语言搜索

**建议**: 搜索多个语言的结果

```typescript
const languages = ['en', 'es', 'fr', 'de', 'ja'];

// 并行搜索
const results = await Promise.all(
  languages.map(lang => searchVideos(keyword, lang, 50))
);

// 统一评分标准
const normalizedResults = normalizeScores(results);
```

**优势**:
- 发现国际市场博主
- 覆盖更多受众
- 扩大合作范围

### 3. 智能过滤

**建议**: 根据博主质量自动过滤

```typescript
// 质量指标
const qualityMetrics = {
  subscriberCount: 10000, // 最少 1 万订阅
  averageViews: 1000,     // 平均观看数
  affiliateScore: 20,     // 最低 affiliate 分数
  recentActivity: 30      // 最近 30 天有活动
};

// 应用过滤
const filtered = results.filter(influencer =>
  influencer.subscriberCount >= qualityMetrics.subscriberCount &&
  influencer.affiliateScore >= qualityMetrics.affiliateScore
);
```

### 4. 缓存机制

**建议**: 缓存搜索结果

```typescript
const cacheKey = `affiliate:${keyword}:${language}`;

// 检查缓存
const cached = await redis.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// 执行搜索
const results = await searchVideos(keyword, language, maxResults);

// 保存缓存（24 小时）
await redis.setex(cacheKey, 86400, JSON.stringify(results));
```

**优势**:
- 减少重复搜索
- 节省 API 配额
- 提高响应速度

### 5. 增量更新

**建议**: 定期更新博主信息

```typescript
// 优先更新高价值博主
const topInfluencers = results.slice(0, 20);

// 每 7 天更新一次
topInfluencers.forEach(influencer => {
  scheduleUpdate(influencer.channelId, 7);
});
```

## 配额优化建议

### 1. 按需加载评论

**当前**: 暂时禁用评论分析（`includeComments: false`）

**建议**: 按需加载

```typescript
// 只对高分博主加载评论
if (influencer.affiliateScore >= 60) {
  const comments = await fetchVideoComments(video.id, 10);
  // 分析评论
}
```

### 2. 批量处理

**当前**: 逐个处理视频

**建议**: 批量获取信息

```typescript
// 批量获取频道信息
const channelIds = [...new Set(videos.map(v => v.channelId))];
const channels = await fetchChannels(channelIds);
```

### 3. 智能调度

**当前**: 固定搜索 200 个视频

**建议**: 动态调整

```typescript
// 根据关键词热度调整
if (isHotKeyword(keyword)) {
  maxVideos = 300; // 热门关键词搜索更多
} else {
  maxVideos = 100; // 普通关键词搜索较少
}
```

## 使用示例

### 示例 1: 搜索 PDF 相关博主

1. 输入关键词: "pdf"
2. 点击"搜索"
3. 等待 30-40 秒
4. 查看结果（预计 20-50 个博主）
5. 如需更多，点击"加载更多博主"

### 示例 2: 搜索无线耳机博主

1. 输入关键词: "wireless earbuds"
2. 选择语言: English
3. 点击"搜索"
4. 查看结果
5. 点击高评分博主的"查看详情"
6. 查看他们的 affiliate 合作详情

## 常见问题

### Q1: 为什么搜索时间变长了？

**A**: 因为搜索的视频数量从 50 增加到 200，需要多次 API 调用。但您可以分次加载，不需要一次性等待所有结果。

### Q2: 配额会不会不够用？

**A**: 配额使用增加，但：
1. 每次搜索返回更多结果（5 倍）
2. 有 5 个 API Key（总配额 50,000）
3. 支持 25 次完整搜索/天
4. 可以使用缓存机制减少重复搜索

### Q3: 如何获取更多结果？

**A**:
1. 等待部署完成
2. 使用新的搜索功能
3. 点击"加载更多博主"按钮
4. 或者尝试不同的关键词变体

### Q4: 为什么有时候找不到结果？

**A**: 可能的原因：
1. 该关键词确实没有 affiliate 博主
2. YouTube API 超时或配额限制
3. 检查诊断工具获取详细错误信息

## 下一步优化

1. ✅ **已完成**: 增加搜索范围（50 → 200）
2. ✅ **已完成**: 实现分页搜索
3. ✅ **已完成**: 添加加载更多功能
4. 📋 **待做**: 关键词变体搜索
5. 📋 **待做**: 多语言搜索
6. 📋 **待做**: 智能过滤
7. 📋 **待做**: 缓存机制
8. 📋 **待做**: 增量更新

## 文档资源

1. **API Key 池管理**: `docs/YOUTUBE_API_KEY_POOL_GUIDE.md`
2. **Affiliate 故障排除**: `docs/AFFILIATE_TROUBLESHOOTING.md`
3. **环境变量验证**: `docs/ENV_VAR_VERIFICATION.md`

---

**文档版本**: v1.0.0
**最后更新**: 2026-02-06
