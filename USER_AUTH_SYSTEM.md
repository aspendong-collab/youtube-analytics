# 用户注册审核系统使用说明

## 概述

系统已升级为审核注册制，用户需要注册并通过管理员审核后才能使用系统进行数据分析。

## 功能特性

### 用户角色
- **普通用户 (user)**: 注册后需等待审核，审核通过后可以添加视频和查看数据分析
- **管理员 (admin)**: 可以审核用户申请，管理用户状态

### 审核状态
- **pending**: 待审核（新注册用户默认状态）
- **approved**: 已审核通过
- **rejected**: 审核未通过

## 使用流程

### 1. 管理员登录

首次使用需要使用管理员账号登录：

```
邮箱: admin@example.com
密码: admin123456
```

⚠️ **重要**: 请立即修改默认密码！

### 2. 用户注册

1. 访问 `/register` 页面
2. 填写注册信息：
   - 姓名
   - 邮箱
   - 密码（至少 6 位）
3. 提交注册申请
4. 系统显示"注册成功，请等待管理员审核"

### 3. 管理员审核

1. 管理员登录系统
2. 在导航栏看到"用户管理"菜单
3. 点击进入"用户审核"页面（`/admin/approvals`）
4. 查看待审核用户列表
5. 对每个用户执行操作：
   - 点击"通过"按钮 → 用户状态变为 approved，可以正常使用系统
   - 点击"拒绝"按钮 → 用户状态变为 rejected，无法使用系统

### 4. 用户登录

审核通过后，用户可以：
1. 访问 `/login` 页面
2. 输入邮箱和密码登录
3. 正常使用系统功能（添加视频、查看分析等）

### 5. 用户状态页面

根据用户状态，会显示不同的页面：

- **待审核** (`/pending-approval`): 显示账号正在审核中
- **审核未通过** (`/account-rejected`): 显示审核未通过，建议联系管理员

## 页面路由

| 路由 | 说明 | 访问权限 |
|------|------|----------|
| `/register` | 用户注册页面 | 所有用户 |
| `/login` | 用户登录页面 | 所有用户 |
| `/pending-approval` | 待审核提示页面 | 已登录且状态为 pending 的用户 |
| `/account-rejected` | 审核拒绝提示页面 | 已登录且状态为 rejected 的用户 |
| `/admin/approvals` | 用户审核页面 | 仅管理员 |

## API 接口

### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

### 用户登录
```
POST /api/auth/signin
Content-Type: application/json

{
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

### 获取待审核用户列表
```
GET /api/users/pending
```
需要管理员权限

### 审核通过用户
```
POST /api/users/{userId}/approve
```
需要管理员权限

### 拒绝用户
```
POST /api/users/{userId}/reject
```
需要管理员权限

## 权限控制

### 未登录用户
- 只能访问：`/login`、`/register`
- 其他页面会自动跳转到登录页

### 待审核用户
- 登录后自动跳转到 `/pending-approval` 页面
- 无法访问系统功能页面
- 需要等待管理员审核

### 已审核用户
- 可以正常使用系统所有功能
- 可以添加视频、查看数据分析等

### 审核未通过用户
- 登录后自动跳转到 `/account-rejected` 页面
- 无法使用系统功能
- 建议联系管理员

### 管理员
- 拥有所有已审核用户的权限
- 额外可以访问 `/admin/approvals` 页面进行用户审核

## 数据库表结构

### users 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(36) | 主键 |
| email | varchar(255) | 邮箱（唯一） |
| password | varchar(255) | 加密后的密码 |
| name | varchar(100) | 用户姓名 |
| role | varchar(20) | 角色（user/admin） |
| status | varchar(20) | 审核状态（pending/approved/rejected） |
| isActive | boolean | 是否激活 |
| createdAt | timestamp | 创建时间 |
| updatedAt | timestamp | 更新时间 |
| lastLoginAt | timestamp | 最后登录时间 |

## 安全特性

1. **密码加密**: 使用 bcryptjs 加密存储密码
2. **会话管理**: 使用 NextAuth.js 的 JWT 策略
3. **权限验证**: 所有 API 端点和页面都进行权限检查
4. **密码强度**: 要求密码至少 6 位
5. **唯一邮箱**: 确保邮箱地址唯一

## 修改管理员密码

方法一：通过数据库直接修改
```sql
-- 生成新的加密密码（使用 Node.js）
const bcrypt = require('bcryptjs');
const newPassword = await bcrypt.hash('新密码', 10);

-- 更新数据库
UPDATE users SET password = '新加密密码' WHERE email = 'admin@example.com';
```

方法二：重新运行创建脚本
```bash
npx tsx scripts/create-admin.ts
```

## 注意事项

1. **默认密码**: 管理员默认密码是 `admin123456`，请立即修改
2. **审核流程**: 新用户必须通过管理员审核才能使用系统
3. **密码安全**: 建议使用强密码，至少包含大小写字母、数字和特殊字符
4. **会话超时**: NextAuth.js 默认会话时长，可在 `src/lib/auth.ts` 中配置

## 故障排查

### 无法登录
- 检查邮箱和密码是否正确
- 确认账号状态是否为 approved
- 检查浏览器控制台是否有错误

### 注册失败
- 确认邮箱未被注册
- 检查密码长度是否 >= 6
- 查看浏览器控制台错误信息

### 管理员无法审核
- 确认登录的是管理员账号
- 检查 `users` 表中该用户的 `role` 是否为 `admin`
- 刷新页面重试

## 技术栈

- **认证**: NextAuth.js 4.24.13
- **密码加密**: bcryptjs 3.0.3
- **数据库**: PostgreSQL (Drizzle ORM)
- **会话**: JWT (JSON Web Token)

## 联系支持

如有问题，请联系系统管理员。
