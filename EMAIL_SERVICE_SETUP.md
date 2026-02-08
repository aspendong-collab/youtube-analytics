# 邮件服务配置指南

系统支持多种邮件服务提供商，包括 Resend（推荐）、Elastic Email 和模拟邮件服务。

## 支持的邮件服务

### 1. Resend（推荐）⭐⭐⭐⭐⭐

**免费额度**：每月 3,000 封

**优点**：
- API 非常简洁易用
- 提供邮件模板功能
- 实时追踪和统计
- 支持域名验证（SPF、DKIM）
- 开发者体验极佳
- 可靠性高，送达率好

**适用场景**：中小规模营销（每月 < 3,000 封）

### 2. Elastic Email

**免费额度**：150,000 封/月

**优点**：
- 免费额度很大
- 支持批量发送

**缺点**：
- API 相对复杂
- 界面不太友好

### 3. 模拟邮件（仅用于测试）

**说明**：不会真正发送邮件，只记录日志

**适用场景**：开发和测试环境

## 配置步骤

### 方法 1：使用 Resend（推荐）

#### 1. 注册 Resend 账户

1. 访问 https://resend.com/signup
2. 使用邮箱或 GitHub 账户注册
3. 验证邮箱地址

#### 2. 创建 API Key

1. 登录 Resend Dashboard
2. 进入 API Keys 页面：https://resend.com/api-keys
3. 点击 "Create API Key"
4. 复制 API Key（格式：`re_xxxxxxxxxx`）

#### 3. 验证发件人域名

1. 进入 Domains 页面：https://resend.com/domains
2. 点击 "Add Domain"
3. 输入你的域名（例如：`yourdomain.com`）
4. 配置 DNS 记录（Resend 会提供具体的配置）：
   - TXT 记录（SPF）
   - CNAME 记录（DKIM）
5. 等待 DNS 生效（通常需要几分钟到几小时）

如果你还没有域名，可以使用 Resend 提供的免费域名：
- `onboarding@resend.dev` - 只能发送给自己
- 不推荐用于生产环境

#### 4. 配置环境变量

在 `.env.local` 文件中添加：

```bash
# 选择邮件提供商（默认为 resend）
EMAIL_PROVIDER=resend

# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 发件人邮箱
EMAIL_FROM=noreply@yourdomain.com

# 发件人名称
EMAIL_FROM_NAME=Your Brand
```

#### 5. 测试发送

访问进度页面或创建测试活动，检查邮件是否成功发送。

### 方法 2：使用 Elastic Email

1. 注册账户：https://app.elasticemail.com/marketing/signup
2. 获取 API Key：https://app.elasticemail.com/account#/settings/security
3. 验证发件人邮箱

配置环境变量：

```bash
EMAIL_PROVIDER=elastic

ELASTIC_API_KEY=your_actual_api_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Brand
```

### 方法 3：使用模拟邮件（仅测试）

配置环境变量：

```bash
EMAIL_PROVIDER=mock
```

## 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| EMAIL_PROVIDER | 邮件服务商（resend/elastic/mock） | resend | 否 |
| RESEND_API_KEY | Resend API Key | - | 使用 Resend 时必需 |
| ELASTIC_API_KEY | Elastic Email API Key | - | 使用 Elastic 时必需 |
| EMAIL_FROM | 发件人邮箱 | onboarding@resend.dev | 是 |
| EMAIL_FROM_NAME | 发件人名称 | Your Brand | 是 |

## 各服务商速率限制

### Resend
- 每月免费：3,000 封
- 超过部分：$1.00/1,000 封
- 速率限制：约 10 req/sec
- 建议：每 200ms 发送一封

### Elastic Email
- 每月免费：150,000 封
- 速率限制：500 封/小时
- 建议：每 1 秒发送一封

## 测试建议

### 阶段 1：使用模拟邮件（开发测试）
- 测试自动匹配达人功能
- 测试邮件队列处理逻辑
- 测试进度追踪功能
- 测试谈判功能

