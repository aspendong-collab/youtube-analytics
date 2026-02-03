# 自动化部署指南

本项目提供了两种自动化部署方式，您可以选择最适合您的方式。

## 方式一：完全自动化部署（推荐）

使用 `auto-deploy.sh` 脚本，只需一条命令即可完成所有配置和部署。

### 使用方法

```bash
# 在项目根目录执行
./auto-deploy.sh <VERCEL_TOKEN> <PGDATABASE_URL> <YOUTUBE_API_KEY> [NEXTAUTH_SECRET]
```

### 参数说明

| 参数 | 必需 | 说明 |
|------|------|------|
| `VERCEL_TOKEN` | ✓ | Vercel API Token |
| `PGDATABASE_URL` | ✓ | 数据库连接字符串 |
| `YOUTUBE_API_KEY` | ✓ | YouTube Data API v3 密钥 |
| `NEXTAUTH_SECRET` | ✗ | NextAuth 密钥（如未提供会自动生成） |

### 获取参数

#### 1. 获取 Vercel Token
1. 访问 https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 输入 Token 名称（如：youtube-analytics-deploy）
4. 选择范围（Scope）：Full Account
5. 复制生成的 Token

#### 2. 获取数据库连接字符串

**如果您有 PostgreSQL 数据库：**
```
postgresql://username:password@host:port/database?sslmode=require
```

**如果您使用 Neon：**
1. 访问 https://console.neon.tech
2. 选择您的项目
3. 复制 Connection String

#### 3. 获取 YouTube API Key
1. 访问 https://console.cloud.google.com
2. 创建新项目或选择现有项目
3. 启用 "YouTube Data API v3"
4. 创建凭据 → API 密钥
5. 复制 API 密钥

#### 4. 生成 NEXTAUTH Secret（可选）
```bash
openssl rand -base64 32
```

### 示例

```bash
./auto-deploy.sh \
  "nG_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "postgresql://user:password@host:5432/database?sslmode=require" \
  "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  "$(openssl rand -base64 32)"
```

### 脚本功能

✅ 自动检查并安装 Vercel CLI
✅ 自动登录 Vercel
✅ 自动创建或链接项目
✅ 自动安装依赖
✅ 自动构建项目
✅ 自动配置所有环境变量
✅ 自动部署到生产环境
✅ 自动获取部署 URL

### 部署后访问

部署成功后，脚本会输出：
- 📱 应用 URL
- 🔧 环境变量配置状态
- 📋 后续操作指南

---

## 方式二：基础自动化部署

使用 `deploy.sh` 脚本，需要手动配置环境变量。

### 使用方法

```bash
./deploy.sh <VERCEL_TOKEN>
```

### 脚本功能

✅ 自动登录 Vercel
✅ 自动安装依赖
✅ 自动构建项目
✅ 自动部署到生产环境

### 手动配置环境变量

部署完成后，需要手动配置环境变量：

1. 访问 Vercel 控制台：https://vercel.com/[your-username]/youtube-analytics
2. 进入 "Settings" → "Environment Variables"
3. 添加以下环境变量：

| 名称 | 值 | 说明 |
|------|-----|------|
| `PGDATABASE_URL` | 数据库连接字符串 | 必需 |
| `YOUTUBE_API_KEY` | YouTube API Key | 必需 |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | 必需 |
| `NEXTAUTH_SECRET` | 随机生成的密钥 | 必需 |

4. 重新部署项目：

```bash
vercel --prod --token=<VERCEL_TOKEN>
```

---

## 部署后验证

### 1. 访问应用
打开脚本输出的 URL，访问应用。

### 2. 登录系统
- 默认管理员账号需要通过 `/register` 注册
- 访问 `/admin/approvals` 审核用户

### 3. 测试功能
- ✅ 用户管理：`/admin/users`
- ✅ 数据总览：`/overview`
- ✅ 视频监控：`/monitoring`
- ✅ 添加视频：`/videos/add`

---

## 常见问题

### Q1: 部署失败，提示 "No existing credentials found"
**A:** Vercel Token 无效或已过期，请重新生成 Token。

### Q2: 环境变量配置失败
**A:** 环境变量已存在，脚本会跳过配置。可以在 Vercel 控制台手动修改。

### Q3: 构建失败
**A:** 检查依赖是否正确安装，尝试删除 `node_modules` 和 `.next` 后重新部署。

### Q4: 部署成功但无法访问
**A:** 检查 Vercel 项目设置中的域名和路由配置。

---

## 更新部署

代码更新后，只需推送代码到 GitHub：

```bash
git add .
git commit -m "your message"
git push origin main
```

然后重新运行部署脚本：

```bash
./auto-deploy.sh <VERCEL_TOKEN> <PGDATABASE_URL> <YOUTUBE_API_KEY>
```

---

## 技术支持

如遇到问题，请检查：
1. Vercel Token 是否有效
2. 数据库连接是否正常
3. YouTube API Key 是否有权限
4. 网络连接是否正常

查看 Vercel 部署日志获取详细错误信息。
