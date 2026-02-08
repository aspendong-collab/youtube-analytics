# Resend 邮件服务快速开始指南

## 5 分钟快速配置

### 步骤 1：注册 Resend 账户（2 分钟）

1. 访问 https://resend.com/signup
2. 使用邮箱或 GitHub 账户注册
3. 验证邮箱地址

### 步骤 2：获取 API Key（1 分钟）

1. 登录 Resend Dashboard
2. 访问：https://resend.com/api-keys
3. 点击 "Create API Key"
4. 复制 API Key（格式：`re_xxxxxxxxxx`）

### 步骤 3：配置环境变量（1 分钟）

在项目根目录创建或编辑 `.env.local` 文件：

```bash
# 选择使用 Resend
EMAIL_PROVIDER=resend

# Resend API Key（替换为你的真实 API Key）
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 发件人邮箱（先用自己的邮箱测试）
EMAIL_FROM=your_email@gmail.com

# 发件人名称
EMAIL_FROM_NAME=Your Name
```

### 步骤 4：测试发送（1 分钟）

重启服务后，使用以下命令测试：

```bash
curl -X POST http://localhost:5000/api/v1/test/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "aspendong@gmail.com",
    "toName": "Aspen Dong",
    "subject": "【测试】Resend 邮件发送测试",
    "html": "<h1>🎉 测试成功！</h1><p>这是一封测试邮件，Resend 配置正确。</p>"
  }'
```

检查你的邮箱（包括垃圾邮件文件夹），应该能收到这封测试邮件。

## 生产环境配置

### 步骤 1：验证域名

1. 访问 Resend Domains 页面：https://resend.com/domains
2. 点击 "Add Domain"
3. 输入你的域名（例如：`yourdomain.com`）
4. Resend 会提供 3 条 DNS 记录：
   - TXT 记录（SPF）
   - CNAME 记录（DKIM1）
   - CNAME 记录（DKIM2）
5. 在你的域名服务商（阿里云、腾讯云、Cloudflare 等）添加这些 DNS 记录
6. 等待 DNS 生效（通常 10 分钟 - 24 小时）

### 步骤 2：更新环境变量

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your Brand
```

### 步骤 3：重启服务

```bash
# 本地开发
npm run dev

# 或使用 coze CLI
coze dev
```

## 验证配置

### 1. 检查 API Key 是否有效

访问 Resend Dashboard：https://resend.com/emails
如果能看到发送记录，说明 API Key 有效。

### 2. 查看服务器日志

```bash
tail -f /app/work/logs/bypass/app.log | grep Resend
```

应该能看到类似日志：
```
[EmailQueue] Using Resend Email Provider
[Resend] Sending email
[Resend] Email sent successfully
```

### 3. 检查邮件追踪

在 Resend Dashboard 可以看到：
- ✅ 已送达
- 👁️ 已打开
- 🖱️ 已点击
- ❌ 被退回
- 📧 已退订

## 常见问题

### Q1: 测试时邮件收不到？

**A**：检查以下几点：
1. API Key 是否正确复制
2. 收件人邮箱是否正确
3. 检查垃圾邮件文件夹
4. 查看 Resend Dashboard 的发送日志

### Q2: DNS 记录配置后多久生效？

**A**：通常 10 分钟到 24 小时，建议等待 1 小时后测试。

### Q3: 免费额度用完了怎么办？

**A**：
- Resend 超过部分：$1.00/1,000 封，非常便宜
- 在 Resend Dashboard 的 Billing 页面可以设置付费计划
- 或切换到 Elastic Email（150,000 封/月免费）

### Q4: 如何查看发送统计？

**A**：访问 https://resend.com/emails 可以查看详细的发送统计。

### Q5: 邮件被标记为垃圾邮件怎么办？

**A**：
1. 确保发件人域名已验证（SPF、DKIM）
2. 使用真实的公司邮箱
3. 避免使用敏感词汇
4. 提供退订链接
5. 遵守反垃圾邮件法规

## 成本参考

| 发送量 | 月成本 |
|--------|--------|
| 3,000 封 | $0 (免费) |
| 10,000 封 | $7 |
| 50,000 封 | $47 |
| 100,000 封 | $97 |

## 需要帮助？

- Resend 官方文档：https://resend.com/docs
- Resend API 文档：https://resend.com/docs/api-reference/emails/send-email
- Resend 支持：support@resend.com

## 下一步

1. ✅ 注册 Resend 账户
2. ✅ 获取 API Key
3. ✅ 配置环境变量
4. ✅ 测试邮件发送
5. ⏳ 验证发件人域名（生产环境）
6. ⏳ 开始发送真实邮件

配置完成后，你的系统就可以使用 Resend 发送邮件了！🎉