**配置**：
```bash
EMAIL_PROVIDER=mock
```

### 阶段 2：使用 Resend 发送测试邮件
- 注册 Resend 账户
- 获取 API Key
- 使用自己的邮箱测试
- 检查收件箱和垃圾邮件

**配置**：
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_api_key
EMAIL_FROM=your_email@example.com
EMAIL_FROM_NAME=Your Name
```

### 阶段 3：使用 Resend 发送真实邮件
- 验证发件人域名
- 确认 DNS 记录生效
- 开始发送给真实达人

**配置**：
```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Brand
```

## 如何验证邮件是否发送成功

### 使用 Resend

1. **检查收件箱**：查看是否收到邮件
2. **查看 Resend Dashboard**：https://resend.com/emails
   - 可以看到发送状态（已送达、已打开、已点击）
   - 可以查看详细的发送日志
3. **检查服务器日志**：
   ```bash
   tail -n 50 /app/work/logs/bypass/app.log | grep -E "Resend|Email"
   ```

### 使用模拟邮件

- 检查服务器日志，会看到：
  ```
  [Mock Email] Simulating email send
  [Mock Email] Email "sent" successfully
  ```
- 查看进度页面，邮件状态会显示为"已发送"
- 实际不会发送邮件

## 常见问题

### Q1: Resend 的 free tier 够用吗？

**A**：
- 如果你每月发送 < 3,000 封，完全够用
- 如果超过，按量付费：$1.00/1,000 封，非常便宜
- 比如发送 10,000 封，只需要 $7

### Q2: 如何选择邮件服务商？

**A**：
- **推荐 Resend**：API 简单、免费额度适中、送达率高
- **大量发送**：使用 Elastic Email（150,000 封/月免费）
- **开发测试**：使用 Mock

### Q3: 发件人域名必须验证吗？

**A**：
- **必须验证**：否则邮件很可能被标记为垃圾邮件
- Resend 提供 `onboarding@resend.dev` 只能发送给自己
- 生产环境必须验证自己的域名

### Q4: 如何提高邮件送达率？

**A**：
1. 验证发件人域名（SPF、DKIM）
2. 使用真实的公司邮箱
3. 避免使用敏感词汇
4. 提供退订链接
5. 遵守反垃圾邮件法规

### Q5: 如何查看邮件统计？

**A**：
- Resend Dashboard：https://resend.com/emails
- 可以查看：
  - 发送数量
  - 打开率
  - 点击率
  - 退订率
  - 退回率

## 注意事项

1. **API Key 安全**：不要将真实的 API Key 提交到 Git 仓库
2. **域名验证**：确保发件人域名已正确验证
3. **速率限制**：注意邮件服务商的速率限制
4. **合规性**：确保符合反垃圾邮件法规（CAN-SPAM、GDPR 等）
5. **监控发送**：定期查看发送统计，及时调整策略

## 成本估算

### Resend

| 发送量 | 月成本 | 年成本 |
|--------|--------|--------|
| 1,000 | $0 | $0 |
| 3,000 | $0 | $0 |
| 5,000 | $2 | $24 |
| 10,000 | $7 | $84 |
| 50,000 | $47 | $564 |
| 100,000 | $97 | $1,164 |

### Elastic Email

| 发送量 | 月成本 | 年成本 |
|--------|--------|--------|
| 1,000 | $0 | $0 |
| 150,000 | $0 | $0 |
| 200,000 | 约 $10 | 约 $120 |

## 切换邮件服务商

如果需要切换服务商，只需修改环境变量：

```bash
# 从 Resend 切换到 Elastic
EMAIL_PROVIDER=elastic
ELASTIC_API_KEY=your_elastic_key

# 从 Elastic 切换到 Resend
EMAIL_PROVIDER=resend
RESEND_API_KEY=your_resend_key
```

修改后重启服务即可。

## 参考文档

- Resend 官方文档：https://resend.com/docs
- Resend API 文档：https://resend.com/docs/api-reference/emails/send-email
- Elastic Email 文档：https://api.elasticemail.com/help/
