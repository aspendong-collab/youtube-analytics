# DeepSeek API Key 配置指南

## 环境变量检查结果

当前状态：`DEEPSEEK_API_KEY` 未配置

## 配置步骤

### 方式 1：本地开发环境（.env.local）

在项目根目录的 `.env.local` 文件中添加：

```bash
# DeepSeek API Key (for semantic keyword expansion)
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
```

### 方式 2：Vercel 生产环境

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目: `youtube-analytics`
3. 进入 `Settings` > `Environment Variables`
4. 添加新的环境变量：
   - Name: `DEEPSEEK_API_KEY`
   - Value: `sk-your-deepseek-api-key-here`
   - Environment: `Production`, `Preview`, `Development` (全选)
5. 点击 `Save`
6. 重新部署项目：`Settings` > `General` > `Redeploy`

## 如何获取 DeepSeek API Key

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/)
2. 登录或注册账号
3. 进入 `API Keys` 页面
4. 点击 `Create API Key` 创建新的 API Key
5. 复制生成的 API Key（格式：`sk-...`）

## 验证配置

配置完成后，运行以下命令验证：

```bash
node scripts/check-env.js
```

你应该看到：

```
✅ DEEPSEEK_API_KEY: 已配置
   长度: XX 字符
   前缀: sk-...
```

## 功能说明

`DEEPSEEK_API_KEY` 用于：

- **语义关键词拓展**：在关键词拓展板块生成近义词、同义词、反义词和相关词
- **智能分析**：使用大语言模型理解关键词语义，生成更准确的相关词
- **降级机制**：当 API 不可用时，自动降级使用模拟数据

## 注意事项

1. ⚠️ **不要**将 API Key 提交到 Git 仓库（.env.local 已在 .gitignore 中）
2. ⚠️ **不要**在客户端代码中直接使用 API Key
3. ✅ **建议**：定期更换 API Key 以提高安全性
4. ✅ **建议**：在 Vercel 中配置为 `Production` 和 `Preview` 环境变量

## 故障排查

### 问题 1：API 调用失败

**症状**：日志显示 `[语义拓展] DeepSeek API 调用失败`

**解决方案**：
1. 检查 API Key 是否正确配置
2. 确认 API Key 是否有效（未过期）
3. 检查 API 配额是否充足
4. 查看日志中的详细错误信息

### 问题 2：生成结果不准确

**症状**：生成的相关词质量不高

**解决方案**：
1. 尝试调整提示词（在 `semantic-expansion.ts` 中）
2. 增加温度参数（`temperature`）以提高创造性
3. 减少 `max_tokens` 限制以避免生成过多无关词

### 问题 3：速度过慢

**症状**：关键词拓展耗时过长

**解决方案**：
1. 检查网络连接到 DeepSeek API 的速度
2. 减少 `maxResults` 参数（默认为 15）
3. 关闭其他不需要的拓展选项（如数据挖掘）
4. 考虑使用缓存机制（未来版本）

## 相关文档

- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [语义相似度拓展服务](./src/lib/services/keyword-expansion/semantic-expansion.ts)
- [关键词拓展类型定义](./src/lib/services/keyword-expansion/types.ts)

## 支持

如有问题，请联系开发团队或在项目中提交 Issue。
