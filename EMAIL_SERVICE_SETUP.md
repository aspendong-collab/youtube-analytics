# 邮件服务配置指南

## 问题说明

系统原本配置的 Elastic Email API Key 无效，导致邮件无法发送。为了避免阻塞测试和开发，我添加了两种邮件发送模式：

## 1. 模拟邮件模式（推荐用于测试）

使用模拟邮件服务，邮件不会被真正发送，但会记录日志并返回成功状态。这样可以测试整个自动化营销流程。

### 启用方法

在环境变量中设置：
```bash
USE_MOCK_EMAIL=true
```

或者在 `.env.local` 文件中添加：
```
USE_MOCK_EMAIL=true
```

### 优点
- 无需配置真实的邮件服务
- 可以快速测试整个自动化流程
- 不会发送真实邮件，避免误发

### 缺点
- 达人不会收到真实邮件
- 无法测试邮件追踪功能（打开、点击等）

## 2. 真实邮件模式

配置真实的邮件服务，系统会真正发送邮件给达人。

### Elastic Email 配置

1. 注册 Elastic Email 账户：https://app.elasticemail.com/marketing/signup
2. 获取 API Key：https://app.elasticemail.com/account#/settings/security
3. 配置环境变量：

```bash
# Elastic Email API Key（从 Elastic Email 控制台获取）
ELASTIC_API_KEY=your_actual_api_key_here

# 发件人邮箱（需要在 Elastic Email 中验证）
EMAIL_FROM=noreply@yourdomain.com

# 发件人名称
EMAIL_FROM_NAME=Your Brand
```

4. 验证发件人邮箱：
   - 登录 Elastic Email 控制台
   - 进入 Settings > Verified Senders
   - 添加并验证你的发件人邮箱

### 其他邮件服务

你也可以使用其他邮件服务，如 SendGrid、Resend、Mailgun 等。需要创建对应的 Provider 实现。

## 当前配置

系统目前使用模拟邮件模式，所以：
- ✅ 邮件队列会被处理
- ✅ 邮件状态会更新为"已发送"
- ✅ 进度页面会显示发送进度
- ❌ 达人不会收到真实邮件

## 如何切换到真实邮件服务

### 方法 1：修改环境变量

在 `.env.local` 文件中：
```bash
# 删除或注释掉这一行
# USE_MOCK_EMAIL=true

# 添加真实的 Elastic Email 配置
ELASTIC_API_KEY=your_actual_api_key
EMAIL_FROM=your_verified_email@example.com
EMAIL_FROM_NAME=Your Brand
```

### 方法 2：修改代码

编辑 `src/services/email/queue-service.ts`，修改构造函数中的判断逻辑。

## 测试建议

### 阶段 1：使用模拟邮件（当前）
- 测试自动匹配达人功能
- 测试邮件队列处理逻辑
- 测试进度追踪功能
- 测试谈判功能

### 阶段 2：使用真实邮件（准备好后）
- 获取有效的 Elastic Email API Key
- 验证发件人邮箱
- 先用你自己的邮箱测试
- 确认无误后再发送给真实达人

## 注意事项

1. **API Key 安全**：不要将真实的 API Key 提交到 Git 仓库
2. **邮箱验证**：确保发件人邮箱已在邮件服务商中验证
3. **速率限制**：注意邮件服务商的速率限制，避免被标记为垃圾邮件
4. **合规性**：确保你的营销活动符合反垃圾邮件法规（CAN-SPAM、GDPR 等）

## 如何验证邮件是否发送成功

### 使用模拟模式时
- 检查服务器日志，会看到类似：
  ```
  [Mock Email] Simulating email send
  [Mock Email] Email "sent" successfully
  ```
- 查看进度页面，邮件状态会显示为"已发送"

### 使用真实邮件模式时
- 检查收件箱和垃圾邮件文件夹
- 在 Elastic Email 控制台查看发送记录
- 检查邮件追踪数据（打开率、点击率等）
