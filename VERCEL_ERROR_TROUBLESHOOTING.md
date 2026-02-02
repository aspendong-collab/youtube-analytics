# Vercel 部署客户端异常排查指南

## 问题现象

访问 `https://youtube-analytics-opal.vercel.app` 时出现客户端异常错误：
```
Application error: a client-side exception has occurred (see the browser console for more information).
```

## 排查步骤

### 1. 检查浏览器控制台错误

在浏览器中打开开发者工具（F12），查看 Console 标签中的错误信息：

```javascript
// 可能看到的错误类型
- TypeError: Cannot read property 'xxx' of undefined
- ReferenceError: 'xxx' is not defined
- NetworkError: Failed to fetch
- SyntaxError: Unexpected token
```

### 2. 检查网络请求

在 Network 标签中查看 API 请求：

- 检查 `/api/stats/multi` 是否返回 200
- 检查 `/api/videos` 是否返回 200
- 查看失败的请求（红色标记）

### 3. 访问诊断页面

访问测试页面进行诊断：
```
https://youtube-analytics-opal.vercel.app/test
```

这个页面会测试：
- Stats API 连接
- Videos API 连接
- 环境信息

### 4. 检查 Vercel 日志

1. 登录 Vercel Dashboard
2. 选择项目
3. 进入 "Deployments" 标签
4. 点击最新部署查看日志
5. 查看 "Functions" 标签中的函数日志

### 5. 检查环境变量

在 Vercel 项目设置中确认环境变量已配置：

```
PGDATABASE_URL=postgresql://neondb_owner:npg_zw0a2RgOhAXY@ep-winter-cherry-a1cs4q75-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
YOUTUBE_API_KEY=AIzaSyBgo5bEiG0dMJ2RKp7I13eL-yk15gFcsjY
```

## 常见问题和解决方案

### 问题 1: 环境变量未配置

**症状**: API 返回 500 错误，日志显示数据库连接失败

**解决方案**:
1. 访问 Vercel 项目设置
2. 进入 "Environment Variables" 标签
3. 添加两个环境变量
4. 重新部署项目

### 问题 2: 数据库连接失败

**症状**: API 返回 500 错误，日志显示 "connection refused" 或 "timeout"

**解决方案**:
1. 检查 Neon 数据库是否在线
2. 验证连接字符串格式
3. 确认使用了 `sslmode=require`
4. 检查数据库 IP 白名单

### 问题 3: 客户端组件错误

**症状**: 控制台显示 JavaScript 错误

**解决方案**:
1. 查看具体的错误信息
2. 检查相关组件代码
3. 添加错误处理逻辑
4. 使用 ErrorBoundary 捕获错误

### 问题 4: API 超时

**症状**: 页面加载缓慢，API 请求超时

**解决方案**:
1. 检查数据库查询性能
2. 增加超时时间
3. 优化查询语句
4. 添加缓存

### 问题 5: 构建失败

**症状**: Vercel 部署时构建失败

**解决方案**:
1. 查看构建日志
2. 检查依赖是否完整
3. 验证 TypeScript 类型
4. 本地测试构建：`pnpm run build`

## 已添加的改进

### 1. ErrorBoundary 组件

添加了全局错误边界，捕获客户端错误并显示友好的错误信息。

位置：`src/components/error-boundary.tsx`

### 2. 测试页面

创建了诊断测试页面，用于测试 API 连接。

访问路径：`/test`

### 3. 改进的错误处理

所有 API 端点都添加了：
- Try-catch 错误处理
- 详细的错误日志
- 友好的错误响应

## 快速修复步骤

### 步骤 1: 检查环境变量

1. 访问 Vercel 项目设置
2. 确认两个环境变量已配置
3. 如果没有，添加并重新部署

### 步骤 2: 测试 API

在浏览器中访问：
```
https://youtube-analytics-opal.vercel.app/api/stats/multi
https://youtube-analytics-opal.vercel.app/api/videos?limit=1
```

应该返回 JSON 数据，而不是错误。

### 步骤 3: 访问测试页面

访问：
```
https://youtube-analytics-opal.vercel.app/test
```

查看各个 API 的状态。

### 步骤 4: 查看浏览器控制台

按 F12 打开开发者工具，查看 Console 标签中的错误信息。

### 步骤 5: 查看日志

在 Vercel Dashboard 中查看：
- 部署日志
- 函数日志
- 错误日志

## 联系支持

如果以上步骤都无法解决问题：

1. 收集以下信息：
   - 浏览器控制台错误截图
   - Network 标签中的失败请求
   - Vercel 日志截图
   - 诊断页面的结果

2. 创建 GitHub Issue：
   - 标题：`Vercel 部署客户端异常错误`
   - 描述：详细描述问题现象
   - 附件：相关截图和日志

## 调试技巧

### 1. 使用 console.log

在代码中添加调试日志：
```javascript
console.log('Debug info:', data);
```

### 2. 使用 Chrome DevTools

- Breakpoints: 设置断点调试
- Network: 监控网络请求
- Performance: 分析性能
- React DevTools: 检查组件状态

### 3. 使用 Vercel CLI

```bash
# 查看日志
vercel logs

# 查看环境变量
vercel env ls

# 重新部署
vercel --prod
```

## 预防措施

### 1. 本地测试

部署前在本地测试：
```bash
pnpm run build
pnpm run start
```

### 2. 使用预览部署

在 Vercel 中使用 Preview Deployments 测试更改。

### 3. 监控和告警

配置 Vercel 监控和告警。

### 4. 错误日志

使用 Sentry 或其他错误监控服务。

## 更新记录

- 2026-02-02: 创建排查指南
- 2026-02-02: 添加 ErrorBoundary 组件
- 2026-02-02: 创建诊断测试页面
